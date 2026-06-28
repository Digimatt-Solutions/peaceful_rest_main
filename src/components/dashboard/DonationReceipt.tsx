import { format } from "date-fns";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Printer, CheckCircle2 } from "lucide-react";

interface ReceiptData {
  id: string;
  amount: number;
  donor_name?: string | null;
  donor_phone?: string | null;
  is_anonymous?: boolean;
  message?: string | null;
  created_at: string;
  fundraiser_title?: string;
  memorial_name?: string;
  status?: string;
}

export const buildReceiptHTML = (d: ReceiptData) => {
  const name = d.is_anonymous ? "Anonymous" : (d.donor_name || d.donor_phone || "Anonymous");
  const refNo = `MKW-${d.id.slice(0, 8).toUpperCase()}`;
  const date = format(new Date(d.created_at), "MMMM d, yyyy 'at' h:mm a");
  return `<!doctype html><html><head><meta charset="utf-8"/><title>Receipt ${refNo}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Georgia', 'Times New Roman', serif; background: #faf7f2; margin: 0; padding: 40px 20px; color: #1a1a1a; }
  .receipt { max-width: 640px; margin: 0 auto; background: #fff; border: 1px solid #f0e6d6; border-radius: 18px; overflow: hidden; box-shadow: 0 20px 60px -20px rgba(249,115,22,0.25); }
  .head { background: linear-gradient(135deg, #f97316, #ea580c); color: #fff; padding: 32px 36px; position: relative; }
  .head::after { content: ''; position: absolute; left: 0; right: 0; bottom: -1px; height: 16px; background: radial-gradient(circle at 10px -2px, transparent 8px, #fff 9px) repeat-x; background-size: 20px 16px; }
  .brand { font-size: 12px; letter-spacing: 4px; text-transform: uppercase; opacity: 0.9; }
  .h1 { font-size: 28px; margin: 6px 0 0; font-weight: 500; }
  .ref { font-size: 12px; margin-top: 12px; opacity: 0.85; font-family: 'Courier New', monospace; }
  .body { padding: 36px; }
  .amount { text-align: center; padding: 24px 0; border-bottom: 1px dashed #f0d6b8; }
  .amount .label { font-size: 11px; text-transform: uppercase; letter-spacing: 3px; color: #9a3412; }
  .amount .v { font-size: 44px; font-weight: 600; color: #ea580c; font-family: Georgia, serif; margin-top: 4px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px 28px; padding: 28px 0; border-bottom: 1px dashed #f0d6b8; }
  .row .k { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #999; }
  .row .v { font-size: 15px; margin-top: 4px; color: #1a1a1a; }
  .msg { padding: 24px 0; font-style: italic; color: #555; text-align: center; }
  .foot { padding: 24px 36px 36px; text-align: center; font-size: 12px; color: #888; line-height: 1.7; }
  .seal { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border: 1px solid #16a34a; color: #16a34a; border-radius: 999px; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 14px; }
  @media print { body { background: #fff; padding: 0; } .receipt { box-shadow: none; border: none; } }
</style></head>
<body><div class="receipt">
  <div class="head">
    <div class="brand">Makiwa Memorial</div>
    <h1 class="h1">Donation Receipt</h1>
    <div class="ref">Ref: ${refNo}</div>
  </div>
  <div class="body">
    <div class="amount">
      <div class="label">Amount Contributed</div>
      <div class="v">KSh ${Number(d.amount).toLocaleString()}</div>
      <div class="seal">✓ ${d.status === "paid" ? "Payment confirmed" : "Recorded"}</div>
    </div>
    <div class="grid">
      <div class="row"><div class="k">Donor</div><div class="v">${name}</div></div>
      <div class="row"><div class="k">Date</div><div class="v">${date}</div></div>
      ${d.donor_email && !d.is_anonymous ? `<div class="row"><div class="k">Email</div><div class="v">${d.donor_email}</div></div>` : ""}
      ${d.memorial_name ? `<div class="row"><div class="k">In memory of</div><div class="v">${d.memorial_name}</div></div>` : ""}
      ${d.fundraiser_title ? `<div class="row"><div class="k">Fundraiser</div><div class="v">${d.fundraiser_title}</div></div>` : ""}
    </div>
    ${d.message ? `<div class="msg">"${d.message}"</div>` : ""}
  </div>
  <div class="foot">
    Thank you for your generous contribution.<br/>
    Your support helps families honour and remember their loved ones.
  </div>
</div></body></html>`;
};

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  donation: ReceiptData | null;
}

export const DonationReceipt = ({ open, onOpenChange, donation }: Props) => {
  if (!donation) return null;
  const html = buildReceiptHTML(donation);
  const refNo = `MKW-${donation.id.slice(0, 8).toUpperCase()}`;

  const download = () => {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Receipt-${refNo}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const print = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 250);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <div className="bg-muted/30 max-h-[80vh] overflow-y-auto">
          <iframe srcDoc={html} className="w-full h-[70vh] border-0" title="Receipt preview" />
        </div>
        <div className="flex justify-end gap-2 p-4 border-t bg-background">
          <Button variant="outline" onClick={print}><Printer className="h-4 w-4 mr-1.5" /> Print</Button>
          <Button onClick={download} className="bg-brand-orange text-brand-white hover:bg-brand-orange/90">
            <Download className="h-4 w-4 mr-1.5" /> Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const ReceiptSuccessToast = ({ donation, onView }: { donation: ReceiptData; onView: () => void }) => (
  <div className="flex items-center gap-3">
    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
    <div className="flex-1">
      <p className="font-medium">Thank you for your contribution</p>
      <p className="text-xs text-muted-foreground">Receipt generated for KSh {Number(donation.amount).toLocaleString()}</p>
    </div>
    <Button size="sm" variant="outline" onClick={onView}>View receipt</Button>
  </div>
);
