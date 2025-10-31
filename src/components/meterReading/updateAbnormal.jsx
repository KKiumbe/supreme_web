// src/components/meterReading/EditAbnormalReadingModal.jsx
import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  
  Alert,
} from "@mui/material";
import axios from "axios";
import PropTypes from "prop-types";

const BASEURL = import.meta.env.VITE_BASE_URL;

export default function EditAbnormalReadingModal({
  open,
  onClose,
  reading,
  onSuccess,
}) {
  const [form, setForm] = useState({
    previousReading: reading?.previousReading ?? "",
    currentReading: reading?.currentReading ?? "",
    notes: reading?.notes ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      await axios.patch(
        `${BASEURL}/update-meter-reading/${reading.id}`,
        {
          previousReading: Number(form.previousReading),
          currentReading: Number(form.currentReading),
          notes: form.notes,
          // status will be re-calculated by the backend (NORMAL/ABNORMAL)
        },
        { withCredentials: true }
      );
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update reading");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Correct Abnormal Reading</DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box display="flex" flexDirection="column" gap={2} mt={1}>
          <TextField
            label="Previous Reading"
            name="previousReading"
            type="number"
            inputProps={{ step: "0.01" }}
            value={form.previousReading}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            label="Current Reading"
            name="currentReading"
            type="number"
            inputProps={{ step: "0.01" }}
            value={form.currentReading}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            label="Notes (optional)"
            name="notes"
            multiline
            rows={2}
            value={form.notes}
            onChange={handleChange}
            fullWidth
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Saving…" : "Save"}
        </Button>
      </DialogActions>
      </Dialog>
  );
}

EditAbnormalReadingModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  reading: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    previousReading: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    currentReading: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    notes: PropTypes.string,
  }),
  onSuccess: PropTypes.func.isRequired,
};