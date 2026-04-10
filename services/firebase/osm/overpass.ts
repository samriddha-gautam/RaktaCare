import { haversineKm, LatLng } from "@/services/firebase/geo/distance";

export type NearbyPlace = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  distanceKm: number;
  type: "hospital";
};

type OverpassElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

export async function fetchNearbyHospitals(params: {
  center: LatLng;
  radiusMeters: number; // e.g. 5000
  limit?: number;
}) {
  const { center, radiusMeters, limit = 30 } = params;

  // Find hospitals around location
  const query = `
  [out:json][timeout:25];
  (
    node["amenity"="hospital"](around:${radiusMeters},${center.lat},${center.lng});
    way["amenity"="hospital"](around:${radiusMeters},${center.lat},${center.lng});
    relation["amenity"="hospital"](around:${radiusMeters},${center.lat},${center.lng});
  );
  out center tags;
  `;

  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: query,
  });

  
  
  if (!res.ok) {
    throw new Error(`Overpass error: HTTP ${res.status}`);
  }

  const json = await res.json();
  const elements: OverpassElement[] = json?.elements ?? [];

  const places: NearbyPlace[] = elements
    .map((el) => {
      const lat = el.lat ?? el.center?.lat;
      const lng = el.lon ?? el.center?.lon;
      if (typeof lat !== "number" || typeof lng !== "number") return null;

      const name =
        el.tags?.name ||
        el.tags?.["name:en"] ||
        el.tags?.operator ||
        "Hospital";

      const distanceKm = haversineKm(center, { lat, lng });

      return {
        id: `${el.type}/${el.id}`,
        name,
        lat,
        lng,
        distanceKm,
        type: "hospital" as const,
      };
    })
    .filter(Boolean) as NearbyPlace[];

  // Sort by distance (Algorithm: ranking)
  places.sort((a, b) => a.distanceKm - b.distanceKm);

  return places.slice(0, limit);
}