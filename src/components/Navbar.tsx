import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { Home, Heart, Plus, LogOut, User, Menu, X, LayoutDashboard, MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function Navbar() {
  const { user, role, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const dashboardLink = role === "admin" ? "/admin" : role === "landlord" ? "/dashboard" : "/tenant";
  const dashboardLabel = role === "admin" ? "Admin" : role === "landlord" ? "Dashboard" : "My Dashboard";

  // Fetch unread message count
  useEffect(() => {
    if (!user) { setUnreadCount(0); return; }

    const fetchUnread = async () => {
      const { data: convos } = await supabase.from("conversations").select("id");
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
    const channel = supabase
      .channel("navbar-unread")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => fetchUnread())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const close = () => setMobileOpen(false);

  const navLinks = (
    <>
      <Button variant="ghost" size="sm" asChild onClick={close}>
        <Link to="/search">Browse</Link>
      </Button>
      {user ? (
        <>
          <Button variant="ghost" size="sm" asChild onClick={close}>
            <Link to={dashboardLink}>
              <LayoutDashboard className="h-4 w-4 mr-1" />{dashboardLabel}
            </Link>
          </Button>

          {/* Messages with badge */}
          <div className="relative">
            <Button variant="ghost" size="sm" asChild onClick={close}>
              <Link to="/messages">
                <MessageCircle className="h-4 w-4 mr-1" />Messages
              </Link>
            </Button>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold h-[18px] min-w-[18px] flex items-center justify-center rounded-full px-1 pointer-events-none shadow-sm">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>

          {role === "tenant" && (
            <Button variant="ghost" size="sm" asChild onClick={close}>
              <Link to="/favorites"><Heart className="h-4 w-4 mr-1" />Favorites</Link>
            </Button>
          )}
          {role === "landlord" && (
            <Button variant="ghost" size="sm" asChild onClick={close}>
              <Link to="/properties/new"><Plus className="h-4 w-4 mr-1" />List Property</Link>
            </Button>
          )}
          <Button variant="ghost" size="sm" asChild onClick={close}>
            <Link to="/profile"><User className="h-4 w-4 mr-1" />Profile</Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { signOut(); close(); }}>
            <LogOut className="h-4 w-4 mr-1" />Logout
          </Button>
        </>
      ) : (
        <>
          <Button variant="ghost" size="sm" asChild onClick={close}>
            <Link to="/login">Login</Link>
          </Button>
          <Button size="sm" asChild onClick={close}>
            <Link to="/signup">Sign Up</Link>
          </Button>
        </>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg text-primary">
          <Home className="h-5 w-5" />
          GharKhoj
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1">{navLinks}</nav>

        {/* Mobile hamburger */}
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav className="lg:hidden border-t bg-background p-4 flex flex-col gap-1 animate-fade-in">
          {navLinks}
        </nav>
      )}
    </header>
  );
}
