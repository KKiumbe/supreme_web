import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
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
} from '@mui/material';
import axios from 'axios';
import { toast } from 'react-toastify';

const BASEURL = import.meta.env.VITE_BASE_URL || '';

const ReceiptPayment = ({ open, onClose, paymentId, onReceiptComplete }) => {
  const [payment, setPayment] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    if (!paymentId) return;
    setLoading(true);
    setError('');

    try {
      // 1️⃣ Fetch payment details
      const paymentRes = await axios.get(`${BASEURL}/payment/${paymentId}`, {
        withCredentials: true,
      });

      if (!paymentRes.data.success) throw new Error(paymentRes.data.message);
      const paymentData = paymentRes.data.data;
      setPayment(paymentData);

      // 2️⃣ Fetch customers for tenant
      const customersRes = await axios.get(`${BASEURL}/customers`, {
        withCredentials: true,
      });

      const customersData = customersRes.data?.data?.customers || [];
      setCustomers(customersData);

      // 3️⃣ Auto-select customer if name matches
      const matchedCustomer = customersData.find((c) =>
        c.customerName?.toLowerCase().includes(paymentData.name?.toLowerCase())
      );
      if (matchedCustomer) setSelectedCustomerId(matchedCustomer.id);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.message || err.message || 'Error fetching data.');
    } finally {
      setLoading(false);
    }
  }, [paymentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async () => {
    if (!selectedCustomerId) {
      toast.error('Please select a customer.');
      return;
    }
//customerId, modeOfPayment, paidBy, paymentId
    setSubmitting(true);
    try {
      const res = await axios.post(
        `${BASEURL}/receipt/settle-unreceipted`,
        { customerId: selectedCustomerId ,
          modeOfPayment: payment.modeOfPayment,
          paidBy: payment.name,
           paymentId: payment.id
        },
        
        { withCredentials: true }
      );

     
      // ✅ Handle success correctly
    if (res.status === 201 || res.status === 200) {
      alert("Payment receipted successfully!");
      if (onReceiptComplete) onReceiptComplete();
      onClose(); // ✅ close dialog
      fetchData(); // ✅ refresh table
    } else {
      alert(res.data.message || "Unexpected response");
    }
  } catch (error) {
    console.error("Error receipting payment:", error);
    // ✅ Check if backend actually succeeded but Axios threw
    if (
      error.response?.status === 201 ||
      error.message?.includes("Payment processed successfully")
    ) {
      alert("Payment receipted successfully!");
      if (onReceiptComplete) onReceiptComplete();
      onClose(); // ✅ close dialog
      fetchData(); // ✅ refresh table
    } else {
      alert(
        error.response?.data?.message ||
          error.message ||
          "Failed to receipt payment"
      );
    }
  } finally {
    setLoading(false);
  }
};









  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Receipt Payment</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : payment ? (
          <Box mt={2} display="flex" flexDirection="column" gap={2}>
            <TextField
              label="Payment Reference"
              value={payment.ref || ''}
              fullWidth
              InputProps={{ readOnly: true }}
            />
            <TextField
              label="Payment Method"
              value={payment.modeOfPayment || ''}
              fullWidth
              InputProps={{ readOnly: true }}
            />
            <TextField
              label="Amount"
              value={payment.amount || ''}
              fullWidth
              InputProps={{ readOnly: true }}
            />
            <TextField
              label="Customer"
              select
              fullWidth
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
            >
              {customers.length > 0 ? (
                customers.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.customerName} ({c.phoneNumber})
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>No customers found</MenuItem>
              )}
            </TextField>
          </Box>
        ) : (
          <Typography>No payment found.</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || submitting || !selectedCustomerId}
        >
          {submitting ? 'Submitting...' : 'Receipt'}
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
