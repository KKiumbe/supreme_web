// src/components/disconnectionTasks/DisconnectionPreviewDialog.jsx
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  CircularProgress,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import PropTypes from 'prop-types';

const DisconnectionPreviewDialog = ({
  open,
  onClose,
  dueConnections = [],
  selectedIds = [],
  onSelectionChange,
  onProceed,
  loading = false,
}) => {
  const columns = [
    { field: 'connectionNumber', headerName: 'Conn #', width: 120 },
    {
      field: 'customerName',
      headerName: 'Customer',
      width: 260,
      valueGetter: (_, row) => row.customer?.customerName || '-',
    },
    {
      field: 'accountNumber',
      headerName: 'Account',
      width: 170,
      valueGetter: (_, row) =>
        row.customer?.accountNumber || row.account?.accountNumber || '-',
    },
    {
      field: 'balance',
      headerName: 'Balance (KSh)',
      width: 130,
      align: 'right',
      valueGetter: (_, row) => Number(row.account?.balance || 0),
      valueFormatter: (v) => v.toLocaleString(),
    },
    {
      field: 'unpaidBills',
      headerName: 'Unpaid Bills',
      width: 120,
      align: 'center',
      valueGetter: (_, row) => row.billing?.unpaidBills ?? 0,
    },
    {
      field: 'oldestDueDate',
      headerName: 'Oldest Due Date',
      width: 160,
      valueGetter: (_, row) =>
        row.billing?.oldestDueDate
          ? new Date(row.billing.oldestDueDate).toLocaleDateString('en-KE')
          : '—',
    },
    {
      field: 'phone',
      headerName: 'Phone',
      width: 140,
      valueGetter: (_, row) => row.customer?.phoneNumber || '-',
    },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      disableEscapeKeyDown={loading}
    >
      <DialogTitle>
        <Box>
          <Typography variant="h6" component="div">
            Connections Due for Disconnection
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {dueConnections.length} overdue connection{dueConnections.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        {loading ? (
          <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        ) : dueConnections.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No connections found due for disconnection in selected scope.
            </Typography>
          </Box>
        ) : (
          <DataGrid
            rows={dueConnections}
            columns={columns}
            getRowId={(row) => row.connectionId || row.id}
            checkboxSelection
            onRowSelectionModelChange={onSelectionChange}
            rowSelectionModel={selectedIds}
            disableRowSelectionOnClick
            sx={{
              minHeight: 420,
              border: 'none',
              '& .MuiDataGrid-columnHeaders': {
                bgcolor: 'background.default',
                fontWeight: 600,
              },
            }}
            pageSizeOptions={[10, 25, 50, 100]}
          />
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          disabled={selectedIds.length === 0 || loading}
          onClick={onProceed}
        >
          Create Task for {selectedIds.length} connection{selectedIds.length !== 1 ? 's' : ''}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
DisconnectionPreviewDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  dueConnections: PropTypes.array,
  selectedIds: PropTypes.array,
  onSelectionChange: PropTypes.func,
  onProceed: PropTypes.func,
  loading: PropTypes.bool,
};

export default DisconnectionPreviewDialog;
