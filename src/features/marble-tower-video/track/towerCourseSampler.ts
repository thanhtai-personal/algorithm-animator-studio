import * as THREE from "three";
import { COURSE_CURVE, COURSE_SECTIONS, SAMPLE_COUNT } from "./towerCourse";

export interface CourseSample {
  index: number;
  progress: number;
  point: THREE.Vector3;
  tangent: THREE.Vector3;
  right: THREE.Vector3;
  normal: THREE.Vector3;
  quaternion: THREE.Quaternion;
  lengthToNext: number;
  section: (typeof COURSE_SECTIONS)[number];
}

const UP = new THREE.Vector3(0, 1, 0);

function sectionAt(progress: number) {
  return COURSE_SECTIONS.find((section) => progress >= section.from && progress < section.to)
    ?? COURSE_SECTIONS[COURSE_SECTIONS.length - 1];
}

export function buildCourseSamples(): CourseSample[] {
  const points = Array.from({ length: SAMPLE_COUNT }, (_, index) => {
    const progress = index / (SAMPLE_COUNT - 1);
    return COURSE_CURVE.getPointAt(progress);
  });

  return points.map((point, index) => {
    const progress = index / (SAMPLE_COUNT - 1);
    const tangent = COURSE_CURVE.getTangentAt(progress).normalize();
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
      section: sectionAt(progress),
    };
  });
}

export const COURSE_SAMPLES = buildCourseSamples();

export function sampleAt(progress: number) {
  const index = Math.round(THREE.MathUtils.clamp(progress, 0, 1) * (COURSE_SAMPLES.length - 1));
  return COURSE_SAMPLES[index];
}

export function nearestSampleIndex(position: { x: number; y: number; z: number }, hint = 0) {
  const start = Math.max(0, hint - 18);
  const end = Math.min(COURSE_SAMPLES.length - 1, hint + 30);
  let best = hint;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let index = start; index <= end; index += 1) {
    const point = COURSE_SAMPLES[index].point;
    const distance = (point.x - position.x) ** 2 + (point.y - position.y) ** 2 + (point.z - position.z) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = index;
    }
  }
  return best;
}
