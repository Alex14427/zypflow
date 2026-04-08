'use client';

import { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const CLINIC_LOCATIONS = [
  { name: 'Chelsea', lat: 51.4875, lng: -0.1687, type: 'london' as const },
  { name: 'Mayfair', lat: 51.5074, lng: -0.1478, type: 'london' as const },
  { name: 'Shoreditch', lat: 51.5265, lng: -0.0799, type: 'london' as const },
  { name: 'Notting Hill', lat: 51.5139, lng: -0.2057, type: 'london' as const },
  { name: 'Knightsbridge', lat: 51.5015, lng: -0.1607, type: 'london' as const },
  { name: 'Harley Street', lat: 51.5194, lng: -0.1468, type: 'london' as const },
  { name: 'Canary Wharf', lat: 51.5054, lng: -0.0235, type: 'london' as const },
  { name: 'Kensington', lat: 51.4990, lng: -0.1938, type: 'london' as const },
  { name: 'Manchester', lat: 53.4808, lng: -2.2426, type: 'regional' as const },
  { name: 'Birmingham', lat: 52.4862, lng: -1.8904, type: 'regional' as const },
  { name: 'Edinburgh', lat: 55.9533, lng: -3.1883, type: 'regional' as const },
  { name: 'Bristol', lat: 51.4545, lng: -2.5879, type: 'regional' as const },
  { name: 'Leeds', lat: 53.8008, lng: -1.5491, type: 'regional' as const },
  { name: 'Glasgow', lat: 55.8642, lng: -4.2518, type: 'regional' as const },
];

const ARC_CONNECTIONS = [
  [0, 8], [1, 10], [5, 9], [2, 11], [3, 12], [6, 13],
  [0, 5], [1, 7], [2, 6], [4, 3],
];

const GLOBE_RADIUS = 1.6;

function latLngToVec3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

function generateGlobePoints(count: number, radius: number): Float32Array {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    let lat: number, lng: number;
    if (i < count * 0.35) {
      lat = 48 + Math.random() * 12;
      lng = -10 + Math.random() * 13;
    } else if (i < count * 0.5) {
      lat = 35 + Math.random() * 30;
      lng = -15 + Math.random() * 40;
    } else {
      lat = Math.acos(2 * Math.random() - 1) * (180 / Math.PI) - 90;
      lng = Math.random() * 360 - 180;
    }
    const r = radius + (Math.random() - 0.5) * 0.015;
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    positions[i * 3] = -r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.cos(phi);
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  return positions;
}

function GlobeField({ isLight }: { isLight: boolean }) {
  const pointsRef = useRef<THREE.Points>(null);
  const positions = useMemo(() => generateGlobePoints(2500, GLOBE_RADIUS), []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.03;
    }
  });

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [positions]);

  const material = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: isLight ? '#1a1a2e' : '#d26645',
        size: 0.006,
        sizeAttenuation: true,
        transparent: true,
        opacity: isLight ? 0.35 : 0.45,
        depthWrite: false,
      }),
    [isLight],
  );

  return <points ref={pointsRef} geometry={geometry} material={material} />;
}

function ClinicMarkers({ onHover, isLight }: { onHover: (name: string | null, x: number, y: number) => void; isLight: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const pulseMaterials = useRef<THREE.MeshBasicMaterial[]>([]);
  const { camera, gl } = useThree();

  const markerData = useMemo(
    () =>
      CLINIC_LOCATIONS.map((loc) => ({
        position: latLngToVec3(loc.lat, loc.lng, GLOBE_RADIUS + 0.008),
        isLondon: loc.type === 'london',
        name: loc.name,
      })),
    [],
  );

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.03;
    }
    pulseMaterials.current.forEach((mat, i) => {
      const phase = state.clock.elapsedTime * 1.5 + i * 0.4;
      mat.opacity = 0.5 + Math.sin(phase) * 0.3;
    });
  });

  const londonColor = isLight ? '#b84f31' : '#d26645';
  const regionColor = isLight ? '#7c3aed' : '#a855f7';

  return (
    <group ref={groupRef}>
      {markerData.map((marker, i) => {
        if (!pulseMaterials.current[i]) {
          pulseMaterials.current[i] = new THREE.MeshBasicMaterial({
            color: marker.isLondon ? londonColor : regionColor,
            transparent: true,
            opacity: 0.7,
            depthWrite: false,
          });
        }

        return (
          <mesh
            key={i}
            position={marker.position}
            material={pulseMaterials.current[i]}
            onPointerOver={(e) => {
              e.stopPropagation();
              gl.domElement.style.cursor = 'pointer';
              const projected = marker.position.clone().project(camera);
              const x = (projected.x * 0.5 + 0.5) * gl.domElement.clientWidth;
              const y = (-projected.y * 0.5 + 0.5) * gl.domElement.clientHeight;
              onHover(marker.name, x, y);
            }}
            onPointerOut={() => {
              gl.domElement.style.cursor = 'grab';
              onHover(null, 0, 0);
            }}
          >
            <sphereGeometry args={[marker.isLondon ? 0.022 : 0.014, 12, 12]} />
          </mesh>
        );
      })}
    </group>
  );
}

function DataArcs({ isLight }: { isLight: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  const arcGeometries = useMemo(() => {
    return ARC_CONNECTIONS.map(([fromIdx, toIdx]) => {
      const from = CLINIC_LOCATIONS[fromIdx];
      const to = CLINIC_LOCATIONS[toIdx];
      const start = latLngToVec3(from.lat, from.lng, GLOBE_RADIUS);
      const end = latLngToVec3(to.lat, to.lng, GLOBE_RADIUS);
      const distance = start.distanceTo(end);
      const arcHeight = GLOBE_RADIUS + distance * 0.25;
      const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
      mid.normalize().multiplyScalar(arcHeight);
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const isInternal = fromIdx < 8 && toIdx < 8;
      return {
        geometry: new THREE.TubeGeometry(curve, 32, 0.003, 4, false),
        isInternal,
      };
    });
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.03;
    }
  });

  const primaryColor = isLight ? '#b84f31' : '#d26645';
  const accentColor = isLight ? '#7c3aed' : '#a855f7';

  return (
    <group ref={groupRef}>
      {arcGeometries.map(({ geometry, isInternal }, i) => (
        <mesh key={i} geometry={geometry}>
          <meshBasicMaterial
            color={isInternal ? primaryColor : accentColor}
            transparent
            opacity={isInternal ? 0.35 : 0.2}
          />
        </mesh>
      ))}
    </group>
  );
}

function AtmosphereRing({ isLight }: { isLight: boolean }) {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.x = Math.PI / 2.1 + Math.sin(state.clock.elapsedTime * 0.15) * 0.03;
      ringRef.current.rotation.z = state.clock.elapsedTime * 0.01;
    }
  });

  return (
    <mesh ref={ringRef}>
      <torusGeometry args={[GLOBE_RADIUS + 0.25, 0.002, 16, 120]} />
      <meshBasicMaterial color={isLight ? '#b84f31' : '#d26645'} transparent opacity={isLight ? 0.15 : 0.1} />
    </mesh>
  );
}

function ScrollCamera() {
  const { camera } = useThree();
  const progressRef = useRef(0);

  useEffect(() => {
    camera.position.set(0, 0.3, 4.2);
    function onScroll() {
      const section = document.getElementById('globe-section');
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const sectionHeight = section.offsetHeight - window.innerHeight;
      const rawProgress = Math.max(0, Math.min(1, -rect.top / sectionHeight));
      progressRef.current = rawProgress;
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [camera]);

  useFrame(() => {
    const p = progressRef.current;
    const zoomProgress = Math.min(p / 0.65, 1);
    const eased = 1 - Math.pow(1 - zoomProgress, 3);
    camera.position.z = 4.2 - eased * 3.6;
    camera.position.y = 0.3 + eased * 0.15;
    camera.position.x = eased * -0.2;

    const canvasEl = document.getElementById('globe-canvas');
    if (canvasEl) {
      canvasEl.style.opacity = p > 0.65 ? String(Math.max(0, 1 - (p - 0.65) / 0.3)) : '1';
    }
  });

  return null;
}

export function GlobeScene() {
  const [tooltip, setTooltip] = useState<{ name: string; x: number; y: number } | null>(null);
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    const check = () => setIsLight(document.documentElement.classList.contains('light'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const handleHover = useCallback((name: string | null, x: number, y: number) => {
    setTooltip(name ? { name, x, y } : null);
  }, []);

  return (
    <div id="globe-canvas" className="h-full w-full relative">
      <Canvas
        camera={{ position: [0, 0.3, 4.2], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent', cursor: 'grab' }}
      >
        <ambientLight intensity={isLight ? 0.6 : 0.4} />
        <GlobeField isLight={isLight} />
        <ClinicMarkers onHover={handleHover} isLight={isLight} />
        <DataArcs isLight={isLight} />
        <AtmosphereRing isLight={isLight} />
        <ScrollCamera />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          rotateSpeed={0.4}
          autoRotate
          autoRotateSpeed={0.3}
        />
      </Canvas>

      {tooltip && (
        <div
          className="pointer-events-none absolute z-50 rounded-lg border border-brand-purple/30 bg-[var(--app-bg)]/90 px-3 py-1.5 text-xs font-semibold text-brand-purple backdrop-blur-sm shadow-lg transition-opacity"
          style={{ left: tooltip.x, top: tooltip.y - 36, transform: 'translateX(-50%)' }}
        >
          {tooltip.name}
          <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-brand-purple/30" />
        </div>
      )}
    </div>
  );
}
