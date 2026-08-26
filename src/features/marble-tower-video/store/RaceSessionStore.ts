import { makeAutoObservable } from "mobx";
import { createMarbleRoster, type MarbleConfig, type MarbleId } from "../marble/marbleCatalog";
import type { RaceSnapshot } from "../race/raceTypes";

function initialStandings(roster: MarbleConfig[]) {
  return roster.map((marble, index) => ({
    id: marble.id,
    position: index + 1,
    alive: true,
    progress: 0,
  }));
}

class RaceSessionStore {
  phase: RaceSnapshot["phase"] = "countdown";
  countdown = 3;
  elapsedMs = 0;
  leaderId: MarbleId | null = null;
  alive = 10;
  speed = 0;
  nextCut = "TOP 6 QUALIFY";
  pianoCombo = 0;
  callout = "GET READY";
  standings = initialStandings(createMarbleRoster(10));

  constructor() {
    makeAutoObservable(this);
  }

  reset(roster: MarbleConfig[] = createMarbleRoster(10)) {
    this.phase = "countdown";
    this.countdown = 3;
    this.elapsedMs = 0;
    this.leaderId = null;
    this.alive = roster.length;
    this.speed = 0;
    this.nextCut = "TOP 6 QUALIFY";
    this.pianoCombo = 0;
    this.callout = "GET READY";
    this.standings = initialStandings(roster);
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
