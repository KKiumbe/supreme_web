import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  CircularProgress,
  Paper,
  Grid,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import axios from "axios";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";

/**
 * @typedef {Object} Scheme
 * @property {string} id
 * @property {string} name
 */
/**
 * @typedef {Object} Zone
 * @property {string} id
 * @property {string} name
 */
/**
 * @typedef {Object} Route
 * @property {string} id
 * @property {string} name
 */
/**
 * @typedef {Object} TariffCategory
 * @property {string} id
 * @property {string} name
 */

const CreateCustomer = () => {
    const currentUser = useAuthStore((state) => state.currentUser);
  const BASEURL = import.meta.env.VITE_BASE_URL;

  /* ---------- Loading & data ---------- */
  const [loading, setLoading] = useState(false);
  const [schemes, setSchemes] = useState([]);
  const [zones, setZones] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [tariffCategories, setTariffCategories] = useState([]);

  /* ---------- Selections ---------- */
  const [selectedScheme, setSelectedScheme] = useState("");
  const [selectedZone, setSelectedZone] = useState("");
  const [selectedRoute, setSelectedRoute] = useState("");
  const [selectedTariff, setSelectedTariff] = useState("");

  /* ---------- Form fields (match backend) ---------- */
  const [form, setForm] = useState({
    accountNumber: "",
    customerName: "",
    email: "",
    phoneNumber: "",
    customerKraPin: "",
    customerDob: "", // YYYY-MM-DD
    customerDeposit: "",
    customerTariffId: "",
    customerDiscoType: "",
    customerIdNo: "",
    hasSewer: false,
    hasWater: false,
    // The four IDs are handled via the dropdowns
  });

 const navigate = useNavigate();

    useEffect(() => {
      if (!currentUser) {
        navigate("/login");
      }
    }, [currentUser, navigate]);

  /* ---------- Fetch schemes + tariff categories ---------- */
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const [schemeRes, tariffRes] = await Promise.all([
          axios.get(`${BASEURL}/schemes`, { withCredentials: true }),
          axios.get(`${BASEURL}/tarrifs/block`, { withCredentials: true }),
        ]);

        setSchemes(schemeRes.data.data || []);
        const uniqCats = Object.values(
          (tariffRes.data.data || []).reduce((acc, t) => {
            acc[t.category.id] = t.category;
            return acc;
          }, {})
        );
        setTariffCategories(uniqCats);
      } catch (err) {
        console.error("Failed to load schemes/tariffs", err);
      }
    };
    fetchInitial();
  }, [BASEURL]);

  /* ---------- Scheme → Zones ---------- */
  const handleSchemeChange = async (schemeId) => {
    setSelectedScheme(schemeId);
    setSelectedZone("");
    setSelectedRoute("");
    setZones([]);
    setRoutes([]);

    if (!schemeId) return;

    try {
      const res = await axios.get(`${BASEURL}/schemes/${schemeId}`, {
        withCredentials: true,
      });
      setZones(res.data.data || []);
    } catch (err) {
      console.error("Zones fetch error", err);
    }
  };

  /* ---------- Zone → Routes ---------- */
  const handleZoneChange = async (zoneId) => {
    setSelectedZone(zoneId);
    setSelectedRoute("");
    setRoutes([]);

    if (!zoneId) return;

    try {
      const res = await axios.get(`${BASEURL}/zones/${zoneId}/routes`, {
        withCredentials: true,
      });
      setRoutes(res.data.data || []);
    } catch (err) {
      console.error("Routes fetch error", err);
    }
  };

  /* ---------- Submit ---------- */


const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  const required = [
    form.accountNumber,
    form.customerName,
    form.phoneNumber,
    selectedScheme,
    selectedZone,
    selectedRoute,
    selectedTariff,
  ];
  if (required.some((f) => !f)) {
    alert("Please fill all required fields.");
    setLoading(false);
    return;
  }

  const payload = {
    ...form,
    customerSchemeId: Number(selectedScheme),
    customerZoneId: Number(selectedZone),
    customerRouteId: Number(selectedRoute),
    tariffCategoryId: selectedTariff && selectedTariff !== "" ? selectedTariff : null,
  };

  try {
    await axios.post(`${BASEURL}/customers`, payload, {
      withCredentials: true,
    });

    alert("Customer created successfully!");

    // Reset form
    setForm({
      accountNumber: "",
      customerName: "",
      email: "",
      phoneNumber: "",
      customerKraPin: "",
      customerDob: "",
      customerDeposit: "",
      customerTariffId: "",
      customerDiscoType: "",
      customerIdNo: "",
      hasSewer: false,
      hasWater: false,
    });
    setSelectedScheme("");
    setSelectedZone("");
    setSelectedRoute("");
    setSelectedTariff("");
    setZones([]);
    setRoutes([]);

  } catch (err) {
    console.error(err);
    alert(err.response?.data?.message || "Failed to create customer");
  } finally {
    setLoading(false);
  }
};
  /* ---------- Helper for controlled inputs ---------- */
  const update = (field) => (e) => {
    const { value, checked, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [field]: type === "checkbox" ? checked : value,
    }));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight="bold" mb={2}>
        Create Customer
      </Typography>

      <Paper sx={{ p: 3, overflowY: "auto", maxHeight: "85vh" }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            {/* ---------- Account & Name ---------- */}
            <Grid item xs={12} md={6}>
              <TextField
                label="Account Number"
                fullWidth
                required
                value={form.accountNumber}
                onChange={update("accountNumber")}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Customer Name"
                fullWidth
                required
                value={form.customerName}
                onChange={update("customerName")}
              />
            </Grid>

            {/* ---------- Contact ---------- */}
            <Grid item xs={12} md={6}>
              <TextField
                label="Email"
                type="email"
                fullWidth
                value={form.email}
                onChange={update("email")}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Phone Number"
                fullWidth
                required
                value={form.phoneNumber}
                onChange={update("phoneNumber")}
              />
            </Grid>

            {/* ---------- KRA / DOB / Deposit ---------- */}
            <Grid item xs={12} md={4}>
              <TextField
                label="KRA PIN"
                fullWidth
                value={form.customerKraPin}
                onChange={update("customerKraPin")}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Date of Birth"
                type="date"
                InputLabelProps={{ shrink: true }}
                fullWidth
                value={form.customerDob}
                onChange={update("customerDob")}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Deposit Amount"
                type="number"
                fullWidth
                value={form.customerDeposit}
                onChange={update("customerDeposit")}
              />
            </Grid>

            {/* ---------- IDs & Disco ---------- */}
            <Grid item xs={12} md={6}>
              <TextField
                label="ID Number"
                fullWidth
                value={form.customerIdNo}
                onChange={update("customerIdNo")}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Disco Type"
                fullWidth
                value={form.customerDiscoType}
                onChange={update("customerDiscoType")}
              />
            </Grid>

            {/* ---------- Services (checkboxes) ---------- */}
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.hasWater}
                    onChange={update("hasWater")}
                  />
                }
                label="Has Water"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.hasSewer}
                    onChange={update("hasSewer")}
                  />
                }
                label="Has Sewer"
              />
            </Grid>

            {/* ---------- Scheme ---------- */}
            <Grid item xs={12} md={6}>
              <TextField
                select
                label="Scheme"
                fullWidth
                required
                value={selectedScheme}
                onChange={(e) => handleSchemeChange(e.target.value)}
              >
                <MenuItem value="">Select Scheme</MenuItem>
                {schemes.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* ---------- Zone ---------- */}
            <Grid item xs={12} md={6}>
              {zones.length > 0 ? (
                <TextField
                  select
                  label="Zone"
                  fullWidth
                  required
                  value={selectedZone}
                  onChange={(e) => handleZoneChange(e.target.value)}
                >
                  <MenuItem value="">Select Zone</MenuItem>
                  {zones.map((z) => (
                    <MenuItem key={z.id} value={z.id}>
                      {z.name}
                    </MenuItem>
                  ))}
                </TextField>
              ) : selectedScheme ? (
                <Typography color="text.secondary">
                  No zones for this scheme.{" "}
                  <Button variant="text" size="small">
                    Add Zone
                  </Button>
                </Typography>
              ) : null}
            </Grid>

            {/* ---------- Route ---------- */}
            <Grid item xs={12} md={6}>
              {routes.length > 0 ? (
                <TextField
                  select
                  label="Route"
                  fullWidth
                  required
                  value={selectedRoute}
                  onChange={(e) => setSelectedRoute(e.target.value)}
                >
                  <MenuItem value="">Select Route</MenuItem>
                  {routes.map((r) => (
                    <MenuItem key={r.id} value={r.id}>
                      {r.name}
                    </MenuItem>
                  ))}
                </TextField>
              ) : selectedZone ? (
                <Typography color="text.secondary">
                  No routes for this zone.{" "}
                  <Button variant="text" size="small">
                    Add Route
                  </Button>
                </Typography>
              ) : null}
            </Grid>

            {/* ---------- Tariff Category ---------- */}
            <Grid item xs={12} md={6}>
            <TextField
  select
  label="Tariff Category"
  fullWidth
  required
  value={selectedTariff}
  onChange={(e) => setSelectedTariff(e.target.value)}
>
  <MenuItem value="">Select Category</MenuItem>
  {tariffCategories.map((t) => (
    <MenuItem key={t.id} value={t.id}>
      {t.name}
    </MenuItem>
  ))}
</TextField>

            </Grid>

            {/* ---------- Submit ---------- */}
            <Grid item xs={12}>
              <Box textAlign="center" mt={3}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{ minWidth: 200 }}
                >
                  {loading ? <CircularProgress size={24} /> : "Create Customer"}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default CreateCustomer;