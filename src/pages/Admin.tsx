import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import {
  CheckCircle, XCircle, Clock, Users, Home, ShieldCheck, BarChart3, Eye,
  UserX, UserCheck, Search,
} from "lucide-react";

// ── Verification Queue ──
function VerificationQueue() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("properties")
      .select("*, property_images(image_url, display_order)")
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    setProperties(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const updateStatus = async (id: string, status: "approved" | "rejected") => {
    await supabase.from("properties").update({ status: status as any }).eq("id", id);
    toast({ title: status === "approved" ? "Property approved" : "Property rejected" });
    setSelected(null);
    setRejectReason("");
    fetch();
  };

  if (loading) return <p className="text-muted-foreground py-8 text-center">Loading...</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Pending Verification ({properties.length})</h2>
      {properties.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          <CheckCircle className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p>All caught up! No pending listings.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {properties.map((p) => {
            const thumb = p.property_images?.sort((a: any, b: any) => a.display_order - b.display_order)[0]?.image_url;
            return (
              <Card key={p.id} className="overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  <div className="sm:w-40 h-28 sm:h-auto bg-muted shrink-0">
                    {thumb ? <img src={thumb} alt="" className="w-full h-full object-cover" /> : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">No image</div>
                    )}
                  </div>
                  <CardContent className="p-4 flex-1 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{p.title}</h3>
                      <p className="text-sm text-muted-foreground">{p.city}{p.area ? `, ${p.area}` : ""} · {p.room_type.toUpperCase()}</p>
                      <p className="text-sm font-medium text-primary mt-1">NPR {Number(p.price).toLocaleString()}/mo</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" variant="outline" onClick={() => setSelected(p)}>
                        <Eye className="h-4 w-4 mr-1" />Review
                      </Button>
                      <Button size="sm" onClick={() => updateStatus(p.id, "approved")}>
                        <CheckCircle className="h-4 w-4 mr-1" />Approve
                      </Button>
                    </div>
                  </CardContent>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => { if (!o) setSelected(null); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {selected.property_images?.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {selected.property_images.sort((a: any, b: any) => a.display_order - b.display_order).map((img: any, i: number) => (
                      <img key={i} src={img.image_url} alt="" className="w-full aspect-video object-cover rounded" />
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">City:</span> {selected.city}</div>
                  <div><span className="text-muted-foreground">Area:</span> {selected.area || "—"}</div>
                  <div><span className="text-muted-foreground">Address:</span> {selected.address || "—"}</div>
                  <div><span className="text-muted-foreground">Room Type:</span> {selected.room_type.toUpperCase()}</div>
                  <div><span className="text-muted-foreground">Rent:</span> NPR {Number(selected.price).toLocaleString()}</div>
                  <div><span className="text-muted-foreground">Deposit:</span> NPR {Number(selected.deposit).toLocaleString()}</div>
                  <div><span className="text-muted-foreground">Furnished:</span> {selected.furnished ? "Yes" : "No"}</div>
                  <div><span className="text-muted-foreground">Parking:</span> {selected.parking ? "Yes" : "No"}</div>
                </div>
                {selected.description && <p className="text-sm text-muted-foreground">{selected.description}</p>}
                <div className="space-y-2">
                  <Textarea placeholder="Rejection reason (optional)" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={2} />
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="destructive" onClick={() => updateStatus(selected.id, "rejected")}>
                  <XCircle className="h-4 w-4 mr-1" />Reject
                </Button>
                <Button onClick={() => updateStatus(selected.id, "approved")}>
                  <CheckCircle className="h-4 w-4 mr-1" />Approve
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── User Management ──
function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("all");
  const [search, setSearch] = useState("");

  const fetch = async () => {
    setLoading(true);
    // Get profiles with roles
    const { data: profiles } = await supabase.from("profiles").select("*");
    const { data: roles } = await supabase.from("user_roles").select("*");
    const roleMap = new Map((roles ?? []).map((r) => [r.user_id, r.role]));
    const merged = (profiles ?? []).map((p) => ({ ...p, role: roleMap.get(p.user_id) ?? "unknown" }));
    setUsers(merged);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const filtered = users.filter((u) => {
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (search && !(u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.user_id?.includes(search))) return false;
    return true;
  });

  if (loading) return <p className="text-muted-foreground py-8 text-center">Loading...</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="All roles" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="tenant">Tenant</SelectItem>
            <SelectItem value="landlord">Landlord</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No users found</TableCell></TableRow>
            ) : filtered.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                <TableCell>{u.phone || "—"}</TableCell>
                <TableCell>
                  <Badge variant={u.role === "admin" ? "default" : u.role === "landlord" ? "secondary" : "outline"}>
                    {u.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(u.created_at).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <p className="text-xs text-muted-foreground">Total: {filtered.length} users</p>
    </div>
  );
}

// ── Analytics ──
function Analytics() {
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, rejected: 0, tenants: 0, landlords: 0, admins: 0 });
  const [recentListings, setRecentListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [propsRes, rolesRes, recentRes] = await Promise.all([
        supabase.from("properties").select("status"),
        supabase.from("user_roles").select("role"),
        supabase.from("properties").select("title, city, status, created_at").order("created_at", { ascending: false }).limit(10),
      ]);
      const props = propsRes.data ?? [];
      const roles = rolesRes.data ?? [];
      setStats({
        total: props.length,
        approved: props.filter((p) => p.status === "approved").length,
        pending: props.filter((p) => p.status === "pending").length,
        rejected: props.filter((p) => p.status === "rejected").length,
        tenants: roles.filter((r) => r.role === "tenant").length,
        landlords: roles.filter((r) => r.role === "landlord").length,
        admins: roles.filter((r) => r.role === "admin").length,
      });
      setRecentListings(recentRes.data ?? []);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <p className="text-muted-foreground py-8 text-center">Loading...</p>;

  const statCards = [
    { label: "Total Listings", value: stats.total, icon: Home, color: "text-primary" },
    { label: "Verified", value: stats.approved, icon: CheckCircle, color: "text-primary" },
    { label: "Pending", value: stats.pending, icon: Clock, color: "text-muted-foreground" },
    { label: "Rejected", value: stats.rejected, icon: XCircle, color: "text-destructive" },
    { label: "Tenants", value: stats.tenants, icon: Users, color: "text-primary" },
    { label: "Landlords", value: stats.landlords, icon: Home, color: "text-secondary-foreground" },
    { label: "Admins", value: stats.admins, icon: ShieldCheck, color: "text-primary" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`h-8 w-8 ${s.color} shrink-0`} />
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Recent Listings</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentListings.map((l, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{l.title}</TableCell>
                  <TableCell>{l.city}</TableCell>
                  <TableCell>
                    <Badge variant={l.status === "approved" ? "default" : l.status === "rejected" ? "destructive" : "secondary"}>
                      {l.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{new Date(l.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main Admin Page ──
export default function AdminPanel() {
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && (!user || role !== "admin")) navigate("/");
  }, [user, role, authLoading]);

  if (authLoading) return <div className="container py-20 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2"><ShieldCheck className="h-6 w-6 text-primary" />Admin Panel</h1>
        <p className="text-muted-foreground text-sm">Manage listings, users, and platform analytics</p>
      </div>

      <Tabs defaultValue="verification" className="space-y-6">
        <TabsList>
          <TabsTrigger value="verification" className="gap-1"><Clock className="h-4 w-4" />Verification</TabsTrigger>
          <TabsTrigger value="users" className="gap-1"><Users className="h-4 w-4" />Users</TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1"><BarChart3 className="h-4 w-4" />Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="verification"><VerificationQueue /></TabsContent>
        <TabsContent value="users"><UserManagement /></TabsContent>
        <TabsContent value="analytics"><Analytics /></TabsContent>
      </Tabs>
    </div>
  );
}
