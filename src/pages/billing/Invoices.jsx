import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  MenuItem,
  Grid,
  IconButton,
  Tooltip,
  Chip,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import axios from "axios";
import { useAuthStore } from "../../store/authStore";

const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

// Types
/**
 * @typedef {Object} BillType
 * @property {number} id
 * @property {string} name
 */

/**
 * @typedef {Object} Bill
 * @property {string} id
 * @property {string} billNumber
 * @property {{customerName?: string, phoneNumber?: string}=} customer
 * @property {number} billAmount
 * @property {number} amountPaid
 * @property {number} closingBalance
 * @property {string} status
 * @property {{name: string}=} type
 * @property {string} billPeriod
 * @property {string} createdAt
 */

/**
 * @typedef {Object} Pagination
 * @property {number} page
 * @property {number} limit
 * @property {number} total
 * @property {number} totalPages
 */

const InvoiceList = () => {
  const { currentUser } = useAuthStore();
  const BASEURL = import.meta.env.VITE_BASE_URL;

  // State
  const [rawBills, setRawBills] = useState([]);
  const [billTypes, setBillTypes] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [typeId, setTypeId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const debouncedSearch = useDebounce(search);

  // Fetch bill types
  useEffect(() => {
    const fetchBillTypes = async () => {
      try {
        const res = await axios.get(`${BASEURL}/get-bill-types`, {
          withCredentials: true,
        });
        // Ensure we always have an array
        const data = Array.isArray(res.data.data) ? res.data.data : [];
        setBillTypes(data);
      } catch (err) {
        console.error("Failed to load bill types", err);
        setBillTypes([]); // Fallback
      }
    };
    fetchBillTypes();
  }, [BASEURL]);

  // Fetch bills


  const fetchBills = useCallback(async () => {
  setLoading(true);
  setError(null);
  try {
    const params = new URLSearchParams({
      page: pagination.page.toString(),
      limit: pagination.limit.toString(),
      ...(debouncedSearch && { search: debouncedSearch }),
      ...(status && { status }),
      ...(typeId && { typeId }),
      ...(dateFrom && { dateFrom }),
      ...(dateTo && { dateTo }),
    });

    const res = await axios.get(`${BASEURL}/get-bills?${params}`, {
      withCredentials: true,
    });

    // ✅ FIX HERE
    const bills = Array.isArray(res.data.data) ? res.data.data : [];
    const pag = res.data.pagination || {
      page: 1,
      limit: 10,
      total: bills.length,
      totalPages: 1,
    };

    setRawBills(bills);
    setPagination({
      page: pag.page,
      limit: pag.limit,
      total: pag.total || 0,
      totalPages: pag.totalPages || 1,
    });
  } catch (err) {
    console.error("Error fetching bills:", err);
    setError(err.response?.data?.message || "Failed to load invoices");
    setRawBills([]);
  } finally {
    setLoading(false);
  }
}, [
  BASEURL,
  pagination.page,
  pagination.limit,
  debouncedSearch,
  status,
  typeId,
  dateFrom,
  dateTo,
]);


  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  // Reset filters
  const handleReset = () => {
    setSearch("");
    setStatus("");
    setTypeId("");
    setDateFrom("");
    setDateTo("");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Normalize data for DataGrid
  const normalizedBills = useMemo(() => {
    return rawBills.map((b) => ({
      id: b.id,
      billNumber: b.billNumber,
      customerName: b.customer?.customerName || "-",
      customerPhone: b.customer?.phoneNumber || "-",
      billAmount: b.billAmount,
      amountPaid: b.amountPaid,
      closingBalance: b.closingBalance,
      status: b.status,
      type: b.type?.name || "-",
      billPeriod: b.billPeriod.split("T")[0], // Format date
      createdAt: new Date(b.createdAt).toLocaleDateString(),
    }));
  }, [rawBills]);

  const columns = [
    { field: "billNumber", headerName: "Bill No.", width: 160 },
    { field: "customerName", headerName: "Customer", width: 180 },
    { field: "customerPhone", headerName: "Phone", width: 140 },
    {
      field: "type",
      headerName: "Type",
      width: 150,
    },
    {
      field: "billAmount",
      headerName: "Bill Amount (KES)",
      width: 160,
      valueFormatter: (params) => `KES ${params.value?.toLocaleString() || 0}`,
    },
    {
      field: "amountPaid",
      headerName: "Paid (KES)",
      width: 140,
      valueFormatter: (params) => `KES ${params.value?.toLocaleString() || 0}`,
    },
    {
      field: "closingBalance",
      headerName: "Balance (KES)",
      width: 150,
      valueFormatter: (params) => `KES ${params.value?.toLocaleString() || 0}`,
    },
    {
      field: "status",
      headerName: "Status",
      width: 130,
      renderCell: (params) => {
        const status = params.value;
        const color =
          status === "PAID"
            ? "success"
            : status === "PARTIALLY_PAID"
            ? "warning"
            : status === "CANCELLED"
            ? "error"
            : "default";
        return <Chip label={status.replace(/_/g, " ")} color={color} size="small" />;
      },
    },
    { field: "billPeriod", headerName: "Period", width: 130 },
    { field: "createdAt", headerName: "Created", width: 180 },
  ];

  if (!currentUser) return null;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Grid container justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold">
          Bills
        </Typography>
        <Tooltip title="Refresh">
          <IconButton onClick={fetchBills}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by Bill No. or Customer"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />,
              }}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="UNPAID">Unpaid</MenuItem>
              <MenuItem value="PARTIALLY_PAID">Partially Paid</MenuItem>
              <MenuItem value="PAID">Paid</MenuItem>
              <MenuItem value="CANCELLED">Cancelled</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Type"
              value={typeId}
              onChange={(e) => setTypeId(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {billTypes.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={2}>
            <TextField
              type="date"
              fullWidth
              size="small"
              label="From"
              InputLabelProps={{ shrink: true }}
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <TextField
              type="date"
              fullWidth
              size="small"
              label="To"
              InputLabelProps={{ shrink: true }}
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
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
              <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                <Typography color="text.secondary">
                  {error || "No invoices found"}
                </Typography>
              </Box>
            ),
          }}
        />
      </Paper>
    </Box>
  );
};

export default InvoiceList;