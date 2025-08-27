import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "leaflet-routing-machine";

// Composant pour tracer une route entre 2 points
function Routing({ from, to, color }) {
  useEffect(() => {
    if (!from || !to) return;

    const map = window._leaflet_map;
    if (!map) return;

    const routingControl = L.Routing.control({
      waypoints: [L.latLng(from.lat, from.lng), L.latLng(to.lat, to.lng)],
      lineOptions: { styles: [{ color, weight: 4 }] },
      createMarker: () => null,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: false,
      show: false,
    }).addTo(map);

    return () => {
      map.removeControl(routingControl);
    };
  }, [from, to, color]);

  return null;
}

const COLORS = ["red", "blue", "green", "orange", "purple", "brown"];

export default function Path() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/create-groups", { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        if (data.groups) {
          const parsed = data.groups.map((g) => ({
            driver: {
              name: g.driver.name,
              lat: parseFloat(g.driver.lat),
              lng: parseFloat(g.driver.lon),
            },
            passengers: g.passengers.map((p) => ({
              ...p,
              lat: parseFloat(p.lat),
              lng: parseFloat(p.lon),
            })),
            max_places: g.max_places,
          }));
          setGroups(parsed);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erreur API :", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Chargement des groupes...</div>;

  return (
    <div>
      <h2>Groupes de covoiturage</h2>

      <MapContainer
        center={[48.406136, -4.501566]}
        zoom={12}
        style={{ height: "500px", width: "100%" }}
        whenCreated={(map) => {
          window._leaflet_map = map;
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {groups.map((group, i) => {
          const color = COLORS[i % COLORS.length];
          return (
            <div key={i}>
              {/* Marqueur conducteur */}
              <Marker position={[group.driver.lat, group.driver.lng]}>
                <Popup>
                  <strong>Conducteur :</strong> {group.driver.name} <br />
                  Places dispo : {group.max_places}
                </Popup>
              </Marker>

              {/* Marqueurs + tracés passagers */}
              {group.passengers.map((p, j) => (
                <div key={j}>
                  <Marker position={[p.lat, p.lng]}>
                    <Popup>
                      <strong>Passager :</strong> {p.name}
                    </Popup>
                  </Marker>
                  <Routing
                    from={{ lat: group.driver.lat, lng: group.driver.lng }}
                    to={{ lat: p.lat, lng: p.lng }}
                    color={color}
                  />
                </div>
              ))}
            </div>
          );
        })}
      </MapContainer>
    </div>
  );
}
