import type { GameDefinition } from "./types";
import { BinarySketch } from "./drawing/BinarySketch";
import { ArmWorkoutTracker } from "./fitness/ArmWorkoutTracker";
import { GateRush } from "./samples/GateRush";
import { WordStream } from "./word-stream/WordStream";

export const games: GameDefinition[] = [
  {
    id: "arm-workout",
    title: "Arm Workout Tracker",
    tagline: "Log every set quickly and sync it to Google Sheets.",
    description:
      "A mobile-first arm workout logger with automatic local saving, optional Google Sheets sync, and JSON or CSV export for ChatGPT analysis.",
    component: ArmWorkoutTracker,
  },
  {
    id: "word-stream",
    title: "Word Stream",
    tagline: "Hear English and Japanese word pairs on an adjustable loop.",
    description:
      "A Web Speech API demo that reads 500 word pairs in an English, Japanese, English, Japanese sequence before choosing the next word at random.",
    component: WordStream,
  },
  {
    id: "binary-sketch",
    title: "Binary Sketch",
    tagline: "Draw a black-and-white sketch on canvas and share it as a PNG.",
    description:
      "A tiny two-color drawing app: draw with black, erase with white, then use the share button to send the PNG to LINE.",
    component: BinarySketch,
  },
  {
    id: "gate-rush",
    title: "Gate Rush",
    tagline: "Run forward in 3D, switch lanes, and hit the best number gates.",
    description:
      "A playable 3D-style number gate runner: steer left or right, grow the crowd, and reach the finish target.",
    component: GateRush,
  },
];

export function findGame(gameId: string | null): GameDefinition | undefined {
  if (!gameId) {
    return undefined;
  }

  return games.find((game) => game.id === gameId);
}
