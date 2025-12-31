// src/components/customers/EditCustomerModal.jsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Alert,
  IconButton,
  Divider,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import axios from 'axios';
import PropTypes from 'prop-types';

const EditCustomerModal = ({
  open,
  onClose,
  customerId,
  initialCustomer = null,      // ← NEW: preferred way to preload data
  onCustomerUpdated,
}) => {
  const BASEURL = import.meta.env.VITE_BASE_URL || '';

  const [formData, setFormData] = useState({
    customerName: '',
    email: '',
    phoneNumber: '',
    customerKraPin: '',
    customerDob: '',
    customerIdNo: '',
    plotNumber: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!open) return;

    // 1. If we received preloaded customer data → use it immediately
    if (initialCustomer && initialCustomer.id === customerId) {
      setFormData({
        customerName: initialCustomer.customerName || '',
        email: initialCustomer.email || '',
        phoneNumber: initialCustomer.phoneNumber || '',
        customerKraPin: initialCustomer.customerKraPin || '',
        customerDob: initialCustomer.customerDob
          ? new Date(initialCustomer.customerDob).toISOString().split('T')[0]
          : '',
        customerIdNo: initialCustomer.customerIdNo || '',
        plotNumber: initialCustomer.plotNumber || '',
      });
      setLoading(false);
      return;
    }

    // 2. Fallback: fetch from API if no preloaded data
    const fetchCustomer = async () => {
      setLoading(true);
      setError(null);
      setSuccess(false);

      try {
        const res = await axios.get(`${BASEURL}/customer/${customerId}`, {
          withCredentials: true,
        });

        const c = res.data.data || res.data || {};
        if (!c.id) throw new Error('Customer not found');

        setFormData({
          customerName: c.customerName || '',
          email: c.email || '',
          phoneNumber: c.phoneNumber || '',
          customerKraPin: c.customerKraPin || '',
          customerDob: c.customerDob
            ? new Date(c.customerDob).toISOString().split('T')[0]
            : '',
          customerIdNo: c.customerIdNo || '',
          plotNumber: c.plotNumber || '',
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load customer details');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomer();
  }, [open, customerId, initialCustomer, BASEURL]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    if (!formData.customerName.trim()) {
      setError('Customer name is required');
      setSaving(false);
      return;
    }

    try {
      await axios.put(`${BASEURL}/customers/${customerId}`, formData, {
        withCredentials: true,
      });

      setSuccess(true);

      setTimeout(() => {
        onClose();
        if (onCustomerUpdated) onCustomerUpdated();
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update customer');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (saving) return;
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown={saving}
      disableBackdropClick={saving}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Edit Customer</Typography>
          <IconButton onClick={handleClose} disabled={saving} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Customer updated successfully!
          </Alert>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress />
          </Box>
        ) : (
          <form onSubmit={handleSubmit} id="edit-customer-form">
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom color="primary">
                  Personal Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Full Name"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  error={!formData.customerName.trim()}
                  helperText={!formData.customerName.trim() ? 'Required' : ''}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="ID Number"
                  name="customerIdNo"
                  value={formData.customerIdNo}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="KRA PIN"
                  name="customerKraPin"
                  value={formData.customerKraPin}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Date of Birth"
                  name="customerDob"
                  type="date"
                  value={formData.customerDob}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom color="primary" sx={{ mt: 2 }}>
                  Contact & Location
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Plot Number"
                  name="plotNumber"
                  value={formData.plotNumber}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>
          </form>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} disabled={saving} color="inherit">
          Cancel
        </Button>
        <Button
          type="submit"
          form="edit-customer-form"
          variant="contained"
          disabled={saving || loading}
          startIcon={saving ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

EditCustomerModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  customerId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  initialCustomer: PropTypes.object,              // ← added
  onCustomerUpdated: PropTypes.func,
};

export default EditCustomerModal;