import { useStudentData } from "@/hooks/useStudentData";
import { format } from "date-fns";

export default function StudentFees() {
  const { student, fees, feeDues, totalDue, loading } = useStudentData();

  if (loading) return <div className="pt-4 h-64 rounded-2xl bg-white/5 animate-pulse" />;
  if (!student) return <div className="text-center py-20 text-slate-400">No student record found</div>;

  return (
    <div className="space-y-4 pb-6 pt-2">
      {/* Total Due */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-rose-300 font-semibold">Total Due</p>
          <p className="text-3xl font-extrabold mt-1">₹{Number(totalDue).toLocaleString()}</p>
        </div>
        <button
          disabled={totalDue <= 0}
          className="px-5 py-2.5 rounded-xl bg-rose-500 text-white text-sm font-bold disabled:opacity-40 active:scale-95 transition"
        >
          Pay Now
        </button>
      </div>

      {/* Fee Breakdown */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5">
          <p className="font-bold text-sm">Fee Breakdown</p>
        </div>
        {feeDues.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-400">No fee structure</p>
        ) : (
          <div className="divide-y divide-white/5">
            {feeDues.map((d: any) => (
              <div key={d.id} className="px-4 py-3 flex items-center">
                <p className="text-sm flex-1 truncate">{d.fee_types?.name || "—"}</p>
                <p className="text-sm font-bold tabular-nums">₹ {Number(d.amount).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment History */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5">
          <p className="font-bold text-sm">Payment History</p>
        </div>
        {fees.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-400">No payments yet</p>
        ) : (
          <div className="divide-y divide-white/5">
            {fees.map((f: any) => (
              <div key={f.id} className="px-4 py-3 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{f.fee_types?.name || "Fee"}</p>
                  <p className="text-[11px] text-slate-400">Paid on {format(new Date(f.payment_date), "dd MMM yyyy")}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold tabular-nums">₹ {Number(f.amount).toLocaleString()}</p>
                  <p className="text-[11px] text-emerald-300 font-semibold">Paid</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
