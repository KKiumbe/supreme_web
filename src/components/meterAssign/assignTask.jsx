import React, { useEffect, useState, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
  Box,
  Typography,
  Grid,
} from "@mui/material";
import axios from "axios";
import PropTypes from "prop-types";

const API_URL = import.meta.env.VITE_BASE_URL || "";

const AssignMeterTaskDialog = ({
  open,
  onClose,
  connectionId = "",
  schemeId = "",
  zoneId = "",
  routeId = "",
  NewCustomerId = "",
  RelatedSurveyId = "",
  assigneeId = "",
  onTaskCreated,
  theme,
}) => {
  const [users, setUsers] = useState([]);
  const [taskTypes, setTaskTypes] = useState([]);
  const [meters, setMeters] = useState([]);
  const [totalMeters, setTotalMeters] = useState(0);

  const [meterSearch, setMeterSearch] = useState("");

  const [loading, setLoading] = useState({
    users: false,
    meters: false,
    types: false,
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    TypeId: "",
    title: "Assign Meter to Connection",
    description: "Assign a meter to this customer connection for installation.",
    priority: "MEDIUM",
    dueDate: "",
    AssignedTo: assigneeId,
    RelatedConnectionId: connectionId,
    RelatedSchemeId: schemeId || null,
    RelatedZoneId: zoneId || null,
    RelatedRouteId: routeId || null,
    RelatedSurveyId,
    NewCustomerId,
    meterId: "",
  });

  /* --------------------------------------------------
     Fetch data when dialog opens
  -------------------------------------------------- */
  useEffect(() => {
    if (!open) return;

    const fetchUsers = async () => {
      setLoading((p) => ({ ...p, users: true }));
      try {
        const { data } = await axios.get(`${API_URL}/users`, {
          withCredentials: true,
        });
        setUsers(Array.isArray(data?.data) ? data.data : []);
      } catch {
        setError("Failed to load users.");
      } finally {
        setLoading((p) => ({ ...p, users: false }));
      }
    };

    const fetchMeters = async () => {
      setLoading((p) => ({ ...p, meters: true }));
      try {
        const { data: response } = await axios.get(`${API_URL}/meters/available`, {
          withCredentials: true,
        });

        // Handle your API response shape
        const meterList = response?.data?.meters || response?.data || [];
        setMeters(Array.isArray(meterList) ? meterList : []);
        setTotalMeters(response?.data?.pagination?.total || meterList.length);
      } catch {
        setError("Failed to load available meters.");
      } finally {
        setLoading((p) => ({ ...p, meters: false }));
      }
    };

    const fetchTaskTypes = async () => {
      setLoading((p) => ({ ...p, types: true }));
      try {
        const { data } = await axios.get(`${API_URL}/get-tasks-types`, {
          withCredentials: true,
        });

        const typesArray = Array.isArray(data) ? data : data?.data || [];
        setTaskTypes(typesArray);

        const meterType = typesArray.find(
          (t) =>
            t.code?.toLowerCase() === "meter_assignment" ||
            t.name?.toLowerCase().includes("meter")
        );

        if (meterType) {
          setFormData((prev) => ({ ...prev, TypeId: meterType.id }));
        }
      } catch {
        setError("Failed to load task types.");
      } finally {
        setLoading((p) => ({ ...p, types: false }));
      }
    };

    fetchUsers();
    fetchMeters();
    fetchTaskTypes();
  }, [open]);

  /* --------------------------------------------------
     Client-side filtering
  -------------------------------------------------- */
  const filteredMeters = useMemo(() => {
    if (!meterSearch.trim()) return meters;

    const q = meterSearch.toLowerCase().trim();

    return meters.filter((m) =>
      (m.serialNumber || "").toLowerCase().includes(q) ||
      (m.model || "").toLowerCase().includes(q) ||
      (m.meterSize || "").toString().includes(q)
    );
  }, [meters, meterSearch]);

  /* --------------------------------------------------
     Helper text for search field
  -------------------------------------------------- */
  const meterHelperText = loading.meters
    ? "Loading available meters..."
    : meterSearch.trim() && filteredMeters.length === 0
    ? "No matching meters found"
    : totalMeters > 0
    ? `${totalMeters} available meter${totalMeters === 1 ? "" : "s"}`
    : "No meters currently available";

  /* --------------------------------------------------
     Handlers
  -------------------------------------------------- */
  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    setError("");
  };

  const handleSubmit = async () => {
    setError("");

    if (!formData.TypeId || !formData.AssignedTo || !formData.meterId) {
      setError("Task type, meter, and assignee are required.");
      return;
    }

    setCreating(true);
    try {
      const payload = {
        connectionId: formData.RelatedConnectionId,
        meterId: formData.meterId,
        assignedTo: formData.AssignedTo,
        dueDate: formData.dueDate || null,
        notes: formData.description,
        applicationId: formData.NewCustomerId || null,
      };

      const { data } = await axios.post(
        `${API_URL}/assign-meter-connection-task`,
        payload,
        { withCredentials: true }
      );

      onTaskCreated?.(data);
      handleClose();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create meter assignment task.");
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    setFormData((p) => ({ ...p, meterId: "", AssignedTo: assigneeId }));
    setMeterSearch("");
    setError("");
    onClose();
  };

  const loadingAll = loading.users || loading.meters || loading.types;

  /* --------------------------------------------------
     Render
  -------------------------------------------------- */
  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle
        sx={{
          bgcolor: theme?.palette?.primary?.main,
          color: theme?.palette?.primary?.contrastText,
        }}
      >
        Assign Meter Task
      </DialogTitle>

      <DialogContent dividers>
        {loadingAll ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Assign an available meter to this connection.
              </Typography>
            </Grid>

            {/* Meter Search */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Search Meter"
                placeholder="Serial number, model..."
                value={meterSearch}
                onChange={(e) => setMeterSearch(e.target.value)}
                helperText={meterHelperText}
                FormHelperTextProps={{
                  sx: {
                    color:
                      filteredMeters.length === 0 && meterSearch.trim()
                        ? "error.main"
                        : "text.secondary",
                  },
                }}
              />
            </Grid>

            {/* Meter Select */}
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Select Meter"
                value={formData.meterId}
                onChange={handleChange("meterId")}
                required
                disabled={loading.meters || meters.length === 0}
                SelectProps={{
                  MenuProps: {
                    PaperProps: { sx: { maxHeight: 340 } },
                  },
                }}
              >
                <MenuItem value="" disabled>
                  — Select an available meter —
                </MenuItem>

                {loading.meters ? (
                  <MenuItem disabled>
                    <CircularProgress size={20} sx={{ mr: 2 }} /> Loading...
                  </MenuItem>
                ) : filteredMeters.length === 0 ? (
                  <MenuItem disabled>
                    {meterSearch.trim() ? "No matching meters" : "No available meters"}
                  </MenuItem>
                ) : (
                  filteredMeters.map((meter) => (
                    <MenuItem key={meter.id} value={meter.id}>
                      {meter.serialNumber}
                      {meter.model && ` — ${meter.model}`}
                      {meter.meterSize && ` (${meter.meterSize})`}
                    </MenuItem>
                  ))
                )}
              </TextField>
            </Grid>

            {/* Priority */}
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Priority"
                value={formData.priority}
                onChange={handleChange("priority")}
              >
                {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((p) => (
                  <MenuItem key={p} value={p}>
                    {p}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Due Date */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Due Date"
                type="date"
                value={formData.dueDate}
                onChange={handleChange("dueDate")}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Assignee */}
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Assign To"
                value={formData.AssignedTo}
                onChange={handleChange("AssignedTo")}
                required
              >
                <MenuItem value="" disabled>
                  — Select User —
                </MenuItem>
                {users.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.firstName} {u.lastName}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {error && (
              <Grid item xs={12}>
                <Typography color="error" variant="body2">
                  {error}
                </Typography>
              </Grid>
            )}
          </Grid>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={creating}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={
            creating ||
            !formData.meterId ||
            !formData.AssignedTo ||
            !formData.TypeId
          }
        >
          {creating ? "Creating..." : "Create Task"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

AssignMeterTaskDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  connectionId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  schemeId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  zoneId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  routeId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  NewCustomerId: PropTypes.string,
  RelatedSurveyId: PropTypes.string,
  assigneeId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onTaskCreated: PropTypes.func,
  theme: PropTypes.object,
};

export default AssignMeterTaskDialog;