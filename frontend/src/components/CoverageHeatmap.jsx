import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const CUMULATIVE_MAX = 80;

export default function CoverageHeatmap({ coverage, baseHeight, waterHeight, visible = true }) {
  const meshRef = useRef(null);
  const groupRef = useRef(null);
  const targetOpacity = useRef(0);
  const currentOpacity = useRef(0);
  const poolRadius = 15;

  const { geometry, material } = useMemo(() => {
    const resolution = coverage?.resolution || 16;
    const points = coverage?.points || [];

    const geo = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    const uvs = [];
    const baseY = baseHeight + waterHeight * 0.08;

    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        const idx = i * resolution + j;
        const point = points[idx];
        if (!point) continue;

        const angle1 = (i / resolution) * Math.PI * 2;
        const angle2 = ((i + 1) / resolution) * Math.PI * 2;
        const r1 = (j / resolution) * poolRadius;
        const r2 = ((j + 1) / resolution) * poolRadius;

        const x1a = Math.cos(angle1) * r1;
        const z1a = Math.sin(angle1) * r1;
        const x2a = Math.cos(angle2) * r1;
        const z2a = Math.sin(angle2) * r1;
        const x1b = Math.cos(angle1) * r2;
        const z1b = Math.sin(angle1) * r2;
        const x2b = Math.cos(angle2) * r2;
        const z2b = Math.sin(angle2) * r2;

        positions.push(
          x1a, baseY, z1a,
          x2a, baseY, z2a,
          x2b, baseY, z2b
        );
        positions.push(
          x1a, baseY, z1a,
          x2b, baseY, z2b,
          x1b, baseY, z1b
        );

        const color = getHeatColor(point.cumulativeFeed || 0);
        for (let k = 0; k < 6; k++) {
          colors.push(color.r, color.g, color.b);
        }

        const u = i / resolution;
        const v1 = j / resolution;
        const v2 = (j + 1) / resolution;
        uvs.push(u, v1, (i + 1) / resolution, v1, (i + 1) / resolution, v2);
        uvs.push(u, v1, (i + 1) / resolution, v2, u, v2);
      }
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
      metalness: 0.1,
      roughness: 0.6,
    });

    return { geometry: geo, material: mat };
  }, [coverage, baseHeight, waterHeight, poolRadius]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    if (!groupRef.current) return;

    targetOpacity.current = visible ? 0.75 : 0;
    const diff = targetOpacity.current - currentOpacity.current;
    if (Math.abs(diff) > 0.001) {
      currentOpacity.current += diff * Math.min(1, delta * 4);
      material.opacity = currentOpacity.current;
      groupRef.current.visible = currentOpacity.current > 0.01;
    }

    if (coverage && visible) {
      const positions = geometry.attributes.position;
      const colors = geometry.attributes.color;
      const points = coverage.points;
      const resolution = coverage.resolution;
      const baseY = baseHeight + waterHeight * 0.08;

      let vertexIdx = 0;
      for (let i = 0; i < resolution; i++) {
        for (let j = 0; j < resolution; j++) {
          const idx = i * resolution + j;
          const point = points[idx];
          if (!point) continue;

          const cumVal = point.cumulativeFeed || 0;
          const t = Math.min(1, cumVal / CUMULATIVE_MAX);
          const heightBoost = t * 0.6;

          const angle1 = (i / resolution) * Math.PI * 2;
          const angle2 = ((i + 1) / resolution) * Math.PI * 2;
          const r1 = (j / resolution) * poolRadius;
          const r2 = ((j + 1) / resolution) * poolRadius;

          const y1 = baseY + Math.sin(angle1 * 3 + state.clock.elapsedTime * 0.2) * 0.02 + heightBoost * 0.3;
          const y2 = baseY + Math.sin(angle2 * 3 + state.clock.elapsedTime * 0.2) * 0.02 + heightBoost * 0.3;

          positions.setXYZ(vertexIdx, Math.cos(angle1) * r1, y1, Math.sin(angle1) * r1);
          positions.setXYZ(vertexIdx + 1, Math.cos(angle2) * r1, y2, Math.sin(angle2) * r1);
          positions.setXYZ(vertexIdx + 2, Math.cos(angle2) * r2, y2, Math.sin(angle2) * r2);
          positions.setXYZ(vertexIdx + 3, Math.cos(angle1) * r1, y1, Math.sin(angle1) * r1);
          positions.setXYZ(vertexIdx + 4, Math.cos(angle2) * r2, y2, Math.sin(angle2) * r2);
          positions.setXYZ(vertexIdx + 5, Math.cos(angle1) * r2, y1, Math.sin(angle1) * r2);

          const color = getHeatColor(cumVal);
          for (let k = 0; k < 6; k++) {
            colors.setXYZ(vertexIdx + k, color.r, color.g, color.b);
          }

          vertexIdx += 6;
        }
      }

      positions.needsUpdate = true;
      colors.needsUpdate = true;
      geometry.computeVertexNormals();
    }
  });

  return (
    <group ref={groupRef} visible={visible}>
      <mesh ref={meshRef} geometry={geometry} material={material} />
      
      {/* 高光边缘环 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, baseHeight + waterHeight * 0.1, 0]}>
        <ringGeometry args={[poolRadius - 0.3, poolRadius - 0.1, 64]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={visible ? 0.3 : 0} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function getHeatColor(cumulativeFeed) {
  const t = Math.min(1, Math.max(0, cumulativeFeed / CUMULATIVE_MAX));

  if (t < 0.001) {
    return new THREE.Color(0.08, 0.12, 0.3);
  }

  if (t < 0.2) {
    const k = t / 0.2;
    return new THREE.Color().lerpColors(
      new THREE.Color(0x1e40af),
      new THREE.Color(0x0ea5e9),
      k
    );
  } else if (t < 0.4) {
    const k = (t - 0.2) / 0.2;
    return new THREE.Color().lerpColors(
      new THREE.Color(0x0ea5e9),
      new THREE.Color(0x22c55e),
      k
    );
  } else if (t < 0.6) {
    const k = (t - 0.4) / 0.2;
    return new THREE.Color().lerpColors(
      new THREE.Color(0x22c55e),
      new THREE.Color(0xfcd34d),
      k
    );
  } else if (t < 0.8) {
    const k = (t - 0.6) / 0.2;
    return new THREE.Color().lerpColors(
      new THREE.Color(0xfcd34d),
      new THREE.Color(0xf97316),
      k
    );
  } else {
    const k = (t - 0.8) / 0.2;
    return new THREE.Color().lerpColors(
      new THREE.Color(0xf97316),
      new THREE.Color(0xdc2626),
      k
    );
  }
}
