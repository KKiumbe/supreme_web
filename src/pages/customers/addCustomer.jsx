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
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import axios from "axios";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";
import { getTheme } from "../../store/theme";

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
  const [error, setError] = useState("");

  // Auth Check
  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  // Fetch Approved Customers
  const fetchApprovedCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/get-approved-customer`, { withCredentials: true });
      const validCustomers = (res.data.data || []).filter(
        (cust) => cust && typeof cust === "object" && cust.id
      );
      setApprovedCustomers(validCustomers);
    } catch (err) {
      console.error("Error fetching approved customers:", err);
      setError("Failed to load approved customers.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch Tariff Categories
  const fetchTariffCategories = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/tarrifs/block`, { withCredentials: true });
      const tariffData = res.data.data || [];
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
      console.error("Error fetching tariff categories:", err);
      setError("Failed to load tariff categories.");
    }
  }, []);

  // Initial Load
  useEffect(() => {
    fetchApprovedCustomers();
    fetchTariffCategories();
  }, [fetchApprovedCustomers, fetchTariffCategories]);

  // Form Handler
  const updateForm = (field) => (e) => {
    setForm((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
    setError("");
  };

  // Open Dialog with Selected Customer
  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setForm({
      customerName: customer.name || "",
      email: customer.email || "",
      phoneNumber: customer.phoneNumber || "",
      customerKraPin: "", // Not provided in approved customer
      customerDob: "", // Not provided
      customerDeposit: "", // Not provided
      customerIdNo: customer.nationalId || "",
      schemeId: customer.schemeId ? String(customer.schemeId) : "",
      zoneId: customer.zoneId ? String(customer.zoneId) : "",
      routeId: customer.routeId ? String(customer.routeId) : "",
      tariffCategoryId:
        customer.surveys?.[0]?.proposedTarrifCategoryId || "", // Use survey tariff if available
    });
    setDialogOpen(true);
  };

  // Submit Customer


  // Submit Customer
const handleSubmit = async () => {
  if (!form.customerName || !form.phoneNumber) {
    setError("Customer Name and Phone Number are required.");
    return;
  }

  const payload = {
    customerName: form.customerName,
    email: form.email || null,
    phoneNumber: form.phoneNumber,
    customerKraPin: form.customerKraPin || null,
    customerDob: form.customerDob || null,
    customerDeposit: form.customerDeposit ? Number(form.customerDeposit) : null,
    customerIdNo: form.customerIdNo || null,
    schemeId: form.schemeId ? Number(form.schemeId) : null,
    zoneId: form.zoneId ? Number(form.zoneId) : null,
    routeId: form.routeId ? Number(form.routeId) : null,
    tariffCategoryId: form.tariffCategoryId || null,
    latitude: selectedCustomer?.latitude ? Number(selectedCustomer.latitude) : null,
    longitude: selectedCustomer?.longitude ? Number(selectedCustomer.longitude) : null,
  };

  setLoading(true);
  try {
    await axios.post(`${API_URL}/customers`, payload, { withCredentials: true });
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
    fetchApprovedCustomers(); // Refresh list
    alert("Customer created successfully!");
  } catch (err) {
    console.error("Error creating customer:", err);
    setError(err.response?.data?.message || "Failed to create customer.");
  } finally {
    setLoading(false);
  }
};

  // DataGrid Columns
  const columns = useMemo(
    () => [
      {
        field: "name",
        headerName: "Customer Name",
        width: 150,
        valueGetter: (params) => params?.row?.name || "-",
      },
      {
        field: "phoneNumber",
        headerName: "Phone Number",
        width: 120,
        valueGetter: (params) => params?.row?.phoneNumber || "-",
      },
      {
        field: "email",
        headerName: "Email",
        width: 150,
        valueGetter: (params) => params?.row?.email || "-",
      },
      {
        field: "scheme",
        headerName: "Scheme",
        width: 120,
        valueGetter: (params) => params?.row?.scheme?.name || "-",
      },
      {
        field: "zone",
        headerName: "Zone",
        width: 120,
        valueGetter: (params) => params?.row?.zone?.name || "-",
      },
      {
        field: "route",
        headerName: "Route",
        width: 100,
        valueGetter: (params) => params?.row?.route?.name || "-",
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 120,
        renderCell: (params) => (
          <Button
            variant="outlined"
            size="small"
            onClick={() => handleSelectCustomer(params.row)}
          >
            Select
          </Button>
        ),
      },
    ],
    []
  );

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", p: 2 }}>
      <Typography variant="h5" fontWeight="bold" mb={2}>
        Add Approved Customers
      </Typography>

      <Box sx={{ flex: 1, overflow: "hidden" }}>
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : (
          <DataGrid
            rows={approvedCustomers}
            columns={columns}
            getRowId={(row) => row?.id || `fallback-${Math.random()}`}
            pageSizeOptions={[10, 25, 50]}
            pagination
            disableSelectionOnClick
            sx={{ height: "calc(100vh - 200px)" }}
            localeText={{ noRowsLabel: "No approved customers found" }}
          />
        )}
      </Box>

      {/* Customer Form Dialog */}
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
            label="KRA PIN"
            fullWidth
            margin="dense"
            value={form.customerKraPin}
            onChange={updateForm("customerKraPin")}
          />
          <TextField
            label="Date of Birth"
            type="date"
            fullWidth
            margin="dense"
            value={form.customerDob}
            onChange={updateForm("customerDob")}
            InputLabelProps={{ shrink: true }}
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
            label="Scheme"
            fullWidth
            margin="dense"
            value={form.schemeId}
            onChange={updateForm("schemeId")}
            disabled
          >
            <MenuItem value={form.schemeId}>
              {selectedCustomer?.scheme?.name || "-"}
            </MenuItem>
          </TextField>
          <TextField
            select
            label="Zone"
            fullWidth
            margin="dense"
            value={form.zoneId}
            onChange={updateForm("zoneId")}
            disabled
          >
            <MenuItem value={form.zoneId}>
              {selectedCustomer?.zone?.name || "-"}
            </MenuItem>
          </TextField>
          <TextField
            select
            label="Route"
            fullWidth
            margin="dense"
            value={form.routeId}
            onChange={updateForm("routeId")}
            disabled={!!form.routeId}
          >
            <MenuItem value={form.routeId}>
              {selectedCustomer?.route?.name || "-"}
            </MenuItem>
          </TextField>
          <TextField
            select
            label="Tariff Category"
            fullWidth
            margin="dense"
            value={form.tariffCategoryId}
            onChange={updateForm("tariffCategoryId")}
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
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "Create Customer"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CreateCustomerScreen;