import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Chip,
  Snackbar,
  Alert,
  useMediaQuery,
  IconButton,
  TextField,
  Divider,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import axios from "axios";
import dayjs from "dayjs";
import { getTheme } from "../../store/theme";
import PropTypes from "prop-types";

const API_URL = import.meta.env.VITE_BASE_URL;

const CustomerDetails = ({ customerId, onClose }) => {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "error" });
  const [smsMessage, setSmsMessage] = useState("");

  // Commitment state
  const [showCommitmentForm, setShowCommitmentForm] = useState(false);
  const [commitmentAmount, setCommitmentAmount] = useState("");
  const [commitmentStartDate, setCommitmentStartDate] = useState(
    dayjs().format("YYYY-MM-DD")
  );
  const [submittingCommitment, setSubmittingCommitment] = useState(false);

  const theme = getTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Flatten customer data
  const flattenCustomer = (data) => ({
    ...data,
    schemeName: data.connections?.[0]?.scheme?.name || data.schemeName || "-",
    zoneName: data.connections?.[0]?.zone?.name || data.zoneName || "-",
    routeName: data.connections?.[0]?.route?.name || data.routeName || "-",
    tariffName: data.connections?.[0]?.tariffCategory?.name || data.tariffName || "-",
    createdAt: data.createdAt ? dayjs(data.createdAt).format("MMM D, YYYY") : "-",
    updatedAt: data.updatedAt ? dayjs(data.updatedAt).format("MMM D, YYYY") : "-",
    customerDob: data.customerDob ? dayjs(data.customerDob).format("MMM D, YYYY") : "-",
  });

  const getPrimaryAccount = () => {
    const conn = customer?.connections?.[0];
    return conn?.customerAccounts?.[0] || null;
  };

  // Fetch customer details
  const fetchCustomerDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/customer/${customerId}`, {
        withCredentials: true,
      });
      if (response.data.success) {
        setCustomer(flattenCustomer(response.data.data));
      } else {
        setError("Failed to fetch customer details");
        setSnackbar({ open: true, message: "Failed to fetch customer details", severity: "error" });
      }
    } catch (err) {
      setError("Error fetching customer details: " + err.message);
      setSnackbar({ open: true, message: "Error fetching customer details", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customerId) fetchCustomerDetails();
  }, [customerId]);

  // Status colors
  const getStatusColor = (status) =>
    ({
      PENDING: "warning",
      SURVEY_SCHEDULED: "info",
      SURVEY_COMPLETED: "primary",
      APPROVED: "success",
      REJECTED: "error",
      CONVERTED: "secondary",
      PENDING_CONNECTION: "warning",
    }[status] || "default");

  const handleRaiseCommitment = async () => {
    const account = getPrimaryAccount();

    if (!account) {
      setSnackbar({
        open: true,
        message: "Customer account not found",
        severity: "error",
      });
      return;
    }

    if (!commitmentAmount || Number(commitmentAmount) <= 0) {
      setSnackbar({
        open: true,
        message: "Enter a valid commitment amount",
        severity: "warning",
      });
      return;
    }

    setSubmittingCommitment(true);
    try {
      const res = await axios.post(
        `${API_URL}/customers/commitments`,
        {
          customerAccountId: account.id,
          commitmentAmount: Number(commitmentAmount),
          commitmentStartDate,
        },
        { withCredentials: true }
      );

      if (res.data?.success) {
        setSnackbar({
          open: true,
          message: "Commitment raised successfully",
          severity: "success",
        });
        setShowCommitmentForm(false);
        setCommitmentAmount("");
        fetchCustomerDetails();
      } else {
        throw new Error(res.data?.message);
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || "Failed to raise commitment",
        severity: "error",
      });
    } finally {
      setSubmittingCommitment(false);
    }
  };

  // Send SMS
  const handleSendSms = async () => {
    if (!smsMessage.trim()) {
      setSnackbar({ open: true, message: "Please enter a message", severity: "warning" });
      return;
    }
    try {
      const res = await axios.post(
        `${API_URL}/send-sms-to-customer/${customerId}`,
        { message: smsMessage },
        { withCredentials: true }
      );
      if (res.data.success) {
        setSnackbar({ open: true, message: "SMS sent successfully", severity: "success" });
        setSmsMessage("");
      } else {
        setSnackbar({ open: true, message: "Failed to send SMS", severity: "error" });
      }
    } catch (err) {
      setSnackbar({ open: true, message: "Error sending SMS: " + err.message, severity: "error" });
    }
  };

  // Send Bill (SMS)
  const handleSendBill = async () => {
    try {
      const res = await axios.post(
        `${API_URL}/send-bills-to-connection/${customerId}`,
        { message: smsMessage },
        { withCredentials: true }
      );
      if (res.data.success) {
        setSnackbar({ open: true, message: "Bill sent successfully", severity: "success" });
        setSmsMessage("");
      } else {
        setSnackbar({ open: true, message: "Failed to send bill", severity: "error" });
      }
    } catch (err) {
      setSnackbar({ open: true, message: "Error sending bill: " + err.message, severity: "error" });
    }
  };

  // Download/View Connection Statement PDF
  const handleViewStatement = async (connectionId) => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${API_URL}/reports/connection/statement/${connectionId}`,
        {
          withCredentials: true,
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      // Auto-download
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Statement_${connectionId}_${customer?.accountNumber || "customer"}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      setTimeout(() => window.URL.revokeObjectURL(url), 100);

      setSnackbar({
        open: true,
        message: "Statement downloaded successfully",
        severity: "success",
      });
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || "Failed to download statement",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !customer) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={5}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
        <Button variant="outlined" onClick={fetchCustomerDetails} sx={{ mt: 2, mr: 1 }}>
          Retry
        </Button>
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{
            mt: 2,
            borderColor: (theme) => theme.palette.primary.main,
            color: (theme) => theme.palette.primary.contrastText,
            "&:hover": {
              borderColor: (theme) => theme.palette.primary.dark,
              backgroundColor: (theme) => theme.palette.primary.main,
              color: (theme) => theme.palette.primary.contrastText,
            },
          }}
        >
          Close
        </Button>
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        >
          <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
        </Snackbar>
      </Box>
    );
  }

  if (!customer) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>No customer selected</Typography>
      </Box>
    );
  }

  const account = getPrimaryAccount();

  return (
    <>
      <Box
        sx={{
          p: 3,
          overflow: "auto",
          width: isMobile ? "100%" : "400px",
          borderLeft: !isMobile ? `1px solid ${theme.palette.divider}` : "none",
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight="bold">
            Customer Details
          </Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>

        <Box mb={2}>
          <Typography variant="subtitle1" fontWeight="bold">
            Personal Information
          </Typography>
          <Typography><strong>Name:</strong> {customer.customerName || "-"}</Typography>
          <Typography><strong>Phone:</strong> {customer.phoneNumber || "-"}</Typography>
          <Typography><strong>Email:</strong> {customer.email || "-"}</Typography>
          <Typography><strong>National ID:</strong> {customer.customerIdNo || "-"}</Typography>
          <Typography><strong>Date of Birth:</strong> {customer.customerDob || "-"}</Typography>
        </Box>

        <Box mb={2}>
          <Typography variant="subtitle1" fontWeight="bold">Account Information</Typography>
          <Typography><strong>Account Number:</strong> {customer.accountNumber || "-"}</Typography>
          <Typography>
            <strong>Balance:</strong>{" "}
            {customer.closingBalance ? `KES ${parseFloat(customer.closingBalance).toFixed(2)}` : "-"}
          </Typography>
          <Typography><strong>KRA PIN:</strong> {customer.customerKraPin || "-"}</Typography>
          <Typography><strong>Deposit:</strong> {customer.customerDeposit || "-"}</Typography>
          <Typography><strong>Disco Type:</strong> {customer.customerDiscoType || "-"}</Typography>
          <Typography><strong>Has Water:</strong> {customer.hasWater ? "Yes" : "No"}</Typography>
          <Typography><strong>Has Sewer:</strong> {customer.hasSewer ? "Yes" : "No"}</Typography>
        </Box>

        <Box mb={2}>
          <Typography variant="subtitle1" fontWeight="bold">Connection Information</Typography>
          
          {(customer.connections || []).length ? (
            customer.connections.map((conn, index) => (
              <Box 
                key={conn.id} 
                mb={2} 
                p={2} 
                border={1} 
                borderColor="divider" 
                borderRadius={1}
                bgcolor="background.paper"
              >
                <Typography variant="body1" fontWeight="bold">
                  Connection {index + 1} – {conn.connectionNumber}
                </Typography>

                <Typography component="div" mt={0.5}>
                  <strong>Status:</strong>{" "}
                  <Chip label={conn.status} color={getStatusColor(conn.status)} size="small" />
                </Typography>

                <Typography mt={0.5}>
                  <strong>Scheme:</strong> {conn.scheme?.name || customer.schemeName || "-"}
                </Typography>
                <Typography>
                  <strong>Tariff:</strong> {conn.tariffCategory?.name || customer.tariffName || "-"}
                </Typography>

                {conn.meter && (
                  <>
                    <Typography mt={0.5}>
                      <strong>Meter Serial:</strong> {conn.meter.serialNumber || "-"}
                    </Typography>
                    {(conn.meter.meterReadings || []).slice(0, 1).map((reading) => (
                      <Typography key={reading.id}>
                        <strong>Latest Reading:</strong>{" "}
                        {reading.currentReading || "-"} (
                        {reading.readingDate ? dayjs(reading.readingDate).format("MMM D, YYYY") : "-"}
                        )
                      </Typography>
                    ))}
                  </>
                )}

                {/* Statement button */}
                <Button
                  variant="outlined"
                  size="small"
                  color="theme.palette.primary.contrastText"
                  sx={{ mt: 1.5 }}
                  onClick={() => handleViewStatement(conn.id)}
                  disabled={loading}
                >
                 Download Statement
                </Button>
              </Box>
            ))
          ) : (
            <Typography>No connections available</Typography>
          )}
        </Box>

        <Box mb={2}>
          <Typography variant="subtitle1" fontWeight="bold">Status</Typography>
          <Typography component="div">
            <strong>Status:</strong>{" "}
            <Chip label={customer.status} color={getStatusColor(customer.status)} size="small" />
          </Typography>
          <Typography><strong>Created At:</strong> {customer.createdAt}</Typography>
          <Typography><strong>Updated At:</strong> {customer.updatedAt || "-"}</Typography>
        </Box>

        {/* Commitment Section */}
        <Typography fontWeight="bold" mb={1}>Payment Commitment</Typography>

        {!account ? (
          <Typography>No account found</Typography>
        ) : (
          <>
            <Chip
              label={account.commitmentActive ? "ACTIVE" : "INACTIVE"}
              color={account.commitmentActive ? "success" : "default"}
              size="small"
              sx={{ mb: 1 }}
            />

            {account.commitmentActive ? (
              <>
                <Typography>
                  Amount: KES {Number(account.commitmentAmount || 0).toFixed(2)}
                </Typography>
                <Typography>
                  Start Date:{" "}
                  {account.commitmentStartDate
                    ? dayjs(account.commitmentStartDate).format("MMM D, YYYY")
                    : "-"}
                </Typography>
              </>
            ) : (
              <>
                {!showCommitmentForm ? (
                  <Button
                    size="small"
                    variant="outlined"
                    color="theme.palette.primary.contrastText"
                    sx={{ mt: 1,  }}
                    onClick={() => setShowCommitmentForm(true)}
                  >
                    Raise Commitment
                  </Button>
                ) : (
                  <Box mt={2}>
                    <TextField
                      label="Commitment Amount (KES)"
                      type="number"
                      fullWidth
                      value={commitmentAmount}
                      onChange={(e) => setCommitmentAmount(e.target.value)}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      label="Start Date"
                      type="date"
                      fullWidth
                      value={commitmentStartDate}
                      onChange={(e) => setCommitmentStartDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      sx={{ mb: 2 }}
                    />
                    <Box display="flex" gap={1}>
                      <Button
                        variant="contained"
                        onClick={handleRaiseCommitment}
                        disabled={submittingCommitment}
                      >
                        {submittingCommitment ? "Saving…" : "Confirm Commitment"}
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => setShowCommitmentForm(false)}
                      >
                        Cancel
                      </Button>
                    </Box>
                  </Box>
                )}
              </>
            )}
          </>
        )}

        <Divider sx={{ my: 3 }} />

        {/* SMS & Bill Section */}
        <Box mt={2}>
          <Typography variant="subtitle1" fontWeight="bold" mb={1}>
            Communication
          </Typography>

          <TextField
            label="SMS Message"
            fullWidth
            multiline
            rows={3}
            value={smsMessage}
            onChange={(e) => setSmsMessage(e.target.value)}
            variant="outlined"
            sx={{ mb: 2 }}
          />

          <Box display="flex" gap={2} flexWrap="wrap">
            <Button
              variant="contained"
              color="primary"
              onClick={handleSendBill}
              //disabled={!smsMessage.trim() || loading}
            >
              Send Bill
            </Button>

            <Button
              variant="contained"
              color="secondary"
              onClick={handleSendSms}
              disabled={!smsMessage.trim() || loading}
            >
              Send SMS
            </Button>
          </Box>
        </Box>

        <Box mt={3} display="flex" gap={2}>
          <Button
            variant="outlined"
            onClick={fetchCustomerDetails}
            disabled={loading}
            sx={{ color: theme.palette.primary.contrastText }}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            onClick={onClose}
            sx={{ color: theme.palette.primary.contrastText }}
          >
            Close
          </Button>
        </Box>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

CustomerDetails.propTypes = {
  customerId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onClose: PropTypes.func.isRequired,
};

export default CustomerDetails;