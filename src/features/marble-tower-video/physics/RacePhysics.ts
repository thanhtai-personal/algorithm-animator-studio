import * as CANNON from "cannon-es";
import * as THREE from "three";
import { raceSessionStore } from "../store/RaceSessionStore";
import { MARBLES, type MarbleId } from "../marble/marbleCatalog";
import { COURSE_SAMPLES, nearestSampleIndex } from "../track/towerCourseSampler";
import { CUTS, MARBLE_RADIUS, SPECIALS, TRACK_WIDTH } from "../track/towerCourse";
import {
  buildTrackBodies,
  createBarrier,
  createChimeBumpers,
  createPianoBodies,
  createSpinner,
  spawnPoint,
} from "./buildTowerCoursePhysics";
import type { MarbleRuntime } from "./physicsTypes";
import type { RaceResult } from "../race/raceTypes";

const FIXED_STEP = 1 / 60;
const BPM = 126;
const BEAT_SECONDS = 60 / BPM;
const VIDEO_COUNTDOWN_SECONDS = 3;
const DRIVE_MIN = 4;
const DRIVE_MAX = 10;

function vec3(value: THREE.Vector3) {
  return new CANNON.Vec3(value.x, value.y, value.z);
}

export class RacePhysics {
  readonly world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) });
  readonly marbles = new Map<MarbleId, MarbleRuntime>();
  readonly pianoBodies: CANNON.Body[];
  readonly chimeBodies: CANNON.Body[];
  readonly pianoFlashUntil = Array.from({ length: 12 }, () => -1);
  readonly startGate: CANNON.Body;
  readonly spinnerA: ReturnType<typeof createSpinner>;
  readonly spinnerB: ReturnType<typeof createSpinner>;
  readonly finalCross: ReturnType<typeof createSpinner>;

  private bodyToMarble = new Map<number, MarbleRuntime>();
  private totalTime = 0;
  private raceTime = 0;
  private beatIndex = -1;
  private opened = false;
  private launched = false;
  private completed = false;
  private publishTimer = 0;
  private cutPasses = new Map<number, MarbleId[]>();
  private resolvedCuts = new Set<number>();
  private winnerId: MarbleId | null = null;
  private winnerTime = 0;
  private finishDelay = -1;
  private driveMultiplier: number;
  private pianoCombo = 0;
  private lastPianoAt = -10;

  constructor(private onComplete: (result: RaceResult) => void, driveMultiplier = 6) {
    this.driveMultiplier = Math.max(DRIVE_MIN, Math.min(DRIVE_MAX, driveMultiplier));
    raceSessionStore.reset();
    this.world.allowSleep = false;
    this.world.broadphase = new CANNON.SAPBroadphase(this.world);
    const solver = new CANNON.GSSolver();
    solver.iterations = 14;
    solver.tolerance = 0.001;
    this.world.solver = solver;

    const marbleMaterial = new CANNON.Material("marble");
    const trackMaterial = new CANNON.Material("track");
    const obstacleMaterial = new CANNON.Material("obstacle");
    this.world.addContactMaterial(new CANNON.ContactMaterial(marbleMaterial, trackMaterial, {
      friction: 0.075,
      restitution: 0.11,
      contactEquationStiffness: 1e8,
    }));
    this.world.addContactMaterial(new CANNON.ContactMaterial(marbleMaterial, obstacleMaterial, {
      friction: 0.07,
      restitution: 0.58,
    }));
    this.world.addContactMaterial(new CANNON.ContactMaterial(marbleMaterial, marbleMaterial, {
      friction: 0.035,
      restitution: 0.38,
    }));

    buildTrackBodies(this.world, trackMaterial);
    this.createMarbles(marbleMaterial);
    this.startGate = createBarrier(this.world, obstacleMaterial, SPECIALS.startGate, 0.8);
    this.spinnerA = createSpinner(this.world, obstacleMaterial, SPECIALS.spinnerA, 2.25);
    this.spinnerB = createSpinner(this.world, obstacleMaterial, SPECIALS.spinnerB, -1.95);
    this.finalCross = createSpinner(this.world, obstacleMaterial, SPECIALS.finalCross, 2.5);
    this.finalCross.body.addShape(new CANNON.Box(new CANNON.Vec3(0.17, 0.14, TRACK_WIDTH * 0.43)));
    this.chimeBodies = createChimeBumpers(this.world, obstacleMaterial);
    this.pianoBodies = createPianoBodies(this.world, trackMaterial, (index, body) => this.pianoHit(index, body));
    this.publishSnapshot();
  }

  setDriveMultiplier(value: number) {
    this.driveMultiplier = Math.max(DRIVE_MIN, Math.min(DRIVE_MAX, value));
  }

  private createMarbles(material: CANNON.Material) {
    MARBLES.forEach((marble, index) => {
      const start = spawnPoint(index);
      const body = new CANNON.Body({
        mass: 1,
        material,
        shape: new CANNON.Sphere(MARBLE_RADIUS),
        position: vec3(start),
        linearDamping: 0.022,
        angularDamping: 0.012,
      });
      body.allowSleep = false;
      this.world.addBody(body);
      const runtime: MarbleRuntime = {
        id: marble.id,
        body,
        alive: true,
        progressIndex: 0,
        previousProgress: 0,
        stuckFor: 0,
        finalPosition: null,
        crossedCuts: new Set(),
        hitJump: false,
      };
      this.marbles.set(marble.id, runtime);
      this.bodyToMarble.set(body.id, runtime);
    });
  }

  step(delta: number) {
    if (this.completed) return;
    const dt = Math.min(0.05, Math.max(0, delta));
    this.totalTime += dt;

    if (!this.opened && this.totalTime >= VIDEO_COUNTDOWN_SECONDS) {
      this.opened = true;
      // The gate can keep moving visually, but it must stop blocking the launch.
      this.startGate.collisionResponse = false;
      this.startGate.collisionFilterMask = 0;
      raceSessionStore.flash("GO!");
    }

    if (this.opened) this.raceTime += dt;
    this.updateGate(dt);

    if (this.opened && !this.launched && this.raceTime >= 0.12) {
      this.launched = true;
      this.launchMarbles();
    }

    this.updateBeatObstacles();
    this.world.step(FIXED_STEP, dt, 5);
    if (this.opened) this.updateRace(dt);

    if (this.finishDelay >= 0) {
      this.finishDelay -= dt;
      if (this.finishDelay <= 0) this.completeRace();
    }

    this.publishTimer += dt;
    if (this.publishTimer >= 0.075) {
      this.publishTimer = 0;
      this.publishSnapshot();
    }
  }

  advanceTo(targetSeconds: number) {
    const target = Math.max(0, targetSeconds);
    let guard = 0;
    while (!this.completed && this.totalTime + FIXED_STEP < target && guard < 36000) {
      this.step(FIXED_STEP);
      guard += 1;
    }
    if (!this.completed && this.totalTime < target) this.step(target - this.totalTime);
  }

  private launchMarbles() {
    for (const marble of this.marbles.values()) {
      const sample = COURSE_SAMPLES[Math.max(0, marble.progressIndex)];
      const launchStrength = this.driveMultiplier * 1.18;
      const impulse = sample.tangent.clone().multiplyScalar(launchStrength).addScaledVector(sample.normal, 0.12);
      marble.body.applyImpulse(vec3(impulse));
      marble.body.angularVelocity.set(0, 0, 0);
    }
  }

  private updateGate(dt: number) {
    const sample = COURSE_SAMPLES[Math.round(SPECIALS.startGate * (COURSE_SAMPLES.length - 1))];
    const closed = sample.point.clone().addScaledVector(sample.normal, 0.95);
    const target = this.opened ? closed.clone().addScaledVector(sample.normal, 4.0) : closed;
    const current = new THREE.Vector3(this.startGate.position.x, this.startGate.position.y, this.startGate.position.z);
    const velocity = target.sub(current).multiplyScalar(Math.min(8, 5.4 / Math.max(dt, 0.001)) * dt);
    this.startGate.velocity.set(
      velocity.x / Math.max(dt, 0.001),
      velocity.y / Math.max(dt, 0.001),
      velocity.z / Math.max(dt, 0.001),
    );
  }

  private updateBeatObstacles() {
    const beat = Math.floor(this.raceTime / BEAT_SECONDS);
    if (this.opened && beat !== this.beatIndex) this.beatIndex = beat;
    const pulse = beat % 4 === 3 ? 1.32 : 1;
    for (const spinner of [this.spinnerA, this.spinnerB, this.finalCross]) {
      const normal = spinner.sample.normal;
      const speed = spinner.speed * pulse;
      spinner.body.angularVelocity.set(normal.x * speed, normal.y * speed, normal.z * speed);
    }
  }

  private updateRace(dt: number) {
    for (const marble of this.marbles.values()) {
      if (!marble.alive) continue;
      const body = marble.body;
      const previous = marble.progressIndex;
      marble.progressIndex = nearestSampleIndex(body.position, marble.progressIndex);
      const progress = marble.progressIndex / (COURSE_SAMPLES.length - 1);
      const sample = COURSE_SAMPLES[marble.progressIndex];
      const dx = body.position.x - sample.point.x;
      const dy = body.position.y - sample.point.y;
      const dz = body.position.z - sample.point.z;
      const distanceSq = dx * dx + dy * dy + dz * dz;

      if (body.position.y < -8 || distanceSq > 90) {
        this.eliminate(marble, "OUT OF BOUNDS");
        continue;
      }

      if (!marble.hitJump && progress >= SPECIALS.jump) {
        marble.hitJump = true;
        const impulse = sample.tangent.clone().multiplyScalar(2 + this.driveMultiplier * 0.18).addScaledVector(sample.normal, 2.0);
        body.applyImpulse(vec3(impulse));
        if (marble === this.getLeader()) raceSessionStore.flash("SKY JUMP!");
      }

      this.applyRollingDrag(marble);
      const speed = body.velocity.length();
      const moved = Math.max(0, marble.progressIndex - previous);
      marble.stuckFor = speed < 0.24 && moved === 0 ? marble.stuckFor + dt : 0;
      if (marble.stuckFor > 2.8) {
        marble.stuckFor = 0;
        const impulse = sample.tangent.clone().multiplyScalar(0.55 * this.driveMultiplier).addScaledVector(sample.normal, 0.45);
        body.applyImpulse(vec3(impulse));
        if (marble === this.getLeader()) raceSessionStore.flash("RECOVERY");
      }
      marble.previousProgress = progress;
    }
    this.resolveCuts();
    this.resolveFinish();
  }

  private applyRollingDrag(marble: MarbleRuntime) {
    const speed = marble.body.velocity.length();
    const softLimit = 7.6 + this.driveMultiplier * 1.2;
    if (speed <= softLimit) return;
    const factor = (speed - softLimit) * 0.22;
    marble.body.applyForce(new CANNON.Vec3(
      -marble.body.velocity.x * factor,
      -marble.body.velocity.y * factor * 0.18,
      -marble.body.velocity.z * factor,
    ));
  }

  private resolveCuts() {
    for (let cutIndex = 0; cutIndex < CUTS.length; cutIndex += 1) {
      if (this.resolvedCuts.has(cutIndex)) continue;
      const cut = CUTS[cutIndex];
      const alive = this.getRanked().filter((item) => item.alive);
      const keep = Math.min(cut.keep, alive.length);
      const passed = this.cutPasses.get(cutIndex) ?? [];
      alive.forEach((marble) => {
        const progress = marble.progressIndex / (COURSE_SAMPLES.length - 1);
        if (progress >= cut.progress && passed.length < keep && !passed.includes(marble.id)) passed.push(marble.id);
      });
      this.cutPasses.set(cutIndex, passed);
      if (passed.length < keep || keep === 0) continue;

      this.resolvedCuts.add(cutIndex);
      const survivors = new Set(passed);
      const eliminated = alive.filter((marble) => !survivors.has(marble.id));
      eliminated.forEach((marble, index) => {
        marble.finalPosition = keep + 1 + index;
        this.eliminate(marble, cut.label, false);
      });
      raceSessionStore.flash(cut.label);
    }
  }

  private resolveFinish() {
    if (this.winnerId) return;
    const leader = this.getLeader();
    if (!leader) return;
    const progress = leader.progressIndex / (COURSE_SAMPLES.length - 1);
    if (progress < SPECIALS.finish) return;

    this.winnerId = leader.id;
    this.winnerTime = this.raceTime;
    leader.finalPosition = 1;
    const finalists = this.getRanked().filter((marble) => marble.alive && marble.id !== leader.id);
    finalists.forEach((marble, index) => { marble.finalPosition = 2 + index; });
    raceSessionStore.flash(`${leader.id.toUpperCase()} WINS!`);
    this.finishDelay = 1.45;
  }

  private eliminate(marble: MarbleRuntime, reason: string, assignPosition = true) {
    if (!marble.alive) return;
    if (assignPosition && marble.finalPosition === null) {
      marble.finalPosition = this.getRanked().filter((item) => item.alive).length;
    }
    const wasLeader = this.getLeader()?.id === marble.id;
    marble.alive = false;
    this.world.removeBody(marble.body);
    if (wasLeader) raceSessionStore.flash(reason);
  }

  private completeRace() {
    if (this.completed || !this.winnerId) return;
    this.completed = true;
    this.publishSnapshot();
    this.onComplete({
      position: 1,
      winnerId: this.winnerId,
      timeMs: Math.round(this.winnerTime * 1000),
      eliminated: false,
      points: 160,
    });
  }

  private pianoHit(index: number, body: CANNON.Body) {
    const marble = this.bodyToMarble.get(body.id);
    if (!marble?.alive) return;
    const now = this.raceTime;
    if (this.pianoFlashUntil[index] > now - 0.05) return;
    this.pianoFlashUntil[index] = now + 0.22;
    this.pianoCombo = now - this.lastPianoAt < 0.8 ? this.pianoCombo + 1 : 1;
    this.lastPianoAt = now;
  }

  getRanked() {
    return [...this.marbles.values()].sort((a, b) => {
      if (a.alive !== b.alive) return a.alive ? -1 : 1;
      if (!a.alive && !b.alive && a.finalPosition !== b.finalPosition) return (a.finalPosition ?? 99) - (b.finalPosition ?? 99);
      return b.progressIndex - a.progressIndex;
    });
  }

  getLeader() {
    return this.getRanked().find((marble) => marble.alive) ?? null;
  }

  pianoGlow(index: number) {
    return this.pianoFlashUntil[index] > this.raceTime;
  }

  getMarble(id: MarbleId) {
    return this.marbles.get(id) ?? null;
  }

  private publishSnapshot() {
    const ranked = this.getRanked();
    const leader = this.getLeader();
    const leaderProgress = leader ? leader.progressIndex / (COURSE_SAMPLES.length - 1) : 0;
    const section = COURSE_SAMPLES[Math.round(leaderProgress * (COURSE_SAMPLES.length - 1))]?.section.label ?? "FINISH";
    const nextCut = CUTS.find((_, index) => !this.resolvedCuts.has(index));
    raceSessionStore.apply({
      phase: this.completed ? "finished" : this.opened ? "racing" : "countdown",
      countdown: this.opened ? 0 : Math.max(0, Math.ceil(VIDEO_COUNTDOWN_SECONDS - this.totalTime)),
      elapsedMs: Math.round(this.raceTime * 1000),
      leaderId: leader?.id ?? this.winnerId,
      alive: ranked.filter((marble) => marble.alive).length,
      speed: leader?.body.velocity.length() ?? 0,
      nextCut: nextCut?.label ?? section,
      pianoCombo: this.pianoCombo,
      standings: ranked.map((marble, index) => ({
        id: marble.id,
        position: marble.alive ? index + 1 : marble.finalPosition ?? index + 1,
        alive: marble.alive,
        progress: marble.progressIndex / (COURSE_SAMPLES.length - 1),
      })),
    });
  }

  dispose() {
    this.world.bodies.slice().forEach((body) => this.world.removeBody(body));
  }
}
