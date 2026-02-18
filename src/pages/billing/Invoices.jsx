import { useState, useEffect, useCallback, useMemo } from "react";
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
  CircularProgress,
  Alert,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import PriceChangeOutlinedIcon from "@mui/icons-material/PriceChangeOutlined";

import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import {
  PermissionDeniedUI,
  isPermissionDenied,
} from "../../utils/permissionHelper";

import BillDetails from "../../components/bills/billDetail";
import CreateAdjustmentDialog from "../../components/adjustments/CreateAdjustmentDialog";

// ── Helpers ───────────────────────────────────────

// ── Constants ─────────────────────────────────────
const BASE_URL = import.meta.env.VITE_BASE_URL || "";

// ── Main Component ────────────────────────────────
const BillList = () => {
  const { currentUser } = useAuthStore();
  const navigate = useNavigate();

  // ── State ───────────────────────────────────────
  const [bills, setBills] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const [billTypes, setBillTypes] = useState([]);

  // Connection-based search
  const [connections, setConnections] = useState([]);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [connectionInputValue, setConnectionInputValue] = useState("");

  // Bill detail sidebar
  const [selectedBillId, setSelectedBillId] = useState(null);
  const [billDetails, setBillDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Adjustment dialog
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);
  const [billForAdjustment, setBillForAdjustment] = useState(null);

  // ── Data Fetching ─────────────────────────────────
  // Load bill types once
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const { data } = await axios.get(`${BASE_URL}/get-bill-types`, {
          withCredentials: true,
        });
        setBillTypes(data?.data || []);
      } catch (err) {
        console.error("Failed to load bill types:", err);
      }
    };

    fetchInitialData();
  }, []);

  // Search connections (debounced)
  useEffect(() => {
    const search = connectionInputValue.trim();

    if (!search || (search.match(/^\d+$/) && search.length > 6)) {
      setConnections([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const { data } = await axios.get(
          `${BASE_URL}/get-connections?search=${encodeURIComponent(search)}`,
          { withCredentials: true },
        );
        setConnections(data?.data || []);
      } catch (err) {
        console.error("Failed to search connections:", err);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [connectionInputValue]);

  // Fetch bills – either for selected connection or all bills
  const fetchBills = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (selectedConnection) {
        // Fetch bills for specific connection
        const params = new URLSearchParams({
          page: pagination.page.toString(),
          limit: pagination.limit.toString(),
        });

        const res = await axios.get(
          `${BASE_URL}/connections/${selectedConnection.id}/bills?${params}`,
          { withCredentials: true },
        );

        setBills(res.data?.data || []);
        setPagination((prev) => ({
          ...prev,
          total: res.data?.meta?.total || 0,
        }));
      } else {
        // Fetch all bills with filters
        const params = new URLSearchParams({
          page: pagination.page.toString(),
          limit: pagination.limit.toString(),
        });

        const res = await axios.get(`${BASE_URL}/get-bills?${params}`, {
          withCredentials: true,
        });

        if (!res.data?.success) {
          throw new Error("Invalid response");
        }

        setBills(res.data.data || []);
        setPagination((prev) => ({
          ...prev,
          total: res.data.pagination?.total || 0,
        }));
      }
      setPermissionDenied(false);
    } catch (err) {
      console.error("Failed to fetch bills:", err);
      if (isPermissionDenied(err)) {
        setPermissionDenied(true);
        setBills([]);
      } else {
        setError(err.response?.data?.message || "Failed to load bills");
        setBills([]);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedConnection, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  // Fetch single bill details for sidebar
  const fetchBillDetails = useCallback(async (billId) => {
    setDetailsLoading(true);
    try {
      const { data } = await axios.get(`${BASE_URL}/get-bill/${billId}`, {
        withCredentials: true,
      });

      if (data?.success) {
        setBillDetails(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch bill details:", err);
      setBillDetails(null);
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  // ── Handlers ──────────────────────────────────────
  const handleViewBill = (billId) => {
    setSelectedBillId(billId);
    fetchBillDetails(billId);
  };

  const handleOpenAdjustment = (bill) => {
    setBillForAdjustment(bill);
    setAdjustmentDialogOpen(true);
  };

  const handleClearConnection = () => {
    setSelectedConnection(null);
    setConnectionInputValue("");
    setConnections([]);
    setPagination((p) => ({ ...p, page: 1 }));
  };

  // ── Data Preparation ──────────────────────────────
  const billTypeMap = useMemo(
    () => Object.fromEntries(billTypes.map((t) => [t.id, t.name])),
    [billTypes],
  );

  const rows = useMemo(
    () =>
      bills.map((bill) => ({
        id: bill.id,
        originalBill: bill,
        billNumber: bill.billNumber || "—",
        customerName:
          bill.connection?.customer?.customerName ||
          selectedConnection?.customerName ||
          "—",
        phoneNumber: bill.connection?.customer?.phoneNumber || "—",
        billAmount: bill.billAmount
          ? `KES ${Number(bill.billAmount).toLocaleString()}`
          : "—",
        amountPaid: bill.amountPaid
          ? `KES ${Number(bill.amountPaid).toLocaleString()}`
          : "—",
        closingBalance: bill.closingBalance
          ? `KES ${Number(bill.closingBalance).toLocaleString()}`
          : "—",
        status: bill.status || "—",
        billPeriod: bill.billPeriod
          ? new Date(bill.billPeriod).toLocaleDateString()
          : "—",
        createdAt: bill.createdAt
          ? new Date(bill.createdAt).toLocaleString()
          : "—",
        billType: billTypeMap[bill.type?.id] || bill.type?.name || "—",
        items:
          bill.items?.length > 0
            ? bill.items
                .map((i) => `${i.description} (×${i.quantity})`)
                .join(", ")
            : "—",
      })),
    [bills, billTypeMap, selectedConnection],
  );

  const columns = [
    {
      field: "actions",
      headerName: "Actions",
      width: 130,
      sortable: false,
      renderCell: ({ row }) => (
        <>
          <Tooltip title="View Details">
            <IconButton size="small" onClick={() => handleViewBill(row.id)}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Create Adjustment">
            <IconButton
              size="small"
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
          color={
            value === "PAID"
              ? "success"
              : value === "UNPAID"
                ? "warning"
                : "default"
          }
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
          <Box
            component="span"
            sx={{ textOverflow: "ellipsis", overflow: "hidden" }}
          >
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
      {permissionDenied ? (
        <PermissionDeniedUI permission="invoices:view" />
      ) : (
        <>
          {/* Main content */}
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
            }}
          >
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Bills Management
            </Typography>

            {/* Search Bar */}
            <Paper sx={{ p: 2, mb: 3 }}>
              <Grid container spacing={2} alignItems="flex-end">
                <Grid item xs={12} sm={6} md={5}>
                  <Autocomplete
                    options={connections}
                    value={selectedConnection}
                    inputValue={connectionInputValue}
                    onInputChange={(_, newInputValue, reason) => {
                      if (reason === "input") {
                        setConnectionInputValue(newInputValue);
                      }
                    }}
                    onChange={(_, newValue) => {
                      setSelectedConnection(newValue);
                      setPagination((prev) => ({ ...prev, page: 1 }));
                      // Optional: keep the typed text after selection for better UX
                      // setConnectionInputValue(newValue ? `${newValue.connectionNumber} - ${newValue.customer?.customerName}` : "");
                    }}
                    getOptionLabel={(option) => {
                      const customer = option.customer;
                      const account = option.customerAccounts?.[0];
                      return `${option.connectionNumber || "—"} | ${customer?.customerName || "—"} | ${customer?.phoneNumber || "—"} ${
                        account?.balance
                          ? `(Bal: KES ${Number(account.balance).toLocaleString()})`
                          : ""
                      }`;
                    }}
                    renderOption={(props, option) => {
                      const customer = option.customer;
                      const account = option.customerAccounts?.[0];
                      const balance = account?.balance
                        ? Number(account.balance).toLocaleString()
                        : "—";

                      return (
                        <li {...props} key={option.id}>
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              py: 0.5,
                            }}
                          >
                            <Typography variant="body2" fontWeight={600}>
                              {option.connectionNumber} —{" "}
                              {customer?.customerName || "Unknown"}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Phone: {customer?.phoneNumber || "—"} • Acc:{" "}
                              {account?.customerAccount || "—"}
                            </Typography>
                            <Typography
                              variant="caption"
                              color={Number(balance) < 0 ? "error" : "success"}
                            >
                              Balance: KES {balance} • {option.status}
                            </Typography>
                          </Box>
                        </li>
                      );
                    }}
                    isOptionEqualToValue={(option, value) =>
                      option.id === value?.id
                    }
                    loading={false} // you could add loading state if you want
                    noOptionsText={
                      connectionInputValue.length < 2
                        ? "Type at least 2 characters..."
                        : "No matching connections found"
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Search Connection / Name / Phone"
                        placeholder="e.g. 3639 or David Mugo or 798806690"
                        size="small"
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <>
                              <SearchIcon
                                sx={{ mr: 1, color: "text.secondary" }}
                              />
                              {params.InputProps.startAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid item>
                  <Tooltip title="Clear selection">
                    <IconButton onClick={handleClearConnection}>
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                </Grid>
              </Grid>

              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
            </Paper>

            {/* Data Grid */}
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
                    <Box
                      sx={{
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Typography color="text.secondary">
                        {error ||
                          (loading ? "Loading bills..." : "No bills found")}
                      </Typography>
                    </Box>
                  ),
                }}
                sx={{ border: 0 }}
              />
            </Paper>
          </Box>

          {/* Bill Details Sidebar */}
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
              <BillDetails
                task={billDetails}
                onClose={() => setSelectedBillId(null)}
              />
            ) : selectedBillId ? (
              <Box p={3}>
                <Typography color="error">
                  Failed to load bill details
                </Typography>
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
        </>
      )}
    </Box>
  );
};

export default BillList;
