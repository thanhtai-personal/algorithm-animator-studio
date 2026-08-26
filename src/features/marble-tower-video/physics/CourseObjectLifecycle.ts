import type * as CANNON from "cannon-es";

const MARBLE_CLEARANCE = 0.035;
const CAMERA_CLEARANCE = 0.08;

export type CourseObjectId = "start-gate" | "spinner-a" | "spinner-b" | "chimes" | "piano" | "final-cross";

type CourseObjectEntry = {
  id: CourseObjectId;
  rangeEnd: number;
  bodies: CANNON.Body[];
};

export function canCullCourseObject({
  rangeEnd,
  marbleProgress,
  cameraProgress,
}: {
  rangeEnd: number;
  marbleProgress: number[];
  cameraProgress: number;
}) {
  if (!marbleProgress.length) return true;
  const lastMarble = Math.min(...marbleProgress);
  return lastMarble > rangeEnd + MARBLE_CLEARANCE
    && cameraProgress > rangeEnd + CAMERA_CLEARANCE;
}

export class CourseObjectLifecycle {
  private entries: CourseObjectEntry[] = [];
  private culled = new Set<CourseObjectId>();
  private inView = new Map<CourseObjectId, boolean>();

  register(id: CourseObjectId, rangeEnd: number, bodies: CANNON.Body[]) {
    this.entries.push({ id, rangeEnd, bodies });
    this.inView.set(id, true);
  }

  setInView(id: CourseObjectId, inView: boolean) {
    if (!this.culled.has(id)) this.inView.set(id, inView);
  }

  update(marbleProgress: number[], cameraProgress: number, world: CANNON.World) {
    this.entries.forEach((entry) => {
      if (this.culled.has(entry.id)) return;
      if (!canCullCourseObject({ rangeEnd: entry.rangeEnd, marbleProgress, cameraProgress })) return;
      if (this.inView.get(entry.id) !== false) return;
      entry.bodies.forEach((body) => {
        if (body.world === world) world.removeBody(body);
      });
      this.culled.add(entry.id);
    });
  }

  isVisible(id: CourseObjectId) {
    return !this.culled.has(id);
  }
}
