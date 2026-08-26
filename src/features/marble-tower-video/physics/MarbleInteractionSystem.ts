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

const MAGNETIC_ACCELERATION = 22;
const PAIR_BOUNCE_COOLDOWN = 0.085;
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
  private pairBounceAt = new Map<string, number>();
  private soundAt = new Map<string, number>();
  private soundWindowStart = 0;
  private soundWindowCount = 0;
  private magneticRadius: number;
  private aliveScratch: MarbleRuntime[] = [];
  private magneticBuckets = new Map<number, MarbleRuntime[]>();
  private magneticBucketPool: MarbleRuntime[][] = [];
  private magneticForceA = new CANNON.Vec3();
  private magneticForceB = new CANNON.Vec3();
  private bounceImpulseA = new CANNON.Vec3();
  private bounceImpulseB = new CANNON.Vec3();

  constructor(
    private bodyToMarble: Map<number, MarbleRuntime>,
    private trackMaterial: CANNON.Material,
    private obstacleMaterial: CANNON.Material,
    private isRaceActive: () => boolean,
    private onImpactSound?: MarbleImpactSound,
    marbleRadius = 0.48,
    private courseSamples: readonly CourseSample[] = COURSE_SAMPLES,
    private staticObstacleVariant = 0,
  ) {
    this.magneticRadius = marbleRadius * 2.55;
  }

  setTime(seconds: number) {
    this.time = seconds;
  }

  bindMarble(runtime: MarbleRuntime) {
    runtime.body.addEventListener("collide", (event: CollideEvent) => this.handleCollision(runtime, event));
  }

  applyMagneticField(marbles: Iterable<MarbleRuntime>) {
    const alive = this.aliveScratch;
    alive.length = 0;
    for (const marble of marbles) {
      if (marble.alive) alive.push(marble);
    }
    if (alive.length < 2) return;

    const cellSize = this.magneticRadius;
    const cell = (value: number) => Math.floor(value / cellSize);
    // The tower course stays well within this range. Numeric keys avoid allocating
    // 28+ strings per marble on every physics step.
    const keyOf = (x: number, y: number, z: number) => (x + 1024) * 4_194_304 + (y + 1024) * 2_048 + (z + 1024);
    const buckets = this.magneticBuckets;

    for (const marble of alive) {
      const { position } = marble.body;
      const key = keyOf(cell(position.x), cell(position.y), cell(position.z));
      let bucket = buckets.get(key);
      if (!bucket) {
        bucket = this.magneticBucketPool.pop() ?? [];
        buckets.set(key, bucket);
      }
      bucket.push(marble);
    }

    const radiusSq = this.magneticRadius * this.magneticRadius;
    const forceA = this.magneticForceA;
    const forceB = this.magneticForceB;
    for (const aRuntime of alive) {
      const a = aRuntime.body;
      const cx = cell(a.position.x);
      const cy = cell(a.position.y);
      const cz = cell(a.position.z);
      for (let ox = -1; ox <= 1; ox += 1) {
        for (let oy = -1; oy <= 1; oy += 1) {
          for (let oz = -1; oz <= 1; oz += 1) {
            const candidates = buckets.get(keyOf(cx + ox, cy + oy, cz + oz));
            if (!candidates) continue;
            for (const bRuntime of candidates) {
              if (aRuntime.id >= bRuntime.id) continue;
              if (Math.abs(aRuntime.progressIndex - bRuntime.progressIndex) > 10) continue;
              const b = bRuntime.body;
              const dx = a.position.x - b.position.x;
              const dy = a.position.y - b.position.y;
              const dz = a.position.z - b.position.z;
              const distanceSq = dx * dx + dy * dy + dz * dz;
              if (distanceSq <= 1e-8 || distanceSq >= radiusSq) continue;
              const distance = Math.sqrt(distanceSq);
              const proximity = 1 - distance / this.magneticRadius;
              const acceleration = MAGNETIC_ACCELERATION * proximity * proximity;
              const nx = dx / distance;
              const ny = dy / distance;
              const nz = dz / distance;
              forceA.set(nx * acceleration * a.mass, ny * acceleration * a.mass, nz * acceleration * a.mass);
              forceB.set(-nx * acceleration * b.mass, -ny * acceleration * b.mass, -nz * acceleration * b.mass);
              a.applyForce(forceA);
              b.applyForce(forceB);
            }
          }
        }
      }
    }

    for (const bucket of buckets.values()) {
      bucket.length = 0;
      this.magneticBucketPool.push(bucket);
    }
    buckets.clear();
  }

  private handleCollision(runtime: MarbleRuntime, event: CollideEvent) {
    if (!runtime.alive) return;
    const otherMarble = this.bodyToMarble.get(event.body.id);
    if (otherMarble?.alive) {
      this.applyMagneticBounce(runtime, otherMarble);
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

  private applyMagneticBounce(a: MarbleRuntime, b: MarbleRuntime) {
    const key = pairKey(a.id, b.id);
    const previous = this.pairBounceAt.get(key) ?? -Infinity;
    if (this.time - previous < PAIR_BOUNCE_COOLDOWN) return;
    this.pairBounceAt.set(key, this.time);

    let dx = a.body.position.x - b.body.position.x;
    let dy = a.body.position.y - b.body.position.y;
    let dz = a.body.position.z - b.body.position.z;
    let distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (distance < 1e-5) {
      dx = a.id < b.id ? -1 : 1;
      dy = 0.06;
      dz = 0;
      distance = Math.sqrt(dx * dx + dy * dy);
    }
    const nx = dx / distance;
    const ny = dy / distance;
    const nz = dz / distance;
    const rvx = a.body.velocity.x - b.body.velocity.x;
    const rvy = a.body.velocity.y - b.body.velocity.y;
    const rvz = a.body.velocity.z - b.body.velocity.z;
    const closingSpeed = Math.max(0, -(rvx * nx + rvy * ny + rvz * nz));
    const separationSpeed = 0.72 + Math.min(2.4, closingSpeed * 0.34);
    const magnitude = Math.min(a.body.mass, b.body.mass) * separationSpeed;
    this.bounceImpulseA.set(nx * magnitude, ny * magnitude, nz * magnitude);
    this.bounceImpulseB.set(-this.bounceImpulseA.x, -this.bounceImpulseA.y, -this.bounceImpulseA.z);
    a.body.applyImpulse(this.bounceImpulseA);
    b.body.applyImpulse(this.bounceImpulseB);
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
