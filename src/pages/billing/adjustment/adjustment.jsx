import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
  Snackbar,
  Alert,
  IconButton,
  Menu,
  MenuItem,
  CircularProgress,
  Divider,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import axios from "axios";

import { useAuthStore } from "../../../store/authStore";
import CreateAdjustmentDialog from "../../../components/adjustments/CreateAdjustmentDialog";

/* ───────────────────────── Constants & Helpers ───────────────────────── */

const BASE_URL = import.meta.env.VITE_BASE_URL || "";

const useDebounce = (value, delay = 600) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

const formatCurrency = (amount) =>
  typeof amount === "number" || typeof amount === "string"
    ? Number(amount).toLocaleString("en-KE", { style: "currency", currency: "KES" })
    : "—";

const flattenAdjustment = (adj) => {
  const invoice = adj.invoice ?? {};
  const connection = invoice.connection ?? {};
  const customer = connection.customer ?? {};

  return {
    id: adj.id,
    adjustmentType: adj.adjustmentType || "ADJUSTMENT",
    status: adj.status || "PENDING",
    reason: adj.reason || "—",
    requestedAmount: Number(adj.requestedAmount || 0),
    billNumber: invoice.billNumber || "—",
    customerName: customer.customerName || "—",
    phoneNumber: customer.phoneNumber || "—",
    connectionNumber: connection.connectionNumber || "—",
    requestedByName: adj.requestedByName || "—",
    approvedByName: adj.approvedByName || "—",
    amount: Number(invoice.billAmount || 0), // Full bill amount — crucial for cancellations
  };
};

/* ───────────────────────── Main Component ───────────────────────── */

export default function AdjustmentsList() {
  const { currentUser } = useAuthStore();

  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);

  const [selectInvoiceOpen, setSelectInvoiceOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const debouncedInvoiceSearch = useDebounce(invoiceSearch);
  const [invoiceOptions, setInvoiceOptions] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const [selectedAdjustment, setSelectedAdjustment] = useState(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const [toast, setToast] = useState({ open: false, message: "", severity: "info" });
  const showToast = useCallback((msg, severity = "info") => {
    setToast({ open: true, message: msg, severity });
  }, []);
  const handleCloseToast = () => setToast((t) => ({ ...t, open: false }));

  /* ───────────────────────── Fetch Adjustments ───────────────────────── */

  const fetchAdjustments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/adjustment`, { withCredentials: true });
      setAdjustments((res.data.data ?? []).map(flattenAdjustment));
    } catch (err) {
      console.error(err);
      showToast("Failed to load adjustments", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (currentUser) fetchAdjustments();
  }, [currentUser, fetchAdjustments]);

  /* ───────────────────────── Filtered Data ───────────────────────── */

  const filteredAdjustments = useMemo(() => {
    if (!debouncedSearch.trim()) return adjustments;

    const q = debouncedSearch.toLowerCase();
    return adjustments.filter((a) =>
      [
        a.billNumber,
        a.customerName,
        a.phoneNumber,
        a.connectionNumber,
        a.requestedByName,
        a.approvedByName,
        a.reason,
        a.status,
      ]
        .filter(Boolean)
        .some((v) => v.toString().toLowerCase().includes(q))
    );
  }, [adjustments, debouncedSearch]);

  /* ───────────────────────── Invoice Search ───────────────────────── */

  useEffect(() => {
    if (!debouncedInvoiceSearch.trim()) {
      setInvoiceOptions([]);
      return;
    }

    const loadInvoices = async () => {
      setSearchLoading(true);
      try {
        const params = new URLSearchParams({
          search: debouncedInvoiceSearch.trim(),
          limit: "20",
        });
        const res = await axios.get(`${BASE_URL}/get-bills?${params}`, {
          withCredentials: true,
        });
        if (res.data?.success) {
          setInvoiceOptions(res.data.data || []);
        }
      } catch {
        showToast("Failed to search invoices", "error");
      } finally {
        setSearchLoading(false);
      }
    };

    loadInvoices();
  }, [debouncedInvoiceSearch, showToast]);

  /* ───────────────────────── Approve / Reject ───────────────────────── */

  const handleApprove = async () => {
    if (!selectedAdjustment) return;

    try {
      const { id, adjustmentType } = selectedAdjustment;

      const endpoint =
        adjustmentType === "CANCELLATION"
          ? `${BASE_URL}/approve-bill/${id}`
          : `${BASE_URL}/adjustment/${id}/approve`;

      await axios.post(endpoint, {}, { withCredentials: true });

      showToast(
        adjustmentType === "CANCELLATION"
          ? "Bill cancellation approved successfully"
          : "Adjustment approved successfully",
        "success"
      );

      setApproveDialogOpen(false);
      setSelectedAdjustment(null);
      fetchAdjustments();
    } catch (err) {
      showToast(err?.response?.data?.message || "Approval failed", "error");
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      showToast("Please provide a rejection reason", "warning");
      return;
    }

    try {
      const { id, adjustmentType } = selectedAdjustment;

      const endpoint =
        adjustmentType === "CANCELLATION"
          ? `${BASE_URL}/reject-bill/${id}`
          : `${BASE_URL}/adjustment/${id}/reject`;

      await axios.post(
        endpoint,
        { reason: rejectReason.trim() },
        { withCredentials: true }
      );

      showToast(
        adjustmentType === "CANCELLATION"
          ? "Bill cancellation rejected"
          : "Adjustment rejected",
        "info"
      );

      setRejectDialogOpen(false);
      setRejectReason("");
      setSelectedAdjustment(null);
      fetchAdjustments();
    } catch {
      showToast("Rejection failed", "error");
    }
  };

  /* ───────────────────────── Action Menu ───────────────────────── */

  const AdjustmentActions = ({ row }) => {
    const [anchorEl, setAnchorEl] = useState(null);

    if (row.status !== "PENDING") return null;

    return (
      <>
        <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}>
          <MoreVertIcon fontSize="small" />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
        >
          <MenuItem
            onClick={() => {
              setSelectedAdjustment(row);
              setApproveDialogOpen(true);
              setAnchorEl(null);
            }}
          >
            Approve
          </MenuItem>
          <MenuItem
            onClick={() => {
              setSelectedAdjustment(row);
              setRejectDialogOpen(true);
              setAnchorEl(null);
            }}
          >
            Reject
          </MenuItem>
        </Menu>
      </>
    );
  };

  /* ───────────────────────── Columns ───────────────────────── */

  const columns = [
    {
      field: "actions",
      headerName: "",
      width: 60,
      renderCell: ({ row }) => <AdjustmentActions row={row} />,
    },
    {
      field: "status",
      headerName: "Status",
      width: 130,
      renderCell: ({ value }) => (
        <Chip
          size="small"
          label={value}
          color={value === "APPROVED" ? "success" : value === "REJECTED" ? "error" : "warning"}
        />
      ),
    },
    {
      field: "adjustmentType",
      headerName: "Type",
      width: 150,
      renderCell: ({ value }) => (
        <Chip
          size="small"
          label={value}
          color={value === "CANCELLATION" ? "error" : "info"}
          variant="outlined"
        />
      ),
    },
    { field: "billNumber", headerName: "Bill No.", width: 180 },
    { field: "customerName", headerName: "Customer", width: 220 },
    { field: "phoneNumber", headerName: "Phone", width: 140 },
    { field: "connectionNumber", headerName: "Conn #", width: 120 },
    {
      field: "amountDisplay",
      headerName: "Requested / Bill Amount",
      width: 180,
      align: "right",
      renderCell: ({ row }) => (
        <Typography fontWeight={600}>
          {row.adjustmentType === "CANCELLATION"
            ? formatCurrency(row.amount)
            : formatCurrency(row.requestedAmount)}
        </Typography>
      ),
    },
    { field: "reason", headerName: "Reason", width: 240, flex: 1 },
    { field: "requestedByName", headerName: "Requested By", width: 180 },
    { field: "approvedByName", headerName: "Approved By", width: 180 },
  ];

  if (!currentUser) return null;

  const isCancellation = selectedAdjustment?.adjustmentType === "CANCELLATION";

  /* ───────────────────────── Render ───────────────────────── */

  return (
    <Box sx={{ p: 3 }}>
      <Grid container justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold">
          Bill Adjustments & Cancellations
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setSelectInvoiceOpen(true)}
        >
          New Adjustment
        </Button>
      </Grid>

      <TextField
        size="small"
        fullWidth
        placeholder="Search by bill, customer, phone, connection..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        InputProps={{
          startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />,
        }}
        sx={{ mb: 3 }}
      />

      <Paper sx={{ height: 640, overflow: "hidden" }}>
        <DataGrid
          rows={filteredAdjustments}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
          sx={{ border: 0, "& .MuiDataGrid-columnHeaders": { backgroundColor: "#f5f5f5" } }}
        />
      </Paper>

      {/* Select Invoice Dialog */}
      <Dialog open={selectInvoiceOpen} onClose={() => setSelectInvoiceOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Select Invoice</DialogTitle>
        <DialogContent dividers>
          <Autocomplete
            fullWidth
            loading={searchLoading}
            options={invoiceOptions}
            getOptionLabel={(opt) => `${opt.billNumber} — ${opt.connection?.customer?.customerName || ""}`}
            onInputChange={(_, v) => setInvoiceSearch(v)}
            onChange={(_, v) => setSelectedInvoice(v)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search bill / customer / phone"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {searchLoading && <CircularProgress size={18} />}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectInvoiceOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!selectedInvoice}
            onClick={() => {
              setSelectInvoiceOpen(false);
              setCreateDialogOpen(true);
            }}
          >
            Continue
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Adjustment Dialog */}
      <CreateAdjustmentDialog
        open={createDialogOpen}
        onClose={() => {
          setCreateDialogOpen(false);
          setSelectedInvoice(null);
          setInvoiceSearch("");
        }}
        onSuccess={() => {
          showToast("Adjustment / cancellation request created successfully", "success");
          fetchAdjustments();
        }}
        showToast={showToast}
        invoiceId={selectedInvoice?.id}
        billNumber={selectedInvoice?.billNumber}
        customerName={selectedInvoice?.connection?.customer?.customerName}
      />

      {/* APPROVE NORMAL ADJUSTMENT */}
      <Dialog
        open={approveDialogOpen && !isCancellation}
        onClose={() => setApproveDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Approve Adjustment</DialogTitle>
        <DialogContent dividers>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            {selectedAdjustment?.customerName}
          </Typography>
          <Typography color="text.secondary" gutterBottom>
            Bill: {selectedAdjustment?.billNumber}
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Typography>
            Adjustment Amount:{" "}
            <strong>{formatCurrency(selectedAdjustment?.requestedAmount)}</strong>
          </Typography>
          <Alert severity="info" sx={{ mt: 3 }} icon={<WarningIcon />}>
            This will update the bill and customer balances.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleApprove}>
            Approve Adjustment
          </Button>
        </DialogActions>
      </Dialog>

      {/* CONFIRM CANCELLATION */}
      <Dialog
        open={approveDialogOpen && isCancellation}
        onClose={() => setApproveDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle color="error">Confirm Bill Cancellation</DialogTitle>
        <DialogContent dividers>
          <Alert severity="warning" sx={{ mb: 3 }} icon={<WarningIcon />}>
            <strong>This is a destructive action!</strong><br />
            The bill will be permanently cancelled and balances reversed.
          </Alert>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Customer: {selectedAdjustment?.customerName}
            </Typography>
            <Typography gutterBottom>
              Bill Number: {selectedAdjustment?.billNumber}
            </Typography>
            <Typography>
              Amount to Cancel:{" "}
              <Typography component="span" fontWeight={700} color="error.main">
                {formatCurrency(selectedAdjustment?.amount)}
              </Typography>
            </Typography>
          </Box>

          <Alert severity="error">
            This action <strong>cannot be undone</strong>.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleApprove}>
            Yes, Cancel Bill
          </Button>
        </DialogActions>
      </Dialog>

      {/* REJECT DIALOG */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject {isCancellation ? "Cancellation" : "Adjustment"}</DialogTitle>
        <DialogContent dividers>
          <TextField
            autoFocus
            fullWidth
            multiline
            rows={4}
            label="Rejection Reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Please provide a clear reason..."
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            disabled={!rejectReason.trim()}
            onClick={handleReject}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={6000}
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleCloseToast} severity={toast.severity} sx={{ width: "100%" }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}