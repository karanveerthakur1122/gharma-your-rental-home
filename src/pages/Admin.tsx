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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
  CheckCircle, XCircle, Clock, Users, Home, ShieldCheck, BarChart3, Eye,
  Search, RefreshCw, MapPin, List,
} from "lucide-react";

// ═══════════════════════════════════════════════
// Verification Queue
// ═══════════════════════════════════════════════
function VerificationQueue() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("properties")
      .select("*, property_images(image_url, display_order)")
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    setProperties(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: "approved" | "rejected") => {
    const { error } = await supabase.from("properties").update({ status: status as any }).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: status === "approved" ? "Property approved ✓" : "Property rejected" });
    setSelected(null);
    setRejectReason("");
    load();
  };

  if (loading) return <div className="py-8 text-center text-muted-foreground">Loading pending listings...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Pending Verification ({properties.length})</h2>
        <Button variant="ghost" size="sm" onClick={load}><RefreshCw className="h-4 w-4 mr-1" />Refresh</Button>
      </div>

      {properties.length === 0 ? (
        <Card className="p-10 text-center">
          <CheckCircle className="h-10 w-10 mx-auto mb-3 text-primary opacity-60" />
          <p className="font-medium">All caught up!</p>
          <p className="text-sm text-muted-foreground">No pending listings to review.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {properties.map((p) => {
            const thumb = p.property_images?.sort((a: any, b: any) => a.display_order - b.display_order)[0]?.image_url;
            return (
              <Card key={p.id} className="overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  <div className="sm:w-44 h-28 sm:h-auto bg-muted shrink-0">
                    {thumb ? <img src={thumb} alt="" className="w-full h-full object-cover" /> : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">No image</div>
                    )}
                  </div>
                  <CardContent className="p-4 flex-1 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{p.title}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />{p.city}{p.area ? `, ${p.area}` : ""} · {p.room_type.toUpperCase()}
                      </p>
                      <p className="text-sm font-medium text-primary mt-1">NPR {Number(p.price).toLocaleString()}/mo</p>
                      <p className="text-xs text-muted-foreground mt-1">Submitted {new Date(p.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" variant="outline" onClick={() => setSelected(p)}>
                        <Eye className="h-4 w-4 mr-1" />Review
                      </Button>
                      <Button size="sm" onClick={() => updateStatus(p.id, "approved")}>
                        <CheckCircle className="h-4 w-4 mr-1" />Approve
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => { setSelected(p); }}>
                        <XCircle className="h-4 w-4 mr-1" />Reject
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
      <Dialog open={!!selected} onOpenChange={(o) => { if (!o) { setSelected(null); setRejectReason(""); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.title}</DialogTitle>
                <DialogDescription>Review property details before approving or rejecting</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {selected.property_images?.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {selected.property_images.sort((a: any, b: any) => a.display_order - b.display_order).map((img: any, i: number) => (
                      <img key={i} src={img.image_url} alt="" className="w-full aspect-video object-cover rounded-md" />
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div><span className="text-muted-foreground">City:</span> {selected.city}</div>
                  <div><span className="text-muted-foreground">Area:</span> {selected.area || "—"}</div>
                  <div><span className="text-muted-foreground">Address:</span> {selected.address || "—"}</div>
                  <div><span className="text-muted-foreground">Room Type:</span> {selected.room_type.toUpperCase()}</div>
                  <div><span className="text-muted-foreground">Rent:</span> NPR {Number(selected.price).toLocaleString()}</div>
                  <div><span className="text-muted-foreground">Deposit:</span> NPR {Number(selected.deposit).toLocaleString()}</div>
                  <div><span className="text-muted-foreground">Maintenance:</span> NPR {Number(selected.maintenance_fee).toLocaleString()}</div>
                  <div><span className="text-muted-foreground">Furnished:</span> {selected.furnished ? "Yes" : "No"}</div>
                  <div><span className="text-muted-foreground">Parking:</span> {selected.parking ? "Yes" : "No"}</div>
                  <div><span className="text-muted-foreground">Internet:</span> {selected.internet ? "Yes" : "No"}</div>
                  <div><span className="text-muted-foreground">Pets:</span> {selected.pets_allowed ? "Yes" : "No"}</div>
                  <div><span className="text-muted-foreground">Water:</span> {selected.water_available ? "Yes" : "No"}</div>
                </div>
                {selected.description && (
                  <div>
                    <p className="text-sm font-medium mb-1">Description</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selected.description}</p>
                  </div>
                )}
                {selected.house_rules && (
                  <div>
                    <p className="text-sm font-medium mb-1">House Rules</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selected.house_rules}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium mb-1">Rejection reason (optional)</p>
                  <Textarea placeholder="Explain why this listing is being rejected..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={2} />
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
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

// ═══════════════════════════════════════════════
// All Listings Management
// ═══════════════════════════════════════════════
function AllListings() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    let query = supabase.from("properties").select("id, title, city, area, price, room_type, status, is_vacant, created_at").order("created_at", { ascending: false });
    if (statusFilter !== "all") query = query.eq("status", statusFilter as any);
    const { data } = await query;
    setProperties(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [statusFilter]);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("properties").update({ status: status as any }).eq("id", id);
    toast({ title: `Status changed to ${status}` });
    load();
  };

  const filtered = search
    ? properties.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()) || p.city.toLowerCase().includes(search.toLowerCase()))
    : properties;

  const statusBadge = (status: string) => {
    if (status === "approved") return <Badge>Approved</Badge>;
    if (status === "rejected") return <Badge variant="destructive">Rejected</Badge>;
    return <Badge variant="secondary">Pending</Badge>;
  };

  if (loading) return <div className="py-8 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search listings..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" size="icon" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Vacancy</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No listings found</TableCell></TableRow>
            ) : filtered.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium max-w-[200px] truncate">{p.title}</TableCell>
                <TableCell>{p.city}</TableCell>
                <TableCell>{p.room_type.toUpperCase()}</TableCell>
                <TableCell>NPR {Number(p.price).toLocaleString()}</TableCell>
                <TableCell>{statusBadge(p.status)}</TableCell>
                <TableCell><Badge variant={p.is_vacant ? "outline" : "secondary"}>{p.is_vacant ? "Available" : "Occupied"}</Badge></TableCell>
                <TableCell>
                  <Select
                    value={p.status}
                    onValueChange={(v) => updateStatus(p.id, v)}
                  >
                    <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <p className="text-xs text-muted-foreground">{filtered.length} listings</p>
    </div>
  );
}

// ═══════════════════════════════════════════════
// User Management with Role Changing
// ═══════════════════════════════════════════════
function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [changingRole, setChangingRole] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data: profiles } = await supabase.from("profiles").select("*");
    const { data: roles } = await supabase.from("user_roles").select("*");
    const roleMap = new Map((roles ?? []).map((r: any) => [r.user_id, { role: r.role, roleId: r.id }]));
    const merged = (profiles ?? []).map((p: any) => ({
      ...p,
      role: roleMap.get(p.user_id)?.role ?? "none",
      roleId: roleMap.get(p.user_id)?.roleId ?? null,
    }));
    setUsers(merged);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const changeRole = async (userId: string, roleId: string | null, newRole: string) => {
    setChangingRole(userId);
    if (newRole === "none") {
      if (roleId) await supabase.from("user_roles").delete().eq("id", roleId);
    } else if (roleId) {
      await supabase.from("user_roles").update({ role: newRole as any }).eq("id", roleId);
    } else {
      await supabase.from("user_roles").insert({ user_id: userId, role: newRole as any });
    }
    toast({ title: `Role updated to ${newRole}` });
    await load();
    setChangingRole(null);
  };

  const filtered = users.filter((u) => {
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (search && !(u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.user_id?.includes(search))) return false;
    return true;
  });

  if (loading) return <div className="py-8 text-center text-muted-foreground">Loading users...</div>;

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
            <SelectItem value="none">No Role</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" size="icon" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Current Role</TableHead>
              <TableHead>Change Role</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No users found</TableCell></TableRow>
            ) : filtered.map((u) => {
              const isSelf = u.user_id === currentUser?.id;
              return (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">
                    {u.full_name || "—"}
                    {isSelf && <Badge variant="outline" className="ml-2 text-xs">You</Badge>}
                  </TableCell>
                  <TableCell>{u.phone || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === "admin" ? "default" : u.role === "landlord" ? "secondary" : u.role === "tenant" ? "outline" : "destructive"}>
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {isSelf ? (
                      <span className="text-xs text-muted-foreground">Can't change own role</span>
                    ) : (
                      <Select
                        value={u.role}
                        onValueChange={(v) => changeRole(u.user_id, u.roleId, v)}
                        disabled={changingRole === u.user_id}
                      >
                        <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tenant">Tenant</SelectItem>
                          <SelectItem value="landlord">Landlord</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(u.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
      <p className="text-xs text-muted-foreground">Total: {filtered.length} users</p>
    </div>
  );
}

// ═══════════════════════════════════════════════
// Analytics Dashboard
// ═══════════════════════════════════════════════
function Analytics() {
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, rejected: 0, tenants: 0, landlords: 0, admins: 0, totalInquiries: 0 });
  const [recentListings, setRecentListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [propsRes, rolesRes, recentRes, inquiriesRes] = await Promise.all([
        supabase.from("properties").select("status"),
        supabase.from("user_roles").select("role"),
        supabase.from("properties").select("title, city, status, room_type, price, created_at").order("created_at", { ascending: false }).limit(15),
        supabase.from("inquiries").select("id"),
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
        totalInquiries: inquiriesRes.data?.length ?? 0,
      });
      setRecentListings(recentRes.data ?? []);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="py-8 text-center text-muted-foreground">Loading analytics...</div>;

  const statCards = [
    { label: "Total Listings", value: stats.total, icon: Home },
    { label: "Verified", value: stats.approved, icon: CheckCircle },
    { label: "Pending", value: stats.pending, icon: Clock },
    { label: "Rejected", value: stats.rejected, icon: XCircle },
    { label: "Tenants", value: stats.tenants, icon: Users },
    { label: "Landlords", value: stats.landlords, icon: Home },
    { label: "Admins", value: stats.admins, icon: ShieldCheck },
    { label: "Inquiries", value: stats.totalInquiries, icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map((s) => (
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

      <Card>
        <CardHeader><CardTitle className="text-lg">Recent Listings</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentListings.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No listings yet</TableCell></TableRow>
              ) : recentListings.map((l, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{l.title}</TableCell>
                  <TableCell>{l.city}</TableCell>
                  <TableCell>{l.room_type.toUpperCase()}</TableCell>
                  <TableCell>NPR {Number(l.price).toLocaleString()}</TableCell>
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

// ═══════════════════════════════════════════════
// Main Admin Panel
// ═══════════════════════════════════════════════
export default function AdminPanel() {
  const { user, role, loading: authLoading, roleLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !roleLoading && user && role !== "admin") navigate("/");
    if (!authLoading && !user) navigate("/login");
  }, [user, role, authLoading, roleLoading]);

  if (authLoading || roleLoading) return <div className="container py-20 text-center text-muted-foreground">Loading...</div>;
  if (!user || role !== "admin") return null;

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" />Admin Panel
        </h1>
        <p className="text-muted-foreground text-sm">Manage listings, users, and platform analytics</p>
      </div>

      <Tabs defaultValue="verification" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="verification" className="gap-1"><Clock className="h-4 w-4 hidden sm:inline" />Verification</TabsTrigger>
          <TabsTrigger value="listings" className="gap-1"><List className="h-4 w-4 hidden sm:inline" />All Listings</TabsTrigger>
          <TabsTrigger value="users" className="gap-1"><Users className="h-4 w-4 hidden sm:inline" />Users</TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1"><BarChart3 className="h-4 w-4 hidden sm:inline" />Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="verification"><VerificationQueue /></TabsContent>
        <TabsContent value="listings"><AllListings /></TabsContent>
        <TabsContent value="users"><UserManagement /></TabsContent>
        <TabsContent value="analytics"><Analytics /></TabsContent>
      </Tabs>
    </div>
  );
}
