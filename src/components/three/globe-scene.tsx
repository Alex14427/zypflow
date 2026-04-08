'use client';

import { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';

// Clinic locations with linked articles
const MARKERS = [
  { name: 'London', lat: 51.5074, lng: -0.1478, size: 0.028, color: '#d26645', article: { title: 'Why 73% of Clinic Enquiries Go Unanswered', slug: '/blog/why-clinic-enquiries-go-unanswered' } },
  { name: 'Manchester', lat: 53.4808, lng: -2.2426, size: 0.018, color: '#a855f7', article: { title: 'The Real Cost of No-Shows', slug: '/blog/cost-of-no-shows-smart-reminders' } },
  { name: 'Birmingham', lat: 52.4862, lng: -1.8904, size: 0.016, color: '#a855f7', article: { title: '5 Revenue Leaks to Audit This Month', slug: '/blog/five-revenue-leaks-to-audit' } },
  { name: 'Edinburgh', lat: 55.9533, lng: -3.1883, size: 0.016, color: '#a855f7', article: { title: 'When to Automate Your Patient Journey', slug: '/blog/when-to-automate-patient-journey' } },
  { name: 'Bristol', lat: 51.4545, lng: -2.5879, size: 0.014, color: '#a855f7', article: { title: 'Google Reviews: The Automated Approach', slug: '/blog/automated-google-reviews-clinics' } },
  { name: 'Leeds', lat: 53.8008, lng: -1.5491, size: 0.014, color: '#a855f7', article: { title: 'Booking Software vs Revenue OS', slug: '/blog/booking-software-vs-revenue-os' } },
  { name: 'Glasgow', lat: 55.8642, lng: -4.2518, size: 0.014, color: '#a855f7' },
  { name: 'Liverpool', lat: 53.4084, lng: -2.9916, size: 0.013, color: '#a855f7' },
  { name: 'Newcastle', lat: 54.9783, lng: -1.6178, size: 0.013, color: '#a855f7' },
  { name: 'Cardiff', lat: 51.4816, lng: -3.1791, size: 0.013, color: '#a855f7' },
];

const ARC_PAIRS: [number, number][] = [
  [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6],
  [1, 3], [2, 5], [3, 6],
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

// ─── All globe visuals in ONE group (no individual rotation) ────
function GlobeContents({
  isLight,
  onMarkerClick,
  activeMarker,
}: {
  isLight: boolean;
  onMarkerClick: (idx: number) => void;
  activeMarker: number | null;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const pulseMats = useRef<THREE.MeshBasicMaterial[]>([]);
  const ringRef = useRef<THREE.Mesh>(null);
  const positions = useMemo(() => generateGlobePoints(2500, GLOBE_RADIUS), []);

  const markerPositions = useMemo(
    () => MARKERS.map((m) => latLngToVec3(m.lat, m.lng, GLOBE_RADIUS + 0.01)),
    [],
  );

  const arcGeos = useMemo(() => {
    return ARC_PAIRS.map(([a, b]) => {
      const start = latLngToVec3(MARKERS[a].lat, MARKERS[a].lng, GLOBE_RADIUS);
      const end = latLngToVec3(MARKERS[b].lat, MARKERS[b].lng, GLOBE_RADIUS);
      const dist = start.distanceTo(end);
      const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
      mid.normalize().multiplyScalar(GLOBE_RADIUS + dist * 0.25);
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      return new THREE.TubeGeometry(curve, 32, 0.003, 4, false);
    });
  }, []);

  const ptGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [positions]);

  const ptMat = useMemo(
    () => new THREE.PointsMaterial({
      color: isLight ? '#1a1a2e' : '#d26645',
      size: 0.006,
      sizeAttenuation: true,
      transparent: true,
      opacity: isLight ? 0.35 : 0.45,
      depthWrite: false,
    }),
    [isLight],
  );

  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.x = Math.PI / 2.1 + Math.sin(state.clock.elapsedTime * 0.15) * 0.03;
    }
    pulseMats.current.forEach((mat, i) => {
      const phase = state.clock.elapsedTime * 1.5 + i * 0.4;
      mat.opacity = 0.4 + Math.sin(phase) * 0.35;
    });
  });

  return (
    <>
      {/* Particle field */}
      <points ref={pointsRef} geometry={ptGeo} material={ptMat} />

      {/* Atmosphere ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[GLOBE_RADIUS + 0.25, 0.002, 16, 120]} />
        <meshBasicMaterial color={isLight ? '#b84f31' : '#d26645'} transparent opacity={0.12} />
      </mesh>

      {/* Data arcs */}
      {arcGeos.map((geo, i) => (
        <mesh key={`arc-${i}`} geometry={geo}>
          <meshBasicMaterial color={isLight ? '#7c3aed' : '#a855f7'} transparent opacity={0.2} />
        </mesh>
      ))}

      {/* Clickable city markers */}
      {MARKERS.map((marker, i) => {
        if (!pulseMats.current[i]) {
          pulseMats.current[i] = new THREE.MeshBasicMaterial({
            color: marker.color,
            transparent: true,
            opacity: 0.7,
            depthWrite: false,
          });
        }
        const isActive = activeMarker === i;

        return (
          <group key={i} position={markerPositions[i]}>
            <mesh
              material={pulseMats.current[i]}
              onClick={(e: ThreeEvent<MouseEvent>) => {
                e.stopPropagation();
                onMarkerClick(i);
              }}
              onPointerOver={(e: ThreeEvent<PointerEvent>) => {
                e.stopPropagation();
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={() => {
                document.body.style.cursor = 'auto';
              }}
            >
              <sphereGeometry args={[marker.size, 16, 16]} />
            </mesh>

            {/* Outer pulse ring for active marker */}
            {isActive && (
              <mesh>
                <ringGeometry args={[marker.size + 0.01, marker.size + 0.025, 32]} />
                <meshBasicMaterial color={marker.color} transparent opacity={0.4} side={THREE.DoubleSide} />
              </mesh>
            )}

            {/* HTML tooltip on click — shows article link */}
            {isActive && (
              <Html distanceFactor={6} center style={{ pointerEvents: 'auto' }}>
                <div
                  className="w-56 rounded-xl border border-[var(--app-border)] bg-[var(--app-bg)] p-3 shadow-xl backdrop-blur-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="text-xs font-bold text-brand-purple">{marker.name}</p>
                  {marker.article ? (
                    <a
                      href={marker.article.slug}
                      className="mt-1.5 block text-xs leading-snug text-[var(--app-text-muted)] hover:text-brand-purple transition"
                    >
                      {marker.article.title} &rarr;
                    </a>
                  ) : (
                    <p className="mt-1 text-[10px] text-[var(--app-text-soft)]">Coverage area</p>
                  )}
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </>
  );
}

export function GlobeScene() {
  const [isLight, setIsLight] = useState(false);
  const [activeMarker, setActiveMarker] = useState<number | null>(null);

  useEffect(() => {
    const check = () => setIsLight(document.documentElement.classList.contains('light'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const handleMarkerClick = useCallback((idx: number) => {
    setActiveMarker((prev) => (prev === idx ? null : idx));
  }, []);

  return (
    <div id="globe-canvas" className="h-full w-full relative">
      <Canvas
        camera={{ position: [0, 0.4, 3.8], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
        onPointerMissed={() => setActiveMarker(null)}
      >
        <ambientLight intensity={isLight ? 0.6 : 0.4} />
        <GlobeContents
          isLight={isLight}
          onMarkerClick={handleMarkerClick}
          activeMarker={activeMarker}
        />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          rotateSpeed={0.5}
          autoRotate
          autoRotateSpeed={0.5}
          minPolarAngle={Math.PI * 0.25}
          maxPolarAngle={Math.PI * 0.75}
        />
      </Canvas>

      {/* Instructions hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-[var(--app-border)] bg-[var(--app-bg)]/80 px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] text-[var(--app-text-soft)] backdrop-blur-sm">
        Drag to explore &middot; Click a city to read
      </div>
    </div>
  );
}
