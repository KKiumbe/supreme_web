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

const SimpleAssignTaskDialog = ({
  open,
  onClose,
  taskTitle = "",
  taskDescription = "",
  connectionId = "",
  assigneeId = "",
  NewCustomerId = "", // ✅ receive prop
  onTaskCreated,
  RelatedSurveyId,
  schemeId,
  zoneId = "",
  routeId = "",
  theme,
  tarrifCategoryId
}) => {
  const [users, setUsers] = useState([]);
  const [taskTypes, setTaskTypes] = useState([]);
  const [loading, setLoading] = useState({ users: false, types: false });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: taskTitle,
    description: taskDescription,
    TypeId: "",
    priority: "MEDIUM",
    dueDate: "",
    AssignedTo: assigneeId,
    RelatedConnectionId: connectionId,
    NewCustomerId, // ✅ store initial value
    RelatedSurveyId,
    RelatedSchemeId: schemeId || null,
  RelatedZoneId: zoneId || null,
  RelatedRouteId: routeId || null,
  tarrifCategoryId:tarrifCategoryId
  });

  // ✅ Ensure NewCustomerId updates dynamically when customer is created
// ✅ Keep all linked IDs updated dynamically
useEffect(() => {
  const updates = {};
  if (NewCustomerId) updates.NewCustomerId = NewCustomerId;
if (RelatedSurveyId !== undefined) updates.RelatedSurveyId = RelatedSurveyId;

  if (schemeId) updates.RelatedSchemeId = schemeId;
  if (zoneId) updates.RelatedZoneId = zoneId;
  if (routeId) updates.RelatedRouteId = routeId;
  
  if (Object.keys(updates).length > 0) {
    setFormData((prev) => ({ ...prev, ...updates }));
    console.log("✅ Synced IDs:", updates);
  }
}, [NewCustomerId, RelatedSurveyId, schemeId, zoneId, routeId]);


  // Fetch users and task types
  useEffect(() => {
    if (!open) return;

    const fetchUsers = async () => {
      setLoading((prev) => ({ ...prev, users: true }));
      try {
        const { data } = await axios.get(`${API_URL}/users`, { withCredentials: true });
        setUsers(Array.isArray(data?.data) ? data.data : []);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError("Failed to load users.");
      } finally {
        setLoading((prev) => ({ ...prev, users: false }));
      }
    };

    const fetchTaskTypes = async () => {
      setLoading((prev) => ({ ...prev, types: true }));
      try {
        const { data } = await axios.get(`${API_URL}/get-tasks-types`, { withCredentials: true });
        setTaskTypes(Array.isArray(data) ? data : []);

        // Preselect "Survey" task type if title includes "Survey"
        if (taskTitle.toLowerCase().includes("survey")) {
          const surveyType = data.find((type) => type.name.toLowerCase().includes("survey"));
          if (surveyType) {
            setFormData((prev) => ({ ...prev, TypeId: surveyType.id }));
          }
        }
      } catch (err) {
        console.error("Error fetching task types:", err);
        setError("Failed to load task types.");
      } finally {
        setLoading((prev) => ({ ...prev, types: false }));
      }
    };

    fetchUsers();
    fetchTaskTypes();
  }, [open, taskTitle]);

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    setError("");
  };

  const handleSubmit = async () => {
    setError("");

    if (!formData.title || !formData.TypeId || !formData.AssignedTo) {
      setError("Title, task type, and assignee are required.");
      return;
    }

    setCreating(true);
    try {
      const payload = {
        TypeId: formData.TypeId,
        title: formData.title,
        description: formData.description || null,
        priority: formData.priority,
        dueDate: formData.dueDate || null,
        scheduledAt: formData.dueDate || null,
        AssignedTo: formData.AssignedTo,
        RelatedSurveyId: formData.RelatedSurveyId,
        NewCustomerId: formData.NewCustomerId,
        RelatedSchemeId: formData.RelatedSchemeId,
        RelatedZoneId: formData.RelatedZoneId,
        tariffCategoryId: formData.tarrifCategoryId,
        RelatedRouteId: formData.RelatedRouteId,
        ...(formData.RelatedConnectionId && {
          RelatedConnectionId: formData.RelatedConnectionId,
          
        }),
      };

      console.log("🟢 Task payload before submit:", payload);

      const { data } = await axios.post(`${API_URL}/create-task`, payload, {
        withCredentials: true,
      });

      onTaskCreated?.(data);
      handleClose();
    } catch (err) {
      console.error("Error creating task:", err);
      setError(err.response?.data?.error || "Failed to create task.");
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: taskTitle,
      description: taskDescription,
      TypeId: "",
      priority: "MEDIUM",
      dueDate: "",
      AssignedTo: assigneeId,
      RelatedConnectionId: connectionId,
      NewCustomerId, // ✅ preserve ID on close
    });
    setError("");
    onClose();
  };

  const loadingAll = loading.users || loading.types;

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ bgcolor: theme?.palette?.primary?.main, color: theme?.palette?.primary?.contrastText }}>
        {taskTitle}
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
                Enter task details for the customer. Click Create Task to submit.
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField fullWidth label="Task Title" value={formData.title} onChange={handleChange("title")} required />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                minRows={2}
                value={formData.description}
                onChange={handleChange("description")}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Task Type"
                value={formData.TypeId}
                onChange={handleChange("TypeId")}
                required
                disabled={taskTitle.toLowerCase().includes("survey")}
              >
                <MenuItem value="">— Select Task Type —</MenuItem>
                {taskTypes.map((type) => (
                  <MenuItem key={type.id} value={type.id}>
                    {type.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

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

            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Assignee"
                value={formData.AssignedTo}
                onChange={handleChange("AssignedTo")}
                required
              >
                <MenuItem value="">— Select User —</MenuItem>
                {users.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {`${user.firstName} ${user.lastName}`}
                    {user.roles?.length ? ` — ${user.roles.map((r) => r.role).join(", ")}` : ""}
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
        <Button onClick={handleClose} disabled={creating} sx={{ color: theme?.palette?.secondary?.main }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={creating || !formData.title || !formData.TypeId || !formData.AssignedTo}
          sx={{ color: theme?.palette?.primary?.contrastText }}
        >
          {creating ? "Creating..." : "Create Task"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

SimpleAssignTaskDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  taskTitle: PropTypes.string,
  taskDescription: PropTypes.string,
  connectionId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  assigneeId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  NewCustomerId: PropTypes.string, // ✅ added type
  RelatedSurveyId: PropTypes.string,
  schemeId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), // ✅ added prop validation
  zoneId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), // ✅ added prop validation
  routeId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), // ✅ added prop validation
  tarrifCategoryId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), // ✅ added prop validation
  onTaskCreated: PropTypes.func,
  theme: PropTypes.object,
};

export default SimpleAssignTaskDialog;
