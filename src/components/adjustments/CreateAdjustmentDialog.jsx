import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Typography,
  Box,
} from "@mui/material";
import axios from "axios";
import PropTypes from "prop-types";

const BASEURL = import.meta.env.VITE_BASE_URL;

export default function CreateAdjustmentDialog({
  open,
  onClose,
  onSuccess,
  showToast,

  // REQUIRED
  invoiceId,

  // OPTIONAL (display only)
  billNumber,
  customerName,
}) {
  /* ---------------- State ---------------- */
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState("DEBIT");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /* ---------------- Reset on Close ---------------- */
  useEffect(() => {
    if (!open) {
      setAmount("");
      setDirection("DEBIT");
      setReason("");
      setSubmitting(false);
    }
  }, [open]);

  /* ---------------- Guard ---------------- */
  if (!invoiceId) return null;

  /* ---------------- Submit ---------------- */
  const handleSubmit = async () => {
    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
      showToast("Enter a valid adjustment amount.", "warning");
      return;
    }

    setSubmitting(true);

    try {
      await axios.post(
        `${BASEURL}/adjustment`,
        {
          invoiceId,
          amount: numericAmount,
          direction,
          reason,
        },
        { withCredentials: true }
      );

      showToast("Adjustment request submitted successfully.", "success");

      onClose();
      onSuccess?.();
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        "Failed to create adjustment.";
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Create Bill Adjustment</DialogTitle>

      <DialogContent dividers>
        {/* ---------------- Invoice Context ---------------- */}
        <Box mb={2}>
          <Typography variant="body2" color="text.secondary">
            Invoice
          </Typography>
          <Typography fontWeight="bold">
            {billNumber || "—"}
          </Typography>

          {customerName && (
            <Typography variant="body2" color="text.secondary">
              Customer: {customerName}
            </Typography>
          )}
        </Box>

        {/* ---------------- Adjustment Type ---------------- */}
        <TextField
          select
          fullWidth
          margin="normal"
          label="Adjustment Type"
          value={direction}
          onChange={(e) => setDirection(e.target.value)}
        >
          <MenuItem value="DEBIT">Increase (Debit)</MenuItem>
          <MenuItem value="CREDIT">Reduce (Credit)</MenuItem>
        </TextField>

        {/* ---------------- Amount ---------------- */}
        <TextField
          label="Amount"
          type="number"
          fullWidth
          margin="normal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputProps={{ min: 0 }}
        />

        {/* ---------------- Reason ---------------- */}
        <TextField
          label="Reason"
          fullWidth
          multiline
          minRows={2}
          margin="normal"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Optional explanation for this adjustment"
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting}
        >
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
}

CreateAdjustmentDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
  showToast: PropTypes.func.isRequired,

  invoiceId: PropTypes.string.isRequired,

  billNumber: PropTypes.string,
  customerName: PropTypes.string,
};
