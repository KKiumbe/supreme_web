import { useState, useEffect, useCallback } from "react";
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

export default function AddReadingStepperModal({
  open,
  onClose,
  onReadingAdded,
}) {
  const [step, setStep] = useState(0);
  const steps = ["Search Customer", "Select Connection", "Enter & Review"];

  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedConnectionNumber, setSelectedConnectionNumber] = useState("");
  const [selectedConnection, setSelectedConnection] = useState(null);

  const [previousReading, setPreviousReading] = useState("");
  const [currentReading, setCurrentReading] = useState("");
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  // Reset when modal closes
  useEffect(() => {
    if (!open) {
      setStep(0);
      setSearch("");
      setCustomers([]);
      setSelectedCustomer(null);
      setSelectedConnectionNumber("");
      setSelectedConnection(null);
      setPreviousReading("");
      setCurrentReading("");
      setNotes("");
    } else {
      fetchCustomers();
    }
  }, [open]);

  // 🔹 Fetch customers
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

  // 🔹 Select a customer
  const handleSelectCustomer = (customerId) => {
    const cust = customers.find((c) => c.id === customerId);
    if (!cust) {
      return;
    }

    setSelectedCustomer(cust);
    setCustomers([cust]);
    setStep(1);

    setSnackbar({
      open: true,
      message: `Customer "${cust.customerName}" selected.`,
      severity: "success",
    });
  };

  // 🔹 Select a connection
  const handleSelectConnection = (connectionNumber) => {
    const conn = selectedCustomer?.connections?.find(
      (c) => String(c.connectionNumber) === String(connectionNumber),
    );

    if (!conn) {
      return;
    }

    setSelectedConnection(conn);
    setSelectedConnectionNumber(connectionNumber);

    const lastReading = conn.meter?.meterReadings?.[0] || null;

    // 🔥 Previous reading comes EXACTLY from endpoint
    setPreviousReading(
      String(
        lastReading?.currentReading ?? lastReading?.previousReading ?? "0",
      ),
    );

    setCurrentReading("");
    setStep(2);

    setSnackbar({
      open: true,
      message: `Connection ${connectionNumber} selected.`,
      severity: "success",
    });
  };

  // 🔹 Compute usage
  const usage = (() => {
    const prev = Number(previousReading || 0);
    const curr = Number(currentReading || 0);
    if (isNaN(prev) || isNaN(curr)) {
      return null;
    }
    return curr - prev;
  })();

  // 🔹 Save reading (VALIDATION DONE HERE ONLY)
  const handleSave = async () => {
    if (!selectedConnectionNumber) {
      alert("No connection selected.");
      return;
    }

    if (currentReading === "" || isNaN(Number(currentReading))) {
      setSnackbar({
        open: true,
        message: "Please enter a valid current reading.",
        severity: "error",
      });
      return;
    }

    // 🔥 VALIDATION: Only validate if previousReading exists
    if (previousReading && Number(currentReading) <= Number(previousReading)) {
      setSnackbar({
        open: true,
        message: `Current reading must be greater than previous reading (${previousReading}).`,
        severity: "error",
      });
      return;
    }

    setSaving(true);

    try {
      const payload = {
        connectionId: Number(selectedConnection.id),
        currentReading: Number(currentReading),
        ...(previousReading && { previousReading: Number(previousReading) }),
        notes: notes || null,
        type: "ACTUAL",
      };

      console.warn("📤 Submitting meter reading:", payload);

      const response = await axios.post(
        `${BASE_URL}/meter-readings/manual`,
        payload,
        {
          withCredentials: true,
        },
      );

      console.warn("✅ Meter reading response:", response.data);

      setSnackbar({
        open: true,
        message: "Meter reading added successfully!",
        severity: "success",
      });

      onReadingAdded?.();
      setTimeout(onClose, 1000);
    } catch (err) {
      console.error(
        "❌ Error saving meter reading:",
        err.response?.data || err.message,
      );
      setSnackbar({
        open: true,
        message: err?.response?.data?.message || "Failed to save reading",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  // UI
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

        {/* STEP 0: SEARCH CUSTOMER */}
        {step === 0 && (
          <Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={8}>
                <TextField
                  label="Search by name, account, phone or email"
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
                  fullWidth
                  variant="contained"
                  onClick={() => fetchCustomers(search)}
                  disabled={loadingCustomers}
                >
                  {loadingCustomers ? <CircularProgress size={20} /> : "Search"}
                </Button>
              </Grid>

              <Grid item xs={12}>
                <Paper
                  variant="outlined"
                  sx={{ p: 1, maxHeight: 260, overflowY: "auto" }}
                >
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
                            selectedCustomer?.id === c.id
                              ? "action.selected"
                              : "inherit",
                          "&:hover": { background: "action.hover" },
                        }}
                      >
                        <Typography sx={{ fontWeight: 600 }}>
                          {c.customerName}
                        </Typography>
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

        {/* STEP 1: SELECT CONNECTION */}
        {step === 1 && selectedCustomer && (
          <Box>
            <Typography sx={{ mb: 1 }}>
              Customer: <strong>{selectedCustomer.customerName}</strong>
            </Typography>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Select connection</InputLabel>
              <Select
                value={selectedConnectionNumber}
                label="Select connection"
                onChange={(e) => handleSelectConnection(e.target.value)}
              >
                {selectedCustomer.connections?.length ? (
                  selectedCustomer.connections.map((conn) => (
                    <MenuItem
                      key={conn.connectionNumber}
                      value={conn.connectionNumber}
                    >
                      {conn.connectionNumber} — Meter {conn.meter?.id ?? "N/A"}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>No connections available</MenuItem>
                )}
              </Select>
            </FormControl>
          </Box>
        )}

        {/* STEP 2: ENTER READING */}
        {step === 2 && selectedConnection && (
          <Box>
            <TextField
              label="Previous Reading"
              fullWidth
              value={previousReading}
              InputProps={{ readOnly: true }}
              sx={{ mb: 2 }}
            />

            {/* 🔥 User can type anything */}
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

            <Box
              sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}
            >
              <Button variant="outlined" onClick={onClose}>
                Close
              </Button>

              <Button
                variant="contained"
                disabled={saving}
                onClick={handleSave}
              >
                {saving ? <CircularProgress size={18} /> : "Save Reading"}
              </Button>
            </Box>
          </Box>
        )}

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
