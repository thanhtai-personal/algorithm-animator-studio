import * as CANNON from "cannon-es";
import * as THREE from "three";
import { raceSessionStore } from "../store/RaceSessionStore";
import { createMarbleRoster, type MarbleConfig, type MarbleId } from "../marble/marbleCatalog";
import { marbleStartGrid, normalizeMarbleCount } from "../marble/marbleGrid";
import { COURSE_SAMPLES, nearestSampleIndex } from "../track/towerCourseSampler";
import { CUTS, SPECIALS, TRACK_WIDTH } from "../track/towerCourse";
import { pianoPadAt } from "../track/pianoPadLayout";
import {
  buildTrackBodies,
  createBarrier,
  createChimeBumpers,
  createPianoBodies,
  createSpinner,
  createSupportBodies,
  createStartGridBody,
  spawnPoint,
} from "./buildTowerCoursePhysics";
import type { MarbleRuntime } from "./physicsTypes";
import { impactVelocity, MarbleInteractionSystem, type MarbleImpactSound } from "./MarbleInteractionSystem";
import { chimeBounceImpulse, jumpImpulse, launchImpulse, pianoBoostImpulse, recoveryImpulse } from "./marbleForces";
import { updateBeatSpinners, updateStartGate } from "./obstacleMotion";
import type { RaceResult } from "../race/raceTypes";
const DEFAULT_FIXED_STEP = 1 / 120;
const VIDEO_COUNTDOWN_SECONDS = 3;
const MARBLE_MASS = 5.2;
const STANDARD_GRAVITY = 9.81;
const DRIVE_MIN = 4;
const DRIVE_MAX = 10;
function vec3(value: THREE.Vector3) {
  return new CANNON.Vec3(value.x, value.y, value.z);
}
export class RacePhysics {
  readonly world = new CANNON.World({ gravity: new CANNON.Vec3(0, -STANDARD_GRAVITY, 0) });
  readonly marbles = new Map<MarbleId, MarbleRuntime>();
  readonly roster: MarbleConfig[];
  readonly marbleCount: number;
  readonly marbleRadius: number;
  readonly startGridDepth: number;
  readonly pianoBodies: CANNON.Body[];
  readonly chimeBodies: CANNON.Body[];
  readonly supportBodies: CANNON.Body[];
  readonly pianoFlashUntil = Array.from({ length: 12 }, () => -1);
  readonly startGate: CANNON.Body;
  readonly spinnerA: ReturnType<typeof createSpinner>;
  readonly spinnerB: ReturnType<typeof createSpinner>;
  readonly finalCross: ReturnType<typeof createSpinner>;
  private bodyToMarble = new Map<number, MarbleRuntime>();
  private interactions: MarbleInteractionSystem;
  private onImpactSound?: MarbleImpactSound;
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
  private instrumentSoundAt = new Map<string, number>();
  private fixedStep = DEFAULT_FIXED_STEP;
  private maxSubSteps = 10;
  constructor(
    private onComplete: (result: RaceResult) => void,
    driveMultiplier = 7.25,
    onImpactSound?: MarbleImpactSound,
    marbleCount = 16,
  ) {
    this.driveMultiplier = Math.max(DRIVE_MIN, Math.min(DRIVE_MAX, driveMultiplier));
    this.onImpactSound = onImpactSound;
    this.marbleCount = normalizeMarbleCount(marbleCount);
    this.roster = createMarbleRoster(this.marbleCount);
    const grid = marbleStartGrid(this.marbleCount);
    this.marbleRadius = grid.radius;
    this.startGridDepth = grid.depth;
    this.fixedStep = this.marbleCount > 500 ? 1 / 60 : this.marbleCount > 220 ? 1 / 90 : DEFAULT_FIXED_STEP;
    this.maxSubSteps = this.marbleCount > 500 ? 5 : this.marbleCount > 220 ? 7 : 10;
    raceSessionStore.reset(this.roster);
    this.world.allowSleep = false;
    this.world.broadphase = new CANNON.SAPBroadphase(this.world);
    const solver = new CANNON.GSSolver();
    solver.iterations = 14;
    solver.tolerance = 0.001;
    this.world.solver = solver;
    const marbleMaterial = new CANNON.Material("marble");
    const trackMaterial = new CANNON.Material("track");
    const obstacleMaterial = new CANNON.Material("obstacle");
    const instrumentMaterial = new CANNON.Material("instrument");
    this.world.addContactMaterial(new CANNON.ContactMaterial(marbleMaterial, trackMaterial, {
      friction: 0.035,
      restitution: 0.08,
      contactEquationStiffness: 1e8,
    }));
    this.world.addContactMaterial(new CANNON.ContactMaterial(marbleMaterial, obstacleMaterial, {
      friction: 0.04,
      restitution: 0.62,
    }));
    this.world.addContactMaterial(new CANNON.ContactMaterial(marbleMaterial, marbleMaterial, {
      friction: 0.018,
      restitution: 0.58,
    }));
    this.world.addContactMaterial(new CANNON.ContactMaterial(marbleMaterial, instrumentMaterial, {
      friction: 0.028,
      restitution: 0.42,
    }));
    this.interactions = new MarbleInteractionSystem(
      this.bodyToMarble,
      trackMaterial,
      obstacleMaterial,
      () => this.opened && !this.completed,
      onImpactSound,
      this.marbleRadius,
    );
    buildTrackBodies(this.world, trackMaterial);
    createStartGridBody(this.world, trackMaterial, this.marbleCount);
    this.supportBodies = createSupportBodies(this.world, obstacleMaterial);
    this.createMarbles(marbleMaterial);
    this.startGate = createBarrier(this.world, obstacleMaterial, SPECIALS.startGate, 0.8);
    this.spinnerA = createSpinner(this.world, obstacleMaterial, SPECIALS.spinnerA, 2.25);
    this.spinnerB = createSpinner(this.world, obstacleMaterial, SPECIALS.spinnerB, -1.95);
    this.finalCross = createSpinner(this.world, obstacleMaterial, SPECIALS.finalCross, 2.5);
    this.finalCross.body.addShape(new CANNON.Box(new CANNON.Vec3(0.17, 0.14, TRACK_WIDTH * 0.43)));
    this.chimeBodies = createChimeBumpers(this.world, instrumentMaterial, (index, body, contact) => this.chimeHit(index, body, contact));
    this.pianoBodies = createPianoBodies(this.world, instrumentMaterial, (index, body, contact) => this.pianoHit(index, body, contact));
    this.publishSnapshot();
  }
  setDriveMultiplier(value: number) {
    this.driveMultiplier = Math.max(DRIVE_MIN, Math.min(DRIVE_MAX, value));
  }
  private createMarbles(material: CANNON.Material) {
    this.roster.forEach((marble, index) => {
      const start = spawnPoint(index, this.marbleCount, this.marbleRadius);
      const body = new CANNON.Body({
        mass: MARBLE_MASS,
        material,
        shape: new CANNON.Sphere(this.marbleRadius),
        position: vec3(start),
        linearDamping: 0.00005,
        angularDamping: 0.0002,
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
      this.interactions.bindMarble(runtime);
    });
  }
  step(delta: number) {
    if (this.completed) return;
    const dt = Math.min(0.05, Math.max(0, delta));
    this.totalTime += dt;
    if (this.opened) this.raceTime += dt;
    this.updateGate(dt);
    this.updateBeatObstacles();
    this.interactions.setTime(this.raceTime);
    if (this.opened) this.interactions.applyMagneticField(this.marbles.values());
    this.world.step(this.fixedStep, dt, this.maxSubSteps);
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
    while (!this.completed && this.totalTime + this.fixedStep < target && guard < 36000) {
      this.step(this.fixedStep);
      guard += 1;
    }
    if (!this.completed && this.totalTime < target) this.step(target - this.totalTime);
  }
  releaseStart() {
    if (this.opened || this.totalTime < VIDEO_COUNTDOWN_SECONDS) return false;
    this.opened = true;
    this.raceTime = 0;
    this.startGate.collisionResponse = false;
    this.startGate.collisionFilterMask = 0;
    this.launched = true;
    this.launchMarbles();
    raceSessionStore.flash("LET'S GO!");
    this.publishSnapshot();
    return true;
  }
  private launchMarbles() {
    for (const marble of this.marbles.values()) {
      const sample = COURSE_SAMPLES[Math.max(0, marble.progressIndex)];
      marble.body.applyImpulse(vec3(launchImpulse(sample, MARBLE_MASS, this.driveMultiplier)));
      marble.body.angularVelocity.set(0, 0, 0);
    }
  }
  private updateGate(dt: number) {
    updateStartGate(this.startGate, this.opened, dt);
  }
  private updateBeatObstacles() {
    this.beatIndex = updateBeatSpinners(
      this.raceTime, this.opened, this.beatIndex, [this.spinnerA, this.spinnerB, this.finalCross],
    );
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
        body.applyImpulse(vec3(jumpImpulse(sample, MARBLE_MASS, this.driveMultiplier)));
        if (marble === this.getLeader()) raceSessionStore.flash("SKY JUMP!");
      }
      const speed = body.velocity.length();
      const moved = Math.max(0, marble.progressIndex - previous);
      const tangentSpeed = body.velocity.x * sample.tangent.x + body.velocity.y * sample.tangent.y + body.velocity.z * sample.tangent.z;
      marble.stuckFor = tangentSpeed < 0.9 && moved === 0 ? marble.stuckFor + dt : 0;
      if (marble.stuckFor > 0.65) {
        marble.stuckFor = 0;
        body.applyImpulse(vec3(recoveryImpulse(sample, MARBLE_MASS, this.driveMultiplier, STANDARD_GRAVITY)));
        if (marble === this.getLeader()) raceSessionStore.flash("RECOVERY");
      }
      marble.previousProgress = progress;
    }
    this.resolveCuts();
    this.resolveFinish();
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
  private chimeHit(index: number, body: CANNON.Body, contact?: CANNON.ContactEquation) {
    const marble = this.bodyToMarble.get(body.id);
    if (!marble?.alive) return;
    this.instrumentHit(index + 12, body, contact);
    const key = `chime-boost:${index}:${marble.id}`;
    const previous = this.instrumentSoundAt.get(key) ?? -Infinity;
    if (this.raceTime - previous < 0.16) return;
    this.instrumentSoundAt.set(key, this.raceTime);

    const sample = COURSE_SAMPLES[Math.max(0, marble.progressIndex)];
    body.applyImpulse(vec3(chimeBounceImpulse(sample, body, this.chimeBodies[index].position, MARBLE_MASS, index)));
  }

  private pianoHit(index: number, body: CANNON.Body, contact?: CANNON.ContactEquation) {
    const marble = this.bodyToMarble.get(body.id);
    if (!marble?.alive) return;
    const now = this.raceTime;
    const boostKey = `b:${index}:${marble.id}`;
    if (now - (this.instrumentSoundAt.get(boostKey) ?? -Infinity) < 0.18) return;
    this.instrumentSoundAt.set(boostKey, now);
    this.pianoFlashUntil[index] = now + 0.24;
    this.pianoCombo = now - this.lastPianoAt < 0.8 ? this.pianoCombo + 1 : 1;
    this.lastPianoAt = now;
    this.instrumentHit(index, body, contact);
    const sample = COURSE_SAMPLES[marble.progressIndex];
    const pad = pianoPadAt(index);
    body.applyImpulse(vec3(pianoBoostImpulse(sample, MARBLE_MASS, pad.boostDeltaV)));
  }
  private instrumentHit(index: number, body: CANNON.Body, contact?: CANNON.ContactEquation) {
    const marble = this.bodyToMarble.get(body.id);
    if (!marble?.alive || !this.opened || !this.onImpactSound) return;
    const key = `s:${index}:${marble.id}`;
    const previous = this.instrumentSoundAt.get(key) ?? -Infinity;
    if (this.raceTime - previous < 0.075) return;
    this.instrumentSoundAt.set(key, this.raceTime);
    const strength = Math.max(0.55, impactVelocity(contact, body));
    const pan = Math.max(-1, Math.min(1, body.position.x / 22));
    this.onImpactSound("instrument", Math.min(18, strength), pan, index);
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
