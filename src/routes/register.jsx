import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  Link,
  TextField,
  Typography,
  Checkbox,
  FormControlLabel,
  CircularProgress
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { createUser, saveUserData } from "../firebase/firebase"; 
import { startSession } from "../storage/session";
import AddressAutocomplete from "../components/AddressAutocomplete";

// Fonction utilitaire pour supprimer les champs undefined (compatible Firestore)
function cleanObject(obj) {
  if (!obj || typeof obj !== "object") return obj;
  const res = Array.isArray(obj) ? [] : {};
  for (const key in obj) {
    const val = obj[key];
    if (val !== undefined) {
      res[key] = typeof val === "object" ? cleanObject(val) : val;
    }
  }
  return res;
}

export default function Register() {
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [address, setAddress] = useState(null);

  const [isDriver, setIsDriver] = useState(false);
  const [places, setPlaces] = useState(1);

  const onSubmit = async (event) => {
    event.preventDefault();

    // Validation des champs
    if (!email || !password || !repeatPassword || !address) {
      setError("Veuillez remplir tous les champs.");
      return;
    }
    if (password !== repeatPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (isDriver && (!places || places < 1)) {
      setError("Veuillez indiquer un nombre de places valide.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      // Création du compte Firebase
      const registerResponse = await createUser(email, password);
      const user = registerResponse.user;

      // Nettoyage de l'adresse pour Firestore
      const cleanAddress = cleanObject(address);

      // Sauvegarde des données utilisateur
      await saveUserData(user.uid, {
        email: user.email,
        address: cleanAddress,
        isDriver: isDriver,
        places: isDriver ? places : 0,
        createdAt: new Date(),
      });

      // Démarrage de la session
      startSession(user);

      // Redirection vers la map
      navigate("/maps");
    } catch (err) {
      console.error(err);
      setError(err.message || "Erreur lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs" sx={{ mt: 2 }}>
      <Typography variant="h5" component="h1" gutterBottom textAlign="center">
        Register
      </Typography>

      {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}

      <Box component="form" onSubmit={onSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <TextField
          label="Email"
          variant="outlined"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
        />

        <TextField
          label="Password"
          variant="outlined"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
        />

        <TextField
          label="Repeat password"
          variant="outlined"
          type="password"
          autoComplete="repeat-new-password"
          value={repeatPassword}
          onChange={(e) => setRepeatPassword(e.target.value)}
          fullWidth
        />

        {/* Champ pour choisir une adresse */}
        <AddressAutocomplete value={address} onChange={setAddress} />

        {/* Case à cocher conducteur */}
        <FormControlLabel
          control={
            <Checkbox
              checked={isDriver}
              onChange={(e) => setIsDriver(e.target.checked)}
            />
          }
          label="Je suis conducteur"
        />

        {/* Champ nombre de places si conducteur */}
        {isDriver && (
          <TextField
            label="Nombre de places"
            type="number"
            value={places}
            onChange={(e) => setPlaces(parseInt(e.target.value))}
            fullWidth
            inputProps={{ min: 1, max: 8 }}
          />
        )}

        <Button
          variant="contained"
          type="submit"
          fullWidth
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : "Register"}
        </Button>

        <Box sx={{ mt: 1, textAlign: "center" }}>
          Already have an account? <Link href="/login">Login</Link>
        </Box>
      </Box>
    </Container>
  );
}
