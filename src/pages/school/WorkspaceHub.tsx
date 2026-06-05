import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  FolderOpen, FileText, Sheet, Calendar, Mail, Plus, ExternalLink,
  Loader2, RefreshCw, Folder, Send,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type DriveFile = { id: string; name: string; mimeType: string; webViewLink?: string; modifiedTime?: string };

export default function WorkspaceHub() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Google Workspace Hub</h1>
        <p className="text-muted-foreground">
          Centralized Drive, Docs, Sheets, Calendar & Email automation for your school.
        </p>
      </div>

      <Tabs defaultValue="drive">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full">
          <TabsTrigger value="drive"><FolderOpen className="h-4 w-4 mr-2" />Drive</TabsTrigger>
          <TabsTrigger value="docs"><FileText className="h-4 w-4 mr-2" />Docs</TabsTrigger>
          <TabsTrigger value="sheets"><Sheet className="h-4 w-4 mr-2" />Sheets</TabsTrigger>
          <TabsTrigger value="calendar"><Calendar className="h-4 w-4 mr-2" />Calendar</TabsTrigger>
          <TabsTrigger value="email"><Mail className="h-4 w-4 mr-2" />Emails</TabsTrigger>
        </TabsList>

        <TabsContent value="drive" className="mt-6"><DrivePanel /></TabsContent>
        <TabsContent value="docs" className="mt-6"><DocsPanel /></TabsContent>
        <TabsContent value="sheets" className="mt-6"><SheetsPanel /></TabsContent>
        <TabsContent value="calendar" className="mt-6"><CalendarPanel /></TabsContent>
        <TabsContent value="email" className="mt-6"><EmailPanel /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ---------------- DRIVE ---------------- */
function DrivePanel() {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [query, setQuery] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("google-drive-ops", {
      body: { action: "list", query: query || undefined },
    });
    setLoading(false);
    if (error || data?.error) { toast.error(data?.error || error?.message || "Failed"); return; }
    setFiles(data.files || []);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const createFolder = async () => {
    if (!folderName.trim()) return;
    const { data, error } = await supabase.functions.invoke("google-drive-ops", {
      body: { action: "createFolder", fileName: folderName.trim() },
    });
    if (error || data?.error) { toast.error(data?.error || error?.message); return; }
    toast.success(`Folder created: ${data.name}`);
    setFolderName("");
    load();
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
          <CardDescription>Organize school data in Drive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>New folder</Label>
            <div className="flex gap-2">
              <Input placeholder="e.g. Grade 5 Records" value={folderName} onChange={(e) => setFolderName(e.target.value)} />
              <Button size="icon" onClick={createFolder}><Plus className="h-4 w-4" /></Button>
            </div>
          </div>
          <div className="space-y-1">
            <Label>Search files</Label>
            <div className="flex gap-2">
              <Input placeholder="report card..." value={query} onChange={(e) => setQuery(e.target.value)} />
              <Button size="icon" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
            </div>
          </div>
          <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
            <p className="font-semibold text-foreground">Suggested structure</p>
            <p>📁 Student Records / Grade N</p>
            <p>📁 Teacher Resources</p>
            <p>📁 Report Cards</p>
            <p>📁 Certificates</p>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Files in Drive ({files.length})</CardTitle>
            <CardDescription>Shared platform Workspace account</CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">Loading…</div>
          ) : files.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No files yet. Create a folder to get started.</div>
          ) : (
            <div className="divide-y">
              {files.map((f) => (
                <div key={f.id} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    {f.mimeType?.includes("folder") ? <Folder className="h-4 w-4 text-primary" /> : <FileText className="h-4 w-4 text-muted-foreground" />}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{f.name}</p>
                      {f.modifiedTime && <p className="text-[11px] text-muted-foreground">{format(new Date(f.modifiedTime), "dd MMM yyyy HH:mm")}</p>}
                    </div>
                  </div>
                  {f.webViewLink && (
                    <Button variant="ghost" size="icon" asChild>
                      <a href={f.webViewLink} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------------- DOCS ---------------- */
function DocsPanel() {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [creating, setCreating] = useState(false);
  const [lastDoc, setLastDoc] = useState<{ documentId: string; title: string } | null>(null);

  const create = async () => {
    if (!title.trim()) return;
    setCreating(true);
    const { data, error } = await supabase.functions.invoke("google-docs-ops", {
      body: { action: "create", title: title.trim(), text },
    });
    setCreating(false);
    if (error || data?.error) { toast.error(data?.error || error?.message); return; }
    setLastDoc({ documentId: data.documentId, title: data.title });
    toast.success("Document created in Drive");
    setTitle(""); setText("");
  };

  const templates = [
    { name: "Principal Notice", text: "Date: ____\n\nDear Parents,\n\n" },
    { name: "Lesson Plan", text: "Subject:\nClass:\nLearning Objectives:\n\n1. \n2. \n3. " },
    { name: "Meeting Minutes", text: "Date:\nAttendees:\nAgenda:\n\nDiscussion:\n\nAction Items:" },
    { name: "Circular", text: "Circular No: ____\nDate: ____\n\nSubject: \n\n" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Create Google Doc</CardTitle>
          <CardDescription>Notices, circulars, lesson plans</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Annual Sports Day Notice" />
          </div>
          <div className="space-y-1">
            <Label>Initial content (optional)</Label>
            <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} placeholder="Type or paste starter text…" />
          </div>
          <Button onClick={create} disabled={creating || !title.trim()} className="w-full">
            {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            Create document
          </Button>
          {lastDoc && (
            <div className="rounded-md border bg-muted/40 p-3 text-sm flex items-center justify-between">
              <span className="truncate">✅ {lastDoc.title}</span>
              <Button size="sm" variant="ghost" asChild>
                <a target="_blank" rel="noopener noreferrer" href={`https://docs.google.com/document/d/${lastDoc.documentId}/edit`}>
                  Open <ExternalLink className="h-3.5 w-3.5 ml-1" />
                </a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Templates</CardTitle>
          <CardDescription>Click to pre-fill</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {templates.map((t) => (
            <Button key={t.name} variant="outline" className="w-full justify-start" onClick={() => { setTitle(t.name); setText(t.text); }}>
              <FileText className="h-4 w-4 mr-2" /> {t.name}
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------------- SHEETS ---------------- */
function SheetsPanel() {
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [lastSheet, setLastSheet] = useState<{ spreadsheetId: string; title: string } | null>(null);

  const create = async (preset?: { title: string; headers: string[] }) => {
    const finalTitle = preset?.title || title.trim();
    if (!finalTitle) return;
    setCreating(true);
    const { data, error } = await supabase.functions.invoke("google-sheets-ops", {
      body: { action: "create", title: finalTitle },
    });
    if (error || data?.error) { setCreating(false); toast.error(data?.error || error?.message); return; }
    const id = data.spreadsheetId;
    if (preset) {
      await supabase.functions.invoke("google-sheets-ops", {
        body: { action: "append", spreadsheetId: id, range: "Sheet1!A1", values: [preset.headers] },
      });
    }
    setCreating(false);
    setLastSheet({ spreadsheetId: id, title: data.properties?.title || finalTitle });
    toast.success("Spreadsheet created");
    setTitle("");
  };

  const presets = [
    { label: "Attendance Tracker", headers: ["Date", "Class", "Student", "Status", "Marked By"] },
    { label: "Marks Sheet", headers: ["Student", "Subject", "Marks", "Max", "Grade"] },
    { label: "Fee Collection", headers: ["Date", "Receipt No", "Student", "Amount", "Mode"] },
    { label: "Staff Salary", headers: ["Month", "Employee", "Basic", "Allowances", "Deductions", "Net"] },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader><CardTitle className="text-base">Create Spreadsheet</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Term 2 Marks" />
          </div>
          <Button onClick={() => create()} disabled={creating || !title.trim()} className="w-full">
            {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            Create blank sheet
          </Button>
          {lastSheet && (
            <div className="rounded-md border bg-muted/40 p-3 text-sm flex items-center justify-between">
              <span className="truncate">✅ {lastSheet.title}</span>
              <Button size="sm" variant="ghost" asChild>
                <a target="_blank" rel="noopener noreferrer" href={`https://docs.google.com/spreadsheets/d/${lastSheet.spreadsheetId}/edit`}>
                  Open <ExternalLink className="h-3.5 w-3.5 ml-1" />
                </a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Templates with headers</CardTitle>
          <CardDescription>Pre-built for school operations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {presets.map((p) => (
            <Button key={p.label} variant="outline" className="w-full justify-start"
              disabled={creating}
              onClick={() => create({ title: p.label, headers: p.headers })}>
              <Sheet className="h-4 w-4 mr-2" /> {p.label}
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------------- CALENDAR ---------------- */
function CalendarPanel() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [attendees, setAttendees] = useState("");
  const [withMeet, setWithMeet] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("google-calendar-ops", { body: { action: "listEvents" } });
    setLoading(false);
    if (error || data?.error) { toast.error(data?.error || error?.message); return; }
    setEvents(data.items || []);
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!summary || !start || !end) { toast.error("Title, start, end required"); return; }
    const event: any = {
      summary,
      start: { dateTime: new Date(start).toISOString() },
      end: { dateTime: new Date(end).toISOString() },
      withMeet,
    };
    if (attendees.trim()) event.attendees = attendees.split(",").map((e) => ({ email: e.trim() })).filter((a) => a.email);
    const { data, error } = await supabase.functions.invoke("google-calendar-ops", { body: { action: "createEvent", event } });
    if (error || data?.error) { toast.error(data?.error || error?.message); return; }
    toast.success(`Event created${data.hangoutLink ? " with Meet link" : ""}`);
    setSummary(""); setStart(""); setEnd(""); setAttendees("");
    load();
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Schedule Event + Google Meet</CardTitle>
          <CardDescription>PTM, exams, online classes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1"><Label>Title</Label><Input value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="e.g. Parent-Teacher Meeting" /></div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1"><Label>Start</Label><Input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} /></div>
            <div className="space-y-1"><Label>End</Label><Input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
          </div>
          <div className="space-y-1"><Label>Attendees (comma-separated emails)</Label><Input value={attendees} onChange={(e) => setAttendees(e.target.value)} placeholder="parent@example.com, teacher@example.com" /></div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={withMeet} onChange={(e) => setWithMeet(e.target.checked)} />
            Add Google Meet link
          </label>
          <Button onClick={create} className="w-full"><Plus className="h-4 w-4 mr-2" />Create event</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div><CardTitle className="text-base">Upcoming Events ({events.length})</CardTitle></div>
          <Button size="sm" variant="outline" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No upcoming events</p>
          ) : (
            <div className="divide-y max-h-[400px] overflow-y-auto">
              {events.map((ev) => (
                <div key={ev.id} className="py-2.5">
                  <p className="text-sm font-medium">{ev.summary || "(no title)"}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {ev.start?.dateTime ? format(new Date(ev.start.dateTime), "dd MMM, HH:mm") : ev.start?.date}
                  </p>
                  {ev.hangoutLink && (
                    <a href={ev.hangoutLink} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                      🎥 Join Meet
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------------- EMAIL (Resend) ---------------- */
function EmailPanel() {
  const [to, setTo] = useState("");
  const [template, setTemplate] = useState("generic");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!to.trim()) { toast.error("Recipient required"); return; }
    setSending(true);
    const data: any = { subject, message };
    const { data: result, error } = await supabase.functions.invoke("send-school-email", {
      body: { to: to.trim(), template, data },
    });
    setSending(false);
    if (error || result?.error) { toast.error(result?.error || error?.message); return; }
    toast.success("Email sent via Resend");
    setTo(""); setSubject(""); setMessage("");
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Mail className="h-4 w-4" /> Send via Resend</CardTitle>
          <CardDescription>OTP, fee reminders, admission, attendance alerts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1"><Label>To</Label><Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="parent@example.com" /></div>
          <div className="space-y-1">
            <Label>Template</Label>
            <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={template} onChange={(e) => setTemplate(e.target.value)}>
              <option value="generic">Generic (custom subject + message)</option>
              <option value="otp">OTP code</option>
              <option value="feeReminder">Fee reminder</option>
              <option value="admission">Admission confirmation</option>
              <option value="attendance">Attendance alert</option>
            </select>
          </div>
          {template === "generic" && (
            <>
              <div className="space-y-1"><Label>Subject</Label><Input value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
              <div className="space-y-1"><Label>Message</Label><Textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} /></div>
            </>
          )}
          {template !== "generic" && (
            <p className="text-xs text-muted-foreground border rounded p-2 bg-muted/30">
              Pre-built template will be used. To pass data (e.g. studentName, amount), call the <code>send-school-email</code> function from other modules.
            </p>
          )}
          <Button onClick={send} disabled={sending} className="w-full">
            {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            Send email
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Wire into school flows</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Badge variant="outline">otp</Badge> Login / 2FA codes
          <div><Badge variant="outline">feeReminder</Badge> Hook to FeeDues</div>
          <div><Badge variant="outline">admission</Badge> Hook to new student create</div>
          <div><Badge variant="outline">attendance</Badge> Hook to absent marks</div>
          <p className="text-xs text-muted-foreground pt-3 border-t">
            For production, verify your domain in Resend and update <code>FROM</code> in <code>send-school-email</code>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
