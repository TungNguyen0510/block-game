"use client";

import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import {
  Environment,
  PerspectiveCamera,
  OrbitControls,
  Text,
  Line,
} from "@react-three/drei";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { Cell, Letter, AnswerDef, AUTO_FILL } from "../types";
import LetterGrid from "./LetterGrid";
import StaticCube from "./StaticCube";
import DraggableCube from "./DraggableCube";
import { createWordNEXT } from "@/utils";
import { getAnswersRandom } from "@/constants/answer";
import { MAIN_COLOR, SECONDARY_COLOR } from "@/constants/colors";
import CameraAnimator from "./CameraAnimator";

export default function Scene() {
  const { cells: rawCells, width, minX } = useMemo(() => createWordNEXT(), []);
  const [cells, setCells] = useState<Cell[]>(rawCells);

  const STAGING_Z = 0.5;

  const [answers, setAnswers] = useState<AnswerDef[]>(
    () => getAnswersRandom() as AnswerDef[]
  );

  const answerById = useMemo(() => {
    const map: Record<string, AnswerDef> = {};
    for (const a of answers) map[a.id] = a;
    return map;
  }, [answers]);

  const [placed, setPlaced] = useState<Record<string, number>>({});
  // Letters that have reached the auto-fill threshold and are considered complete
  const [filledLetters, setFilledLetters] = useState<Letter[]>([]);

  // Per-answer reset counters used to signal DraggableCube to return to its start position
  const [resetSignals, setResetSignals] = useState<Record<string, number>>({});
  // Global reset counter to force all cubes to clear internal placed state
  const [globalResetCounter, setGlobalResetCounter] = useState(0);
  // Synchronous occupancy lock to avoid race conditions on drop
  const occupiedRef = useRef<Set<number>>(new Set());

  const FILL_THRESHOLD: Record<Letter, number> = useMemo(
    () => ({ N: 2, E: 2, X: 2, T: 2 }),
    []
  );

  const centeredCells: Cell[] = useMemo(() => {
    const centerX = minX + width / 2;
    return cells.map((c) => ({
      ...c,
      position: [c.position[0] - centerX, c.position[1] - 2, c.position[2]],
    }));
  }, [cells, width, minX]);

  // Keep the synchronous occupancy lock in sync with React state
  useEffect(() => {
    const set = new Set<number>();
    for (let i = 0; i < cells.length; i++) {
      if (cells[i].occupiedBy) set.add(i);
    }
    occupiedRef.current = set;
  }, [cells]);

  // Compute the horizontal center (x) of each letter cluster using min/max extents
  const letterCenters: Record<Letter, number> = useMemo(() => {
    const ext: Record<Letter, { minX: number; maxX: number }> = {
      N: { minX: Infinity, maxX: -Infinity },
      E: { minX: Infinity, maxX: -Infinity },
      X: { minX: Infinity, maxX: -Infinity },
      T: { minX: Infinity, maxX: -Infinity },
    };
    for (const c of centeredCells) {
      const x = c.position[0];
      if (x < ext[c.letter].minX) ext[c.letter].minX = x;
      if (x > ext[c.letter].maxX) ext[c.letter].maxX = x;
    }
    (Object.keys(ext) as Letter[]).forEach((L) => {
      if (ext[L].minX === Infinity) ext[L].minX = 0;
      if (ext[L].maxX === -Infinity) ext[L].maxX = 0;
    });
    return {
      N: (ext.N.minX + ext.N.maxX) / 2,
      E: (ext.E.minX + ext.E.maxX) / 2,
      X: (ext.X.minX + ext.X.maxX) / 2,
      T: (ext.T.minX + ext.T.maxX) / 2,
    };
  }, [centeredCells]);

  // Labels to display above each letter group
  const letterHeadings: Record<Letter, string> = useMemo(
    () => ({
      N: "NEXT.JS CONFIG",
      E: "FILE CONVENTION",
      X: "COMPONENT / MODULE",
      T: "OPTIMIZATIONS",
    }),
    []
  );

  // Horizontal extents (min/max x) for each letter cluster to draw brackets
  const letterExtents: Record<Letter, { minX: number; maxX: number }> =
    useMemo(() => {
      const ext: Record<Letter, { minX: number; maxX: number }> = {
        N: { minX: Infinity, maxX: -Infinity },
        E: { minX: Infinity, maxX: -Infinity },
        X: { minX: Infinity, maxX: -Infinity },
        T: { minX: Infinity, maxX: -Infinity },
      };
      for (const c of centeredCells) {
        const x = c.position[0];
        if (x < ext[c.letter].minX) ext[c.letter].minX = x;
        if (x > ext[c.letter].maxX) ext[c.letter].maxX = x;
      }
      // Guard against empty values
      (Object.keys(ext) as Letter[]).forEach((L) => {
        if (ext[L].minX === Infinity) ext[L].minX = 0;
        if (ext[L].maxX === -Infinity) ext[L].maxX = 0;
      });
      return ext;
    }, [centeredCells]);

  // Initial positions for draggable cubes in the staging area at the bottom
  const stagingPositions = useMemo(() => {
    const arr: [number, number, number][] = [];
    const n = answers.length;
    const stagingY = -4;
    for (let i = 0; i < n; i++) arr.push([i - n / 2, stagingY, STAGING_Z]);
    return arr;
  }, [answers.length]);

  // Try to snap an answer to its nearest valid cell (any letter, must be unoccupied)
  const trySnapAnswer = (answer: AnswerDef, worldPos: THREE.Vector3) => {
    if (filledLetters.includes(answer.letter)) return { success: false };
    let bestIndex = -1;
    let bestDist = Infinity;
    for (let i = 0; i < centeredCells.length; i++) {
      const cell = centeredCells[i];
      // Skip cells already occupied (state) or tentatively claimed (ref)
      if (cell.occupiedBy || occupiedRef.current.has(i)) continue;
      const dist = worldPos.distanceTo(new THREE.Vector3(...cell.position));
      if (dist < bestDist) {
        bestDist = dist;
        bestIndex = i;
      }
    }
    if (bestIndex >= 0 && bestDist < 0.6) {
      return {
        success: true,
        snapPos: new THREE.Vector3(...centeredCells[bestIndex].position),
        cellIndex: bestIndex,
      } as const;
    }
    return { success: false } as const;
  };

  // After placing an answer, update state and check auto-fill/completion
  const handlePlaced = (answer: AnswerDef, cellIndex: number) => {
    setCells((prev) => {
      const next = [...prev];
      next[cellIndex] = { ...next[cellIndex], occupiedBy: answer.id };
      return next;
    });
    setPlaced((prev) => ({ ...prev, [answer.id]: cellIndex }));

    // Count placed answers per letter only if placed on a matching letter cell
    const counts: Record<Letter, number> = { N: 0, E: 0, X: 0, T: 0 };
    const entries = Object.entries({ ...placed, [answer.id]: cellIndex }) as [
      string,
      number
    ][];
    for (const [ansId, idx] of entries) {
      const a = answerById[ansId];
      const cellLetter = centeredCells[idx]?.letter;
      if (a && cellLetter === a.letter) counts[a.letter] += 1;
    }

    // Auto-fill any letter that reaches threshold
    const newlyFilled: Letter[] = [];
    (Object.keys(counts) as Letter[]).forEach((L) => {
      if (!filledLetters.includes(L) && counts[L] >= FILL_THRESHOLD[L])
        newlyFilled.push(L);
    });
    if (newlyFilled.length > 0) {
      // Determine wrong-placed answers that sit in newly filled letter regions
      const wrongAnsIds: string[] = [];
      const placedEntries = Object.entries({
        ...placed,
        [answer.id]: cellIndex,
      }) as [string, number][];
      for (const [ansId, idx] of placedEntries) {
        const a = answerById[ansId];
        const cellLetter = centeredCells[idx]?.letter;
        if (!a || !cellLetter) continue;
        if (newlyFilled.includes(cellLetter) && a.letter !== cellLetter) {
          wrongAnsIds.push(ansId);
        }
      }

      // Mark letters as filled and update cells
      setFilledLetters((prev) => [...prev, ...newlyFilled]);
      setCells((prev) => {
        const next = prev.map((c) => ({ ...c }));
        // Free wrong occupants in those letters
        for (let i = 0; i < next.length; i++) {
          const c = next[i];
          if (!newlyFilled.includes(c.letter)) continue;
          if (c.occupiedBy && c.occupiedBy !== AUTO_FILL) {
            const a = answerById[c.occupiedBy];
            if (!a || a.letter !== c.letter)
              next[i] = { ...c, occupiedBy: null };
          }
        }
        // Auto-fill remaining empty cells in the newly filled letters
        for (let i = 0; i < next.length; i++) {
          const c = next[i];
          if (!newlyFilled.includes(c.letter)) continue;
          if (!c.occupiedBy) next[i] = { ...c, occupiedBy: AUTO_FILL };
        }
        return next;
      });

      if (wrongAnsIds.length > 0) {
        // Reset wrong cubes back to start and un-place them
        setResetSignals((prev) => {
          const updates: Record<string, number> = { ...prev };
          for (const id of wrongAnsIds) updates[id] = (updates[id] || 0) + 1;
          return updates;
        });
        setPlaced((prev) => {
          const copy: Record<string, number> = { ...prev };
          for (const id of wrongAnsIds) delete copy[id];
          return copy;
        });
      }
    }
  };

  const allComplete = useMemo(
    () => filledLetters.length === 4,
    [filledLetters.length]
  );

  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  // Reset the game back to the initial state and refresh answers
  const resetGame = useCallback(() => {
    // Pull a fresh random set of answers for the next round
    const newAnswers = getAnswersRandom() as AnswerDef[];
    setAnswers(newAnswers);
    // Bump global reset counter so all cubes clear internal isPlaced and snap back to start
    setGlobalResetCounter((c) => c + 1);
    // Clear placed map and filled letters
    setPlaced({});
    setFilledLetters([]);
    // Clear any previous reset signals (new answers will mount at their start positions)
    setResetSignals({});
    // Restore cells to the original unoccupied arrangement
    setCells(
      rawCells.map((c) => ({
        ...c,
        occupiedBy: null,
      }))
    );
    // Clear occupancy lock
    occupiedRef.current.clear();
  }, [rawCells]);

  // When the game is complete, automatically reset after a short delay
  useEffect(() => {
    if (!allComplete) return;
    const timer = setTimeout(() => {
      resetGame();
    }, 3000);
    return () => clearTimeout(timer);
  }, [allComplete, resetGame]);

  return (
    <div className="flex items-center justify-center h-screen w-screen overflow-hidden">
      <Canvas>
        {/* Camera and controls use refs; smooth transition handled via useFrame */}
        <PerspectiveCamera
          ref={cameraRef}
          makeDefault
          position={[0, -5, 10]}
          fov={50}
        />
        <OrbitControls
          ref={controlsRef}
          target={[0, -2.4, 3]}
          enableRotate={false}
          enableZoom={false}
          enablePan={false}
        />
        <CameraAnimator
          cameraRef={cameraRef}
          controlsRef={controlsRef}
          allComplete={allComplete}
        />

        <ambientLight intensity={0.5} color="#ffffff" />
        <directionalLight
          position={[5, 5, 5]}
          intensity={0.5}
          color="#ffffff"
        />
        <Environment
          files={
            "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/dither_it_M3_Drone_Shot_equirectangular-jpg_San_Francisco_Big_City_1287677938_12251179%20(1)-NY2qcmpjkyG6rDp1cPGIdX0bHk3hMR.jpg"
          }
        />

        {/* Grid outlines */}
        <LetterGrid cells={centeredCells} />

        {/* Headings above each letter cluster */}
        {(["N", "E", "X", "T"] as Letter[]).map((L) =>
          filledLetters.includes(L) ? null : (
            <Text
              key={`heading-${L}`}
              position={[letterCenters[L], 3, 0]}
              fontSize={0.24}
              color={MAIN_COLOR}
              anchorX="center"
              anchorY="bottom"
            >
              {letterHeadings[L]}
            </Text>
          )
        )}

        {/* Brackets above headings for each letter cluster */}
        {(["N", "E", "X", "T"] as Letter[]).map((L) => {
          if (filledLetters.includes(L)) return null;
          const { minX, maxX } = letterExtents[L];
          const y = 2.9;
          const z = 0;
          const cap = 0.35;
          const pad = 0.1;
          const leftX = minX - 0.5 - pad;
          const rightX = maxX + 0.5 + pad;
          const color = SECONDARY_COLOR;
          return (
            <Line
              key={`bracket-${L}`}
              segments
              points={[
                [leftX, y, z],
                [rightX, y, z],
                [leftX, y, z],
                [leftX, y - cap, z],
                [rightX, y, z],
                [rightX, y - cap, z],
              ]}
              color={color}
              lineWidth={2}
            />
          );
        })}

        {/* Auto-filled cubes */}
        {centeredCells.map((cell, idx) =>
          cell.occupiedBy === AUTO_FILL ? (
            <StaticCube
              key={`auto-${idx}`}
              position={[cell.position[0], cell.position[1], STAGING_Z]}
              color={MAIN_COLOR}
            />
          ) : null
        )}

        {/* Placed answer cubes (lock only when their letter is filled) */}
        {Object.entries(placed).map(([ansId, cellIndex]) => {
          const a = answerById[ansId];
          const cell = centeredCells[cellIndex];
          if (!a || !cell) return null;
          if (!filledLetters.includes(a.letter)) return null;
          return (
            <StaticCube
              key={`placed-${ansId}`}
              position={[cell.position[0], cell.position[1], STAGING_Z]}
              color={MAIN_COLOR}
            />
          );
        })}

        {/* Draggable answers (remain draggable until their letter is filled) */}
        {answers.map((a, i) => {
          const isHidden = filledLetters.includes(a.letter);
          return (
            <DraggableCube
              key={a.id}
              startPos={stagingPositions[i]}
              label={a.label}
              locked={false}
              hidden={isHidden}
              resetSignal={resetSignals[a.id] || 0}
              globalResetSignal={globalResetCounter}
              onDragStart={() => {
                const cellIndex = placed[a.id];
                if (cellIndex === undefined) return;
                occupiedRef.current.delete(cellIndex);
                setCells((prev) => {
                  const next = [...prev];
                  const cell = next[cellIndex];
                  if (cell && cell.occupiedBy === a.id) {
                    next[cellIndex] = { ...cell, occupiedBy: null };
                  }
                  return next;
                });
                setPlaced((prev) => {
                  if (prev[a.id] === undefined) return prev;
                  const copy = { ...prev } as Record<string, number>;
                  delete copy[a.id];
                  return copy;
                });
              }}
              onDrop={(worldPos) => {
                const snap = trySnapAnswer(a, worldPos);
                if (
                  snap.success &&
                  snap.snapPos &&
                  typeof snap.cellIndex === "number"
                ) {
                  if (occupiedRef.current.has(snap.cellIndex)) {
                    return { success: false };
                  }
                  occupiedRef.current.add(snap.cellIndex);
                  handlePlaced(a, snap.cellIndex);
                  return { success: true, snapPos: snap.snapPos };
                }
                return { success: false };
              }}
            />
          );
        })}
      </Canvas>
    </div>
  );
}
