import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { Home, Heart, Plus, LogOut, User, Shield, Menu, X, LayoutDashboard, MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

export function Navbar() {
  const { user, role, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const dashboardLink = role === "admin" ? "/admin" : role === "landlord" ? "/dashboard" : "/tenant";
  const dashboardLabel = role === "admin" ? "Admin" : role === "landlord" ? "Dashboard" : "My Dashboard";

  // Fetch unread message count
  useEffect(() => {
    if (!user) { setUnreadCount(0); return; }

    const fetchUnread = async () => {
      // Get all conversation IDs for this user
      const { data: convos } = await supabase
        .from("conversations")
        .select("id");

      if (!convos?.length) { setUnreadCount(0); return; }

      const convoIds = convos.map((c) => c.id);

      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .in("conversation_id", convoIds)
        .eq("is_read", false)
        .neq("sender_id", user.id);

      setUnreadCount(count ?? 0);
    };

    fetchUnread();

    // Subscribe to new messages for realtime badge updates
    const channel = supabase
      .channel("navbar-unread")
      .on("postgres_changes", {
        event: "*", schema: "public", table: "messages",
      }, () => {
        fetchUnread();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const MessagesLink = ({ mobile }: { mobile?: boolean }) => (
    <Button variant="ghost" size="sm" asChild onClick={mobile ? () => setMobileOpen(false) : undefined}>
      <Link to="/messages" className="relative">
        <MessageCircle className="h-4 w-4 mr-1" />
        Messages
        {unreadCount > 0 && (
          <Badge className="absolute -top-1.5 -right-2.5 bg-destructive text-destructive-foreground text-[10px] h-4 min-w-4 flex items-center justify-center rounded-full px-1 leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </Link>
    </Button>
  );

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg text-primary">
          <Home className="h-5 w-5" />
          GharKhoj
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/search">Browse</Link>
          </Button>
          {user ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to={dashboardLink}>
                  <LayoutDashboard className="h-4 w-4 mr-1" />{dashboardLabel}
                </Link>
              </Button>
              <MessagesLink />
              {role === "tenant" && (
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/favorites"><Heart className="h-4 w-4 mr-1" />Favorites</Link>
                </Button>
              )}
              {role === "landlord" && (
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/properties/new"><Plus className="h-4 w-4 mr-1" />List Property</Link>
                </Button>
              )}
              <Button variant="ghost" size="sm" asChild>
                <Link to="/profile"><User className="h-4 w-4 mr-1" />Profile</Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-1" />Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </nav>

        {/* Mobile hamburger */}
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav className="md:hidden border-t bg-background p-4 flex flex-col gap-2">
          <Button variant="ghost" size="sm" asChild onClick={() => setMobileOpen(false)}>
            <Link to="/search">Browse</Link>
          </Button>
          {user ? (
            <>
              <Button variant="ghost" size="sm" asChild onClick={() => setMobileOpen(false)}>
                <Link to={dashboardLink}>{dashboardLabel}</Link>
              </Button>
              <MessagesLink mobile />
              {role === "tenant" && (
                <Button variant="ghost" size="sm" asChild onClick={() => setMobileOpen(false)}>
                  <Link to="/favorites">Favorites</Link>
                </Button>
              )}
              {role === "landlord" && (
                <Button variant="ghost" size="sm" asChild onClick={() => setMobileOpen(false)}>
                  <Link to="/properties/new">List Property</Link>
                </Button>
              )}
              <Button variant="ghost" size="sm" asChild onClick={() => setMobileOpen(false)}>
                <Link to="/profile">Profile</Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { signOut(); setMobileOpen(false); }}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild onClick={() => setMobileOpen(false)}>
                <Link to="/login">Login</Link>
              </Button>
              <Button size="sm" asChild onClick={() => setMobileOpen(false)}>
                <Link to="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </nav>
      )}
    </header>
  );
}
