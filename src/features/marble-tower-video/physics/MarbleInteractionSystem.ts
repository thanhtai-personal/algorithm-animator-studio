import * as CANNON from "cannon-es";
import type { MarbleId } from "../marble/marbleCatalog";
import { COURSE_SAMPLES } from "../track/towerCourseSampler";
import { MARBLE_RADIUS } from "../track/towerCourse";
import type { MarbleRuntime } from "./physicsTypes";

export type MarbleImpactKind = "wall" | "obstacle" | "obstacle-strike" | "marble" | "instrument";
export type MarbleImpactSound = (kind: MarbleImpactKind, strength: number, pan: number, variant?: number) => void;

export type CollideEvent = {
  body: CANNON.Body;
  contact?: CANNON.ContactEquation;
};

const MAGNETIC_RADIUS = MARBLE_RADIUS * 2.55;
const MAGNETIC_ACCELERATION = 22;
const PAIR_BOUNCE_COOLDOWN = 0.085;
const SOUND_COOLDOWN = 0.048;

function pairKey(a: MarbleId, b: MarbleId) {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

export function impactVelocity(contact: CANNON.ContactEquation | undefined, a: CANNON.Body, b?: CANNON.Body) {
  const equation = contact as (CANNON.ContactEquation & { getImpactVelocityAlongNormal?: () => number }) | undefined;
  const contactSpeed = Math.abs(equation?.getImpactVelocityAlongNormal?.() ?? 0);
  const relative = b ? a.velocity.vsub(b.velocity).length() : a.velocity.length();
  return Math.max(contactSpeed, relative * 0.72);
}

export class MarbleInteractionSystem {
  private time = 0;
  private pairBounceAt = new Map<string, number>();
  private soundAt = new Map<string, number>();

  constructor(
    private bodyToMarble: Map<number, MarbleRuntime>,
    private trackMaterial: CANNON.Material,
    private obstacleMaterial: CANNON.Material,
    private isRaceActive: () => boolean,
    private onImpactSound?: MarbleImpactSound,
  ) {}

  setTime(seconds: number) {
    this.time = seconds;
  }

  bindMarble(runtime: MarbleRuntime) {
    runtime.body.addEventListener("collide", (event: CollideEvent) => this.handleCollision(runtime, event));
  }

  applyMagneticField(marbles: Iterable<MarbleRuntime>) {
    const alive = [...marbles].filter((marble) => marble.alive);
    for (let i = 0; i < alive.length; i += 1) {
      for (let j = i + 1; j < alive.length; j += 1) {
        if (Math.abs(alive[i].progressIndex - alive[j].progressIndex) > 10) continue;
        const a = alive[i].body;
        const b = alive[j].body;
        const dx = a.position.x - b.position.x;
        const dy = a.position.y - b.position.y;
        const dz = a.position.z - b.position.z;
        const distanceSq = dx * dx + dy * dy + dz * dz;
        if (distanceSq <= 1e-8 || distanceSq >= MAGNETIC_RADIUS * MAGNETIC_RADIUS) continue;
        const distance = Math.sqrt(distanceSq);
        const proximity = 1 - distance / MAGNETIC_RADIUS;
        const acceleration = MAGNETIC_ACCELERATION * proximity * proximity;
        const nx = dx / distance;
        const ny = dy / distance;
        const nz = dz / distance;
        a.applyForce(new CANNON.Vec3(nx * acceleration * a.mass, ny * acceleration * a.mass, nz * acceleration * a.mass));
        b.applyForce(new CANNON.Vec3(-nx * acceleration * b.mass, -ny * acceleration * b.mass, -nz * acceleration * b.mass));
      }
    }
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
      this.emitSound(runtime, event.body, moving ? "obstacle-strike" : "obstacle", strength);
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
    const impulse = new CANNON.Vec3(nx * magnitude, ny * magnitude, nz * magnitude);
    a.body.applyImpulse(impulse);
    b.body.applyImpulse(new CANNON.Vec3(-impulse.x, -impulse.y, -impulse.z));
  }

  private isSideWallContact(runtime: MarbleRuntime, contact?: CANNON.ContactEquation) {
    if (!contact) return false;
    const sample = COURSE_SAMPLES[Math.max(0, Math.min(runtime.progressIndex, COURSE_SAMPLES.length - 1))];
    const normal = contact.ni;
    const alignment = Math.abs(normal.x * sample.normal.x + normal.y * sample.normal.y + normal.z * sample.normal.z);
    return alignment < 0.58;
  }

  private emitSound(runtime: MarbleRuntime, other: CANNON.Body, kind: MarbleImpactKind, strength: number) {
    const key = `${runtime.id}:${other.id}:${kind}`;
    const pan = Math.max(-1, Math.min(1, runtime.body.position.x / 22));
    this.emitPairSound(key, kind, strength, pan);
  }

  private emitPairSound(key: string, kind: MarbleImpactKind, strength: number, pan: number, variant?: number) {
    const previous = this.soundAt.get(key) ?? -Infinity;
    if (this.time - previous < SOUND_COOLDOWN) return;
    this.soundAt.set(key, this.time);
    this.onImpactSound?.(kind, Math.min(22, strength), pan, variant);
  }
}
