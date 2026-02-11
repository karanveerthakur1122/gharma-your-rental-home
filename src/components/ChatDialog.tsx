import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ChatDialogProps {
  propertyId: string;
  landlordId: string;
  propertyTitle: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

export function ChatDialog({ propertyId, landlordId, propertyTitle }: ChatDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Load or create conversation when dialog opens
  useEffect(() => {
    if (!open || !user) return;
    loadConversation();
  }, [open, user]);

  // Subscribe to realtime messages
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
          setTimeout(scrollToBottom, 50);

          // Mark as read if it's from the other person
          if (newMessage.sender_id !== user?.id) {
            supabase
              .from("messages")
              .update({ is_read: true })
              .eq("id", newMessage.id)
              .then();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user?.id, scrollToBottom]);

  const loadConversation = async () => {
    if (!user) return;
    setLoading(true);

    // Determine tenant_id based on who is opening the chat
    const isLandlord = user.id === landlordId;

    // Find existing conversation for this property involving this user
    let query = supabase
      .from("conversations")
      .select("*")
      .eq("property_id", propertyId);

    if (isLandlord) {
      query = query.eq("landlord_id", user.id);
    } else {
      query = query.eq("tenant_id", user.id);
    }

    const { data: existing } = await query.maybeSingle();

    if (existing) {
      setConversationId(existing.id);
      await loadMessages(existing.id);
    } else if (!isLandlord) {
      // Create new conversation (only tenants can initiate)
      const { data: newConvo, error } = await supabase
        .from("conversations")
        .insert({
          property_id: propertyId,
          tenant_id: user.id,
          landlord_id: landlordId,
        })
        .select()
        .single();

      if (error) {
        toast({ title: "Error starting conversation", description: error.message, variant: "destructive" });
      } else if (newConvo) {
        setConversationId(newConvo.id);
      }
    }
    setLoading(false);
  };

  const loadMessages = async (convoId: string) => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", convoId)
      .order("created_at", { ascending: true });

    setMessages((data as Message[]) ?? []);
    setTimeout(scrollToBottom, 100);

    // Mark unread messages as read
    if (user) {
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("conversation_id", convoId)
        .neq("sender_id", user.id)
        .eq("is_read", false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() || !conversationId || !user || sending) return;

    setSending(true);
    const content = newMsg.trim();
    setNewMsg("");

    const { error } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content,
    });

    if (error) {
      toast({ title: "Failed to send message", variant: "destructive" });
      setNewMsg(content);
    }
    setSending(false);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" variant="default">
          <MessageCircle className="h-4 w-4 mr-2" />
          Message Landlord
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md flex flex-col h-[80vh] max-h-[600px] p-0">
        <DialogHeader className="p-4 pb-2 border-b">
          <DialogTitle className="text-base">
            Chat about {propertyTitle}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Messages area */}
            <ScrollArea className="flex-1 px-4" ref={scrollRef}>
              <div className="py-4 space-y-3">
                {messages.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    No messages yet. Say hello! 👋
                  </p>
                )}
                {messages.map((msg) => {
                  const isMe = msg.sender_id === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                          isMe
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-muted text-foreground rounded-bl-md"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        <p
                          className={`text-[10px] mt-1 ${
                            isMe ? "text-primary-foreground/60" : "text-muted-foreground"
                          }`}
                        >
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
            </ScrollArea>

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
        )}
      </DialogContent>
    </Dialog>
  );
}
