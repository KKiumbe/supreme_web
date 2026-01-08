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
  CircularProgress,
  Button,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import PriceChangeOutlinedIcon from "@mui/icons-material/PriceChangeOutlined";

import { Search as SearchIcon, Refresh as RefreshIcon, Visibility as VisibilityIcon } from "@mui/icons-material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

import BillDetails from "../../components/bills/billDetail";
import CreateAdjustmentDialog from "../../components/adjustments/CreateAdjustmentDialog";

// Simple debounce hook
const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

const BASE_URL = import.meta.env.VITE_BASE_URL || "";

const BillList = () => {
  const { currentUser } = useAuthStore();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // ── State ───────────────────────────────────────
  const [bills, setBills] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [customers, setCustomers] = useState([]);
  const [billTypes, setBillTypes] = useState([]);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);

  const [billTypeFilter, setBillTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [selectedBillId, setSelectedBillId] = useState(null);
  const [billDetails, setBillDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);
  const [billForAdjustment, setBillForAdjustment] = useState(null);

  // ── Fetch dropdown data ─────────────────────────
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [custRes, typesRes] = await Promise.all([
          axios.get(`${BASE_URL}/customers`, { withCredentials: true }),
          axios.get(`${BASE_URL}/get-bill-types`, { withCredentials: true }),
        ]);

        setCustomers(custRes.data?.data?.customers || []);
        setBillTypes(typesRes.data?.data || []);
      } catch (err) {
        console.error("Failed to load dropdowns:", err);
        setError("Failed to load customers or bill types");
      }
    };

    fetchDropdownData();
  }, []);

  // ── Fetch bills list ────────────────────────────
  const fetchBills = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(billTypeFilter && { billType: billTypeFilter }),
        ...(statusFilter && { status: statusFilter }),
      });

      const res = await axios.get(`${BASE_URL}/get-bills?${params}`, {
        withCredentials: true,
      });

      if (!res.data?.success) {
        throw new Error("Invalid API response");
      }

      setBills(res.data.data || []);
      setPagination((prev) => ({
        ...prev,
        total: res.data.pagination?.total || 0,
      }));
    } catch (err) {
      console.error("Failed to fetch bills:", err);
      setError(err.response?.data?.message || "Failed to load bills");
      setBills([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, debouncedSearch, billTypeFilter, statusFilter]);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  // ── Fetch single bill details ───────────────────
  const fetchBillDetails = useCallback(async (billId) => {
    setDetailsLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/get-bill/${billId}`, {
        withCredentials: true,
      });

      if (res.data?.success) {
        setBillDetails(res.data.data);
      } else {
        throw new Error("Invalid bill response");
      }
    } catch (err) {
      console.error("Failed to fetch bill details:", err);
      setError(err.response?.data?.message || "Failed to load bill details");
      setBillDetails(null);
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  // ── Handlers ────────────────────────────────────
  const handleViewBill = (billId) => {
    setSelectedBillId(billId);
    fetchBillDetails(billId);
  };

  const handleOpenAdjustment = (bill) => {
    setBillForAdjustment(bill);
    setAdjustmentDialogOpen(true);
  };

  const handleResetFilters = () => {
    setSearch("");
    setBillTypeFilter("");
    setStatusFilter("");
    setPagination((p) => ({ ...p, page: 1 }));
  };

  // ── Prepare rows for DataGrid ───────────────────
  const rows = useMemo(() => {
    const billTypeMap = {};
    billTypes.forEach((t) => {
      billTypeMap[t.id] = t.name;
    });

    return bills.map((bill) => ({
      id: bill.id,
      originalBill: bill,           // keep full object for adjustment & actions
      billNumber: bill.billNumber || "—",
      customerName: bill.connection?.customer?.customerName || "—",
      phoneNumber: bill.connection?.customer?.phoneNumber || "—",
      billAmount: bill.billAmount ? `KES ${bill.billAmount.toLocaleString()}` : "—",
      amountPaid: bill.amountPaid ? `KES ${bill.amountPaid.toLocaleString()}` : "—",
      closingBalance: bill.closingBalance ? `KES ${bill.closingBalance.toLocaleString()}` : "—",
      status: bill.status || "—",
      billPeriod: bill.billPeriod ? new Date(bill.billPeriod).toLocaleDateString() : "—",
      createdAt: bill.createdAt ? new Date(bill.createdAt).toLocaleString() : "—",
      billType: billTypeMap[bill.type?.id] || bill.type?.name || "—",
      items: bill.items?.length
        ? bill.items
            .map((i) => `${i.description} (×${i.quantity}, KES ${i.amount})`)
            .join(", ")
        : "—",
    }));
  }, [bills, billTypes]);

  const columns = [

{
  field: "actions",
  headerName: "Details/Adjust",
  width: 130,
  sortable: false,
  renderCell: ({ row }) => (
    <>
      <Tooltip title="View Bill">
        <IconButton size="small" onClick={() => handleViewBill(row.id)}>
          <VisibilityIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Create Adjustment">
        <IconButton
          size="small"
          //color="primary"
          onClick={() => handleOpenAdjustment(row.originalBill)}
        >
          <PriceChangeOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </>
  ),
},

    { field: "billNumber", headerName: "Bill No.", width: 140 },
    { field: "customerName", headerName: "Customer", width: 180 },
    { field: "phoneNumber", headerName: "Phone", width: 130 },
    { field: "billAmount", headerName: "Amount", width: 110 },
    { field: "amountPaid", headerName: "Paid", width: 110 },
    { field: "closingBalance", headerName: "Balance", width: 110 },
    {
      field: "status",
      headerName: "Status",
      width: 100,
      renderCell: ({ value }) => (
        <Chip
          label={value}
          color={value === "PAID" ? "success" : value === "UNPAID" ? "warning" : "default"}
          size="small"
        />
      ),
    },
    { field: "billPeriod", headerName: "Period", width: 110 },
    { field: "createdAt", headerName: "Created", width: 160 },
    { field: "billType", headerName: "Type", width: 110 },
    {
      field: "items",
      headerName: "Items",
      width: 260,
      renderCell: ({ value }) => (
        <Tooltip title={value || ""}>
          <Box component="span" sx={{ textOverflow: "ellipsis", overflow: "hidden" }}>
            {value}
          </Box>
        </Tooltip>
      ),
    },
  ];

  if (!currentUser) {
    navigate("/login");
    return null;
  }

  return (
    <Box
      sx={{
        p: 3,
        display: "flex",
        gap: 2,
        minHeight: "calc(100vh - 64px)",
        overflow: "hidden",
      }}
    >
      {/* Main content */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Bills
        </Typography>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="flex-end">
            <Grid item xs={12} sm={5} md={4}>
              <Autocomplete
                options={customers}
                getOptionLabel={(opt) =>
                  `${opt.customerName} (${opt.nationalId || "?"})` +
                  (opt.phoneNumber ? ` — ${opt.phoneNumber}` : "")
                }
                freeSolo
                onInputChange={(_, val) => setSearch(val || "")}
                onChange={(_, val) => setSearch(val?.customerName || "")}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    placeholder="Name, phone, national ID..."
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />,
                    }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={6} sm={3} md={2}>
              <TextField
                select
                fullWidth
                size="small"
                label="Bill Type"
                value={billTypeFilter}
                onChange={(e) => {
                  setBillTypeFilter(e.target.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
              >
                <MenuItem value="">All</MenuItem>
                {billTypes.map((t) => (
                  <MenuItem key={t.id} value={t.name}>
                    {t.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={6} sm={2} md={2}>
              <TextField
                select
                fullWidth
                size="small"
                label="Status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="PAID">Paid</MenuItem>
                <MenuItem value="UNPAID">Unpaid</MenuItem>
              </TextField>
            </Grid>

            <Grid item>
              <Tooltip title="Reset filters">
                <IconButton onClick={handleResetFilters}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        </Paper>

        {/* DataGrid */}
        <Paper sx={{ flex: 1, overflow: "hidden" }}>
          <DataGrid
            rows={rows}
            columns={columns}
            loading={loading}
            rowCount={pagination.total}
            paginationMode="server"
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
                <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Typography color="text.secondary">
                    {error || (loading ? "Loading..." : "No bills found")}
                  </Typography>
                </Box>
              ),
            }}
            sx={{ border: 0 }}
          />
        </Paper>
      </Box>

      {/* Right sidebar – Bill Details */}
      <Box
        sx={{
          width: selectedBillId ? 460 : 0,
          flexShrink: 0,
          bgcolor: "background.paper",
          borderLeft: "1px solid",
          borderColor: "divider",
          transition: "width 0.3s ease",
          overflowY: "auto",
          boxShadow: "-4px 0 12px rgba(0,0,0,0.08)",
        }}
      >
        {detailsLoading ? (
          <Box p={4} display="flex" justifyContent="center">
            <CircularProgress />
          </Box>
        ) : billDetails ? (
          <BillDetails task={billDetails} onClose={() => setSelectedBillId(null)} />
        ) : selectedBillId ? (
          <Box p={3}>
            <Typography color="error">Failed to load bill details</Typography>
            <Button variant="outlined" onClick={() => setSelectedBillId(null)} sx={{ mt: 2 }}>
              Close
            </Button>
          </Box>
        ) : null}
      </Box>

      {/* Adjustment Dialog */}
      <CreateAdjustmentDialog
        open={adjustmentDialogOpen}
        invoiceId={billForAdjustment?.id}
        billNumber={billForAdjustment?.billNumber}
        customerName={billForAdjustment?.connection?.customer?.customerName}
        onClose={() => {
          setAdjustmentDialogOpen(false);
          setBillForAdjustment(null);
        }}
        onSuccess={() => {
          fetchBills();
          setAdjustmentDialogOpen(false);
          setBillForAdjustment(null);
        }}
      />
    </Box>
  );
};

export default BillList;