import { beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_PROOF_SIZE, PROOF_TYPES, prepareProofDocuments, requiresProof, validateProofFile, type DraftProof } from "./proofOfDeath";

const mocks = vi.hoisted(() => ({ upload: vi.fn(), insert: vi.fn(), storageFrom: vi.fn(), tableFrom: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { storage: { from: mocks.storageFrom }, from: mocks.tableFrom } }));
beforeEach(() => {
  vi.clearAllMocks();
  mocks.upload.mockResolvedValue({ error: null });
  mocks.insert.mockResolvedValue({ error: null });
  mocks.storageFrom.mockReturnValue({ upload: mocks.upload });
  mocks.tableFrom.mockReturnValue({ insert: mocks.insert });
});

describe("proof-of-death rules", () => {
  it("requires at least one document before a new memorial can be submitted", () => {
    expect(requiresProof(true, 0)).toBe(true);
    expect(requiresProof(true, 1)).toBe(false);
    expect(requiresProof(false, 0)).toBe(false);
  });
  it.each([["certificate.PDF", "application/pdf"], ["permit.jpg", "image/jpeg"], ["record.png", "image/png"]])("accepts %s", (name, type) => {
    expect(validateProofFile(new File(["content"], name, { type }))).toBeNull();
  });
  it("rejects other formats and mismatched file types", () => {
    expect(validateProofFile(new File(["content"], "record.docx"))).not.toBeNull();
    expect(validateProofFile(new File(["content"], "record.png", { type: "text/html" }))).not.toBeNull();
  });
  it("rejects empty documents and documents over the stated upload limit", () => {
    expect(validateProofFile(new File([], "record.pdf", { type: "application/pdf" }))).not.toBeNull();
    expect(validateProofFile(new File([new Uint8Array(MAX_PROOF_SIZE + 1)], "record.pdf", { type: "application/pdf" }))).not.toBeNull();
  });
  it("supports medical records, death certificates and burial permits", () => {
    expect(PROOF_TYPES.map(type => type.value)).toEqual(["medical_record", "death_certificate", "burial_permit"]);
  });
  it("blocks empty evidence before any upload or memorial submission", async () => {
    await expect(prepareProofDocuments("owner", "memorial", [])).rejects.toThrow();
    expect(mocks.upload).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it("uploads privately and associates the document with the memorial draft, without public URLs", async () => {
    const file = new File(["content"], "permit.png", { type: "image/png" });
    await prepareProofDocuments("owner", "memorial", [{ id: "document", file, documentType: "burial_permit" }]);
    expect(mocks.storageFrom).toHaveBeenCalledWith("memorial-verification");
    expect(mocks.upload).toHaveBeenCalledWith("owner/memorial/document.png", file, { contentType: "image/png", upsert: false });
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ draft_memorial_id: "memorial", uploaded_by: "owner", document_type: "burial_permit", object_path: "owner/memorial/document.png" }));
  });
  it("does not record evidence after a failed upload and can retry", async () => {
    const documents: DraftProof[] = [{ id: "document", file: new File(["content"], "record.pdf", { type: "application/pdf" }), documentType: "medical_record" }];
    mocks.upload.mockResolvedValueOnce({ error: new Error("offline") });
    await expect(prepareProofDocuments("owner", "memorial", documents)).rejects.toThrow();
    expect(mocks.insert).not.toHaveBeenCalled();
    await prepareProofDocuments("owner", "memorial", documents);
    expect(mocks.upload).toHaveBeenCalledTimes(2);
    expect(mocks.insert).toHaveBeenCalledTimes(1);
  });
  it("reuses successful uploads if metadata saving fails without overlapping duplicate uploads", async () => {
    const documents: DraftProof[] = [{ id: "document", file: new File(["content"], "record.pdf", { type: "application/pdf" }), documentType: "medical_record" }];
    mocks.insert.mockResolvedValueOnce({ error: new Error("offline") });
    await expect(prepareProofDocuments("owner", "memorial", documents)).rejects.toThrow();
    await prepareProofDocuments("owner", "memorial", documents);
    await prepareProofDocuments("owner", "memorial", documents);
    expect(mocks.upload).toHaveBeenCalledTimes(1);
    expect(mocks.insert).toHaveBeenCalledTimes(2);
  });
});