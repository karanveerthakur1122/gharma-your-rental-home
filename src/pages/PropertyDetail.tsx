import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MapPin, Wifi, Car, PawPrint, Droplets, Bath, Heart, ArrowLeft, Shield, Calendar,
} from "lucide-react";

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, role } = useAuth();
  const [property, setProperty] = useState<any>(null);
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [inquiryMsg, setInquiryMsg] = useState("");
  const [moveIn, setMoveIn] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchProperty();
    if (user) checkFavorite();
  }, [id, user]);

  const fetchProperty = async () => {
    const { data } = await supabase
      .from("properties")
      .select("*, property_images(id, image_url, display_order)")
      .eq("id", id!)
      .maybeSingle();
    if (data) {
      setProperty(data);
      setImages(data.property_images?.sort((a: any, b: any) => a.display_order - b.display_order) ?? []);
    }
    setLoading(false);
  };

  const checkFavorite = async () => {
    const { data } = await supabase
      .from("favorites")
      .select("id")
      .eq("property_id", id!)
      .eq("user_id", user!.id)
      .maybeSingle();
    setIsFavorited(!!data);
  };

  const toggleFavorite = async () => {
    if (!user) { toast({ title: "Please log in to save favorites", variant: "destructive" }); return; }
    if (isFavorited) {
      await supabase.from("favorites").delete().eq("property_id", id!).eq("user_id", user.id);
      setIsFavorited(false);
    } else {
      await supabase.from("favorites").insert({ property_id: id!, user_id: user.id });
      setIsFavorited(true);
    }
  };

  const submitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast({ title: "Please log in to submit an inquiry", variant: "destructive" }); return; }
    setSubmitting(true);
    const { error } = await supabase.from("inquiries").insert({
      property_id: id!,
      tenant_id: user.id,
      message: inquiryMsg,
      preferred_move_in: moveIn || null,
    });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Inquiry sent!" }); setInquiryMsg(""); setMoveIn(""); }
    setSubmitting(false);
  };

  if (loading) return <div className="container py-20 text-center text-muted-foreground">Loading...</div>;
  if (!property) return <div className="container py-20 text-center text-muted-foreground">Property not found</div>;

  return (
    <div className="container py-6 max-w-4xl">
      <Link to="/search" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to search
      </Link>

      {/* Image gallery */}
      {images.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 rounded-lg overflow-hidden mb-6">
          <img src={images[0].image_url} alt={property.title} className="w-full aspect-video object-cover" />
          {images.length > 1 && (
            <div className="grid grid-cols-2 gap-2">
              {images.slice(1, 5).map((img: any) => (
                <img key={img.id} src={img.image_url} alt="" className="w-full aspect-video object-cover" />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-muted rounded-lg aspect-video flex items-center justify-center mb-6 text-muted-foreground">No images</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="md:col-span-2 space-y-6">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">{property.title}</h1>
                <p className="text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="h-4 w-4" />
                  {property.address ? `${property.address}, ` : ""}{property.city}{property.area ? `, ${property.area}` : ""}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={toggleFavorite}>
                <Heart className={`h-5 w-5 ${isFavorited ? "fill-destructive text-destructive" : ""}`} />
              </Button>
            </div>
            <div className="flex gap-2 mt-3">
              <Badge>{property.room_type.toUpperCase()}</Badge>
              {property.status === "approved" && (
                <Badge variant="outline" className="text-success border-success">
                  <Shield className="h-3 w-3 mr-1" /> Verified
                </Badge>
              )}
            </div>
          </div>

          {property.description && (
            <div>
              <h2 className="font-semibold text-lg mb-2">Description</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">{property.description}</p>
            </div>
          )}

          <div>
            <h2 className="font-semibold text-lg mb-3">Amenities</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { icon: Wifi, label: "Internet", active: property.internet },
                { icon: Car, label: "Parking", active: property.parking },
                { icon: PawPrint, label: "Pets Allowed", active: property.pets_allowed },
                { icon: Droplets, label: "Water Available", active: property.water_available },
                { icon: Bath, label: `Bathroom: ${property.bathroom_type}`, active: true },
                { icon: Calendar, label: property.furnished ? "Furnished" : "Unfurnished", active: true },
              ].map((a) => (
                <div key={a.label} className={`flex items-center gap-2 text-sm p-2 rounded border ${a.active ? "" : "opacity-40"}`}>
                  <a.icon className="h-4 w-4" />
                  {a.label}
                </div>
              ))}
            </div>
          </div>

          {property.house_rules && (
            <div>
              <h2 className="font-semibold text-lg mb-2">House Rules</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">{property.house_rules}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">
                NPR {Number(property.price).toLocaleString()}<span className="text-sm font-normal text-muted-foreground">/mo</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {property.deposit > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Deposit</span><span>NPR {Number(property.deposit).toLocaleString()}</span></div>}
              {property.maintenance_fee > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Maintenance</span><span>NPR {Number(property.maintenance_fee).toLocaleString()}</span></div>}
              {property.available_from && <div className="flex justify-between"><span className="text-muted-foreground">Available from</span><span>{new Date(property.available_from).toLocaleDateString()}</span></div>}
            </CardContent>
          </Card>

          {/* Inquiry form */}
          {role === "tenant" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Send Inquiry</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={submitInquiry} className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Message</Label>
                    <Textarea value={inquiryMsg} onChange={(e) => setInquiryMsg(e.target.value)} placeholder="I'm interested in this property..." required rows={3} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Preferred move-in date</Label>
                    <Input type="date" value={moveIn} onChange={(e) => setMoveIn(e.target.value)} />
                  </div>
                  <Button type="submit" className="w-full" size="sm" disabled={submitting}>
                    {submitting ? "Sending..." : "Send Inquiry"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
