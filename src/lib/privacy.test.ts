import { describe, it, expect } from "vitest";
import { familyDisplayName, maskPhone, maskReceiptPhones, mayPublishFamily, mayDownload, RETENTION } from "./privacy";
describe("privacy rules", () => {
  it("shows a first name followed by subsequent initials", () => expect(familyDisplayName("John Oloo Gachihi")).toBe("John O.G."));
  it("shows only initials for a protected minor", () => expect(familyDisplayName("John Oloo Gachihi", true)).toBe("J.O.G."));
  it("masks local M-Pesa phone numbers", () => expect(maskPhone("0712345123")).toBe("07XX XXX 123"));
  it("masks international M-Pesa phone numbers", () => expect(maskPhone("+254712345123")).toBe("07XX XXX 123"));
  it("masks phone numbers in older receipts", () => expect(maskReceiptPhones("Phone: 0712345123")).toBe("Phone: 07XX XXX 123"));
  it("requires consent before family publication", () => { expect(mayPublishFamily(false)).toBe(false); expect(mayPublishFamily(true)).toBe(true); });
  it("requires a signed-in account for download", () => { expect(mayDownload(null)).toBe(false); expect(mayDownload("user-1")).toBe(true); });
  it("keeps custom visits for 90 days", () => expect(RETENTION.visitsDays).toBe(90));
  it("keeps closed requests for 12 months", () => expect(RETENTION.closedRequestsMonths).toBe(12));
  it("keeps financial records for 7 years", () => expect(RETENTION.financialYears).toBe(7));
});