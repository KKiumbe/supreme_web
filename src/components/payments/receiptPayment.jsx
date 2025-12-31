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
  Autocomplete,
} from "@mui/material";
import axios from "axios";
import { toast } from "react-toastify";
import { debounce } from "lodash";

const BASEURL = import.meta.env.VITE_BASE_URL || "";

const ReceiptPayment = ({ open, onClose, paymentId, onReceiptComplete }) => {
  const [payment, setPayment] = useState(null);

  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState("");

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  /* -------------------------------------------------------
     Fetch payment + initial customers
  --------------------------------------------------------*/
  const fetchData = useCallback(async () => {
    if (!paymentId) return;

    setLoading(true);
    setError("");

    try {
      // Payment
      const paymentRes = await axios.get(
        `${BASEURL}/payment/${paymentId}`,
        { withCredentials: true }
      );

      const paymentData = paymentRes.data?.data;
      setPayment(paymentData);

      // Customers (initial load)
      const customersRes = await axios.get(
        `${BASEURL}/customers`,
        { withCredentials: true }
      );

      const list = customersRes.data?.data?.customers || [];
      setCustomers(list);
      setFilteredCustomers(list);

      // Auto-match by name
      const matched = list.find(c =>
        paymentData?.name &&
        c.customerName?.toLowerCase().includes(paymentData.name.toLowerCase())
      );

      if (matched) {
        setSelectedCustomer(matched);
        if (matched.connections?.length === 1) {
          setSelectedConnectionId(matched.connections[0].id);
        }
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
     🔍 Debounced customer search (same as Create Payment)
  --------------------------------------------------------*/
  const searchCustomers = useCallback(
    debounce(async (query) => {
      if (!query?.trim()) {
        setFilteredCustomers(customers);
        return;
      }

      try {
        const res = await axios.get(`${BASEURL}/customers`, {
          params: { search: query },
          withCredentials: true,
        });

        setFilteredCustomers(res.data?.data?.customers || []);
      } catch {
        setFilteredCustomers(customers);
      }
    }, 300),
    [customers]
  );

  /* -------------------------------------------------------
     Customer → Connection cascade
  --------------------------------------------------------*/
  const handleCustomerSelect = (_, value) => {
    setSelectedCustomer(value);
    setSelectedConnectionId("");

    if (value?.connections?.length === 1) {
      setSelectedConnectionId(value.connections[0].id);
    }
  };

  /* -------------------------------------------------------
     Submit receipt
  --------------------------------------------------------*/
  const handleSubmit = async () => {
    if (!selectedCustomer) {
      toast.error("Please select a customer");
      return;
    }

    if (!selectedConnectionId) {
      toast.error("Please select a connection");
      return;
    }

    setSubmitting(true);

    try {
      await axios.post(
        `${BASEURL}/receipt/settle-unreceipted`,
        {
          connectionId: Number(selectedConnectionId),
          modeOfPayment: payment.modeOfPayment,
          paidBy: payment.name,
          paymentId: payment.id,
        },
        { withCredentials: true }
      );

      toast.success("Payment receipted successfully");
      onReceiptComplete?.();
      onClose();

    } catch (err) {
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
          <Box display="flex" justifyContent="center" minHeight={200}>
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

            {/* 🔍 CUSTOMER SEARCH */}
            <Autocomplete
              options={filteredCustomers}
              value={selectedCustomer}
              onChange={handleCustomerSelect}
              onInputChange={(_, value) => searchCustomers(value)}
              getOptionLabel={(o) =>
                `${o.customerName} (${o.accountNumber})${o.phoneNumber ? ` - ${o.phoneNumber}` : ""}`
              }
              isOptionEqualToValue={(o, v) => o.id === v.id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search Customer"
                  placeholder="Name, phone, or account"
                  required
                />
              )}
            />

            {/* CONNECTION */}
            {selectedCustomer && (
              <TextField
                select
                label="Connection"
                value={selectedConnectionId}
                onChange={(e) => setSelectedConnectionId(e.target.value)}
                required
              >
                {selectedCustomer.connections?.map(conn => (
                  <MenuItem key={conn.id} value={conn.id}>
                    Conn #{conn.connectionNumber} — {conn.scheme?.name || "No Scheme"}
                  </MenuItem>
                ))}
              </TextField>
            )}
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
          disabled={submitting || !selectedCustomer || !selectedConnectionId}
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
