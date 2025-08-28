import { Cell } from "@/types";

export function createWordNEXT(): {
  cells: Cell[];
  width: number;
  minX: number;
  maxX: number;
} {
  const cells: Cell[] = [];
  let offsetX = 0;

  // --- N ---
  const midY = 2;
  for (let y = 0; y < 5; y++) {
    cells.push({
      position: [offsetX + 0, y, 0],
      letter: "N",
      occupiedBy: null,
    });
    cells.push({
      position: [offsetX + 3, y, 0],
      letter: "N",
      occupiedBy: null,
    });
    const xIdeal = (4 - y) * 0.75;
    let x = Math.round(xIdeal);
    if (y === midY) x = xIdeal;
    cells.push({
      position: [offsetX + x, y, 0],
      letter: "N",
      occupiedBy: null,
    });
  }
  offsetX += 4 + 1;

  // --- E ---
  for (let y = 0; y < 5; y++)
    cells.push({
      position: [offsetX + 0, y, 0],
      letter: "E",
      occupiedBy: null,
    });
  for (let x = 1; x < 3; x++) {
    cells.push({
      position: [offsetX + x, 0, 0],
      letter: "E",
      occupiedBy: null,
    });
    cells.push({
      position: [offsetX + x, 2, 0],
      letter: "E",
      occupiedBy: null,
    });
    cells.push({
      position: [offsetX + x, 4, 0],
      letter: "E",
      occupiedBy: null,
    });
  }
  offsetX += 3 + 0.5;

  // --- X ---
  for (let i = 0; i < 5; i++) {
    let dx = i;
    if (i === 0) dx += 0.5;
    if (i === 4) dx -= 0.5;
    cells.push({
      position: [offsetX + dx, i, 0],
      letter: "X",
      occupiedBy: null,
    });
    cells.push({
      position: [offsetX + dx, 4 - i, 0],
      letter: "X",
      occupiedBy: null,
    });
  }
  offsetX += 4 + 1.5;

  // --- T ---
  for (let x = 0; x < 3; x++)
    cells.push({
      position: [offsetX + x, 4, 0],
      letter: "T",
      occupiedBy: null,
    });
  for (let y = 0; y < 4; y++)
    cells.push({
      position: [offsetX + 1, y, 0],
      letter: "T",
      occupiedBy: null,
    });
  offsetX += 3;

  // Compute actual bounds to center accurately
  let minX = Infinity;
  let maxX = -Infinity;
  for (const c of cells) {
    const x = c.position[0];
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
  }
  const width = maxX - minX;
  return { cells, width, minX, maxX };
}