import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus, Edit, Trash2, Eye, EyeOff, Home, Clock, CheckCircle, XCircle,
  MessageSquare, RefreshCw, MapPin, Calendar,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface PropertyWithImages {
  id: string;
  title: string;
  city: string;
  area: string | null;
  price: number;
  room_type: string;
  status: string;
  is_vacant: boolean;
  created_at: string;
  property_images: { image_url: string; display_order: number }[];
}

interface Inquiry {
  id: string;
  message: string | null;
  preferred_move_in: string | null;
  status: string;
  created_at: string;
  property_id: string;
  property_title?: string;
}

// ═══════════════════════════════════════════════
// Properties Tab
// ═══════════════════════════════════════════════
function PropertiesTab({ user }: { user: any }) {
  const [properties, setProperties] = useState<PropertyWithImages[]>([]);
  const [inquiryCounts, setInquiryCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("properties")
      .select("*, property_images(image_url, display_order)")
      .eq("landlord_id", user.id)
      .order("created_at", { ascending: false });
    const props = (data ?? []) as PropertyWithImages[];
    setProperties(props);

    if (props.length > 0) {
      const { data: inquiries } = await supabase
        .from("inquiries")
        .select("property_id")
        .in("property_id", props.map((p) => p.id));
      const counts: Record<string, number> = {};
      inquiries?.forEach((inq) => {
        counts[inq.property_id] = (counts[inq.property_id] || 0) + 1;
      });
      setInquiryCounts(counts);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const toggleVacancy = async (id: string, current: boolean) => {
    await supabase.from("properties").update({ is_vacant: !current }).eq("id", id);
    setProperties((prev) => prev.map((p) => (p.id === id ? { ...p, is_vacant: !current } : p)));
    toast({ title: !current ? "Marked as Available" : "Marked as Occupied" });
  };

  const deleteProperty = async (id: string) => {
    // Delete images from storage first
    const { data: images } = await supabase.from("property_images").select("image_url").eq("property_id", id);
    if (images) {
      const paths = images.map((img) => {
        const url = new URL(img.image_url);
        const parts = url.pathname.split("/storage/v1/object/public/property-images/");
        return parts[1] || "";
      }).filter(Boolean);
      if (paths.length > 0) await supabase.storage.from("property-images").remove(paths);
    }
    const { error } = await supabase.from("properties").delete().eq("id", id);
    if (error) {
      toast({ title: "Error deleting property", description: error.message, variant: "destructive" });
    } else {
      setProperties((prev) => prev.filter((p) => p.id !== id));
      toast({ title: "Property deleted" });
    }
  };

  const statusIcon = (status: string) => {
    if (status === "approved") return <CheckCircle className="h-3.5 w-3.5 text-primary" />;
    if (status === "rejected") return <XCircle className="h-3.5 w-3.5 text-destructive" />;
    return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  const statusLabel = (status: string) => {
    if (status === "approved") return "Verified";
    if (status === "rejected") return "Rejected";
    return "Pending";
  };

  if (loading) return <div className="py-8 text-center text-muted-foreground">Loading properties...</div>;

  const approved = properties.filter((p) => p.status === "approved").length;
  const pending = properties.filter((p) => p.status === "pending").length;
  const vacant = properties.filter((p) => p.is_vacant).length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: properties.length, icon: Home },
          { label: "Verified", value: approved, icon: CheckCircle },
          { label: "Pending", value: pending, icon: Clock },
          { label: "Available", value: vacant, icon: Eye },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center shrink-0">
                <s.icon className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Properties list */}
      {properties.length === 0 ? (
        <Card className="p-12 text-center">
          <Home className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-semibold text-lg mb-1">No properties yet</h3>
          <p className="text-muted-foreground text-sm mb-4">Add your first property to start receiving inquiries.</p>
          <Button asChild><Link to="/properties/new"><Plus className="h-4 w-4 mr-1" />Add Property</Link></Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {properties.map((p) => {
            const thumb = p.property_images?.sort((a, b) => a.display_order - b.display_order)[0]?.image_url;
            return (
              <Card key={p.id} className="overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  <div className="sm:w-48 h-32 sm:h-auto bg-muted shrink-0">
                    {thumb ? (
                      <img src={thumb} alt={p.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No image</div>
                    )}
                  </div>
                  <CardContent className="p-4 flex-1 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{p.title}</h3>
                        <Badge variant={p.is_vacant ? "default" : "secondary"} className="text-xs shrink-0">
                          {p.is_vacant ? "Available" : "Occupied"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />{p.city}{p.area ? `, ${p.area}` : ""}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-sm flex-wrap">
                        <span className="font-medium text-primary">NPR {Number(p.price).toLocaleString()}/mo</span>
                        <span className="flex items-center gap-1">{statusIcon(p.status)} {statusLabel(p.status)}</span>
                        {(inquiryCounts[p.id] ?? 0) > 0 && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <MessageSquare className="h-3.5 w-3.5" /> {inquiryCounts[p.id]} inquiries
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => toggleVacancy(p.id, p.is_vacant)} title={p.is_vacant ? "Mark Occupied" : "Mark Available"}>
                        {p.is_vacant ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`/properties/${p.id}/edit`}><Edit className="h-4 w-4" /></Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this property?</AlertDialogTitle>
                            <AlertDialogDescription>This action cannot be undone. All images and inquiries will also be removed.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteProperty(p.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
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
// Inquiries Tab
// ═══════════════════════════════════════════════
function InquiriesTab({ user }: { user: any }) {
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    // Get landlord's properties first
    const { data: props } = await supabase.from("properties").select("id, title").eq("landlord_id", user.id);
    if (!props || props.length === 0) { setInquiries([]); setLoading(false); return; }

    const propMap = new Map(props.map((p) => [p.id, p.title]));
    const { data: inqs } = await supabase
      .from("inquiries")
      .select("*")
      .in("property_id", props.map((p) => p.id))
      .order("created_at", { ascending: false });

    // Get tenant profiles for display
    const tenantIds = [...new Set((inqs ?? []).map((i) => i.tenant_id))];
    const { data: profiles } = tenantIds.length > 0
      ? await supabase.from("profiles").select("user_id, full_name, phone").in("user_id", tenantIds)
      : { data: [] };
    const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));

    setInquiries((inqs ?? []).map((i) => ({
      ...i,
      property_title: propMap.get(i.property_id) ?? "Unknown",
      tenant_name: profileMap.get(i.tenant_id)?.full_name ?? "Unknown",
      tenant_phone: profileMap.get(i.tenant_id)?.phone ?? null,
    })));
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  if (loading) return <div className="py-8 text-center text-muted-foreground">Loading inquiries...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Inquiries ({inquiries.length})</h2>
        <Button variant="ghost" size="sm" onClick={load}><RefreshCw className="h-4 w-4 mr-1" />Refresh</Button>
      </div>

      {inquiries.length === 0 ? (
        <Card className="p-10 text-center">
          <MessageSquare className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="font-medium">No inquiries yet</p>
          <p className="text-sm text-muted-foreground">When tenants are interested in your properties, their messages will appear here.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {inquiries.map((inq) => (
            <Card key={inq.id}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant="outline" className="text-xs">{inq.property_title}</Badge>
                      <Badge variant={inq.status === "open" ? "default" : "secondary"} className="text-xs">
                        {inq.status}
                      </Badge>
                    </div>
                    <p className="font-medium text-sm">{inq.tenant_name}</p>
                    {inq.tenant_phone && <p className="text-xs text-muted-foreground">{inq.tenant_phone}</p>}
                    {inq.message && <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{inq.message}</p>}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {new Date(inq.created_at).toLocaleDateString()}
                      </span>
                      {inq.preferred_move_in && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> Move-in: {new Date(inq.preferred_move_in).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
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
// Main Dashboard
// ═══════════════════════════════════════════════
export default function Dashboard() {
  const { user, role, loading: authLoading, roleLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !roleLoading && user && role !== "landlord") navigate("/");
    if (!authLoading && !user) navigate("/login");
  }, [user, role, authLoading, roleLoading]);

  if (authLoading || roleLoading) return <div className="container py-20 text-center text-muted-foreground">Loading...</div>;
  if (!user || role !== "landlord") return null;

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Landlord Dashboard</h1>
          <p className="text-muted-foreground text-sm">Manage your properties, listings, and inquiries</p>
        </div>
        <Button asChild>
          <Link to="/properties/new"><Plus className="h-4 w-4 mr-1" />Add Property</Link>
        </Button>
      </div>

      <Tabs defaultValue="properties" className="space-y-6">
        <TabsList>
          <TabsTrigger value="properties" className="gap-1"><Home className="h-4 w-4" />Properties</TabsTrigger>
          <TabsTrigger value="inquiries" className="gap-1"><MessageSquare className="h-4 w-4" />Inquiries</TabsTrigger>
        </TabsList>
        <TabsContent value="properties"><PropertiesTab user={user} /></TabsContent>
        <TabsContent value="inquiries"><InquiriesTab user={user} /></TabsContent>
      </Tabs>
    </div>
  );
}
