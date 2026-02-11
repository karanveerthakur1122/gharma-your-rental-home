import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { MapPin, Wifi, Car, PawPrint, Search as SearchIcon, LayoutGrid, Map, Sofa, Heart, Droplets, Bath } from "lucide-react";
import { lazy, Suspense } from "react";
import { useAuth } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";

const PropertyMap = lazy(() => import("@/components/PropertyMap"));

interface Property {
  id: string;
  title: string;
  city: string;
  area: string | null;
  price: number;
  deposit: number | null;
  room_type: string;
  furnished: boolean;
  parking: boolean;
  internet: boolean;
  pets_allowed: boolean;
  water_available: boolean;
  bathroom_type: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string;
  is_vacant: boolean;
  created_at: string;
  available_from: string | null;
  description: string | null;
  property_images: { image_url: string; display_order: number }[];
}

export default function SearchPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [cityFilter, setCityFilter] = useState("");
  const [roomFilter, setRoomFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    fetchProperties();
  }, [cityFilter, roomFilter, sortBy]);

  const fetchProperties = async () => {
    setLoading(true);
    let query = supabase
      .from("properties")
      .select("*, property_images(image_url, display_order)")
      .eq("status", "approved")
      .eq("is_vacant", true);

    if (cityFilter) query = query.ilike("city", `%${cityFilter}%`);
    if (roomFilter && roomFilter !== "all") query = query.eq("room_type", roomFilter as any);

    if (sortBy === "price_asc") query = query.order("price", { ascending: true });
    else if (sortBy === "price_desc") query = query.order("price", { ascending: false });
    else query = query.order("created_at", { ascending: false });

    const { data } = await query;
    setProperties((data as Property[]) ?? []);
    setLoading(false);
  };

  const filtered = searchQuery
    ? properties.filter((p) =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.area?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      )
    : properties;

  return (
    <div className="container py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Find Your Rental</h1>
        <p className="text-sm text-muted-foreground mt-1">{filtered.length} properties available across Nepal</p>
      </div>

      {/* Search bar + filters */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, city, or area..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search properties"
            />
          </div>
          <div className="flex border rounded-md" role="group" aria-label="View mode">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("grid")}
              aria-label="Grid view"
              aria-pressed={viewMode === "grid"}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "map" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("map")}
              aria-label="Map view"
              aria-pressed={viewMode === "map"}
            >
              <Map className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="Filter by city"
            className="w-36"
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            aria-label="Filter by city"
          />
          <Select value={roomFilter} onValueChange={setRoomFilter}>
            <SelectTrigger className="w-36" aria-label="Room type filter">
              <SelectValue placeholder="Room type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="single">Single</SelectItem>
              <SelectItem value="1bhk">1 BHK</SelectItem>
              <SelectItem value="2bhk">2 BHK</SelectItem>
              <SelectItem value="flat">Flat</SelectItem>
              <SelectItem value="hostel">Hostel</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40" aria-label="Sort by">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="price_asc">Price: Low → High</SelectItem>
              <SelectItem value="price_desc">Price: High → Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-lg border bg-card animate-pulse">
              <div className="aspect-[4/3] bg-muted" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="h-5 bg-muted rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <SearchIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
          <h3 className="font-semibold text-lg text-foreground">No properties found</h3>
          <p className="text-muted-foreground text-sm mt-1">Try adjusting your filters or search terms.</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      ) : (
        <Suspense fallback={<div className="h-[500px] flex items-center justify-center text-muted-foreground">Loading map...</div>}>
          <PropertyMap properties={filtered} />
        </Suspense>
      )}
    </div>
  );
}

function PropertyCard({ property }: { property: Property }) {
  const image = property.property_images
    ?.sort((a, b) => a.display_order - b.display_order)[0]?.image_url;
  const { user } = useAuth();
  const [fav, setFav] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("favorites").select("id").eq("property_id", property.id).eq("user_id", user.id).maybeSingle().then(({ data }) => setFav(!!data));
  }, [user, property.id]);

  const toggleFav = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { toast({ title: "Log in to save favorites", variant: "destructive" }); return; }
    if (fav) {
      await supabase.from("favorites").delete().eq("property_id", property.id).eq("user_id", user.id);
      setFav(false);
    } else {
      await supabase.from("favorites").insert({ property_id: property.id, user_id: user.id });
      setFav(true);
    }
  };

  const amenities = [
    property.furnished && { icon: Sofa, label: "Furnished" },
    property.internet && { icon: Wifi, label: "WiFi" },
    property.parking && { icon: Car, label: "Parking" },
    property.pets_allowed && { icon: PawPrint, label: "Pets OK" },
    property.water_available && { icon: Droplets, label: "Water" },
  ].filter(Boolean) as { icon: any; label: string }[];

  return (
    <Link to={`/property/${property.id}`} className="group focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg">
      <Card className="overflow-hidden border bg-card hover:shadow-lg transition-all duration-200 h-full flex flex-col">
        {/* Image */}
        <div className="aspect-[4/3] bg-muted relative overflow-hidden">
          {image ? (
            <img
              src={image}
              alt={property.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">No image</div>
          )}
          {/* Overlay badges */}
          <div className="absolute top-2 left-2 flex gap-1.5">
            <Badge className="bg-background/90 text-foreground backdrop-blur-sm text-xs font-medium shadow-sm">
              {property.room_type.toUpperCase()}
            </Badge>
          </div>
          <button
            onClick={toggleFav}
            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors shadow-sm"
            aria-label={fav ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart className={`h-4 w-4 ${fav ? "fill-destructive text-destructive" : "text-muted-foreground"}`} />
          </button>
        </div>

        {/* Content */}
        <CardContent className="p-4 flex-1 flex flex-col">
          <h3 className="font-semibold text-base text-foreground truncate">{property.title}</h3>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{property.city}{property.area ? `, ${property.area}` : ""}</span>
          </p>

          {/* Description snippet */}
          {property.description && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{property.description}</p>
          )}

          {/* Amenities */}
          {amenities.length > 0 && (
            <div className="flex gap-1.5 mt-3 flex-wrap">
              {amenities.slice(0, 4).map((a) => (
                <span key={a.label} className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  <a.icon className="h-3 w-3" />{a.label}
                </span>
              ))}
            </div>
          )}

          {/* Price */}
          <div className="mt-auto pt-3 flex items-end justify-between border-t border-border/50 mt-3">
            <div>
              <p className="text-lg font-bold text-primary leading-tight">
                NPR {Number(property.price).toLocaleString()}
                <span className="text-xs font-normal text-muted-foreground">/mo</span>
              </p>
              {property.deposit && Number(property.deposit) > 0 && (
                <p className="text-xs text-muted-foreground">Deposit: NPR {Number(property.deposit).toLocaleString()}</p>
              )}
            </div>
            {property.available_from && (
              <span className="text-xs text-muted-foreground">
                From {new Date(property.available_from).toLocaleDateString("en-NP", { month: "short", day: "numeric" })}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
