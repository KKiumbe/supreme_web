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

// TypeId,
//       title,
//       description,
//       RelatedConnectionId,
      
//       priority = "MEDIUM",
//       dueDate,
//       scheduledAt,
//       AssignedTo,

const TaskforConnection = ({
  open,
  onClose,
  taskTitle = "",
  description = "",
  connectionId = "",
  assigneeId = "",

  onTaskCreated,

  theme,
  
}) => {
  const [users, setUsers] = useState([]);
  const [taskTypes, setTaskTypes] = useState([]);
  const [loading, setLoading] = useState({ users: false, types: false });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: taskTitle,
    description: description,
    TypeId: "",
    priority: "MEDIUM",
    dueDate: "",
    AssignedTo: assigneeId,
    RelatedConnectionId: connectionId,
   
   
  
  });

  // ✅ Ensure NewCustomerId updates dynamically when customer is created
// ✅ Keep all linked IDs updated dynamically
useEffect(() => {
  const updates = {};
  
  if (assigneeId) {
    updates.AssignedTo = assigneeId;
  }
  
  if (connectionId) {
    updates.RelatedConnectionId = connectionId;
  }
  
  if (Object.keys(updates).length > 0) {
    setFormData((prev) => ({ ...prev, ...updates }));
    console.log("✅ Synced IDs:", updates);
  }
}, []);


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
        
        ...(formData.RelatedConnectionId && {
          RelatedConnectionId: formData.RelatedConnectionId,
          
        }),
      };

      console.log("🟢 Task payload before submit:", payload);

      const { data } = await axios.post(`${API_URL}/create-task-for-connection`, payload, {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
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
      description: description,
      TypeId: "",
      priority: "MEDIUM",
      dueDate: "",
      AssignedTo: assigneeId,
      RelatedConnectionId: connectionId,
      
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
  onChange={(e) =>
    setFormData((prev) => ({ ...prev, TypeId: e.target.value }))
  }
  required
  
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

TaskforConnection.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  taskTitle: PropTypes.string,
  description: PropTypes.string,
  connectionId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  assigneeId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  
  onTaskCreated: PropTypes.func,
  theme: PropTypes.object,
};

export default TaskforConnection;
