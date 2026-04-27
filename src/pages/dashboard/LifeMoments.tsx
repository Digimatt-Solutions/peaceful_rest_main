import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Plus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { MasonryGallery } from "@/components/gallery/MasonryGallery";

const LifeMoments = () => {
  const { user } = useAuth();
  const [memorials, setMemorials] = useState<any[]>([]);
  const [memorialId, setMemorialId] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ title: "", description: "", photo_url: "", memory_date: "" });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    document.title = "Life Moments · Peaceful Rest";
    if (!user) return;
    supabase.from("memorials").select("id,full_name").eq("created_by", user.id).then(({ data }) => {
      setMemorials(data || []); if (data?.[0]) setMemorialId(data[0].id);
    });
  }, [user]);

  useEffect(() => {
    if (!memorialId) return;
    supabase.from("memories").select("*").eq("memorial_id", memorialId).order("memory_date", { ascending: false })
      .then(({ data }) => setItems(data || []));
  }, [memorialId]);

  const upload = async (file: File) => {
    if (!user) return;
    setUploading(true);
    const path = `${user.id}/memories/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("memorial-media").upload(path, file);
    if (error) { toast.error(error.message); setUploading(false); return; }
    const { data } = supabase.storage.from("memorial-media").getPublicUrl(path);
    setForm(f => ({ ...f, photo_url: data.publicUrl }));
    setUploading(false);
  };

  const add = async () => {
    if (!user || !memorialId || !form.title) return;
    const { data, error } = await supabase.from("memories").insert({
      ...form, memorial_id: memorialId, user_id: user.id,
      memory_date: form.memory_date || null,
    }).select().maybeSingle();
    if (error) return toast.error(error.message);
    setItems([data, ...items]); setForm({ title: "", description: "", photo_url: "", memory_date: "" });
    toast.success("Memory added");
  };

  return (
    <>
      <PageHeader title="Life Moments" subtitle="A timeline of cherished photos and memories." />
      {memorials.length === 0 ? <EmptyState icon={Camera} title="Create a memorial first" /> : (
        <>
          <div className="mb-6 max-w-sm">
            <Select value={memorialId} onValueChange={setMemorialId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{memorials.map(m => <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 mb-8 space-y-4">
            <h3 className="font-serif text-xl">Share a moment</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} /></div>
              <div className="space-y-2"><Label>Date</Label><Input type="date" value={form.memory_date} onChange={(e) => setForm({...form, memory_date: e.target.value})} /></div>
              <div className="space-y-2 sm:col-span-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} /></div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Photo</Label>
                <div className="flex items-center gap-3">
                  {form.photo_url && <img src={form.photo_url} alt="" className="h-16 w-16 rounded-lg object-cover" />}
                  <Input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} disabled={uploading} />
                </div>
              </div>
            </div>
            <Button onClick={add} className="rounded-full bg-brand-orange text-brand-white hover:bg-brand-orange/90"><Plus className="h-4 w-4 mr-1" /> Add memory</Button>
          </div>

          {items.length === 0 ? <EmptyState icon={Camera} title="No moments yet" /> : (
            <MasonryGallery
              items={items.filter(i => i.photo_url).map(i => ({
                id: i.id,
                src: i.photo_url,
                title: i.title,
                description: i.description,
                date: i.memory_date ? format(new Date(i.memory_date), "MMMM d, yyyy") : undefined,
              }))}
            />
          )}
        </>
      )}
    </>
  );
};

export default LifeMoments;
