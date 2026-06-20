class WebSocketService {
  constructor(url) {
    this.ws = null;
    this.url = url;
    this.callbacks = new Set();
    this.reconnectTimer = null;
    this.reconnectDelay = 3000;
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = this.url.startsWith('ws') ? this.url : `${protocol}//${this.url}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[WS] Connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.callbacks.forEach((cb) => cb(data));
        } catch (e) {
          console.error('[WS] Parse error:', e);
        }
      };

      this.ws.onclose = () => {
        console.log('[WS] Disconnected, reconnecting...');
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('[WS] Error:', error);
      };
    } catch (e) {
      console.error('[WS] Connection failed:', e);
      this.scheduleReconnect();
    }
  }

  scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    this.reconnectTimer = window.setTimeout(() => {
      this.connect();
    }, this.reconnectDelay);
  }

  subscribe(callback) {
    this.callbacks.add(callback);
    if (this.ws?.readyState !== WebSocket.OPEN) {
      this.connect();
    }
    return () => {
      this.callbacks.delete(callback);
    };
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
  }
}

const wsService = new WebSocketService(
  import.meta.env.VITE_WS_URL || 'localhost:8080/ws'
);

export default wsService;
