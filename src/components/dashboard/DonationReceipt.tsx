import { format } from "date-fns";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Printer, CheckCircle2 } from "lucide-react";
import mpesaLogo from "@/assets/mpesa-logo.png";
import paystackLogo from "@/assets/paystack-logo.png";

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
  payment_method?: string | null;
}

const absUrl = (p: string) => (typeof window !== "undefined" ? `${window.location.origin}${p}` : p);

const methodMeta = (m?: string | null) => {
  const k = (m || "").toLowerCase();
  if (k === "mpesa") return { label: "M-PESA", logo: absUrl(mpesaLogo) };
  if (k === "paystack") return { label: "Paystack", logo: absUrl(paystackLogo) };
  return { label: "Cash / Manual", logo: "" };
};

export const buildReceiptHTML = (d: ReceiptData) => {
  const name = d.is_anonymous ? "Anonymous" : (d.donor_name || d.donor_phone || "Anonymous");
  const refNo = `MKW-${d.id.slice(0, 8).toUpperCase()}`;
  const dateStr = format(new Date(d.created_at), "dd/MM/yyyy");
  const timeStr = format(new Date(d.created_at), "HH:mm:ss");
  const method = methodMeta(d.payment_method);
  const amount = Number(d.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return `<!doctype html><html><head><meta charset="utf-8"/><title>Receipt ${refNo}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{background:#e9e9e9}
  body{font-family:'Courier New','Courier',monospace;color:#111;padding:32px 12px;-webkit-font-smoothing:antialiased;display:flex;justify-content:center}
  .r{width:340px;background:#fff;padding:22px 20px 26px;position:relative;box-shadow:0 10px 30px rgba(0,0,0,.15)}
  /* jagged top + bottom edges like a POS slip */
  .r:before,.r:after{content:"";position:absolute;left:0;right:0;height:10px;background:
    linear-gradient(-45deg, transparent 33%, #fff 33% 66%, transparent 66%) 0 0/12px 12px,
    linear-gradient(45deg, transparent 33%, #fff 33% 66%, transparent 66%) 0 0/12px 12px;}
  .r:before{top:-10px}
  .r:after{bottom:-10px;transform:rotate(180deg)}
  .brand{text-align:center;padding-bottom:12px;border-bottom:1px dashed #999}
  .brand h1{font-family:Georgia,serif;font-size:22px;font-weight:700;letter-spacing:1px}
  .brand p{font-size:10px;color:#555;margin-top:3px;letter-spacing:1px}
  .head{margin-top:12px;font-size:11px;text-align:center;line-height:1.6}
  .head b{display:block;font-size:13px;letter-spacing:1px;margin-top:2px}
  .sep{border-top:1px dashed #999;margin:10px 0}
  .row{display:flex;justify-content:space-between;font-size:12px;line-height:1.7}
  .row .k{color:#333}
  .row .v{color:#000;font-weight:600;text-align:right;max-width:60%;word-break:break-word}
  .item{display:flex;justify-content:space-between;font-size:12px;margin-top:6px}
  .item .desc{max-width:65%}
  .item .amt{font-weight:700}
  .total{display:flex;justify-content:space-between;align-items:baseline;margin-top:12px;padding-top:10px;border-top:2px dashed #111}
  .total .lbl{font-size:12px;letter-spacing:2px}
  .total .val{font-family:Georgia,serif;font-size:22px;font-weight:700}
  .method{margin-top:14px;padding:10px 12px;background:#f6f6f6;border:1px dashed #bbb;text-align:center}
  .method img{max-height:28px;max-width:110px;display:inline-block;vertical-align:middle;margin-bottom:4px}
  .method .lbl{display:block;font-size:10px;letter-spacing:2px;color:#666;margin-top:4px}
  .msg{margin-top:12px;font-size:11px;font-style:italic;text-align:center;color:#444;line-height:1.5}
  .status{margin-top:14px;text-align:center;font-size:11px;letter-spacing:2px;font-weight:700}
  .status.paid{color:#059669}
  .status.pending{color:#b45309}
  .foot{margin-top:16px;text-align:center;font-size:10px;color:#666;line-height:1.6}
  .foot .thanks{font-family:Georgia,serif;font-style:italic;font-size:12px;color:#111;margin-top:6px}
  .bar{margin-top:12px;height:32px;background:repeating-linear-gradient(90deg,#111 0 1px,transparent 1px 3px,#111 3px 5px,transparent 5px 8px)}
  .barno{text-align:center;font-size:10px;letter-spacing:3px;margin-top:4px}
  @media print{body{background:#fff;padding:0}.r{box-shadow:none}}
</style></head>
<body><div class="r">
  <div class="brand">
    <h1>MAKIWA</h1>
    <p>MEMORIAL &middot; NAIROBI, KENYA</p>
  </div>

  <div class="head">
    OFFICIAL RECEIPT
    <b>${refNo}</b>
  </div>

  <div class="sep"></div>

  <div class="row"><span class="k">Date</span><span class="v">${dateStr}</span></div>
  <div class="row"><span class="k">Time</span><span class="v">${timeStr}</span></div>
  <div class="row"><span class="k">Cashier</span><span class="v">MAKIWA-BOT</span></div>

  <div class="sep"></div>

  <div class="row"><span class="k">Donor</span><span class="v">${name}</span></div>
  ${d.donor_phone && !d.is_anonymous ? `<div class="row"><span class="k">Phone</span><span class="v">${d.donor_phone}</span></div>` : ""}
  ${d.memorial_name ? `<div class="row"><span class="k">In memory of</span><span class="v">${d.memorial_name}</span></div>` : ""}

  <div class="sep"></div>

  <div class="item">
    <span class="desc">${d.fundraiser_title || "Contribution"}</span>
    <span class="amt">${amount}</span>
  </div>

  <div class="total">
    <span class="lbl">TOTAL KSH</span>
    <span class="val">${amount}</span>
  </div>

  <div class="method">
    ${method.logo ? `<img src="${method.logo}" alt="${method.label}"/>` : `<div style="font-weight:700;font-size:14px">${method.label}</div>`}
    <span class="lbl">PAID VIA ${method.label}</span>
  </div>

  ${d.message ? `<div class="msg">"${d.message}"</div>` : ""}

  <div class="status ${d.status === "paid" ? "paid" : "pending"}">
    ${d.status === "paid" ? "*** CONFIRMED ***" : "*** RECORDED ***"}
  </div>

  <div class="bar"></div>
  <div class="barno">${refNo}</div>

  <div class="foot">
    Keep this receipt as proof of contribution.<br/>
    makiwa.co.ke &middot; support@makiwa.co.ke
    <div class="thanks">Thank you for honouring a life.</div>
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
    setTimeout(() => w.print(), 300);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <div className="bg-[#e9e9e9] max-h-[80vh] overflow-y-auto">
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
