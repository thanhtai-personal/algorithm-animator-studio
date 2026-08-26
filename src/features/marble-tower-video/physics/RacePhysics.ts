import * as CANNON from "cannon-es";
import { raceSessionStore } from "../store/RaceSessionStore";
import { MARBLES, type MarbleId } from "../marble/marbleCatalog";
import { CHECKPOINTS, FINISH_Z, JUMP_PAD_Z, MARBLE_RADIUS, START_GATE_Z, TRACK_SEGMENTS, TRACK_WIDTH, TURBO_PAD_Z, surfaceYAt } from "../track/trackLayout";
import { addRailBodies, addTrackBody, bodySpeed, makeBarrier } from "./physicsHelpers";
import type { MarbleRuntime, ObstacleBodies, PianoBody } from "./physicsTypes";
import type { RaceResult } from "../race/raceTypes";

const BPM = 120;
const BEAT_SECONDS = 60 / BPM;
const VIDEO_COUNTDOWN_SECONDS = 3;
const FIXED_STEP = 1 / 60;

export class RacePhysics {
  readonly world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) });
  readonly marbles = new Map<MarbleId, MarbleRuntime>();
  readonly pianoBodies: PianoBody[] = [];
  readonly bumpers: CANNON.Body[] = [];
  readonly pianoFlashUntil = Array.from({ length: 14 }, () => -1);
  readonly obstacles: ObstacleBodies;
  private totalTime = 0;
  private raceTime = 0;
  private beatIndex = -1;
  private snapshotTimer = 0;
  private opened = false;
  private completed = false;
  private boostAvailable = true;
  private pianoCombo = 0;
  private lastPianoAt = -10;
  private checkpointPasses = new Map<string, MarbleId[]>();
  private resolvedCheckpoints = new Set<string>();
  private pianoCooldown = new Map<number, number>();
  private finishOrder: MarbleId[] = [];
  private driveMultiplier: number;

  constructor(private playerId: MarbleId, private onComplete: (result: RaceResult) => void, driveMultiplier = 1.8) {
    this.driveMultiplier = Math.max(0.75, Math.min(3.2, driveMultiplier));
    this.world.allowSleep = true;
    const solver = new CANNON.GSSolver();
    solver.iterations = 10;
    solver.tolerance = 0.001;
    this.world.solver = solver;
    const marbleMaterial = new CANNON.Material("marble");
    const trackMaterial = new CANNON.Material("track");
    const obstacleMaterial = new CANNON.Material("obstacle");
    this.world.addContactMaterial(new CANNON.ContactMaterial(marbleMaterial, trackMaterial, { friction: 0.11, restitution: 0.18, contactEquationStiffness: 1e8 }));
    this.world.addContactMaterial(new CANNON.ContactMaterial(marbleMaterial, obstacleMaterial, { friction: 0.08, restitution: 0.62 }));
    this.world.addContactMaterial(new CANNON.ContactMaterial(marbleMaterial, marbleMaterial, { friction: 0.035, restitution: 0.42 }));
    TRACK_SEGMENTS.filter((segment) => segment.kind !== "piano").forEach((segment) => {
      addTrackBody(this.world, segment, trackMaterial);
      addRailBodies(this.world, segment, trackMaterial);
    });
    this.createPiano(trackMaterial);
    this.createMarbles(marbleMaterial);
    this.obstacles = this.createObstacles(obstacleMaterial);
    this.createBumpers(obstacleMaterial);
    raceSessionStore.reset(VIDEO_COUNTDOWN_SECONDS);
    this.publishSnapshot();
  }

  setDriveMultiplier(value: number) { this.driveMultiplier = Math.max(0.75, Math.min(3.2, value)); }

  private createMarbles(material: CANNON.Material) {
    const lanes = [-3.25, -2.32, -1.39, -0.46, 0.46, 1.39, 2.32, 3.25];
    MARBLES.forEach((marble, index) => {
      const z = -0.4 - (index % 2) * 0.9;
      const body = new CANNON.Body({
        mass: 1,
        material,
        shape: new CANNON.Sphere(MARBLE_RADIUS),
        position: new CANNON.Vec3(lanes[index], surfaceYAt(z) + MARBLE_RADIUS + 0.08, z),
        linearDamping: 0.012,
        angularDamping: 0.025,
      });
      body.allowSleep = false;
      this.world.addBody(body);
      this.marbles.set(marble.id, { id: marble.id, body, alive: true, finalPosition: null, lastProgress: z, stuckFor: 0, pianoHits: 0, hitJump: false, hitTurbo: false });
    });
  }

  private createPiano(material: CANNON.Material) {
    const start = 36;
    const end = 55;
    const depth = (end - start) / 14;
    for (let index = 0; index < 14; index += 1) {
      const z = start + depth * (index + 0.5);
      const body = new CANNON.Body({ mass: 0, material });
      body.addShape(new CANNON.Box(new CANNON.Vec3(TRACK_WIDTH / 2, 0.2, depth * 0.48)));
      body.position.set(0, 11.78, z);
      body.addEventListener("collide", (event: { body: CANNON.Body }) => {
        const marble = [...this.marbles.values()].find((item) => item.body === event.body && item.alive);
        if (!marble) return;
        const now = this.raceTime;
        if ((this.pianoCooldown.get(index) ?? -10) + 0.12 > now) return;
        this.pianoCooldown.set(index, now);
        this.pianoFlashUntil[index] = now + 0.18;
        this.pianoCombo = now - this.lastPianoAt < 0.8 ? this.pianoCombo + 1 : 1;
        this.lastPianoAt = now;
        marble.pianoHits += 1;
        raceSessionStore.flash(`PIANO ×${this.pianoCombo}`);
      });
      this.world.addBody(body);
      this.pianoBodies.push({ body, index });
    }
  }

  private createObstacles(material: CANNON.Material): ObstacleBodies {
    const startGate = makeBarrier(this.world, START_GATE_Z, [TRACK_WIDTH / 2, 0.75, 0.18], material);
    const spinner = (z: number) => {
      const body = new CANNON.Body({ mass: 0, type: CANNON.Body.KINEMATIC, material });
      body.addShape(new CANNON.Box(new CANNON.Vec3(3.9, 0.16, 0.22)));
      body.position.set(0, surfaceYAt(z) + 0.52, z);
      body.angularVelocity.set(0, 2.2, 0);
      this.world.addBody(body);
      return body;
    };
    const spinnerA = spinner(61);
    const spinnerB = spinner(68);
    spinnerB.quaternion.setFromEuler(0, Math.PI / 2, 0);
    spinnerB.angularVelocity.y = -1.8;
    const beatGate = makeBarrier(this.world, 82, [TRACK_WIDTH / 2, 0.8, 0.16], material);
    const finalCross = new CANNON.Body({ mass: 0, type: CANNON.Body.KINEMATIC, material });
    finalCross.addShape(new CANNON.Box(new CANNON.Vec3(3.6, 0.16, 0.2)));
    finalCross.addShape(new CANNON.Box(new CANNON.Vec3(0.2, 0.16, 3.6)));
    finalCross.position.set(0, surfaceYAt(177) + 0.52, 177);
    finalCross.angularVelocity.set(0, 1.55, 0);
    this.world.addBody(finalCross);
    return { startGate, spinnerA, spinnerB, beatGate, finalCross };
  }

  private createBumpers(material: CANNON.Material) {
    [[-2.4, 166], [2.4, 171], [-1.8, 181], [2.2, 186]].forEach(([x, z]) => {
      const body = new CANNON.Body({ mass: 0, material });
      body.addShape(new CANNON.Sphere(0.7));
      body.position.set(x, surfaceYAt(z) + 0.7, z);
      this.world.addBody(body);
      this.bumpers.push(body);
    });
  }

  step(delta: number) {
    if (this.completed) return;
    const dt = Math.min(0.05, Math.max(0, delta));
    this.totalTime += dt;
    if (this.totalTime >= VIDEO_COUNTDOWN_SECONDS) {
      if (!this.opened) {
        this.opened = true;
        // Release the physics gate immediately at GO. Its mesh can keep rising
        // for visual feedback, but the marbles must not receive their launch
        // impulse while the still-low kinematic box is blocking the lane.
        this.obstacles.startGate.collisionResponse = false;
        this.obstacles.startGate.collisionFilterMask = 0;
        raceSessionStore.flash("GO!");
        this.marbles.forEach((marble) => marble.body.applyImpulse(new CANNON.Vec3(0, 0.08, 1.5 * this.driveMultiplier)));
      }
      this.raceTime += dt;
    }
    this.updateKinematics();
    this.world.step(FIXED_STEP, dt, 4);
    if (this.opened) this.updateRace(dt);
    this.snapshotTimer += dt;
    if (this.snapshotTimer >= 0.06) { this.snapshotTimer = 0; this.publishSnapshot(); }
  }

  advanceTo(targetSeconds: number) {
    const target = Math.max(0, targetSeconds);
    let guard = 0;
    while (!this.completed && this.totalTime + FIXED_STEP < target && guard < 3600) { this.step(FIXED_STEP); guard += 1; }
    if (!this.completed && this.totalTime < target) this.step(target - this.totalTime);
  }

  private updateKinematics() {
    const gate = this.obstacles.startGate;
    const gateBase = surfaceYAt(START_GATE_Z) + 0.9;
    const gateTarget = this.opened ? gateBase + 4.2 : gateBase;
    gate.velocity.y = Math.max(-6, Math.min(6, (gateTarget - gate.position.y) * 4.5));
    const beat = Math.floor(this.raceTime / BEAT_SECONDS);
    if (this.opened && beat !== this.beatIndex) this.beatIndex = beat;
    const pulse = beat % 4 === 3 ? 1.45 : 1;
    this.obstacles.spinnerA.angularVelocity.y = 2.0 * pulse;
    this.obstacles.spinnerB.angularVelocity.y = -1.7 * pulse;
    this.obstacles.finalCross.angularVelocity.y = 1.45 * (beat % 2 ? -1 : 1);
    const gate2 = this.obstacles.beatGate;
    const open = this.opened && beat % 4 >= 2;
    const base = surfaceYAt(82) + 0.95;
    const target = open ? base + 3.0 : base;
    gate2.velocity.y = Math.max(-4.5, Math.min(4.5, (target - gate2.position.y) * 4));
  }

  private updateRace(dt: number) {
    for (const marble of this.marbles.values()) {
      if (!marble.alive) continue;
      const { body } = marble;
      const speed = bodySpeed(body);
      if (body.position.y < -8 || Math.abs(body.position.x) > 10) { this.eliminate(marble.id, "out-of-bounds"); continue; }
      const deficit = Math.max(0, 5.8 * this.driveMultiplier - body.velocity.z);
      if (deficit > 0) body.applyForce(new CANNON.Vec3(0, 0, Math.min(14, deficit * 1.9)));
      if (!marble.hitJump && body.position.z >= JUMP_PAD_Z) { marble.hitJump = true; body.applyImpulse(new CANNON.Vec3(0, 2.2, 1.9 * this.driveMultiplier)); }
      if (!marble.hitTurbo && body.position.z >= TURBO_PAD_Z) { marble.hitTurbo = true; body.applyImpulse(new CANNON.Vec3(0, 0.18, 3.6 * this.driveMultiplier)); }
      const moved = body.position.z - marble.lastProgress;
      marble.stuckFor = speed < 0.22 && moved < 0.03 ? marble.stuckFor + dt : 0;
      if (marble.stuckFor > 2.8) {
        marble.stuckFor = 0;
        body.applyImpulse(new CANNON.Vec3(0, 0.55, 1.25 * this.driveMultiplier));
        if (marble.id === this.playerId) raceSessionStore.flash("RECOVERY IMPULSE");
      }
      marble.lastProgress = body.position.z;
    }
    this.resolveCheckpoints();
    this.resolveFinish();
  }

  private resolveCheckpoints() {
    for (const checkpoint of CHECKPOINTS) {
      if (this.resolvedCheckpoints.has(checkpoint.id)) continue;
      const passed = this.checkpointPasses.get(checkpoint.id) ?? [];
      const alive = [...this.marbles.values()].filter((marble) => marble.alive);
      const targetKeep = Math.min(checkpoint.keep, alive.length);
      const crossing = alive.filter((marble) => !passed.includes(marble.id) && marble.body.position.z >= checkpoint.z).sort((a, b) => b.body.position.z - a.body.position.z);
      crossing.forEach((marble) => { if (passed.length < targetKeep) passed.push(marble.id); });
      this.checkpointPasses.set(checkpoint.id, passed);
      if (passed.length >= targetKeep && targetKeep > 0) {
        this.resolvedCheckpoints.add(checkpoint.id);
        const survivors = new Set(passed);
        alive.filter((marble) => !survivors.has(marble.id)).sort((a, b) => b.body.position.z - a.body.position.z).forEach((marble) => this.eliminate(marble.id, "cut"));
        raceSessionStore.flash(checkpoint.label);
      }
    }
  }

  private resolveFinish() {
    const crossing = [...this.marbles.values()].filter((marble) => marble.alive && !this.finishOrder.includes(marble.id) && marble.body.position.z >= FINISH_Z).sort((a, b) => b.body.position.z - a.body.position.z);
    crossing.forEach((marble) => {
      this.finishOrder.push(marble.id);
      marble.finalPosition = this.finishOrder.length;
      if (marble.id === this.playerId || (this.finishOrder.length === 1 && this.playerId !== marble.id)) this.complete(marble.id === this.playerId ? marble.finalPosition : 2, false);
    });
  }

  private eliminate(id: MarbleId, reason: "cut" | "out-of-bounds") {
    const marble = this.marbles.get(id);
    if (!marble?.alive) return;
    const ranking = this.rankAlive();
    marble.finalPosition = ranking.findIndex((item) => item.id === id) + 1;
    marble.alive = false;
    this.world.removeBody(marble.body);
    if (id === this.playerId) { raceSessionStore.flash(reason === "cut" ? "ELIMINATED" : "OUT OF BOUNDS"); this.complete(marble.finalPosition ?? 8, true); }
  }

  private rankAlive() { return [...this.marbles.values()].filter((marble) => marble.alive).sort((a, b) => b.body.position.z - a.body.position.z); }

  private complete(position: number, eliminated: boolean) {
    if (this.completed) return;
    this.completed = true;
    const points = Math.max(20, (9 - position) * 18 + (position === 1 ? 80 : 0));
    this.publishSnapshot();
    this.onComplete({ position, timeMs: Math.round(this.raceTime * 1000), eliminated, points });
  }

  boostPlayer() {
    if (!this.boostAvailable || !this.opened || this.completed) return false;
    const marble = this.marbles.get(this.playerId);
    if (!marble?.alive) return false;
    this.boostAvailable = false;
    marble.body.applyImpulse(new CANNON.Vec3(0, 0.36, 3.8 * this.driveMultiplier));
    raceSessionStore.flash("BOOST!");
    return true;
  }

  private publishSnapshot() {
    const ranking = [...this.marbles.values()].sort((a, b) => {
      if (a.alive !== b.alive) return a.alive ? -1 : 1;
      if (!a.alive && !b.alive) return (a.finalPosition ?? 99) - (b.finalPosition ?? 99);
      return b.body.position.z - a.body.position.z;
    });
    const player = this.marbles.get(this.playerId)!;
    const position = player.alive ? ranking.filter((item) => item.alive).findIndex((item) => item.id === this.playerId) + 1 : player.finalPosition ?? 8;
    const next = CHECKPOINTS.find((checkpoint) => !this.resolvedCheckpoints.has(checkpoint.id));
    raceSessionStore.apply({
      phase: this.completed ? "finished" : this.opened ? "racing" : "countdown",
      countdown: Math.max(0, Math.ceil(VIDEO_COUNTDOWN_SECONDS - this.totalTime)), elapsedMs: Math.round(this.raceTime * 1000), position,
      alive: ranking.filter((item) => item.alive).length, speed: player.alive ? bodySpeed(player.body) : 0, boostAvailable: this.boostAvailable,
      nextCut: next?.label ?? "FINISH", pianoCombo: this.pianoCombo,
      standings: ranking.map((marble, index) => ({ id: marble.id, position: marble.alive ? index + 1 : marble.finalPosition ?? index + 1, alive: marble.alive, progress: marble.body.position.z })),
    });
  }

  pianoGlow(index: number) { return this.raceTime < (this.pianoFlashUntil[index] ?? -1); }
  getPlayerBody() { return this.marbles.get(this.playerId)?.body ?? null; }
  getMarble(id: MarbleId) { return this.marbles.get(id) ?? null; }
  dispose() { this.world.bodies.slice().forEach((body) => this.world.removeBody(body)); }
}
