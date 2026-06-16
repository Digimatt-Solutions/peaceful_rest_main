import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ShieldCheck, UserPlus, X, Users, Trash2 } from "lucide-react";
import { toast } from "sonner";

const ROLE_OPTIONS = [
  { v: "super_admin", l: "Super Admin" },
  { v: "memorial_admin", l: "Memorial Admin / Family Rep" },
  { v: "mourner", l: "Mourner" },
];

const AccessControl = () => {
  const { user } = useAuth();
  const { isSuperAdmin } = useUserRole();
  const [memorials, setMemorials] = useState<any[]>([]);
  const [memorialId, setMemorialId] = useState("");
  const [admins, setAdmins] = useState<any[]>([]);
  const [email, setEmail] = useState("");

  // Super admin: all users
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [userRoles, setUserRoles] = useState<Record<string, string>>({});

  useEffect(() => {
    document.title = "User Access · Makiwa";
    if (!user) return;
    supabase.from("memorials").select("id,full_name").eq("created_by", user.id).then(({ data }) => {
      setMemorials(data || []); if (data?.[0]) setMemorialId(data[0].id);
    });
  }, [user]);

  const loadAdmins = async () => {
    if (!memorialId) return;
    const { data } = await supabase.from("memorial_admins").select("id,user_id,permissions,created_at").eq("memorial_id", memorialId);
    if (!data) return setAdmins([]);
    const ids = data.map(a => a.user_id);
    const { data: profs } = await supabase.from("profiles").select("id,full_name,email,avatar_url")
      .in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
    setAdmins(data.map(a => ({ ...a, profile: profs?.find(p => p.id === a.user_id) })));
  };

  useEffect(() => { loadAdmins(); }, [memorialId]);

  const loadAllUsers = async () => {
    const { data: profs } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setAllUsers(profs || []);
    const { data: roles } = await supabase.from("user_roles").select("user_id,role");
    const map: Record<string, string> = {};
    (roles || []).forEach((r: any) => { map[r.user_id] = r.role; });
    setUserRoles(map);
  };

  useEffect(() => { if (isSuperAdmin) loadAllUsers(); }, [isSuperAdmin]);

  const promote = async () => {
    if (!email || !memorialId) return;
    const { data: profile } = await supabase.from("profiles").select("id").eq("email", email).maybeSingle();
    if (!profile) return toast.error("No user found with that email");
    const { error } = await supabase.from("memorial_admins")
      .insert({ memorial_id: memorialId, user_id: profile.id, permissions: ["edit"] });
    if (error) return toast.error(error.message);
    setEmail(""); loadAdmins(); toast.success("Admin added");
  };

  const revoke = async (id: string) => {
    await supabase.from("memorial_admins").delete().eq("id", id);
    loadAdmins();
  };

  const changeRole = async (userId: string, newRole: string) => {
    // Delete existing roles then insert
    await supabase.from("user_roles").delete().eq("user_id", userId);
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole as any });
    if (error) return toast.error(error.message);
    setUserRoles(r => ({ ...r, [userId]: newRole }));
    toast.success("Role updated");
  };

  const deleteUserRoles = async (userId: string) => {
    if (!confirm("Remove all roles for this user? They will become a basic mourner.")) return;
    await supabase.from("user_roles").delete().eq("user_id", userId);
    await supabase.from("user_roles").insert({ user_id: userId, role: "mourner" as any });
    setUserRoles(r => ({ ...r, [userId]: "mourner" }));
    toast.success("Reset to Mourner");
  };

  if (!isSuperAdmin) {
    return (
      <>
        <PageHeader title="User Access Control" subtitle="Promote trusted users to additional admins for a memorial." />
        {memorials.length === 0 ? <EmptyState icon={ShieldCheck} title="Create a memorial first" /> : (
          <MemorialAdmins {...{ memorialId, setMemorialId, memorials, admins, email, setEmail, promote, revoke }} />
        )}
      </>
    );
  }

  return (
    <>
      <PageHeader title="User Access Control" subtitle="Manage user roles and memorial-level admins across the platform." />
      <Tabs defaultValue="users">
        <TabsList className="mb-6">
          <TabsTrigger value="users"><Users className="h-4 w-4 mr-1.5" /> All Users</TabsTrigger>
          <TabsTrigger value="memorial"><ShieldCheck className="h-4 w-4 mr-1.5" /> Memorial Admins</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-muted/30 text-sm font-medium text-muted-foreground">
              {allUsers.length} registered user{allUsers.length !== 1 ? "s" : ""}
            </div>
            <div className="divide-y divide-border">
              {allUsers.map(u => (
                <div key={u.id} className="p-4 flex items-center gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={u.avatar_url} />
                    <AvatarFallback className="bg-brand-orange text-white">{(u.full_name || u.email || "?").charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{u.full_name || "Unnamed"}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                  <Select value={userRoles[u.id] || "mourner"} onValueChange={(v) => changeRole(u.id, v)}>
                    <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map(r => <SelectItem key={r.v} value={r.v}>{r.l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="ghost" onClick={() => deleteUserRoles(u.id)} title="Reset roles">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              {allUsers.length === 0 && <div className="p-12 text-center text-muted-foreground text-sm">No users yet.</div>}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="memorial">
          {memorials.length === 0 ? <EmptyState icon={ShieldCheck} title="Create a memorial first" /> : (
            <MemorialAdmins {...{ memorialId, setMemorialId, memorials, admins, email, setEmail, promote, revoke }} />
          )}
        </TabsContent>
      </Tabs>
    </>
  );
};

const MemorialAdmins = ({ memorialId, setMemorialId, memorials, admins, email, setEmail, promote, revoke }: any) => (
  <>
    <div className="mb-6 max-w-sm">
      <Select value={memorialId} onValueChange={setMemorialId}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>{memorials.map((m: any) => <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>)}</SelectContent>
      </Select>
    </div>

    <div className="rounded-2xl border border-border bg-card p-6 mb-8 grid sm:grid-cols-[1fr_auto] gap-3 items-end">
      <div className="space-y-2"><Label>User email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="trusted@example.com" /></div>
      <Button onClick={promote} className="rounded-full bg-brand-orange text-brand-white hover:bg-brand-orange/90">
        <UserPlus className="h-4 w-4 mr-1" /> Promote
      </Button>
    </div>

    {admins.length === 0 ? <EmptyState icon={ShieldCheck} title="No additional admins" description="You are the primary admin for this memorial." /> : (
      <div className="space-y-3">
        {admins.map((a: any) => (
          <div key={a.id} className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={a.profile?.avatar_url} />
              <AvatarFallback className="bg-brand-orange text-white">{(a.profile?.full_name || a.profile?.email || "?").charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
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
);

export default AccessControl;
