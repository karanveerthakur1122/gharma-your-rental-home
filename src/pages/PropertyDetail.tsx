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
import { Separator } from "@/components/ui/separator";
import {
  MapPin, Wifi, Car, PawPrint, Droplets, Bath, Heart, ArrowLeft, Shield, Calendar, Sofa, Home, IndianRupee, ChevronLeft, ChevronRight,
} from "lucide-react";
import { ChatDialog } from "@/components/ChatDialog";

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
  const [activeImg, setActiveImg] = useState(0);

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
      toast({ title: "Removed from favorites" });
    } else {
      await supabase.from("favorites").insert({ property_id: id!, user_id: user.id });
      setIsFavorited(true);
      toast({ title: "Added to favorites" });
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
    else { toast({ title: "Inquiry sent successfully!" }); setInquiryMsg(""); setMoveIn(""); }
    setSubmitting(false);
  };

  if (loading) return (
    <div className="container py-20 text-center">
      <div className="animate-pulse space-y-4 max-w-4xl mx-auto">
        <div className="h-64 bg-muted rounded-lg" />
        <div className="h-8 bg-muted rounded w-1/2" />
        <div className="h-4 bg-muted rounded w-1/3" />
      </div>
    </div>
  );

  if (!property) return (
    <div className="container py-20 text-center">
      <Home className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
      <h2 className="font-semibold text-lg">Property not found</h2>
      <p className="text-muted-foreground text-sm mt-1">This listing may have been removed.</p>
      <Button variant="outline" className="mt-4" asChild>
        <Link to="/search">Back to Search</Link>
      </Button>
    </div>
  );

  const amenities = [
    { icon: Sofa, label: "Furnished", active: property.furnished, detail: property.furnished ? "Yes" : "No" },
    { icon: Wifi, label: "Internet", active: property.internet, detail: property.internet ? "Available" : "Not available" },
    { icon: Car, label: "Parking", active: property.parking, detail: property.parking ? "Available" : "Not available" },
    { icon: PawPrint, label: "Pets", active: property.pets_allowed, detail: property.pets_allowed ? "Allowed" : "Not allowed" },
    { icon: Droplets, label: "Water", active: property.water_available, detail: property.water_available ? "24/7" : "Limited" },
    { icon: Bath, label: "Bathroom", active: true, detail: property.bathroom_type === "attached" ? "Attached" : "Shared" },
  ];

  return (
    <div className="container py-6 max-w-5xl">
      {/* Back link */}
      <Link
        to="/search"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Back to search
      </Link>

      {/* Image gallery */}
      <div className="relative rounded-xl overflow-hidden mb-6 bg-muted">
        {images.length > 0 ? (
          <>
            <img
              src={images[activeImg].image_url}
              alt={`${property.title} - Photo ${activeImg + 1}`}
              className="w-full aspect-[16/9] md:aspect-[2/1] object-cover"
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImg((prev) => (prev - 1 + images.length) % images.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition shadow-md"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setActiveImg((prev) => (prev + 1) % images.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition shadow-md"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_: any, i: number) => (
                    <button
                      key={i}
                      onClick={() => setActiveImg(i)}
                      className={`h-2 rounded-full transition-all ${i === activeImg ? "w-6 bg-background" : "w-2 bg-background/60"}`}
                      aria-label={`Go to image ${i + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="aspect-[16/9] md:aspect-[2/1] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Home className="h-12 w-12 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No photos available</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title + meta */}
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">{property.title}</h1>
                <p className="text-muted-foreground flex items-center gap-1.5 mt-2 text-sm">
                  <MapPin className="h-4 w-4 shrink-0" />
                  {property.address ? `${property.address}, ` : ""}{property.city}{property.area ? `, ${property.area}` : ""}
                </p>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={toggleFavorite}
                className="shrink-0"
                aria-label={isFavorited ? "Remove from favorites" : "Save to favorites"}
              >
                <Heart className={`h-5 w-5 ${isFavorited ? "fill-destructive text-destructive" : ""}`} />
              </Button>
            </div>
            <div className="flex gap-2 mt-3 flex-wrap">
              <Badge className="bg-primary/10 text-primary border-primary/20">{property.room_type.toUpperCase()}</Badge>
              {property.status === "approved" && (
                <Badge variant="outline" className="text-accent-foreground border-accent bg-accent">
                  <Shield className="h-3 w-3 mr-1" /> Verified
                </Badge>
              )}
              {property.available_from && (
                <Badge variant="outline">
                  <Calendar className="h-3 w-3 mr-1" /> Available {new Date(property.available_from).toLocaleDateString()}
                </Badge>
              )}
            </div>
          </div>

          <Separator />

          {/* Description */}
          {property.description && (
            <section aria-label="Description">
              <h2 className="font-semibold text-lg mb-2">About this property</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{property.description}</p>
            </section>
          )}

          {/* Amenities grid */}
          <section aria-label="Amenities">
            <h2 className="font-semibold text-lg mb-3">Amenities & Features</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {amenities.map((a) => (
                <div
                  key={a.label}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    a.active
                      ? "bg-accent/50 border-accent text-accent-foreground"
                      : "bg-muted/30 border-border text-muted-foreground"
                  }`}
                >
                  <a.icon className="h-5 w-5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{a.label}</p>
                    <p className="text-xs opacity-75">{a.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* House rules */}
          {property.house_rules && (
            <section aria-label="House rules">
              <h2 className="font-semibold text-lg mb-2">House Rules</h2>
              <p className="text-muted-foreground whitespace-pre-wrap text-sm leading-relaxed">{property.house_rules}</p>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Price card */}
          <Card className="border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-primary">NPR {Number(property.price).toLocaleString()}</span>
                <span className="text-sm font-normal text-muted-foreground">/month</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {property.deposit > 0 && (
                <div className="flex justify-between py-1.5">
                  <span className="text-muted-foreground">Security Deposit</span>
                  <span className="font-medium">NPR {Number(property.deposit).toLocaleString()}</span>
                </div>
              )}
              {property.maintenance_fee > 0 && (
                <div className="flex justify-between py-1.5">
                  <span className="text-muted-foreground">Maintenance Fee</span>
                  <span className="font-medium">NPR {Number(property.maintenance_fee).toLocaleString()}</span>
                </div>
              )}
              {property.available_from && (
                <div className="flex justify-between py-1.5">
                  <span className="text-muted-foreground">Available From</span>
                  <span className="font-medium">{new Date(property.available_from).toLocaleDateString()}</span>
                </div>
              )}
              <Separator className="my-1" />
              <Button
                variant={isFavorited ? "secondary" : "outline"}
                className="w-full"
                onClick={toggleFavorite}
              >
                <Heart className={`h-4 w-4 mr-2 ${isFavorited ? "fill-destructive text-destructive" : ""}`} />
                {isFavorited ? "Saved" : "Save to Favorites"}
              </Button>
              {user && property.landlord_id && (
                <ChatDialog
                  propertyId={property.id}
                  landlordId={property.landlord_id}
                  propertyTitle={property.title}
                />
              )}
            </CardContent>
          </Card>

          {/* Inquiry form */}
          {role === "tenant" && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Interested? Send an Inquiry</CardTitle>
                <p className="text-xs text-muted-foreground">The landlord will receive your message directly.</p>
              </CardHeader>
              <CardContent>
                <form onSubmit={submitInquiry} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="inquiry-msg" className="text-xs font-medium">Your Message</Label>
                    <Textarea
                      id="inquiry-msg"
                      value={inquiryMsg}
                      onChange={(e) => setInquiryMsg(e.target.value)}
                      placeholder="Hi, I'm interested in this property. Is it still available?"
                      required
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="move-in" className="text-xs font-medium">Preferred Move-in Date</Label>
                    <Input
                      id="move-in"
                      type="date"
                      value={moveIn}
                      onChange={(e) => setMoveIn(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? "Sending..." : "Send Inquiry"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {!user && (
            <Card className="bg-muted/50">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground mb-3">Log in to save favorites and send inquiries</p>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/login">Log In</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
