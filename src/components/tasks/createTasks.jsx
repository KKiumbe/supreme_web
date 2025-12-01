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
import dayjs from "dayjs";

const API_URL = import.meta.env.VITE_BASE_URL;

const AssignTaskDialog = ({ open, onClose, taskId, onAssigned, theme, connectionId, customerId }) => {
  const [users, setUsers] = useState([]);
  const [taskTypes, setTaskTypes] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState({ users: false, types: false, schemes: false, connections: false });
  const [assigning, setAssigning] = useState(false);
  const [stage, setStage] = useState(1); // Stage 1: Task Details, Stage 2: Zone/Route, Stage 3: Connection/Confirm
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    TypeId: "",
    priority: "MEDIUM",
    dueDate: "",
    AssignedTo: "",
    note: "",
    schemeId: "",
    zoneId: "",
    routeId: "",
    RelatedConnectionId: "",
    connectionSearch: "",
  });
  const [error, setError] = useState("");

  const isCreateMode = taskId === null;

  // Fetch users and task types (Stage 1)
  useEffect(() => {
    if (!open || stage !== 1) return;

    const fetchUsers = async () => {
      setLoading((prev) => ({ ...prev, users: true }));
      try {
        const { data } = await axios.get(`${API_URL}/users`, { withCredentials: true });
        setUsers(Array.isArray(data?.data) ? data.data : []);
      } catch (err) {
        console.error("Error fetching users:", err);
        setUsers([]);
      } finally {
        setLoading((prev) => ({ ...prev, users: false }));
      }
    };

    const fetchTaskTypes = async () => {
      setLoading((prev) => ({ ...prev, types: true }));
      try {
        const { data } = await axios.get(`${API_URL}/get-tasks-types`, { withCredentials: true });
        setTaskTypes(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching task types:", err);
        setTaskTypes([]);
      } finally {
        setLoading((prev) => ({ ...prev, types: false }));
      }
    };

    fetchUsers();
    fetchTaskTypes();
  }, [open, stage]);

  // Fetch schemes (Stage 2)
  useEffect(() => {
    if (!open || stage !== 2) return;

    const fetchSchemes = async () => {
      setLoading((prev) => ({ ...prev, schemes: true }));
      try {
        const { data } = await axios.get(`${API_URL}/schemes`, { withCredentials: true });
        setSchemes(Array.isArray(data?.data) ? data.data : []);
      } catch (err) {
        console.error("Error fetching schemes:", err);
        setSchemes([]);
      } finally {
        setLoading((prev) => ({ ...prev, schemes: false }));
      }
    };

    fetchSchemes();
  }, [open, stage]);

  // Fetch connections (Stage 3)
  useEffect(() => {
    if (!open || stage !== 3) return;

    const fetchConnections = async () => {
      setLoading((prev) => ({ ...prev, connections: true }));
      try {
        const params = {
          page: 1,
          limit: 100,
          ...(formData.schemeId && { schemeId: formData.schemeId }),
          ...(formData.zoneId && { zoneId: formData.zoneId }),
          ...(formData.routeId && { routeId: formData.routeId }),
          ...(formData.connectionSearch && { search: formData.connectionSearch }),
        };
        const { data } = await axios.get(`${API_URL}/customers`, {
          params,
          withCredentials: true,
        });
        setConnections(Array.isArray(data?.data?.customers) ? data.data.customers : []);
      } catch (err) {
        console.error("Error fetching connections:", err);
        setConnections([]);
      } finally {
        setLoading((prev) => ({ ...prev, connections: false }));
      }
    };

    fetchConnections();
  }, [open, stage, formData.schemeId, formData.zoneId, formData.routeId, formData.connectionSearch]);

  // Handle input changes
  const handleChange = (field) => (e) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
      // Reset dependent fields and ensure mutual exclusivity
      ...(field === "schemeId" ? { zoneId: "", routeId: "", RelatedConnectionId: "" } : {}),
      ...(field === "zoneId" ? { routeId: "", RelatedConnectionId: "" } : {}),
      ...(field === "routeId" ? { RelatedConnectionId: "" } : {}),
      ...(field === "RelatedConnectionId" ? { zoneId: "", routeId: "" } : {}),
    }));
    if (field === "AssignedTo" || field === "TypeId" || field === "title") setError("");
  };

  // Navigate to next stage
  const handleNext = () => {
    if (stage === 1) {
      if (!formData.title || !formData.TypeId || !formData.AssignedTo) {
        setError("Title, task type, and assignee are required.");
        return;
      }
      setStage(2);
    } else if (stage === 2) {
      setStage(3);
    }
  };

  // Navigate to previous stage
  const handleBack = () => {
    setStage(stage - 1);
    setError("");
  };

  // Handle task creation or assignment
  const handleSubmit = async () => {
    setError("");

    if (!formData.AssignedTo) {
      setError("Please select an assignee.");
      return;
    }

    if (isCreateMode && (!formData.title || !formData.TypeId)) {
      setError("Title and task type are required.");
      return;
    }

    setAssigning(true);
    try {
      if (isCreateMode) {
        // Create task
        const payload = {
          TypeId: formData.TypeId,
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          dueDate: formData.dueDate || null,
          scheduledAt: formData.dueDate || null,
          AssignedTo: formData.AssignedTo,
          ...(formData.RelatedConnectionId && { RelatedConnectionId: formData.RelatedConnectionId }),
          ...(formData.zoneId && !formData.RelatedConnectionId && !formData.routeId && { zoneId: formData.zoneId }),
          ...(formData.routeId && !formData.RelatedConnectionId && { routeId: formData.routeId }),
        };
        const { data } = await axios.post(`${API_URL}/create-task`, payload, {
          withCredentials: true,
        });
        onAssigned?.(data);
      } else {
        // Assign task
        const payload = {
          userId: formData.AssignedTo,
          taskTypeId: formData.TypeId || null,
          note: formData.note,
        };
        const { data } = await axios.post(`${API_URL}/tasks/${taskId}/assign`, payload, {
          withCredentials: true,
        });
        onAssigned?.(data);
      }
      handleClose();
    } catch (err) {
      console.error(`Error ${isCreateMode ? "creating" : "assigning"} task:`, err);
      setError(err.response?.data?.error || `Failed to ${isCreateMode ? "create" : "assign"} task.`);
    } finally {
      setAssigning(false);
    }
  };

  // Reset form and close dialog
  const handleClose = () => {
    setFormData({
      title: "",
      description: "",
      TypeId: "",
      priority: "MEDIUM",
      dueDate: "",
      AssignedTo: "",
      note: "",
      schemeId: "",
      zoneId: "",
      routeId: "",
      RelatedConnectionId: "",
      connectionSearch: "",
    });
    setStage(1);
    setError("");
    onClose();
  };

  // Filter zones and routes based on selections
  const selectedScheme = schemes.find((s) => s.id === formData.schemeId);
  const zones = selectedScheme?.zones || [];
  const selectedZone = zones.find((z) => z.id === formData.zoneId);
  const routes = selectedZone?.routes || [];

  // Get display names for confirmation
  const taskTypeName = taskTypes.find((t) => t.id === formData.TypeId)?.name || "N/A";
  const assigneeName = users.find((u) => u.id === formData.AssignedTo)
    ? `${users.find((u) => u.id === formData.AssignedTo).firstName} ${users.find((u) => u.id === formData.AssignedTo).lastName}`
    : "N/A";
  const connectionName = connections.find((c) => c.connections[0]?.id === formData.RelatedConnectionId)
    ? `${connections.find((c) => c.connections[0]?.id === formData.RelatedConnectionId).customerName}`
    : null;
  const zoneName = zones.find((z) => z.id === formData.zoneId)?.name || null;
  const routeName = routes.find((r) => r.id === formData.routeId)?.name || null;
  const assignmentDisplay = connectionName
    ? `Connection: ${connectionName}`
    : zoneName
    ? `Zone: ${zoneName}`
    : routeName
    ? `Route: ${routeName}`
    : "None";

  const loadingAll = loading.users || loading.types || loading.schemes || loading.connections;

  return (
    <Dialog open={open} onClose={handleClose} >
      <DialogTitle>
        {isCreateMode
          ? stage === 1
            ? "Create Task"
            : stage === 2
            ? "Assign Zone or Route"
            : "Assign Connection or Confirm"
          : "Assign Task"}
      </DialogTitle>

      <DialogContent dividers>
        {loadingAll ? (
          <Box display="flex" justifyContent="center" py={3}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={2}>
            {stage === 1 && (
              <>
                {isCreateMode && (
                  <Grid item xs={12}>
                  
                  </Grid>
                )}

                {/* Title (Create Mode Only) */}
                {isCreateMode && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Task Title"
                      value={formData.title}
                      onChange={handleChange("title")}
                      required
                    />
                  </Grid>
                )}

                {/* Description (Create Mode Only) */}
                {isCreateMode && (
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
                )}

                {/* Task Type */}
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    label="Task Type"
                    value={formData.TypeId}
                    onChange={handleChange("TypeId")}
                    required={isCreateMode}
                  >
                    <MenuItem value="">— Select Task Type —</MenuItem>
                    {taskTypes.map((type) => (
                      <MenuItem key={type.id} value={type.id}>
                        {type.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* Priority (Create Mode Only) */}
                {isCreateMode && (
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
                )}

                {/* Due Date (Create Mode Only) */}
                {isCreateMode && (
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
                )}

                {/* Assignee */}
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

                {/* Note (Assign Mode Only) */}
                {!isCreateMode && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Assignment Note (optional)"
                      multiline
                      minRows={2}
                      value={formData.note}
                      onChange={handleChange("note")}
                    />
                  </Grid>
                )}

                 <Typography variant="body3" color="textSecondary" mb={2} align="center" p={2}>
                      Click Next to assign the task to a zone/route or a connection
                    </Typography>
              </>
              
            )}
             

            {stage === 2 && isCreateMode && (
              <>
                <Grid item xs={12}>
                
                </Grid>

                {/* Scheme */}
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    label="Scheme"
                    value={formData.schemeId}
                    onChange={handleChange("schemeId")}
                  >
                    <MenuItem value="">— Select Scheme —</MenuItem>
                    {schemes.map((scheme) => (
                      <MenuItem key={scheme.id} value={scheme.id}>
                        {scheme.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* Zone */}
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    label="Zone"
                    value={formData.zoneId}
                    onChange={handleChange("zoneId")}
                    disabled={!formData.schemeId || formData.routeId}
                  >
                    <MenuItem value="">— Select Zone —</MenuItem>
                    {zones.map((zone) => (
                      <MenuItem key={zone.id} value={zone.id}>
                        {zone.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* Route */}
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    label="Route"
                    value={formData.routeId}
                    onChange={handleChange("routeId")}
                    disabled={!formData.zoneId}
                  >
                    <MenuItem value="">— Select Route —</MenuItem>
                    {routes.map((route) => (
                      <MenuItem key={route.id} value={route.id}>
                        {route.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Typography variant="body3" color="textSecondary" mb={2} align="center" p={2}>
                      Click Next skip ,to assign the task to a connection
                    </Typography>
              </>
            )}

            {stage === 3 && isCreateMode && (
              <>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary" mb={2}>
                    Select a connection or confirm to create the task.
                  </Typography>
                </Grid>

                {/* Connection Search */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Search Customer"
                    value={formData.connectionSearch}
                    onChange={handleChange("connectionSearch")}
                    placeholder="Enter customer name"
                    disabled={formData.zoneId || formData.routeId}
                  />
                </Grid>

                {/* Connection */}
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    label="Connection"
                    value={formData.RelatedConnectionId}
                    onChange={handleChange("RelatedConnectionId")}
                    disabled={loading.connections || formData.zoneId || formData.routeId}
                  >
                    <MenuItem value="">— Select Connection —</MenuItem>
                    {connections.map((customer) => (
                      <MenuItem key={customer.connections[0]?.id} value={customer.connections[0]?.id}>
                        {`${customer.customerName} — ${customer.schemeName || "N/A"} / ${customer.zoneName || "N/A"} / ${customer.routeName || "N/A"}`}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* Confirmation Summary */}
                <Grid item xs={12} mt={2}>
                  <Typography variant="h6" mb={2}>
                    Task Details
                  </Typography>
                  <Typography variant="body1">
                    <strong>Title:</strong> {formData.title}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Description:</strong> {formData.description || "N/A"}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Task Type:</strong> {taskTypeName}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Priority:</strong> {formData.priority}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Due Date:</strong>{" "}
                    {formData.dueDate ? dayjs(formData.dueDate).format("MMM D, YYYY") : "N/A"}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Assignee:</strong> {assigneeName}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Assignment:</strong> {assignmentDisplay}
                  </Typography>
                </Grid>
              </>
            )}

            {/* Error Message */}
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
        {stage === 1 ? (
          <>
            <Button onClick={handleClose} disabled={assigning}
            sx={{ color: theme?.palette?.secondary?.main }}
            >
              Cancel
            </Button>
            {isCreateMode ? (
              <>
                <Button
                 variant="outlined"
                  onClick={handleSubmit}
                  disabled={assigning || !formData.AssignedTo || !formData.title || !formData.TypeId}
                     
                >
                  {assigning ? "Creating..." : "Create Task"}
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleNext}
                  disabled={assigning || !formData.AssignedTo || !formData.title || !formData.TypeId}
               
                   sx={{ color: theme?.palette?.primary?.contrastText }}

                   
                
                >
                  Next
                </Button>
              </>
            ) : (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={assigning || !formData.AssignedTo}
              >
                {assigning ? "Assigning..." : "Assign Task"}
              </Button>
            )}
          </>
        ) : (
          <>
            <Button onClick={handleBack} disabled={assigning}>
              Back
            </Button>
            {stage === 2 ? (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={assigning}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={assigning}
              >
                {assigning ? "Creating..." : "Confirm Task"}
              </Button>
            )}
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

AssignTaskDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  taskId: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.oneOf([null])]),
  onAssigned: PropTypes.func,
  theme: PropTypes.shape({
    palette: PropTypes.shape({
      secondary: PropTypes.shape({
        main: PropTypes.string,
      }),
      primary: PropTypes.shape({
        main: PropTypes.string,
        contrastText: PropTypes.string,
      }),
    }),
  }),
};

export default AssignTaskDialog;