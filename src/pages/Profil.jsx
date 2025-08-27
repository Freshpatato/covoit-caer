import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { endSession, getSession, isLoggedIn } from "/home/maxime/Documents/covoit/src/storage/session.js";
import { AppBar, Box, Typography, Button, Paper, Divider } from "@mui/material";
import ResponsiveAppBar from "../components/AppBar";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase/firebase";

// Masque partiellement l'email
function maskEmail(email) {
  if (!email) return "";
  const [name, domain] = email.split("@");
  return `${name} @${domain ? "…" : ""}`;
}

export default function Profil() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/login");
      return;
    }

    const session = getSession();

    const fetchUser = async () => {
      try {
        const uid = session?.uid || auth.currentUser?.uid;
        if (!uid) {
          console.error("UID introuvable !");
          return;
        }

        const ref = doc(db, "users", uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setUser(snap.data());
        } else {
          console.warn("Utilisateur introuvable dans Firestore");
        }
      } catch (err) {
        console.error("Erreur récupération user:", err);
      }
    };

    fetchUser();
  }, [navigate]);

  const onLogout = () => {
    endSession();
    navigate("/login");
  };

  const openMap = () => {
    if (user?.address?.lat && user?.address?.lon) {
      const url = `https://www.google.com/maps?q=${user.address.lat},${user.address.lon}`;
      window.open(url, "_blank");
    }
  };

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* AppBar */}
      <AppBar position="static">
        <ResponsiveAppBar onLogout={onLogout} />
      </AppBar>

      {/* Contenu principal */}
      <Box sx={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", p: 3 }}>
        {user ? (
          <Paper sx={{ p: 4, width: "100%", maxWidth: 500 }}>
            <Typography variant="h5" gutterBottom textAlign="center">
              Profil Utilisateur
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {/* Infos principales */}
            <Typography variant="subtitle1"><strong>Email:</strong> {maskEmail(user.email)}</Typography>
            <Typography variant="subtitle1">
              <strong>Rôle:</strong> {user.isDriver ? `Conducteur (${user.places || 0} places)` : "Passager"}
            </Typography>

            {/* Adresse */}
            {user.address && (
              <>
                <Typography variant="subtitle1" sx={{ mt: 2 }}><strong>Adresse:</strong></Typography>
                <Typography variant="body2">Nom affiché : {user.address.display_name}</Typography>
                <Typography variant="body2">Rue : {user.address.road}</Typography>
                <Typography variant="body2">Numéro : {user.address.housenumber}</Typography>
                <Typography variant="body2">Code postal : {user.address.postcode}</Typography>
                <Typography variant="body2">Ville : {user.address.city}</Typography>
                <Typography variant="body2">Pays : {user.address.country}</Typography>
                <Typography variant="body2">Latitude : {user.address.lat}</Typography>
                <Typography variant="body2">Longitude : {user.address.lon}</Typography>

                <Button
                  variant="outlined"
                  color="primary"
                  onClick={openMap}
                  sx={{ mt: 2, width: "100%" }}
                >
                  Voir sur la carte
                </Button>
              </>
            )}

            <Button
              variant="contained"
              color="error"
              onClick={onLogout}
              sx={{ mt: 3, width: "100%" }}
            >
              Se déconnecter
            </Button>
          </Paper>
        ) : (
          <Typography>Chargement du profil...</Typography>
        )}
      </Box>
    </Box>
  );
}
