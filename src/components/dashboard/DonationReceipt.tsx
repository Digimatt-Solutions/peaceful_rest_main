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
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Georgia','Times New Roman',serif;background:#efeae1;color:#1a1a1a;padding:48px 20px;-webkit-font-smoothing:antialiased}
  .r{max-width:560px;margin:0 auto;background:#faf7f2;border:1px solid #e6dfd1;padding:56px 48px 44px;position:relative}
  .top{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:28px;border-bottom:1px solid #1a1a1a}
  .brand{font-family:Georgia,serif;font-size:22px;font-weight:400;letter-spacing:-.5px}
  .brand small{display:block;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:#8a8a8a;margin-top:6px;font-family:Arial,sans-serif}
  .meta{text-align:right;font-family:Arial,sans-serif;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#8a8a8a;line-height:1.9}
  .meta b{display:block;font-family:'Courier New',monospace;font-size:12px;letter-spacing:1px;color:#1a1a1a;font-weight:600;text-transform:none;margin-top:4px}
  .title{margin-top:36px;font-family:Arial,sans-serif;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#8a8a8a}
  .amt{margin-top:10px;font-size:52px;font-weight:400;letter-spacing:-1.5px;line-height:1}
  .amt span{color:#8a8a8a;font-size:22px;margin-right:6px;letter-spacing:0}
  .rows{margin-top:44px;border-top:1px solid #e6dfd1}
  .row{display:flex;justify-content:space-between;padding:16px 0;border-bottom:1px solid #e6dfd1;gap:20px}
  .row .k{font-family:Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#8a8a8a;padding-top:2px}
  .row .v{font-size:15px;text-align:right;max-width:65%}
  .msg{margin-top:32px;padding:20px 22px;background:#f2ede3;border-left:2px solid #c9a86a;font-style:italic;font-size:14px;color:#4a4a4a;line-height:1.6}
  .foot{margin-top:44px;padding-top:24px;border-top:1px solid #1a1a1a;display:flex;justify-content:space-between;align-items:center;font-family:Arial,sans-serif;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#8a8a8a}
  .seal{display:inline-flex;align-items:center;gap:6px;color:#1a1a1a}
  .seal:before{content:"";width:6px;height:6px;background:#c9a86a;border-radius:50%}
  .thanks{margin-top:22px;text-align:center;font-family:Georgia,serif;font-style:italic;font-size:13px;color:#6a6a6a}
  @media print{body{background:#fff;padding:0}.r{border:none;padding:40px}}
</style></head>
<body><div class="r">
  <div class="top">
    <div class="brand">Makiwa<small>Memorial</small></div>
    <div class="meta">
      Receipt<b>${refNo}</b>
    </div>
  </div>

  <div class="title">Amount received</div>
  <div class="amt"><span>KSh</span>${Number(d.amount).toLocaleString()}</div>

  <div class="rows">
    <div class="row"><div class="k">Donor</div><div class="v">${name}</div></div>
    <div class="row"><div class="k">Date</div><div class="v">${date}</div></div>
    ${d.donor_phone && !d.is_anonymous ? `<div class="row"><div class="k">Phone</div><div class="v">${d.donor_phone}</div></div>` : ""}
    ${d.memorial_name ? `<div class="row"><div class="k">In memory of</div><div class="v">${d.memorial_name}</div></div>` : ""}
    ${d.fundraiser_title ? `<div class="row"><div class="k">Fundraiser</div><div class="v">${d.fundraiser_title}</div></div>` : ""}
    <div class="row"><div class="k">Status</div><div class="v">${d.status === "paid" ? "Confirmed" : "Recorded"}</div></div>
  </div>

  ${d.message ? `<div class="msg">"${d.message}"</div>` : ""}

  <div class="foot">
    <span class="seal">Verified receipt</span>
    <span>Makiwa · Nairobi, Kenya</span>
  </div>
  <p class="thanks">Thank you for honouring a life remembered.</p>
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
        <div className="bg-[#efeae1] max-h-[80vh] overflow-y-auto">
          <iframe srcDoc={html} className="w-full h-[70vh] border-0" title="Receipt preview" />
        </div>
        <div className="flex justify-end gap-2 p-4 border-t bg-background">
          <Button variant="outline" onClick={print}><Printer className="h-4 w-4 mr-1.5" /> Print</Button>
          <Button onClick={download} className="bg-foreground text-background hover:bg-foreground/90">
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
