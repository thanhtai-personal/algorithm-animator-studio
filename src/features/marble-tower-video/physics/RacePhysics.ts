import * as CANNON from "cannon-es";
import { raceSessionStore } from "../store/RaceSessionStore";
import { createMarbleRoster, type MarbleConfig, type MarbleId } from "../marble/marbleCatalog";
import { marbleStartGrid, normalizeMarbleCount } from "../marble/marbleGrid";
import { nearestSampleIndexIn } from "../track/towerCourseSampler";
import { ORIGINAL_TOWER_COURSE, raceCourseForMap, type RaceMapId } from "../track/raceCourse";
import { pianoPadAt } from "../track/pianoPadLayout";
import { buildTrackBodies, createBarrier, createChimeBumpers, createCourseObstacleBodies, createPianoBodies, createSpinner, createStudioStructureBodies, createSupportBodies, createStartGridBody, spawnPoint } from "./buildTowerCoursePhysics";
import type { MarbleRuntime } from "./physicsTypes";
import { impactVelocity, MarbleInteractionSystem, type MarbleImpactSound } from "./MarbleInteractionSystem";
import { chimeBounceImpulse, driveBeltForce, jumpImpulse, launchImpulse, pianoBoostImpulse, recoveryImpulse } from "./marbleForces";
import { PIANO_TRAIL_SECONDS, pianoTrailStrength } from "./marbleBoostTrail";
import { updateBeatSpinners, updateStartGate } from "./obstacleMotion";
import { eliminateMarbleFromRace, freezeWinnerAtFinish, holdWinnerAtFinish, marbleHasLeftRaceTrack, vec3 } from "./marbleRacePlacement";
import { CourseObjectLifecycle, type CourseObjectId } from "./CourseObjectLifecycle";
import { createRaceMaterials } from "./createRaceMaterials";
import { buildRaceSnapshot } from "./raceSnapshot";
import type { RaceResult } from "../race/raceTypes";
const DEFAULT_FIXED_STEP = 1 / 90;
const VIDEO_COUNTDOWN_SECONDS = 3;
const MARBLE_MASS = 5.2;
const STANDARD_GRAVITY = 9.81;
const DRIVE_MIN = 0.6;
const DRIVE_MAX = 1.5;
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
  readonly studioStructureBodies: CANNON.Body[];
  readonly roadObstacleBodies: CANNON.Body[];
  readonly pianoFlashUntil = Array.from({ length: 12 }, () => -1);
  readonly startGate: CANNON.Body;
  readonly spinnerA: ReturnType<typeof createSpinner>;
  readonly spinnerB: ReturnType<typeof createSpinner>;
  readonly finalCross: ReturnType<typeof createSpinner>;
  private bodyToMarble = new Map<number, MarbleRuntime>();
  private interactions: MarbleInteractionSystem;
  private onImpactSound?: MarbleImpactSound;
  readonly course: ReturnType<typeof raceCourseForMap>;
  private totalTime = 0;
  private raceTime = 0;
  private beatIndex = -1;
  private opened = false;
  private launched = false;
  private completed = false;
  private publishTimer = 0;
  private courseCullTimer = 0;
  private rankedCache: MarbleRuntime[] = [];
  private rankingDirty = true;
  private resolvedCuts = new Set<number>();
  private winnerId: MarbleId | null = null;
  private winnerTime = 0;
  private winnerAnchor: CANNON.Vec3 | null = null;
  private finishDelay = -1;
  private driveMultiplier: number;
  private pianoCombo = 0;
  private lastPianoAt = -10;
  private instrumentSoundAt = new Map<string, number>();
  private courseObjects = new CourseObjectLifecycle();
  private fixedStep = DEFAULT_FIXED_STEP;
  private maxSubSteps = 10;
  private rollingSoundTimer = 0;
  constructor(
    private onComplete: (result: RaceResult) => void, driveMultiplier = 1.05, onImpactSound?: MarbleImpactSound,
    marbleCount = 16, mapId: RaceMapId = ORIGINAL_TOWER_COURSE.id,
  ) {
    this.course = raceCourseForMap(mapId);
    this.driveMultiplier = Math.max(DRIVE_MIN, Math.min(DRIVE_MAX, driveMultiplier));
    this.onImpactSound = onImpactSound;
    this.marbleCount = normalizeMarbleCount(marbleCount);
    this.roster = createMarbleRoster(this.marbleCount);
    const grid = marbleStartGrid(this.marbleCount);
    this.marbleRadius = grid.radius;
    this.startGridDepth = grid.depth;
    this.fixedStep = this.marbleCount > 500 ? 1 / 60 : this.marbleCount > 220 ? 1 / 75 : DEFAULT_FIXED_STEP;
    this.maxSubSteps = this.marbleCount > 500 ? 4 : this.marbleCount > 220 ? 5 : 6;
    raceSessionStore.reset(this.roster);
    this.world.allowSleep = false;
    this.world.broadphase = new CANNON.SAPBroadphase(this.world);
    const solver = new CANNON.GSSolver();
    solver.iterations = 11;
    solver.tolerance = 0.001;
    this.world.solver = solver;
    const materials = createRaceMaterials(this.world);
    this.interactions = new MarbleInteractionSystem(
      this.bodyToMarble, materials.track, materials.obstacle, () => this.opened && !this.completed,
      onImpactSound, this.course.samples, this.course.obstacleSoundVariant,
    );
    buildTrackBodies(this.world, materials.track, this.course.samples, this.course.trackWidth);
    this.roadObstacleBodies = createCourseObstacleBodies(this.world, materials.obstacle, this.course.samples, this.course.roadObstacles);
    createStartGridBody(this.world, materials.track, this.marbleCount, this.course.samples, this.course.trackWidth);
    this.supportBodies = createSupportBodies(this.world, materials.obstacle, this.course.samples, this.course.trackWidth);
    this.studioStructureBodies = this.course.studioCollision ? createStudioStructureBodies(this.world, materials.obstacle) : [];
    this.createMarbles(materials.marble);
    const { samples, specials, trackWidth } = this.course;
    this.startGate = createBarrier(this.world, materials.obstacle, specials.startGate, 0.8, samples, trackWidth);
    this.spinnerA = createSpinner(this.world, materials.obstacle, specials.spinnerA, 2.25, samples, trackWidth);
    this.spinnerB = createSpinner(this.world, materials.obstacle, specials.spinnerB, -1.95, samples, trackWidth);
    this.finalCross = createSpinner(this.world, materials.obstacle, specials.finalCross, 2.5, samples, trackWidth);
    this.finalCross.body.addShape(new CANNON.Box(new CANNON.Vec3(0.17, 0.14, trackWidth * 0.24)));
    this.chimeBodies = this.course.towerInstruments ? createChimeBumpers(
      this.world, materials.chime, (index, body, contact) => this.chimeHit(index, body, contact), samples, specials,
    ) : [];
    this.pianoBodies = this.course.towerInstruments ? createPianoBodies(
      this.world, materials.piano, (index, body, contact) => this.pianoHit(index, body, contact), samples,
    ) : [];
    this.registerCourseObjects();
    this.publishSnapshot();
  }
  private registerCourseObjects() {
    this.courseObjects.register("start-gate", 0.05, [this.startGate]);
    const { specials } = this.course;
    this.courseObjects.register("spinner-a", specials.spinnerA + 0.025, [this.spinnerA.body]);
    this.courseObjects.register("spinner-b", specials.spinnerB + 0.025, [this.spinnerB.body]);
    this.courseObjects.register("chimes", specials.chimeEnd, this.chimeBodies);
    this.courseObjects.register("piano", specials.pianoEnd, this.pianoBodies);
    this.courseObjects.register("final-cross", specials.finalCross + 0.025, [this.finalCross.body]);
  }
  setDriveMultiplier(value: number) {
    this.driveMultiplier = Math.max(DRIVE_MIN, Math.min(DRIVE_MAX, value));
  }
  private createMarbles(material: CANNON.Material) {
    this.roster.forEach((marble, index) => {
      const start = spawnPoint(index, this.marbleCount, this.marbleRadius, this.course.samples);
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
        pianoTrailUntil: -1,
      };
      this.marbles.set(marble.id, runtime);
      this.bodyToMarble.set(body.id, runtime);
      this.interactions.bindMarble(runtime);
    });
  }
  step(delta: number, emitRollingSound = true) {
    if (this.completed) return;
    const dt = Math.min(0.05, Math.max(0, delta));
    this.totalTime += dt;
    if (this.opened) this.raceTime += dt;
    this.updateGate(dt);
    this.updateBeatObstacles();
    this.interactions.setTime(this.raceTime);
    this.world.step(this.fixedStep, dt, this.maxSubSteps);
    if (this.opened && emitRollingSound) this.updateRollingSound(dt);
    if (this.winnerId && this.winnerAnchor) {
      const winner = this.marbles.get(this.winnerId);
      if (winner) holdWinnerAtFinish(winner, this.winnerAnchor);
    }
    if (this.opened) {
      this.updateRace(dt);
      this.courseCullTimer += dt;
      if (this.courseCullTimer >= 0.1) {
        this.courseCullTimer %= 0.1;
        this.retirePassedCourseObjects();
      }
    }
    if (this.finishDelay >= 0) {
      this.finishDelay -= dt;
      if (this.finishDelay <= 0) this.completeRace();
    }
    this.publishTimer += dt;
    if (this.publishTimer >= 0.1) {
      this.publishTimer = 0;
      this.publishSnapshot();
    }
  }
  advanceTo(targetSeconds: number) {
    const target = Math.max(0, targetSeconds);
    const emitRollingSound = target - this.totalTime < 0.25;
    let guard = 0;
    while (!this.completed && this.totalTime + this.fixedStep < target && guard < 36000) {
      this.step(this.fixedStep, emitRollingSound);
      guard += 1;
    }
    if (!this.completed && this.totalTime < target) this.step(target - this.totalTime, emitRollingSound);
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
      const sample = this.course.samples[Math.max(0, marble.progressIndex)];
      marble.body.applyImpulse(vec3(launchImpulse(sample, MARBLE_MASS, this.driveMultiplier)));
      marble.body.angularVelocity.set(0, 0, 0);
    }
  }
  private updateGate(dt: number) {
    updateStartGate(this.startGate, this.opened, dt, this.course.samples, this.course.specials.startGate);
  }
  private updateBeatObstacles() {
    this.beatIndex = updateBeatSpinners(
      this.raceTime, this.opened, this.beatIndex, [this.spinnerA, this.spinnerB, this.finalCross],
    );
  }
  private retirePassedCourseObjects() {
    const progress: number[] = [];
    let cameraProgress = 0;
    const denominator = Math.max(1, this.course.samples.length - 1);
    for (const marble of this.marbles.values()) {
      if (!marble.alive) continue;
      const value = marble.progressIndex / denominator;
      progress.push(value);
      if (value > cameraProgress) cameraProgress = value;
    }
    this.courseObjects.update(progress, cameraProgress, this.world);
  }
  private updateRace(dt: number) {
    const leaderAtStart = this.getLeader()?.id ?? null;
    let aliveCount = this.getRanked().filter((candidate) => candidate.alive).length;
    for (const marble of this.marbles.values()) {
      if (!marble.alive || marble.id === this.winnerId) continue;
      const body = marble.body;
      const previous = marble.progressIndex;
      marble.progressIndex = nearestSampleIndexIn(this.course.samples, body.position, marble.progressIndex);
      const progress = marble.progressIndex / (this.course.samples.length - 1);
      const sample = this.course.samples[marble.progressIndex];
      if (marbleHasLeftRaceTrack(marble, sample, this.course.trackWidth, previous)) {
        eliminateMarbleFromRace(marble, aliveCount--);
        this.bodyToMarble.delete(marble.body.id);
        this.rankingDirty = true;
        raceSessionStore.flash(`${marble.id.toUpperCase()} OUT`);
        continue;
      }
      if (!marble.hitJump && progress >= this.course.specials.jump) {
        marble.hitJump = true;
        body.applyImpulse(vec3(jumpImpulse(sample, MARBLE_MASS, this.driveMultiplier)));
        if (marble.id === leaderAtStart) raceSessionStore.flash("SKY JUMP!");
      }
      const speed = body.velocity.length();
      const moved = Math.max(0, marble.progressIndex - previous);
      const tangentSpeed = body.velocity.x * sample.tangent.x + body.velocity.y * sample.tangent.y + body.velocity.z * sample.tangent.z;
      const driveBelt = this.course.driveBelts.find((belt) => progress >= belt.from && progress <= belt.to);
      if (driveBelt && tangentSpeed < driveBelt.targetSpeed) {
        body.applyForce(vec3(driveBeltForce(
          sample, MARBLE_MASS, tangentSpeed, driveBelt.targetSpeed, driveBelt.maxAcceleration,
        )));
      }
      marble.stuckFor = tangentSpeed < 0.9 && moved === 0 ? marble.stuckFor + dt : 0;
      if (marble.stuckFor > 0.65) {
        marble.stuckFor = 0;
        body.applyImpulse(vec3(recoveryImpulse(sample, MARBLE_MASS, this.driveMultiplier, STANDARD_GRAVITY)));
        if (marble.id === leaderAtStart) raceSessionStore.flash("RECOVERY");
      }
      marble.previousProgress = progress;
    }
    this.rankingDirty = true;
    this.resolveCuts();
    this.resolveFinish();
  }
  private resolveCuts() {
    // CUT markers are checkpoints only. They must never despawn marbles that are
    // behind the leader or currently outside the camera view.
    const leader = this.getLeader();
    if (!leader) return;
    const leaderProgress = leader.progressIndex / (this.course.samples.length - 1);
    this.course.cuts.forEach((cut, cutIndex) => {
      if (this.resolvedCuts.has(cutIndex) || leaderProgress < cut.progress) return;
      this.resolvedCuts.add(cutIndex);
      raceSessionStore.flash(cut.label);
    });
  }
  private resolveFinish() {
    if (this.winnerId) return;
    const leader = this.getLeader();
    if (!leader) return;
    const progress = leader.progressIndex / (this.course.samples.length - 1);
    if (progress < this.course.specials.finish) return;
    this.winnerId = leader.id;
    this.winnerTime = this.raceTime;
    leader.finalPosition = 1;
    this.rankingDirty = true;
    this.winnerAnchor = freezeWinnerAtFinish(leader, this.marbleRadius, this.course.samples, this.course.specials.finish);
    const finalists = this.getRanked().filter((marble) => marble.alive && marble.id !== leader.id);
    finalists.forEach((marble, index) => { marble.finalPosition = 2 + index; });
    raceSessionStore.flash(`${leader.id.toUpperCase()} WINS!`);
    this.finishDelay = 1.45;
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
    const sample = this.course.samples[Math.max(0, marble.progressIndex)];
    body.applyImpulse(vec3(chimeBounceImpulse(sample, body, this.chimeBodies[index].position, MARBLE_MASS, index)));
  }

  private pianoHit(index: number, body: CANNON.Body, contact?: CANNON.ContactEquation) {
    const marble = this.bodyToMarble.get(body.id);
    if (!marble?.alive) return;
    const now = this.raceTime;
    const boostKey = `b:${index}:${marble.id}`;
    if (now - (this.instrumentSoundAt.get(boostKey) ?? -Infinity) < 0.18) return;
    this.instrumentSoundAt.set(boostKey, now);
    marble.pianoTrailUntil = now + PIANO_TRAIL_SECONDS;
    this.pianoFlashUntil[index] = now + 0.24;
    this.pianoCombo = now - this.lastPianoAt < 0.8 ? this.pianoCombo + 1 : 1;
    this.lastPianoAt = now;
    this.instrumentHit(index, body, contact);
    const sample = this.course.samples[marble.progressIndex];
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
  private updateRollingSound(dt: number) {
    if (!this.onImpactSound || this.completed) return;
    this.rollingSoundTimer += dt;
    if (this.rollingSoundTimer < 1 / 14.5) return;
    this.rollingSoundTimer %= 1 / 14.5;
    const pack = this.getRanked().filter((marble) => marble.alive).slice(0, 6);
    if (!pack.length) return;
    const speed = pack.reduce((sum, marble) => sum + marble.body.velocity.length(), 0) / pack.length;
    const x = pack.reduce((sum, marble) => sum + marble.body.position.x, 0) / pack.length;
    const density = Math.min(1, 0.45 + pack.length * 0.09);
    this.onImpactSound("roll", speed * density, Math.max(-0.9, Math.min(0.9, x / 22)), pack.length);
  }
  getRanked() {
    if (!this.rankingDirty && this.rankedCache.length === this.marbles.size) return this.rankedCache;
    this.rankedCache = Array.from(this.marbles.values());
    this.rankedCache.sort((a, b) => {
      if (a.alive !== b.alive) return a.alive ? -1 : 1;
      if (!a.alive && !b.alive && a.finalPosition !== b.finalPosition) return (a.finalPosition ?? 99) - (b.finalPosition ?? 99);
      return b.progressIndex - a.progressIndex;
    });
    this.rankingDirty = false;
    return this.rankedCache;
  }
  getLeader() { return this.getRanked().find((marble) => marble.alive) ?? null; }
  pianoGlow(index: number) { return this.pianoFlashUntil[index] > this.raceTime; }
  courseObjectVisible(id: CourseObjectId) { return this.courseObjects.isVisible(id); }
  setCourseObjectInView(id: CourseObjectId, inView: boolean) { this.courseObjects.setInView(id, inView); }
  pianoTrail(id: MarbleId) { return pianoTrailStrength(this.marbles.get(id)?.pianoTrailUntil ?? -1, this.raceTime); }
  getMarble(id: MarbleId) { return this.marbles.get(id) ?? null; }
  getTimelineSeconds() { return this.totalTime; }
  hasStarted() { return this.opened; }
  private publishSnapshot() {
    raceSessionStore.apply(buildRaceSnapshot(this.getRanked(), this.course, this.resolvedCuts, this.opened, this.completed,
      this.totalTime, this.raceTime, this.winnerId, this.pianoCombo,
    ));
  }
  dispose() {
    this.world.bodies.slice().forEach((body) => this.world.removeBody(body));
  }
}
