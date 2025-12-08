import React, { useEffect, useState, useMemo } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  CircularProgress,
  Paper,
  Grid,
} from "@mui/material";
import axios from "axios";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";
import AssignSurveyTaskDialog from "../../components/tasks/surveyTask";

const API_URL = import.meta.env.VITE_BASE_URL || "";

const CreateSurvey = ({ theme }) => {
  const currentUser = useAuthStore((state) => state.currentUser);
  const navigate = useNavigate();

  /* ---------- State ---------- */
  const [stage, setStage] = useState(1); // 1: Bio Data, 2: Task
  const [loading, setLoading] = useState(false);
  const [schemes, setSchemes] = useState([]);
  const [zones, setZones] = useState([]);
  // NEW: Renamed and initialized as string
  const [selectedTariffCategoryId, setSelectedTariffCategoryId] = useState("");
  const [tariffCategories, setTariffCategories] = useState([]); // NEW: Store tariff categories
  const [routes, setRoutes] = useState([]);
  const [selectedScheme, setSelectedScheme] = useState("");
  const [selectedZone, setSelectedZone] = useState("");
  const [selectedRoute, setSelectedRoute] = useState("");
  const [form, setForm] = useState({
    name: "",
    phoneNumber: "",
    email: "",
    nationalId: "",
    gender: "",
    plotNumber: "",
    landmark: "",
    address: "",
    latitude: "",
    longitude: "",
    notes: "",
    schemeId: "",
    zoneId: "",
    routeId: "",
    tarrifCategoryId: "", // Note: API uses 'tarrif' spelling
  });
  const [error, setError] = useState("");
  const [createdCustomer, setCreatedCustomer] = useState(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [relatedSurveyId, setRelatedSurveyId] = useState(null);

  /* ---------- Auth Check ---------- */
  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  /* ---------- Fetch Schemes and Tariffs ---------- */
  useEffect(() => {
    if (stage !== 1) return;

    const fetchInitial = async () => {
      try {
        // Fetch tariffs
        const tariffRes = await axios.get(`${API_URL}/tarrifs/block`, { withCredentials: true });
        const tariffData = tariffRes.data.data || [];
        // NEW: Extract unique tariff categories
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

        // Fetch schemes
        const schemeRes = await axios.get(`${API_URL}/schemes`, { withCredentials: true });
        const schemesData = schemeRes.data.data || [];
        setSchemes(schemesData);
        const allZones = schemesData.flatMap((scheme) => scheme.zones || []);
        setZones(allZones);
        const allRoutes = allZones.flatMap((zone) => zone.routes || []);
        setRoutes(allRoutes);
      } catch (err) {
        console.error("Failed to load schemes or tariffs", err);
        setError("Failed to load schemes or tariffs.");
      }
    };
    fetchInitial();
  }, [stage]);

  /* ---------- Filter Zones and Routes ---------- */
  const filteredZones = useMemo(() => {
    if (!selectedScheme) return zones;
    return zones.filter((zone) => zone.schemeId === parseInt(selectedScheme));
  }, [zones, selectedScheme]);

  const filteredRoutes = useMemo(() => {
    if (!selectedZone) return routes;
    return routes.filter((route) => route.zoneId === parseInt(selectedZone));
  }, [routes, selectedZone]);

  /* ---------- Form Handler ---------- */
  const updateForm = (field) => (e) => {
    const { value } = e.target;
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError("");
  };

  /* ---------- Stage 1: Create Customer ---------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate required fields
    const required = [form.name, form.phoneNumber];
    if (required.some((f) => !f)) {
      setError("Please fill all required fields (Name, Phone Number).");
      setLoading(false);
      return;
    }

    const customerPayload = {
      name: form.name,
      phoneNumber: form.phoneNumber,
      email: form.email || null,
      nationalId: form.nationalId || null,
      gender: form.gender || null,
      plotNumber: form.plotNumber || null,
      landmark: form.landmark || null,
      address: form.address || null,
      latitude: form.latitude ? Number(form.latitude) : null,
      longitude: form.longitude ? Number(form.longitude) : null,
      schemeId: selectedScheme ? Number(selectedScheme) : null,
      zoneId: selectedZone ? Number(selectedZone) : null,
      routeId: selectedRoute ? Number(selectedRoute) : null,
      // NEW: Use selectedTariffCategoryId
      tarrifCategoryId: selectedTariffCategoryId || null,
    };

    try {
      // Step 1: Create the customer
      const customerRes = await axios.post(`${API_URL}/new-customers`, customerPayload, {
        withCredentials: true,
      });
      const createdCustomerData = customerRes.data.data;
      setCreatedCustomer(createdCustomerData);

      // Step 2: Immediately create the survey
      const surveyPayload = {
        customerApplicationId: createdCustomerData.id,
        pipelineNearby: false,
        photoUrl: null,
        approved: false,
        remarks: null,
      };

      const surveyRes = await axios.post(`${API_URL}/create-survey`, surveyPayload, {
        withCredentials: true,
      });

      const newSurveyId = surveyRes.data.data.id;
      setRelatedSurveyId(newSurveyId);
      console.log("✅ Survey created with ID:", newSurveyId);

      // Step 3: Proceed to task creation
      setStage(2);
      setTaskDialogOpen(true);
    } catch (err) {
      console.error("Failed to create customer or survey", err);
      setError(err.response?.data?.message || "Failed to create customer or survey.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Task Creation Callback ---------- */
  const handleTaskCreated = async (taskData) => {
    setLoading(true);
    try {
      // Create survey payload
      const surveyPayload = {
        taskId: taskData.taskId,
        customerApplicationId: createdCustomer?.id || null,
        pipelineNearby: false,
        photoUrl: null,
        approved: false,
        remarks: null,
      };

      // Post to server
      const res = await axios.post(`${API_URL}/create-survey`, surveyPayload, {
        withCredentials: true,
      });

      const surveyId = res.data.data.id;
      setRelatedSurveyId(surveyId);

      console.log(`Survey created successfully with ID: ${surveyId}`);

      setTaskDialogOpen(false);
      alert("Survey task created successfully!");
      handleReset();
    } catch (err) {
      console.error("Failed to create survey", err);
      setError(err.response?.data?.message || "Failed to create survey.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Reset Form ---------- */
  const handleReset = () => {
    setForm({
      name: "",
      phoneNumber: "",
      email: "",
      nationalId: "",
      gender: "",
      plotNumber: "",
      landmark: "",
      address: "",
      latitude: "",
      longitude: "",
      notes: "",
      schemeId: "",
      zoneId: "",
      routeId: "",
      tarrifCategoryId: "",
    });
    setSelectedScheme("");
    setSelectedZone("");
    setSelectedRoute("");
    setSelectedTariffCategoryId(""); // NEW: Reset tariff category
    setRelatedSurveyId(null);
    setCreatedCustomer(null);
    setStage(1);
    setError("");
  };

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", p: 2 }}>
      <Typography variant="h5" fontWeight="bold" mb={2}>
        {stage === 1 ? "Add Customer Details" : "Create Survey Task"}
      </Typography>

      <Paper sx={{ flex: 1, p: 3, overflowY: "auto" }}>
        {stage === 1 && (
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary" mb={2}>
                  Enter customer details. Click Next to create a survey task.
                </Typography>
              </Grid>

              {/* Customer Section */}
              <Grid item xs={12}>
                <Typography variant="h6" mb={2}>
                  Customer Details
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Customer Name"
                  fullWidth
                  required
                  value={form.name}
                  onChange={updateForm("name")}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Phone Number"
                  fullWidth
                  required
                  value={form.phoneNumber}
                  onChange={updateForm("phoneNumber")}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  value={form.email}
                  onChange={updateForm("email")}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="National ID"
                  fullWidth
                  value={form.nationalId}
                  onChange={updateForm("nationalId")}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  label="Gender"
                  fullWidth
                  value={form.gender}
                  onChange={updateForm("gender")}
                >
                  <MenuItem value="">— Select Gender —</MenuItem>
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Plot Number"
                  fullWidth
                  value={form.plotNumber}
                  onChange={updateForm("plotNumber")}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Landmark"
                  fullWidth
                  value={form.landmark}
                  onChange={updateForm("landmark")}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Address"
                  fullWidth
                  value={form.address}
                  onChange={updateForm("address")}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  label="Scheme"
                  fullWidth
                  value={selectedScheme}
                  onChange={(e) => {
                    setSelectedScheme(e.target.value);
                    setSelectedZone("");
                    setSelectedRoute("");
                    setForm((prev) => ({ ...prev, schemeId: e.target.value }));
                  }}
                >
                  <MenuItem value="">— Select Scheme —</MenuItem>
                  {schemes.map((scheme) => (
                    <MenuItem key={scheme.id} value={scheme.id}>
                      {scheme.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  label="Zone"
                  fullWidth
                  value={selectedZone}
                  onChange={(e) => {
                    setSelectedZone(e.target.value);
                    setSelectedRoute("");
                    setForm((prev) => ({ ...prev, zoneId: e.target.value }));
                  }}
                  disabled={!selectedScheme}
                >
                  <MenuItem value="">— Select Zone —</MenuItem>
                  {filteredZones.map((zone) => (
                    <MenuItem key={zone.id} value={zone.id}>
                      {zone.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  label="Tariff Category"
                  fullWidth
                  value={selectedTariffCategoryId}
                  onChange={(e) => {
                    setSelectedTariffCategoryId(e.target.value);
                    setForm((prev) => ({ ...prev, tarrifCategoryId: e.target.value }));
                  }}
                >
                  <MenuItem value="">— Select Tariff Category —</MenuItem>
                  {tariffCategories.map((tariff) => (
                    <MenuItem key={tariff.id} value={tariff.id}>
                      {tariff.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  label="Route"
                  fullWidth
                  value={selectedRoute}
                  onChange={(e) => {
                    setSelectedRoute(e.target.value);
                    setForm((prev) => ({ ...prev, routeId: e.target.value }));
                  }}
                  disabled={!selectedZone}
                >
                  <MenuItem value="">— Select Route —</MenuItem>
                  {filteredRoutes.map((route) => (
                    <MenuItem key={route.id} value={route.id}>
                      {route.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Error Message */}
              {error && (
                <Grid item xs={12}>
                  <Typography color="error" variant="body2">
                    {error}
                  </Typography>
                </Grid>
              )}

              {/* Submit */}
              <Grid item xs={12}>
                <Box textAlign="center" mt={3}>
                  <Button
                    variant="outlined"
                    onClick={handleReset}
                    disabled={loading}
                    sx={{ mr: 2, color: theme?.palette?.secondary?.main }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    sx={{ minWidth: 200, color: theme?.palette?.primary?.contrastText }}
                  >
                    {loading ? <CircularProgress size={24} /> : "Next"}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        )}

        {stage === 2 && (
          <AssignSurveyTaskDialog
            open={taskDialogOpen}
            onClose={() => {
              setTaskDialogOpen(false);
              handleReset();
            }}
            onTaskCreated={handleTaskCreated}
            taskTitle="Water Connection Survey"
            taskDescription={`Survey for customer: ${createdCustomer?.name || "N/A"}`}
            NewCustomerId={createdCustomer?.id}
            assigneeId={currentUser?.id || ""}
            RelatedSurveyId={relatedSurveyId}
            schemeId={form.schemeId || selectedScheme}
            zoneId={form.zoneId || selectedZone}
            routeId={form.routeId || selectedRoute}
            theme={theme}
            // NEW: Pass tariff category ID
            tarrifCategoryId={form.tarrifCategoryId || selectedTariffCategoryId}
          />
        )}
      </Paper>
    </Box>
  );
};

CreateSurvey.propTypes = {
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

export default CreateSurvey;