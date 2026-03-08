import { useStudentData } from "@/hooks/useStudentData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, Download, IndianRupee } from "lucide-react";
import { format } from "date-fns";

export default function StudentFees() {
  const { student, fees, feeDues, totalDue, totalPaid, totalFeeAmount, loading } = useStudentData();

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!student) return <div className="text-center py-20 text-muted-foreground">No student record found</div>;

  const handleDownloadReceipt = (fee: any) => {
    const receiptContent = `
EDUPRIMEX - Fee Receipt
========================
Receipt No: ${fee.receipt_number || "N/A"}
Date: ${format(new Date(fee.payment_date), "dd MMM yyyy")}
Student: ${student.name}
Admission No: ${student.admission_number}
Fee Type: ${fee.fee_types?.name || "N/A"}
Amount: ₹${Number(fee.amount).toLocaleString()}
Mode: ${fee.payment_mode || "N/A"}
========================
    `.trim();

    const blob = new Blob([receiptContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receipt_${fee.receipt_number || fee.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Fee Status</h1>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="pt-4 text-center">
          <IndianRupee className="h-5 w-5 mx-auto mb-1 text-primary" />
          <p className="text-2xl font-bold">₹{totalFeeAmount.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Total Fee</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <IndianRupee className="h-5 w-5 mx-auto mb-1 text-emerald-500" />
          <p className="text-2xl font-bold text-emerald-500">₹{totalPaid.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Paid</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <IndianRupee className="h-5 w-5 mx-auto mb-1 text-destructive" />
          <p className="text-2xl font-bold text-destructive">₹{totalDue.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Pending</p>
        </CardContent></Card>
      </div>

      {/* Fee Dues */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Fee Dues
            {totalDue > 0 && <Badge variant="destructive" className="text-xs">₹{totalDue.toLocaleString()} pending</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {feeDues.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No fee structure assigned for your class</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fee Type</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Due</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feeDues.map((d: any) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.fee_types?.name || "—"}</TableCell>
                      <TableCell className="text-right">₹{Number(d.amount).toLocaleString()}</TableCell>
                      <TableCell className="text-right">₹{d.paid.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-medium">{d.due > 0 ? `₹${d.due.toLocaleString()}` : "—"}</TableCell>
                      <TableCell>
                        {d.due === 0 ? (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500">Paid</Badge>
                        ) : d.paid > 0 ? (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-500">Partial</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-destructive/10 text-destructive">Unpaid</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {totalDue > 0 && (
                <div className="mt-4 p-3 rounded-lg border border-destructive/20 bg-destructive/5 flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                  <span>Total pending dues: <strong>₹{totalDue.toLocaleString()}</strong>. Please contact your school office for payment.</span>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader><CardTitle>Payment History</CardTitle></CardHeader>
        <CardContent>
          {fees.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No payment records</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Fee Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fees.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-mono text-xs">{f.receipt_number || "—"}</TableCell>
                    <TableCell>{f.fee_types?.name || "—"}</TableCell>
                    <TableCell className="font-medium">₹{Number(f.amount).toLocaleString()}</TableCell>
                    <TableCell className="capitalize">{f.payment_mode || "—"}</TableCell>
                    <TableCell>{format(new Date(f.payment_date), "dd MMM yyyy")}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleDownloadReceipt(f)} title="Download Receipt">
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
