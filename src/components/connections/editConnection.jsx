import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
} from "@mui/material";
import axios from "axios";

const BASEURL = import.meta.env.VITE_BASE_URL || "http://localhost:3000/api";

const EditConnectionDialog = ({
  open,
  onClose,
  connection,
  schemes,
  zones,
  routes,
  tariffCategories,
  onSuccess,
}) => {
  const [connectionNumber, setConnectionNumber] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [selectedSchemeId, setSelectedSchemeId] = useState("");
  const [selectedZoneId, setSelectedZoneId] = useState("");
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [selectedTariffCategoryId, setSelectedTariffCategoryId] = useState("");
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "error",
  });

  useEffect(() => {
    if (connection) {
      setConnectionNumber(connection.connectionNumber || "");
      setStatus(connection.status || "ACTIVE");
      setSelectedSchemeId(connection.schemeId || "");
      setSelectedZoneId(connection.zoneId || "");
      setSelectedRouteId(connection.routeId || "");
      setSelectedTariffCategoryId(connection.tariffCategoryId || "");
    }
  }, [connection, open]);

  const statusOptions = [
    "ACTIVE",
    "DISCONNECTED",
    "PENDING_PAYMENT",
    "PENDING_CONNECTION",
    "PENDING_METER",
    "DORMANT",
  ];

  const handleEditConnection = async () => {
    if (!connectionNumber) {
      setSnackbar({
        open: true,
        message: "Connection Number is required",
        severity: "error",
      });
      return;
    }

    setLoading(true);
    try {
      console.warn("📤 Submitting connection update:", {
        connectionNumber: Number(connectionNumber),
        status,
        tariffCategoryId: selectedTariffCategoryId || null,
        schemeId: selectedSchemeId ? Number(selectedSchemeId) : null,
        zoneId: selectedZoneId ? Number(selectedZoneId) : null,
        routeId: selectedRouteId ? Number(selectedRouteId) : null,
      });

      await axios.put(
        `${BASEURL}/update-connection/${connection.id}`,
        {
          connectionNumber: Number(connectionNumber),
          customerId: connection.customerId,
          status,
          tariffCategoryId: selectedTariffCategoryId || null,
          schemeId: selectedSchemeId ? Number(selectedSchemeId) : null,
          zoneId: selectedZoneId ? Number(selectedZoneId) : null,
          routeId: selectedRouteId ? Number(selectedRouteId) : null,
        },
        { withCredentials: true },
      );

      console.warn("✅ Connection update response: success");

      setSnackbar({
        open: true,
        message: "Connection updated successfully",
        severity: "success",
      });

      onSuccess();
      onClose();
    } catch (err) {
      console.error("❌ Connection update error:", err);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || "Update failed",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredZones = selectedSchemeId
    ? zones.filter((z) => z.schemeId === Number(selectedSchemeId))
    : [];

  const filteredRoutes = selectedZoneId
    ? routes.filter((r) => r.zoneId === Number(selectedZoneId))
    : [];

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle>Edit Connection</DialogTitle>
        <DialogContent
          sx={{ pt: 3, display: "flex", flexDirection: "column", gap: 2 }}
        >
          <TextField
            fullWidth
            label="Connection Number"
            type="number"
            value={connectionNumber}
            onChange={(e) => setConnectionNumber(e.target.value)}
            disabled={loading}
          />

          <FormControl fullWidth disabled={loading}>
            <InputLabel>Status</InputLabel>
            <Select
              value={status}
              label="Status"
              onChange={(e) => setStatus(e.target.value)}
            >
              {statusOptions.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth disabled={loading}>
            <InputLabel>Scheme</InputLabel>
            <Select
              value={selectedSchemeId}
              label="Scheme"
              onChange={(e) => {
                setSelectedSchemeId(e.target.value);
                setSelectedZoneId("");
                setSelectedRouteId("");
              }}
            >
              <MenuItem value="">— Select Scheme —</MenuItem>
              {schemes.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth disabled={loading || !selectedSchemeId}>
            <InputLabel>Zone</InputLabel>
            <Select
              value={selectedZoneId}
              label="Zone"
              onChange={(e) => {
                setSelectedZoneId(e.target.value);
                setSelectedRouteId("");
              }}
            >
              <MenuItem value="">— Select Zone —</MenuItem>
              {filteredZones.map((z) => (
                <MenuItem key={z.id} value={z.id}>
                  {z.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth disabled={loading || !selectedZoneId}>
            <InputLabel>Route</InputLabel>
            <Select
              value={selectedRouteId}
              label="Route"
              onChange={(e) => setSelectedRouteId(e.target.value)}
            >
              <MenuItem value="">— Select Route —</MenuItem>
              {filteredRoutes.map((r) => (
                <MenuItem key={r.id} value={r.id}>
                  {r.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth disabled={loading}>
            <InputLabel>Tariff Category</InputLabel>
            <Select
              value={selectedTariffCategoryId}
              label="Tariff Category"
              onChange={(e) => setSelectedTariffCategoryId(e.target.value)}
            >
              <MenuItem value="">— Select Tariff Category —</MenuItem>
              {tariffCategories.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleEditConnection}
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : "Update"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default EditConnectionDialog;
