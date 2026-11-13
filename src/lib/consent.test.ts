import { beforeEach, describe, expect, it, vi } from "vitest";
import { canTrack, readChoice, saveChoices } from "./consent";
describe("analytics consent", () => {
  beforeEach(() => { localStorage.clear(); Object.defineProperty(navigator, "globalPrivacyControl", { value: false, configurable: true }); });
  it("rejecting analytics blocks collection", async () => { saveChoices({ analytics: "denied" }); expect(await canTrack("analytics")).toBe(false); });
  it("accepting analytics permits collection", async () => { saveChoices({ analytics: "granted" }); expect(await canTrack("analytics")).toBe(true); });
  it("global privacy control overrides acceptance", async () => { saveChoices({ analytics: "granted" }); Object.defineProperty(navigator, "globalPrivacyControl", { value: true, configurable: true }); expect(await canTrack("analytics")).toBe(false); });
  it("analytics consent does not grant advertising", () => { saveChoices({ analytics: "granted" }); expect(readChoice("advertising")).toBe(null); });
  it("a later refusal overrides acceptance", async () => { saveChoices({ analytics: "granted" }); saveChoices({ analytics: "denied" }); expect(await canTrack("analytics")).toBe(false); });
});