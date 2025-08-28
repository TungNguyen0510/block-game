import { useFrame } from "@react-three/fiber";
import { useMemo, RefObject } from "react";
import * as THREE from "three";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";

export default function CameraAnimator({
  cameraRef,
  controlsRef,
  allComplete,
}: {
  cameraRef: RefObject<THREE.PerspectiveCamera | null>;
  controlsRef: RefObject<OrbitControlsImpl | null>;
  allComplete: boolean;
}) {
  const cameraInitialPos = useMemo(() => new THREE.Vector3(0, -5, 10), []);
  const cameraCompletePos = useMemo(() => new THREE.Vector3(0, 0, 12), []);
  const targetInitial = useMemo(() => new THREE.Vector3(0, -2.4, 3), []);
  const targetComplete = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  useFrame((_, delta) => {
    const camera = cameraRef.current;
    const controls = controlsRef.current as unknown as {
      target: THREE.Vector3;
      update: () => void;
    } | null;
    if (!camera || !controls) return;
    const desiredCamPos = allComplete ? cameraCompletePos : cameraInitialPos;
    const desiredTarget = allComplete ? targetComplete : targetInitial;
    const alpha = 1 - Math.exp(-2 * delta);
    camera.position.lerp(desiredCamPos, alpha);
    controls.target.lerp(desiredTarget, alpha);
    controls.update();
  });

  return null;
}
