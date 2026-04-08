'use client';

import { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';

/* ── UK clinic markers ─────────────────────────────────────── */
const MARKERS = [
  { name: 'London', lat: 51.5074, lng: -0.1478, size: 0.045, color: '#d26645', article: { title: 'Why 73% of Clinic Enquiries Go Unanswered', slug: '/blog/why-clinic-enquiries-go-unanswered' } },
  { name: 'Manchester', lat: 53.4808, lng: -2.2426, size: 0.035, color: '#a855f7', article: { title: 'The Real Cost of No-Shows', slug: '/blog/cost-of-no-shows-smart-reminders' } },
  { name: 'Birmingham', lat: 52.4862, lng: -1.8904, size: 0.032, color: '#a855f7', article: { title: '5 Revenue Leaks to Audit This Month', slug: '/blog/five-revenue-leaks-to-audit' } },
  { name: 'Edinburgh', lat: 55.9533, lng: -3.1883, size: 0.032, color: '#a855f7', article: { title: 'When to Automate Your Patient Journey', slug: '/blog/when-to-automate-patient-journey' } },
  { name: 'Bristol', lat: 51.4545, lng: -2.5879, size: 0.028, color: '#a855f7', article: { title: 'Google Reviews: The Automated Approach', slug: '/blog/automated-google-reviews-clinics' } },
  { name: 'Leeds', lat: 53.8008, lng: -1.5491, size: 0.028, color: '#a855f7', article: { title: 'Booking Software vs Revenue OS', slug: '/blog/booking-software-vs-revenue-os' } },
  { name: 'Glasgow', lat: 55.8642, lng: -4.2518, size: 0.026, color: '#a855f7' },
  { name: 'Liverpool', lat: 53.4084, lng: -2.9916, size: 0.024, color: '#a855f7' },
  { name: 'Newcastle', lat: 54.9783, lng: -1.6178, size: 0.024, color: '#a855f7' },
  { name: 'Cardiff', lat: 51.4816, lng: -3.1791, size: 0.024, color: '#a855f7' },
];

const ARC_PAIRS: [number, number][] = [
  [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6],
  [1, 3], [2, 5], [3, 6], [1, 7], [4, 9],
];

const GLOBE_RADIUS = 1.6;

/* ── Coordinate conversion ─────────────────────────── */
function latLngToVec3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

/* ── Simplified continent detection via bounding boxes ── */
function isLand(lat: number, lng: number): boolean {
  if (lat >= 50 && lat <= 59 && lng >= -11 && lng <= 2) return true;
  if (lat >= 63 && lat <= 66.5 && lng >= -24 && lng <= -13) return true;
  if (lat >= 55 && lat <= 71 && lng >= 4 && lng <= 31) return true;
  if (lat >= 36 && lat <= 55 && lng >= -10 && lng <= 15) return true;
  if (lat >= 42 && lat <= 55 && lng >= 14 && lng <= 30) return true;
  if (lat >= 37 && lat <= 47 && lng >= 7 && lng <= 19) return true;
  if (lat >= 35 && lat <= 46 && lng >= 19 && lng <= 30) return true;
  if (lat >= 36 && lat <= 42 && lng >= 26 && lng <= 45) return true;
  if (lat >= 12 && lat <= 38 && lng >= 34 && lng <= 60) return true;
  if (lat >= 15 && lat <= 37 && lng >= -17 && lng <= 35) return true;
  if (lat >= -2 && lat <= 15 && lng >= -18 && lng <= 16) return true;
  if (lat >= -12 && lat <= 15 && lng >= 16 && lng <= 52) return true;
  if (lat >= -35 && lat <= -12 && lng >= 12 && lng <= 42) return true;
  if (lat >= -26 && lat <= -12 && lng >= 43 && lng <= 50) return true;
  if (lat >= 50 && lat <= 75 && lng >= 30 && lng <= 180) return true;
  if (lat >= 18 && lat <= 50 && lng >= 75 && lng <= 135) return true;
  if (lat >= 30 && lat <= 46 && lng >= 126 && lng <= 146) return true;
  if (lat >= -8 && lat <= 28 && lng >= 92 && lng <= 141) return true;
  if (lat >= 6 && lat <= 35 && lng >= 68 && lng <= 92) return true;
  if (lat >= 25 && lat <= 72 && lng >= -168 && lng <= -52) return true;
  if (lat >= 7 && lat <= 33 && lng >= -118 && lng <= -77) return true;
  if (lat >= -56 && lat <= 13 && lng >= -82 && lng <= -34) return true;
  if (lat >= -40 && lat <= -11 && lng >= 113 && lng <= 154) return true;
  if (lat >= -47 && lat <= -34 && lng >= 166 && lng <= 179) return true;
  if (lat >= 60 && lat <= 84 && lng >= -73 && lng <= -12) return true;
  if (lat >= 54 && lat <= 72 && lng >= -170 && lng <= -130) return true;
  return false;
}

/* ── Fibonacci sphere — uniform lat/lng sampling ────── */
function fibonacciSphere(n: number): [number, number][] {
  const pts: [number, number][] = [];
  const golden = (1 + Math.sqrt(5)) / 2;
  for (let i = 0; i < n; i++) {
    const lat = Math.asin(1 - 2 * (i + 0.5) / n) * (180 / Math.PI);
    const lng = ((360 * i) / golden) % 360 - 180;
    pts.push([lat, lng]);
  }
  return pts;
}

/* ── Build particle buffers — UK / land / ocean ─────── */
function buildParticles(radius: number) {
  const candidates = fibonacciSphere(26000);
  const uk: THREE.Vector3[] = [];
  const land: THREE.Vector3[] = [];

  for (const [lat, lng] of candidates) {
    if (!isLand(lat, lng)) continue;
    const jitter = (Math.random() - 0.5) * 0.006;
    const v = latLngToVec3(lat, lng, radius + jitter);
    if (lat >= 50 && lat <= 59 && lng >= -11 && lng <= 2) uk.push(v);
    else land.push(v);
  }

  // UK density boost
  for (let i = 0; i < 1000; i++) {
    const lat = 50 + Math.random() * 9;
    const lng = -8 + Math.random() * 10;
    if (isLand(lat, lng)) {
      uk.push(latLngToVec3(lat, lng, radius + (Math.random() - 0.5) * 0.004));
    }
  }

  // Sparse ocean scatter
  const ocean: THREE.Vector3[] = [];
  for (const [lat, lng] of fibonacciSphere(2000)) {
    if (!isLand(lat, lng)) ocean.push(latLngToVec3(lat, lng, radius));
  }

  return { uk: vec3sToGeo(uk), land: vec3sToGeo(land), ocean: vec3sToGeo(ocean) };
}

function vec3sToGeo(points: THREE.Vector3[]): THREE.BufferGeometry {
  const pos = new Float32Array(points.length * 3);
  points.forEach((p, i) => {
    pos[i * 3] = p.x;
    pos[i * 3 + 1] = p.y;
    pos[i * 3 + 2] = p.z;
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  return geo;
}

/* ── All globe visuals ─────────────────────────────── */
function GlobeContents({
  isLight,
  onMarkerClick,
  activeMarker,
}: {
  isLight: boolean;
  onMarkerClick: (idx: number) => void;
  activeMarker: number | null;
}) {
  const ringRef = useRef<THREE.Mesh>(null);
  const pulseMats = useRef<THREE.MeshBasicMaterial[]>([]);
  const arcMatsRef = useRef<THREE.MeshBasicMaterial[]>([]);

  /* Stable geometries */
  const { uk: ukGeo, land: landGeo, ocean: oceanGeo } = useMemo(
    () => buildParticles(GLOBE_RADIUS),
    [],
  );

  const markerPositions = useMemo(
    () => MARKERS.map((m) => latLngToVec3(m.lat, m.lng, GLOBE_RADIUS + 0.012)),
    [],
  );

  const arcGeos = useMemo(() => {
    return ARC_PAIRS.map(([a, b]) => {
      const s = latLngToVec3(MARKERS[a].lat, MARKERS[a].lng, GLOBE_RADIUS);
      const e = latLngToVec3(MARKERS[b].lat, MARKERS[b].lng, GLOBE_RADIUS);
      const mid = new THREE.Vector3().addVectors(s, e).multiplyScalar(0.5);
      mid.normalize().multiplyScalar(GLOBE_RADIUS + s.distanceTo(e) * 0.3);
      const curve = new THREE.QuadraticBezierCurve3(s, mid, e);
      return new THREE.TubeGeometry(curve, 44, 0.004, 6, false);
    });
  }, []);

  /* Graticule grid — lat/lng lines every 30° */
  const graticuleMat = useMemo(
    () => new THREE.LineBasicMaterial({ color: '#1e293b', transparent: true, opacity: 0.1 }),
    [],
  );

  const graticuleObjs = useMemo(() => {
    const segs = 90;
    const lines: THREE.Line[] = [];
    for (let lat = -60; lat <= 60; lat += 30) {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= segs; i++)
        pts.push(latLngToVec3(lat, (i / segs) * 360 - 180, GLOBE_RADIUS * 1.002));
      lines.push(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), graticuleMat));
    }
    for (let lng = -180; lng < 180; lng += 30) {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= segs; i++)
        pts.push(latLngToVec3((i / segs) * 180 - 90, lng, GLOBE_RADIUS * 1.002));
      lines.push(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), graticuleMat));
    }
    return lines;
  }, [graticuleMat]);

  /* Materials — mutated in effect so geometries stay stable */
  const ukMat = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: '#d26645',
        size: 0.018,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
      }),
    [],
  );

  const landMat = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: '#c45a3a',
        size: 0.012,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.65,
        depthWrite: false,
      }),
    [],
  );

  const oceanMat = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: '#374151',
        size: 0.005,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.25,
        depthWrite: false,
      }),
    [],
  );

  const globeBodyMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: '#0a0a14', transparent: true, opacity: 0.85 }),
    [],
  );

  /* Theme-reactive material updates */
  useEffect(() => {
    if (isLight) {
      ukMat.color.set('#b84f31');
      landMat.color.set('#1a1a2e');
      landMat.opacity = 0.5;
      oceanMat.color.set('#9ca3af');
      oceanMat.opacity = 0.15;
      globeBodyMat.color.set('#e5e7eb');
      graticuleMat.color.set('#94a3b8');
      graticuleMat.opacity = 0.15;
    } else {
      ukMat.color.set('#d26645');
      landMat.color.set('#c45a3a');
      landMat.opacity = 0.65;
      oceanMat.color.set('#374151');
      oceanMat.opacity = 0.25;
      globeBodyMat.color.set('#0a0a14');
      graticuleMat.color.set('#1e293b');
      graticuleMat.opacity = 0.1;
    }
    arcMatsRef.current.forEach((mat) => mat.color.set(isLight ? '#7c3aed' : '#a855f7'));
  }, [isLight, ukMat, landMat, oceanMat, globeBodyMat, graticuleMat]);

  /* Animation */
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ringRef.current) {
      ringRef.current.rotation.x = Math.PI / 2.1 + Math.sin(t * 0.15) * 0.03;
    }
    pulseMats.current.forEach((mat, i) => {
      mat.opacity = 0.5 + Math.sin(t * 1.5 + i * 0.4) * 0.35;
    });
    arcMatsRef.current.forEach((mat, i) => {
      mat.opacity = 0.15 + Math.sin(t * 0.8 + i * 0.5) * 0.1;
    });
  });

  return (
    <>
      {/* Globe body — dark sphere behind the dots */}
      <mesh material={globeBodyMat}>
        <sphereGeometry args={[GLOBE_RADIUS * 0.993, 64, 64]} />
      </mesh>

      {/* Graticule grid */}
      {graticuleObjs.map((obj, i) => (
        <primitive key={`grat-${i}`} object={obj} />
      ))}

      {/* UK dots — brightest, largest */}
      <points geometry={ukGeo} material={ukMat} />

      {/* Land dots — continent shapes */}
      <points geometry={landGeo} material={landMat} />

      {/* Ocean dots — sparse texture */}
      <points geometry={oceanGeo} material={oceanMat} />

      {/* Atmosphere glow — layered BackSide spheres */}
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS * 1.08, 64, 64]} />
        <meshBasicMaterial
          color="#d26645"
          transparent
          opacity={0.06}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS * 1.16, 64, 64]} />
        <meshBasicMaterial
          color="#d26645"
          transparent
          opacity={0.03}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS * 1.25, 48, 48]} />
        <meshBasicMaterial
          color="#a855f7"
          transparent
          opacity={0.015}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Orbital ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[GLOBE_RADIUS + 0.22, 0.003, 16, 120]} />
        <meshBasicMaterial
          color={isLight ? '#b84f31' : '#d26645'}
          transparent
          opacity={0.18}
        />
      </mesh>

      {/* Data arcs */}
      {arcGeos.map((geo, i) => {
        if (!arcMatsRef.current[i]) {
          arcMatsRef.current[i] = new THREE.MeshBasicMaterial({
            color: isLight ? '#7c3aed' : '#a855f7',
            transparent: true,
            opacity: 0.2,
          });
        }
        return <mesh key={`arc-${i}`} geometry={geo} material={arcMatsRef.current[i]} />;
      })}

      {/* City markers */}
      {MARKERS.map((marker, i) => {
        if (!pulseMats.current[i]) {
          pulseMats.current[i] = new THREE.MeshBasicMaterial({
            color: marker.color,
            transparent: true,
            opacity: 0.8,
            depthWrite: false,
          });
        }
        const isActive = activeMarker === i;

        return (
          <group key={i} position={markerPositions[i]}>
            {/* Main dot */}
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
              <sphereGeometry args={[marker.size, 20, 20]} />
            </mesh>

            {/* Outer glow ring — always visible */}
            <mesh>
              <ringGeometry args={[marker.size * 1.4, marker.size * 2, 32]} />
              <meshBasicMaterial
                color={marker.color}
                transparent
                opacity={0.2}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>

            {/* Active selection ring */}
            {isActive && (
              <mesh>
                <ringGeometry args={[marker.size * 2.2, marker.size * 2.8, 32]} />
                <meshBasicMaterial
                  color={marker.color}
                  transparent
                  opacity={0.5}
                  side={THREE.DoubleSide}
                  depthWrite={false}
                />
              </mesh>
            )}

            {/* Tooltip on click */}
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

/* ── Public component ─────────────────────────────── */
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
          enableZoom
          enablePan={false}
          rotateSpeed={0.5}
          autoRotate
          autoRotateSpeed={0.4}
          minPolarAngle={Math.PI * 0.2}
          maxPolarAngle={Math.PI * 0.8}
          minDistance={2.5}
          maxDistance={6}
        />
      </Canvas>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-[var(--app-border)] bg-[var(--app-bg)]/80 px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] text-[var(--app-text-soft)] backdrop-blur-sm">
        Drag to explore &middot; Scroll to zoom &middot; Click a city
      </div>
    </div>
  );
}
