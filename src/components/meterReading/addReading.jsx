import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Button,
  Modal,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Grid,
  Paper,
  Snackbar,
  Alert,
} from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";
import axios from "axios";
import PropTypes from "prop-types";

const BASE_URL = import.meta.env.VITE_BASE_URL;

export default function AddReadingStepperModal({ open, onClose, onReadingAdded }) {
  const [step, setStep] = useState(0);
  const steps = ["Search Customer", "Select Connection", "Enter & Review"];
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedConnectionNumber, setSelectedConnectionNumber] = useState("");
  const [selectedMeter, setSelectedMeter] = useState(null);
  const [previousReading, setPreviousReading] = useState("");
  const [currentReading, setCurrentReading] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

  // Reset modal state when closed
  useEffect(() => {
    if (!open) {
      setStep(0);
      setSearch("");
      setCustomers([]);
      setSelectedCustomer(null);
      setSelectedConnectionNumber("");
      setSelectedMeter(null);
      setPreviousReading("");
      setCurrentReading("");
      setNotes("");
    } else {
      fetchCustomers();
    }
  }, [open]);

  const fetchCustomers = useCallback(async (q = "") => {
    setLoadingCustomers(true);
    try {
      const res = await axios.get(`${BASE_URL}/customers`, {
        withCredentials: true,
        params: q ? { search: q } : undefined,
      });
      setCustomers(res.data?.data?.customers || []);
    } catch (err) {
      console.error("fetchCustomers error:", err);
      setCustomers([]);
    } finally {
      setLoadingCustomers(false);
    }
  }, []);

  const handleSearchChange = (e) => {
    const q = e.target.value;
    setSearch(q);
    fetchCustomers(q);
  };

  const handleSelectCustomer = (customerId) => {
    const cust = customers.find((c) => c.id === customerId);
    if (!cust) return;

    setSelectedCustomer(cust);
    setCustomers([cust]); // hide others
    setStep(1);

    setSnackbar({
      open: true,
      message: `Customer "${cust.customerName}" selected.`,
      severity: "success",
    });
  };

  const handleSelectConnection = (connectionNumber) => {
    setSelectedConnectionNumber(connectionNumber);

    const conn = selectedCustomer?.connections?.find(
      (c) => String(c.connectionNumber) === String(connectionNumber)
    );
    const meter = conn?.meter || null;
    setSelectedMeter(meter);
    setStep(2);

    const lastReading = meter?.meterReadings?.[0];
    setPreviousReading(
      String(lastReading?.currentReading ?? lastReading?.previousReading ?? "0")
    );
    setCurrentReading("");

    setSnackbar({
      open: true,
      message: `Connection ${connectionNumber} selected.`,
      severity: "success",
    });
  };

  const usage = (() => {
    const prev = Number(previousReading || 0);
    const curr = Number(currentReading || 0);
    if (isNaN(prev) || isNaN(curr)) return null;
    return curr - prev;
  })();

  const handleSave = async () => {
    if (!selectedMeter) {
      alert("No meter selected.");
      return;
    }

    if (currentReading === "" || isNaN(Number(currentReading))) {
      alert("Enter a valid current reading.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        meterId: Number(selectedMeter.id),
        currentReading: Number(currentReading),
        notes: notes || null,
      };

      await axios.post(`${BASE_URL}/create-meter-reading`, payload, {
        withCredentials: true,
      });

      setSnackbar({
        open: true,
        message: "Meter reading added successfully!",
        severity: "success",
      });

      onReadingAdded?.();
      setTimeout(onClose, 1000);
    } catch (err) {
      console.error("Error saving meter reading:", err);
      setSnackbar({
        open: true,
        message: err?.response?.data?.message || "Failed to save reading",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          width: { xs: "94%", sm: 720 },
          maxWidth: 920,
          bgcolor: "background.paper",
          borderRadius: 2,
          p: 3,
          mx: "auto",
          mt: { xs: 6, sm: 8 },
          overflowY: "auto",
          maxHeight: "85vh",
        }}
      >
        <Typography variant="h6" mb={2}>
          Add Meter Reading
        </Typography>

        <Stepper activeStep={step} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step 0: Search Customer */}
        {step === 0 && (
          <Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={8}>
                <TextField
                  label="Search customer by name, account, phone or email"
                  value={search}
                  onChange={handleSearchChange}
                  fullWidth
                  InputProps={{
                    endAdornment: <SearchIcon />,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Button
                  variant="contained"
                  onClick={() => fetchCustomers(search)}
                  disabled={loadingCustomers}
                  fullWidth
                >
                  {loadingCustomers ? <CircularProgress size={20} /> : "Search"}
                </Button>
              </Grid>
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 1, maxHeight: 260, overflowY: "auto" }}>
                  {loadingCustomers ? (
                    <Box display="flex" justifyContent="center" p={2}>
                      <CircularProgress />
                    </Box>
                  ) : customers.length === 0 ? (
                    <Typography color="text.secondary" p={2}>
                      No customers found
                    </Typography>
                  ) : (
                    customers.map((c) => (
                      <Box
                        key={c.id}
                        onClick={() => handleSelectCustomer(c.id)}
                        sx={{
                          p: 1,
                          borderRadius: 1,
                          mb: 1,
                          cursor: "pointer",
                          background:
                            selectedCustomer?.id === c.id ? "action.selected" : "inherit",
                          "&:hover": { background: "action.hover" },
                        }}
                      >
                        <Typography sx={{ fontWeight: 600 }}>{c.customerName}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {c.accountNumber} • {c.phoneNumber}
                        </Typography>
                      </Box>
                    ))
                  )}
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Step 1: Select Connection */}
        {step === 1 && selectedCustomer && (
          <Box>
            <Typography sx={{ mb: 1 }}>
              Customer: <strong>{selectedCustomer.customerName}</strong>
            </Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Choose connection</InputLabel>
              <Select
                value={selectedConnectionNumber}
                onChange={(e) => handleSelectConnection(e.target.value)}
              >
                {selectedCustomer.connections?.length ? (
                  selectedCustomer.connections.map((conn) => (
                    <MenuItem key={conn.connectionNumber} value={conn.connectionNumber}>
                      {conn.connectionNumber} — {conn.meter?.serialNumber ?? "No meter"}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>No connections available</MenuItem>
                )}
              </Select>
            </FormControl>
          </Box>
        )}

        {/* Step 2: Enter & Review */}
        {step === 2 && selectedMeter && (
          <Box>
            <TextField
              label="Last Recorded Reading"
              fullWidth
              value={previousReading}
              InputProps={{ readOnly: true }}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Current Reading"
              fullWidth
              type="number"
              value={currentReading}
              onChange={(e) => setCurrentReading(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Notes (optional)"
              fullWidth
              multiline
              minRows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Typography variant="body2" sx={{ mt: 1 }}>
              Units Used: <strong>{usage ?? "-"}</strong>
            </Typography>

            <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
              <Button onClick={onClose} variant="outlined">
                Close
              </Button>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={!currentReading || saving}
              >
                {saving ? <CircularProgress size={18} /> : "Save Reading"}
              </Button>
            </Box>
          </Box>
        )}

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            variant="filled"
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Modal>
  );
}

AddReadingStepperModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onReadingAdded: PropTypes.func,
};
