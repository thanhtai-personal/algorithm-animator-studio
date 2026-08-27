import { COURSE_SAMPLES } from "./towerCourseSampler";
import { CUTS, SPECIALS, TOWER_RACE_MAP_ID, TRACK_WIDTH } from "./towerCourse";
import {
  OLYMPIC_ROAD_CUTS,
  OLYMPIC_ROAD_MAP_ID,
  OLYMPIC_ROAD_OBSTACLES,
  OLYMPIC_ROAD_SAMPLES,
  OLYMPIC_ROAD_SPECIALS,
  OLYMPIC_TRACK_WIDTH,
} from "./olympicRoadCourse";
import type { OlympicRoadObstacle } from "./olympicRoadCourse";

export type RaceMapId = typeof TOWER_RACE_MAP_ID | typeof OLYMPIC_ROAD_MAP_ID;

export type RaceCourseDefinition = {
  id: RaceMapId;
  label: string;
  description: string;
  samples: typeof COURSE_SAMPLES;
  trackWidth: number;
  cuts: readonly { progress: number; keep: number; label: string }[];
  specials: {
    startGate: number;
    spinnerA: number;
    spinnerB: number;
    chimeStart: number;
    chimeEnd: number;
    pianoStart: number;
    pianoEnd: number;
    jump: number;
    tunnelStart: number;
    tunnelEnd: number;
    finalCross: number;
    finish: number;
  };
  towerInstruments: boolean;
  studioCollision: boolean;
  roadObstacles: readonly OlympicRoadObstacle[];
  obstacleSoundVariant: number;
};

export const ORIGINAL_TOWER_COURSE: RaceCourseDefinition = {
  id: TOWER_RACE_MAP_ID,
  label: "Map 1 · Tower Run",
  description: "Rainbow tower, piano bridge, tunnel và chướng ngại nhiều tầng.",
  samples: COURSE_SAMPLES,
  trackWidth: TRACK_WIDTH,
  cuts: CUTS,
  specials: SPECIALS,
  towerInstruments: true,
  studioCollision: true,
  roadObstacles: [],
  obstacleSoundVariant: 0,
};

export const OLYMPIC_ROAD_COURSE: RaceCourseDefinition = {
  id: OLYMPIC_ROAD_MAP_ID,
  label: "Map 2 · Olympic Road",
  description: "Template tabletop theo video: U-turn lớn, spiral bowl, cầu/S-bend và ranking chute.",
  samples: OLYMPIC_ROAD_SAMPLES,
  trackWidth: OLYMPIC_TRACK_WIDTH,
  cuts: OLYMPIC_ROAD_CUTS,
  specials: OLYMPIC_ROAD_SPECIALS,
  towerInstruments: false,
  studioCollision: false,
  roadObstacles: OLYMPIC_ROAD_OBSTACLES,
  obstacleSoundVariant: 1,
};

export const RACE_MAPS = [ORIGINAL_TOWER_COURSE, OLYMPIC_ROAD_COURSE] as const;

export function raceCourseForMap(mapId: RaceMapId) {
  return mapId === OLYMPIC_ROAD_MAP_ID ? OLYMPIC_ROAD_COURSE : ORIGINAL_TOWER_COURSE;
}
