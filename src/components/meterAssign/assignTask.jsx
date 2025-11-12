import React, { useEffect, useState } from "react";
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
  const [loading, setLoading] = useState({ users: false, meters: false, types: false });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    TypeId: "",
    title: "Assign Meter to Connection",
    description: "Assign a meter to this customer connection for installation.",
    priority: "MEDIUM",
    dueDate: "",
    scheduledAt: "",
    AssignedTo: assigneeId,
    RelatedConnectionId: connectionId,
    RelatedSchemeId: schemeId || null,
    RelatedZoneId: zoneId || null,
    RelatedRouteId: routeId || null,
    RelatedSurveyId,
    NewCustomerId,
    meterId: "",
  });

  // ✅ Fetch users, meters, and task types
  useEffect(() => {
    if (!open) return;

    const fetchUsers = async () => {
      setLoading((p) => ({ ...p, users: true }));
      try {
        const { data } = await axios.get(`${API_URL}/users`, { withCredentials: true });
        setUsers(Array.isArray(data?.data) ? data.data : []);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError("Failed to load users.");
      } finally {
        setLoading((p) => ({ ...p, users: false }));
      }
    };

  const fetchMeters = async () => {
  setLoading((p) => ({ ...p, meters: true }));
  try {
    const { data } = await axios.get(`${API_URL}/meters/available`, { withCredentials: true });

    // ✅ The backend returns { success, message, data: [...] }
    setMeters(Array.isArray(data?.data) ? data.data : []);
  } catch (err) {
    console.error("Error fetching meters:", err);
    setError("Failed to load available meters.");
  } finally {
    setLoading((p) => ({ ...p, meters: false }));
  }
};


    const fetchTaskTypes = async () => {
      setLoading((p) => ({ ...p, types: true }));
      try {
        const { data } = await axios.get(`${API_URL}/get-tasks-types`, { withCredentials: true });
        setTaskTypes(Array.isArray(data) ? data : []);

        const meterType = data.find(
          (type) =>
            type.code?.toLowerCase() === "meter_assignment" ||
            type.name?.toLowerCase().includes("meter")
        );
        if (meterType) {
          setFormData((prev) => ({ ...prev, TypeId: meterType.id }));
        }
      } catch (err) {
        console.error("Error fetching task types:", err);
        setError("Failed to load task types.");
      } finally {
        setLoading((p) => ({ ...p, types: false }));
      }
    };

    fetchUsers();
    fetchMeters();
    fetchTaskTypes();
  }, [open]);

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
  connectionId: formData.RelatedConnectionId, // ✅ renamed
  meterId: formData.meterId,
  assignedTo: formData.AssignedTo, // ✅ renamed
  dueDate: formData.dueDate || null,
  notes: formData.description, // optional mapping
  applicationId: formData.NewCustomerId || null, // ✅ if this matches CustomerApplication
  tariffCategoryId: formData.tariffCategoryId || null, // optional
  // You can keep others if backend ignores unknown keys
};
      console.log("🟢 Assign Meter Task Payload:", payload);

      const { data } = await axios.post(`${API_URL}/assign-meter-connection-task`, payload, {
        withCredentials: true,
      });

      onTaskCreated?.(data);
      handleClose();
    } catch (err) {
      console.error("Error creating assign meter task:", err);
      setError(err.response?.data?.error || "Failed to create meter task.");
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    setFormData((prev) => ({
      ...prev,
      meterId: "",
      AssignedTo: assigneeId,
    }));
    setError("");
    onClose();
  };

  const loadingAll = loading.users || loading.meters || loading.types;

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
          <Box display="flex" justifyContent="center" py={3}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary" mb={2}>
                Fill in details to assign a meter installation task.
              </Typography>
            </Grid>

            {/* Meter Selector */}
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Select Meter"
                value={formData.meterId}
                onChange={handleChange("meterId")}
                required
              >
                <MenuItem value="">— Select Meter —</MenuItem>
                {meters.map((meter) => (
                  <MenuItem key={meter.id} value={meter.id}>
                    {`${meter.serialNumber} — ${meter.status}`}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Priority */}
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Priority"
                value={formData.priority}
                onChange={handleChange("priority")}
              >
                {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((priority) => (
                  <MenuItem key={priority} value={priority}>
                    {priority}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Due Date */}
            <Grid item xs={12}>
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
                <MenuItem value="">— Select User —</MenuItem>
                {users.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {`${user.firstName} ${user.lastName}`}
                    {user.roles?.length
                      ? ` — ${user.roles.map((r) => r.role).join(", ")}`
                      : ""}
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
        <Button
          onClick={handleClose}
          disabled={creating}
          sx={{ color: theme?.palette?.secondary?.main }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={creating || !formData.meterId || !formData.AssignedTo}
          sx={{ color: theme?.palette?.primary?.contrastText }}
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
