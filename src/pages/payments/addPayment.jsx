import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import {
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Autocomplete,
  MenuItem,
} from '@mui/material';
import { debounce } from 'lodash'; // Install lodash for debouncing
import { useNavigate } from 'react-router-dom';
import { getTheme } from '../../store/theme';
import { useAuthStore } from '../../store/authStore';

// ModeOfPayment options for selection
const ModeOfPayment = {
  CASH: 'CASH',
  BANK: 'BANK',
  MPESA: 'MPESA',
  AIRTELMONEY: 'AIRTELMONEY',
  // Add other modes as needed
};

const BASEURL = import.meta.env?.VITE_BASE_URL || '';

const CreatePayment = () => {
  // Type definitions
  /**
   * @typedef {Object} Customer
   * @property {string} id
   * @property {string} customerName
   * @property {string} accountNumber
   * @property {string} [phoneNumber]
   */

  // State
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [totalAmount, setTotalAmount] = useState('');
  const [modeOfPayment, setModeOfPayment] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = useNavigate();
  const theme = getTheme();

    const { currentUser } = useAuthStore();
  

  
  
        useEffect(() => {
          if (!currentUser) {
            navigate("/login");
          }
        }, [currentUser, navigate]);

  // Fetch customers
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await axios.get(`${BASEURL}/customers`, { withCredentials: true });
        const fetchedCustomers = res.data?.data?.customers || [];
        setCustomers(fetchedCustomers);
        setFilteredCustomers(fetchedCustomers); // Initially, show all customers
      } catch (err) {
        console.error(err);
        setMessage('Failed to load customers.');
      }
    };
    fetchCustomers();
  }, []);



  // Debounced search function
  const fetchCustomers = useCallback(
    debounce(async (query) => {
      if (query.trim() === '') {
        setFilteredCustomers(customers);
        return;
      }

      try {
        const res = await axios.get(`${BASEURL}/customers`, {
          params: { search: query },
          withCredentials: true,
        });
        setFilteredCustomers(res.data?.data?.customers || []);
      } catch (err) {
        console.error(err);
        setMessage('Failed to search customers.');
        setFilteredCustomers(customers); // Fallback to all customers
      }
    }, 300),
    [customers]
  );

  // Handle search input change
  const handleSearch = (event, value) => {
    setSearchQuery(value);
    fetchCustomers(value);
  };

  // Handle customer selection
  const handleCustomerSelect = (event, value) => {
    setSelectedCustomer(value);
  };

  // Submit payment
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) {
      setMessage('Please select a customer.');
      return;
    }
    if (!totalAmount || !modeOfPayment || !paidBy) {
      setMessage('Please fill in all required fields.');
      return;
    }
    const paymentAmount = parseFloat(totalAmount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      setMessage('Invalid payment amount. Must be a positive number.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const payload = {
        customerId: selectedCustomer.id,
        totalAmount: paymentAmount,
        modeOfPayment,
        paidBy,
      };

      const res = await axios.post(`${BASEURL}/receipt/create-payment`, payload, {
        withCredentials: true,
      });

      setMessage(res.data?.message || 'Payment created successfully!');
      setSelectedCustomer(null);
      setTotalAmount('');
      setModeOfPayment('');
      setPaidBy('');
      setSearchQuery('');
      setFilteredCustomers(customers); // Reset filtered customers
    } catch (err) {
      console.error(err);
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Error creating payment.';
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 6, ml: 10 }}>
      <Paper sx={{ p: 4, borderRadius: 3, boxShadow: 3 }}>
        <Typography variant="h5" gutterBottom>
          Create Payment
        </Typography>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            {/* Customer Search with Autocomplete */}
            <Grid item xs={12} sm={6}>
              <Autocomplete
                options={filteredCustomers}
                getOptionLabel={(option) =>
                  `${option.customerName} (${option.accountNumber})${
                    option.phoneNumber ? ` - ${option.phoneNumber}` : ''
                  }`
                }
                onInputChange={handleSearch}
                onChange={handleCustomerSelect}
                value={selectedCustomer}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    label="Search Customer (Name, Phone, Account)"
                    placeholder="Enter name, phone, or account number"
                    required
                  />
                )}
                noOptionsText="No customers found"
                isOptionEqualToValue={(option, value) => option.id === value.id}
              />
            </Grid>

            {/* Mode of Payment */}
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Mode of Payment"
                value={modeOfPayment}
                onChange={(e) => setModeOfPayment(e.target.value)}
                required
              >
                {Object.values(ModeOfPayment).map((mode) => (
                  <MenuItem key={mode} value={mode}>
                    {mode}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Total Amount */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Total Amount (KES)"
                type="number"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                required
                inputProps={{ min: 0, step: '0.01' }}
              />
            </Grid>

            {/* Paid By */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Paid By"
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                required
              />
            </Grid>

            {/* Submit */}
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                sx={{ mt: 2 }}
              >
                {loading ? 'Processing...' : 'Create Payment'}
              </Button>
            </Grid>
          </Grid>
        </form>

        {message && (
          <Typography sx={{ mt: 2, color: message.includes('Error') ? 'error.main' : 'success.main' }}>
            {message}
          </Typography>
        )}
      </Paper>
    </Container>
  );
};

export default CreatePayment;