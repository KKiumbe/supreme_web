import React, { useEffect, useState, useMemo } from "react";
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
 * @property {string} schemeId
 */
/**
 * @typedef {Object} Route
 * @property {string} id
 * @property {string} name
 * @property {string} zoneId
 */
/**
 * @typedef {Object} TariffCategory
 * @property {string} id
 * @property {string} name
 */

const CreateCustomer = () => {
  const currentUser = useAuthStore((state) => state.currentUser);
  const BASEURL = import.meta.env.VITE_BASE_URL || "";
  const navigate = useNavigate();

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
    customerIdNo: "",
    hasSewer: false,
    hasWater: false,
  });

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

        const schemesData = schemeRes.data.data || [];
        setSchemes(schemesData);
        const allZones = schemesData.flatMap((scheme) => scheme.zones || []);
        setZones(allZones);
        const allRoutes = allZones.flatMap((zone) => zone.routes || []);
        setRoutes(allRoutes);

        const tariffData = tariffRes.data.data || [];
        const uniqueCategories = Object.values(
          tariffData.reduce((acc, t) => {
            acc[t.categoryId] = {
              id: t.categoryId,
              name: t.category.name,
            };
            return acc;
          }, {})
        );
        setTariffCategories(uniqueCategories);
      } catch (err) {
        console.error("Failed to load schemes/tariffs", err);
      }
    };
    fetchInitial();
  }, [BASEURL]);

  /* ---------- Filter zones and routes ---------- */
  const filteredZones = useMemo(() => {
    if (!selectedScheme) return zones;
    return zones.filter((zone) => zone.schemeId === parseInt(selectedScheme));
  }, [zones, selectedScheme]);

  const filteredRoutes = useMemo(() => {
    if (!selectedZone) return routes;
    return routes.filter((route) => route.zoneId === parseInt(selectedZone));
  }, [routes, selectedZone]);

  /* ---------- Submit ---------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const required = [form.accountNumber, form.customerName, form.phoneNumber];
    if (required.some((f) => !f)) {
      alert("Please fill all required fields (Account Number, Customer Name, Phone Number).");
      setLoading(false);
      return;
    }

    const payload = {
      accountNumber: form.accountNumber,
      customerName: form.customerName,
      email: form.email || null,
      phoneNumber: form.phoneNumber,
      customerKraPin: form.customerKraPin || null,
      customerDob: form.customerDob || null,
      customerDeposit: form.customerDeposit ? Number(form.customerDeposit) : null,
      customerIdNo: form.customerIdNo || null,
      hasSewer: form.hasSewer,
      hasWater: form.hasWater,
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
        customerIdNo: "",
        hasSewer: false,
        hasWater: false,
      });
      setSelectedScheme("");
      setSelectedZone("");
      setSelectedRoute("");
      setSelectedTariff("");
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
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", p: 2 }}>
      <Typography variant="h5" fontWeight="bold" mb={2}>
        Create Customer
      </Typography>

      <Paper sx={{ flex: 1, p: 3, overflowY: "auto" }}>
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

            {/* ---------- ID Number ---------- */}
            <Grid item xs={12} md={6}>
              <TextField
                label="ID Number"
                fullWidth
                value={form.customerIdNo}
                onChange={update("customerIdNo")}
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
            
            {/* ---------- Zone ---------- */}
            
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