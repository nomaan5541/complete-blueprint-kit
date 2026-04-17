import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, MailOpen, Trash2, Loader2, Inbox } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function ContactMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setMessages(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleRead = async (id: string, current: boolean) => {
    const { error } = await supabase.from("contact_messages").update({ is_read: !current }).eq("id", id);
    if (error) return toast.error(error.message);
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, is_read: !current } : m)));
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this message?")) return;
    const { error } = await supabase.from("contact_messages").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setMessages((prev) => prev.filter((m) => m.id !== id));
    toast.success("Message deleted");
  };

  const visible = filter === "unread" ? messages.filter((m) => !m.is_read) : messages;
  const unreadCount = messages.filter((m) => !m.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Inbox className="h-7 w-7" />
            Contact Messages
          </h1>
          <p className="text-muted-foreground mt-1">
            Messages submitted from the public Contact page.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
            All ({messages.length})
          </Button>
          <Button variant={filter === "unread" ? "default" : "outline"} size="sm" onClick={() => setFilter("unread")}>
            Unread ({unreadCount})
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : visible.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <Inbox className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>No messages {filter === "unread" ? "unread" : "yet"}.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {visible.map((m) => (
            <Card key={m.id} className={!m.is_read ? "border-primary/50 bg-primary/5" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base flex flex-wrap items-center gap-2">
                      {m.name}
                      {!m.is_read && <Badge variant="default" className="text-[10px]">NEW</Badge>}
                    </CardTitle>
                    <div className="text-sm text-muted-foreground mt-1 flex flex-wrap gap-3">
                      <a href={`mailto:${m.email}`} className="hover:text-primary truncate">{m.email}</a>
                      <span>{format(new Date(m.created_at), "PPp")}</span>
                    </div>
                    {m.subject && <p className="font-medium text-sm text-foreground mt-2">Subject: {m.subject}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" onClick={() => toggleRead(m.id, m.is_read)} title={m.is_read ? "Mark unread" : "Mark read"}>
                      {m.is_read ? <Mail className="h-4 w-4" /> : <MailOpen className="h-4 w-4" />}
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(m.id)} title="Delete">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap text-foreground/90">{m.message}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
