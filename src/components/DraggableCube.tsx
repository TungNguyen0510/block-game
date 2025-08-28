import { useEffect, useRef, useState } from "react";
import { useDrag } from "@use-gesture/react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { MeshTransmissionMaterial, Text } from "@react-three/drei";
import { MAIN_COLOR } from "@/constants/colors";

export default function DraggableCube({
  startPos,
  label,
  locked,
  hidden,
  onDrop,
  resetSignal = 0,
  globalResetSignal = 0,
  onDragStart,
}: {
  startPos: [number, number, number];
  label: string;
  locked: boolean;
  hidden: boolean;
  /**
   * Called when the user releases the cube. Return success=true to accept the drop.
   * Provide snapPos to snap to a grid position.
   */
  onDrop: (pos: THREE.Vector3) => {
    success: boolean;
    snapPos?: THREE.Vector3;
  };
  /**
   * When this counter changes, the cube resets back to its start position.
   */
  resetSignal?: number;
  /**
   * Global reset counter to clear placed state across all cubes (game reset).
   */
  globalResetSignal?: number;
  /**
   * Optional callback fired when the user begins dragging the cube.
   */
  onDragStart?: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const { camera } = useThree();
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const [isDragging, setIsDragging] = useState(false);
  // Track whether this cube is currently placed (successful drop)
  const [isPlaced, setIsPlaced] = useState(false);
  // Visual pulse when a correct snap happens
  const [snapPulse, setSnapPulse] = useState(false);
  // Keep internal start position to ensure consistent resets when the prop array instance changes
  const startRef = useRef<[number, number, number]>(startPos);
  useEffect(() => {
    startRef.current = startPos;
  }, [startPos]);

  const bind = useDrag(({ event, active }) => {
    if (active && !isDragging) {
      if (onDragStart) onDragStart();
      // When starting a new drag, consider this cube no longer placed
      setIsPlaced(false);
    }
    setIsDragging(active);
    const e = event as PointerEvent;
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const pos = new THREE.Vector3();
    raycaster.ray.intersectPlane(planeZ, pos);

    if (active) {
      // Keep the cube visually at its original Z (staging Z) while dragging
      const displayPos = pos.clone();
      displayPos.z = startRef.current[2];
      meshRef.current.position.copy(displayPos);
      // Add a subtle diagonal tilt on X and Y while dragging for feedback
      // Keep it small to avoid disorientation
      meshRef.current.rotation.set(0, 0, 0.05);
    } else {
      // Use z=0 for snapping calculations, but keep visual z at staging on placement
      const posForSnap = pos.clone();
      posForSnap.z = 0;
      const result = onDrop(posForSnap);
      if (result.success && result.snapPos) {
        const snapPos = result.snapPos.clone();
        snapPos.z = startRef.current[2];
        meshRef.current.position.copy(snapPos);
        // brief pulse to indicate successful snap
        setSnapPulse(true);
        setTimeout(() => setSnapPulse(false), 150);
        setIsPlaced(true);
      } else {
        // Revert to start position if drop is rejected
        meshRef.current.position.set(...startRef.current);
        setIsPlaced(false);
      }
      // Reset rotation after dropping
      meshRef.current.rotation.set(0, 0, 0);
    }
  });

  // External reset: when the signal changes, move back to the start position
  useEffect(() => {
    if (!meshRef.current) return;
    meshRef.current.position.set(...startRef.current);
    // Ensure rotation is reset on external reset as well
    meshRef.current.rotation.set(0, 0, 0);
    setIsPlaced(false);
  }, [resetSignal]);

  // Global reset: ensure isPlaced is cleared even if ids repeat across rounds
  useEffect(() => {
    if (!meshRef.current) return;
    meshRef.current.position.set(...startRef.current);
    meshRef.current.rotation.set(0, 0, 0);
    setIsPlaced(false);
  }, [globalResetSignal]);

  if (hidden) return null;

  return (
    <mesh
      ref={meshRef}
      position={startPos}
      scale={snapPulse ? 1.08 : 1}
      {...(locked ? {} : bind())}
    >
      <boxGeometry args={[1, 1, 1]} />
      <MeshTransmissionMaterial
        color={isPlaced ? MAIN_COLOR : "white"}
        roughness={0.1}
        metalness={0.8}
        transparent={true}
        opacity={0.9}
        transmission={0.5}
        clearcoat={1}
      />
      <Text
        position={[-0.46, -0.2, 0.51]}
        fontSize={0.12}
        color={isPlaced ? "white" : MAIN_COLOR}
        anchorX="left"
        anchorY="middle"
        overflowWrap="break-word"
        lineHeight={1.2}
        maxWidth={0.9}
        textAlign="left"
      >
        {label}
      </Text>
    </mesh>
  );
}
