import { MeshTransmissionMaterial } from "@react-three/drei";

// A non-interactive cube used for placed or auto-filled cells
export default function StaticCube({
  position,
  color = "white",
}: {
  position: [number, number, number];
  color?: string;
  label?: string;
}) {
  return (
    <mesh position={position}>
      <boxGeometry args={[1, 1, 1]} />
      <MeshTransmissionMaterial
        color={color}
        roughness={0.15}
        metalness={0.2}
        transmission={0.5}
        clearcoat={0.5}
        transparent={true}
        samples={6}
      />
    </mesh>
  );
}
