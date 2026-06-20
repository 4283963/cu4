import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { Suspense } from 'react';
import Pool from './Pool';
import FeederVehicle from './FeederVehicle';
import CoverageHeatmap from './CoverageHeatmap';

export default function Scene({ sensorData }) {
  const poolConfig = sensorData?.poolConfig;
  const feeders = sensorData?.feeders || [];
  const waterQuality = sensorData?.waterQuality;
  const coverage = sensorData?.coverage;

  const radius = poolConfig?.radius || 15;
  const height = poolConfig?.height || 2.5;
  const waterHeight = poolConfig?.waterHeight || 1.8;
  const baseHeight = 0.4;

  return (
    <div className="w-full h-full">
      <Canvas
        shadows
        camera={{ position: [25, 18, 25], fov: 50 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={['#0f172a']} />
        <fog attach="fog" args={['#0f172a', 40, 80]} />

        <ambientLight intensity={0.4} />
        <directionalLight
          position={[15, 20, 10]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-10, 10, -10]} intensity={0.5} color="#06b6d4" />
        <pointLight position={[10, 5, 10]} intensity={0.3} color="#22c55e" />

        <Suspense fallback={null}>
          <Pool
            radius={radius}
            height={height}
            waterHeight={waterHeight}
            flowAngle={waterQuality?.flowAngle || 0}
            flowSpeed={waterQuality?.flowSpeed || 0.5}
          />

          {coverage && (
            <CoverageHeatmap
              coverage={coverage}
              baseHeight={baseHeight}
              waterHeight={waterHeight}
            />
          )}

          {feeders.map((feeder) => (
            <FeederVehicle key={feeder.id} feeder={feeder} baseHeight={baseHeight} />
          ))}

          <ContactShadows
            position={[0, -0.1, 0]}
            opacity={0.4}
            scale={50}
            blur={2}
            far={10}
          />

          <Environment preset="night" />
        </Suspense>

        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={10}
          maxDistance={50}
          maxPolarAngle={Math.PI / 2.1}
          minPolarAngle={0.1}
        />
      </Canvas>
    </div>
  );
}
