import type { GameDefinition } from "./types";
import { GateRush } from "./samples/GateRush";

export const games: GameDefinition[] = [
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
