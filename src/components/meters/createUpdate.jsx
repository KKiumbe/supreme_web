import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Button,
  Grid,
  CircularProgress,
} from "@mui/material";
import { Save as SaveIcon } from "@mui/icons-material";
import axios from "axios";
import PropTypes from "prop-types";
import { useAuthStore } from "../../store/authStore";

const AddOrEditMeterModal = ({ open, onClose, onSaved, meter }) => {
  const { currentUser } = useAuthStore();
  const BASEURL = import.meta.env.VITE_BASE_URL;

  // Form states
  const [serialNumber, setSerialNumber] = useState("");
  const [model, setModel] = useState("");
  const [installationDate, setInstallationDate] = useState("");
  const [lastInspectedAt, setLastInspectedAt] = useState("");
  const [status, setStatus] = useState("IN_STOCK");
  const [meterSize, setMeterSize] = useState("");
  const [connectionId, setConnectionId] = useState("");
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingConnections, setLoadingConnections] = useState(true);

  // Load connections
  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const res = await axios.get(`${BASEURL}/connections`, { withCredentials: true });
        setConnections(res.data || []);
      } catch (err) {
        console.error("Failed to fetch connections", err);
      } finally {
        setLoadingConnections(false);
      }
    };
    fetchConnections();
  }, [BASEURL]);

  // Pre-fill data when editing
  useEffect(() => {
    if (meter) {
      setSerialNumber(meter.serialNumber || "");
      setModel(meter.model || "");
      setInstallationDate(meter.installationDate?.split("T")[0] || "");
      setLastInspectedAt(meter.lastInspectedAt?.split("T")[0] || "");
      setStatus(meter.status || "IN_STOCK");
      setMeterSize(meter.meterSize || "");
      setConnectionId(meter.connectionId || "");
    } else {
      // reset if no meter passed
      setSerialNumber("");
      setModel("");
      setInstallationDate("");
      setLastInspectedAt("");
      setStatus("IN_STOCK");
      setMeterSize("");
      setConnectionId("");
    }
  }, [meter]);

  // Save or update meter
  const handleSave = async () => {
    if (!currentUser) return;

    if (!serialNumber) {
      alert("Serial Number is required");
      return;
    }

    setLoading(true);
    try {
      if (meter) {
        // 🟦 UPDATE METER
        await axios.put(
          `${BASEURL}/update-meter/${meter.id}/status`,
          { status },
          { withCredentials: true }
        );
      } else {
        // 🟩 CREATE METER
        await axios.post(
          `${BASEURL}/meter`,
          {
            serialNumber,
            model,
            installationDate: installationDate || undefined,
            lastInspectedAt: lastInspectedAt || undefined,
            status,
            meterSize: meterSize === "" ? undefined : Number(meterSize),
            connectionId: connectionId === "" ? undefined : Number(connectionId),
          },
          { withCredentials: true }
        );
      }

      onSaved?.(); // refresh table
      onClose();   // close modal
    } catch (err) {
      console.error("Error saving meter:", err);
      alert("Failed to save meter");
    } finally {
      setLoading(false);
    }
  };

  const statuses = [
    "IN_STOCK",
    "CONNECTED",
    "FAULTY",
    "UNDER_MAINTENANCE",
    "DISCONNECTED",
    "LOST",
  ];

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{meter ? "Update Meter Status" : "Add Meter"}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} mt={0.5}>
          {/* Serial Number */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Serial Number *"
              size="small"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              required
              disabled={!!meter} // can't change serial number on update
            />
          </Grid>

          {/* Model */}
          {!meter && (
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Model"
                size="small"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              />
            </Grid>
          )}

          {/* Dates */}
          {!meter && (
            <>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  size="small"
                  label="Installation Date"
                  InputLabelProps={{ shrink: true }}
                  value={installationDate}
                  onChange={(e) => setInstallationDate(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  size="small"
                  label="Last Inspected"
                  InputLabelProps={{ shrink: true }}
                  value={lastInspectedAt}
                  onChange={(e) => setLastInspectedAt(e.target.value)}
                />
              </Grid>
            </>
          )}

          {/* Status */}
          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              size="small"
              label="Status *"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              required
            >
              {statuses.map((s) => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Meter Size */}
          {!meter && (
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                size="small"
                label="Meter Size"
                value={meterSize}
                onChange={(e) =>
                  setMeterSize(e.target.value ? Number(e.target.value) : "")
                }
              />
            </Grid>
          )}

          {/* Connection */}
          {!meter && (
            <Grid item xs={12}>
              {loadingConnections ? (
                <CircularProgress size={24} />
              ) : (
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Connection"
                  value={connectionId}
                  onChange={(e) => setConnectionId(e.target.value)}
                >
                  <MenuItem value="">None</MenuItem>
                  {connections.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name || `Connection #${c.id}`}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={loading}
        >
          {loading
            ? "Saving..."
            : meter
            ? "Update Status"
            : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

AddOrEditMeterModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSaved: PropTypes.func,
  meter: PropTypes.object, // optional, when updating
};

export default AddOrEditMeterModal;
