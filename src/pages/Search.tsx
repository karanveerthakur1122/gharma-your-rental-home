import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { MapPin, Wifi, Car, PawPrint, Search as SearchIcon, List, Map } from "lucide-react";
import { lazy, Suspense } from "react";

const PropertyMap = lazy(() => import("@/components/PropertyMap"));

interface Property {
  id: string;
  title: string;
  city: string;
  area: string | null;
  price: number;
  room_type: string;
  furnished: boolean;
  parking: boolean;
  internet: boolean;
  pets_allowed: boolean;
  latitude: number | null;
  longitude: number | null;
  status: string;
  is_vacant: boolean;
  created_at: string;
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
      {/* Search bar + filters */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, city, or area..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex border rounded-md">
            <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon" onClick={() => setViewMode("grid")}>
              <List className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === "map" ? "secondary" : "ghost"} size="icon" onClick={() => setViewMode("map")}>
              <Map className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Input placeholder="City" className="w-32" value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} />
          <Select value={roomFilter} onValueChange={setRoomFilter}>
            <SelectTrigger className="w-32"><SelectValue placeholder="Room type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="single">Single</SelectItem>
              <SelectItem value="1bhk">1 BHK</SelectItem>
              <SelectItem value="2bhk">2 BHK</SelectItem>
              <SelectItem value="flat">Flat</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Sort by" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="price_asc">Price: Low-High</SelectItem>
              <SelectItem value="price_desc">Price: High-Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center py-20 text-muted-foreground">Loading properties...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">No properties found. Try adjusting your filters.</div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

  return (
    <Link to={`/property/${property.id}`}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <div className="aspect-video bg-muted relative">
          {image ? (
            <img src={image} alt={property.title} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">No image</div>
          )}
          <Badge className="absolute top-2 left-2" variant="secondary">
            {property.room_type.toUpperCase()}
          </Badge>
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-base truncate">{property.title}</h3>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
            <MapPin className="h-3 w-3" />
            {property.city}{property.area ? `, ${property.area}` : ""}
          </p>
          <p className="text-lg font-bold text-primary mt-2">NPR {Number(property.price).toLocaleString()}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
          <div className="flex gap-2 mt-2 flex-wrap">
            {property.furnished && <Badge variant="outline" className="text-xs">Furnished</Badge>}
            {property.internet && <Badge variant="outline" className="text-xs"><Wifi className="h-3 w-3 mr-1" />WiFi</Badge>}
            {property.parking && <Badge variant="outline" className="text-xs"><Car className="h-3 w-3 mr-1" />Parking</Badge>}
            {property.pets_allowed && <Badge variant="outline" className="text-xs"><PawPrint className="h-3 w-3 mr-1" />Pets</Badge>}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
