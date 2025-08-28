import { Cell } from "@/types";
import { Line } from "@react-three/drei";

// Draws a square outline for a single grid cell at the given position
function CellEdges({ position }: { position: [number, number, number] }) {
  const [x, y] = position;

  const half = 0.5;
  const points: [number, number, number][] = [
    [x - half, y - half, 0],
    [x + half, y - half, 0],
    [x + half, y + half, 0],
    [x - half, y + half, 0],
    [x - half, y - half, 0],
  ];

  return <Line points={points} color="#d1d5db" lineWidth={2} />;
}

// Renders the outlines for all letter cells
export default function LetterGrid({ cells }: { cells: Cell[] }) {
  return (
    <>
      {cells.map((cell, i) => (
        <CellEdges key={i} position={cell.position} />
      ))}
    </>
  );
}
