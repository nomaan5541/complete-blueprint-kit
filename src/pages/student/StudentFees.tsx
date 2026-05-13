import { useStudentData } from "@/hooks/useStudentData";
import { format } from "date-fns";
import { Wallet, CreditCard, ReceiptText } from "lucide-react";
import { StudentEmpty, StudentPanel } from "@/components/student/StudentUI";

export default function StudentFees() {
  const { student, fees, feeDues, totalDue, loading } = useStudentData();
  if (loading) return <div className="pt-4 h-64 rounded-3xl bg-[hsl(var(--student-surface)/0.65)] animate-pulse" />;
  if (!student) return <StudentEmpty title="No student record found" />;

  return (
    <div className="space-y-5 pb-6 pt-2 animate-fade-in">
      <StudentPanel className="p-5 sm:p-6 flex items-center gap-4">
        <div className="student-icon-frame student-tone-rose h-16 w-16"><Wallet className="h-8 w-8" /></div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[hsl(var(--student-primary))]">Total Due</p>
          <p className="text-3xl sm:text-5xl font-extrabold mt-1">₹ {Number(totalDue).toLocaleString()}</p>
        </div>
        <button disabled={totalDue <= 0} className="px-5 py-3 rounded-2xl bg-[hsl(var(--student-danger))] text-[hsl(var(--student-foreground))] text-sm font-extrabold disabled:opacity-40 active:scale-95 transition">Pay Now</button>
      </StudentPanel>

      <StudentPanel className="overflow-hidden">
        <div className="px-4 py-3 border-b border-[hsl(var(--student-border)/0.7)] flex items-center gap-2"><ReceiptText className="h-4 w-4 text-[hsl(var(--student-primary))]" /><p className="font-extrabold text-sm">Fee Breakdown</p></div>
        {feeDues.length === 0 ? <p className="p-6 text-center text-sm student-muted-text">No fee structure</p> : (
          <div className="divide-y divide-[hsl(var(--student-border)/0.55)]">{feeDues.map((d: any) => <div key={d.id} className="px-4 py-3 flex items-center gap-3"><p className="text-sm flex-1 truncate">{d.fee_types?.name || "—"}</p><p className="text-sm font-extrabold tabular-nums">₹ {Number(d.amount).toLocaleString()}</p></div>)}</div>
        )}
      </StudentPanel>

      <StudentPanel className="overflow-hidden">
        <div className="px-4 py-3 border-b border-[hsl(var(--student-border)/0.7)] flex items-center gap-2"><CreditCard className="h-4 w-4 text-[hsl(var(--student-green))]" /><p className="font-extrabold text-sm">Payment History</p></div>
        {fees.length === 0 ? <p className="p-6 text-center text-sm student-muted-text">No payments yet</p> : (
          <div className="divide-y divide-[hsl(var(--student-border)/0.55)]">{fees.map((f: any) => <div key={f.id} className="px-4 py-3 flex items-start gap-3"><div className="flex-1 min-w-0"><p className="text-sm font-bold truncate">{f.fee_types?.name || "Fee"}</p><p className="text-[11px] student-muted-text">Paid on {format(new Date(f.payment_date), "dd MMM yyyy")}</p></div><div className="text-right"><p className="text-sm font-extrabold tabular-nums">₹ {Number(f.amount).toLocaleString()}</p><p className="text-[11px] text-[hsl(var(--student-green))] font-bold">Paid</p></div></div>)}</div>
        )}
      </StudentPanel>
    </div>
  );
}
