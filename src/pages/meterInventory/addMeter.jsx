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
import { useAuthStore } from "../../store/authStore";
import PropTypes from "prop-types";

const AddMeterModal = ({ open, onClose, onSaved }) => {
  const { currentUser } = useAuthStore();
  const BASEURL = import.meta.env.VITE_BASE_URL;

  const [serialNumber, setSerialNumber] = useState("");
  const [model, setModel] = useState("");
  const [installationDate, setInstallationDate] = useState("");
  const [lastInspectedAt, setLastInspectedAt] = useState("");
  const [status, setStatus] = useState("installed");
  const [meterSize, setMeterSize] = useState("");
  const [connectionId, setConnectionId] = useState("");
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [error, setError] = useState("");

  // Fetch connections
  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const res = await axios.get(`${BASEURL}/connections`, {
          withCredentials: true,
        });
        setConnections(res.data || []);
      } catch (err) {
        console.error("Failed to fetch connections", err);
      } finally {
        setLoadingConnections(false);
      }
    };

    fetchConnections();
  }, [BASEURL]);

  const handleSave = async () => {
    if (!currentUser) {
      return;
    }

    if (!serialNumber) {
      setError("Serial Number is required");
      return;
    }
    if (!status) {
      setError("Status is required");
      return;
    }
    setLoading(true);
    setError("");
    try {
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
        { withCredentials: true },
      );

      // Reset form
      setSerialNumber("");
      setModel("");
      setInstallationDate("");
      setLastInspectedAt("");
      setStatus("installed");
      setMeterSize("");
      setConnectionId("");

      onSaved?.(); // refresh table
      onClose(); // close modal
    } catch (err) {
      console.error(err);
      setError("Failed to save meter");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent>
        {error && <div style={{ color: "red", marginBottom: 8 }}>{error}</div>}
        <Grid container spacing={2} mt={0.5}>
          {/* Serial Number - mandatory */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Serial Number *"
              size="small"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              required
            />
          </Grid>

          {/* Model */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Model"
              size="small"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            />
          </Grid>

          {/* Installation Date */}
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

          {/* Last Inspected */}
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

          {/* Status - mandatory */}
          <Grid item xs={6} sm={4}>
            <TextField
              select
              fullWidth
              size="small"
              label="Status *"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              required
            >
              {["installed", "removed", "faulty", "inactive"].map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Meter Size */}
          <Grid item xs={6} sm={4}>
            <TextField
              fullWidth
              type="number"
              size="small"
              label="Size"
              value={meterSize}
              onChange={(e) =>
                setMeterSize(e.target.value ? Number(e.target.value) : "")
              }
            />
          </Grid>

          {/* Connection ID - dropdown */}
          <Grid item xs={12} sm={4}>
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
          {loading ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
AddMeterModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSaved: PropTypes.func,
};

export default AddMeterModal;
