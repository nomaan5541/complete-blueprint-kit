import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/hooks/useSchool";
import { useAcademicYear } from "@/hooks/useAcademicYear";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Loader2, Trash2, IndianRupee, Receipt } from "lucide-react";
import { format } from "date-fns";

export default function FeeManagement() {
  const { schoolId } = useSchool();
  const { academicYears, selectedYearId } = useAcademicYear();
  const [feeTypes, setFeeTypes] = useState<any[]>([]);
  const [structures, setStructures] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Dialogs
  const [feeTypeOpen, setFeeTypeOpen] = useState(false);
  const [structureOpen, setStructureOpen] = useState(false);
  const [collectOpen, setCollectOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);

  // Forms
  const [feeTypeName, setFeeTypeName] = useState("");
  const [feeTypeDesc, setFeeTypeDesc] = useState("");
  const [structForm, setStructForm] = useState({ academic_year_id: "", class_id: "", fee_type_id: "", amount: "" });
  const [collectForm, setCollectForm] = useState({ student_id: "", academic_year_id: "", fee_type_id: "", amount: "", payment_mode: "cash", notes: "" });

  const fetchAll = async () => {
    if (!schoolId || !selectedYearId) return;
    setLoading(true);
    const [ftRes, fsRes, fpRes, cRes, sRes] = await Promise.all([
      supabase.from("fee_types").select("*").eq("school_id", schoolId).order("name"),
      supabase.from("fee_structures").select("*, classes(name), fee_types(name), academic_years(name)").eq("school_id", schoolId).eq("academic_year_id", selectedYearId),
      supabase.from("fee_payments").select("*, students(name, admission_number), fee_types(name), academic_years(name)").eq("school_id", schoolId).eq("academic_year_id", selectedYearId).order("payment_date", { ascending: false }).limit(100),
      supabase.from("classes").select("*").eq("school_id", schoolId).order("display_order"),
      supabase.from("students").select("id, name, admission_number, class_id").eq("school_id", schoolId).eq("academic_year_id", selectedYearId).eq("status", "active").order("name"),
    ]);
    setFeeTypes(ftRes.data || []);
    setStructures(fsRes.data || []);
    setPayments(fpRes.data || []);
    setClasses(cRes.data || []);
    setStudents(sRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [schoolId, selectedYearId]);

  const handleAddFeeType = async () => {
    if (!feeTypeName.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    const { error } = await supabase.from("fee_types").insert({ school_id: schoolId!, name: feeTypeName.trim(), description: feeTypeDesc || null });
    if (error) toast.error(error.message);
    else { toast.success("Fee type added"); setFeeTypeOpen(false); setFeeTypeName(""); setFeeTypeDesc(""); fetchAll(); }
    setSaving(false);
  };

  const handleAddStructure = async () => {
    if (!structForm.academic_year_id || !structForm.class_id || !structForm.fee_type_id || !structForm.amount) {
      toast.error("All fields are required"); return;
    }
    setSaving(true);
    const { error } = await supabase.from("fee_structures").insert({
      school_id: schoolId!,
      academic_year_id: structForm.academic_year_id,
      class_id: structForm.class_id,
      fee_type_id: structForm.fee_type_id,
      amount: parseFloat(structForm.amount),
    });
    if (error) toast.error(error.message);
    else { toast.success("Fee structure added"); setStructureOpen(false); setStructForm({ academic_year_id: "", class_id: "", fee_type_id: "", amount: "" }); fetchAll(); }
    setSaving(false);
  };

  const handleCollect = async () => {
    if (!collectForm.student_id || !collectForm.academic_year_id || !collectForm.fee_type_id || !collectForm.amount) {
      toast.error("All fields are required"); return;
    }
    setSaving(true);
    const receiptNum = `RCP-${Date.now().toString().slice(-8)}`;
    const { data, error } = await supabase.from("fee_payments").insert({
      school_id: schoolId!,
      student_id: collectForm.student_id,
      academic_year_id: collectForm.academic_year_id,
      fee_type_id: collectForm.fee_type_id,
      amount: parseFloat(collectForm.amount),
      payment_mode: collectForm.payment_mode,
      receipt_number: receiptNum,
      notes: collectForm.notes || null,
    }).select("*, students(name, admission_number), fee_types(name), academic_years(name)").single();
    if (error) toast.error(error.message);
    else {
      toast.success("Payment collected");
      setCollectOpen(false);
      setCollectForm({ student_id: "", academic_year_id: "", fee_type_id: "", amount: "", payment_mode: "cash", notes: "" });
      setSelectedPayment(data);
      setReceiptOpen(true);
      fetchAll();
    }
    setSaving(false);
  };

  const deleteFeeType = async (id: string) => {
    const { error } = await supabase.from("fee_types").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); fetchAll(); }
  };

  const deleteStructure = async (id: string) => {
    const { error } = await supabase.from("fee_structures").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); fetchAll(); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Fee Management</h1>
        <p className="text-muted-foreground">Manage fee types, structures, and collections</p>
      </div>

      <Tabs defaultValue="collect">
        <TabsList>
          <TabsTrigger value="collect">Collect Fees</TabsTrigger>
          <TabsTrigger value="history">Payment History</TabsTrigger>
          <TabsTrigger value="structure">Fee Structure</TabsTrigger>
          <TabsTrigger value="types">Fee Types</TabsTrigger>
        </TabsList>

        {/* Collect Tab */}
        <TabsContent value="collect" className="space-y-4">
          <Button onClick={() => setCollectOpen(true)}><IndianRupee className="mr-2 h-4 w-4" /> Collect Fee</Button>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Fee Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : payments.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">No payments yet</TableCell></TableRow>
                ) : (
                  payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs">{p.receipt_number || "—"}</TableCell>
                      <TableCell className="font-medium">{p.students?.name} <span className="text-muted-foreground text-xs">({p.students?.admission_number})</span></TableCell>
                      <TableCell>{p.fee_types?.name || "—"}</TableCell>
                      <TableCell>₹{Number(p.amount).toLocaleString()}</TableCell>
                      <TableCell><Badge variant="secondary">{p.payment_mode}</Badge></TableCell>
                      <TableCell>{format(new Date(p.payment_date), "dd MMM yyyy")}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => { setSelectedPayment(p); setReceiptOpen(true); }}>
                          <Receipt className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Structure Tab */}
        <TabsContent value="structure" className="space-y-4">
          <Button onClick={() => setStructureOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Fee Structure</Button>
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Academic Year</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Fee Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {structures.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">No fee structures</TableCell></TableRow>
                ) : (
                  structures.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>{s.academic_years?.name || "—"}</TableCell>
                      <TableCell>{s.classes?.name || "—"}</TableCell>
                      <TableCell>{s.fee_types?.name || "—"}</TableCell>
                      <TableCell className="font-medium">₹{Number(s.amount).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => deleteStructure(s.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Fee Types Tab */}
        <TabsContent value="types" className="space-y-4">
          <Button onClick={() => setFeeTypeOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Fee Type</Button>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {feeTypes.map((ft) => (
              <Card key={ft.id}>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-base">{ft.name}</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => deleteFeeType(ft.id)} className="text-destructive hover:text-destructive h-8 w-8"><Trash2 className="h-3.5 w-3.5" /></Button>
                </CardHeader>
                {ft.description && <CardContent className="pt-0"><p className="text-sm text-muted-foreground">{ft.description}</p></CardContent>}
              </Card>
            ))}
            {feeTypes.length === 0 && <p className="text-muted-foreground col-span-full text-center py-8">No fee types defined</p>}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Fee Type Dialog */}
      <Dialog open={feeTypeOpen} onOpenChange={setFeeTypeOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Fee Type</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Name</Label><Input value={feeTypeName} onChange={(e) => setFeeTypeName(e.target.value)} placeholder="e.g. Tuition Fee" /></div>
            <div className="space-y-1"><Label>Description</Label><Input value={feeTypeDesc} onChange={(e) => setFeeTypeDesc(e.target.value)} placeholder="Optional" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFeeTypeOpen(false)}>Cancel</Button>
            <Button onClick={handleAddFeeType} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Structure Dialog */}
      <Dialog open={structureOpen} onOpenChange={setStructureOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Fee Structure</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Academic Year</Label>
              <Select value={structForm.academic_year_id} onValueChange={(v) => setStructForm(p => ({ ...p, academic_year_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{academicYears.map((y) => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Class</Label>
              <Select value={structForm.class_id} onValueChange={(v) => setStructForm(p => ({ ...p, class_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Fee Type</Label>
              <Select value={structForm.fee_type_id} onValueChange={(v) => setStructForm(p => ({ ...p, fee_type_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{feeTypes.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Amount (₹)</Label><Input type="number" value={structForm.amount} onChange={(e) => setStructForm(p => ({ ...p, amount: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStructureOpen(false)}>Cancel</Button>
            <Button onClick={handleAddStructure} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Collect Fee Dialog */}
      <Dialog open={collectOpen} onOpenChange={setCollectOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Collect Fee Payment</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Student</Label>
              <Select value={collectForm.student_id} onValueChange={(v) => setCollectForm(p => ({ ...p, student_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>{students.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} ({s.admission_number})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Academic Year</Label>
              <Select value={collectForm.academic_year_id} onValueChange={(v) => setCollectForm(p => ({ ...p, academic_year_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{academicYears.map((y) => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Fee Type</Label>
              <Select value={collectForm.fee_type_id} onValueChange={(v) => setCollectForm(p => ({ ...p, fee_type_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{feeTypes.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Amount (₹)</Label><Input type="number" value={collectForm.amount} onChange={(e) => setCollectForm(p => ({ ...p, amount: e.target.value }))} /></div>
            <div className="space-y-1">
              <Label>Payment Mode</Label>
              <Select value={collectForm.payment_mode} onValueChange={(v) => setCollectForm(p => ({ ...p, payment_mode: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="bank">Bank</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Notes</Label><Input value={collectForm.notes} onChange={(e) => setCollectForm(p => ({ ...p, notes: e.target.value }))} placeholder="Optional" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCollectOpen(false)}>Cancel</Button>
            <Button onClick={handleCollect} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Collect</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <ReceiptDialog open={receiptOpen} onOpenChange={setReceiptOpen} payment={selectedPayment} schoolId={schoolId} />
    </div>
  );
}

function ReceiptDialog({ open, onOpenChange, payment, schoolId }: { open: boolean; onOpenChange: (v: boolean) => void; payment: any; schoolId: string | null }) {
  const [school, setSchool] = useState<any>(null);

  useEffect(() => {
    if (!schoolId || !open) return;
    supabase.from("schools").select("name, logo_url, address, city, state, pincode, phone, email").eq("id", schoolId).single().then(({ data }) => setSchool(data));
  }, [schoolId, open]);

  if (!payment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Payment Receipt</DialogTitle></DialogHeader>
        <div className="space-y-4 border rounded-lg p-4 print-area">
          {/* School Header */}
          <div className="text-center border-b pb-3">
            {school?.logo_url && <img src={school.logo_url} alt="" className="h-12 w-12 mx-auto mb-2 rounded-lg object-cover" />}
            <h3 className="font-bold text-lg">{school?.name || "School"}</h3>
            {school && (
              <p className="text-xs text-muted-foreground">
                {[school.address, school.city, school.state, school.pincode].filter(Boolean).join(", ")}
                {school.phone && <span> · {school.phone}</span>}
              </p>
            )}
            <p className="text-sm font-medium mt-2">FEE RECEIPT</p>
            <p className="text-xs text-muted-foreground">Receipt No: {payment.receipt_number}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-muted-foreground">Student: </span><span className="font-medium">{payment.students?.name}</span></div>
            <div><span className="text-muted-foreground">Adm No: </span><span className="font-medium">{payment.students?.admission_number}</span></div>
            <div><span className="text-muted-foreground">Fee Type: </span><span className="font-medium">{payment.fee_types?.name}</span></div>
            <div><span className="text-muted-foreground">Year: </span><span className="font-medium">{payment.academic_years?.name}</span></div>
            <div><span className="text-muted-foreground">Amount: </span><span className="font-bold text-primary">₹{Number(payment.amount).toLocaleString()}</span></div>
            <div><span className="text-muted-foreground">Mode: </span><span className="font-medium capitalize">{payment.payment_mode}</span></div>
            <div className="col-span-2"><span className="text-muted-foreground">Date: </span><span className="font-medium">{format(new Date(payment.payment_date), "dd MMM yyyy, hh:mm a")}</span></div>
          </div>
          {payment.notes && <div className="text-sm"><span className="text-muted-foreground">Notes: </span>{payment.notes}</div>}
          <div className="text-center border-t pt-2 text-xs text-muted-foreground">
            This is a computer-generated receipt.
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={() => window.print()}>Print Receipt</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
