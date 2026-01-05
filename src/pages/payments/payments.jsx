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
  Skeleton
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";
import axios from "axios";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";

/* -------------------------------------------------------
   Debounce Hook
------------------------------------------------------- */
const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

/* -------------------------------------------------------
   Screen
------------------------------------------------------- */
const PaymentsScreen = () => {

  const navigate = useNavigate();
  const currentUser = useAuthStore(state => state.currentUser);
  const BASEURL = import.meta.env.VITE_BASE_URL;

  /* -------------------------------------------------------
     Auth Guard
  ------------------------------------------------------- */
  useEffect(() => {
    if (!currentUser) navigate("/login");
  }, [currentUser, navigate]);

  /* -------------------------------------------------------
     State
  ------------------------------------------------------- */
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 1,
  });

  const [search, setSearch] = useState("");
  const [modeOfPayment, setModeOfPayment] = useState("");

  const debouncedSearch = useDebounce(search);

  const paymentModes = ["MPESA", "CASH", "BANK_TRANSFER"];

  /* -------------------------------------------------------
     Fetch Payments
  ------------------------------------------------------- */
  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
      });

      // 🔍 Smart search routing
      if (debouncedSearch) {
        if (/^\d{1,6}$/.test(debouncedSearch)) {
          params.append("ref", debouncedSearch);
        } else if (/^[a-zA-Z\s]+$/.test(debouncedSearch)) {
          params.append("name", debouncedSearch);
        } else {
          params.append("transactionId", debouncedSearch);
        }
      }

      if (modeOfPayment) {
        params.append("mode", modeOfPayment);
      }

      const res = await axios.get(`${BASEURL}/payments?${params.toString()}`, {
        withCredentials: true,
      });

      setPayments(res.data?.data ?? []);
      setPagination({
        page: res.data.page,
        pageSize: res.data.pageSize,
        totalCount: res.data.totalCount,
        totalPages: res.data.totalPages,
      });
    } catch (err) {
      console.error("Failed to fetch payments:", err);
      setError(err.response?.data?.message || "Failed to load payments");
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [
    BASEURL,
    pagination.page,
    pagination.pageSize,
    debouncedSearch,
    modeOfPayment,
  ]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  /* -------------------------------------------------------
     Actions
  ------------------------------------------------------- */
  const handleSearch = (_, value) => {
    setSearch(value ?? "");
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleReset = () => {
    setSearch("");
    setModeOfPayment("");
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const exportToCSV = (data, filename) => {
    const headers = [
      "Amount",
      "Mode",
      "Name",
      "Transaction ID",
      "Reference",
      "Created At",
    ];

    const rows = data.map(p =>
      [
        p.amount,
        p.modeOfPayment,
        p.name,
        p.transactionId,
        p.ref || "-",
        p.createdAt,
      ]
        .map(v => `"${v}"`)
        .join(",")
    );

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* -------------------------------------------------------
     Normalize for DataGrid
  ------------------------------------------------------- */
  const normalizedPayments = useMemo(
    () =>
      payments.map(p => ({
        id: p.id,
        amount: `KES ${Number(p.amount).toLocaleString()}`,
        modeOfPayment: p.modeOfPayment,
        name: p.name,
        transactionId: p.transactionId,
        ref: p.ref ?? "-",
        createdAt: new Date(p.createdAt).toLocaleString(),
      })),
    [payments]
  );

  /* -------------------------------------------------------
     Columns
  ------------------------------------------------------- */
  const columns = useMemo(
    () => [
      { field: "amount", headerName: "Amount", width: 130 },
      { field: "modeOfPayment", headerName: "Payment Mode", width: 160 },
      { field: "name", headerName: "Name", width: 200 },
      { field: "transactionId", headerName: "Transaction ID", width: 220 },
      { field: "ref", headerName: "Reference", width: 120 },
      { field: "createdAt", headerName: "Created At", width: 200 },
    ],
    []
  );

  /* -------------------------------------------------------
     Render
  ------------------------------------------------------- */
  return (
    <Box sx={{ p: 3, minHeight: "100vh" }}>
      {/* Header */}
      <Grid container justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold">
          Payments
        </Typography>
        <Tooltip title="Export CSV">
          <IconButton
            onClick={() =>
              exportToCSV(normalizedPayments, "payments.csv")
            }
          >
            <DownloadIcon />
          </IconButton>
        </Tooltip>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={5}>
            <Autocomplete
              freeSolo
              options={[]}
              onInputChange={handleSearch}
              renderInput={params => (
                <TextField
                  {...params}
                  size="small"
                  fullWidth
                  placeholder="Search by reference, name, or transaction ID"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />
                    ),
                  }}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              select
              size="small"
              fullWidth
              label="Payment Mode"
              value={modeOfPayment}
              onChange={e => {
                setModeOfPayment(e.target.value);
                setPagination(p => ({ ...p, page: 1 }));
              }}
            >
              <MenuItem value="">All</MenuItem>
              {paymentModes.map(mode => (
                <MenuItem key={mode} value={mode}>
                  {mode}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={1}>
            <Tooltip title="Reset">
              <IconButton onClick={handleReset}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      </Paper>

      {/* Table */}
      <Paper sx={{ minHeight: 400 }}>
        {loading ? (
          <>
            <Skeleton height={60} />
            <Skeleton height={400} />
          </>
        ) : (
          <DataGrid
            rows={normalizedPayments}
            columns={columns}
            getRowId={row => row.id}
            paginationMode="server"
            rowCount={pagination.totalCount}
            pageSizeOptions={[10, 20, 50]}
            paginationModel={{
              page: pagination.page - 1,
              pageSize: pagination.pageSize,
            }}
            onPaginationModelChange={model =>
              setPagination(prev => ({
                ...prev,
                page: model.page + 1,
                pageSize: model.pageSize,
              }))
            }
            disableRowSelectionOnClick
            slots={{
              noRowsOverlay: () => (
                <Box
                  height="100%"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Typography color="text.secondary">
                    {error || "No payments found"}
                  </Typography>
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
