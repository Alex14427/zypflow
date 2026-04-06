'use client';

import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// Generate points on a sphere surface
function generateSpherePoints(count: number, radius: number): Float32Array {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = radius + (Math.random() - 0.5) * 0.02;
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  return positions;
}

// Generate arc connections between random points on the globe
function generateArcs(count: number, radius: number): THREE.Vector3[][] {
  const arcs: THREE.Vector3[][] = [];
  for (let i = 0; i < count; i++) {
    const theta1 = Math.random() * Math.PI * 2;
    const phi1 = Math.acos(2 * Math.random() - 1);
    const theta2 = theta1 + (Math.random() - 0.5) * 2;
    const phi2 = phi1 + (Math.random() - 0.5) * 1.5;

    const points: THREE.Vector3[] = [];
    const segments = 20;
    for (let j = 0; j <= segments; j++) {
      const t = j / segments;
      const th = theta1 + (theta2 - theta1) * t;
      const ph = phi1 + (phi2 - phi1) * t;
      const height = radius + Math.sin(t * Math.PI) * 0.3;
      points.push(
        new THREE.Vector3(
          height * Math.sin(ph) * Math.cos(th),
          height * Math.sin(ph) * Math.sin(th),
          height * Math.cos(ph)
        )
      );
    }
    arcs.push(points);
  }
  return arcs;
}

function GlobePoints() {
  const pointsRef = useRef<THREE.Points>(null);
  const positions = useMemo(() => generateSpherePoints(4000, 1.5), []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.05;
      pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.03) * 0.1;
    }
  });

  return (
    <Points ref={pointsRef} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#d26645"
        size={0.008}
        sizeAttenuation
        depthWrite={false}
        opacity={0.6}
      />
    </Points>
  );
}

function GlobeArcs() {
  const groupRef = useRef<THREE.Group>(null);
  const arcs = useMemo(() => generateArcs(12, 1.5), []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.05;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.03) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {arcs.map((arcPoints, i) => {
        const curve = new THREE.CatmullRomCurve3(arcPoints);
        const tubeGeometry = new THREE.TubeGeometry(curve, 20, 0.003, 4, false);
        return (
          <mesh key={i} geometry={tubeGeometry}>
            <meshBasicMaterial
              color="#a855f7"
              transparent
              opacity={0.3}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function GlobeRing() {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.x = Math.PI / 2 + Math.sin(state.clock.elapsedTime * 0.2) * 0.05;
      ringRef.current.rotation.z = state.clock.elapsedTime * 0.02;
    }
  });

  return (
    <mesh ref={ringRef}>
      <torusGeometry args={[1.8, 0.003, 16, 100]} />
      <meshBasicMaterial color="#d26645" transparent opacity={0.15} />
    </mesh>
  );
}

function ScrollZoom() {
  const { camera } = useThree();

  useEffect(() => {
    const initialZ = 4.5;
    const targetZ = 0.3;
    camera.position.z = initialZ;

    const trigger = ScrollTrigger.create({
      trigger: '#globe-section',
      start: 'top top',
      end: 'bottom top',
      scrub: 1.5,
      onUpdate: (self) => {
        const progress = self.progress;
        camera.position.z = initialZ - (initialZ - targetZ) * progress;
        // Fade out globe as we zoom through
        const globeContainer = document.getElementById('globe-canvas');
        if (globeContainer) {
          if (progress > 0.7) {
            globeContainer.style.opacity = String(1 - (progress - 0.7) / 0.3);
          } else {
            globeContainer.style.opacity = '1';
          }
        }
      },
    });

    return () => trigger.kill();
  }, [camera]);

  return null;
}

export function GlobeScene() {
  return (
    <div id="globe-canvas" className="h-full w-full">
      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <GlobePoints />
        <GlobeArcs />
        <GlobeRing />
        <ScrollZoom />
      </Canvas>
    </div>
  );
}
