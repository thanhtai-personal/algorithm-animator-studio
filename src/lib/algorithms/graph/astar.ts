import type { AlgoDef } from "../types";
import { createAlgorithmWorldFrames } from "../../algorithmWorldRunner";

export const astar: AlgoDef = {
  id: "astar",
  name: "A* Pathfinding",
  category: "graph",
  code: `openSet = [start];
while (openSet.length) {
  current = node with lowest f = g + h;
  if (current === exit) return path;
  move current to closedSet;
  for (neighbor of current.neighbors) {
    if (wall || closedSet.has(neighbor)) continue;
    update g, h, f and parent when better;
  }
}
replan when real-time walls break the route;`,
  run(_arr, opts) {
    return createAlgorithmWorldFrames(opts?.worldScenario);
  },
};
