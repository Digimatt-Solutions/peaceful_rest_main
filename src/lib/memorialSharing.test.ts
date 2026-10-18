import { describe, expect, it } from "vitest";
import { MAKIWA_DESCRIPTION, memorialInvitation, memorialPreviewImage, memorialShareData, siteShareData } from "./memorialSharing";

describe("memorial sharing", () => {
  it("uses the exact personalized invitation", () => {
    expect(memorialInvitation("Adil Oloo")).toBe("Join us in honoring the life and times of Adil Oloo, on Makiwa, a digital memorial platform helping families preserve legacies.");
  });
  it("keeps the memorial identity and URL without payment or follow parameters", () => {
    expect(memorialShareData("memorial-123", "Adil Oloo", "https://makiwa.ke")).toEqual({
      title: "Adil Oloo | Makiwa",
      text: "Join us in honoring the life and times of Adil Oloo, on Makiwa, a digital memorial platform helping families preserve legacies.",
      url: "https://makiwa.ke/memorial/memorial-123",
    });
  });
  it("introduces the platform on site-wide shares", () => {
    const site = siteShareData("https://makiwa.ke");
    expect(site.url).toBe("https://makiwa.ke");
    expect(site.text).toBe(MAKIWA_DESCRIPTION);
    expect(site.title).toContain("Makiwa");
  });
  it("uses each deceased's profile photo rather than branding", () => {
    expect(memorialPreviewImage("https://photos.example/portrait.jpg", "https://makiwa.ke")).toBe("https://photos.example/portrait.jpg");
  });
  it("uses a safe candle fallback when a profile photo is missing or unsafe", () => {
    const fallback = memorialPreviewImage(null, "https://makiwa.ke");
    expect(fallback).toContain("candle.jpg");
    expect(memorialPreviewImage("javascript:alert(1)", "https://makiwa.ke")).toBe(fallback);
  });
});
