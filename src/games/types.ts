import type { ComponentType } from "react";

export type GameDefinition = {
  id: string;
  title: string;
  tagline: string;
  description: string;
  component: ComponentType;
};
