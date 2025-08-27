import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Stack,
  CircularProgress,
  AppBar,
  LinearProgress,
  Button,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { endSession } from "../storage/session";
import ResponsiveAppBar from "../components/AppBar";

export default function Path({ onSelectGroup }) {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/create-groups", { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        setGroups(data.groups || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erreur API :", err);
        setLoading(false);
      });
  }, []);

  const onLogout = () => {
    endSession();
    navigate("/login");
  };

  return (
    <Box>
      <AppBar position="static">
        <ResponsiveAppBar onLogout={onLogout} />
      </AppBar>

      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Groupes de covoiturage
        </Typography>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
            <CircularProgress />
          </Box>
        ) : groups.length === 0 ? (
          <Typography>Aucun groupe trouvé</Typography>
        ) : (
          <Stack spacing={2}>
            {groups.map((g, index) => {
              const fillRatio = g.passengers.length / g.max_places;
              const placesRestantes = g.max_places - g.passengers.length;

              return (
                <Card key={index} sx={{ borderRadius: 2, boxShadow: 3 }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="h6">
                        Conducteur : {g.driver?.name} ({g.max_places} places)
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => onSelectGroup(index)}
                      >
                        Voir le trajet
                      </Button>
                    </Stack>

                    <Box sx={{ my: 1 }}>
                      <LinearProgress variant="determinate" value={fillRatio * 100} />
                      <Typography variant="caption">
                        {placesRestantes} place(s) restante(s)
                      </Typography>
                    </Box>

                    <Typography variant="subtitle1" gutterBottom>
                      Passagers :
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {g.passengers.map((p, idx) => (
                        <Chip key={idx} label={p.name} title={p.email || ""} />
                      ))}
                      {g.passengers.length === 0 && <Typography>Aucun</Typography>}
                    </Stack>
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
        )}
      </Box>
    </Box>
  );
}
