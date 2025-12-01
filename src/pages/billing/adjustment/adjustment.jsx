import React, { useState, useEffect, useCallback } from "react";
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
  CircularProgress,
  IconButton,
  Tooltip,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { Check, Close, Add, Search } from "@mui/icons-material";
import axios from "axios";
import { useAuthStore } from "../../../store/authStore";
import { Snackbar, Alert } from "@mui/material";


const BASEURL = import.meta.env.VITE_BASE_URL;

const useDebounce = (value, delay = 600) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const h = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(h);
  }, [value]);
  return debounced;
};

export default function AdjustmentsList() {
  const { currentUser } = useAuthStore();
  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading] = useState(false);

  const [openCreate, setOpenCreate] = useState(false);

  // create form state
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [invoiceOptions, setInvoiceOptions] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [requestedAmount, setRequestedAmount] = useState("");
  const [reason, setReason] = useState("");
const [toast, setToast] = useState({
  open: false,
  severity: "info",
  message: "",
});

const [openReject, setOpenReject] = useState(false);
const [rejectId, setRejectId] = useState(null);
const [rejectReason, setRejectReason] = useState("");


  const debouncedInvoiceSearch = useDebounce(invoiceSearch);
const handleToastClose = () => {
  setToast((prev) => ({ ...prev, open: false }));
};
const showToast = (message, severity = "info") => {
  setToast({ open: true, message, severity });
};


  const flattenAdjustment = (a) => {
  const invoice = a.invoice || {};
  const customer = invoice.customer || {};
  const connections = customer.connections || [];

  return {
    id: a.id,
    status: a.status,
    reason: a.reason,
    oldAmount: a.oldAmount,
    requestedAmount: a.requestedAmount,
    difference: a.difference,
    createdAt: a.createdAt,

    // invoice fields
    invoiceId: invoice.id,
    billNumber: invoice.billNumber,
    billAmount: invoice.billAmount,
    billStatus: invoice.status,
    billPeriod: invoice.billPeriod,

    // customer fields
    customerId: customer.id,
    customerName: customer.customerName,
    phoneNumber: customer.phoneNumber,
    accountNumber: customer.accountNumber,
    customerIdNo: customer.customerIdNo,

    // connection (first connection)
    connectionNumber: connections[0]?.connectionNumber || null,
    plotNumber: connections[0]?.plotNumber || null,
  };
};


  // Fetch adjustments
const fetchAdjustments = async () => {
  try {
    setLoading(true);
    const res = await axios.get(`${BASEURL}/adjustment`, {
      withCredentials: true,
    });

    const rows = (res.data.data || []).map(flattenAdjustment);

    setAdjustments(rows);
  } catch (err) {
    console.error("Failed to fetch adjustments", err);
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchAdjustments();
  }, []);

  // Fetch bills for invoice search
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await axios.get(
          `${BASEURL}/get-bills?search=${debouncedInvoiceSearch}`,
          { withCredentials: true }
        );
        setInvoiceOptions(res.data.data || []);
      } catch (err) {
        console.error("Error searching invoices", err);
      }
    };

    fetchInvoices();
  }, [debouncedInvoiceSearch]);

  // Create Adjustment
const handleCreate = async () => {
  if (!selectedInvoice) {
    showToast("Please select an invoice first", "warning");
    return;
  }

  try {
    await axios.post(
      `${BASEURL}/adjustment`,
      { invoiceId: selectedInvoice.id, requestedAmount, reason },
      { withCredentials: true }
    );

    showToast("Adjustment created successfully!", "success");

    setOpenCreate(false);
    setRequestedAmount("");
    setReason("");
    setSelectedInvoice(null);
    setInvoiceSearch("");

    fetchAdjustments();
  } catch (err) {
    const msg = err.response?.data?.message || "Failed to create adjustment";
    showToast(msg, "error");
  }
};


  // Approve
const handleApprove = async (id) => {
  try {
    await axios.post(`${BASEURL}/adjustment/${id}/approve`, {}, { withCredentials: true });
    showToast("Adjustment approved successfully!", "success");
    fetchAdjustments();
  } catch (err) {
    const msg = err.response?.data?.message || "Failed to approve";
    showToast(msg, "error");
  }
};


const handleReject = async () => {
  if (!rejectReason.trim()) {
    showToast("Rejection reason is required", "warning");
    return;
  }

  try {
    await axios.post(
      `${BASEURL}/adjustment/${rejectId}/reject`,
      { reason: rejectReason },
      { withCredentials: true }
    );

    showToast("Adjustment rejected", "warning");
    setOpenReject(false);
    setRejectId(null);
    setRejectReason("");

    fetchAdjustments();
  } catch (err) {
    const msg = err.response?.data?.message || "Failed to reject";
    showToast(msg, "error");
  }
};



const columns = [
  {
    field: "actions",
    headerName: "Actions",
    width: 150,
    renderCell: (params) =>
      params.row.status === "PENDING" ? (
        <Box>
          <Tooltip title="Approve">
            <IconButton onClick={() => handleApprove(params.row.id)}>
              <Check color="success" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Reject">
           <IconButton
  onClick={() => {
    setRejectId(params.row.id);
    setRejectReason("");
    setOpenReject(true);
  }}
>

              <Close color="error" />
            </IconButton>
          </Tooltip>
        </Box>
      ) : (
        "—"
      ),
  },

   {
    field: "status",
    headerName: "Status",
    width: 130,
    renderCell: (params) => (
      <Chip
        label={params.value}
        color={
          params.value === "APPROVED"
            ? "success"
            : params.value === "REJECTED"
            ? "error"
            : "warning"
        }
        size="small"
      />
    ),
  },

  { field: "billNumber", headerName: "Invoice No", width: 160 },
  { field: "customerName", headerName: "Customer", width: 200 },
  { field: "phoneNumber", headerName: "Phone", width: 140 },
  { field: "connectionNumber", headerName: "Conn #", width: 130 },

  {
    field: "requestedAmount",
    headerName: "Requested Amount",
    width: 160,
    valueFormatter: (params) => `KES ${params?.value}`,
  },
  { field: "reason", headerName: "Reason", width: 200 },

 
];


  if (!currentUser) return null;

  return (
    <Box p={3}>
      <Grid container justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold">
          Bill Adjustments
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpenCreate(true)}>
          New Adjustment
        </Button>
      </Grid>

      <Paper sx={{ height: 600 }}>
        <DataGrid
          rows={adjustments}
          columns={columns}
          getRowId={(row) => row.id}
          loading={loading}
        />
      </Paper>

      {/* Create Adjustment Modal */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create Bill Adjustment</DialogTitle>
        <DialogContent dividers>
          <Autocomplete
            options={invoiceOptions}
            getOptionLabel={(option) =>
              `${option.billNumber} - ${option.customer?.customerName} (${option.customer?.phoneNumber})`
            }
            onInputChange={(e, val) => setInvoiceSearch(val)}
            onChange={(e, val) => setSelectedInvoice(val)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search Invoice"
                margin="normal"
                InputProps={{
                  ...params.InputProps,
                  startAdornment: <Search sx={{ mr: 1 }} />,
                }}
              />
            )}
          />

          <TextField
            label="Requested Amount"
            type="number"
            fullWidth
            margin="normal"
            value={requestedAmount}
            onChange={(e) => setRequestedAmount(e.target.value)}
          />

          <TextField
            label="Reason"
            fullWidth
            multiline
            minRows={2}
            margin="normal"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate}>
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openReject} onClose={() => setOpenReject(false)} fullWidth maxWidth="sm">
  <DialogTitle>Reject Adjustment</DialogTitle>

  <DialogContent dividers>
    <Typography mb={2}>
      Please provide a reason for rejecting this adjustment.
    </Typography>

    <TextField
      label="Rejection Reason"
      fullWidth
      multiline
      minRows={3}
      value={rejectReason}
      onChange={(e) => setRejectReason(e.target.value)}
    />
  </DialogContent>

  <DialogActions>
    <Button onClick={() => setOpenReject(false)}>Cancel</Button>
    <Button
      variant="contained"
      color="error"
      onClick={handleReject}
    >
      Reject
    </Button>
  </DialogActions>
</Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={handleToastClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleToastClose}
          severity={toast.severity}
          sx={{ width: "100%" }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
