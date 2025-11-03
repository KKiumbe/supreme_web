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
import { useNavigate } from 'react-router-dom';
import { getTheme } from '../../store/theme';

const BASEURL = import.meta.env?.VITE_BASE_URL || '';

const Payments = () => {
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

  const navigate = useNavigate();
  const theme = getTheme();

  const fetchPayments = useCallback(
    debounce(async (params, pageNum, size) => {
      setLoading(true);
      setMessage('');

      try {
        const query = new URLSearchParams({
          ...params,
          page: (pageNum + 1).toString(), // backend is 1-indexed
          pageSize: size.toString(),
        }).toString();

        const res = await axios.get(`${BASEURL}/payments?${query}`, {
          withCredentials: true,
        });

        setPayments(res.data.data || []);
        setTotalCount(res.data.totalCount || 0);
        setMessage(res.data.message || 'Payments fetched successfully');
      } catch (err) {
        console.error('Error fetching payments:', err);
        setMessage(
          err.response?.data?.message || 'Failed to fetch payments. Please try again.'
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

  const handleSearchChange = (e, field) => {
    setSearchParams((prev) => ({ ...prev, [field]: e.target.value }));
    setPage(0);
  };

  const handleStatusChange = (e) => {
    setSearchParams((prev) => ({ ...prev, status: e.target.value }));
    setPage(0);
  };

  const handleReset = () => {
    setSearchParams({ name: '', transactionId: '', status: '', ref: '' });
    setPage(0);
  };

  // Columns for DataGrid
const columns = [
  { field: 'name', headerName: 'Customer', width: 180 },
  { field: 'modeOfPayment', headerName: 'Payment Method', width: 160 },
  { field: 'amount', headerName: 'Amount', width: 120, type: 'number' },
  { field: 'transactionId', headerName: 'Transaction ID', width: 220 },
  { field: 'ref', headerName: 'Payment Reference ID', width: 220 },
  {
    field: 'receipted',
    headerName: 'Receipted',
    width: 120,
  //   renderCell: (params) => (
  //     <Typography sx={{ color: params.value ? theme.palette.success.main : theme.palette.error.main }}>
  //       {params.value ? 'Yes' : 'No'}
  //     </Typography>
  //   ),
  // 
  },
  {
  field: 'createdAt',
  headerName: 'Date',
  width: 180,
  // valueGetter: (params) => {
  //   const date = new Date(params.value);
  //   const day = date.getDate();
  //   const month = date.toLocaleString('default', { month: 'long' });
  //   const year = date.getFullYear();
  //   return `${day} ${month} ${year}`;
  // },
}
];

  return (
    <Container maxWidth="xl" sx={{ mt: 6, ml: 8 }}>
      <Paper sx={{ p: 4, borderRadius: 3, }}>
        <Typography variant="h5" gutterBottom >
          Payments
        </Typography>

        {/* Search Filters */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="Search by Name"
              value={searchParams.name}
              onChange={(e) => handleSearchChange(e, 'name')}
              placeholder="Customer name"
             
              
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="Transaction ID"
              value={searchParams.transactionId}
              onChange={(e) => handleSearchChange(e, 'transactionId')}
              placeholder="Transaction ID"
             
              
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              select
              fullWidth
              label="Status"
              value={searchParams.status}
              onChange={handleStatusChange}
            
            
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="true">Receipted</MenuItem>
              <MenuItem value="false">Not Receipted</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="Reference"
              value={searchParams.ref}
              onChange={(e) => handleSearchChange(e, 'ref')}
              placeholder="Reference"
             
              
            />
          </Grid>
          <Grid item xs={12}>
        <Button
  variant="outlined"
  onClick={handleReset}
  sx={{
    color: theme.palette.primary.main, // ✅ correct key
    borderColor: theme.palette.primary.main,
    '&:hover': {
      borderColor: theme.palette.primary.dark,
      backgroundColor: theme.palette.action.hover,
    },
  }}
>
  Reset Search
</Button>

          </Grid>
        </Grid>

        {/* DataGrid */}
        <Box sx={{ height: 550, width: '100%', overflowX: 'auto' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
              <CircularProgress  />
            </Box>
          ) : (
        


            <Box sx={{ width: '100%', height: 550 }}>
  {loading ? (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
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
      pageSize={pageSize}
      page={page}
      onPageChange={(newPage) => setPage(newPage)}
      onPageSizeChange={(newSize) => setPageSize(newSize)}
      rowsPerPageOptions={[10, 20, 50]}
      disableColumnResize={false}
      disableExtendRowFullWidth={false}
      autoHeight={false}
      sx={{
        width: '100%',
        '& .MuiDataGrid-virtualScroller': {
          overflowX: 'hidden !important', // 🚫 prevent uncontrolled X scroll growth
        },
      }}
    />
  )}
</Box>


          )}
        </Box>

        {/* Message */}
        {message && (
          <Typography
            sx={{
              mt: 2
              
                
            }}
          >
            {message}
          </Typography>
        )}
      </Paper>
    </Container>
  );
};

export default Payments;