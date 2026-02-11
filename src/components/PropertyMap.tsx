// react-leaflet v4.2.1 for React 18 compatibility
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface Property {
  id: string;
  title: string;
  city: string;
  area: string | null;
  price: number;
  room_type: string;
  latitude: number | null;
  longitude: number | null;
  property_images: { image_url: string; display_order: number }[];
}

interface PropertyMapProps {
  properties: Property[];
}

export default function PropertyMap({ properties }: PropertyMapProps) {
  const mappable = properties.filter((p) => p.latitude && p.longitude);

  // Center on Nepal by default, or on first property
  const center: [number, number] = mappable.length > 0
    ? [mappable[0].latitude!, mappable[0].longitude!]
    : [27.7, 85.3];

  if (mappable.length === 0) {
    return (
      <div className="rounded-lg border bg-muted/50 h-[500px] flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No properties with location data</p>
          <p className="text-xs">Properties need latitude/longitude to appear on the map</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden border h-[500px]">
      <MapContainer center={center} zoom={13} className="h-full w-full z-0">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {mappable.map((p) => (
          <Marker key={p.id} position={[p.latitude!, p.longitude!]}>
            <Popup>
              <div className="min-w-[180px]">
                {p.property_images?.[0] && (
                  <img
                    src={p.property_images.sort((a, b) => a.display_order - b.display_order)[0].image_url}
                    alt={p.title}
                    className="w-full h-24 object-cover rounded mb-2"
                  />
                )}
                <p className="font-semibold text-sm">{p.title}</p>
                <p className="text-xs text-muted-foreground">{p.city}{p.area ? `, ${p.area}` : ""}</p>
                <p className="font-bold text-sm mt-1">NPR {Number(p.price).toLocaleString()}/mo</p>
                <Link to={`/property/${p.id}`} className="text-xs text-primary underline mt-1 inline-block">
                  View Details →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
