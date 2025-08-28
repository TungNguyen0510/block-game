
export type Letter = "N" | "E" | "X" | "T";

export type Cell = {
  position: [number, number, number];
  letter: Letter;
  occupiedBy: string | null;
};

export type AnswerDef = {
  id: string;
  label: string;
  letter: Letter;
};

export const AUTO_FILL = "AUTO_FILL";