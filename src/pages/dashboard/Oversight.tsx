import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/dashboard/PageHeader";
import { Input } from "@/components/ui/input";
import { useUserRole } from "@/hooks/useUserRole";
import { Eye, EyeOff, Search, ShieldCheck, Trash2, ExternalLink, Users } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const Oversight = () => {
  const { isSuperAdmin, loading: roleLoading } = useUserRole();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    document.title = "Memorial Oversight · Peaceful Rest";
  }, []);

  useEffect(() => {
    if (!isSuperAdmin) return;
    setLoading(true);
    supabase
      .from("memorials")
      .select("id,full_name,location,visitor_count,is_public,created_at,date_of_death,profile_photo_url,created_by")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setItems(data || []);
        setLoading(false);
      });
  }, [isSuperAdmin]);

  const togglePublic = async (m: any) => {
    const { error } = await supabase.from("memorials").update({ is_public: !m.is_public }).eq("id", m.id);
    if (error) return toast.error(error.message);
    setItems(items.map(x => x.id === m.id ? { ...x, is_public: !m.is_public } : x));
    toast.success(m.is_public ? "Memorial hidden" : "Memorial published");
  };

  const remove = async (m: any) => {
    if (!confirm(`Permanently delete the memorial for ${m.full_name}? This cannot be undone.`)) return;
    const { error } = await supabase.from("memorials").delete().eq("id", m.id);
    if (error) return toast.error(error.message);
    setItems(items.filter(x => x.id !== m.id));
    toast.success("Memorial removed");
  };

  if (roleLoading) return null;
  if (!isSuperAdmin) {
    return <EmptyState icon={ShieldCheck} title="Restricted area" description="Only super admins can view oversight." />;
  }

  const filtered = items.filter(i =>
    !q || i.full_name?.toLowerCase().includes(q.toLowerCase()) || i.location?.toLowerCase().includes(q.toLowerCase())
  );

  const total = items.length;
  const live = items.filter(i => i.is_public).length;
  const visits = items.reduce((sum, i) => sum + (i.visitor_count || 0), 0);

  return (
    <>
      <PageHeader title="Memorial Oversight" subtitle="A super-admin view of every memorial across the platform." />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <Stat label="Memorials" value={total} />
        <Stat label="Public" value={live} />
        <Stat label="Total visits" value={visits.toLocaleString()} />
      </div>

      <div className="relative max-w-md mb-6">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or location…" className="pl-9 rounded-xl" />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="No memorials yet" description="Memorials created on the platform will appear here." />
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left font-medium px-5 py-3">Memorial</th>
                  <th className="text-left font-medium px-5 py-3">Location</th>
                  <th className="text-left font-medium px-5 py-3">Status</th>
                  <th className="text-left font-medium px-5 py-3">Visits</th>
                  <th className="text-left font-medium px-5 py-3">Created</th>
                  <th className="text-right font-medium px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(m => (
                  <tr key={m.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-foreground text-background overflow-hidden flex items-center justify-center font-serif text-xs shrink-0">
                          {m.profile_photo_url
                            ? <img src={m.profile_photo_url} alt="" className="h-full w-full object-cover" />
                            : m.full_name?.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{m.full_name}</p>
                          {m.date_of_death && <p className="text-xs text-muted-foreground">d. {format(new Date(m.date_of_death), "MMM d, yyyy")}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{m.location || "—"}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${m.is_public ? "bg-brand-orange/10 text-brand-orange" : "bg-muted text-muted-foreground"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${m.is_public ? "bg-brand-orange" : "bg-muted-foreground"}`} />
                        {m.is_public ? "Public" : "Hidden"}
                      </span>
                    </td>
                    <td className="px-5 py-3">{(m.visitor_count || 0).toLocaleString()}</td>
                    <td className="px-5 py-3 text-muted-foreground">{format(new Date(m.created_at), "MMM d, yyyy")}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/memorial/${m.id}`} target="_blank" className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground" title="View">
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                        <button onClick={() => togglePublic(m)} className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground" title={m.is_public ? "Hide" : "Publish"}>
                          {m.is_public ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button onClick={() => remove(m)} className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
};

const Stat = ({ label, value }: { label: string; value: string | number }) => (
  <div className="rounded-2xl border border-border bg-card p-5">
    <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
    <p className="mt-2 font-serif text-3xl">{value}</p>
  </div>
);

export default Oversight;
