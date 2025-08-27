import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  AppBar
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { endSession, getSession, isLoggedIn } from "../storage/session";
import ResponsiveAppBar from "../components/AppBar";

// Prix par km
const COST_PER_KM = 0.5; // €/km

// Masque l'email pour protéger la confidentialité
function maskEmail(email) {
  if (!email) return "";
  const [name, domain] = email.split("@");
  return `${name} @${domain ? "…" : ""}`;
}

// Calcul distance Haversine entre deux points
function haversineDistance(coord1, coord2) {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLon = toRad(coord2.lon - coord1.lon);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(coord1.lat)) * Math.cos(toRad(coord2.lat)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calcul des coûts par passager selon distance
function calculateCosts(groups, campusCoords) {
  const result = [];
  const totalsByDriver = {};

  groups.forEach(group => {
    const driver = group.driver;
    const passengers = group.passengers || [];
    if (!passengers.length) return;

    passengers.forEach(p => {
      if (p.lat !== undefined && p.lon !== undefined && driver.lat !== undefined && driver.lon !== undefined) {
        const distDriverToPassenger = haversineDistance(driver, p);
        const distPassengerToCampus = haversineDistance(p, campusCoords);
        const totalDist = distDriverToPassenger + distPassengerToCampus;
        const amount = (totalDist * COST_PER_KM).toFixed(2);

        result.push({
          passenger: p.name || maskEmail(p.email),
          driver: driver.name || maskEmail(driver.email),
          amount
        });

        totalsByDriver[driver.name] = (totalsByDriver[driver.name] || 0) + parseFloat(amount);
      }
    });
  });

  return { result, totalsByDriver };
}

export default function Tarifs() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [groups, setGroups] = useState([]);
  const [costs, setCosts] = useState([]);
  const [totalsByDriver, setTotalsByDriver] = useState({});
  const campusCoords = { lat: 48.3591, lon: -4.5739 };

  // Vérification session
  useEffect(() => {
    if (!isLoggedIn()) navigate("/login");
    const session = getSession();
    setEmail(session.email);
  }, [navigate]);

  // Récupération des groupes
  useEffect(() => {
    fetch("http://localhost:8000/create-groups", { method: "POST" })
      .then(res => res.json())
      .then(data => {
        if (data.groups) setGroups(data.groups);
      })
      .catch(err => console.error("Erreur API groupes:", err));
  }, []);

  // Calcul coûts
  useEffect(() => {
    if (groups.length) {
      const { result, totalsByDriver } = calculateCosts(groups, campusCoords);
      setCosts(result);
      setTotalsByDriver(totalsByDriver);
    }
  }, [groups]);

  const onLogout = () => {
    endSession();
    navigate("/login");
  };

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <AppBar position="static">
        <ResponsiveAppBar onLogout={onLogout} />
      </AppBar>

      <Box sx={{ flex: 1, p: 4, overflowY: "auto" }}>
        <Typography variant="h4" gutterBottom>
          Tarifs des trajets
        </Typography>

        <TableContainer component={Paper} sx={{ mb: 4 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Passager</TableCell>
                <TableCell>Conducteur</TableCell>
                <TableCell>Montant (€)</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {costs.map((c, i) => (
                <TableRow key={i}>
                  <TableCell><Chip label={c.passenger} color="primary" size="small" /></TableCell>
                  <TableCell><Chip label={c.driver} color="secondary" size="small" /></TableCell>
                  <TableCell>{c.amount}</TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => navigate(`/maps?driver=${encodeURIComponent(c.driver)}`)}
                    >
                      Voir trajet
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Typography variant="h6" gutterBottom>
          Totaux par conducteur
        </Typography>
        {Object.keys(totalsByDriver).map(driver => (
          <Typography key={driver}>
            {driver} : {totalsByDriver[driver].toFixed(2)} €
          </Typography>
        ))}
      </Box>
    </Box>
  );
}
