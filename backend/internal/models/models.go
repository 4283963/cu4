package models

import "time"

type Vector3 struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
	Z float64 `json:"z"`
}

type Feeder struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Position    Vector3   `json:"position"`
	TargetAngle float64   `json:"targetAngle"`
	Radius      float64   `json:"radius"`
	Speed       float64   `json:"speed"`
	FeedRate    float64   `json:"feedRate"`
	IsActive    bool      `json:"isActive"`
	LastUpdate  time.Time `json:"lastUpdate"`
}

type WaterQuality struct {
	DO          float64   `json:"dissolvedOxygen"`
	Temperature float64   `json:"temperature"`
	PH          float64   `json:"ph"`
	Salinity    float64   `json:"salinity"`
	FlowSpeed   float64   `json:"flowSpeed"`
	FlowAngle   float64   `json:"flowAngle"`
	LastUpdate  time.Time `json:"lastUpdate"`
}

type CoverageGrid struct {
	Resolution int         `json:"resolution"`
	Points     []GridPoint `json:"points"`
}

type GridPoint struct {
	Position        Vector3 `json:"position"`
	FeedLevel       float64 `json:"feedLevel"`
	CumulativeFeed  float64 `json:"cumulativeFeed"`
	DOLevel         float64 `json:"doLevel"`
	Covered         bool    `json:"covered"`
}

type PoolConfig struct {
	Radius      float64 `json:"radius"`
	Height      float64 `json:"height"`
	WaterHeight float64 `json:"waterHeight"`
	Center      Vector3 `json:"center"`
}

type SensorData struct {
	Timestamp    time.Time   `json:"timestamp"`
	Feeders      []Feeder    `json:"feeders"`
	WaterQuality WaterQuality `json:"waterQuality"`
	Coverage     CoverageGrid `json:"coverage"`
	PoolConfig   PoolConfig   `json:"poolConfig"`
}

type ControlCommand struct {
	Type      string  `json:"type"`
	FeederID  string  `json:"feederId,omitempty"`
	Parameter string  `json:"parameter,omitempty"`
	Value     float64 `json:"value,omitempty"`
}
