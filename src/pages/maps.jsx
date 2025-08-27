import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { endSession, getSession, isLoggedIn } from "/home/maxime/Documents/covoit/src/storage/session.js";
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "leaflet-routing-machine";

import { auth, db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

import { AppBar, Box } from "@mui/material";
import ResponsiveAppBar from "../components/AppBar";

// Couleurs prédéfinies pour les groupes
const COLORS = ["red", "blue", "green", "purple", "orange", "pink", "brown"];

// Icônes personnalisées
const driverIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/1946/1946410.png",
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

const passengerIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/1946/1946429.png",
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

const campusIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/1048/1048953.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// Fonction pour masquer partiellement l'email
function maskEmail(email) {
  if (!email) return "";
  const [name, domain] = email.split("@");
  return `${name} @${domain ? "…" : ""}`;
}

// Composant Routing : trajet conducteur → passagers → campus
function Routing({ driver, passengers, color, destination }) {
  const map = useMap();

  useEffect(() => {
    if (!driver || driver.lat === undefined || driver.lon === undefined) return;

    const waypoints = [L.latLng(driver.lat, driver.lon)];
    passengers.forEach((p) => {
      if (p.lat !== undefined && p.lon !== undefined) {
        waypoints.push(L.latLng(p.lat, p.lon));
      }
    });
    if (destination) {
      waypoints.push(L.latLng(destination.lat, destination.lon));
    }

const control = L.Routing.control({
  waypoints,
  lineOptions: { styles: [{ color, weight: 4 }] },
  addWaypoints: false,
  draggableWaypoints: false,
  fitSelectedRoutes: false,
  show: false,
  createMarker: () => null, // ← empêche les markers automatiques
}).addTo(map);


    return () => map.removeControl(control);
  }, [driver, passengers, color, destination, map]);

  return null;
}

export default function Maps() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [coords, setCoords] = useState(null);
  const [groups, setGroups] = useState([]);
  const campusCoords = { lat: 48.3591, lon: -4.5739 };

  // Vérification session
  useEffect(() => {
    if (!isLoggedIn()) navigate("/login");
    const session = getSession();
    setEmail(session.email);
  }, [navigate]);

  // Récupération coordonnées utilisateur
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          if (data.address?.lat && data.address?.lon) {
            setCoords({ lat: parseFloat(data.address.lat), lon: parseFloat(data.address.lon) });
          }
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Récupération des groupes depuis l’API
  useEffect(() => {
    fetch("http://localhost:8000/create-groups", { method: "POST" })
      .then(res => res.json())
      .then(data => {
        if (data.groups) {
          setGroups(data.groups);
        }
      })
      .catch(err => console.error("Erreur API groupes:", err));
  }, []);

  const onLogout = () => {
    endSession();
    navigate("/login");
  };

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <AppBar position="static">
        <ResponsiveAppBar onLogout={onLogout} />
      </AppBar>

      <Box sx={{ flex: 1 }}>
        <MapContainer
          center={coords || [48.3904, -4.4861]}
          zoom={13}
          scrollWheelZoom
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Position utilisateur */}
          {coords && (
            <Marker position={[coords.lat, coords.lon]} icon={driverIcon}>
              <Tooltip direction="top" offset={[0, -10]}>
                {maskEmail(email)} (Moi)
              </Tooltip>
            </Marker>
          )}

          {/* Campus */}
          <Marker position={[campusCoords.lat, campusCoords.lon]} icon={campusIcon}>
            <Tooltip direction="top" offset={[0, -10]}>
              Campus
            </Tooltip>
          </Marker>

          {/* Groupes */}
          {groups.map((group, i) => {
            const color = COLORS[i % COLORS.length];

            return (
              <React.Fragment key={`group-${i}`}>
                {/* Conducteur */}
                {group.driver.lat !== undefined && group.driver.lon !== undefined && (
                  <Marker position={[group.driver.lat, group.driver.lon]} icon={driverIcon}>
                    <Tooltip direction="top" offset={[0, -10]}>
                      {maskEmail(group.driver.email)} (Conducteur)
                    </Tooltip>
                  </Marker>
                )}

                {/* Passagers */}
                {group.passengers.map((p, j) => (
                  (p.lat !== undefined && p.lon !== undefined) && (
                    <Marker key={`passenger-${i}-${j}`} position={[p.lat, p.lon]} icon={passengerIcon}>
                      <Tooltip direction="top" offset={[0, -10]}>
                        {maskEmail(p.email)} (Passager)
                      </Tooltip>
                    </Marker>
                  )
                ))}

                {/* Trajet */}
                <Routing
                  driver={group.driver}
                  passengers={group.passengers}
                  color={color}
                  destination={campusCoords}
                />
              </React.Fragment>
            );
          })}
        </MapContainer>
      </Box>
    </Box>
  );
}
