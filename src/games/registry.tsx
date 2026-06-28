import type { GameDefinition } from "./types";
import { GateRush } from "./samples/GateRush";

export const games: GameDefinition[] = [
  {
    id: "gate-rush",
    title: "Gate Rush",
    tagline: "Choose the better gate before the crowd hits zero.",
    description:
      "A small playable scaffold for the familiar ad-style number gate runner game.",
    component: GateRush,
  },
];

export function findGame(gameId: string | null): GameDefinition | undefined {
  if (!gameId) {
    return undefined;
  }

  return games.find((game) => game.id === gameId);
}
