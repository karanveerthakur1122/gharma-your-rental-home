import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import {
  User, Mail, Phone, Calendar, Shield, Home, MessageSquare, Heart, Camera, Save, Loader2,
} from "lucide-react";

export default function Profile() {
  const { user, role } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState({ properties: 0, conversations: 0, favorites: 0, inquiries: 0 });

  useEffect(() => {
    if (!user) return;
    loadProfile();
    loadStats();
  }, [user]);

  const loadProfile = async () => {
    const { data } = await supabase.from("profiles").select("*").eq("user_id", user!.id).maybeSingle();
    if (data) {
      setFullName(data.full_name ?? "");
      setPhone(data.phone ?? "");
      setAvatarUrl(data.avatar_url);
    }
  };

  const loadStats = async () => {
    const [propsRes, convosRes, favsRes, inqsRes] = await Promise.all([
      supabase.from("properties").select("id", { count: "exact", head: true }).eq("landlord_id", user!.id),
      supabase.from("conversations").select("id", { count: "exact", head: true }).or(`tenant_id.eq.${user!.id},landlord_id.eq.${user!.id}`),
      supabase.from("favorites").select("id", { count: "exact", head: true }).eq("user_id", user!.id),
      supabase.from("inquiries").select("id", { count: "exact", head: true }).eq("tenant_id", user!.id),
    ]);
    setStats({
      properties: propsRes.count ?? 0,
      conversations: convosRes.count ?? 0,
      favorites: favsRes.count ?? 0,
      inquiries: inqsRes.count ?? 0,
    });
  };

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 2MB allowed", variant: "destructive" });
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadErr } = await supabase.storage.from("property-images").upload(path, file, { upsert: true });
    if (uploadErr) {
      toast({ title: "Upload failed", description: uploadErr.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("property-images").getPublicUrl(path);
    const url = `${urlData.publicUrl}?t=${Date.now()}`;

    await supabase.from("profiles").update({ avatar_url: url }).eq("user_id", user.id);
    setAvatarUrl(url);
    toast({ title: "Avatar updated!" });
    setUploading(false);
  };

  const save = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("profiles").update({ full_name: fullName, phone }).eq("user_id", user.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Profile updated!" });
    setLoading(false);
  };

  if (!user) return (
    <div className="container py-20 text-center">
      <User className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
      <p className="text-muted-foreground">Please log in to view your profile</p>
      <Button variant="outline" className="mt-4" asChild>
        <Link to="/login">Log In</Link>
      </Button>
    </div>
  );

  const initials = (fullName || user.email || "U")
    .split(/[\s@]/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const joinDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString("en-NP", { year: "numeric", month: "long", day: "numeric" })
    : "—";

  return (
    <div className="container py-8 max-w-2xl">
      {/* Profile Header Card */}
      <Card className="mb-6 overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20" />
        <CardContent className="relative px-6 pb-6">
          {/* Avatar */}
          <div className="relative -mt-14 mb-4 w-fit">
            <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
              <AvatarImage src={avatarUrl ?? undefined} alt={fullName || "User"} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">{initials}</AvatarFallback>
            </Avatar>
            <label
              className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors shadow-md"
              title="Change avatar"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              <input type="file" accept="image/*" className="sr-only" onChange={uploadAvatar} disabled={uploading} />
            </label>
          </div>

          {/* Name and role */}
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">{fullName || "Set your name"}</h1>
            <Badge variant={role === "admin" ? "default" : role === "landlord" ? "secondary" : "outline"} className="capitalize">
              {role === "admin" && <Shield className="h-3 w-3 mr-1" />}
              {role ?? "user"}
            </Badge>
          </div>

          {/* Contact info */}
          <div className="mt-3 space-y-1.5">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0" /> {user.email}
            </p>
            {phone && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0" /> {phone}
              </p>
            )}
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4 shrink-0" /> Joined {joinDate}
            </p>
          </div>

          <Separator className="my-5" />

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {role === "landlord" && (
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <Home className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="text-xl font-bold">{stats.properties}</p>
                <p className="text-xs text-muted-foreground">Properties</p>
              </div>
            )}
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <MessageSquare className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-xl font-bold">{stats.conversations}</p>
              <p className="text-xs text-muted-foreground">Conversations</p>
            </div>
            {role === "tenant" && (
              <>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <Heart className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <p className="text-xl font-bold">{stats.favorites}</p>
                  <p className="text-xs text-muted-foreground">Favorites</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <Mail className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <p className="text-xl font-bold">{stats.inquiries}</p>
                  <p className="text-xs text-muted-foreground">Inquiries Sent</p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5" /> Edit Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user.email ?? ""} disabled className="bg-muted/50" />
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your full name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+977 98XXXXXXXX" />
          </div>
          <Button onClick={save} disabled={loading} className="w-full">
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : <><Save className="h-4 w-4 mr-2" />Save Changes</>}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
