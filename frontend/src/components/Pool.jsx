import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function Pool({ radius, height, waterHeight, flowAngle, flowSpeed }) {
  const waterRef = useRef(null);
  const innerWallRef = useRef(null);

  const waterMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
      metalness: 0.3,
      roughness: 0.2,
    });
  }, []);

  useFrame((state) => {
    if (waterRef.current) {
      const t = state.clock.elapsedTime;
      waterRef.current.position.y = waterHeight / 2 + Math.sin(t * flowSpeed * 2) * 0.02;
    }
  });

  const wallThickness = 0.3;
  const baseHeight = 0.4;

  return (
    <group position={[0, 0, 0]}>
      {/* 池底 */}
      <mesh position={[0, baseHeight / 2, 0]} receiveShadow>
        <cylinderGeometry args={[radius + wallThickness, radius + wallThickness, baseHeight, 64]} />
        <meshStandardMaterial color="#374151" roughness={0.8} />
      </mesh>

      {/* 池壁外环 */}
      <mesh position={[0, height / 2 + baseHeight, 0]} receiveShadow>
        <cylinderGeometry
          args={[radius + wallThickness, radius + wallThickness, height, 64, 1, true]}
        />
        <meshStandardMaterial color="#4b5563" roughness={0.7} side={THREE.DoubleSide} />
      </mesh>

      {/* 池壁内环 */}
      <mesh ref={innerWallRef} position={[0, height / 2 + baseHeight, 0]}>
        <cylinderGeometry args={[radius, radius, height, 64, 1, true]} />
        <meshStandardMaterial
          color="#1e3a5f"
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 水面 */}
      <mesh ref={waterRef} position={[0, baseHeight + waterHeight / 2, 0]}>
        <cylinderGeometry args={[radius - 0.1, radius - 0.1, waterHeight, 64]} />
        <primitive object={waterMaterial} attach="material" />
      </mesh>

      {/* 水面涟漪线 */}
      <WaterRipples radius={radius - 0.2} y={baseHeight + waterHeight + 0.01} flowSpeed={flowSpeed} />

      {/* 池口边缘 */}
      <mesh position={[0, baseHeight + height, 0]} receiveShadow>
        <torusGeometry args={[radius + wallThickness / 2, wallThickness / 2, 16, 64]} />
        <meshStandardMaterial color="#6b7280" roughness={0.6} />
      </mesh>

      {/* 底部网格标记 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, baseHeight + 0.01, 0]}>
        <ringGeometry args={[0, radius - 0.1, 64]} />
        <meshBasicMaterial color="#0f172a" transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>

      {/* 同心圆标记 */}
      {[1, 2, 3].map((i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, baseHeight + 0.02, 0]}>
          <ringGeometry args={[(radius * i) / 4 - 0.02, (radius * i) / 4 + 0.02, 64]} />
          <meshBasicMaterial color="#06b6d4" transparent opacity={0.3} />
        </mesh>
      ))}

      {/* 方向指示 - 入水口 */}
      <mesh position={[radius + 0.5, baseHeight + 0.3, 0]}>
        <boxGeometry args={[0.8, 0.6, 0.4]} />
        <meshStandardMaterial color="#16a34a" />
      </mesh>

      {/* 方向指示 - 出水口 */}
      <mesh position={[-radius - 0.5, baseHeight + 0.3, 0]}>
        <boxGeometry args={[0.8, 0.6, 0.4]} />
        <meshStandardMaterial color="#dc2626" />
      </mesh>
    </group>
  );
}

function WaterRipples({ radius, y, flowSpeed }) {
  const ringsRef = useRef(null);

  useFrame((state) => {
    if (ringsRef.current) {
      ringsRef.current.rotation.y = state.clock.elapsedTime * flowSpeed * 0.3;
    }
  });

  return (
    <group ref={ringsRef} position={[0, y, 0]}>
      {[0.3, 0.5, 0.7, 0.85].map((factor, idx) => (
        <mesh key={idx} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius * factor - 0.01, radius * factor + 0.01, 64]} />
          <meshBasicMaterial color="#67e8f9" transparent opacity={0.15} />
        </mesh>
      ))}
    </group>
  );
}
