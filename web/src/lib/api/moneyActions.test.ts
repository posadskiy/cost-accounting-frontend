import { describe, expect, it } from "vitest";
import {
  normalizeParticipants,
  parseParticipantIds,
  splitAmountPerParticipant,
} from "@/lib/api/moneyActions";

describe("moneyActions split helpers", () => {
  it("parses comma-separated participant ids", () => {
    expect(parseParticipantIds("u2, u3, ,u4")).toEqual(["u2", "u3", "u4"]);
  });

  it("normalizes participants with owner and uniqueness", () => {
    expect(normalizeParticipants("u1", ["u2", "u2", " u3 "])).toEqual(["u1", "u2", "u3"]);
  });

  it("splits amount evenly with 2-digit precision", () => {
    expect(splitAmountPerParticipant(100, 3)).toBe(33.33);
    expect(splitAmountPerParticipant(100, 0)).toBe(100);
  });
});
