import { describe, expect, it } from "vitest";
import {
  initialBreakSession,
  onBreakClosing,
  onBreakParked,
  onBreakStart,
} from "./break-session";

describe("break session", () => {
  it("starts on the notice slip", () => {
    expect(initialBreakSession()).toEqual({
      countingDown: true,
      closing: false,
      sharedBreakEndTime: null,
      generation: 0,
    });
  });

  it("clears a leftover closing flag when the next break starts", () => {
    const stuck = onBreakClosing(initialBreakSession());
    const next = onBreakStart(stuck, 1_700_000_000_000);
    expect(next.closing).toBe(false);
    expect(next.countingDown).toBe(false);
    expect(next.sharedBreakEndTime).toBe(1_700_000_000_000);
    expect(next.generation).toBe(stuck.generation + 1);
  });

  it("returns to a showable notice after the window is parked", () => {
    const during = onBreakStart(initialBreakSession(), 99);
    const parked = onBreakParked(onBreakClosing(during));
    expect(parked).toMatchObject({
      countingDown: true,
      closing: false,
      sharedBreakEndTime: null,
    });
    expect(parked.generation).toBeGreaterThan(during.generation);
  });
});
