import React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";

export default function TopBar({ email, onLogout }) {
  return (
    <AppBar position="static">
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography variant="h6">Connecté : {email}</Typography>
        <Button color="inherit" onClick={onLogout}>
          Déconnexion
        </Button>
      </Toolbar>
    </AppBar>
  );
}
