import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Alert,
  Typography,
  Divider,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import axios from "axios";
import PropTypes from "prop-types";
import TaskforConnection from "../../tasks/taskToActiveConn/task";

const BASEURL = import.meta.env.VITE_BASE_URL;

export default function EditAbnormalReadingModal({
  open,
  onClose,
  reading,
  onSuccess,
}) {
  const [form, setForm] = useState({
    previousReading: "",
    currentReading: "",
    notes: "",
  });

  // 🔹 Average override
  const [useCustomAverage, setUseCustomAverage] = useState(false);
  const [averageConsumption, setAverageConsumption] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (reading) {
      setForm({
        previousReading: reading.previousReading ?? "",
        currentReading: reading.currentReading ?? "",
        notes: reading.notes ?? "",
      });

      setAverageConsumption(reading.average ?? "");
      setUseCustomAverage(false);
    }
  }, [reading]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  // ------------------------------------
  // UPDATE READING (CONFIRMATION)
  // ------------------------------------
  const openConfirm = () => setConfirmOpen(true);

  const confirmSaveReading = async () => {
    setConfirmOpen(false);
    setLoading(true);
    setError("");

    try {
      await axios.patch(
        `${BASEURL}/update-meter-reading/${reading.id}`,
        {
          previousReading: Number(form.previousReading),
          currentReading: Number(form.currentReading),
          notes: form.notes,
        },
        { withCredentials: true }
      );

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update meter reading.");
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------
  // BILL USING AVERAGE (OPTIONAL OVERRIDE)
  // ------------------------------------
  const billOnAverage = async () => {
    if (!reading?.meter?.connection?.id) return;

    setLoading(true);
    setError("");

    try {
      await axios.post(
        `${BASEURL}/bill-on-average`,
        {
          connectionId: reading.meter.connection.id,
          meterReadingID: reading.id,

          // ✅ ONLY send override if user enabled it
          ...(useCustomAverage && averageConsumption !== ""
            ? { averageConsumption: Number(averageConsumption) }
            : {}),
        },
        { withCredentials: true }
      );

      onSuccess();
      onClose();
      setTaskModalOpen(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to bill using average.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* MAIN MODAL */}
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Resolve Abnormal Meter Reading</DialogTitle>

        <DialogContent dividers>
          {error && <Alert severity="error">{error}</Alert>}

          <Typography variant="subtitle1" fontWeight={700} mt={1}>
            System / Customer Average:{" "}
            <span style={{ color: "green" }}>
              {reading?.average ?? "-"} units
            </span>
          </Typography>

          <Divider sx={{ my: 2 }} />

          {/* OPTION 1: UPDATE READING */}
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Update Meter Reading
          </Typography>

          <Box display="flex" flexDirection="column" gap={2}>
            <TextField
              label="Previous Reading"
              type="number"
              disabled
              value={form.previousReading}
            />

            <TextField
              label="Correct Current Reading"
              name="currentReading"
              type="number"
              value={form.currentReading}
              onChange={handleChange}
            />

            <TextField
              label="Notes (optional)"
              name="notes"
              multiline
              rows={2}
              value={form.notes}
              onChange={handleChange}
            />

            <Button
              variant="contained"
              color="primary"
              onClick={openConfirm}
              disabled={loading}
              sx={{ fontWeight: 700 }}
            >
              Save Corrected Reading
            </Button>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* OPTION 2: BILL USING AVERAGE */}
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Or Bill Using Average
          </Typography>

          <Typography color="text.secondary" mb={1}>
            Use average consumption when the reading is unreliable.
          </Typography>

          <FormControlLabel
            control={
              <Checkbox
                checked={useCustomAverage}
                onChange={(e) => setUseCustomAverage(e.target.checked)}
              />
            }
            label="Override system average"
          />

          {useCustomAverage && (
            <TextField
              label="Average Consumption (units)"
              type="number"
              value={averageConsumption}
              onChange={(e) => setAverageConsumption(e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
            />
          )}

          <Button
            variant="contained"
            color="warning"
            fullWidth
            onClick={billOnAverage}
            disabled={loading}
            sx={{ fontWeight: 700 }}
          >
            Bill Using Average Consumption
          </Button>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* CONFIRMATION MODAL */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirm Update</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to <strong>update the current reading</strong>?
            <br />
            This action cannot be undone. Customer will be billed automatically.
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={confirmSaveReading}
            disabled={loading}
          >
            Yes, Update Reading
          </Button>
        </DialogActions>
      </Dialog>

      {/* TASK CREATION MODAL */}
      {taskModalOpen && (
        <TaskforConnection
          open={taskModalOpen}
          onClose={() => setTaskModalOpen(false)}
          connectionId={reading?.meter?.connection?.id}
          meterId={reading?.meter?.id}
          customer={reading?.meter?.connection?.customer}
          taskTitle="Meter Inspection Required"
          description="The reading was abnormal and billed using average. Please inspect the meter."
        />
      )}
    </>
  );
}

EditAbnormalReadingModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  reading: PropTypes.object,
  onSuccess: PropTypes.func.isRequired,
};
