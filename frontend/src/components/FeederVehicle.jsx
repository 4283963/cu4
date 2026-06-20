import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const POOL_RADIUS = 15.0;
const SAFE_MARGIN = 1.2;
const MAX_SAFE_RADIUS = POOL_RADIUS - SAFE_MARGIN;

export default function FeederVehicle({ feeder, baseHeight }) {
  const groupRef = useRef(null);
  const propellerRef = useRef(null);
  const trailRef = useRef(null);
  const trailPositions = useRef(null);
  const trailColors = useRef(null);
  const trailIndex = useRef(0);
  const smoothedRotationRef = useRef(0);
  const targetYRef = useRef(baseHeight + 1.2);

  const maxTrailPoints = 200;

  const trailGeometry = useMemo(() => {
    const positions = new Float32Array(maxTrailPoints * 3);
    const colors = new Float32Array(maxTrailPoints * 3);
    trailPositions.current = positions;
    trailColors.current = colors;

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geom.setDrawRange(0, 0);
    return geom;
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    if (!feeder) return;

    const targetX = feeder.position.x;
    const targetZ = feeder.position.z;
    targetYRef.current = baseHeight + feeder.position.y;

    groupRef.current.position.x = THREE.MathUtils.lerp(
      groupRef.current.position.x,
      targetX,
      0.12
    );
    groupRef.current.position.z = THREE.MathUtils.lerp(
      groupRef.current.position.z,
      targetZ,
      0.12
    );
    groupRef.current.position.y = THREE.MathUtils.lerp(
      groupRef.current.position.y,
      targetYRef.current,
      0.08
    );

    const currentX = groupRef.current.position.x;
    const currentZ = groupRef.current.position.z;
    const currentR = Math.sqrt(currentX * currentX + currentZ * currentZ);

    if (currentR > MAX_SAFE_RADIUS && currentR > 0.0001) {
      const clampRatio = MAX_SAFE_RADIUS / currentR;
      groupRef.current.position.x = currentX * clampRatio;
      groupRef.current.position.z = currentZ * clampRatio;
    } else if (currentR < 0.5 && currentR > 0.0001) {
      const clampRatio = 0.5 / currentR;
      groupRef.current.position.x = currentX * clampRatio;
      groupRef.current.position.z = currentZ * clampRatio;
    }

    let desiredYaw;
    if (feeder.speed > 0.01 && typeof feeder.targetAngle === 'number') {
      desiredYaw = feeder.targetAngle + Math.PI / 2;
    } else {
      const dx = targetX - groupRef.current.position.x;
      const dz = targetZ - groupRef.current.position.z;
      const distSq = dx * dx + dz * dz;
      if (distSq > 0.0001) {
        desiredYaw = Math.atan2(dz, dx) + Math.PI / 2;
      } else {
        desiredYaw = smoothedRotationRef.current;
      }
    }

    let deltaAngle = desiredYaw - smoothedRotationRef.current;
    while (deltaAngle > Math.PI) deltaAngle -= 2 * Math.PI;
    while (deltaAngle < -Math.PI) deltaAngle += 2 * Math.PI;

    const lerpFactor = Math.min(1, delta * 8);
    smoothedRotationRef.current += deltaAngle * lerpFactor;

    let normRot = smoothedRotationRef.current;
    while (normRot > Math.PI) normRot -= 2 * Math.PI;
    while (normRot < -Math.PI) normRot += 2 * Math.PI;
    smoothedRotationRef.current = normRot;

    groupRef.current.rotation.y = smoothedRotationRef.current;

    if (trailPositions.current && trailColors.current && feeder.isActive) {
      const idx = trailIndex.current % maxTrailPoints;
      trailPositions.current[idx * 3] = groupRef.current.position.x;
      trailPositions.current[idx * 3 + 1] = targetYRef.current - 0.3;
      trailPositions.current[idx * 3 + 2] = groupRef.current.position.z;

      const color = new THREE.Color(feeder.id === 'feeder-1' ? 0x22c55e : 0xf59e0b);
      trailColors.current[idx * 3] = color.r;
      trailColors.current[idx * 3 + 1] = color.g;
      trailColors.current[idx * 3 + 2] = color.b;

      trailIndex.current++;

      const drawCount = Math.min(trailIndex.current, maxTrailPoints);
      trailGeometry.setDrawRange(0, drawCount);
      trailGeometry.attributes.position.needsUpdate = true;
      trailGeometry.attributes.color.needsUpdate = true;
    }

    if (propellerRef.current && feeder.isActive) {
      propellerRef.current.rotation.y += feeder.speed * 0.5;
    }
  });

  const bodyColor = feeder.id === 'feeder-1' ? '#22c55e' : '#f59e0b';

  return (
    <>
      <group ref={groupRef} visible={feeder.isActive}>
        {/* 浮筒底座 */}
        <group position={[0, 0, 0]}>
          {/* 左浮筒 */}
          <mesh position={[-0.35, -0.15, 0]} castShadow>
            <capsuleGeometry args={[0.12, 0.8, 8, 16]} />
            <meshStandardMaterial color="#e5e7eb" metalness={0.3} roughness={0.4} />
          </mesh>
          {/* 右浮筒 */}
          <mesh position={[0.35, -0.15, 0]} castShadow>
            <capsuleGeometry args={[0.12, 0.8, 8, 16]} />
            <meshStandardMaterial color="#e5e7eb" metalness={0.3} roughness={0.4} />
          </mesh>
        </group>

        {/* 主体 */}
        <mesh position={[0, 0.15, 0]} castShadow>
          <boxGeometry args={[0.6, 0.25, 1.0]} />
          <meshStandardMaterial color={bodyColor} metalness={0.4} roughness={0.3} />
        </mesh>

        {/* 料斗 */}
        <mesh position={[0, 0.4, 0]} castShadow>
          <coneGeometry args={[0.25, 0.5, 16]} />
          <meshStandardMaterial color="#374151" metalness={0.5} roughness={0.3} />
        </mesh>

        {/* 投料口 */}
        <mesh position={[0, 0.65, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.15, 0.1, 16]} />
          <meshStandardMaterial color="#1f2937" />
        </mesh>

        {/* 螺旋桨 */}
        <group ref={propellerRef} position={[0, -0.1, -0.6]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.06, 0.2, 4]} />
            <meshStandardMaterial color="#1e293b" metalness={0.6} />
          </mesh>
        </group>

        {/* 指示灯 */}
        <mesh position={[0, 0.75, 0]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshBasicMaterial color={feeder.isActive ? '#22c55e' : '#ef4444'} />
        </mesh>

        {/* 投料效果 */}
        {feeder.isActive && <FeedEffect feedRate={feeder.feedRate} />}
      </group>

      <points ref={trailRef} geometry={trailGeometry}>
        <pointsMaterial size={0.08} vertexColors transparent opacity={0.6} sizeAttenuation />
      </points>
    </>
  );
}

function FeedEffect({ feedRate }) {
  const particlesRef = useRef(null);
  const particleCount = 50;

  const particles = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 0.2;
      positions[i * 3 + 1] = 0.55;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
      velocities.push({
        x: (Math.random() - 0.5) * 0.02,
        y: -Math.random() * 0.03 - 0.01,
        z: (Math.random() - 0.5) * 0.02,
      });
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return { geom, velocities };
  }, []);

  useFrame(() => {
    if (!particlesRef.current) return;
    const positions = particles.geom.attributes.position.array;

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] += particles.velocities[i].x * feedRate;
      positions[i * 3 + 1] += particles.velocities[i].y * feedRate;
      positions[i * 3 + 2] += particles.velocities[i].z * feedRate;

      if (positions[i * 3 + 1] < -0.5) {
        positions[i * 3] = (Math.random() - 0.5) * 0.2;
        positions[i * 3 + 1] = 0.55;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
      }
    }

    particles.geom.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={particlesRef} geometry={particles.geom}>
      <pointsMaterial size={0.03} color="#fcd34d" transparent opacity={0.8} />
    </points>
  );
}
