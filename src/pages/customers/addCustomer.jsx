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
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { Search, Clear } from "@mui/icons-material";
import axios from "axios";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";
import { getTheme } from "../../store/theme";
import debounce from "lodash/debounce";

const API_URL = import.meta.env.VITE_BASE_URL || "";

const CreateCustomerScreen = () => {
  const { currentUser } = useAuthStore();
  const navigate = useNavigate();
  const theme = getTheme();

  // State
  const [approvedCustomers, setApprovedCustomers] = useState([]);
  const [tariffCategories, setTariffCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const [form, setForm] = useState({
    customerName: "",
    email: "",
    phoneNumber: "",
    customerKraPin: "",
    customerDob: "",
    customerDeposit: "",
    customerIdNo: "",
    schemeId: "",
    zoneId: "",
    routeId: "",
    tariffCategoryId: "",
  });

  // ✅ Redirect if not authenticated
  useEffect(() => {
    if (!currentUser) navigate("/login");
  }, [currentUser, navigate]);

  // ✅ Flatten API response into frontend-friendly structure
  const flattenCustomer = (customer) => ({
    id: customer.id,
    tenantId: customer.tenantId,
    name: customer.name || "-",
    phoneNumber: customer.phoneNumber || "-",
    email: customer.email || "-",
    nationalId: customer.nationalId || "-",
    schemeId: customer.schemeId || null,
    schemeName: customer.scheme?.name || "-",
    zoneId: customer.zoneId || null,
    zoneName: customer.zone?.name || "-",
    routeId: customer.routeId || null,
    routeName: customer.route?.name || "-",
    status: customer.status || "-",
    createdAt: customer.createdAt || null,
    proposedTarrifCategoryId: customer.surveys?.[0]?.proposedTarrifCategoryId || null,
  });

  // ✅ Fetch approved customers
  const fetchApprovedCustomers = useCallback(
    debounce(async (search = "") => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/get-approved-customer`, {
          withCredentials: true,
          params: {
            page: page + 1,
            limit,
            search: search || undefined,
          },
        });

        // ✅ Your backend returns data[] directly, not data.applications[]
        const validCustomers = (res.data.data || [])
          .filter((cust) => cust && typeof cust === "object" && cust.id)
          .map(flattenCustomer);

        setApprovedCustomers(validCustomers);
        setTotal(res.data.count || validCustomers.length);
      } catch (err) {
        console.error("Error fetching approved customers:", err);
        setError("Failed to load approved customers.");
      } finally {
        setLoading(false);
      }
    }, 400),
    [page, limit]
  );

  // ✅ Fetch tariff categories
  const fetchTariffCategories = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/tarrifs/block`, { withCredentials: true });
      const tariffData = res.data.data || [];
      const uniqueCategories = Object.values(
        tariffData.reduce((acc, t) => {
          acc[t.categoryId] = { id: t.categoryId, name: t.category.name };
          return acc;
        }, {})
      );
      setTariffCategories(uniqueCategories);
    } catch (err) {
      console.error("Error fetching tariff categories:", err);
      setError("Failed to load tariff categories.");
    }
  }, []);

  // ✅ Initial load
  useEffect(() => {
    fetchApprovedCustomers(searchQuery);
    fetchTariffCategories();
  }, [fetchApprovedCustomers, fetchTariffCategories, searchQuery]);

  // ✅ Handle search
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setPage(0);
    fetchApprovedCustomers(value);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setPage(0);
    fetchApprovedCustomers("");
  };

  // ✅ Handle form updates
  const updateForm = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setError("");
  };

  // ✅ Select a customer from DataGrid
  const handleSelectCustomer = (customer) => {
    const proposedTariffId = customer.proposedTarrifCategoryId;
    const validTariffId = tariffCategories.find((t) => t.id === proposedTariffId)
      ? proposedTariffId
      : tariffCategories[0]?.id || "";
    setSelectedCustomer(customer);
    setForm({
      customerName: customer.name || "",
      email: customer.email || "",
      phoneNumber: customer.phoneNumber || "",
      customerKraPin: "",
      customerDob: "",
      customerDeposit: "",
      customerIdNo: customer.nationalId || "",
      schemeId: customer.schemeId || "",
      zoneId: customer.zoneId || "",
      routeId: customer.routeId || "",
      tariffCategoryId: validTariffId,
    });
    setDialogOpen(true);
  };

  // ✅ Validate customer payload


  // ✅ Validate customer payload
const validatePayload = (payload) => {
  const errors = [];
  if (!payload.customerName) errors.push("Customer Name is required.");
  if (!payload.phoneNumber) errors.push("Phone Number is required.");
  if (!payload.tariffCategoryId) errors.push("Tariff Category is required.");
  return errors;
};

// ✅ Submit new customer
const handleSubmit = async () => {
  const payload = {
    customerName: form.customerName.trim(),
    email: form.email?.trim() || null,
    phoneNumber: form.phoneNumber.trim(),
    customerKraPin: form.customerKraPin?.trim() || null,
    customerDob: form.customerDob || null,
    customerDeposit: form.customerDeposit ? Number(form.customerDeposit) : null,
    customerIdNo: form.customerIdNo?.trim() || null,
    schemeId: form.schemeId ? Number(form.schemeId) : null,
    zoneId: form.zoneId ? Number(form.zoneId) : null,
    routeId: form.routeId ? Number(form.routeId) : null,
    // ✅ keep as string, not number
    tariffCategoryId: form.tariffCategoryId || null,
    latitude: selectedCustomer?.latitude ? Number(selectedCustomer.latitude) : null,
    longitude: selectedCustomer?.longitude ? Number(selectedCustomer.longitude) : null,
  };

  const validationErrors = validatePayload(payload);
  if (validationErrors.length > 0) {
    setError(validationErrors.join(" "));
    return;
  }

  setLoading(true);
  try {
    const res = await axios.post(`${API_URL}/customers`, payload, { withCredentials: true });
    console.log("✅ Customer created:", res.data);
    setDialogOpen(false);
    setSelectedCustomer(null);
    setForm({
      customerName: "",
      email: "",
      phoneNumber: "",
      customerKraPin: "",
      customerDob: "",
      customerDeposit: "",
      customerIdNo: "",
      schemeId: "",
      zoneId: "",
      routeId: "",
      tariffCategoryId: "",
    });
    fetchApprovedCustomers(searchQuery);
    alert("Customer created successfully!");
  } catch (err) {
    console.error("Error creating customer:", err);
    setError(err.response?.data?.message || "Failed to create customer.");
  } finally {
    setLoading(false);
  }
};


  // ✅ DataGrid Columns
  const columns = useMemo(
    () => [
      {
        field: "actions",
        headerName: "Actions",
        width: 120,
        renderCell: (params) => (
          <Button
            variant="outlined"
             color="theme.palette.primary.contrastText"
            size="small"
            onClick={() => handleSelectCustomer(params.row)}
            sx={{ color: theme.palette.primary.contrastText }}
          >
            Select
          </Button>
        ),
      },
      { field: "name", headerName: "Customer Name", width: 180 },
      { field: "phoneNumber", headerName: "Phone Number", width: 150 },
      { field: "email", headerName: "Email", width: 200 },
      { field: "schemeName", headerName: "Scheme", width: 130 },
      { field: "zoneName", headerName: "Zone", width: 130 },
      { field: "routeName", headerName: "Route", width: 130 },
    ],
    [theme]
  );

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", p: 2 }}>
      <Typography variant="h5" fontWeight="bold" mb={2}>
        Select a Record to Add a Customer
      </Typography>

      {/* 🔍 Search Bar */}
      <Box mb={2} display="flex" alignItems="center">
        <TextField
          placeholder="Search by name, phone, email, or ID"
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton onClick={handleClearSearch} size="small">
                  <Clear />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{ width: "50%", mr: 2 }}
        />
        <Typography variant="body2" color="text.secondary">
          Showing {approvedCustomers.length} of {total} records
        </Typography>
      </Box>

      {/* DataGrid */}
      <Box sx={{ flex: 1 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <CircularProgress />
          </Box>
        ) : (
          <DataGrid
            rows={approvedCustomers}
            columns={columns}
            getRowId={(row) => row.id}
            pageSizeOptions={[10, 25, 50]}
            paginationModel={{ page, pageSize: limit }}
            onPaginationModelChange={(model) => {
              setPage(model.page);
              setLimit(model.pageSize);
            }}
            rowCount={total}
            paginationMode="server"
            disableRowSelectionOnClick
            sx={{ height: "calc(100vh - 250px)" }}
            localeText={{ noRowsLabel: "No approved customers found" }}
          />
        )}
      </Box>

      {/* Dialog Form */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add Customer: {selectedCustomer?.name}</DialogTitle>
        <DialogContent>
          <TextField
            label="Customer Name"
            fullWidth
            required
            margin="dense"
            value={form.customerName}
            onChange={updateForm("customerName")}
          />
          <TextField
            label="Phone Number"
            fullWidth
            required
            margin="dense"
            value={form.phoneNumber}
            onChange={updateForm("phoneNumber")}
          />
          <TextField
            label="Email"
            type="email"
            fullWidth
            margin="dense"
            value={form.email}
            onChange={updateForm("email")}
          />
          <TextField
            label="National ID"
            fullWidth
            margin="dense"
            value={form.customerIdNo}
            onChange={updateForm("customerIdNo")}
          />
          <TextField
            label="Deposit"
            type="number"
            fullWidth
            margin="dense"
            value={form.customerDeposit}
            onChange={updateForm("customerDeposit")}
          />
          <TextField
            select
            label="Tariff Category"
            fullWidth
            margin="dense"
            value={form.tariffCategoryId}
            onChange={updateForm("tariffCategoryId")}
            required
          >
            <MenuItem value="">— Select Tariff Category —</MenuItem>
            {tariffCategories.map((tariff) => (
              <MenuItem key={tariff.id} value={tariff.id}>
                {tariff.name}
              </MenuItem>
            ))}
          </TextField>
          {error && (
            <Typography color="error" variant="body2" mt={2}>
              {error}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading || !form.tariffCategoryId}
          >
            {loading ? <CircularProgress size={24} /> : "Create Customer"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CreateCustomerScreen;
