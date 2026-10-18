import { describe, expect, it } from "vitest";
import { DUEL_ATTACKS, sampleDuelPose } from "./choreography";

describe("Action Duel choreography", () => {
  it("moves the fighter through each attack rather than drawing static figures", () => {
    const resting = sampleDuelPose(0);
    const attacking = sampleDuelPose(DUEL_ATTACKS[0].at + DUEL_ATTACKS[0].duration * .5);
    expect(attacking.heroX).toBeGreaterThan(resting.heroX + 70);
    expect(attacking.slashPower).toBeGreaterThan(.2);
    expect(attacking.trail).toBeGreaterThan(.1);
  });

  it("updates the enemy only after attack contact", () => {
    const attack = DUEL_ATTACKS[2];
    const before = sampleDuelPose(attack.at - .03);
    const impact = sampleDuelPose(attack.at + attack.duration * .54);
    expect(impact.hits).toBe(before.hits + 1);
    expect(impact.enemyStagger).toBeGreaterThan(.3);
    expect(impact.enemyY).toBeLessThan(before.enemyY);
  });

  it("returns identical poses when scrubbing to the same timestamp", () => {
    expect(sampleDuelPose(8.46)).toEqual(sampleDuelPose(8.46));
  });

  it("has ten scored impacts before the closing scene", () => {
    expect(sampleDuelPose(15.15).hits).toBe(DUEL_ATTACKS.length);
  });
});
