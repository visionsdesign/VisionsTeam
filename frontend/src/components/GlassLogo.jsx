import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshTransmissionMaterial, Environment, Float } from '@react-three/drei';
import * as THREE from 'three';

function createVisionsShape() {
  const shape = new THREE.Shape();

  // Build the pinwheel outline: 5 arms each 72° apart
  // Each arm is a rectangle offset from center, union traced as a single contour
  const armCount = 5;
  const outerR = 1.0;
  const innerR = 0.38;
  const armHalfW = 0.28;
  const angleStep = (Math.PI * 2) / armCount;

  // Collect all vertices of all 5 arm rectangles in world space
  // Then use the full outer contour (manually traced in polar order)
  // Approach: draw a path that traces the outside of the windmill shape

  // Each arm: a rectangle spanning from innerR to outerR, width armHalfW*2
  // Rotated by i*72°, slightly offset rotationally to create windmill effect
  // We trace the outline of each arm's "outer cap" and sides in sequence

  const pts = [];

  for (let i = 0; i < armCount; i++) {
    const baseAngle = i * angleStep - Math.PI / 2;
    const twist = 0.28; // windmill offset twist in radians

    // Four corners of this arm rectangle in local coords
    // top-left, top-right (outer), bottom-right, bottom-left (inner)
    const corners = [
      { r: outerR, side: -armHalfW },
      { r: outerR, side:  armHalfW },
      { r: innerR, side:  armHalfW },
      { r: innerR, side: -armHalfW },
    ].map(({ r, side }) => {
      // side offset applied perpendicular to radial direction
      const ang = baseAngle + twist * (r === outerR ? 1 : -1);
      const perpAng = ang + Math.PI / 2;
      return {
        x: Math.cos(ang) * r + Math.cos(perpAng) * side,
        y: Math.sin(ang) * r + Math.sin(perpAng) * side,
      };
    });

    pts.push(corners);
  }

  // Build outer contour: for each arm, trace top-left and top-right outer corners,
  // then bridge to next arm's inner corner
  shape.moveTo(pts[0][0].x, pts[0][0].y);
  for (let i = 0; i < armCount; i++) {
    const curr = pts[i];
    const next = pts[(i + 1) % armCount];
    shape.lineTo(curr[0].x, curr[0].y);
    shape.lineTo(curr[1].x, curr[1].y);
    shape.lineTo(next[3].x, next[3].y);
    shape.lineTo(next[2].x, next[2].y);
  }
  shape.closePath();

  // Star hole in center
  const hole = new THREE.Path();
  const starOuter = 0.34;
  const starInner = 0.15;
  const starPts = 5;
  for (let i = 0; i < starPts * 2; i++) {
    const ang = (i * Math.PI) / starPts - Math.PI / 2;
    const r = i % 2 === 0 ? starOuter : starInner;
    const x = Math.cos(ang) * r;
    const y = Math.sin(ang) * r;
    if (i === 0) hole.moveTo(x, y);
    else hole.lineTo(x, y);
  }
  hole.closePath();
  shape.holes.push(hole);

  return shape;
}

function LogoMesh() {
  const meshRef = useRef();

  const geometry = useMemo(() => {
    const shape = createVisionsShape();
    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.35,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.03,
      bevelSegments: 8,
    });
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.5;
    meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.15;
  });

  return (
    <mesh ref={meshRef} geometry={geometry} position={[0, 0, 0]} castShadow>
      <MeshTransmissionMaterial
        backside
        samples={16}
        resolution={1024}
        transmission={1}
        roughness={0.0}
        thickness={0.5}
        ior={1.5}
        chromaticAberration={0.08}
        anisotropy={0.2}
        distortion={0.1}
        distortionScale={0.2}
        temporalDistortion={0.2}
        clearcoat={1}
        attenuationDistance={0.5}
        attenuationColor="#ffffff"
        color="#ffffff"
      />
    </mesh>
  );
}

export default function GlassLogo({ style }) {
  return (
    <div style={{ width: '100%', height: '100%', ...style }}>
      <Canvas
        camera={{ position: [0, 0, 4], fov: 40 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1.5} />
        <directionalLight position={[-5, -3, -5]} intensity={0.5} color="#8888ff" />
        <Environment preset="city" />
        <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
          <LogoMesh />
        </Float>
      </Canvas>
    </div>
  );
}
