import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { Download, Printer } from "lucide-react";

interface FeeReceiptProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  payment: any;
  schoolId: string | null;
}

export function FeeReceipt({ open, onOpenChange, payment, schoolId }: FeeReceiptProps) {
  const [school, setSchool] = useState<any>(null);
  const [student, setStudent] = useState<any>(null);
  const [totalFee, setTotalFee] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  const [previousPaid, setPreviousPaid] = useState(0);
  const [showFullBreakdown, setShowFullBreakdown] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!schoolId || !open || !payment) return;

    const fetchData = async () => {
      // Fetch school info
      const { data: schoolData } = await supabase
        .from("schools")
        .select("name, logo_url, address, city, state, pincode, phone, email, principal_name")
        .eq("id", schoolId)
        .single();
      setSchool(schoolData);

      // Fetch student with class info
      const { data: studentData } = await supabase
        .from("students")
        .select("*, classes(name), sections(name), academic_years(name)")
        .eq("id", payment.student_id)
        .maybeSingle();
      setStudent(studentData);

      // Calculate total fee for this student's class in this academic year
      if (studentData?.class_id) {
        const { data: structures } = await supabase
          .from("fee_structures")
          .select("amount")
          .eq("school_id", schoolId)
          .eq("academic_year_id", payment.academic_year_id)
          .eq("class_id", studentData.class_id);
        const total = (structures || []).reduce((sum: number, s: any) => sum + Number(s.amount), 0);
        setTotalFee(total);
      }

      // Calculate total paid by this student in this academic year
      const { data: allPayments } = await supabase
        .from("fee_payments")
        .select("amount, payment_date")
        .eq("student_id", payment.student_id)
        .eq("academic_year_id", payment.academic_year_id)
        .eq("school_id", schoolId)
        .order("payment_date");

      const allPaid = (allPayments || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);
      setTotalPaid(allPaid);

      // Previous paid = total paid before this payment
      const prevPaid = (allPayments || [])
        .filter((p: any) => new Date(p.payment_date) < new Date(payment.payment_date) || 
          (new Date(p.payment_date).getTime() === new Date(payment.payment_date).getTime() && p.amount !== payment.amount))
        .reduce((sum: number, p: any) => sum + Number(p.amount), 0);
      setPreviousPaid(allPaid - Number(payment.amount));
    };

    fetchData();
  }, [schoolId, open, payment]);

  if (!payment) return null;

  const amountPaid = Number(payment.amount);
  const previousDue = totalFee - previousPaid;
  const remainingDue = totalFee - totalPaid;
  const paymentDate = new Date(payment.payment_date);
  const schoolAddress = school ? [school.address, school.city, school.state, school.pincode].filter(Boolean).join(", ") : "";

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Fee Receipt - ${payment.receipt_number}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          @page { size: A5; margin: 0; }
          body {
            font-family: 'Georgia', 'Times New Roman', serif;
            background: #0a0a0a;
            color: #e8e0d4;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
          }
          .receipt-wrapper {
            width: 420px;
            background: linear-gradient(145deg, #1a1208, #0d0905, #1a1208);
            border: 2px solid #8B6914;
            border-radius: 12px;
            padding: 24px;
            position: relative;
            overflow: hidden;
          }
          .receipt-wrapper::before {
            content: '';
            position: absolute;
            top: 4px; left: 4px; right: 4px; bottom: 4px;
            border: 1px solid rgba(139, 105, 20, 0.3);
            border-radius: 10px;
            pointer-events: none;
          }
          .glow-line {
            width: 100%;
            height: 2px;
            background: linear-gradient(90deg, transparent, #d4a017, #ff8c00, #d4a017, transparent);
            margin: 12px 0;
            opacity: 0.8;
          }
          .logo-section { text-align: center; margin-bottom: 8px; }
          .logo-section img { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid #8B6914; margin-bottom: 8px; }
          .school-name { font-size: 20px; font-weight: bold; color: #d4a017; letter-spacing: 1px; text-transform: uppercase; }
          .school-address { font-size: 11px; color: #b0a48a; margin-top: 2px; }
          .receipt-title {
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            color: #e8e0d4;
            letter-spacing: 3px;
            margin: 10px 0;
            position: relative;
          }
          .receipt-title::before, .receipt-title::after {
            content: '—';
            color: #8B6914;
            margin: 0 8px;
          }
          .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            border: 1px solid #3a3020;
            border-radius: 8px;
            padding: 12px;
            gap: 6px;
            margin: 10px 0;
            background: rgba(26, 18, 8, 0.5);
          }
          .detail-row { font-size: 11px; color: #b0a48a; }
          .detail-row strong { color: #e8e0d4; font-weight: 600; }
          .fee-table {
            width: 100%;
            border: 1px solid #3a3020;
            border-radius: 8px;
            overflow: hidden;
            margin: 10px 0;
          }
          .fee-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 14px;
            font-size: 12px;
            border-bottom: 1px solid #2a2015;
          }
          .fee-row:last-child { border-bottom: none; }
          .fee-row .label { color: #b0a48a; }
          .fee-row .value { color: #e8e0d4; font-weight: 600; }
          .fee-row.highlight { background: rgba(139, 105, 20, 0.15); }
          .fee-row.highlight .value { color: #4ade80; font-size: 14px; }
          .fee-row.due .value { color: #f87171; }
          .footer {
            text-align: center;
            margin-top: 16px;
            padding-top: 12px;
            border-top: 1px solid #2a2015;
          }
          .footer .sig { font-size: 10px; color: #8a7e6a; font-style: italic; margin-bottom: 4px; }
          .footer .thanks { font-size: 11px; color: #b0a48a; }
          .footer .motto { font-size: 9px; color: #6a5e4a; letter-spacing: 3px; text-transform: uppercase; margin-top: 8px; }
          @media print {
            body { background: #0a0a0a; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>${printContent.innerHTML}</body>
      </html>`;
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 bg-transparent border-none overflow-auto max-h-[95vh]">
        {/* The receipt */}
        <div ref={printRef}>
          <div style={{
            width: "100%",
            maxWidth: 440,
            margin: "0 auto",
            background: "linear-gradient(145deg, #1a1208, #0d0905, #1a1208)",
            border: "2px solid #8B6914",
            borderRadius: 12,
            padding: 24,
            position: "relative",
            overflow: "hidden",
            fontFamily: "'Georgia', 'Times New Roman', serif",
            color: "#e8e0d4",
          }}>
            {/* Inner border */}
            <div style={{
              position: "absolute",
              top: 4, left: 4, right: 4, bottom: 4,
              border: "1px solid rgba(139, 105, 20, 0.3)",
              borderRadius: 10,
              pointerEvents: "none",
            }} />

            {/* Logo & School Name */}
            <div style={{ textAlign: "center", marginBottom: 8, position: "relative" }}>
              {school?.logo_url ? (
                <img
                  src={school.logo_url}
                  alt="School Logo"
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "3px solid #8B6914",
                    marginBottom: 8,
                  }}
                />
              ) : (
                <div style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #8B6914, #d4a017)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 8px",
                  fontSize: 28,
                  fontWeight: "bold",
                  color: "#1a1208",
                }}>
                  {school?.name?.charAt(0) || "S"}
                </div>
              )}
              <div style={{ fontSize: 20, fontWeight: "bold", color: "#d4a017", letterSpacing: 1, textTransform: "uppercase" }}>
                {school?.name || "School"}
              </div>
              {schoolAddress && (
                <div style={{ fontSize: 11, color: "#b0a48a", marginTop: 2 }}>{schoolAddress}</div>
              )}
              {school?.phone && (
                <div style={{ fontSize: 10, color: "#8a7e6a", marginTop: 2 }}>Ph: {school.phone}</div>
              )}
            </div>

            {/* Glow line */}
            <div style={{
              width: "100%",
              height: 2,
              background: "linear-gradient(90deg, transparent, #d4a017, #ff8c00, #d4a017, transparent)",
              margin: "12px 0",
              opacity: 0.8,
            }} />

            {/* Receipt Title */}
            <div style={{
              textAlign: "center",
              fontSize: 16,
              fontWeight: "bold",
              color: "#e8e0d4",
              letterSpacing: 3,
              margin: "10px 0",
            }}>
              <span style={{ color: "#8B6914", margin: "0 8px" }}>—</span>
              FEE PAYMENT RECEIPT
              <span style={{ color: "#8B6914", margin: "0 8px" }}>—</span>
            </div>

            {/* Student & Payment Details Grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              border: "1px solid #3a3020",
              borderRadius: 8,
              padding: 12,
              gap: 6,
              margin: "10px 0",
              background: "rgba(26, 18, 8, 0.5)",
            }}>
              <div style={{ fontSize: 11, color: "#b0a48a" }}>
                Receipt #: <strong style={{ color: "#4ade80", fontWeight: 600 }}>{payment.receipt_number}</strong>
              </div>
              <div style={{ fontSize: 11, color: "#b0a48a" }}>
                Date: <strong style={{ color: "#e8e0d4", fontWeight: 600 }}>{format(paymentDate, "dd MMMM yyyy")}</strong>
              </div>
              <div style={{ fontSize: 11, color: "#b0a48a" }}>
                Student: <strong style={{ color: "#e8e0d4", fontWeight: 600 }}>{student?.name || payment.students?.name}</strong>
              </div>
              <div style={{ fontSize: 11, color: "#b0a48a" }}>
                Time: <strong style={{ color: "#e8e0d4", fontWeight: 600 }}>{format(paymentDate, "hh:mm a")}</strong>
              </div>
              <div style={{ fontSize: 11, color: "#b0a48a" }}>
                Father: <strong style={{ color: "#e8e0d4", fontWeight: 600 }}>{student?.father_name || "—"}</strong>
              </div>
              <div style={{ fontSize: 11, color: "#b0a48a" }}>
                Payment Mode: <strong style={{ color: "#e8e0d4", fontWeight: 600, textTransform: "uppercase" as const }}>{payment.payment_mode}</strong>
              </div>
              <div style={{ fontSize: 11, color: "#b0a48a" }}>
                Class: <strong style={{ color: "#e8e0d4", fontWeight: 600 }}>{student?.classes?.name || "—"}</strong>
              </div>
              <div style={{ fontSize: 11, color: "#b0a48a" }}>
                Adm No: <strong style={{ color: "#e8e0d4", fontWeight: 600 }}>{student?.admission_number || payment.students?.admission_number}</strong>
              </div>
              <div style={{ fontSize: 11, color: "#b0a48a" }}>
                Academic Year: <strong style={{ color: "#e8e0d4", fontWeight: 600 }}>{student?.academic_years?.name || payment.academic_years?.name || "—"}</strong>
              </div>
              <div style={{ fontSize: 11, color: "#b0a48a" }}>
                Fee Type: <strong style={{ color: "#e8e0d4", fontWeight: 600 }}>{payment.fee_types?.name || "—"}</strong>
              </div>
            </div>

            {/* Fee Breakdown Table */}
            <div style={{
              border: "1px solid #3a3020",
              borderRadius: 8,
              overflow: "hidden",
              margin: "10px 0",
            }}>
              {showFullBreakdown && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 14px", fontSize: 12, borderBottom: "1px solid #2a2015" }}>
                    <span style={{ color: "#b0a48a" }}>Total Fee</span>
                    <span style={{ color: "#e8e0d4", fontWeight: 600 }}>₹{totalFee.toLocaleString()}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 14px", fontSize: 12, borderBottom: "1px solid #2a2015" }}>
                    <span style={{ color: "#b0a48a" }}>Previous Due</span>
                    <span style={{ color: previousDue > 0 ? "#f87171" : "#e8e0d4", fontWeight: 600 }}>₹{Math.max(0, previousDue).toLocaleString()}</span>
                  </div>
                </>
              )}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "10px 14px",
                fontSize: 14,
                borderBottom: showFullBreakdown ? "1px solid #2a2015" : "none",
                background: "rgba(139, 105, 20, 0.15)",
              }}>
                <span style={{ color: "#e8e0d4", fontWeight: "bold" }}>Amount Paid</span>
                <span style={{ color: "#4ade80", fontWeight: "bold", fontSize: 16 }}>₹{amountPaid.toLocaleString()}</span>
              </div>
              {showFullBreakdown && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 14px", fontSize: 12 }}>
                  <span style={{ color: "#b0a48a" }}>Remaining Due</span>
                  <span style={{ color: remainingDue > 0 ? "#f87171" : "#4ade80", fontWeight: 600 }}>₹{Math.max(0, remainingDue).toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Notes */}
            {payment.notes && (
              <div style={{ fontSize: 10, color: "#8a7e6a", textAlign: "center", margin: "6px 0" }}>
                Note: {payment.notes}
              </div>
            )}

            {/* Footer */}
            <div style={{ textAlign: "center", marginTop: 16, paddingTop: 12, borderTop: "1px solid #2a2015" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 10, padding: "0 10px" }}>
                <div style={{ textAlign: "left" }}>
                  <div style={{ width: 80, borderBottom: "1px solid #5a5040", marginBottom: 2 }} />
                  <div style={{ fontSize: 9, color: "#8a7e6a" }}>Authorized Signature</div>
                </div>
                {school?.logo_url && (
                  <img src={school.logo_url} alt="" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", opacity: 0.4 }} />
                )}
              </div>
              <div style={{ fontSize: 11, color: "#b0a48a" }}>
                Thank you for your payment. Please keep this receipt for records.
              </div>
              {school?.email && (
                <div style={{ fontSize: 9, color: "#6a5e4a", marginTop: 4 }}>{school.email}</div>
              )}
            </div>
          </div>
        </div>

        {/* Receipt Options */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "12px 16px" }}>
          <div className="flex items-center gap-2">
            <Checkbox
              id="showFullBreakdown"
              checked={showFullBreakdown}
              onCheckedChange={(checked) => setShowFullBreakdown(checked === true)}
            />
            <Label htmlFor="showFullBreakdown" className="text-sm text-muted-foreground cursor-pointer">
              Show total fee, dues & remaining balance on receipt
            </Label>
          </div>
          <Button
            onClick={handlePrint}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold"
          >
            <Printer className="mr-2 h-4 w-4" />
            PRINT / DOWNLOAD PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
