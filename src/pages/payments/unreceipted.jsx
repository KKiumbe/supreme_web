import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import {
  Container,
  Typography,
  TextField,
  Paper,
  Grid,
  Button,
  MenuItem,
  CircularProgress,
  Box,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { debounce } from 'lodash';
import { getTheme } from '../../store/theme';
import ReceiptPayment from '../../components/payments/receiptPayment';

const BASEURL = import.meta.env?.VITE_BASE_URL || '';

const UnreceiptedPayments = () => {
  const [payments, setPayments] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchParams, setSearchParams] = useState({
    name: '',
    transactionId: '',
    status: '',
    ref: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [openReceiptModal, setOpenReceiptModal] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);

  const theme = getTheme();

  const fetchPayments = useCallback(
    debounce(async (params, pageNum, size) => {
      setLoading(true);
      setMessage('');

      try {
        const query = new URLSearchParams({
          ...params,
          page: (pageNum + 1).toString(),
          pageSize: size.toString(),
        }).toString();

        const res = await axios.get(`${BASEURL}/payments/unreceipted?${query}`, {
          withCredentials: true,
        });

        if (!res.data || typeof res.data !== 'object') {
          throw new Error('Invalid API response structure');
        }

        setPayments(res.data.data || []);
        setTotalCount(res.data.totalCount || 0);
        setMessage(res.data.message || 'Payments fetched successfully');
      } catch (err) {
        console.error('Error fetching payments:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
        });
        setMessage(
          err.response?.data?.message || 'Failed to fetch payments. Please check the network or API configuration.'
        );
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    fetchPayments(searchParams, page, pageSize);
  }, [searchParams, page, pageSize, fetchPayments]);

  const handleSearchChange = useCallback((field, value) => {
    setSearchParams((prev) => ({ ...prev, [field]: value }));
    setPage(0);
  }, []);

  const handleReset = useCallback(() => {
    setSearchParams({ name: '', transactionId: '', status: '', ref: '' });
    setPage(0);
  }, []);

  const handleOpenReceipt = useCallback((paymentId) => {
    setSelectedPaymentId(paymentId);
    setOpenReceiptModal(true);
  }, []);

  const handleCloseReceipt = useCallback(() => {
    setOpenReceiptModal(false);
    setSelectedPaymentId(null);
  }, []);

  const handleReceiptSuccess = useCallback(() => {
    handleCloseReceipt();
    fetchPayments(searchParams, page, pageSize);
  }, [searchParams, page, pageSize, fetchPayments]);

  const columns = [
    { field: 'name', headerName: 'Customer', flex: 1, minWidth: 150 },
    {
      field: 'action',
      headerName: 'Action',
      minWidth: 150,
      renderCell: ({ row }) => (
        <Button
          variant="contained"
          sx={{
            backgroundColor: theme.palette.primary.main,
            '&:hover': { backgroundColor: theme.palette.primary.dark },
            color: '#e8ea4bff',
          }}
          onClick={() => handleOpenReceipt(row.id)}
        >
          Receipt
        </Button>
      ),
    },
    { field: 'modeOfPayment', headerName: 'Payment Method', flex: 1, minWidth: 140 },
    { field: 'amount', headerName: 'Amount', width: 120, type: 'number' },
    { field: 'transactionId', headerName: 'Transaction ID', flex: 1, minWidth: 180 },
    { field: 'ref', headerName: 'Payment Reference ID', flex: 1, minWidth: 180 },
    {
      field: 'receipted',
      headerName: 'Receipted',
      width: 120,
      renderCell: ({ value }) => (
        <Typography
          sx={{
            color: value ? theme.palette.success.main : theme.palette.error.main,
          }}
        >
          {value ? 'Yes' : 'No'}
        </Typography>
      ),
    },
    { field: 'createdAt', headerName: 'Date', flex: 1, minWidth: 150 },
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: { xs: 2, sm: 4 }, mb: 4 }}>
      <Paper sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom>
          Unreceipted Payments
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Search by Name"
              value={searchParams.name}
              onChange={(e) => handleSearchChange('name', e.target.value)}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Transaction ID"
              value={searchParams.transactionId}
              onChange={(e) => handleSearchChange('transactionId', e.target.value)}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              label="Status"
              value={searchParams.status}
              onChange={(e) => handleSearchChange('status', e.target.value)}
              size="small"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="true">Receipted</MenuItem>
              <MenuItem value="false">Not Receipted</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Reference"
              value={searchParams.ref}
              onChange={(e) => handleSearchChange('ref', e.target.value)}
              size="small"
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="outlined"
              onClick={handleReset}
              
            >
              Reset Search
            </Button>
          </Grid>   
        </Grid>

        <Box sx={{ height: { xs: 400, sm: 550 }, width: '100%' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
              <CircularProgress />
            </Box>
          ) : (
            <DataGrid
              rows={payments}
              columns={columns}
              getRowId={(row) => row.id}
              pagination
              paginationMode="server"
              rowCount={totalCount}
              page={page}
              pageSize={pageSize}
              onPageChange={(newPage) => setPage(newPage)}
              onPageSizeChange={(newSize) => setPageSize(newSize)}
              rowsPerPageOptions={[10, 20, 50]}
              sx={{ '& .MuiDataGrid-root': { overflowX: 'auto' } }}
            />
          )}
        </Box>

        {message && (
          <Typography sx={{ mt: 2, color: theme.palette.text.secondary }}>
            {message}
          </Typography>
        )}
      </Paper>

      {openReceiptModal && (
        <ReceiptPayment
          open={openReceiptModal}
          paymentId={selectedPaymentId}
          onClose={handleCloseReceipt}
          onReceiptComplete={handleReceiptSuccess}
        />
      )}
    </Container>
  );
};

export default UnreceiptedPayments;