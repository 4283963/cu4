package handlers

import (
	"net/http"
	"shrimp-farm-dt/backend/internal/models"
	"shrimp-farm-dt/backend/internal/simulator"
	"shrimp-farm-dt/backend/internal/ws"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	sim *simulator.Simulator
	hub *ws.Hub
}

func NewHandler(sim *simulator.Simulator, hub *ws.Hub) *Handler {
	return &Handler{sim: sim, hub: hub}
}

func (h *Handler) GetStatus(c *gin.Context) {
	c.JSON(http.StatusOK, h.sim.GetData())
}

func (h *Handler) GetPoolConfig(c *gin.Context) {
	data := h.sim.GetData()
	c.JSON(http.StatusOK, data.PoolConfig)
}

func (h *Handler) GetFeeders(c *gin.Context) {
	data := h.sim.GetData()
	c.JSON(http.StatusOK, data.Feeders)
}

func (h *Handler) GetWaterQuality(c *gin.Context) {
	data := h.sim.GetData()
	c.JSON(http.StatusOK, data.WaterQuality)
}

func (h *Handler) GetCoverage(c *gin.Context) {
	data := h.sim.GetData()
	c.JSON(http.StatusOK, data.Coverage)
}

func (h *Handler) ControlFeeder(c *gin.Context) {
	var cmd models.ControlCommand
	if err := c.ShouldBindJSON(&cmd); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if cmd.Type != "feeder" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "unsupported command type"})
		return
	}

	if ok := h.sim.ControlFeeder(cmd.FeederID, cmd.Parameter, cmd.Value); ok {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	} else {
		c.JSON(http.StatusNotFound, gin.H{"error": "feeder not found"})
	}
}

func (h *Handler) ServeWS(c *gin.Context) {
	h.hub.ServeWS(c.Writer, c.Request)
}
