import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { canTrack, needsAnswer, onConsentChange, readChoice, saveChoices } from "@/lib/consent";
export const openPrivacySettings = () => window.dispatchEvent(new Event("privacy-settings-open"));
export const PrivacyNotice = () => {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const gpc = (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
  useEffect(() => {
    let active = true;
    const refresh = () => { setAnalytics(readChoice("analytics") === "granted"); void needsAnswer(["analytics"]).then(value => { if (active) setOpen(value); }); };
    refresh();
    const off = onConsentChange(refresh);
    const show = () => { setAnalytics(readChoice("analytics") === "granted"); setSettings(true); setOpen(true); };
    window.addEventListener("privacy-settings-open", show);
    return () => { active = false; off(); window.removeEventListener("privacy-settings-open", show); };
  }, []);
  useEffect(() => { if (open) panel.current?.focus(); }, [open]);
  const answer = (accept: boolean) => { saveChoices({ analytics: accept ? "granted" : "denied" }); setOpen(false); setSettings(false); if (accept) void canTrack("analytics"); };
  if (!open) return null;
  return <div ref={panel} tabIndex={-1} role="region" aria-label="Privacy preferences" className="fixed bottom-3 left-3 right-3 z-50 mx-auto max-w-xl border border-border bg-card p-4 shadow-elegant rounded-lg max-h-[80vh] overflow-y-auto"><h2 className="font-semibold">Privacy preferences</h2><p className="mt-2 text-sm text-muted-foreground">We count visits without cookies. If you accept, we also measure clicks. Optional visit statistics use session storage; sign-in and display preferences use necessary local storage. <Link to="/privacy" className="underline text-brand-orange">Privacy Policy</Link></p>{settings && <div className="my-4 space-y-3"><p className="text-sm">Necessary <span className="text-muted-foreground">— always on</span></p><div className="flex items-center justify-between gap-4 text-sm"><label htmlFor="analytics-choice">Analytics, provided by Lovable and Makiwa</label><Switch id="analytics-choice" checked={analytics && !gpc} disabled={gpc} onCheckedChange={setAnalytics} /></div>{gpc && <p className="text-xs text-muted-foreground">Your browser’s privacy signal applies. Optional analytics is off.</p>}<Button variant="outline" onClick={() => answer(analytics && !gpc)}>Save settings</Button></div>}<div className="mt-4 grid grid-cols-2 gap-2"><Button variant="outline" onClick={() => answer(true)} disabled={gpc}>Accept all</Button><Button variant="outline" onClick={() => answer(false)}>Reject all</Button></div><Button variant="link" className="mt-2 px-0" onClick={() => setSettings(true)}>Cookie settings</Button></div>;
};