import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { BookHeart, MessageCircle, HeartHandshake, Eye, CalendarHeart, Plus } from "lucide-react";

const Stat = ({ label, value, icon: Icon }: { label: string; value: string | number; icon: any }) => (
  <div className="rounded-2xl border border-border bg-card p-6 hover:shadow-elegant transition-shadow">
    <div className="flex items-center justify-between">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <div className="h-9 w-9 rounded-lg bg-brand-black flex items-center justify-center">
        <Icon className="h-4 w-4 text-brand-orange" />
      </div>
    </div>
    <div className="mt-5 font-serif text-4xl">{value}</div>
  </div>
);

const Overview = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ memorials: 0, condolences: 0, donations: 0, visitors: 0 });

  useEffect(() => {
    document.title = "Dashboard · Makiwa";
    if (!user) return;
    const load = async () => {
      const { data: mems } = await supabase.from("memorials").select("id,visitor_count").eq("created_by", user.id);
      const memIds = (mems || []).map(m => m.id);
      const visitors = (mems || []).reduce((s, m) => s + (m.visitor_count || 0), 0);

      let condCount = 0, donTotal = 0;
      if (memIds.length) {
        const { count } = await supabase.from("condolences").select("id", { count: "exact", head: true }).in("memorial_id", memIds);
        condCount = count || 0;
        const { data: funds } = await supabase.from("fundraisers").select("raised_amount").in("memorial_id", memIds);
        donTotal = (funds || []).reduce((s, f) => s + Number(f.raised_amount || 0), 0);
      }
      setStats({ memorials: mems?.length || 0, condolences: condCount, donations: donTotal, visitors });
    };
    load();
  }, [user]);

  return (
    <>
      <PageHeader
        title="Welcome back"
        subtitle="A gentle overview of the memorials and tributes you care for."
        action={
          <Button asChild className="rounded-full bg-brand-orange text-brand-white hover:bg-brand-orange/90">
            <Link to="/dashboard/obituary"><Plus className="h-4 w-4 mr-1" /> Create Memorial</Link>
          </Button>
        }
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Stat label="Memorials" value={stats.memorials} icon={BookHeart} />
        <Stat label="Visitors" value={stats.visitors.toLocaleString()} icon={Eye} />
        <Stat label="Condolences" value={stats.condolences} icon={MessageCircle} />
        <Stat label="Donations" value={`KSh ${stats.donations.toLocaleString()}`} icon={HeartHandshake} />
      </div>

      <div className="mt-10 grid lg:grid-cols-2 gap-5">
        <div className="rounded-2xl border border-border bg-card p-7">
          <div className="flex items-center gap-3 mb-4">
            <CalendarHeart className="h-5 w-5 text-brand-orange" />
            <h3 className="font-serif text-xl">Upcoming anniversaries</h3>
          </div>
          <p className="text-sm text-muted-foreground">Add anniversaries from the Anniversary module to see them here.</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-7">
          <div className="flex items-center gap-3 mb-4">
            <MessageCircle className="h-5 w-5 text-brand-orange" />
            <h3 className="font-serif text-xl">Recent activity</h3>
          </div>
          <p className="text-sm text-muted-foreground">New condolences and tributes will appear here as they arrive.</p>
        </div>
      </div>
    </>
  );
};

export default Overview;
