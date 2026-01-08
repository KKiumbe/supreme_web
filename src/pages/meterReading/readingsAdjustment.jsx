import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Autocomplete,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { Check, Close } from "@mui/icons-material";
import axios from "axios";

import CreateMeterReadingAdjustment from "../../components/meterReading/createadjustment";

const BASEURL = import.meta.env.VITE_BASE_URL;

export default function MeterReadingAdjustmentsScreen() {
  /* ---------------- State ---------------- */
  const [searchOptions, setSearchOptions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedReading, setSelectedReading] = useState(null);

  const [adjustments, setAdjustments] = useState([]);
  const [rejecting, setRejecting] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const [processingId, setProcessingId] = useState(null);

  const [toast, setToast] = useState({
    open: false,
    severity: "success",
    message: "",
  });

  /* ---------------- Effects ---------------- */
  useEffect(() => {
    fetchAdjustments();
  }, []);

  /* ---------------- Helpers ---------------- */
  const showToast = (severity, message) => {
    setToast({ open: true, severity, message });
  };

  const handleApiError = (error, fallback) => {
    const res = error?.response;
    if (!res) {
      showToast("error", "Network error. Please try again.");
      return;
    }

    showToast(
      "error",
      res.data?.message || fallback || "An unexpected error occurred"
    );
  };

  /* ---------------- API ---------------- */
  const fetchAdjustments = async () => {
    try {
      const res = await axios.get(`${BASEURL}/meter-reading-adjustments`, {
        withCredentials: true,
      });
      setAdjustments(res.data.data || []);
    } catch (error) {
      handleApiError(error, "Failed to load adjustments");
    }
  };

  const searchMeterReadings = async (query) => {
    if (!query || query.length < 2) return;

    setSearchLoading(true);
    try {
      const res = await axios.get(`${BASEURL}/get-meter-readings`, {
        params: { search: query, limit: 10 },
        withCredentials: true,
      });
      setSearchOptions(res.data.data || []);
    } catch {
      showToast("error", "Failed to search meter readings");
    } finally {
      setSearchLoading(false);
    }
  };

  const approve = async (id) => {
    setProcessingId(id);
    try {
      const res = await axios.post(
        `${BASEURL}/meter-reading-adjustments/${id}/approve`,
        {},
        { withCredentials: true }
      );

      showToast("success", res.data.message);
      fetchAdjustments();
    } catch (error) {
      handleApiError(error, "Approval failed");
    } finally {
      setProcessingId(null);
    }
  };

  const reject = async () => {
    if (!rejectReason.trim()) {
      showToast("warning", "Rejection reason is required");
      return;
    }

    setProcessingId(rejecting);
    try {
      const res = await axios.post(
        `${BASEURL}/meter-reading-adjustments/${rejecting}/reject`,
        { reason: rejectReason },
        { withCredentials: true }
      );

      showToast("success", res.data.message);
      setRejecting(null);
      setRejectReason("");
      fetchAdjustments();
    } catch (error) {
      handleApiError(error, "Rejection failed");
    } finally {
      setProcessingId(null);
    }
  };

  /* ---------------- Columns ---------------- */
  const adjustmentColumns = [
    {
      field: "status",
      width: 120,
      renderCell: (p) => (
        <Chip
          size="small"
          label={p.value}
          color={
            p.value === "APPROVED"
              ? "success"
              : p.value === "REJECTED"
              ? "error"
              : "warning"
          }
        />
      ),
    },
    {
      field: "reading",
      headerName: "Old → New",
      width: 160,
      renderCell: (p) => (
        <Typography>
          {p.row.oldReading} → {p.row.newReading}
        </Typography>
      ),
    },
    {
      field: "actions",
      width: 120,
      renderCell: (p) =>
        p.row.status === "PENDING" && (
          <>
            <Tooltip title="Approve">
              <span>
                <IconButton
                  color="success"
                  disabled={processingId === p.row.id}
                  onClick={() => approve(p.row.id)}
                >
                  <Check />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Reject">
              <span>
                <IconButton
                  color="error"
                  disabled={processingId === p.row.id}
                  onClick={() => setRejecting(p.row.id)}
                >
                  <Close />
                </IconButton>
              </span>
            </Tooltip>
          </>
        ),
    },
  ];

  /* ---------------- Render ---------------- */
  return (
    <Box p={3}>
      <Grid container spacing={2}>
        {/* LEFT */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Request Meter Reading Adjustment
            </Typography>

            <Autocomplete
              options={searchOptions}
              loading={searchLoading}
              value={selectedReading}
              onInputChange={(_, value) => searchMeterReadings(value)}
              onChange={(_, value) => setSelectedReading(value)}
              isOptionEqualToValue={(a, b) => a?.id === b?.id}
              getOptionLabel={(o) =>
                o
                  ? `Conn #${o.meter?.connection?.connectionNumber} — ${o.customer.customerName}`
                  : ""
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search meter reading"
                  size="small"
                />
              )}
            />

            {selectedReading && (
              <CreateMeterReadingAdjustment
                meterReadingId={selectedReading.id}
                previousReading={selectedReading.currentReading}
                onSuccess={() => {
                  fetchAdjustments();
                  setSelectedReading(null);
                  showToast("success", "Adjustment request submitted");
                }}
                onCancel={() => setSelectedReading(null)}
              />
            )}
          </Paper>
        </Grid>

        {/* RIGHT */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">
              Pending & Historical Adjustments
            </Typography>

            <DataGrid
              rows={adjustments}
              columns={adjustmentColumns}
              autoHeight
              getRowId={(r) => r.id}
              sx={{ mt: 2 }}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Reject dialog */}
      <Dialog open={!!rejecting} onClose={() => setRejecting(null)}>
        <DialogTitle>Reject Adjustment</DialogTitle>
        <DialogContent>
          <TextField
            label="Reason"
            fullWidth
            multiline
            minRows={2}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejecting(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={reject}
            disabled={processingId === rejecting}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>

      {/* Global notifications */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast({ ...toast, open: false })}
      >
        <Alert severity={toast.severity} variant="filled">
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
