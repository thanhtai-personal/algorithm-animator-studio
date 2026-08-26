import * as THREE from "three";
import { COURSE_CURVE, COURSE_SECTIONS, SAMPLE_COUNT } from "./towerCourse";

export type CourseSection = {
  from: number;
  to: number;
  id: string;
  label: string;
  style: string;
};

export interface CourseSample {
  index: number;
  progress: number;
  point: THREE.Vector3;
  tangent: THREE.Vector3;
  right: THREE.Vector3;
  normal: THREE.Vector3;
  quaternion: THREE.Quaternion;
  lengthToNext: number;
  section: CourseSection;
}

const UP = new THREE.Vector3(0, 1, 0);

function sectionAt(progress: number, sections: readonly CourseSection[]) {
  return sections.find((section) => progress >= section.from && progress < section.to)
    ?? sections[sections.length - 1];
}

export function buildCourseSamplesFor(
  curve: THREE.CatmullRomCurve3,
  sections: readonly CourseSection[],
  sampleCount: number,
): CourseSample[] {
  const points = Array.from({ length: sampleCount }, (_, index) => {
    const progress = index / (sampleCount - 1);
    return curve.getPointAt(progress);
  });

  return points.map((point, index) => {
    const progress = index / (sampleCount - 1);
    const tangent = curve.getTangentAt(progress).normalize();
    let right = new THREE.Vector3().crossVectors(UP, tangent);
    if (right.lengthSq() < 0.001) right = new THREE.Vector3(1, 0, 0);
    right.normalize();
    const normal = new THREE.Vector3().crossVectors(tangent, right).normalize();
    const matrix = new THREE.Matrix4().makeBasis(right, normal, tangent);
    const quaternion = new THREE.Quaternion().setFromRotationMatrix(matrix);
    const next = points[Math.min(index + 1, points.length - 1)];
    return {
      index,
      progress,
      point,
      tangent,
      right,
      normal,
      quaternion,
      lengthToNext: Math.max(0.15, point.distanceTo(next)),
      section: sectionAt(progress, sections),
    };
  });
}

export const COURSE_SAMPLES = buildCourseSamplesFor(COURSE_CURVE, COURSE_SECTIONS, SAMPLE_COUNT);

export function sampleAt(progress: number) {
  const index = Math.round(THREE.MathUtils.clamp(progress, 0, 1) * (COURSE_SAMPLES.length - 1));
  return COURSE_SAMPLES[index];
}

export function nearestSampleIndexIn(
  samples: readonly CourseSample[],
  position: { x: number; y: number; z: number },
  hint = 0,
) {
  const start = Math.max(0, hint - 18);
  const end = Math.min(samples.length - 1, hint + 30);
  let best = Math.max(0, Math.min(hint, samples.length - 1));
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let index = start; index <= end; index += 1) {
    const point = samples[index].point;
    const distance = (point.x - position.x) ** 2 + (point.y - position.y) ** 2 + (point.z - position.z) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = index;
    }
  }
  return best;
}

export function nearestSampleIndex(position: { x: number; y: number; z: number }, hint = 0) {
  return nearestSampleIndexIn(COURSE_SAMPLES, position, hint);
}
