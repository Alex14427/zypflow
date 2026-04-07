'use client';

import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// ─── UK clinic locations (lat, lng) ──────────────────────────────
const CLINIC_LOCATIONS = [
  { name: 'Chelsea', lat: 51.4875, lng: -0.1687 },
  { name: 'Mayfair', lat: 51.5074, lng: -0.1478 },
  { name: 'Shoreditch', lat: 51.5265, lng: -0.0799 },
  { name: 'Notting Hill', lat: 51.5139, lng: -0.2057 },
  { name: 'Knightsbridge', lat: 51.5015, lng: -0.1607 },
  { name: 'Harley Street', lat: 51.5194, lng: -0.1468 },
  { name: 'Canary Wharf', lat: 51.5054, lng: -0.0235 },
  { name: 'Kensington', lat: 51.4990, lng: -0.1938 },
  { name: 'Manchester', lat: 53.4808, lng: -2.2426 },
  { name: 'Birmingham', lat: 52.4862, lng: -1.8904 },
  { name: 'Edinburgh', lat: 55.9533, lng: -3.1883 },
  { name: 'Bristol', lat: 51.4545, lng: -2.5879 },
  { name: 'Leeds', lat: 53.8008, lng: -1.5491 },
  { name: 'Glasgow', lat: 55.8642, lng: -4.2518 },
];

// Data flow connections — London hub connecting to other cities
const ARC_CONNECTIONS = [
  [0, 8],  // Chelsea → Manchester
  [1, 10], // Mayfair → Edinburgh
  [5, 9],  // Harley St → Birmingham
  [2, 11], // Shoreditch → Bristol
  [3, 12], // Notting Hill → Leeds
  [6, 13], // Canary Wharf → Glasgow
  [0, 5],  // Chelsea → Harley St (London internal)
  [1, 7],  // Mayfair → Kensington (London internal)
  [2, 6],  // Shoreditch → Canary Wharf (London internal)
  [4, 3],  // Knightsbridge → Notting Hill (London internal)
];

const GLOBE_RADIUS = 1.6;

// Convert lat/lng to 3D position on sphere
function latLngToVec3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

// Generate points biased toward UK/Europe landmass + scattered global
function generateGlobePoints(count: number, radius: number): Float32Array {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    let lat: number, lng: number;

    if (i < count * 0.35) {
      // 35% of points clustered around UK/Europe (lat 48-60, lng -10 to 3)
      lat = 48 + Math.random() * 12;
      lng = -10 + Math.random() * 13;
    } else if (i < count * 0.5) {
      // 15% around greater Europe
      lat = 35 + Math.random() * 30;
      lng = -15 + Math.random() * 40;
    } else {
      // Rest scattered globally
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

// ─── Globe particle field ────────────────────────────────────────
function GlobeField() {
  const pointsRef = useRef<THREE.Points>(null);
  const positions = useMemo(() => generateGlobePoints(3000, GLOBE_RADIUS), []);

  useFrame((state) => {
    if (pointsRef.current) {
      // Very slow rotation to show it's alive, not distracting
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
        color: '#d26645',
        size: 0.006,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
      }),
    [],
  );

  return <points ref={pointsRef} geometry={geometry} material={material} />;
}

// ─── Clinic hotspot markers ──────────────────────────────────────
function ClinicMarkers() {
  const groupRef = useRef<THREE.Group>(null);
  const pulseMaterials = useRef<THREE.MeshBasicMaterial[]>([]);

  const markerData = useMemo(
    () =>
      CLINIC_LOCATIONS.map((loc) => ({
        position: latLngToVec3(loc.lat, loc.lng, GLOBE_RADIUS + 0.008),
        isLondon: loc.lat > 51.4 && loc.lat < 51.6 && loc.lng > -0.3 && loc.lng < 0.1,
      })),
    [],
  );

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.03;
    }
    // Pulse the markers
    pulseMaterials.current.forEach((mat, i) => {
      const phase = state.clock.elapsedTime * 1.5 + i * 0.4;
      mat.opacity = 0.5 + Math.sin(phase) * 0.3;
    });
  });

  return (
    <group ref={groupRef}>
      {markerData.map((marker, i) => {
        const mat = new THREE.MeshBasicMaterial({
          color: marker.isLondon ? '#d26645' : '#a855f7',
          transparent: true,
          opacity: 0.7,
          depthWrite: false,
        });
        if (!pulseMaterials.current[i]) pulseMaterials.current[i] = mat;

        return (
          <mesh key={i} position={marker.position} material={pulseMaterials.current[i] || mat}>
            <sphereGeometry args={[marker.isLondon ? 0.018 : 0.012, 12, 12]} />
          </mesh>
        );
      })}
    </group>
  );
}

// ─── Data flow arcs between clinics ──────────────────────────────
function DataArcs() {
  const groupRef = useRef<THREE.Group>(null);
  const dashOffsets = useRef<number[]>(ARC_CONNECTIONS.map(() => 0));

  const arcGeometries = useMemo(() => {
    return ARC_CONNECTIONS.map(([fromIdx, toIdx]) => {
      const from = CLINIC_LOCATIONS[fromIdx];
      const to = CLINIC_LOCATIONS[toIdx];
      const start = latLngToVec3(from.lat, from.lng, GLOBE_RADIUS);
      const end = latLngToVec3(to.lat, to.lng, GLOBE_RADIUS);

      // Arc height proportional to distance
      const distance = start.distanceTo(end);
      const arcHeight = GLOBE_RADIUS + distance * 0.25;

      // Control point above midpoint
      const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
      mid.normalize().multiplyScalar(arcHeight);

      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const isInternal = fromIdx < 8 && toIdx < 8;
      // Use TubeGeometry for proper 3D arcs (avoids <line> JSX conflict)
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

  return (
    <group ref={groupRef}>
      {arcGeometries.map(({ geometry, isInternal }, i) => (
        <mesh key={i} geometry={geometry}>
          <meshBasicMaterial
            color={isInternal ? '#d26645' : '#a855f7'}
            transparent
            opacity={isInternal ? 0.3 : 0.18}
          />
        </mesh>
      ))}
    </group>
  );
}

// ─── Atmospheric glow ring ───────────────────────────────────────
function AtmosphereRing() {
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
      <meshBasicMaterial color="#d26645" transparent opacity={0.1} />
    </mesh>
  );
}

// ─── Scroll-driven camera zoom ───────────────────────────────────
function ScrollCamera() {
  const { camera } = useThree();
  const progressRef = useRef(0);

  useEffect(() => {
    // Initial position: looking at UK from the side
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

    // Phase 1 (0-0.6): Slow zoom + slight rotation toward UK
    // Phase 2 (0.6-1.0): Zoom through, fade out
    const zoomProgress = Math.min(p / 0.65, 1);
    const eased = 1 - Math.pow(1 - zoomProgress, 3); // ease-out cubic

    camera.position.z = 4.2 - eased * 3.6;
    camera.position.y = 0.3 + eased * 0.15;
    camera.position.x = eased * -0.2;

    // Fade the canvas
    const canvasEl = document.getElementById('globe-canvas');
    if (canvasEl) {
      if (p > 0.65) {
        canvasEl.style.opacity = String(Math.max(0, 1 - (p - 0.65) / 0.3));
      } else {
        canvasEl.style.opacity = '1';
      }
    }
  });

  return null;
}

// ─── Main scene export ───────────────────────────────────────────
export function GlobeScene() {
  return (
    <div id="globe-canvas" className="h-full w-full">
      <Canvas
        camera={{ position: [0, 0.3, 4.2], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.4} />
        <GlobeField />
        <ClinicMarkers />
        <DataArcs />
        <AtmosphereRing />
        <ScrollCamera />
      </Canvas>
    </div>
  );
}
