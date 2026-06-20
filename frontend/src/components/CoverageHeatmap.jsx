import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function CoverageHeatmap({ coverage, baseHeight, waterHeight }) {
  const meshRef = useRef(null);

  const { geometry, material } = useMemo(() => {
    const resolution = coverage?.resolution || 20;
    const points = coverage?.points || [];

    const geo = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];

    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        const idx = i * resolution + j;
        const point = points[idx];
        if (!point) continue;

        const angle1 = (i / resolution) * Math.PI * 2;
        const angle2 = ((i + 1) / resolution) * Math.PI * 2;
        const r1 = (j / resolution) * 15;
        const r2 = ((j + 1) / resolution) * 15;

        const x1a = Math.cos(angle1) * r1;
        const z1a = Math.sin(angle1) * r1;
        const x2a = Math.cos(angle2) * r1;
        const z2a = Math.sin(angle2) * r1;
        const x1b = Math.cos(angle1) * r2;
        const z1b = Math.sin(angle1) * r2;
        const x2b = Math.cos(angle2) * r2;
        const z2b = Math.sin(angle2) * r2;

        positions.push(
          x1a, baseHeight + waterHeight * 0.05, z1a,
          x2a, baseHeight + waterHeight * 0.05, z2a,
          x2b, baseHeight + waterHeight * 0.05, z2b
        );
        positions.push(
          x1a, baseHeight + waterHeight * 0.05, z1a,
          x2b, baseHeight + waterHeight * 0.05, z2b,
          x1b, baseHeight + waterHeight * 0.05, z1b
        );

        const color = getHeatColor(point.feedLevel, point.covered);
        for (let k = 0; k < 6; k++) {
          colors.push(color.r, color.g, color.b);
        }
      }
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
    });

    return { geometry: geo, material: mat };
  }, [coverage, baseHeight, waterHeight]);

  useFrame(() => {
    if (meshRef.current && coverage) {
      const colors = meshRef.current.geometry.attributes.color;
      const points = coverage.points;
      const resolution = coverage.resolution;

      let vertexIdx = 0;
      for (let i = 0; i < resolution; i++) {
        for (let j = 0; j < resolution; j++) {
          const idx = i * resolution + j;
          const point = points[idx];
          if (!point) continue;

          const color = getHeatColor(point.feedLevel, point.covered);
          for (let k = 0; k < 6; k++) {
            colors.setXYZ(vertexIdx, color.r, color.g, color.b);
            vertexIdx++;
          }
        }
      }
      colors.needsUpdate = true;
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry} material={material} />
  );
}

function getHeatColor(feedLevel, covered) {
  if (feedLevel <= 0.01) {
    return new THREE.Color(0.1, 0.1, 0.3);
  }

  const clampedLevel = Math.min(1, Math.max(0, feedLevel));

  if (clampedLevel < 0.33) {
    const t = clampedLevel / 0.33;
    return new THREE.Color().lerpColors(
      new THREE.Color(0x0ea5e9),
      new THREE.Color(0x22c55e),
      t
    );
  } else if (clampedLevel < 0.66) {
    const t = (clampedLevel - 0.33) / 0.33;
    return new THREE.Color().lerpColors(
      new THREE.Color(0x22c55e),
      new THREE.Color(0xfcd34d),
      t
    );
  } else {
    const t = (clampedLevel - 0.66) / 0.34;
    return new THREE.Color().lerpColors(
      new THREE.Color(0xfcd34d),
      new THREE.Color(0xef4444),
      t
    );
  }
}
