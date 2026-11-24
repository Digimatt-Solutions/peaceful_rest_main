import { useEffect, useId, useState } from "react";
import { FileCheck2, Download, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { DraftProof, ProofType, PROOF_BUCKET, PROOF_TYPES, validateProofFile } from "@/lib/proofOfDeath";
import { toast } from "sonner";

export function ProofOfDeath({ documents, onChange, busy }: {
  documents: DraftProof[];
  onChange: (documents: DraftProof[]) => void;
  busy: boolean;
}) {
  const inputId = useId();
  const [documentType, setDocumentType] = useState<ProofType>("death_certificate");
  return (
    <section aria-label="Proof of Death" className="border-t border-border pt-5 space-y-4">
      <div className="flex items-center gap-2">
        <FileCheck2 className="h-5 w-5 text-brand-orange shrink-0" />
        <h3 className="font-serif text-xl">Proof of Death <span className="text-brand-orange">*</span></h3>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Upload at least one medical record, death certificate or burial permit. These documents are used strictly for verification, are accessible only to authorised administrators, and never appear on public memorial profiles.
      </p>
      <div className="space-y-2">
        <Label htmlFor={`${inputId}-type`}>Document type</Label>
        <Select value={documentType} onValueChange={value => setDocumentType(value as ProofType)} disabled={busy}>
          <SelectTrigger id={`${inputId}-type`}><SelectValue /></SelectTrigger>
          <SelectContent>{PROOF_TYPES.map(type => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor={inputId}>Supporting documents</Label>
        <Input id={inputId} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" disabled={busy}
          onChange={event => {
            const selected = Array.from(event.target.files || []);
            const valid = selected.filter(file => {
              const error = validateProofFile(file);
              if (error) toast.error(`${file.name}: ${error}`);
              return !error;
            });
            onChange([...documents, ...valid.map(file => ({ id: crypto.randomUUID(), file, documentType }))]);
            event.target.value = "";
          }} />
        <p className="text-xs text-muted-foreground">PDF, JPG or PNG · Up to 10 MB per document</p>
      </div>
      {documents.length > 0 && <ul className="space-y-2">
        {documents.map(document => <li key={document.id} className="flex items-center justify-between gap-3 border-b border-border pb-2">
          <div className="min-w-0"><p className="text-sm break-words">{document.file.name}</p><p className="text-xs text-muted-foreground">{PROOF_TYPES.find(type => type.value === document.documentType)?.label}</p></div>
          <Button type="button" variant="ghost" size="icon" className="shrink-0" disabled={busy || document.uploaded} aria-label={`Remove ${document.file.name}`} title="Remove document" onClick={() => onChange(documents.filter(item => item.id !== document.id))}><X className="h-4 w-4" /></Button>
        </li>)}
      </ul>}
      {busy && <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Saving private verification documents…</p>}
    </section>
  );
}

type SavedProof = { id: string; file_name: string; document_type: string; object_path: string };

export function MemorialProofDocuments({ memorialId }: { memorialId: string }) {
  const [documents, setDocuments] = useState<SavedProof[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setDocuments([]);
    void supabase.from("memorial_proof_documents").select("id,file_name,document_type,object_path").eq("memorial_id", memorialId).order("created_at")
      .then(({ data, error }) => {
        if (!active) return;
        setDocuments(data || []);
        setFailed(Boolean(error));
        setLoading(false);
      });
    return () => { active = false; };
  }, [memorialId, retry]);
  const download = async (document: SavedProof) => {
    if (downloading) return;
    setDownloading(document.id);
    try {
      const { data, error } = await supabase.storage.from(PROOF_BUCKET).download(document.object_path);
      if (error || !data) throw new Error("Document unavailable");
      const url = URL.createObjectURL(data);
      const link = window.document.createElement("a");
      link.href = url;
      link.download = document.file_name;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { toast.error("This verification document could not be downloaded. Please try again."); }
    finally { setDownloading(null); }
  };
  return <section aria-label="Proof of Death" className="border-t border-border pt-5 space-y-3">
    <h3 className="font-serif text-xl">Proof of Death</h3>
    <p className="text-sm text-muted-foreground">Private documents used strictly for verification. Only authorised administrators can access them.</p>
    {loading ? <p role="status" className="text-sm text-muted-foreground">Loading verification documents…</p> : failed ? <div><p role="alert" className="text-sm text-destructive">Verification documents could not be loaded.</p><Button type="button" variant="outline" onClick={() => setRetry(value => value + 1)}>Try again</Button></div> : !documents.length ? <p className="text-sm text-muted-foreground">No proof-of-death documents were uploaded for this existing memorial.</p> : <ul className="space-y-2">{documents.map(document => <li key={document.id} className="flex items-center justify-between gap-3 border-b border-border pb-2"><div className="min-w-0"><p className="break-words text-sm">{document.file_name}</p><p className="text-xs text-muted-foreground">{PROOF_TYPES.find(type => type.value === document.document_type)?.label}</p></div><Button type="button" size="icon" variant="outline" className="shrink-0" disabled={downloading !== null} aria-label={`Download ${document.file_name}`} title="Download for verification" onClick={() => void download(document)}>{downloading === document.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}</Button></li>)}</ul>}
  </section>;
}