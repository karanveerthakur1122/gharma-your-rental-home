import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { Home, Heart, Plus, LogOut, User, Shield, Menu, X } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const { user, role, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg text-primary">
          <Home className="h-5 w-5" />
          GharKhoj
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/search">Browse</Link>
          </Button>
          {user ? (
            <>
              {role === "tenant" && (
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/favorites"><Heart className="h-4 w-4 mr-1" />Favorites</Link>
                </Button>
              )}
              {role === "landlord" && (
                <>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/dashboard">Dashboard</Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/properties/new"><Plus className="h-4 w-4 mr-1" />List Property</Link>
                  </Button>
                </>
              )}
              {role === "admin" && (
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/admin"><Shield className="h-4 w-4 mr-1" />Admin</Link>
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
              {role === "tenant" && (
                <Button variant="ghost" size="sm" asChild onClick={() => setMobileOpen(false)}>
                  <Link to="/favorites">Favorites</Link>
                </Button>
              )}
              {role === "landlord" && (
                <>
                  <Button variant="ghost" size="sm" asChild onClick={() => setMobileOpen(false)}>
                    <Link to="/dashboard">Dashboard</Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild onClick={() => setMobileOpen(false)}>
                    <Link to="/properties/new">List Property</Link>
                  </Button>
                </>
              )}
              {role === "admin" && (
                <Button variant="ghost" size="sm" asChild onClick={() => setMobileOpen(false)}>
                  <Link to="/admin">Admin</Link>
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
