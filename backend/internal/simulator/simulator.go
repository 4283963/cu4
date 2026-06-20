package simulator

import (
	"math"
	"math/rand"
	"shrimp-farm-dt/backend/internal/models"
	"sync"
	"time"
)

type Simulator struct {
	mu           sync.RWMutex
	poolConfig   models.PoolConfig
	feeders      []models.Feeder
	waterQuality models.WaterQuality
	coverage     models.CoverageGrid
	coverageMap  map[string]float64
	ticker       *time.Ticker
	done         chan struct{}
	onUpdate     func(data interface{})
}

func NewSimulator() *Simulator {
	poolCfg := models.PoolConfig{
		Radius:      15.0,
		Height:      2.5,
		WaterHeight: 1.8,
		Center:      models.Vector3{X: 0, Y: 0, Z: 0},
	}

	feeders := []models.Feeder{
		{
			ID:          "feeder-1",
			Name:        "1号投喂车",
			TargetAngle: 0,
			Radius:      8.0,
			Speed:       0.3,
			FeedRate:    0.8,
			IsActive:    true,
			LastUpdate:  time.Now(),
		},
		{
			ID:          "feeder-2",
			Name:        "2号投喂车",
			TargetAngle: math.Pi,
			Radius:      7.0,
			Speed:       0.25,
			FeedRate:    0.6,
			IsActive:    true,
			LastUpdate:  time.Now(),
		},
	}

	wq := models.WaterQuality{
		DO:          6.5,
		Temperature: 28.0,
		PH:          7.8,
		Salinity:    25.0,
		FlowSpeed:   0.5,
		FlowAngle:   0,
		LastUpdate:  time.Now(),
	}

	resolution := 16
	points := make([]models.GridPoint, resolution*resolution)
	idx := 0
	for i := 0; i < resolution; i++ {
		for j := 0; j < resolution; j++ {
			angle := (float64(i) / float64(resolution)) * 2 * math.Pi
			r := (float64(j) / float64(resolution)) * poolCfg.Radius
			points[idx] = models.GridPoint{
				Position: models.Vector3{
					X: math.Cos(angle) * r,
					Y: 0.05,
					Z: math.Sin(angle) * r,
				},
				FeedLevel: 0,
				DOLevel:   6.5,
				Covered:   false,
			}
			idx++
		}
	}

	for i := range feeders {
		maxRadius := poolCfg.Radius - 1.5
		if feeders[i].Radius > maxRadius {
			feeders[i].Radius = maxRadius
		}
		if feeders[i].Radius < 1.0 {
			feeders[i].Radius = 1.0
		}
		feeders[i].Position = models.Vector3{
			X: math.Cos(feeders[i].TargetAngle) * feeders[i].Radius,
			Y: 1.2,
			Z: math.Sin(feeders[i].TargetAngle) * feeders[i].Radius,
		}
	}

	return &Simulator{
		poolConfig:   poolCfg,
		feeders:      feeders,
		waterQuality: wq,
		coverage: models.CoverageGrid{
			Resolution: resolution,
			Points:     points,
		},
		coverageMap: make(map[string]float64),
		done:        make(chan struct{}),
	}
}

func (s *Simulator) SetOnUpdate(fn func(data interface{})) {
	s.onUpdate = fn
}

func (s *Simulator) Start() {
	s.ticker = time.NewTicker(100 * time.Millisecond)
	go s.loop()
}

func (s *Simulator) Stop() {
	close(s.done)
	s.ticker.Stop()
}

func (s *Simulator) loop() {
	for {
		select {
		case <-s.done:
			return
		case <-s.ticker.C:
			s.update()
		}
	}
}

func (s *Simulator) update() {
	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now()

	for i := range s.feeders {
		if !s.feeders[i].IsActive {
			continue
		}
		f := &s.feeders[i]

		step := f.Speed * 0.05
		if step < 0 {
			step = -step
		}
		f.TargetAngle += step

		maxRadius := s.poolConfig.Radius - 1.5
		if f.Radius > maxRadius {
			f.Radius = maxRadius
		}
		if f.Radius < 1.0 {
			f.Radius = 1.0
		}

		f.Position.X = math.Cos(f.TargetAngle) * f.Radius
		f.Position.Z = math.Sin(f.TargetAngle) * f.Radius
		f.Position.Y = 1.2
		f.LastUpdate = now
	}

	s.waterQuality.FlowAngle += s.waterQuality.FlowSpeed * 0.02
	if s.waterQuality.FlowAngle > 2*math.Pi {
		s.waterQuality.FlowAngle -= 2 * math.Pi
	}

	s.waterQuality.DO += (rand.Float64() - 0.5) * 0.02
	s.waterQuality.DO = math.Max(4.0, math.Min(9.0, s.waterQuality.DO))
	s.waterQuality.Temperature += (rand.Float64() - 0.5) * 0.05
	s.waterQuality.Temperature = math.Max(24.0, math.Min(32.0, s.waterQuality.Temperature))
	s.waterQuality.PH += (rand.Float64() - 0.5) * 0.01
	s.waterQuality.PH = math.Max(7.0, math.Min(8.5, s.waterQuality.PH))
	s.waterQuality.LastUpdate = now

	for idx := range s.coverage.Points {
		p := &s.coverage.Points[idx]
		p.FeedLevel *= 0.99
		p.DOLevel = s.waterQuality.DO + (rand.Float64()-0.5)*0.3
		p.Covered = false

		for _, f := range s.feeders {
			if !f.IsActive {
				continue
			}
			dx := p.Position.X - f.Position.X
			dz := p.Position.Z - f.Position.Z
			dist := math.Sqrt(dx*dx + dz*dz)
			if dist < 3.0 {
				p.FeedLevel = math.Min(1.0, p.FeedLevel+f.FeedRate*(1.0-dist/3.0))
				p.Covered = true
			}
		}
	}

	if s.onUpdate != nil {
		s.onUpdate(s.GetData())
	}
}

func (s *Simulator) GetData() models.SensorData {
	s.mu.RLock()
	defer s.mu.RUnlock()

	feedersCopy := make([]models.Feeder, len(s.feeders))
	copy(feedersCopy, s.feeders)

	pointsCopy := make([]models.GridPoint, len(s.coverage.Points))
	copy(pointsCopy, s.coverage.Points)

	return models.SensorData{
		Timestamp:    time.Now(),
		Feeders:      feedersCopy,
		WaterQuality: s.waterQuality,
		Coverage: models.CoverageGrid{
			Resolution: s.coverage.Resolution,
			Points:     pointsCopy,
		},
		PoolConfig: s.poolConfig,
	}
}

func (s *Simulator) ControlFeeder(id string, param string, value float64) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	for i := range s.feeders {
		if s.feeders[i].ID == id {
			switch param {
			case "speed":
				s.feeders[i].Speed = math.Max(0, math.Min(2.0, value))
			case "feedRate":
				s.feeders[i].FeedRate = math.Max(0, math.Min(1.0, value))
			case "active":
				s.feeders[i].IsActive = value > 0.5
			}
			return true
		}
	}
	return false
}
