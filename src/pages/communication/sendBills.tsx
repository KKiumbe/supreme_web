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
  FormHelperText,
  IconButton,
  Tooltip,
  Divider,
} from "@mui/material";
import { Restore as RestoreIcon, Info as InfoIcon } from "@mui/icons-material";
import axios from "axios";
import { useAuthStore } from "../../store/authStore";

const BASEURL = import.meta.env.VITE_BASE_URL;

interface Scheme { id: number; name: string; zones?: Zone[] }
interface Zone { id: number; name: string; routes?: Route[] }
interface Route { id: number; name: string }

export default function SmsBillingScreen() {
  const { currentUser } = useAuthStore();

  // ── Data & Selection ───────────────────────────────────
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);

  const [selectedScheme, setSelectedScheme] = useState<string>("");
  const [selectedZone, setSelectedZone] = useState<string>("");
  const [selectedRoute, setSelectedRoute] = useState<string>("");

  // ── States ─────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Bill Reminders
  const [reminderMinAmount, setReminderMinAmount] = useState("");
  const [reminderMessage, setReminderMessage] = useState(
    "Dear {name}, your outstanding bill is KES {balance}. Please pay before {dueDate}.Use paybill :4183721 account : {connectionNumber}"
  );
  const defaultReminderMessage = reminderMessage; // captured on mount

  // Disconnection Alerts
  const [disconnectionMinBalance, setDisconnectionMinBalance] = useState("");
  const [disconnectionMinUnpaidMonths, setDisconnectionMinUnpaidMonths] = useState("");
  const [disconnectionMessage, setDisconnectionMessage] = useState(
    "Dear {name}, you have an outstanding balance of KES {balance} covering {unpaidMonths} unpaid months since {since}. Please pay immediately to avoid disconnection.Use paybill :4183721 account : {connectionNumber}"
  );
  const defaultDisconnectionMessage = disconnectionMessage;

  // ── Fetch Schemes ──────────────────────────────────────
  useEffect(() => {
    const fetchSchemes = async () => {
      try {
        const res = await axios.get(`${BASEURL}/schemes`, { withCredentials: true });
        setSchemes(res.data.data || []);
      } catch (err) {
        console.error("Failed to fetch schemes:", err);
      }
    };
    fetchSchemes();
  }, []);

  useEffect(() => {
    const scheme = schemes.find((s) => s.id === Number(selectedScheme));
    setZones(scheme?.zones || []);
    setSelectedZone("");
    setRoutes([]);
    setSelectedRoute("");
  }, [selectedScheme, schemes]);

  useEffect(() => {
    const zone = zones.find((z) => z.id === Number(selectedZone));
    setRoutes(zone?.routes || []);
    setSelectedRoute("");
  }, [selectedZone, zones]);

  // ── Helpers ────────────────────────────────────────────
  const showMessage = (msg: string, type: "success" | "error" = "success") => {
    setSnack({ msg, type });
  };

  const sendRequest = async (url: string, payload: any = {}) => {
    setLoading(true);
    try {
      const res = await axios.post(`${BASEURL}${url}`, payload, { withCredentials: true });
      showMessage(res.data.message || "Operation successful");
    } catch (err: any) {
      showMessage(err?.response?.data?.message || "Operation failed", "error");
    } finally {
      setLoading(false);
    }
  };

  // ── Reset to Default ───────────────────────────────────
  const resetReminderMessage = () => setReminderMessage(defaultReminderMessage);
  const resetDisconnectionMessage = () => setDisconnectionMessage(defaultDisconnectionMessage);

  // ── Shared Filter Selectors ────────────────────────────
  const FilterSelectors = ({ showRoute = true }: { showRoute?: boolean }) => (
    <Grid container spacing={3} mb={4}>
      <Grid item xs={12} md={4}>
        <TextField
          select
          fullWidth
          label="Scheme"
          value={selectedScheme}
          onChange={(e) => setSelectedScheme(e.target.value)}
          variant="outlined"
        >
          {schemes.map((s) => (
            <MenuItem key={s.id} value={s.id}>
              {s.name}
            </MenuItem>
          ))}
        </TextField>
      </Grid>

      <Grid item xs={12} md={4}>
        <TextField
          select
          fullWidth
          label="Zone"
          value={selectedZone}
          onChange={(e) => setSelectedZone(e.target.value)}
          disabled={!selectedScheme}
          variant="outlined"
        >
          {zones.map((z) => (
            <MenuItem key={z.id} value={z.id}>
              {z.name}
            </MenuItem>
          ))}
        </TextField>
      </Grid>

      {showRoute && (
        <Grid item xs={12} md={4}>
          <TextField
            select
            fullWidth
            label="Route"
            value={selectedRoute}
            onChange={(e) => setSelectedRoute(e.target.value)}
            disabled={!selectedZone}
            variant="outlined"
          >
            {routes.map((r) => (
              <MenuItem key={r.id} value={r.id}>
                {r.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      )}
    </Grid>
  );

  // ── Render ─────────────────────────────────────────────
  return (
    <Box
      sx={{
        minWidth: "900px",
        mx: "auto",
        p: { xs: 2, md: 4, lg: 15 },
        minHeight: "100vh",
      }}
    >
      <Typography variant="h5" component="h1" gutterBottom fontWeight="bold">
        Send Bills,Reminders & Alerts
      </Typography>

      {/* ==================== SEND BILLS ==================== */}
      <Paper elevation={3} sx={{ p: 4, mb: 5, borderRadius: 3 }}>
        <Typography variant="h5" gutterBottom>
          Send Bills
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <FilterSelectors showRoute />

        <Grid container spacing={2} justifyContent="flex-start">
          <Grid item>
            <Button variant="outlined" disabled={loading} onClick={() => sendRequest("/send-bills-to-all")}>
              Send to All Customers
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              disabled={loading || !selectedScheme}
              color="theme.palette.primary.contrastText"
              onClick={() => sendRequest(`/send-bills-by-scheme/${selectedScheme}`)}
            >
              By Scheme
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              disabled={loading || !selectedZone}
              onClick={() => sendRequest(`/send-bills-by-zone/${selectedZone}`)}
            >
              By Zone
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              disabled={loading || !selectedRoute}
              onClick={() => sendRequest(`/send-bills-by-route/${selectedRoute}`)}
            >
              By Route
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* ==================== BILL REMINDERS ==================== */}
      <Paper elevation={3} sx={{ p: 4, mb: 5, borderRadius: 3 }}>
        <Typography variant="h5" gutterBottom>
          Bill Reminders
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <FilterSelectors />

        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} md={6} lg={4}>
            <TextField
              fullWidth
              label="Minimum Outstanding Amount (KES)"
              type="number"
              value={reminderMinAmount}
              onChange={(e) => setReminderMinAmount(e.target.value)}
              helperText="Only customers with balance ≥ this amount will receive the reminder"
              variant="outlined"
            />
          </Grid>
        </Grid>

        <Box sx={{ position: "relative", mb: 3 }}>
          <TextField
            fullWidth
            multiline
            minRows={4}
            label="Custom Reminder Message (optional)"
            value={reminderMessage}
            onChange={(e) => setReminderMessage(e.target.value)}
            variant="outlined"
            InputProps={{
              endAdornment: (
                <Tooltip title="Reset to default message">
                  <IconButton onClick={resetReminderMessage} edge="end" sx={{ mr: 1 }}>
                    <RestoreIcon />
                  </IconButton>
                </Tooltip>
              ),
            }}
          />
          <FormHelperText sx={{ mt: 1, display: "flex", alignItems: "center", gap: 0.5 }}>
            <InfoIcon fontSize="small" color="action" />
            Leave blank to use the system default message.
            <br />
            Available variables: <strong>{`{name}`}</strong>, <strong>{`{balance}`}</strong>, <strong>{`{dueDate}`}</strong>
          </FormHelperText>
        </Box>

        <Grid container spacing={2}>
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              disabled={loading}
              onClick={() =>
                sendRequest("/send-bills-reminder", {
                  minAmount: reminderMinAmount ? Number(reminderMinAmount) : undefined,
                  messageTemplate: reminderMessage.trim() || undefined,
                })
              }
            >
              Send Reminder to All
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              disabled={loading || !selectedScheme}
              onClick={() =>
                sendRequest(`/send-reminders-by-scheme/${selectedScheme}`, {
                  minAmount: reminderMinAmount ? Number(reminderMinAmount) : undefined,
                  messageTemplate: reminderMessage.trim() || undefined,
                })
              }
            >
              Send by Scheme
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* ==================== DISCONNECTION ALERTS ==================== */}
      <Paper
        elevation={3}
        sx={{
          p: 4,
          mb: 5,
          borderRadius: 3,
          borderLeft: "6px solid",
          borderColor: "error.main",
        }}
      >
        <Typography variant="h5" color="error" gutterBottom>
          Disconnection Warnings
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <FilterSelectors />

        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Minimum Balance (KES)"
              type="number"
              value={disconnectionMinBalance}
              onChange={(e) => setDisconnectionMinBalance(e.target.value)}
              helperText="Only alert customers with balance ≥ this amount"
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Minimum Unpaid Months"
              type="number"
              value={disconnectionMinUnpaidMonths}
              onChange={(e) => setDisconnectionMinUnpaidMonths(e.target.value)}
              helperText="Only alert customers with ≥ this many unpaid months"
              variant="outlined"
            />
          </Grid>
        </Grid>

        <Box sx={{ position: "relative", mb: 3 }}>
          <TextField
            fullWidth
            multiline
            minRows={4}
            label="Custom Disconnection Warning Message (optional)"
            value={disconnectionMessage}
            onChange={(e) => setDisconnectionMessage(e.target.value)}
            variant="outlined"
            InputProps={{
              endAdornment: (
                <Tooltip title="Reset to default message">
                  <IconButton onClick={resetDisconnectionMessage} edge="end" sx={{ mr: 1 }}>
                    <RestoreIcon />
                  </IconButton>
                </Tooltip>
              ),
            }}
          />
          <FormHelperText sx={{ mt: 1, display: "flex", alignItems: "center", gap: 0.5 }}>
            <InfoIcon fontSize="small" color="action" />
            Leave blank to use the system default message.
            <br />
            Available variables: <strong>{`{name}`}</strong>, <strong>{`{balance}`}</strong>, <strong>{`{unpaidMonths}`}</strong>, <strong>{`{since}`}</strong>
          </FormHelperText>
        </Box>

        <Grid container spacing={2}>
          <Grid item>
            <Button
              variant="contained"
              color="error"
              disabled={loading}
              onClick={() =>
                sendRequest("/send-disconnection-alert", {
                  minBalance: disconnectionMinBalance ? Number(disconnectionMinBalance) : undefined,
                  minUnpaidMonths: disconnectionMinUnpaidMonths ? Number(disconnectionMinUnpaidMonths) : undefined,
                  messageTemplate: disconnectionMessage.trim() || undefined,
                })
              }
            >
              Send Warning to All
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              color="error"
              disabled={loading || !selectedScheme}
              onClick={() =>
                sendRequest(`/send-disconnection-alert-by-scheme/${selectedScheme}`, {
                  minBalance: disconnectionMinBalance ? Number(disconnectionMinBalance) : undefined,
                  minUnpaidMonths: disconnectionMinUnpaidMonths ? Number(disconnectionMinUnpaidMonths) : undefined,
                  messageTemplate: disconnectionMessage.trim() || undefined,
                })
              }
            >
              Send Warning by Scheme
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Loading & Snackbar */}
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", my: 6 }}>
          <CircularProgress size={60} />
        </Box>
      )}

      <Snackbar
        open={!!snack}
        autoHideDuration={6000}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnack(null)}
          severity={snack?.type}
          variant="filled"
          sx={{ width: "100%", maxWidth: 500 }}
        >
          {snack?.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}