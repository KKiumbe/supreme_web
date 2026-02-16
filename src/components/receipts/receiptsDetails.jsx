import { useState } from "react";
import {
  Box,
  Typography,
  Divider,
  IconButton,
  Chip,
  Paper,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import DeleteIcon from "@mui/icons-material/Delete";
import PropTypes from "prop-types";
import axios from "axios";
import { getTheme } from "../../store/theme";

const BASEURL = import.meta.env.VITE_BASE_URL;

export default function ReceiptDetails({ receipt, onClose }) {
  const theme = getTheme();
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [canceling, setCanceling] = useState(false);

  if (!receipt) {
    return (
      <Box p={3}>
        <Typography textAlign="center" color="text.secondary">
          No receipt selected
        </Typography>
      </Box>
    );
  }

  const handleDownload = () => {
    window.open(`${BASEURL}/receipt/download/${receipt.id}`, "_blank");
  };

  const handleOpenCancelDialog = () => {
    setOpenCancelDialog(true);
  };

  const handleCloseCancelDialog = () => {
    setOpenCancelDialog(false);
  };

  const handleConfirmCancel = () => {
    setOpenCancelDialog(false);
    setOpenConfirmDialog(true);
  };

  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false);
  };

  const handleCancelReceipt = async () => {
    setCanceling(true);
    try {
      const response = await axios.post(
        `${BASEURL}/receipt/${receipt.id}/cancel`,
        {},
        { withCredentials: true },
      );
      console.warn("Receipt cancellation response:", response.data);
      console.warn("Receipt cancelled successfully");
      handleCloseConfirmDialog();
      onClose();
    } catch (err) {
      console.warn("Receipt cancellation error:", err);
      console.error(
        `Error cancelling receipt: ${err.response?.data?.message || err.message}`,
      );
    } finally {
      setCanceling(false);
    }
  };

  return (
    <Box sx={{ width: 420, p: 3 }}>
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h6" fontWeight={600}>
          Receipt Details
        </Typography>

        <Box>
          <Tooltip title="Download PDF">
            <IconButton onClick={handleDownload} sx={{ mr: 1 }}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>

          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* SUMMARY */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography fontWeight={600} gutterBottom>
          Summary
        </Typography>

        <Detail label="Receipt Number" value={receipt.receiptNumber} />
        <Detail
          label="Amount"
          value={`KES ${parseFloat(receipt.amount).toLocaleString()}`}
        />
        <Detail label="Payment Mode" value={receipt.modeOfPayment} />
        <Detail label="Transaction Code" value={receipt.transactionCode} />
        <Detail label="Phone" value={receipt.phoneNumber || "-"} />
        <Detail
          label="Date"
          value={new Date(receipt.createdAt).toLocaleString()}
        />

        <Box mt={1}>
          <Chip
            label={receipt.status || "Completed"}
            color="success"
            size="small"
          />
        </Box>
      </Paper>

      {/* CUSTOMER INFO */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography fontWeight={600} gutterBottom>
          Customer Details
        </Typography>

        <Detail
          label="Customer Name"
          value={receipt.customer?.customerName || "-"}
        />
        <Detail
          label="Account"
          value={receipt.customer?.accountNumber || "-"}
        />
        <Detail
          label="Closing Balance"
          value={`KES ${parseFloat(
            receipt.customer?.closingBalance || 0,
          ).toLocaleString()}`}
        />
      </Paper>

      {/* INVOICES */}
      <Paper sx={{ p: 2 }}>
        <Typography fontWeight={600} gutterBottom>
          Invoices Paid
        </Typography>

        {!receipt.receiptInvoices?.length ? (
          <Typography color="text.secondary">No invoice items found</Typography>
        ) : (
          receipt.receiptInvoices.map((ri) => (
            <Box
              key={ri.id}
              sx={{
                mt: 1,
                p: 1.5,
                border: "1px solid #e0e0e0",
                borderRadius: 1,
              }}
            >
              <Detail label="Bill Number" value={ri.invoice?.billNumber} />
              <Detail
                label="Amount Paid"
                value={`KES ${parseFloat(ri.amount).toLocaleString()}`}
              />
              <Detail
                label="Billing Period"
                value={
                  ri.invoice?.billPeriod
                    ? new Date(ri.invoice.billPeriod).toLocaleDateString()
                    : "-"
                }
              />
              <Detail label="Status" value={ri.invoice?.status} />
            </Box>
          ))
        )}
      </Paper>

      {/* ACTIONS */}
      <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
        <Button
          variant="contained"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={handleOpenCancelDialog}
          fullWidth
        >
          Cancel Receipt
        </Button>
      </Box>

      {/* First Confirmation Dialog - Warning */}
      <Dialog
        open={openCancelDialog}
        onClose={handleCloseCancelDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{ color: theme.palette.error.main, fontWeight: "bold" }}
        >
          ⚠️ Cancel Receipt
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: theme.palette.text.primary, mt: 2 }}>
            <strong>This action will:</strong>
            <ul>
              <li>💰 Affect paid invoices</li>
              <li>📊 Reverse customer balance changes</li>
              <li>📧 Alert the affected customer via email</li>
            </ul>
            <strong>Receipt:</strong> {receipt.receiptNumber}
            <br />
            <strong>Customer:</strong> {receipt?.customer?.customerName}
            <br />
            <strong>Amount:</strong> KES{" "}
            {parseFloat(receipt?.amount).toLocaleString()}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseCancelDialog} variant="outlined">
            Keep Receipt
          </Button>
          <Button
            onClick={handleConfirmCancel}
            color="error"
            variant="contained"
          >
            Proceed to Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Second Confirmation Dialog - Final Confirmation */}
      <Dialog
        open={openConfirmDialog}
        onClose={handleCloseConfirmDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{ color: theme.palette.error.main, fontWeight: "bold" }}
        >
          🚨 Final Confirmation
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: theme.palette.text.primary, mt: 2 }}>
            <strong>
              Are you absolutely sure you want to cancel this receipt?
            </strong>
            <br />
            <br />
            This is a permanent action that will:
            <ul style={{ color: theme.palette.error.main }}>
              <li>❌ Reverse the payment</li>
              <li>❌ Restore invoice amounts</li>
              <li>❌ Update customer balance</li>
              <li>✉️ Send cancellation notice to customer</li>
            </ul>
            <strong style={{ color: theme.palette.error.main }}>
              Receipt: {receipt.receiptNumber}
            </strong>
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseConfirmDialog} variant="outlined">
            Don&apos;t Cancel
          </Button>
          <Button
            onClick={handleCancelReceipt}
            color="error"
            variant="contained"
            disabled={canceling}
          >
            {canceling ? "Canceling..." : "Yes, Cancel Receipt"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function Detail({ label, value }) {
  return (
    <Box display="flex" justifyContent="space-between" mb={0.8}>
      <Typography color="text.secondary">{label}</Typography>
      <Typography fontWeight={500}>{value}</Typography>
    </Box>
  );
}

Detail.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.any,
};

ReceiptDetails.propTypes = {
  receipt: PropTypes.object,
  onClose: PropTypes.func.isRequired,
};
