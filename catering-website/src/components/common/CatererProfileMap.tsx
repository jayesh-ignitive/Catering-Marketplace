"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { defaultLeafletMarkerIcon } from "@/lib/leaflet-default-marker-icon";

type Props = {
  latitude: number;
  longitude: number;
  businessName: string;
  addressLine?: string | null;
  className?: string;
};

/** Single-pin Leaflet map for caterer profiles (e.g. `/caterers/[slug]`). */
export default function CatererProfileMap({
  latitude,
  longitude,
  businessName,
  addressLine,
  className,
}: Props) {
  const center: [number, number] = [latitude, longitude];
  return (
    <div
      className={
        className ??
        "relative z-0 h-[220px] w-full overflow-hidden rounded-xl ring-1 ring-stone-200/80"
      }
    >
      <MapContainer
        center={center}
        zoom={15}
        scrollWheelZoom
        className="h-full w-full [&_.leaflet-control-attribution]:text-[10px]"
        style={{ minHeight: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={center} icon={defaultLeafletMarkerIcon}>
          <Popup>
            <span className="font-bold">{businessName}</span>
            {addressLine ? (
              <>
                <br />
                <span className="text-stone-700">{addressLine}</span>
              </>
            ) : null}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
