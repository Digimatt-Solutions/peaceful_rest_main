import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Camera, Plus, Trash2, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const LifeMoments = () => {
  const { user } = useAuth();
  const [memorials, setMemorials] = useState<any[]>([]);
  const [memorialId, setMemorialId] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ title: "", description: "", memory_date: "" });
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.title = "Life Moments · Makiwa";
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

  const uploadFiles = async (files: FileList) => {
    if (!user) return;
    setUploading(true);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const path = `${user.id}/memories/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("memorial-media").upload(path, file);
      if (error) { toast.error(error.message); continue; }
      const { data } = supabase.storage.from("memorial-media").getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    setPhotos(p => [...p, ...urls]);
    setUploading(false);
  };

  const add = async () => {
    if (!user || !memorialId || !form.title) return toast.error("Title required");
    if (photos.length === 0) return toast.error("Add at least one photo");
    setSaving(true);
    const { data, error } = await (supabase as any).from("memories").insert({
      memorial_id: memorialId, user_id: user.id,
      title: form.title, description: form.description,
      photo_url: photos[0], photos,
      memory_date: form.memory_date || null,
    }).select().maybeSingle();
    setSaving(false);
    if (error) return toast.error(error.message);
    setItems([data, ...items]);
    setForm({ title: "", description: "", memory_date: "" });
    setPhotos([]);
    toast.success("Memory added");
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this memory?")) return;
    const { error } = await supabase.from("memories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setItems(items.filter(i => i.id !== id));
    toast.success("Deleted");
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
                <Label>Photos <span className="text-xs text-muted-foreground font-normal">(add multiple)</span></Label>
                {photos.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-2">
                    {photos.map((url, i) => (
                      <div key={i} className="relative group">
                        <img src={url} alt="" className="h-24 w-full rounded-lg object-cover" />
                        <button onClick={() => setPhotos(p => p.filter((_, idx) => idx !== i))} className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-black/80 text-white inline-flex items-center justify-center">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <Input type="file" accept="image/*" multiple onChange={(e) => e.target.files && uploadFiles(e.target.files)} disabled={uploading} />
                {uploading && <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5"><Loader2 className="h-3 w-3 animate-spin" /> Uploading…</p>}
              </div>
            </div>
            <Button onClick={add} disabled={saving} className="rounded-full bg-brand-orange text-brand-white hover:bg-brand-orange/90">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />} Add memory
            </Button>
          </div>

          {items.length === 0 ? <EmptyState icon={Camera} title="No moments yet" /> : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {items.map(m => {
                const pics: string[] = (m.photos && m.photos.length ? m.photos : (m.photo_url ? [m.photo_url] : []));
                return (
                  <div key={m.id} className="group rounded-2xl border border-border bg-card overflow-hidden hover:shadow-elegant transition-shadow">
                    {pics.length > 0 && (
                      <div className="relative">
                        <img src={pics[0]} alt={m.title} className="w-full h-52 object-cover" />
                        {pics.length > 1 && (
                          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-xs">+{pics.length - 1}</span>
                        )}
                        <button onClick={() => remove(m.id)} className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 h-8 w-8 rounded-full bg-red-500/90 text-white inline-flex items-center justify-center transition-opacity">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                    <div className="p-4">
                      <h4 className="font-serif text-lg">{m.title}</h4>
                      {m.memory_date && <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(m.memory_date), "MMMM d, yyyy")}</p>}
                      {m.description && <p className="text-sm text-foreground/80 mt-2 line-clamp-3">{m.description}</p>}
                      {pics.length > 1 && (
                        <div className="mt-3 flex gap-1.5 overflow-x-auto">
                          {pics.slice(1).map((u, i) => <img key={i} src={u} alt="" className="h-12 w-12 rounded object-cover shrink-0" />)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </>
  );
};

export default LifeMoments;
