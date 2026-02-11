import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, Loader2, ArrowLeft, Home } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";

interface Conversation {
  id: string;
  property_id: string;
  tenant_id: string;
  landlord_id: string;
  updated_at: string;
  property?: { title: string; city: string; property_images: { image_url: string; display_order: number }[] };
  other_name?: string;
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgsLoading, setMsgsLoading] = useState(false);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/login"); return; }
    loadConversations();
  }, [user, authLoading]);

  // Realtime for active conversation
  useEffect(() => {
    if (!activeConvo) return;
    const channel = supabase
      .channel(`inbox-msgs:${activeConvo.id}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "messages",
        filter: `conversation_id=eq.${activeConvo.id}`,
      }, (payload) => {
        const msg = payload.new as Message;
        setMessages((prev) => prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]);
        setTimeout(scrollToBottom, 50);
        if (msg.sender_id !== user?.id) {
          supabase.from("messages").update({ is_read: true }).eq("id", msg.id).then();
          setConversations((prev) =>
            prev.map((c) => c.id === activeConvo.id ? { ...c, unread_count: 0, last_message: msg.content, last_message_at: msg.created_at } : c)
          );
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeConvo?.id, user?.id, scrollToBottom]);

  // Realtime for new messages across all conversations (update sidebar)
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("inbox-all")
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "messages",
      }, (payload) => {
        const msg = payload.new as Message;
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== msg.conversation_id) return c;
            const isActive = activeConvo?.id === c.id;
            return {
              ...c,
              last_message: msg.content,
              last_message_at: msg.created_at,
              unread_count: isActive || msg.sender_id === user.id ? c.unread_count : (c.unread_count ?? 0) + 1,
            };
          })
        );
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, activeConvo?.id]);

  const loadConversations = async () => {
    if (!user) return;
    setLoading(true);

    const { data: convos } = await supabase
      .from("conversations")
      .select("*, properties:property_id(title, city, property_images(image_url, display_order))")
      .order("updated_at", { ascending: false });

    if (!convos) { setLoading(false); return; }

    // Get last message + unread count for each
    const enriched = await Promise.all(
      (convos as any[]).map(async (c) => {
        const otherId = c.tenant_id === user.id ? c.landlord_id : c.tenant_id;

        const [{ data: lastMsg }, { count: unread }, { data: profile }] = await Promise.all([
          supabase.from("messages").select("content, created_at").eq("conversation_id", c.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
          supabase.from("messages").select("*", { count: "exact", head: true }).eq("conversation_id", c.id).eq("is_read", false).neq("sender_id", user.id),
          supabase.from("profiles").select("full_name").eq("user_id", otherId).maybeSingle(),
        ]);

        return {
          ...c,
          property: c.properties,
          other_name: profile?.full_name || "User",
          last_message: lastMsg?.content,
          last_message_at: lastMsg?.created_at,
          unread_count: unread ?? 0,
        } as Conversation;
      })
    );

    setConversations(enriched);
    setLoading(false);
  };

  const openConversation = async (convo: Conversation) => {
    setActiveConvo(convo);
    setMsgsLoading(true);

    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", convo.id)
      .order("created_at", { ascending: true });

    setMessages((data as Message[]) ?? []);
    setTimeout(scrollToBottom, 100);

    // Mark all unread as read
    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("conversation_id", convo.id)
      .neq("sender_id", user!.id)
      .eq("is_read", false);

    setConversations((prev) =>
      prev.map((c) => c.id === convo.id ? { ...c, unread_count: 0 } : c)
    );
    setMsgsLoading(false);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() || !activeConvo || !user || sending) return;
    setSending(true);
    const content = newMsg.trim();
    setNewMsg("");

    const { error } = await supabase.from("messages").insert({
      conversation_id: activeConvo.id,
      sender_id: user.id,
      content,
    });

    if (error) {
      toast({ title: "Failed to send", variant: "destructive" });
      setNewMsg(content);
    }
    setSending(false);
  };

  if (authLoading || loading) {
    return (
      <div className="container py-20 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
      </div>
    );
  }

  if (!user) return null;

  const propertyImg = (convo: Conversation) => {
    const imgs = convo.property?.property_images;
    if (!imgs?.length) return null;
    return imgs.sort((a, b) => a.display_order - b.display_order)[0].image_url;
  };

  return (
    <div className="container py-4 h-[calc(100vh-3.5rem)]">
      <div className="flex h-full border rounded-xl overflow-hidden bg-card">
        {/* Sidebar - conversation list */}
        <div className={`w-full md:w-80 lg:w-96 border-r flex flex-col shrink-0 ${activeConvo ? "hidden md:flex" : "flex"}`}>
          <div className="p-4 border-b">
            <h1 className="text-lg font-bold flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              Messages
            </h1>
          </div>

          {conversations.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
                <p className="font-medium text-foreground">No conversations yet</p>
                <p className="text-sm text-muted-foreground mt-1">Start chatting from a property listing</p>
                <Button variant="outline" size="sm" className="mt-3" asChild>
                  <Link to="/search">Browse Properties</Link>
                </Button>
              </div>
            </div>
          ) : (
            <ScrollArea className="flex-1">
              {conversations.map((convo) => {
                const img = propertyImg(convo);
                const isActive = activeConvo?.id === convo.id;
                return (
                  <button
                    key={convo.id}
                    onClick={() => openConversation(convo)}
                    className={`w-full text-left p-3 flex gap-3 border-b transition-colors hover:bg-accent/50 ${isActive ? "bg-accent" : ""}`}
                  >
                    {/* Property thumbnail */}
                    <div className="h-12 w-12 rounded-lg bg-muted shrink-0 overflow-hidden">
                      {img ? (
                        <img src={img} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Home className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-sm truncate">{convo.other_name}</p>
                        {convo.unread_count! > 0 && (
                          <Badge className="bg-primary text-primary-foreground text-[10px] h-5 min-w-5 flex items-center justify-center rounded-full px-1.5">
                            {convo.unread_count}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{convo.property?.title}</p>
                      {convo.last_message && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{convo.last_message}</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </ScrollArea>
          )}
        </div>

        {/* Chat area */}
        <div className={`flex-1 flex flex-col ${!activeConvo ? "hidden md:flex" : "flex"}`}>
          {activeConvo ? (
            <>
              {/* Chat header */}
              <div className="p-3 border-b flex items-center gap-3">
                <Button variant="ghost" size="icon" className="md:hidden shrink-0" onClick={() => setActiveConvo(null)}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{activeConvo.other_name}</p>
                  <Link to={`/property/${activeConvo.property_id}`} className="text-xs text-primary hover:underline truncate block">
                    {activeConvo.property?.title} — {activeConvo.property?.city}
                  </Link>
                </div>
              </div>

              {/* Messages */}
              {msgsLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ScrollArea className="flex-1 px-4">
                  <div className="py-4 space-y-3">
                    {messages.length === 0 && (
                      <p className="text-center text-sm text-muted-foreground py-8">No messages yet. Say hello! 👋</p>
                    )}
                    {messages.map((msg) => {
                      const isMe = msg.sender_id === user.id;
                      return (
                        <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                              isMe
                                ? "bg-primary text-primary-foreground rounded-br-md"
                                : "bg-muted text-foreground rounded-bl-md"
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                            <p className={`text-[10px] mt-1 ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={bottomRef} />
                  </div>
                </ScrollArea>
              )}

              {/* Input */}
              <form onSubmit={sendMessage} className="p-3 border-t flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                  className="flex-1"
                  autoFocus
                />
                <Button type="submit" size="icon" disabled={!newMsg.trim() || sending}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-6">
              <div>
                <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                <p className="font-medium text-foreground">Select a conversation</p>
                <p className="text-sm text-muted-foreground mt-1">Choose from your active chats to continue messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
