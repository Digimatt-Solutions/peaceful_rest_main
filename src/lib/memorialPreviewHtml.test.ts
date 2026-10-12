import { afterEach, describe, expect, it, vi } from "vitest";
import { memorialPreviewHtml } from "./memorialPreviewHtml";
import memorialPreview from "../../netlify/edge-functions/memorial-preview";

const original = '<html><head><title>Makiwa</title><meta property="og:title" content="Makiwa"><link rel="icon" href="/favicon.png"></head><body><div id="root"></div></body></html>';
const pageUrl = "https://makiwa.netlify.app/memorial/a2d5facb-18f7-4940-97bb-cb24e1cbefcb";
const portrait = "https://photos.example/dennis.jpg";
const memorial = { full_name: "Dennis Juma Machyo", profile_photo_url: portrait };

afterEach(() => vi.unstubAllGlobals());

describe("server-delivered memorial previews", () => {
  it("replaces the brand preview and page icon with the deceased's identity", () => {
    const doc = new DOMParser().parseFromString(memorialPreviewHtml(original, memorial, pageUrl), "text/html");
    expect(doc.title).toBe("Dennis Juma Machyo");
    expect(doc.querySelector('meta[property="og:image"]')?.getAttribute("content")).toBe(portrait);
    expect(doc.querySelector('link[rel="icon"]')?.getAttribute("href")).toBe(portrait);
    expect(doc.querySelector('meta[property="og:description"]')?.getAttribute("content")).toBe("Join us in honoring the life and times of Dennis Juma Machyo.");
    expect(doc.querySelector('meta[property="og:url"]')?.getAttribute("content")).toBe(pageUrl);
    expect(doc.querySelectorAll('meta[property="og:title"]')).toHaveLength(1);
  });

  it("keeps an appropriate default when no safe profile image is available", () => {
    const doc = new DOMParser().parseFromString(memorialPreviewHtml(original, { ...memorial, profile_photo_url: "javascript:alert(1)" }, pageUrl), "text/html");
    expect(doc.querySelector('link[rel="icon"]')?.getAttribute("href")).toBe("/favicon.png");
    expect(doc.querySelector('meta[property="og:image"]')).toBeNull();
  });

  it("does not allow memorial names to inject HTML", () => {
    const doc = new DOMParser().parseFromString(memorialPreviewHtml(original, { ...memorial, full_name: '<script>alert("name")</script>' }, pageUrl), "text/html");
    expect(doc.querySelector("script")).toBeNull();
    expect(doc.title).toBe('<script>alert("name")</script>');
  });

  it("delivers public memorial photos without requiring crawler JavaScript", async () => {
    vi.stubGlobal("Netlify", { env: { get: (name: string) => name === "VITE_SUPABASE_URL" ? "https://backend.example" : "public-test-key" } });
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([memorial]), { headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await memorialPreview(new Request(pageUrl), { next: async () => new Response(original, { headers: { "content-type": "text/html" } }) });
    expect(new URL(fetchMock.mock.calls[0][0]).searchParams.get("is_public")).toBe("eq.true");
    expect(await result.text()).toContain(`<meta property="og:image" content="${portrait}">`);
    expect(result.headers.get("cache-control")).toBe("no-store");
  });

  it("does not reveal private or missing memorials", async () => {
    vi.stubGlobal("Netlify", { env: { get: (name: string) => name === "VITE_SUPABASE_URL" ? "https://backend.example" : "public-test-key" } });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("[]")));
    const result = await memorialPreview(new Request(pageUrl), { next: async () => new Response(original) });
    expect(await result.text()).toBe(original);
  });
});