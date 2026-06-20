package ws

import (
	"encoding/json"
	"log"
	"net/http"
	"shrimp-farm-dt/backend/internal/models"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

const writeWait = 10 * time.Second

func writeDeadline() time.Time {
	return time.Now().Add(writeWait)
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type Hub struct {
	mu        sync.RWMutex
	clients   map[*Client]bool
	broadcast chan models.SensorData
}

type Client struct {
	hub  *Hub
	conn *websocket.Conn
	send chan []byte
}

func NewHub() *Hub {
	return &Hub{
		clients:   make(map[*Client]bool),
		broadcast: make(chan models.SensorData, 256),
	}
}

func (h *Hub) Broadcast(data models.SensorData) {
	select {
	case h.broadcast <- data:
	default:
	}
}

func (h *Hub) Run() {
	for data := range h.broadcast {
		payload, err := json.Marshal(data)
		if err != nil {
			log.Printf("ws: json marshal error: %v", err)
			continue
		}

		h.mu.RLock()
		for client := range h.clients {
			select {
			case client.send <- payload:
			default:
				go h.removeClient(client)
			}
		}
		h.mu.RUnlock()
	}
}

func (h *Hub) removeClient(client *Client) {
	h.mu.Lock()
	if _, ok := h.clients[client]; ok {
		delete(h.clients, client)
		close(client.send)
	}
	h.mu.Unlock()
}

func (h *Hub) ServeWS(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("ws: upgrade error: %v", err)
		return
	}

	client := &Client{
		hub:  h,
		conn: conn,
		send: make(chan []byte, 256),
	}

	h.mu.Lock()
	h.clients[client] = true
	h.mu.Unlock()

	go client.writePump()
	go client.readPump()
}

func (c *Client) readPump() {
	defer func() {
		c.hub.removeClient(c)
		c.conn.Close()
	}()

	for {
		_, _, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("ws: read error: %v", err)
			}
			break
		}
	}
}

func (c *Client) writePump() {
	defer c.conn.Close()

	for message := range c.send {
		c.conn.SetWriteDeadline(writeDeadline())
		if err := c.conn.WriteMessage(websocket.TextMessage, message); err != nil {
			return
		}
	}
	c.conn.WriteMessage(websocket.CloseMessage, []byte{})
}
