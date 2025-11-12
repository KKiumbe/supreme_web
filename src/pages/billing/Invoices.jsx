import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  IconButton,
  Tooltip,
  Chip,
  Grid,
  Autocomplete,
  MenuItem,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { Search as SearchIcon, Refresh as RefreshIcon } from "@mui/icons-material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

// Debounce hook (reused from CustomersScreen)
const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const BASEURL = import.meta.env.VITE_BASE_URL || "";

const BillList = () => {
  const { currentUser } = useAuthStore();
  const navigate = useNavigate();

  // State
  const [bills, setBills] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [billTypes, setBillTypes] = useState([]);
  const [search, setSearch] = useState("");
  const [billType, setBillType] = useState("");
  const [status, setStatus] = useState("");
  const debouncedSearch = useDebounce(search);

  // Fetch customers and bill types
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [customersRes, billTypesRes] = await Promise.all([
          axios.get(`${BASEURL}/customers`, { withCredentials: true }),
          axios.get(`${BASEURL}/get-bill-types`, { withCredentials: true }),
        ]);

        setCustomers(customersRes.data?.data?.customers || []);
        setBillTypes(billTypesRes.data?.data || []);
      } catch (err) {
        console.error("Failed to load dropdowns:", err);
        setError("Failed to load customers or bill types");
      }
    };
    fetchDropdowns();
  }, []);

  // Fetch bills
  const fetchBills = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(billType && { billType }),
        ...(status && { status }),
      });

      const res = await axios.get(`${BASEURL}/get-bills?${params}`, { withCredentials: true });
      
      // Validate response structure
      if (!res.data?.success || !res.data?.data) {
        throw new Error("Invalid API response structure");
      }

      setBills(res.data.data || []);
      setPagination({
        page: res.data.pagination?.page || 1,
        limit: res.data.pagination?.limit || 20,
        total: res.data.pagination?.total || 0,
        totalPages: res.data.pagination?.totalPages || 1,
        hasNext: res.data.pagination?.hasNext || false,
        hasPrev: res.data.pagination?.hasPrev || false,
      });
    } catch (err) {
      console.error("Failed to fetch bills:", err);
      setError(err.response?.data?.message || "Failed to load bills");
      setBills([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, debouncedSearch, billType, status]);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  // Handle search and customer selection
  const handleSearch = (event, value) => {
    setSearch(value || "");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleCustomerSelect = (event, value) => {
    setSearch(value ? value.customerName : "");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Reset filters
  const handleReset = () => {
    setSearch("");
    setBillType("");
    setStatus("");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Normalize bill data
  const normalizedBills = useMemo(() => {
    const billTypeMap = Object.fromEntries(billTypes.map((bt) => [bt.id, bt.name]));
    return bills.map((bill) => ({
      id: bill.id,
      billNumber: bill.billNumber || "-",
      customerName: bill.customer?.customerName || "-",
      phoneNumber: bill.customer?.phoneNumber || "-",
      billAmount: bill.billAmount ? `KES ${bill.billAmount}` : "-",
      amountPaid: bill.amountPaid ? `KES ${bill.amountPaid}` : "-",
      closingBalance: bill.closingBalance ? `KES ${bill.closingBalance}` : "-",
      status: bill.status || "-",
      billPeriod: bill.billPeriod ? new Date(bill.billPeriod) : "-",
      createdAt: bill.createdAt ? new Date(bill.createdAt) : "-",
      billType: billTypeMap[bill.type?.id] || bill.type?.name || "-",
      items: bill.items?.length
        ? bill.items
            .map((item) => `${item.description} (Qty: ${item.quantity}, KES ${item.amount})`)
            .join(", ")
        : "-",
    }));
  }, [bills, billTypes]);

  // DataGrid columns
  const columns = [
    { field: "billNumber", headerName: "Bill Number", width: 150 },
    { field: "customerName", headerName: "Customer Name", width: 180 },
    { field: "phoneNumber", headerName: "Phone Number", width: 140 },
    { field: "billAmount", headerName: "Bill Amount", width: 120 },
    { field: "amountPaid", headerName: "Amount Paid", width: 120 },
    { field: "closingBalance", headerName: "Closing Balance", width: 120 },
    {
      field: "status",
      headerName: "Status",
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params?.value}
          color={params?.value === "PAID" ? "success" : params?.value === "UNPAID" ? "warning" : "default"}
          size="small"
        />
      ),
    },
    { field: "billPeriod", headerName: "Bill Period", width: 120 },
    { field: "createdAt", headerName: "Created At", width: 160 },
    { field: "billType", headerName: "Bill Type", width: 120 },
    {
      field: "items",
      headerName: "Items",
      width: 250,
      renderCell: (params) => (
        <Tooltip title={params?.value}>
          <span>{params?.value}</span>
        </Tooltip>
      ),
    },
  ];

  if (!currentUser) {
    navigate("/login");
    return null;
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Grid container justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold">
          Bills
        </Typography>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Autocomplete
              options={customers}
              getOptionLabel={(option) =>
                `${option.customerName} (${option.nationalId})${
                  option.phoneNumber ? ` - ${option.phoneNumber}` : ""
                }`
              }
              onInputChange={handleSearch}
              onChange={handleCustomerSelect}
              freeSolo
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  size="small"
                  placeholder="Search by name, phone, or connection number"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />,
                  }}
                />
              )}
              noOptionsText="No customers found"
              isOptionEqualToValue={(option, value) => option.id === value.id}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Bill Type"
              value={billType}
              onChange={(e) => {
                setBillType(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            >
              <MenuItem value="">All</MenuItem>
              {billTypes.map((bt) => (
                <MenuItem key={bt.id} value={bt.name}>
                  {bt.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="PAID">Paid</MenuItem>
              <MenuItem value="UNPAID">Unpaid</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} md={1}>
            <Tooltip title="Reset Filters">
              <IconButton onClick={handleReset}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      </Paper>

      {/* DataGrid */}
      <Paper sx={{ height: 680 }}>
        <DataGrid
          rows={normalizedBills}
          getRowId={(row) => row.id}
          columns={columns}
          loading={loading}
          pagination
          paginationMode="server"
          rowCount={pagination.total}
          pageSizeOptions={[10, 20, 50]}
          paginationModel={{
            page: pagination.page - 1,
            pageSize: pagination.limit,
          }}
          onPaginationModelChange={(model) =>
            setPagination({
              ...pagination,
              page: model.page + 1,
              limit: model.pageSize,
            })
          }
          disableRowSelectionOnClick
          slots={{
            noRowsOverlay: () => (
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                height="100%"
              >
                <Typography color="text.secondary">
                  {error || "No bills found"}
                </Typography>
              </Box>
            ),
          }}
        />
      </Paper>
    </Box>
  );
};

export default BillList;