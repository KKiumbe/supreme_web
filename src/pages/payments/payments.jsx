import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  IconButton,
  Tooltip,
  Grid,
  Autocomplete,
  MenuItem,
  CircularProgress,
  Skeleton,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { Search as SearchIcon, Refresh as RefreshIcon, Download as DownloadIcon } from "@mui/icons-material";
import axios from "axios";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";

// Debounce hook
const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const PaymentsScreen = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));


  // State
  const [payments, setPayments] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [modeOfPayment, setModeOfPayment] = useState("");
  const debouncedSearch = useDebounce(search);

  // Payment modes

    const currentUser = useAuthStore((state) => state.currentUser);
    const navigate = useNavigate();
  
    const BASEURL = import.meta.env.VITE_BASE_URL;


      useEffect(() => {
        if (!currentUser) {
          navigate("/login");
        }
      }, [currentUser, navigate]);

  const paymentModes = ["MPESA", "CASH", "BANK_TRANSFER"];

  // Fetch payments
  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(modeOfPayment && { modeOfPayment }),
      });

      const res = await axios.get(`${BASEURL}/payments?${params}`,{
        withCredentials: true
      });
      if (!res.data?.data) {
        throw new Error("Invalid API response structure");
      }

      setPayments(res.data.data || []);
      setPagination({
        page: res.data.page || 1,
        pageSize: res.data.pageSize || 10,
        totalCount: res.data.totalCount || 0,
        totalPages: res.data.totalPages || 1,
      });
    } catch (err) {
      console.error("Failed to fetch payments:", err);
      setError(err.response?.data?.message || "Failed to load payments");
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, debouncedSearch, modeOfPayment, BASEURL]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Handle search
  const handleSearch = (event, value) => {
    setSearch(value || "");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Reset filters
  const handleReset = () => {
    setSearch("");
    setModeOfPayment("");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Export to CSV
  const exportToCSV = (data, filename) => {
    const headers = ["Amount", "Mode of Payment", "Name", "Transaction ID", "Reference", "Created At"];
    const rows = data.map((payment) =>
      [
        payment.amount,
        payment.modeOfPayment,
        payment.name,
        payment.transactionId,
        payment.ref || "-",
        new Date(payment.createdAt).toLocaleString(),
      ]
        .map((field) => `"${field}"`)
        .join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Normalize payment data
  const normalizedPayments = useMemo(() => {
    return payments.map((payment) => ({
      id: payment.id,
      amount: `KES ${payment.amount.toLocaleString()}`,
      modeOfPayment: payment.modeOfPayment,
      name: payment.name,
      transactionId: payment.transactionId,
      ref: payment.ref || "-",
      createdAt: new Date(payment.createdAt).toLocaleString(),
    }));
  }, [payments]);

  // DataGrid columns
  const columns = useMemo(
    () => [
      { field: "amount", headerName: "Amount", width: 120 },
      { field: "modeOfPayment", headerName: "Payment Mode", width: 150 },
      { field: "name", headerName: "Name", width: 180 },
      { field: "transactionId", headerName: "Transaction ID", width: 200 },
      { field: "ref", headerName: "Reference", width: 150 },
      { field: "createdAt", headerName: "Created At", width: 200 },
    ],
    []
  );

  return (
    <Box
      sx={{
        p: 3,
        minHeight: "calc(100vh - 64px)",
        maxWidth: "100vw",
        overflow: "auto",
      }}
    >
      {/* Header */}
      <Grid container justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold">
          Payments
        </Typography>
        <Tooltip title="Export to CSV">
          <IconButton onClick={() => exportToCSV(normalizedPayments, "payments.csv")}>
            <DownloadIcon />
          </IconButton>
        </Tooltip>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Autocomplete
              options={payments.map((p) => p.name).concat(payments.map((p) => p.transactionId))}
              freeSolo
              onInputChange={handleSearch}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  size="small"
                  placeholder="Search by name or transaction ID"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />,
                  }}
                  inputProps={{
                    ...params.inputProps,
                    "aria-label": "Search payments by name or transaction ID",
                  }}
                />
              )}
              noOptionsText="No results found"
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Payment Mode"
              value={modeOfPayment}
              onChange={(e) => {
                setModeOfPayment(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            >
              <MenuItem value="">All</MenuItem>
              {paymentModes.map((mode) => (
                <MenuItem key={mode} value={mode}>
                  {mode}
                </MenuItem>
              ))}
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
      <Paper sx={{ height: "100%", minHeight: 400 }}>
        {loading ? (
          <Box>
            <Skeleton variant="rectangular" height={60} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" height={400} />
          </Box>
        ) : (
          <DataGrid
            rows={normalizedPayments}
            getRowId={(row) => row.id}
            columns={columns}
            loading={loading}
            pagination
            paginationMode="server"
            rowCount={pagination.totalCount}
            pageSizeOptions={[10, 20, 50]}
            paginationModel={{
              page: pagination.page - 1,
              pageSize: pagination.pageSize,
            }}
            onPaginationModelChange={(model) =>
              setPagination({
                ...pagination,
                page: model.page + 1,
                pageSize: model.pageSize,
              })
            }
            disableRowSelectionOnClick
            slots={{
              noRowsOverlay: () => (
                <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                  <Typography color="text.secondary">{error || "No payments found"}</Typography>
                </Box>
              ),
            }}
            sx={{ height: "100%" }}
          />
        )}
      </Paper>
    </Box>
  );
};

export default PaymentsScreen;