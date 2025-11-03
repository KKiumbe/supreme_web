import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  MenuItem,
  Grid,
  IconButton,
  Tooltip,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { Search as SearchIcon, Refresh as RefreshIcon } from "@mui/icons-material";
import axios from "axios";
import { useAuthStore } from "../../store/authStore";

const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const NewCustomersScreen = () => {
  const { currentUser } = useAuthStore();
  const BASEURL = import.meta.env.VITE_BASE_URL;

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);

  // Assign connection modal state
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [availableConnections, setAvailableConnections] = useState([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState("");

  // Fetch new customers
  const fetchCustomers = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(debouncedSearch && { search: debouncedSearch }),
      });

      const res = await axios.get(`${BASEURL}/new-customers?${params}`, { withCredentials: true });
      const data = res.data.data;
      setCustomers((data.customers || []).map((c) => ({ ...c, id: c.id })));
      setPagination((prev) => ({ ...prev, total: data.pagination.total }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [BASEURL, currentUser, pagination.page, pagination.limit, debouncedSearch]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Fetch available connections for modal
  const fetchAvailableConnections = useCallback(
    async (searchTerm = "") => {
      if (!currentUser) return;
      try {
        const params = new URLSearchParams({
          page: "1",
          limit: "50",
          ...(searchTerm && { search: searchTerm }),
        });
        const res = await axios.get(`${BASEURL}/get-available-connections?${params}`, {
          withCredentials: true,
        });
        setAvailableConnections(res.data.data || []);
      } catch (err) {
        console.error(err);
      }
    },
    [BASEURL, currentUser]
  );

  const handleOpenAssignModal = (customer) => {
    setSelectedCustomer(customer);
    setAssignModalOpen(true);
    fetchAvailableConnections();
  };

  const handleAssignConnection = async () => {
    if (!selectedCustomer || !selectedConnectionId) return;
    try {
      await axios.post(
        `${BASEURL}/assign-connection`,
        { customerId: selectedCustomer.id, connectionId: selectedConnectionId },
        { withCredentials: true }
      );
      setAssignModalOpen(false);
      setSelectedCustomer(null);
      setSelectedConnectionId("");
      fetchCustomers();
    } catch (err) {
      console.error(err);
    }
  };

  const columns = [
    { field: "accountNumber", headerName: "Account #", width: 130 },
    { field: "customerName", headerName: "Name", flex: 1, minWidth: 180 },
    { field: "phoneNumber", headerName: "Phone", width: 140 },
    { field: "email", headerName: "Email", width: 200 },
    {
      field: "status",
      headerName: "Status",
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value === "ACTIVE" ? "success" : "warning"}
          size="small"
        />
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 160,
      renderCell: (params) => (
        <Button
          variant="contained"
          size="small"
          onClick={() => handleOpenAssignModal(params.row)}
        >
          Assign Connection
        </Button>
      ),
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" mb={3}>
        New Customers
      </Typography>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />,
              }}
            />
          </Grid>
          <Grid item>
            <Tooltip title="Reset Filters">
              <IconButton onClick={() => setSearch("")}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      </Paper>

      {/* DataGrid */}
      <Paper sx={{ height: 600 }}>
        <DataGrid
          rows={customers}
          columns={columns}
          loading={loading}
          pagination
          paginationMode="server"
          rowCount={pagination.total}
          pageSizeOptions={[10, 20, 50]}
          paginationModel={{ page: pagination.page - 1, pageSize: pagination.limit }}
          onPaginationModelChange={(model) =>
            setPagination({ ...pagination, page: model.page + 1, limit: model.pageSize })
          }
          disableRowSelectionOnClick
          slots={{
            noRowsOverlay: () => (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <Typography color="text.secondary">No new customers found</Typography>
              </Box>
            ),
          }}
        />
      </Paper>

      {/* Assign Connection Modal */}
      <Dialog open={assignModalOpen} onClose={() => setAssignModalOpen(false)} fullWidth>
        <DialogTitle>
          Assign Connection to {selectedCustomer?.customerName}
        </DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            margin="dense"
            label="Select Connection"
            value={selectedConnectionId}
            onChange={(e) => setSelectedConnectionId(e.target.value)}
          >
            {availableConnections.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.connectionNumber} - {c.meter?.serialNumber || "No Meter"}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            margin="dense"
            placeholder="Search connection..."
            onChange={(e) => fetchAvailableConnections(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignModalOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAssignConnection}>
            Assign & to generate connection bill
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NewCustomersScreen;
