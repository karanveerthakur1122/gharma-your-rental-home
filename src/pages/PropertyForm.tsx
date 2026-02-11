import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, X, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

type RoomType = "single" | "1bhk" | "2bhk" | "flat";

interface FormData {
  title: string;
  description: string;
  address: string;
  city: string;
  area: string;
  price: string;
  deposit: string;
  maintenance_fee: string;
  room_type: RoomType;
  furnished: boolean;
  parking: boolean;
  internet: boolean;
  pets_allowed: boolean;
  water_available: boolean;
  bathroom_type: string;
  house_rules: string;
  available_from: string;
  latitude: string;
  longitude: string;
}

const defaultForm: FormData = {
  title: "", description: "", address: "", city: "", area: "", price: "", deposit: "", maintenance_fee: "",
  room_type: "single", furnished: false, parking: false, internet: false, pets_allowed: false, water_available: true,
  bathroom_type: "shared", house_rules: "", available_from: "", latitude: "", longitude: "",
};

export default function PropertyForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormData>(defaultForm);
  const [existingImages, setExistingImages] = useState<{ id: string; image_url: string; display_order: number }[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingData, setLoadingData] = useState(isEdit);

  useEffect(() => {
    if (!authLoading && (!user || role !== "landlord")) navigate("/");
  }, [user, role, authLoading]);

  useEffect(() => {
    if (isEdit && user) fetchProperty();
  }, [id, user]);

  const fetchProperty = async () => {
    const { data } = await supabase
      .from("properties")
      .select("*, property_images(id, image_url, display_order)")
      .eq("id", id!)
      .eq("landlord_id", user!.id)
      .maybeSingle();
    if (!data) { toast({ title: "Property not found", variant: "destructive" }); navigate("/dashboard"); return; }
    setForm({
      title: data.title, description: data.description ?? "", address: data.address ?? "",
      city: data.city, area: data.area ?? "", price: String(data.price), deposit: String(data.deposit ?? ""),
      maintenance_fee: String(data.maintenance_fee ?? ""), room_type: data.room_type as RoomType,
      furnished: data.furnished ?? false, parking: data.parking ?? false, internet: data.internet ?? false,
      pets_allowed: data.pets_allowed ?? false, water_available: data.water_available ?? true,
      bathroom_type: data.bathroom_type ?? "shared", house_rules: data.house_rules ?? "",
      available_from: data.available_from ?? "", latitude: data.latitude ? String(data.latitude) : "",
      longitude: data.longitude ? String(data.longitude) : "",
    });
    setExistingImages(data.property_images?.sort((a: any, b: any) => a.display_order - b.display_order) ?? []);
    setLoadingData(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length + newFiles.length + existingImages.length > 10) {
      toast({ title: "Maximum 10 images allowed", variant: "destructive" }); return;
    }
    setNewFiles((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => setPreviews((prev) => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const removeNewFile = (index: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = async (imgId: string) => {
    await supabase.from("property_images").delete().eq("id", imgId);
    setExistingImages((prev) => prev.filter((img) => img.id !== imgId));
  };

  const uploadImages = async (propertyId: string, startOrder: number) => {
    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i];
      const ext = file.name.split(".").pop();
      const path = `${user!.id}/${propertyId}/${Date.now()}_${i}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("property-images").upload(path, file);
      if (uploadError) { console.error(uploadError); continue; }
      const { data: urlData } = supabase.storage.from("property-images").getPublicUrl(path);
      await supabase.from("property_images").insert({
        property_id: propertyId, image_url: urlData.publicUrl, display_order: startOrder + i,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.city || !form.price) {
      toast({ title: "Please fill required fields", variant: "destructive" }); return;
    }
    setSubmitting(true);

    const payload = {
      title: form.title, description: form.description || null, address: form.address || null,
      city: form.city, area: form.area || null, price: Number(form.price), deposit: Number(form.deposit) || 0,
      maintenance_fee: Number(form.maintenance_fee) || 0, room_type: form.room_type as any,
      furnished: form.furnished, parking: form.parking, internet: form.internet,
      pets_allowed: form.pets_allowed, water_available: form.water_available,
      bathroom_type: form.bathroom_type, house_rules: form.house_rules || null,
      available_from: form.available_from || null,
      latitude: form.latitude ? Number(form.latitude) : null,
      longitude: form.longitude ? Number(form.longitude) : null,
    };

    if (isEdit) {
      const { error } = await supabase.from("properties").update(payload).eq("id", id!);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); setSubmitting(false); return; }
      if (newFiles.length > 0) await uploadImages(id!, existingImages.length);
      toast({ title: "Property updated!" });
    } else {
      const { data, error } = await supabase.from("properties").insert({ ...payload, landlord_id: user!.id }).select("id").single();
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); setSubmitting(false); return; }
      if (newFiles.length > 0) await uploadImages(data.id, 0);
      toast({ title: "Property created! It will be visible after admin verification." });
    }
    setSubmitting(false);
    navigate("/dashboard");
  };

  const update = (field: keyof FormData, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

  if (authLoading || loadingData) return <div className="container py-20 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="container py-6 max-w-3xl">
      <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      <h1 className="text-2xl font-bold mb-6">{isEdit ? "Edit Property" : "Add New Property"}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Basic Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="e.g. Spacious 2BHK in Lalitpur" required />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Describe the property..." rows={4} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>City *</Label>
                <Input value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="e.g. Kathmandu" required />
              </div>
              <div className="space-y-1">
                <Label>Area</Label>
                <Input value={form.area} onChange={(e) => update("area", e.target.value)} placeholder="e.g. Baneshwor" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Address</Label>
              <Input value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="Street address" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Room Type *</Label>
                <Select value={form.room_type} onValueChange={(v) => update("room_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single Room</SelectItem>
                    <SelectItem value="1bhk">1 BHK</SelectItem>
                    <SelectItem value="2bhk">2 BHK</SelectItem>
                    <SelectItem value="flat">Flat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Bathroom Type</Label>
                <Select value={form.bathroom_type} onValueChange={(v) => update("bathroom_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shared">Shared</SelectItem>
                    <SelectItem value="attached">Attached</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Pricing</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label>Rent (NPR/mo) *</Label>
              <Input type="number" value={form.price} onChange={(e) => update("price", e.target.value)} placeholder="10000" required min={0} />
            </div>
            <div className="space-y-1">
              <Label>Deposit (NPR)</Label>
              <Input type="number" value={form.deposit} onChange={(e) => update("deposit", e.target.value)} placeholder="0" min={0} />
            </div>
            <div className="space-y-1">
              <Label>Maintenance (NPR/mo)</Label>
              <Input type="number" value={form.maintenance_fee} onChange={(e) => update("maintenance_fee", e.target.value)} placeholder="0" min={0} />
            </div>
          </CardContent>
        </Card>

        {/* Amenities */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Amenities</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {([
                ["furnished", "Furnished"],
                ["parking", "Parking"],
                ["internet", "Internet/WiFi"],
                ["pets_allowed", "Pets Allowed"],
                ["water_available", "Water Available"],
              ] as [keyof FormData, string][]).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={form[key] as boolean} onCheckedChange={(v) => update(key, !!v)} />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Availability & Rules */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Availability & Rules</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Available From</Label>
              <Input type="date" value={form.available_from} onChange={(e) => update("available_from", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>House Rules</Label>
              <Textarea value={form.house_rules} onChange={(e) => update("house_rules", e.target.value)} placeholder="e.g. No smoking, No loud music after 10pm..." rows={3} />
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Location Coordinates (Optional)</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Latitude</Label>
              <Input type="number" step="any" value={form.latitude} onChange={(e) => update("latitude", e.target.value)} placeholder="27.7172" />
            </div>
            <div className="space-y-1">
              <Label>Longitude</Label>
              <Input type="number" step="any" value={form.longitude} onChange={(e) => update("longitude", e.target.value)} placeholder="85.3240" />
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Property Images</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {existingImages.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Current images</p>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {existingImages.map((img) => (
                    <div key={img.id} className="relative group">
                      <img src={img.image_url} alt="" className="w-full aspect-square object-cover rounded-md" />
                      <button type="button" onClick={() => removeExistingImage(img.id)}
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {previews.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">New images</p>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {previews.map((src, i) => (
                    <div key={i} className="relative group">
                      <img src={src} alt="" className="w-full aspect-square object-cover rounded-md" />
                      <button type="button" onClick={() => removeNewFile(i)}
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <label className="flex flex-col items-center gap-2 p-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Click to upload images (max 10)</span>
              <input type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
            </label>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={submitting} className="flex-1">
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEdit ? "Save Changes" : "Submit Property"}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate("/dashboard")}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
