import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Typography,
  Button,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from "@mui/material";

import DownloadIcon from "@mui/icons-material/Download";
import CloseIcon from "@mui/icons-material/Close";
import CancelIcon from "@mui/icons-material/Cancel";

const BillDetails = ({ task: bill, onClose }) => {
  const API_URL = import.meta.env.VITE_BASE_URL;

  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!bill) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>No bill selected</Typography>
      </Box>
    );
  }

  const realBillId = bill?.billId;

  const {
    billNumber = "-",
    customer = {},
    billAmount = 0,
    amountPaid = 0,
    closingBalance = 0,
    status = "-",
    billPeriod = "-",
    createdAt = "-",
    type = {},
    items = [],
  } = bill;

  const customerName = customer.customerName || "-";
  const phoneNumber = customer.phoneNumber || "-";
  const billType = type.name || "-";

  const formattedBillPeriod =
    billPeriod && !isNaN(new Date(billPeriod).getTime())
      ? new Date(billPeriod).toLocaleDateString()
      : "-";

  const formattedCreatedAt =
    createdAt && !isNaN(new Date(createdAt).getTime())
      ? new Date(createdAt).toLocaleString()
      : "-";

  /* ---------------------------------
     🔒 UI Guard: Can Cancel?
  ---------------------------------- */
  const canCancel = useMemo(() => {
    if (status !== "UNPAID") return false;
    if (Number(amountPaid) > 0) return false;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59
    );

    const period = new Date(billPeriod);
    return period >= startOfMonth && period <= endOfMonth;
  }, [status, amountPaid, billPeriod]);

  /* ---------------------------------
     📥 Download
  ---------------------------------- */
  const downloadBill = async (billId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/download-bill/${billId}`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });

      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `Bill-${billNumber}.pdf`;
      a.click();

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  /* ---------------------------------
     ❌ Cancel Bill
  ---------------------------------- */
const submitCancellation = async () => {
  if (!reason.trim()) {
    setError("Cancellation reason is required.");
    return;
  }

  try {
    setLoading(true);
    setError("");

    const res = await fetch(`${API_URL}/cancel-bill/${realBillId}`, {
      method: "POST",
      credentials: "include", // ✅ cookie-based auth
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reason }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Cancellation failed");
    }

    setCancelOpen(false);
    onClose(); // triggers refresh upstream
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};


  return (
    <Box sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={2} gap={1}>
        <Typography variant="h6" fontWeight="bold">
          Bill Details
        </Typography>

        <Button size="small" onClick={onClose}>
          <CloseIcon />
        </Button>

        <Button
          variant="contained"
          size="small"
          onClick={() => downloadBill(realBillId)}
        >
          <DownloadIcon />
        </Button>

        {canCancel && (
          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={<CancelIcon />}
            onClick={() => setCancelOpen(true)}
          >
            Cancel Bill
          </Button>
        )}
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Bill Information */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" fontWeight="medium">
          Bill Information
        </Typography>

        <Box display="flex" justifyContent="space-between">
          <Typography color="text.secondary">Bill Number</Typography>
          <Typography>{billNumber}</Typography>
        </Box>

        <Box display="flex" justifyContent="space-between">
          <Typography color="text.secondary">Bill Type</Typography>
          <Typography>{billType}</Typography>
        </Box>

        <Box display="flex" justifyContent="space-between">
          <Typography color="text.secondary">Status</Typography>
          <Chip label={status} size="small" />
        </Box>

        <Box display="flex" justifyContent="space-between">
          <Typography color="text.secondary">Bill Period</Typography>
          <Typography>{formattedBillPeriod}</Typography>
        </Box>

        <Box display="flex" justifyContent="space-between">
          <Typography color="text.secondary">Created At</Typography>
          <Typography>{formattedCreatedAt}</Typography>
        </Box>
      </Paper>

      {/* Financials */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" fontWeight="medium">
          Financial Details
        </Typography>

        <Box display="flex" justifyContent="space-between">
          <Typography>Bill Amount</Typography>
          <Typography>KES {billAmount.toLocaleString()}</Typography>
        </Box>

        <Box display="flex" justifyContent="space-between">
          <Typography>Amount Paid</Typography>
          <Typography>KES {amountPaid.toLocaleString()}</Typography>
        </Box>

        <Box display="flex" justifyContent="space-between">
          <Typography>Closing Balance</Typography>
          <Typography>KES {closingBalance.toLocaleString()}</Typography>
        </Box>
      </Paper>

      {/* Items */}
      <Paper sx={{ p: 2, flex: 1, overflow: "auto" }}>
        <Typography variant="subtitle1" fontWeight="medium">
          Bill Items
        </Typography>

        {items.length ? (
          <List dense>
            {items.map((item, i) => (
              <ListItem key={i}>
                <ListItemText
                  primary={item.description}
                  secondary={`Qty ${item.quantity} — KES ${item.amount?.toLocaleString()}`}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography color="text.secondary">No items</Typography>
        )}
      </Paper>

      {/* Cancel Dialog */}
      <Dialog open={cancelOpen} onClose={() => setCancelOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cancel Bill</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Reason for cancellation"
            fullWidth
            multiline
            minRows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelOpen(false)}>Close</Button>
          <Button
            color="error"
            variant="contained"
            onClick={submitCancellation}
            disabled={loading}
          >
            Submit Cancellation
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

BillDetails.propTypes = {
  task: PropTypes.object,
  onClose: PropTypes.func,
};

export default BillDetails;
