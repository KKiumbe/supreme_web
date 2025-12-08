import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Grid,
  Typography,
  CircularProgress,
  Snackbar,
  Alert,
  MenuItem,
  Paper,
} from "@mui/material";
import axios from "axios";
import { useAuthStore } from "../../store/authStore";
import { getTheme } from "../../store/theme";

const BASEURL = import.meta.env.VITE_BASE_URL;

export default function SmsBillingScreen() {
  const { currentUser } = useAuthStore();

  const [amount, setAmount] = useState("");
  const [schemes, setSchemes] = useState([]);
  const [selectedScheme, setSelectedScheme] = useState("");
  const [selectedZone, setSelectedZone] = useState("");
  const [selectedRoute, setSelectedRoute] = useState("");
  const [zones, setZones] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState("success");
    const theme = getTheme();
  // Fetch schemes on mount
  useEffect(() => {
    const fetchSchemes = async () => {
      try {
        const res = await axios.get(`${BASEURL}/schemes`, { withCredentials: true });
        setSchemes(res.data.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSchemes();
  }, []);

  // Update zones when scheme changes
  useEffect(() => {
    const scheme = schemes.find((s) => s.id === Number(selectedScheme));
    setZones(scheme?.zones || []);
    setSelectedZone("");
    setRoutes([]);
    setSelectedRoute("");
  }, [selectedScheme, schemes]);

  // Update routes when zone changes
  useEffect(() => {
    const zone = zones.find((z) => z.id === Number(selectedZone));
    setRoutes(zone?.routes || []);
    setSelectedRoute("");
  }, [selectedZone, zones]);

  const showMessage = (msg, type = "success") => {
    setMessage(msg);
    setSeverity(type);
  };

  const handleApiCall = async (url, data = {}) => {
    setLoading(true);
    try {
      const res = await axios.post(`${BASEURL}${url}`, data, { withCredentials: true });
      showMessage(res.data.message || "Success", "success");
    } catch (err) {
      console.error(err);
      showMessage(err?.response?.data?.message || "Error occurred", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h5" mb={2}>
       Send Bills & Reminders 
      </Typography>

      {/* ================= Payment Reminders ================= */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" mb={2}>
          Send Bill Reminders
        </Typography>

        <Grid container spacing={2} mb={2}>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="Amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              select
              fullWidth
              label="Scheme"
              value={selectedScheme}
              onChange={(e) => setSelectedScheme(e.target.value)}
            >
              {schemes.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              select
              fullWidth
              label="Zone"
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              disabled={!selectedScheme}
            >
              {zones.map((z) => (
                <MenuItem key={z.id} value={z.id}>
                  {z.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              select
              fullWidth
              label="Route"
              value={selectedRoute}
              onChange={(e) => setSelectedRoute(e.target.value)}
              disabled={!selectedZone}
            >
              {routes.map((r) => (
                <MenuItem key={r.id} value={r.id}>
                  {r.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid item>
            <Button
              variant="contained"
              onClick={() => handleApiCall("/send-bills-reminder", { amount })}
              disabled={loading}
            >
              Send Reminders to All
            </Button>
          </Grid>

          <Grid item>
            <Button
              variant="contained"
              onClick={() =>
                handleApiCall(`/send-reminders-by-scheme/${selectedScheme}`, { amount })
              }
              disabled={loading || !selectedScheme}
            >
              Send Reminders by Scheme
            </Button>
          </Grid>

          <Grid item>
            <Button
              variant="contained"
              onClick={() =>
                handleApiCall(`/send-reminders-by-zone/${selectedZone}`, { amount })
              }
              disabled={loading || !selectedZone}
            >
              Send Reminders by Zone
            </Button>
          </Grid>

          <Grid item>
            <Button
              variant="contained"
              onClick={() =>
                handleApiCall(`/send-reminders-by-route/${selectedRoute}`, { amount })
              }
              disabled={loading || !selectedRoute}
            >
              Send Reminders by Route
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* ================= Bills ================= */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" mb={2}>
          Send Bills
        </Typography>

        <Grid container spacing={2} mb={2}>
          <Grid item xs={12} sm={3}>
            <TextField
              select
              fullWidth
              label="Scheme"
              value={selectedScheme}
              onChange={(e) => setSelectedScheme(e.target.value)}
            >
              {schemes.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              select
              fullWidth
              label="Zone"
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              disabled={!selectedScheme}
            >
              {zones.map((z) => (
                <MenuItem key={z.id} value={z.id}>
                  {z.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              select
              fullWidth
              label="Route"
              value={selectedRoute}
              onChange={(e) => setSelectedRoute(e.target.value)}
              disabled={!selectedZone}
            >
              {routes.map((r) => (
                <MenuItem key={r.id} value={r.id}>
                  {r.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid item>
            <Button
              variant="outlined"
              onClick={() => handleApiCall("/send-bills-to-all")}
              disabled={loading}
              color="theme?.palette?.primary?.contrastText"
            >
              Send Bills to All
            </Button>
          </Grid>

          <Grid item>
            <Button
              variant="outlined"
                color="theme?.palette?.primary?.contrastText"
              onClick={() =>
                handleApiCall(`/send-bills-by-scheme/${selectedScheme}`)
              }
              disabled={loading || !selectedScheme}
            >
              Send Bills by Scheme
            </Button>
          </Grid>

          <Grid item>
            <Button
              variant="outlined"
                color="theme?.palette?.primary?.contrastText"
              onClick={() => handleApiCall(`/get-bills-by-zone/${selectedZone}`)}
              disabled={loading || !selectedZone}
            >
              Send Bills by Zone
            </Button>
          </Grid>

          <Grid item>
            <Button
              variant="outlined"
                color="theme?.palette?.primary?.contrastText"
              onClick={() =>
                handleApiCall(`/send-bills-by-route/${selectedRoute}`)
              }
              disabled={loading || !selectedRoute}
            >
              Send Bills by Route
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {loading && <CircularProgress sx={{ mt: 3 }} />}

      <Snackbar
        open={!!message}
        autoHideDuration={4000}
        onClose={() => setMessage("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setMessage("")}
          severity={severity}
          sx={{ width: "100%" }}
        >
          {message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
