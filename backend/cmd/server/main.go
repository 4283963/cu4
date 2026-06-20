package main

import (
	"log"
	"shrimp-farm-dt/backend/internal/handlers"
	"shrimp-farm-dt/backend/internal/models"
	"shrimp-farm-dt/backend/internal/simulator"
	"shrimp-farm-dt/backend/internal/ws"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	sim := simulator.NewSimulator()
	hub := ws.NewHub()

	sim.SetOnUpdate(func(data interface{}) {
		if sd, ok := data.(models.SensorData); ok {
			hub.Broadcast(sd)
		}
	})

	sim.Start()
	go hub.Run()

	h := handlers.NewHandler(sim, hub)

	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	api := r.Group("/api")
	{
		api.GET("/status", h.GetStatus)
		api.GET("/pool", h.GetPoolConfig)
		api.GET("/feeders", h.GetFeeders)
		api.GET("/water-quality", h.GetWaterQuality)
		api.GET("/coverage", h.GetCoverage)
		api.POST("/control", h.ControlFeeder)
	}

	r.GET("/ws", h.ServeWS)

	log.Println("Server starting on :8080")
	if err := r.Run(":8080"); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
