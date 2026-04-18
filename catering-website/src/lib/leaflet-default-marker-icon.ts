import L from "leaflet";

const LEAFLET_VER = "1.9.4";

/** CDN icons so Next.js bundling does not break default Leaflet marker assets. */
export const defaultLeafletMarkerIcon = new L.Icon({
  iconUrl: `https://cdnjs.cloudflare.com/ajax/libs/leaflet/${LEAFLET_VER}/images/marker-icon.png`,
  iconRetinaUrl: `https://cdnjs.cloudflare.com/ajax/libs/leaflet/${LEAFLET_VER}/images/marker-icon-2x.png`,
  shadowUrl: `https://cdnjs.cloudflare.com/ajax/libs/leaflet/${LEAFLET_VER}/images/marker-shadow.png`,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
