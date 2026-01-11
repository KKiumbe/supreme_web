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
  Divider,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { debounce } from "lodash";

const API_URL = import.meta.env.VITE_BASE_URL;

const SCOPE_TYPES = [
  { value: "CONNECTION", label: "Single Connection" },
  { value: "ROUTE", label: "All Connections in Route" },
  { value: "ZONE", label: "All Connections in Zone" },
  { value: "SCHEME", label: "All Connections in Scheme" },
];

const CreateDisconnectionTaskPage = ({
  initialData = null,      // for dialog mode
  onTaskCreated = null,
  onCancel = null,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const prefill = initialData || location.state || {};

  const [formData, setFormData] = useState({
    title: "Create Disconnection Task",
    description: "Disconnection of overdue connections",
    priority: "HIGH",
    dueDate: "",
    AssignedTo: "",
    TypeId: "",
    scopeType: "CONNECTION", // safer default
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
  const [unpaidMonths, setUnpaidMonths] = useState(""); // ✅ NEW

  const [minBalance, setMinBalance] = useState("");

  const [loading, setLoading] = useState({
    meta: false,
    customers: false,
    schemes: false,
    submitting: false,
  });

  const [error, setError] = useState("");

  // ─── Fetch metadata ────────────────────────────────────────────────
  useEffect(() => {
    const fetchMeta = async () => {
      setLoading((p) => ({ ...p, meta: true }));
      try {
        const [usersRes, typesRes] = await Promise.all([
          axios.get(`${API_URL}/users`, { withCredentials: true }),
          axios.get(`${API_URL}/get-tasks-types`, { withCredentials: true }),
        ]);

        setUsers(usersRes.data?.data || []);

        const types = Array.isArray(typesRes.data)
          ? typesRes.data
          : typesRes.data?.data || [];
        setTaskTypes(types);

        const disconnection = types.find(
          (t) => t.name?.toUpperCase() === "DISCONNECTION"
        );
        if (disconnection) {
          setFormData((p) => ({ ...p, TypeId: disconnection.id }));
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load users or task types");
      } finally {
        setLoading((p) => ({ ...p, meta: false }));
      }
    };

    fetchMeta();
  }, []);

  // ─── Fetch customers ───────────────────────────────────────────────
  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading((p) => ({ ...p, customers: true }));
      try {
        const res = await axios.get(`${API_URL}/customers`, { withCredentials: true });
        const list = res.data?.data?.customers || [];
        setCustomers(list);
        setFilteredCustomers(list);
      } catch (err) {
        console.error(err);
        setCustomers([]);
        setFilteredCustomers([]);
      } finally {
        setLoading((p) => ({ ...p, customers: false }));
      }
    };
    fetchCustomers();
  }, []);

  // ─── Fetch schemes (with zones & routes) ───────────────────────────
  useEffect(() => {
    const fetchSchemes = async () => {
      setLoading((p) => ({ ...p, schemes: true }));
      try {
        const res = await axios.get(`${API_URL}/schemes`, { withCredentials: true });
        if (res.data?.success && Array.isArray(res.data.data)) {
          setSchemes(res.data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading((p) => ({ ...p, schemes: false }));
      }
    };
    fetchSchemes();
  }, []);

  // ─── Prefill if coming from connection detail ──────────────────────
  useEffect(() => {
    if (!prefill.connectionId) return;

    const fakeCustomer = {
      id: prefill.customerId,
      customerName: prefill.customerName || "Unknown",
      connections: [{
        id: prefill.connectionId,
        connectionNumber: prefill.connectionNumber,
        schemeId: prefill.schemeId,
        zoneId: prefill.zoneId,
        routeId: prefill.routeId,
      }],
    };

    setSelectedCustomer(fakeCustomer);
    setSelectedConnection(fakeCustomer.connections[0]);

    setFormData((p) => ({
      ...p,
      title: `Disconnect Conn #${prefill.connectionNumber}`,
      description: `Disconnection for ${prefill.customerName || "customer"}`,
      scopeType: "CONNECTION",
    }));

    if (prefill.schemeId) setSelectedSchemeId(prefill.schemeId);
    if (prefill.zoneId) setSelectedZoneId(prefill.zoneId);
    if (prefill.routeId) setSelectedRouteId(prefill.routeId);
  }, [prefill]);

  // ─── Debounced customer search ─────────────────────────────────────
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

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (field !== "description") setError("");
  };

  const handleSubmit = async () => {
    setError("");

    // Basic validations
    if (!formData.TypeId) return setError("Task type is required");
    if (!formData.AssignedTo) return setError("Please assign the task");
    if (!formData.title.trim()) return setError("Title is required");

    // Scope-specific validations
    if (formData.scopeType === "CONNECTION") {
      if (!selectedConnection?.id) return setError("Please select a connection");
    } else if (formData.scopeType === "ROUTE") {
      if (!selectedRouteId) return setError("Please select a route");
    } else if (formData.scopeType === "ZONE") {
      if (!selectedZoneId) return setError("Please select a zone");
    } else if (formData.scopeType === "SCHEME") {
      if (!selectedSchemeId) return setError("Please select a scheme");
    }

    // Optional min balance validation
    if (minBalance !== "" && (isNaN(Number(minBalance)) || Number(minBalance) < 0)) {
      return setError("Minimum balance must be a positive number");
    }

    // Optional unpaid months validation
if (
  unpaidMonths !== "" &&
  (!Number.isInteger(Number(unpaidMonths)) || Number(unpaidMonths) < 1)
) {
  return setError("Unpaid months must be a whole number ≥ 1");
}


    setLoading((p) => ({ ...p, submitting: true }));

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

      // Scope-specific ID
      if (formData.scopeType === "CONNECTION") {
        payload.connectionId = Number(selectedConnection.id);
      } else if (formData.scopeType === "ROUTE") {
        payload.routeId = Number(selectedRouteId);
      } else if (formData.scopeType === "ZONE") {
        payload.zoneId = Number(selectedZoneId);
      } else if (formData.scopeType === "SCHEME") {
        payload.schemeId = Number(selectedSchemeId);
      }

  if (minBalance !== "") {
  payload.minBalance = Number(minBalance);
}

if (unpaidMonths !== "") {
  payload.unpaidMonths = Number(unpaidMonths);
}


      await axios.post(`${API_URL}/tasks/disconnection`, payload, {
        withCredentials: true,
      });

      onTaskCreated?.();
      if (!onTaskCreated) {
        navigate("/connections", {
          state: { message: "Disconnection task created", severity: "success" },
        });
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to create disconnection task";
      setError(msg);
      console.error(err);
    } finally {
      setLoading((p) => ({ ...p, submitting: false }));
    }
  };

  const handleCancel = () => {
    onCancel?.() || navigate(-1);
  };

  if (loading.meta) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  const showLocationFields = formData.scopeType !== "CONNECTION";

  return (
    <Box sx={{ p: initialData ? 0 : { xs: 2, md: 4 } }}>
      <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, maxWidth: 920, mx: "auto" }}>
        <Typography variant="h5" component="h1" gutterBottom  fontWeight={600}>
          Create Disconnection Task
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2.5}>
          {/* ─── Core Task Info ─── */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Task Type</InputLabel>
              <Select
                value={formData.TypeId}
                label="Task Type"
                onChange={handleChange("TypeId")}
              >
                <MenuItem value="">Select type</MenuItem>
                {taskTypes.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Scope</InputLabel>
              <Select
                value={formData.scopeType}
                label="Scope"
                onChange={(e) => {
                  handleChange("scopeType")(e);
                  // Reset location selections when scope changes
                  setSelectedSchemeId("");
                  setSelectedZoneId("");
                  setSelectedRouteId("");
                  setSelectedCustomer(null);
                  setSelectedConnection(null);
                }}
              >
                {SCOPE_TYPES.map((s) => (
                  <MenuItem key={s.value} value={s.value}>
                    {s.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* ─── Single Connection ─── */}
          {formData.scopeType === "CONNECTION" && (
            <>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle1" gutterBottom>
                  Select Customer & Connection
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
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
                    <TextField {...params} label="Search Customer" required fullWidth />
                  )}
                />
              </Grid>

              {selectedCustomer && (
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
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
                      <MenuItem value="">Select connection</MenuItem>
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

          {/* ─── Scheme / Zone / Route ─── */}
          {showLocationFields && (
            <>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle1" gutterBottom>
                  Location Scope
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required={showLocationFields}>
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
                      <MenuItem value="">Select Scheme</MenuItem>
                      {schemes.map((s) => (
                        <MenuItem key={s.id} value={s.id}>
                          {s.name}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                </FormControl>
              </Grid>

              {selectedSchemeId && (
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required={formData.scopeType !== "SCHEME"}>
                    <InputLabel>Zone</InputLabel>
                    <Select
                      value={selectedZoneId}
                      label="Zone"
                      onChange={(e) => {
                        setSelectedZoneId(e.target.value);
                        setSelectedRouteId("");
                      }}
                      disabled={!schemes.find((s) => s.id === Number(selectedSchemeId))?.zones?.length}
                    >
                      <MenuItem value="">All Zones</MenuItem>
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

              {formData.scopeType === "ROUTE" && selectedZoneId && (
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Route</InputLabel>
                    <Select
                      value={selectedRouteId}
                      label="Route"
                      onChange={(e) => setSelectedRouteId(e.target.value)}
                    >
                      <MenuItem value="">Select Route</MenuItem>
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
            </>
          )}

          {/* ─── Common Fields ─── */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Assign To</InputLabel>
              <Select
                value={formData.AssignedTo}
                label="Assign To"
                onChange={handleChange("AssignedTo")}
              >
                <MenuItem value="">Select user</MenuItem>
                {users.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.firstName} {u.lastName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Min. Outstanding Balance (optional)"
              value={minBalance}
              onChange={(e) => setMinBalance(e.target.value)}
              inputProps={{ min: 0, step: "0.01" }}
              helperText="Only disconnect connections ≥ this amount"
              placeholder="e.g. 1500"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
  <TextField
    fullWidth
    type="number"
    label="Min. Unpaid Months (optional)"
    value={unpaidMonths}
    onChange={(e) => {
      const val = e.target.value;
      if (val === "" || Number(val) >= 1) {
        setUnpaidMonths(val);
      }
    }}
    inputProps={{ min: 1, step: 1 }}
    helperText="Disconnect only if unpaid for at least this many months"
    placeholder="e.g. 2"
  />
</Grid>


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

          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              label="Task Title"
              value={formData.title}
              onChange={handleChange("title")}
              placeholder="e.g. Disconnection - Overdue > 90 days"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Description / Reason / Instructions"
              value={formData.description}
              onChange={handleChange("description")}
              placeholder="Enter reason, special notes, safety instructions, etc."
            />
          </Grid>

          {/* Actions */}
          <Grid item xs={12}>
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 4 }}>
              <Button
                variant="outlined"
                onClick={handleCancel}
                disabled={loading.submitting}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={handleSubmit}
                disabled={loading.submitting}
                startIcon={loading.submitting ? <CircularProgress size={20} color="inherit" /> : null}
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

import PropTypes from "prop-types";

CreateDisconnectionTaskPage.propTypes = {
  initialData: PropTypes.object,
  onTaskCreated: PropTypes.func,
  onCancel: PropTypes.func,
};

export default CreateDisconnectionTaskPage;