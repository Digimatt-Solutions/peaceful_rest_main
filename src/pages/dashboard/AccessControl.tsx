import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldCheck, UserPlus, X } from "lucide-react";
import { toast } from "sonner";

const AccessControl = () => {
  const { user } = useAuth();
  const [memorials, setMemorials] = useState<any[]>([]);
  const [memorialId, setMemorialId] = useState("");
  const [admins, setAdmins] = useState<any[]>([]);
  const [email, setEmail] = useState("");

  useEffect(() => {
    document.title = "User Access · Peaceful Rest";
    if (!user) return;
    supabase.from("memorials").select("id,full_name").eq("created_by", user.id).then(({ data }) => {
      setMemorials(data || []); if (data?.[0]) setMemorialId(data[0].id);
    });
  }, [user]);

  const load = async () => {
    if (!memorialId) return;
    const { data } = await supabase.from("memorial_admins").select("id,user_id,permissions,created_at").eq("memorial_id", memorialId);
    if (!data) return setAdmins([]);
    const ids = data.map(a => a.user_id);
    const { data: profs } = await supabase.from("profiles").select("id,full_name,email,avatar_url").in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
    setAdmins(data.map(a => ({ ...a, profile: profs?.find(p => p.id === a.user_id) })));
  };

  useEffect(() => { load(); }, [memorialId]);

  const promote = async () => {
    if (!email || !memorialId) return;
    const { data: profile } = await supabase.from("profiles").select("id").eq("email", email).maybeSingle();
    if (!profile) return toast.error("No user found with that email");
    const { error } = await supabase.from("memorial_admins").insert({ memorial_id: memorialId, user_id: profile.id, permissions: ["edit"] });
    if (error) return toast.error(error.message);
    setEmail(""); load(); toast.success("Admin added");
  };

  const revoke = async (id: string) => {
    await supabase.from("memorial_admins").delete().eq("id", id);
    load();
  };

  return (
    <>
      <PageHeader title="User Access Control" subtitle="Promote trusted users to additional admins for a memorial." />
      {memorials.length === 0 ? <EmptyState icon={ShieldCheck} title="Create a memorial first" /> : (
        <>
          <div className="mb-6 max-w-sm">
            <Select value={memorialId} onValueChange={setMemorialId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{memorials.map(m => <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 mb-8 grid sm:grid-cols-[1fr_auto] gap-3 items-end">
            <div className="space-y-2"><Label>User email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="trusted@example.com" /></div>
            <Button onClick={promote} className="rounded-full bg-brand-orange text-brand-white hover:bg-brand-orange/90"><UserPlus className="h-4 w-4 mr-1" /> Promote</Button>
          </div>

          {admins.length === 0 ? <EmptyState icon={ShieldCheck} title="No additional admins" description="You are the primary admin for this memorial." /> : (
            <div className="space-y-3">
              {admins.map(a => (
                <div key={a.id} className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-brand-black flex items-center justify-center text-brand-white font-medium">
                    {(a.profile?.full_name || a.profile?.email || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{a.profile?.full_name || "Unknown"}</p>
                    <p className="text-sm text-muted-foreground">{a.profile?.email}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-cream">{a.permissions.join(", ")}</span>
                  <Button size="sm" variant="ghost" onClick={() => revoke(a.id)}><X className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
};

export default AccessControl;
