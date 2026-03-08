import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Download, Printer } from "lucide-react";
import { format } from "date-fns";

interface InvoiceData {
  schoolName: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string | null;
  status: string;
  transactionId: string | null;
  planName?: string;
  notes: string | null;
}

interface InvoiceGeneratorProps {
  open: boolean;
  onClose: () => void;
  invoice: InvoiceData | null;
}

export function InvoiceGenerator({ open, onClose, invoice }: InvoiceGeneratorProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!invoice) return null;

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>Invoice - ${invoice.schoolName}</title>
          <style>
            body { font-family: 'Inter', -apple-system, sans-serif; margin: 0; padding: 40px; color: #1e293b; }
            .invoice { max-width: 700px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
            .title { font-size: 28px; font-weight: 700; color: #2563eb; }
            .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
            .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
            .paid { background: #dcfce7; color: #166534; }
            .pending { background: #fef3c7; color: #92400e; }
            .failed { background: #fee2e2; color: #991b1b; }
            .section { margin-bottom: 24px; }
            .section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 8px; }
            .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
            .row:last-child { border-bottom: none; }
            .label { color: #64748b; font-size: 14px; }
            .value { font-weight: 600; font-size: 14px; }
            .total-row { display: flex; justify-content: space-between; padding: 16px 0; border-top: 2px solid #e2e8f0; margin-top: 16px; }
            .total-label { font-size: 16px; font-weight: 600; }
            .total-value { font-size: 24px; font-weight: 700; color: #2563eb; }
            .footer { margin-top: 40px; text-align: center; color: #94a3b8; font-size: 12px; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  const statusClass = invoice.status === "paid" ? "paid" : invoice.status === "pending" ? "pending" : "failed";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Subscription Invoice</DialogTitle>
        </DialogHeader>

        <div ref={printRef}>
          <div className="invoice">
            <div className="header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
              <div>
                <div style={{ fontSize: "24px", fontWeight: 700, color: "hsl(var(--primary))" }}>INVOICE</div>
                <div className="text-xs text-muted-foreground mt-1">School Management Platform</div>
              </div>
              <Badge variant="outline" className={invoice.status === "paid" ? "bg-success/10 text-success" : invoice.status === "pending" ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"}>
                {invoice.status.toUpperCase()}
              </Badge>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Bill To</p>
                <p className="font-semibold text-lg">{invoice.schoolName}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">{format(new Date(invoice.paymentDate), "dd MMM yyyy")}</span>
                </div>
                <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">Method</span>
                  <span className="font-medium">{invoice.paymentMethod || "—"}</span>
                </div>
                {invoice.transactionId && (
                  <div className="flex justify-between p-3 rounded-lg bg-muted/50 col-span-2">
                    <span className="text-muted-foreground">Transaction ID</span>
                    <span className="font-mono text-xs">{invoice.transactionId}</span>
                  </div>
                )}
                {invoice.planName && (
                  <div className="flex justify-between p-3 rounded-lg bg-muted/50 col-span-2">
                    <span className="text-muted-foreground">Plan</span>
                    <span className="font-medium">{invoice.planName}</span>
                  </div>
                )}
                {invoice.notes && (
                  <div className="flex justify-between p-3 rounded-lg bg-muted/50 col-span-2">
                    <span className="text-muted-foreground">Notes</span>
                    <span>{invoice.notes}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center p-4 rounded-xl border-2 border-primary/20 bg-primary/5 mt-4">
                <span className="font-semibold text-lg">Total Amount</span>
                <span className="text-2xl font-bold text-primary">₹{Number(invoice.amount).toLocaleString()}</span>
              </div>
            </div>

            <p className="text-center text-xs text-muted-foreground mt-6">
              This is a computer-generated invoice. No signature required.
            </p>
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-4">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
          <Button onClick={handlePrint}>
            <Download className="mr-2 h-4 w-4" /> Download PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
