import { memorialPreviewHtml, type PublicMemorialPreview } from "../../src/lib/memorialPreviewHtml.ts";

type EdgeContext = { next: () => Promise<Response> };
type EdgeRuntime = typeof globalThis & {
  Netlify?: { env: { get: (name: string) => string | undefined } };
};

export default async function memorialPreview(request: Request, context: EdgeContext) {
  const url = new URL(request.url);
  const id = url.pathname.match(/^\/memorial\/([a-f\d-]{36})\/?$/i)?.[1];
  if (!id || request.method !== "GET") return context.next();

  // Use the same public connection as the deployed app, never a service-role key.
  const env = (globalThis as EdgeRuntime).Netlify?.env;
  const backendUrl = env?.get("VITE_SUPABASE_URL");
  const publicKey = env?.get("VITE_SUPABASE_PUBLISHABLE_KEY") || env?.get("VITE_SUPABASE_ANON_KEY");
  if (!backendUrl || !publicKey) return context.next();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  try {
    const query = new URL("/rest/v1/memorials", backendUrl);
    query.searchParams.set("select", "full_name,profile_photo_url");
    query.searchParams.set("id", `eq.${id}`);
    query.searchParams.set("is_public", "eq.true");
    query.searchParams.set("limit", "1");
    const result = await fetch(query, {
      headers: { apikey: publicKey, Authorization: `Bearer ${publicKey}` },
      signal: controller.signal,
    });
    if (!result.ok) return context.next();
    const memorials: PublicMemorialPreview[] = await result.json();
    const memorial = memorials[0];
    if (!memorial || typeof memorial.full_name !== "string" || !memorial.full_name.trim()) return context.next();
    const response = await context.next();
    if (!response.ok || !response.headers.get("content-type")?.includes("text/html")) return response;
    const html = await response.text();
    const headers = new Headers(response.headers);
    headers.delete("content-length");
    headers.delete("content-encoding");
    headers.delete("etag");
    // Do not retain personalized metadata after a memorial becomes private.
    headers.set("cache-control", "no-store");
    return new Response(memorialPreviewHtml(html, memorial, url.href), { status: response.status, headers });
  } catch {
    // A delayed/unavailable public lookup must never prevent opening the memorial.
    return context.next();
  } finally {
    clearTimeout(timeout);
  }
}