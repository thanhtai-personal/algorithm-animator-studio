import type { CourseSample } from "./towerCourseSampler";

const SUPPORT_ROAD_CLEARANCE = 0.75;
const LOCAL_SAMPLE_SPAN = 20;

export function courseSupportSamples(
  samples: readonly CourseSample[],
  trackWidth: number,
  stride = 12,
  offset = 6,
) {
  return samples
    .filter((_, index) => index >= offset && index % stride === offset)
    .filter((owner) => {
      const supportTop = owner.point.y - 0.48;
      return !samples.some((sample) => {
        if (Math.abs(sample.index - owner.index) <= LOCAL_SAMPLE_SPAN) return false;
        if (sample.point.y >= supportTop) return false;
        const horizontalDistance = Math.hypot(
          sample.point.x - owner.point.x,
          sample.point.z - owner.point.z,
        );
        return horizontalDistance < trackWidth / 2 + SUPPORT_ROAD_CLEARANCE;
      });
    });
}
