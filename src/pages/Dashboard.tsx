import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, Eye, EyeOff, Home, Clock, CheckCircle, XCircle, MessageSquare } from "lucide-react";
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

export default function Dashboard() {
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState<PropertyWithImages[]>([]);
  const [inquiryCounts, setInquiryCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || role !== "landlord")) {
      navigate("/");
    }
  }, [user, role, authLoading]);

  useEffect(() => {
    if (user && role === "landlord") fetchData();
  }, [user, role]);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("properties")
      .select("*, property_images(image_url, display_order)")
      .eq("landlord_id", user!.id)
      .order("created_at", { ascending: false });
    const props = (data ?? []) as PropertyWithImages[];
    setProperties(props);

    // Fetch inquiry counts per property
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

  const toggleVacancy = async (id: string, current: boolean) => {
    await supabase.from("properties").update({ is_vacant: !current }).eq("id", id);
    setProperties((prev) => prev.map((p) => (p.id === id ? { ...p, is_vacant: !current } : p)));
    toast({ title: !current ? "Marked as Available" : "Marked as Occupied" });
  };

  const deleteProperty = async (id: string) => {
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
    return "Pending Review";
  };

  if (authLoading || loading) return <div className="container py-20 text-center text-muted-foreground">Loading...</div>;

  const approved = properties.filter((p) => p.status === "approved").length;
  const pending = properties.filter((p) => p.status === "pending").length;
  const vacant = properties.filter((p) => p.is_vacant).length;

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Landlord Dashboard</h1>
          <p className="text-muted-foreground text-sm">Manage your properties and listings</p>
        </div>
        <Button asChild>
          <Link to="/properties/new"><Plus className="h-4 w-4 mr-1" />Add Property</Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
                      <p className="text-sm text-muted-foreground">{p.city}{p.area ? `, ${p.area}` : ""}</p>
                      <div className="flex items-center gap-3 mt-2 text-sm">
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
                            <AlertDialogDescription>This action cannot be undone. All images and inquiries for this property will also be deleted.</AlertDialogDescription>
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
