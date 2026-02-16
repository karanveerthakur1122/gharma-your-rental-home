import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useNavigate, Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  Heart, MessageSquare, MapPin, Wifi, Car, PawPrint, Trash2, Clock, Calendar, Home, RefreshCw,
} from "lucide-react";
import { SEOHead } from "@/components/SEOHead";

// ═══════════════════════════════════════════════
// Favorites Tab
// ═══════════════════════════════════════════════
function FavoritesTab({ userId }: { userId: string }) {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data: favs } = await supabase
      .from("favorites")
      .select("id, property_id")
      .eq("user_id", userId);

    if (!favs || favs.length === 0) { setFavorites([]); setLoading(false); return; }

    const { data: props } = await supabase
      .from("properties")
      .select("*, property_images(image_url, display_order)")
      .in("id", favs.map((f) => f.property_id));

    const favMap = new Map(favs.map((f) => [f.property_id, f.id]));
    setFavorites((props ?? []).map((p) => ({ ...p, favorite_id: favMap.get(p.id) })));
    setLoading(false);
  };

  useEffect(() => { load(); }, [userId]);

  const removeFavorite = async (favId: string, propId: string) => {
    await supabase.from("favorites").delete().eq("id", favId);
    setFavorites((prev) => prev.filter((f) => f.id !== propId));
    toast({ title: "Removed from favorites" });
  };

  if (loading) return <div className="py-8 text-center text-muted-foreground">Loading favorites...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Saved Properties ({favorites.length})</h2>
        <Button variant="ghost" size="sm" onClick={load}><RefreshCw className="h-4 w-4 mr-1" />Refresh</Button>
      </div>

      {favorites.length === 0 ? (
        <Card className="p-10 text-center">
          <Heart className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="font-medium">No saved properties</p>
          <p className="text-sm text-muted-foreground mb-4">Browse listings and save ones you like.</p>
          <Button asChild><Link to="/search">Browse Rentals</Link></Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {favorites.map((p) => {
            const image = p.property_images?.sort((a: any, b: any) => a.display_order - b.display_order)[0]?.image_url;
            return (
              <Card key={p.id} className="overflow-hidden group">
                <Link to={`/property/${p.id}`}>
                  <div className="aspect-video bg-muted relative">
                    {image ? (
                      <img src={image} alt={p.title} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">No image</div>
                    )}
                    <Badge className="absolute top-2 left-2" variant="secondary">
                      {p.room_type.toUpperCase()}
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-base truncate">{p.title}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {p.city}{p.area ? `, ${p.area}` : ""}
                    </p>
                    <p className="text-lg font-bold text-primary mt-2">
                      NPR {Number(p.price).toLocaleString()}<span className="text-sm font-normal text-muted-foreground">/mo</span>
                    </p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {p.furnished && <Badge variant="outline" className="text-xs">Furnished</Badge>}
                      {p.internet && <Badge variant="outline" className="text-xs"><Wifi className="h-3 w-3 mr-1" />WiFi</Badge>}
                      {p.parking && <Badge variant="outline" className="text-xs"><Car className="h-3 w-3 mr-1" />Parking</Badge>}
                      {p.pets_allowed && <Badge variant="outline" className="text-xs"><PawPrint className="h-3 w-3 mr-1" />Pets</Badge>}
                    </div>
                  </CardContent>
                </Link>
                <div className="px-4 pb-3">
                  <Button variant="ghost" size="sm" className="w-full text-destructive hover:text-destructive" onClick={() => removeFavorite(p.favorite_id, p.id)}>
                    <Trash2 className="h-4 w-4 mr-1" />Remove
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// My Inquiries Tab
// ═══════════════════════════════════════════════
function MyInquiriesTab({ userId }: { userId: string }) {
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data: inqs } = await supabase
      .from("inquiries")
      .select("*")
      .eq("tenant_id", userId)
      .order("created_at", { ascending: false });

    if (!inqs || inqs.length === 0) { setInquiries([]); setLoading(false); return; }

    const propIds = [...new Set(inqs.map((i) => i.property_id))];
    const { data: props } = await supabase.from("properties").select("id, title, city, area, price").in("id", propIds);
    const propMap = new Map((props ?? []).map((p) => [p.id, p]));

    setInquiries(inqs.map((i) => ({
      ...i,
      property: propMap.get(i.property_id) ?? null,
    })));
    setLoading(false);
  };

  useEffect(() => { load(); }, [userId]);

  const deleteInquiry = async (id: string) => {
    await supabase.from("inquiries").delete().eq("id", id);
    setInquiries((prev) => prev.filter((i) => i.id !== id));
    toast({ title: "Inquiry deleted" });
  };

  if (loading) return <div className="py-8 text-center text-muted-foreground">Loading inquiries...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">My Inquiries ({inquiries.length})</h2>
        <Button variant="ghost" size="sm" onClick={load}><RefreshCw className="h-4 w-4 mr-1" />Refresh</Button>
      </div>

      {inquiries.length === 0 ? (
        <Card className="p-10 text-center">
          <MessageSquare className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="font-medium">No inquiries sent</p>
          <p className="text-sm text-muted-foreground mb-4">Browse properties and send inquiries to landlords.</p>
          <Button asChild><Link to="/search">Browse Rentals</Link></Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {inquiries.map((inq) => (
            <Card key={inq.id}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {inq.property ? (
                        <Link to={`/property/${inq.property_id}`} className="font-semibold text-sm hover:text-primary transition-colors">
                          {inq.property.title}
                        </Link>
                      ) : (
                        <span className="font-semibold text-sm text-muted-foreground">Property removed</span>
                      )}
                      <Badge variant={inq.status === "open" ? "default" : "secondary"} className="text-xs">
                        {inq.status}
                      </Badge>
                    </div>
                    {inq.property && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />{inq.property.city}{inq.property.area ? `, ${inq.property.area}` : ""} · NPR {Number(inq.property.price).toLocaleString()}/mo
                      </p>
                    )}
                    {inq.message && <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{inq.message}</p>}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(inq.created_at).toLocaleDateString()}</span>
                      {inq.preferred_move_in && (
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Move-in: {new Date(inq.preferred_move_in).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteInquiry(inq.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// Main Tenant Dashboard
// ═══════════════════════════════════════════════
export default function TenantDashboard() {
  const { user, role, loading: authLoading, roleLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !roleLoading && user && role !== "tenant") navigate("/");
    if (!authLoading && !user) navigate("/login");
  }, [user, role, authLoading, roleLoading]);

  if (authLoading || roleLoading) return <div className="container py-20 text-center text-muted-foreground">Loading...</div>;
  if (!user || role !== "tenant") return null;

  return (
    <main className="container py-6">
      <SEOHead title="My Dashboard" description="View your saved rental properties, manage favorites, and track your inquiries." noindex />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Dashboard</h1>
          <p className="text-muted-foreground text-sm">Your saved properties and inquiries</p>
        </div>
        <Button asChild>
          <Link to="/search">Browse Rentals</Link>
        </Button>
      </div>

      <Tabs defaultValue="favorites" className="space-y-6">
        <TabsList>
          <TabsTrigger value="favorites" className="gap-1"><Heart className="h-4 w-4" />Favorites</TabsTrigger>
          <TabsTrigger value="inquiries" className="gap-1"><MessageSquare className="h-4 w-4" />My Inquiries</TabsTrigger>
        </TabsList>
        <TabsContent value="favorites"><FavoritesTab userId={user.id} /></TabsContent>
        <TabsContent value="inquiries"><MyInquiriesTab userId={user.id} /></TabsContent>
      </Tabs>
    </main>
  );
}
