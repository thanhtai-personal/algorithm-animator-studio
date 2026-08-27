import * as CANNON from "cannon-es";
import type { MarbleId } from "../marble/marbleCatalog";
import { COURSE_SAMPLES, type CourseSample } from "../track/towerCourseSampler";
import type { MarbleRuntime } from "./physicsTypes";

export type MarbleImpactKind = "wall" | "obstacle" | "obstacle-strike" | "marble" | "instrument" | "roll";
export type MarbleImpactSound = (kind: MarbleImpactKind, strength: number, pan: number, variant?: number) => void;

export type CollideEvent = {
  body: CANNON.Body;
  contact?: CANNON.ContactEquation;
};

const SOUND_COOLDOWN = 0.06;
const SOUND_WINDOW_SECONDS = 0.05;
const MAX_IMPACT_SOUNDS_PER_WINDOW = 4;

function pairKey(a: MarbleId, b: MarbleId) {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

export function impactVelocity(contact: CANNON.ContactEquation | undefined, a: CANNON.Body, b?: CANNON.Body) {
  const equation = contact as (CANNON.ContactEquation & { getImpactVelocityAlongNormal?: () => number }) | undefined;
  const contactSpeed = Math.abs(equation?.getImpactVelocityAlongNormal?.() ?? 0);
  const relative = b
    ? Math.sqrt(
        (a.velocity.x - b.velocity.x) ** 2
          + (a.velocity.y - b.velocity.y) ** 2
          + (a.velocity.z - b.velocity.z) ** 2,
      )
    : a.velocity.length();
  return Math.max(contactSpeed, relative * 0.72);
}

export class MarbleInteractionSystem {
  private time = 0;
  private soundAt = new Map<string, number>();
  private soundWindowStart = 0;
  private soundWindowCount = 0;

  constructor(
    private bodyToMarble: Map<number, MarbleRuntime>,
    private trackMaterial: CANNON.Material,
    private obstacleMaterial: CANNON.Material,
    private isRaceActive: () => boolean,
    private onImpactSound?: MarbleImpactSound,
    private courseSamples: readonly CourseSample[] = COURSE_SAMPLES,
    private staticObstacleVariant = 0,
  ) {}

  setTime(seconds: number) {
    this.time = seconds;
  }

  bindMarble(runtime: MarbleRuntime) {
    runtime.body.addEventListener("collide", (event: CollideEvent) => this.handleCollision(runtime, event));
  }

  private handleCollision(runtime: MarbleRuntime, event: CollideEvent) {
    if (!runtime.alive) return;
    const otherMarble = this.bodyToMarble.get(event.body.id);
    if (otherMarble?.alive) {
      if (this.isRaceActive() && this.onImpactSound) {
        const strength = impactVelocity(event.contact, runtime.body, otherMarble.body);
        if (strength > 0.22) {
          const pan = Math.max(-1, Math.min(1, (runtime.body.position.x + otherMarble.body.position.x) / 44));
          this.emitPairSound(pairKey(runtime.id, otherMarble.id), "marble", strength, pan);
        }
      }
      return;
    }
    if (!this.isRaceActive() || !this.onImpactSound) return;

    const strength = impactVelocity(event.contact, runtime.body, event.body);
    if (strength < 0.45) return;
    const otherMaterial = event.body.material;
    if (otherMaterial === this.obstacleMaterial) {
      const moving = event.body.type === CANNON.Body.KINEMATIC
        && (event.body.angularVelocity.lengthSquared() > 0.08 || event.body.velocity.lengthSquared() > 0.2);
      this.emitSound(
        runtime,
        event.body,
        moving ? "obstacle-strike" : "obstacle",
        strength,
        moving ? 0 : this.staticObstacleVariant,
      );
      return;
    }
    if (otherMaterial === this.trackMaterial && this.isSideWallContact(runtime, event.contact)) {
      this.emitSound(runtime, event.body, "wall", strength);
    }
  }

  private isSideWallContact(runtime: MarbleRuntime, contact?: CANNON.ContactEquation) {
    if (!contact) return false;
    const sample = this.courseSamples[Math.max(0, Math.min(runtime.progressIndex, this.courseSamples.length - 1))];
    const normal = contact.ni;
    const alignment = Math.abs(normal.x * sample.normal.x + normal.y * sample.normal.y + normal.z * sample.normal.z);
    return alignment < 0.58;
  }

  private emitSound(runtime: MarbleRuntime, other: CANNON.Body, kind: MarbleImpactKind, strength: number, variant = 0) {
    const key = `${runtime.id}:${other.id}:${kind}`;
    const pan = Math.max(-1, Math.min(1, runtime.body.position.x / 22));
    this.emitPairSound(key, kind, strength, pan, variant);
  }

  private emitPairSound(key: string, kind: MarbleImpactKind, strength: number, pan: number, variant?: number) {
    const previous = this.soundAt.get(key) ?? -Infinity;
    if (this.time - previous < SOUND_COOLDOWN) return;
    if (this.time - this.soundWindowStart >= SOUND_WINDOW_SECONDS) {
      this.soundWindowStart = this.time;
      this.soundWindowCount = 0;
    }
    if (this.soundWindowCount >= MAX_IMPACT_SOUNDS_PER_WINDOW) return;
    this.soundWindowCount += 1;
    this.soundAt.set(key, this.time);
    this.onImpactSound?.(kind, Math.min(22, strength), pan, variant);
  }
}
