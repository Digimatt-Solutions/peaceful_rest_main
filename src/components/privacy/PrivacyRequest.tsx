import { useState } from "react";
import { ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { toast } from "sonner";
export const PrivacyRequest = ({ memorialId }: { memorialId?: string }) => {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [type, setType] = useState("removal");
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    if (data.get("website")) return;
    setBusy(true);
    const { error } = await supabase.from("privacy_requests").insert({ memorial_id: memorialId || null, requester_name: String(data.get("name")).trim(), email: String(data.get("email")).trim(), details: String(data.get("details")).trim(), request_type: type });
    setBusy(false);
    if (error) return toast.error("Your request could not be sent. Please contact info@makiwa.ke.");
    setSent(true);
  };
  return <><Button variant="outline" onClick={() => { setSent(false); setOpen(true); }} className="max-w-full whitespace-normal"><ShieldAlert className="mr-2 h-4 w-4 shrink-0" />Report / Request Removal</Button><Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Privacy request</DialogTitle></DialogHeader>{sent ? <div role="status" className="space-y-4"><p>Your request has been received by Makiwa’s privacy team. We will contact you at the email you provided.</p><Button onClick={() => setOpen(false)}>Close</Button></div> : <form onSubmit={submit} className="space-y-4"><div className="space-y-2"><Label htmlFor="privacy-name">Your name</Label><Input id="privacy-name" name="name" required minLength={2} maxLength={100} /></div><div className="space-y-2"><Label htmlFor="privacy-email">Email for our response</Label><Input id="privacy-email" name="email" type="email" required maxLength={254} /></div><Select value={type} onValueChange={setType}><SelectTrigger aria-label="Request type"><SelectValue /></SelectTrigger><SelectContent>{Object.entries({ removal: "Removal / erasure", access: "Access my data", correction: "Correct information", objection: "Object to processing", restriction: "Restrict processing", portability: "Data portability", consent: "Withdraw consent" }).map(([value,label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select><div className="space-y-2"><Label htmlFor="privacy-details">Information or link concerned and your request</Label><Textarea id="privacy-details" name="details" required minLength={10} maxLength={3000} rows={4} /></div><input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" /><p className="text-xs text-muted-foreground">Do not send ID documents or payment credentials. We may ask for proportionate verification or guardian authority. Your request is private to the privacy team. <Link className="underline text-brand-orange" to="/privacy">Privacy Policy — Coming Soon</Link></p><Button type="submit" disabled={busy}>{busy ? "Sending…" : "Send request"}</Button></form>}</DialogContent></Dialog></>;
};