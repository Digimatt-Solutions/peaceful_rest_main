import { supabase } from "@/integrations/supabase/client";

export const PROOF_BUCKET = "memorial-verification";
export const MAX_PROOF_SIZE = 10 * 1024 * 1024;
export const PROOF_TYPES = [
  { value: "medical_record", label: "Medical records" },
  { value: "death_certificate", label: "Death certificate" },
  { value: "burial_permit", label: "Burial permit" },
] as const;
export type ProofType = typeof PROOF_TYPES[number]["value"];
export type DraftProof = {
  id: string;
  file: File;
  documentType: ProofType;
  uploaded?: boolean;
  recorded?: boolean;
};

const formats: Record<string, { mime: string; extension: string }> = {
  pdf: { mime: "application/pdf", extension: "pdf" },
  jpg: { mime: "image/jpeg", extension: "jpg" },
  jpeg: { mime: "image/jpeg", extension: "jpg" },
  png: { mime: "image/png", extension: "png" },
};

export function validateProofFile(file: File): string | null {
  const format = formats[file.name.split(".").pop()?.toLowerCase() || ""];
  if (!format || (file.type && file.type !== format.mime)) return "Please choose a PDF, JPG or PNG document.";
  if (file.size === 0) return "The document is empty. Please choose another file.";
  if (file.size > MAX_PROOF_SIZE) return "Please choose a document no larger than 10 MB.";
  return null;
}

export function requiresProof(isNew: boolean, documentCount: number): boolean {
  return isNew && documentCount < 1;
}

/** Upload before insertion; the creation triggers attach the evidence atomically. */
export async function prepareProofDocuments(userId: string, memorialId: string, documents: DraftProof[]): Promise<void> {
  if (requiresProof(true, documents.length)) throw new Error("Upload at least one proof-of-death document before creating this memorial.");
  for (const document of documents) {
    const validation = validateProofFile(document.file);
    if (validation) throw new Error(validation);
    const format = formats[document.file.name.split(".").pop()?.toLowerCase() || ""];
    if (!format) throw new Error("Please choose a PDF, JPG or PNG document.");
    const path = `${userId}/${memorialId}/${document.id}.${format.extension}`;
    if (!document.uploaded) {
      const { error } = await supabase.storage.from(PROOF_BUCKET).upload(path, document.file, { contentType: format.mime, upsert: false });
      if (error) throw new Error("The verification document could not be uploaded. Please try again.");
      document.uploaded = true;
    }
    if (!document.recorded) {
      const { error } = await supabase.from("memorial_proof_documents").insert({
        id: document.id, draft_memorial_id: memorialId, uploaded_by: userId,
        document_type: document.documentType, object_path: path,
        file_name: document.file.name, mime_type: format.mime, file_size: document.file.size,
      });
      if (error) throw new Error("The verification document could not be saved. Please try again.");
      document.recorded = true;
    }
  }
}