import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const mappable = properties.filter((p) => p.latitude && p.longitude);

  const center: [number, number] = mappable.length > 0
    ? [mappable[0].latitude!, mappable[0].longitude!]
    : [27.7, 85.3];

  useEffect(() => {
    if (!mapRef.current) return;

    // Destroy previous instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapRef.current).setView(center, 13);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    mappable.forEach((p) => {
      const imgHtml = p.property_images?.[0]
        ? `<img src="${p.property_images.sort((a, b) => a.display_order - b.display_order)[0].image_url}" alt="${p.title}" style="width:100%;height:96px;object-fit:cover;border-radius:4px;margin-bottom:8px;" />`
        : "";

      const popup = `
        <div style="min-width:180px;">
          ${imgHtml}
          <p style="font-weight:600;font-size:14px;margin:0;">${p.title}</p>
          <p style="font-size:12px;color:#888;margin:2px 0;">${p.city}${p.area ? `, ${p.area}` : ""}</p>
          <p style="font-weight:700;font-size:14px;margin:4px 0;">NPR ${Number(p.price).toLocaleString()}/mo</p>
          <a href="/property/${p.id}" style="font-size:12px;color:#2563eb;">View Details →</a>
        </div>
      `;

      L.marker([p.latitude!, p.longitude!]).addTo(map).bindPopup(popup);
    });

    // Fit bounds if multiple markers
    if (mappable.length > 1) {
      const bounds = L.latLngBounds(mappable.map((p) => [p.latitude!, p.longitude!]));
      map.fitBounds(bounds, { padding: [30, 30] });
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [properties]);

  if (mappable.length === 0) {
    return (
      <div className="rounded-lg border bg-muted/50 h-[500px] flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-lg font-medium">No properties with location data</p>
          <p className="text-xs">Properties need latitude/longitude to appear on the map</p>
        </div>
      </div>
    );
  }

  return <div ref={mapRef} className="rounded-lg overflow-hidden border h-[500px] z-0" />;
}
