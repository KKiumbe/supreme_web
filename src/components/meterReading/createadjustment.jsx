import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Divider,
  Snackbar,
  Alert,
} from "@mui/material";
import axios from "axios";
import PropTypes from "prop-types";

const BASEURL = import.meta.env.VITE_BASE_URL;

export default function CreateMeterReadingAdjustment({
  meterReadingId,
  previousReading,
  onSuccess,
  onCancel,
}) {
  const [newReading, setNewReading] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const showToast = (message, severity = "info") =>
    setToast({ open: true, message, severity });

  const numericPrevious = Number(previousReading);
  const numericNew = Number(newReading);
  const isDecrease =
    newReading !== "" &&
    !Number.isNaN(numericNew) &&
    numericNew < numericPrevious;

  const validate = () => {
    if (newReading === "") {
      return "New reading is required";
    }

    if (Number.isNaN(numericNew)) {
      return "Reading must be a number";
    }

    // 👇 Soft enforcement for decreases
    if (isDecrease && !reason.trim()) {
      return "Reason is required when reducing a meter reading";
    }

    return "";
  };

  const submit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      await axios.post(
        `${BASEURL}/meter-readings/${meterReadingId}/adjustments`,
        {
          newReading: numericNew,
          reason,
        },
        { withCredentials: true }
      );

      showToast("Adjustment request submitted", "success");
      setNewReading("");
      setReason("");
      setError("");
      onSuccess?.();
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to create adjustment",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 2, mt: 2 }} variant="outlined">
      <Typography variant="subtitle1" fontWeight={600}>
        Request Meter Reading Adjustment
      </Typography>

      <Divider sx={{ my: 1 }} />

      {/* Context */}
      <Typography variant="body2" color="text.secondary" mb={1}>
        Previous Reading: <strong>{numericPrevious}</strong>
      </Typography>

      <TextField
        label="New Reading"
        type="number"
        fullWidth
        size="small"
        margin="dense"
        value={newReading}
        onChange={(e) => {
          setNewReading(e.target.value);
          setError("");
        }}
        error={!!error}
        helperText={error}
      />

      {/* ⚠️ Warning for decrease */}
      {isDecrease && (
        <Alert severity="warning" sx={{ mt: 1 }}>
          New reading is lower than the previous reading.  
          Please confirm this is intentional and provide a reason.
        </Alert>
      )}

      <TextField
        label={isDecrease ? "Reason (required)" : "Reason (optional)"}
        fullWidth
        size="small"
        multiline
        minRows={2}
        margin="dense"
        value={reason}
        onChange={(e) => {
          setReason(e.target.value);
          setError("");
        }}
      />

      <Box display="flex" gap={1} mt={2}>
        <Button
          variant="contained"
          fullWidth
          onClick={submit}
          disabled={loading}
        >
          Submit Request
        </Button>

        <Button
          variant="outlined"
          fullWidth
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
      </Box>

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast({ ...toast, open: false })}
      >
        <Alert
          severity={toast.severity}
          onClose={() => setToast({ ...toast, open: false })}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
}

CreateMeterReadingAdjustment.propTypes = {
  meterReadingId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    .isRequired,
  previousReading: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    .isRequired,
  onSuccess: PropTypes.func,
  onCancel: PropTypes.func,
};
