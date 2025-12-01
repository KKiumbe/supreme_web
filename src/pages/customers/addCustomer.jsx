import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  CircularProgress,
  Typography,
  MenuItem,
  InputAdornment,
  IconButton,
  Paper,
  Stack,
  Alert,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { Search, Clear, UploadFile, Delete, CheckCircle } from "@mui/icons-material";
import axios from "axios";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";
import debounce from "lodash/debounce";

const API_URL = import.meta.env.VITE_BASE_URL || "";

const CreateCustomerScreen = () => {
  const { currentUser } = useAuthStore();
  const navigate = useNavigate();

  // Grid
  const [approvedCustomers, setApprovedCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  // Dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  // Selected survey
  const [selectedSurvey, setSelectedSurvey] = useState(null);

  // Created customer ID
  const [createdCustomerId, setCreatedCustomerId] = useState(null);

  // Documents
  const [documents, setDocuments] = useState({
    nationalIdFront: null ,
    nationalIdBack: null,
    kraPin: null ,
    passportPhoto: null
  });

  // Form state
  const [form, setForm] = useState({
    customerName: "",
    phoneNumber: "",
    email: "",
    customerIdNo: "",
    customerDeposit: "",
    tariffCategoryId: "", // ← This is a STRING (UUID)
  });

  // Tariff categories: { id: "uuid", name: "Domestic - Default" }
  const [tariffs, setTariffs] = useState([]);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!currentUser) navigate("/login");
  }, [currentUser, navigate]);

  const flattenCustomer = (c) => ({
    id: c.id,
    name: c.name || "-",
    phoneNumber: c.phoneNumber || "-",
    email: c.email || "-",
    nationalId: c.nationalId || "-",
    schemeId: c.schemeId,
    zoneId: c.zoneId,
    routeId: c.routeId,
    schemeName: c.scheme?.name || (c.schemeId ? "Assigned" : "-"),
    zoneName: c.zone?.name || (c.zoneId ? "Assigned" : "-"),
    routeName: c.route?.name || (c.routeId ? "Assigned" : "-"),
    proposedTariff: c.surveys?.[0]?.proposedTarrifCategoryId || null,
  });

  const fetchApprovedCustomers = useCallback(
    debounce(async (search = "") => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/get-approved-customer`, {
          withCredentials: true,
          params: { page: page + 1, limit, search: search || undefined },
        });
        const rows = (res.data.data || []).map(flattenCustomer);
        setApprovedCustomers(rows);
        setTotal(res.data.count ?? rows.length);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 400),
    [page, limit]
  );

  // FIXED: Extract unique tariff categories correctly
  const fetchTariffCategories = async () => {
    try {
      const res = await axios.get(`${API_URL}/tarrifs/block`, { withCredentials: true });
      const blocks = res.data.data || [];

      const categoryMap = new Map();
      blocks.forEach((block) => {
        if (block.categoryId && block.category) {
          categoryMap.set(block.categoryId, {
            id: block.categoryId,
            name: block.category.name,
          });
        }
      });

      const unique = Array.from(categoryMap.values());
      console.log("Tariff categories loaded:", unique);
      setTariffs(unique);
    } catch (err) {
      console.error("Failed to load tariff categories", err);
      setTariffs([]);
    }
  };

  useEffect(() => {
    fetchApprovedCustomers(searchQuery);
    fetchTariffCategories();
  }, [fetchApprovedCustomers, searchQuery]);

  const handleSelect = (row) => {
    setSelectedSurvey(row);
    setForm({
      customerName: row.name || "",
      phoneNumber: row.phoneNumber || "",
      email: row.email || "",
      customerIdNo: row.nationalId || "",
      customerDeposit: "",
      tariffCategoryId: row.proposedTariff || "", // ← string, not null
    });
    setError("");
    setCreateDialogOpen(true);
  };

const handleCreateCustomer = async () => {
  if (!form.customerName.trim()) return setError("Name is required");
  if (!form.phoneNumber.trim()) return setError("Phone is required");
  if (!form.tariffCategoryId) return setError("Tariff Category is required");

  setLoading(true);
  setError("");

  const payload = {
    customerName: form.customerName.trim(),
    phoneNumber: form.phoneNumber.trim(),
    email: form.email.trim() || null,
    customerIdNo: form.customerIdNo.trim() || null,
    customerDeposit: form.customerDeposit ? Number(form.customerDeposit) : null,
    tariffCategoryId: form.tariffCategoryId, // ← UUID string
    schemeId: selectedSurvey?.schemeId || null,
    zoneId: selectedSurvey?.zoneId || null,
    routeId: selectedSurvey?.routeId || null,
  };

  try {
    const res = await axios.post(`${API_URL}/customers`, payload, {
      withCredentials: true,
    });

    console.log("Full response:", res.data); // ← Check this in browser console

    // CORRECT WAY TO READ CUSTOMER ID FROM YOUR BACKEND
    const customerId = res.data?.data?.customer?.id 
                   || res.data?.data?.connection?.customerId 
                   || res.data?.data?.customerAccount?.connection?.customerId;

    if (!customerId) {
      throw new Error("Customer created but ID not found in response");
    }

    setCreatedCustomerId(String(customerId));
    setCreateDialogOpen(false);
    setUploadDialogOpen(true);
    setSuccess("Customer created successfully! Now upload documents");
  } catch (err) {
    console.error("Create error:", err.response?.data || err);
    setError(err.response?.data?.message || "Failed to create customer");
  } finally {
    setLoading(false);
  }
};
  const handleUploadDocuments = async () => {
    const hasFiles = Object.values(documents).some(Boolean);
    if (!hasFiles) return alert("Please attach at least one document");

    const fd = new FormData();
    fd.append("customerId", createdCustomerId);
    Object.entries(documents).forEach(([k, f]) => f && fd.append(k, f));

    setLoading(true);
    try {
      await axios.post(`${API_URL}/customer-documents`, fd, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess("Documents uploaded!");
      setTimeout(resetAll, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setCreateDialogOpen(false);
    setUploadDialogOpen(false);
    setSelectedSurvey(null);
    setCreatedCustomerId(null);
    setDocuments({ nationalIdFront: null, nationalIdBack: null, kraPin: null, passportPhoto: null });
    setForm({ customerName: "", phoneNumber: "", email: "", customerIdNo: "", customerDeposit: "", tariffCategoryId: "" });
    setError("");
    setSuccess("");
    fetchApprovedCustomers(searchQuery);
  };

  const columns = useMemo(() => [
    {
      field: "actions",
      headerName: "Action",
      width: 150,
      renderCell: (p) => (
        <Button variant="contained" size="small" onClick={() => handleSelect(p.row)}>
          Create Customer
        </Button>
      ),
    },
    { field: "name", headerName: "Name", width: 220 },
    { field: "phoneNumber", headerName: "Phone", width: 150 },
    { field: "email", headerName: "Email", width: 240 },
    { field: "schemeName", headerName: "Scheme", width: 140 },
    { field: "zoneName", headerName: "Zone", width: 140 },
    { field: "routeName", headerName: "Route", width: 140 },
  ], []);

  return (
    <Box sx={{ height: "100vh", p: 3 }}>
      <Typography variant="h5" fontWeight="bold" mb={3}>
        Create Customer from Approved Surveys
      </Typography>

      <Box display="flex" alignItems="center" mb={2} gap={2}>
        <TextField
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
          size="small"
          sx={{ width: 500 }}
          InputProps={{
            startAdornment: <Search />,
            endAdornment: searchQuery && <IconButton onClick={() => { setSearchQuery(""); setPage(0); }}><Clear /></IconButton>,
          }}
        />
      </Box>

      <Paper sx={{ height: "70vh" }}>
        <DataGrid
          rows={approvedCustomers}
          columns={columns}
          loading={loading}
          rowCount={total}
          paginationMode="server"
          paginationModel={{ page, pageSize: limit }}
          onPaginationModelChange={(m) => { setPage(m.page); setLimit(m.pageSize); }}
          pageSizeOptions={[10, 25, 50]}
        />
      </Paper>

      {/* CREATE CUSTOMER DIALOG */}
      <Dialog open={createDialogOpen} onClose={resetAll} maxWidth="sm" fullWidth>
        <DialogTitle>Create Customer</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={2}>
            <TextField label="Name *" fullWidth value={form.customerName} onChange={e => setForm(f => ({...f, customerName: e.target.value}))} />
            <TextField label="Phone *" fullWidth value={form.phoneNumber} onChange={e => setForm(f => ({...f, phoneNumber: e.target.value}))} />
            <TextField label="Email" fullWidth value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} />
            <TextField label="ID No." fullWidth value={form.customerIdNo} onChange={e => setForm(f => ({...f, customerIdNo: e.target.value}))} />
            <TextField label="Deposit" type="number" fullWidth value={form.customerDeposit} onChange={e => setForm(f => ({...f, customerDeposit: e.target.value}))} />

            {/* FIXED TARIFF DROPDOWN */}
            <TextField
              select
              required
              label="Tariff Category *"
              fullWidth
              value={form.tariffCategoryId}
              onChange={(e) => setForm(f => ({ ...f, tariffCategoryId: e.target.value }))}
              error={!!error && !form.tariffCategoryId}
              helperText={!!error && !form.tariffCategoryId && "Required"}
            >
              <MenuItem value="" disabled><em>Select Category</em></MenuItem>
              {tariffs.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.name}
                </MenuItem>
              ))}
            </TextField>

            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={resetAll}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateCustomer} disabled={loading}>
            {loading ? <CircularProgress size={20} /> : "Create Customer"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* UPLOAD DOCUMENTS DIALOG */}
      <Dialog open={uploadDialogOpen} onClose={resetAll} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Documents — Customer ID: {createdCustomerId}</DialogTitle>
        <DialogContent>
          {success && <Alert severity="success">{success}</Alert>}
          <Stack spacing={3} mt={2}>
            {(["nationalIdFront", "nationalIdBack", "kraPin", "passportPhoto"]).map(field => (
              <Box key={field}>
                <Typography variant="subtitle2">
                  {field === "nationalIdFront" && "National ID (Front)"}
                  {field === "nationalIdBack" && "National ID (Back)"}
                  {field === "kraPin" && "KRA PIN"}
                  {field === "passportPhoto" && "Passport Photo"}
                </Typography>
                <Button variant="outlined" component="label" startIcon={<UploadFile />}>
                  Choose
                  <input type="file" hidden accept="image/*,application/pdf" onChange={e => {
                    setDocuments(d => ({ ...d, [field]: e.target.files?.[0] || null }));
                  }} />
                </Button>
                {documents[field] && (
                  <Box sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1 }}>
                    <CheckCircle color="success" />
                    <Typography variant="body2">{documents[field]?.name}</Typography>
                    <IconButton size="small" onClick={() => setDocuments(d => ({ ...d, [field]: null }))}>
                      <Delete />
                    </IconButton>
                  </Box>
                )}
              </Box>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={resetAll}>Skip</Button>
          <Button
            variant="contained"
            onClick={handleUploadDocuments}
            disabled={loading || !Object.values(documents).some(Boolean)}
          >
            {loading ? <CircularProgress size={20} /> : "Upload"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CreateCustomerScreen;