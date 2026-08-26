import { makeAutoObservable } from "mobx";
import { MARBLES, type MarbleId } from "../marble/marbleCatalog";
import type { RaceSnapshot } from "../race/raceTypes";

class RaceSessionStore {
  phase: RaceSnapshot["phase"] = "countdown";
  countdown = 3;
  elapsedMs = 0;
  leaderId: MarbleId | null = null;
  alive = 8;
  speed = 0;
  nextCut = "TOP 6 QUALIFY";
  pianoCombo = 0;
  callout = "GET READY";
  standings = MARBLES.map((marble, index) => ({
    id: marble.id,
    position: index + 1,
    alive: true,
    progress: 0,
  }));

  constructor() {
    makeAutoObservable(this);
  }

  reset() {
    this.phase = "countdown";
    this.countdown = 3;
    this.elapsedMs = 0;
    this.leaderId = null;
    this.alive = 8;
    this.speed = 0;
    this.nextCut = "TOP 6 QUALIFY";
    this.pianoCombo = 0;
    this.callout = "GET READY";
    this.standings = MARBLES.map((marble, index) => ({
      id: marble.id,
      position: index + 1,
      alive: true,
      progress: 0,
    }));
  }

  apply(snapshot: RaceSnapshot) {
    this.phase = snapshot.phase;
    this.countdown = snapshot.countdown;
    this.elapsedMs = snapshot.elapsedMs;
    this.leaderId = snapshot.leaderId;
    this.alive = snapshot.alive;
    this.speed = snapshot.speed;
    this.nextCut = snapshot.nextCut;
    this.pianoCombo = snapshot.pianoCombo;
    this.standings = snapshot.standings;
  }

  flash(message: string) {
    this.callout = message;
    window.setTimeout(() => {
      if (this.callout === message) this.callout = this.phase === "racing" ? this.nextCut : "";
    }, 1400);
  }
}

export const raceSessionStore = new RaceSessionStore();
