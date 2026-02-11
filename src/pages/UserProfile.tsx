import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  User, MapPin, Phone, Calendar, Home, MessageSquare, Users, ArrowLeft, Shield, Heart,
} from "lucide-react";

interface ProfileData {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface PropertyItem {
  id: string;
  title: string;
  city: string;
  area: string | null;
  price: number;
  room_type: string;
  status: string;
  is_vacant: boolean;
  property_images: { image_url: string; display_order: number }[];
}

export default function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [conversationCount, setConversationCount] = useState(0);
  const [uniqueContacts, setUniqueContacts] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    loadProfile();
  }, [id]);

  const loadProfile = async () => {
    setLoading(true);

    const [profileRes, roleRes, propsRes, convoRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", id!).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", id!).maybeSingle(),
      supabase
        .from("properties")
        .select("id, title, city, area, price, room_type, status, is_vacant, property_images(image_url, display_order)")
        .eq("landlord_id", id!)
        .eq("status", "approved")
        .order("created_at", { ascending: false }),
      supabase
        .from("conversations")
        .select("id, tenant_id, landlord_id")
        .or(`tenant_id.eq.${id},landlord_id.eq.${id}`),
    ]);

    setProfile(profileRes.data as ProfileData | null);
    setRole(roleRes.data?.role ?? null);
    setProperties((propsRes.data as PropertyItem[]) ?? []);

    const convos = convoRes.data ?? [];
    setConversationCount(convos.length);
    const contacts = new Set(
      convos.map((c: any) => (c.tenant_id === id ? c.landlord_id : c.tenant_id))
    );
    setUniqueContacts(contacts.size);

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="container py-20 text-center">
        <div className="animate-pulse space-y-4 max-w-2xl mx-auto">
          <div className="h-20 w-20 rounded-full bg-muted mx-auto" />
          <div className="h-6 bg-muted rounded w-1/3 mx-auto" />
          <div className="h-4 bg-muted rounded w-1/4 mx-auto" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container py-20 text-center">
        <User className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
        <h2 className="font-semibold text-lg">User not found</h2>
        <Button variant="outline" className="mt-4" asChild>
          <Link to="/search">Back to Search</Link>
        </Button>
      </div>
    );
  }

  const initials = (profile.full_name ?? "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const roleBadge = role === "admin" ? "default" : role === "landlord" ? "secondary" : "outline";

  return (
    <div className="container py-6 max-w-4xl">
      <Link
        to="/search"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      {/* Profile header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <Avatar className="h-20 w-20 text-xl">
              <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.full_name ?? "User"} />
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left flex-1">
              <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                <h1 className="text-2xl font-bold">{profile.full_name || "Unnamed User"}</h1>
                {role && (
                  <Badge variant={roleBadge as any} className="capitalize">{role}</Badge>
                )}
              </div>
              {profile.phone && (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1 justify-center sm:justify-start">
                  <Phone className="h-3.5 w-3.5" /> {profile.phone}
                </p>
              )}
              <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1 justify-center sm:justify-start">
                <Calendar className="h-3.5 w-3.5" /> Joined {new Date(profile.created_at).toLocaleDateString("en-NP", { year: "numeric", month: "long" })}
              </p>
            </div>
          </div>

          <Separator className="my-5" />

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{properties.length}</p>
              <p className="text-xs text-muted-foreground">Listings</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{conversationCount}</p>
              <p className="text-xs text-muted-foreground">Conversations</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{uniqueContacts}</p>
              <p className="text-xs text-muted-foreground">Connections</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Properties */}
      {properties.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Home className="h-5 w-5" /> Listed Properties ({properties.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {properties.map((p) => {
              const thumb = p.property_images?.sort((a, b) => a.display_order - b.display_order)[0]?.image_url;
              return (
                <Link key={p.id} to={`/property/${p.id}`} className="group">
                  <Card className="overflow-hidden hover:shadow-lg transition-all h-full flex flex-col">
                    <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                      {thumb ? (
                        <img src={thumb} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">No image</div>
                      )}
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-background/90 text-foreground backdrop-blur-sm text-xs">{p.room_type.toUpperCase()}</Badge>
                      </div>
                    </div>
                    <CardContent className="p-4 flex-1">
                      <h3 className="font-semibold truncate">{p.title}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="h-3.5 w-3.5" /> {p.city}{p.area ? `, ${p.area}` : ""}
                      </p>
                      <p className="text-lg font-bold text-primary mt-2">
                        NPR {Number(p.price).toLocaleString()}<span className="text-xs font-normal text-muted-foreground">/mo</span>
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {properties.length === 0 && role === "landlord" && (
        <Card className="p-10 text-center">
          <Home className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="font-medium">No properties listed yet</p>
        </Card>
      )}
    </div>
  );
}
