import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  MenuItem,
  Grid,
  CircularProgress,
  Alert,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { debounce } from "lodash";

const API_URL = import.meta.env.VITE_BASE_URL;

const SCOPE_TYPES = [
  { value: "CONNECTION", label: "Single Connection" },
  { value: "ROUTE", label: "Connections in Route" },
  { value: "ZONE", label: "Connections in Zone" },
  { value: "SCHEME", label: "Connections in Scheme" },
];

const PRIORITY_OPTIONS = ["LOW", "MEDIUM", "HIGH", "URGENT"];

const CreateDisconnectionTaskPage = ({
  initialData = null,      // for dialog mode
  onTaskCreated = null,
  onCancel = null,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const prefill = initialData || location.state || {};

  // Form state matching backend payload
  const [formData, setFormData] = useState({
    title: "Create Disconnection Task",
    description: "This a task to disconnect a connection",
    priority: "HIGH",
    dueDate: "",
    AssignedTo: "",
    TypeId: "",
    scopeType: "ROUTE",
  });

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedConnection, setSelectedConnection] = useState(null);

  const [users, setUsers] = useState([]);
  const [taskTypes, setTaskTypes] = useState([]);

  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);

  const [schemes, setSchemes] = useState([]);
  const [selectedSchemeId, setSelectedSchemeId] = useState("");
  const [selectedZoneId, setSelectedZoneId] = useState("");
  const [selectedRouteId, setSelectedRouteId] = useState("");

  const [loading, setLoading] = useState({
    meta: false,
    customers: false,
    schemes: false,
    submitting: false,
  });

  const [error, setError] = useState("");

  // ────────────────────────────────────────────────
  // Fetch users & task types
  // ────────────────────────────────────────────────
  useEffect(() => {
    const fetchMeta = async () => {
      setLoading((prev) => ({ ...prev, meta: true }));
      setError("");

      try {
        const [usersRes, typesRes] = await Promise.all([
          axios.get(`${API_URL}/users`, { withCredentials: true }),
          axios.get(`${API_URL}/get-tasks-types`, { withCredentials: true }),
        ]);

        setUsers(usersRes.data?.data || []);

        // Handle different possible response shapes
        const typesData = Array.isArray(typesRes.data)
          ? typesRes.data
          : typesRes.data?.data || [];
        setTaskTypes(typesData);

        // Optional: auto-select disconnection type if you want
        const disconnection = typesData.find(
          (t) => t.name?.toUpperCase() === "DISCONNECTION"
        );
        if (disconnection) {
          setFormData((prev) => ({ ...prev, TypeId: disconnection.id }));
        }
      } catch (err) {
        console.error("Meta fetch error:", err);
        setError("Failed to load users and task types");
      } finally {
        setLoading((prev) => ({ ...prev, meta: false }));
      }
    };

    fetchMeta();
  }, []);

  // ────────────────────────────────────────────────
  // Fetch customers
  // ────────────────────────────────────────────────
  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading((prev) => ({ ...prev, customers: true }));

      try {
        const res = await axios.get(`${API_URL}/customers`, {
          withCredentials: true,
        });
        const list = res.data?.data?.customers || [];
        setCustomers(list);
        setFilteredCustomers(list);
      } catch (err) {
        console.error("Customers fetch error:", err);
        setCustomers([]);
        setFilteredCustomers([]);
      } finally {
        setLoading((prev) => ({ ...prev, customers: false }));
      }
    };

    fetchCustomers();
  }, []);

  // ────────────────────────────────────────────────
  // Fetch schemes (with zones & routes)
  // ────────────────────────────────────────────────
  useEffect(() => {
    const fetchSchemes = async () => {
      setLoading((prev) => ({ ...prev, schemes: true }));

      try {
        const res = await axios.get(`${API_URL}/schemes`, {
          withCredentials: true,
        });

        if (res.data?.success && Array.isArray(res.data.data)) {
          setSchemes(res.data.data);
        } else {
          setSchemes([]);
        }
      } catch (err) {
        console.error("Schemes fetch error:", err);
        setSchemes([]);
      } finally {
        setLoading((prev) => ({ ...prev, schemes: false }));
      }
    };

    fetchSchemes();
  }, []);

  // ────────────────────────────────────────────────
  // Prefill from dialog props or navigation state
  // ────────────────────────────────────────────────
  useEffect(() => {
    if (!prefill.connectionId) return;

    const fakeCustomer = {
      id: prefill.customerId,
      customerName: prefill.customerName || "Unknown",
      connections: [
        {
          id: prefill.connectionId,
          connectionNumber: prefill.connectionNumber,
          schemeId: prefill.schemeId,
          zoneId: prefill.zoneId,
          routeId: prefill.routeId,
        },
      ],
    };

    setSelectedCustomer(fakeCustomer);
    setSelectedConnection(fakeCustomer.connections[0]);

    setFormData((prev) => ({
      ...prev,
      title: `Disconnect Conn #${prefill.connectionNumber}`,
      description: `Disconnection request for ${prefill.customerName || "customer"}`,
    }));

    if (prefill.schemeId) setSelectedSchemeId(prefill.schemeId);
    if (prefill.zoneId) setSelectedZoneId(prefill.zoneId);
    if (prefill.routeId) setSelectedRouteId(prefill.routeId);
  }, [prefill]);

  // ────────────────────────────────────────────────
  // Debounced customer search
  // ────────────────────────────────────────────────
  const searchCustomers = useCallback(
    debounce(async (query) => {
      if (!query?.trim()) {
        setFilteredCustomers(customers);
        return;
      }
      try {
        const res = await axios.get(`${API_URL}/customers`, {
          params: { search: query },
          withCredentials: true,
        });
        setFilteredCustomers(res.data?.data?.customers || []);
      } catch {
        setFilteredCustomers(customers);
      }
    }, 400),
    [customers]
  );

  // ────────────────────────────────────────────────
  // Form change handler
  // ────────────────────────────────────────────────
  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (["title", "AssignedTo", "TypeId"].includes(field)) {
      setError("");
    }
  };

  // ────────────────────────────────────────────────
  // Submit
  // ────────────────────────────────────────────────
  const handleSubmit = async () => {
    setError("");

    if (!formData.TypeId) {
      setError("Please select a task type");
      return;
    }
    if (!formData.AssignedTo) {
      setError("Please select an assignee");
      return;
    }
    if (!formData.title.trim()) {
      setError("Task title is required");
      return;
    }
    if (formData.scopeType === "CONNECTION" && !selectedConnection?.id) {
      setError("Please select a connection");
      return;
    }
    if (formData.scopeType !== "CONNECTION" && !selectedSchemeId) {
      setError("Please select a scheme");
      return;
    }

    setLoading((prev) => ({ ...prev, submitting: true }));

    try {
      const payload = {
        TypeId: Number(formData.TypeId),
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        dueDate: formData.dueDate || null,
        scheduledAt: formData.dueDate || null,
        AssignedTo: Number(formData.AssignedTo),
        scopeType: formData.scopeType,
      };

      // Add location ID based on scope
      if (formData.scopeType === "CONNECTION") {
        payload.connectionId = Number(selectedConnection.id);
      } else if (formData.scopeType === "ROUTE") {
        payload.routeId = Number(selectedRouteId);
      } else if (formData.scopeType === "ZONE") {
        payload.zoneId = Number(selectedZoneId);
      } else if (formData.scopeType === "SCHEME") {
        payload.schemeId = Number(selectedSchemeId);
      }

      await axios.post(`${API_URL}/tasks/disconnection`, payload, {
        withCredentials: true,
      });

      if (onTaskCreated) {
        onTaskCreated();
      } else {
        navigate("/connections", {
          state: { message: "Disconnection task created", severity: "success" },
        });
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to create task";
      setError(msg);
      console.error(err);
    } finally {
      setLoading((prev) => ({ ...prev, submitting: false }));
    }
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    else navigate(-1);
  };

  // ────────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────────
  if (loading.meta) {
    return (
      <Box display="flex" justifyContent="center" py={10}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: initialData ? 0 : 3 }}>
      <Paper sx={{ p: 3, maxWidth: 900, mx: "auto" }}>
        <Typography variant="h5" gutterBottom>
          
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <Grid container spacing={2.5}>
          {/* Task Type */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Task Type</InputLabel>
              <Select
                value={formData.TypeId}
                label="Task Type"
                onChange={handleChange("TypeId")}
              >
                <MenuItem value="">— Select Task Type —</MenuItem>
                {taskTypes.map((type) => (
                  <MenuItem key={type.id} value={type.id}>
                    {type.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Scope */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Scope</InputLabel>
              <Select
                value={formData.scopeType}
                label="Scope"
                onChange={handleChange("scopeType")}
              >
                {SCOPE_TYPES.map((s) => (
                  <MenuItem key={s.value} value={s.value}>
                    {s.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Customer + Connection (only for single connection) */}
          {formData.scopeType === "CONNECTION" && (
            <>
              <Grid item xs={12}>
                <Autocomplete
                  options={filteredCustomers}
                  value={selectedCustomer}
                  onChange={(_, val) => {
                    setSelectedCustomer(val);
                    setSelectedConnection(null);
                  }}
                  onInputChange={(_, val) => searchCustomers(val)}
                  getOptionLabel={(opt) =>
                    opt.customerName + (opt.phoneNumber ? ` — ${opt.phoneNumber}` : "")
                  }
                  renderInput={(params) => (
                    <TextField {...params} label="Search Customer" fullWidth />
                  )}
                />
              </Grid>

              {selectedCustomer && (
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Connection</InputLabel>
                    <Select
                      value={selectedConnection?.id || ""}
                      label="Connection"
                      onChange={(e) => {
                        const conn = selectedCustomer.connections?.find(
                          (c) => c.id === Number(e.target.value)
                        );
                        setSelectedConnection(conn || null);
                      }}
                    >
                      <MenuItem value="">— Select Connection —</MenuItem>
                      {selectedCustomer.connections?.map((c) => (
                        <MenuItem key={c.id} value={c.id}>
                          Conn #{c.connectionNumber}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}
            </>
          )}

          {/* Scheme */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Scheme</InputLabel>
              {loading.schemes ? (
                <CircularProgress size={24} />
              ) : (
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
              )}
            </FormControl>
          </Grid>

          {/* Zone */}
          {selectedSchemeId && formData.scopeType !== "CONNECTION" && (
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
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
                  {schemes
                    .find((s) => s.id === Number(selectedSchemeId))
                    ?.zones?.map((z) => (
                      <MenuItem key={z.id} value={z.id}>
                        {z.name}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          {/* Route */}
          {selectedZoneId && formData.scopeType === "ROUTE" && (
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Route</InputLabel>
                <Select
                  value={selectedRouteId}
                  label="Route"
                  onChange={(e) => setSelectedRouteId(e.target.value)}
                >
                  <MenuItem value="">— Select Route —</MenuItem>
                  {schemes
                    .find((s) => s.id === Number(selectedSchemeId))
                    ?.zones?.find((z) => z.id === Number(selectedZoneId))
                    ?.routes?.map((r) => (
                      <MenuItem key={r.id} value={r.id}>
                        {r.name} {r.code ? `(${r.code})` : ""}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          {/* Assignee */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Assigned To</InputLabel>
              <Select
                value={formData.AssignedTo}
                label="Assigned To"
                onChange={handleChange("AssignedTo")}
              >
                <MenuItem value="">— Select User —</MenuItem>
                {users.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.firstName} {u.lastName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Due Date */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="date"
              label="Due Date"
              InputLabelProps={{ shrink: true }}
              value={formData.dueDate}
              onChange={handleChange("dueDate")}
            />
          </Grid>

          {/* Title */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              label="Task Title"
              value={formData.title}
              onChange={handleChange("title")}
              placeholder="e.g. Disconnection - overdue account"
            />
          </Grid>

          {/* Description */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Description / Reason"
              value={formData.description}
              onChange={handleChange("description")}
              placeholder="Enter reason for disconnection, special instructions, etc."
            />
          </Grid>

          {/* Submit / Cancel */}
          <Grid item xs={12}>
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}>
              <Button variant="outlined" onClick={handleCancel} disabled={loading.submitting}>
                Cancel
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={handleSubmit}
                disabled={loading.submitting}
              >
                {loading.submitting ? "Creating..." : "Create Disconnection Task"}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default CreateDisconnectionTaskPage;