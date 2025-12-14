import React, { useEffect, useState, useCallback } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
  Box,
  Typography,
} from "@mui/material";
import axios from "axios";
import { toast } from "react-toastify";

const BASEURL = import.meta.env.VITE_BASE_URL || "";

const ReceiptPayment = ({ open, onClose, paymentId, onReceiptComplete }) => {
  const [payment, setPayment] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [connections, setConnections] = useState([]);

  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedConnectionId, setSelectedConnectionId] = useState("");

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  /* -------------------------------------------------------
     Fetch payment + customers
  --------------------------------------------------------*/
  const fetchData = useCallback(async () => {
    if (!paymentId) return;

    setLoading(true);
    setError("");

    try {
      // 1️⃣ Payment
      const paymentRes = await axios.get(
        `${BASEURL}/payment/${paymentId}`,
        { withCredentials: true }
      );

      if (!paymentRes.data?.success) {
        throw new Error(paymentRes.data?.message || "Failed to fetch payment");
      }

      const paymentData = paymentRes.data.data;
      setPayment(paymentData);

      // 2️⃣ Customers
      const customersRes = await axios.get(
        `${BASEURL}/customers`,
        { withCredentials: true }
      );

      const customersData = customersRes.data?.data?.customers || [];
      setCustomers(customersData);

      // 3️⃣ Try auto-match customer by name
      const matchedCustomer = customersData.find(c =>
        paymentData?.name &&
        c.customerName?.toLowerCase().includes(paymentData.name.toLowerCase())
      );

      if (matchedCustomer) {
        setSelectedCustomerId(matchedCustomer.id);
        setConnections(matchedCustomer.connections || []);
      }

    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
        err.message ||
        "Error fetching data"
      );
    } finally {
      setLoading(false);
    }
  }, [paymentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* -------------------------------------------------------
     Handle customer → connection cascade
  --------------------------------------------------------*/
  useEffect(() => {
    if (!selectedCustomerId) {
      setConnections([]);
      setSelectedConnectionId("");
      return;
    }

    const customer = customers.find(c => c.id === selectedCustomerId);
    setConnections(customer?.connections || []);
    setSelectedConnectionId("");
  }, [selectedCustomerId, customers]);

  /* -------------------------------------------------------
     Submit receipt
  --------------------------------------------------------*/
  const handleSubmit = async () => {
    if (!selectedCustomerId) {
      toast.error("Please select a customer");
      return;
    }

    if (!selectedConnectionId) {
      toast.error("Please select a connection");
      return;
    }

    setSubmitting(true);

    try {
      const res = await axios.post(
        `${BASEURL}/receipt/settle-unreceipted`,
        {
          connectionId: Number(selectedConnectionId),
          modeOfPayment: payment.modeOfPayment,
          paidBy: payment.name,
          paymentId: payment.id,
        },
        { withCredentials: true }
      );

      if (res.status === 200 || res.status === 201) {
        toast.success("Payment receipted successfully");
        onReceiptComplete?.();
        onClose();
      } else {
        throw new Error(res.data?.message || "Unexpected response");
      }

    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message ||
        err.message ||
        "Failed to receipt payment"
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* -------------------------------------------------------
     Render
  --------------------------------------------------------*/
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Receipt Payment</DialogTitle>

      <DialogContent>
        {loading ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="200px"
          >
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : payment ? (
          <Box mt={2} display="flex" flexDirection="column" gap={2}>
            <TextField
              label="Payment Reference"
              value={payment.ref || ""}
              fullWidth
              InputProps={{ readOnly: true }}
            />

            <TextField
              label="Payment Method"
              value={payment.modeOfPayment || ""}
              fullWidth
              InputProps={{ readOnly: true }}
            />

            <TextField
              label="Amount"
              value={payment.amount || ""}
              fullWidth
              InputProps={{ readOnly: true }}
            />

            {/* Customer */}
            <TextField
              label="Customer"
              select
              fullWidth
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
            >
              {customers.length ? (
                customers.map(c => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.customerName} ({c.phoneNumber})
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>No customers found</MenuItem>
              )}
            </TextField>

            {/* Connection */}
            <TextField
              label="Connection"
              select
              fullWidth
              disabled={!connections.length}
              value={selectedConnectionId}
              onChange={(e) => setSelectedConnectionId(e.target.value)}
            >
              {connections.length ? (
                connections.map(conn => (
                  <MenuItem key={conn.id} value={conn.id}>
                    Connection #{conn.connectionNumber} –{" "}
                    {conn.scheme?.name || "No Scheme"}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>No connections available</MenuItem>
              )}
            </TextField>
          </Box>
        ) : (
          <Typography>No payment found</Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={
            loading ||
            submitting ||
            !selectedCustomerId ||
            !selectedConnectionId
          }
        >
          {submitting ? "Submitting..." : "Receipt"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

ReceiptPayment.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  paymentId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onReceiptComplete: PropTypes.func,
};

export default ReceiptPayment;
