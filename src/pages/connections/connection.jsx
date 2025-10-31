import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  MenuItem,
  InputAdornment,
  CircularProgress,
  IconButton,
  Typography,
  TablePagination,
} from "@mui/material";
import { Add, Search, Clear } from "@mui/icons-material";
import axios from "axios";
import { useAuthStore } from "../../store/authStore";
import { debounce } from "lodash";
import { getTheme } from "../../store/theme";

/**
 * @typedef {Object} Connection
 * @property {number} id
 * @property {number} connectionNumber
 * @property {string|null} customerId
 * @property {string} status
 * @property {string} createdAt
 * @property {Object|null} customer
 * @property {string} customer.id
 * @property {string} customer.accountNumber
 * @property {string} customer.customerName
 * @property {string} customer.phoneNumber
 * @property {string|null} customer.email
 * @property {string} customer.status
 * @property {Object|null} meter
 * @property {number} meter.id
 * @property {string} meter.serialNumber
 * @property {string|null} meter.model
 * @property {string|null} meter.status
 */

/**
 * @typedef {Object} Meter
 * @property {number} id
 * @property {string} serialNumber
 */

const ConnectionsScreen = () => {
  const { currentUser } = useAuthStore();
  const BASEURL = import.meta.env.VITE_BASE_URL;
    const theme = getTheme();
  // State
  const [connections, setConnections] = useState([]);
  const [meters, setMeters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [connectionNumber, setConnectionNumber] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [status, setStatus] = useState("ACTIVE");

  const [assignMeterOpen, setAssignMeterOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [selectedMeterId, setSelectedMeterId] = useState("");
  
  // Fetch Connections with search & pagination
  const fetchConnections = useCallback(
    async (searchQuery = "", pageNum = 0, limit = 10) => {
      if (!currentUser) return;
      setLoading(true);
      try {
        const res = await axios.get(`${BASEURL}/get-connections`, {
          params: {
            search: searchQuery || undefined,
            page: pageNum + 1,
            limit,
          },
          withCredentials: true,
        });
        setConnections(res.data.data || []);
        setTotal(res.data.pagination?.total || 0);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [currentUser, BASEURL]
  );

  // Fetch available meters
  const fetchMeters = useCallback(async () => {
    if (!currentUser) return;
    try {
      const res = await axios.get(`${BASEURL}/meters`, {
        withCredentials: true,
      });
      setMeters(res.data.data.meters.filter((m) => !m.connectionId));
    } catch (err) {
      console.error(err);
    }
  }, [currentUser, BASEURL]);

  // Debounced search
  const debouncedSearch = useMemo(
    () =>
      debounce((query) => {
        setPage(0);
        fetchConnections(query, 0, rowsPerPage);
      }, 500),
    [fetchConnections, rowsPerPage]
  );

  useEffect(() => {
    debouncedSearch(search);
    return () => debouncedSearch.cancel();
  }, [search, debouncedSearch]);

  // Initial load
  useEffect(() => {
    fetchConnections("", page, rowsPerPage);
    fetchMeters();
  }, [page, rowsPerPage, fetchConnections, fetchMeters]);

  // Create Connection
  const handleCreateConnection = async () => {
    if (!currentUser) return;
    try {
      await axios.post(
        `${BASEURL}/create-connection`,
        {
          connectionNumber: Number(connectionNumber),
          customerId: customerId || null,
          status,
        },
        { withCredentials: true }
      );
      resetModal();
      fetchConnections(search, page, rowsPerPage);
      fetchMeters();
    } catch (err) {
      console.error(err);
    }
  };

  // Assign Meter
  const handleAssignMeter = async () => {
    if (!selectedConnection || !selectedMeterId) return;
    try {
      await axios.put(
        `${BASEURL}/assign-meter`,
        {
          connectionId: selectedConnection.id,
          meterId: Number(selectedMeterId),
        },
        { withCredentials: true }
      );
      resetAssignModal();
      fetchConnections(search, page, rowsPerPage);
      fetchMeters();
    } catch (err) {
      console.error(err);
    }
  };

  const resetModal = () => {
    setModalOpen(false);
    setConnectionNumber("");
    setCustomerId("");
    setStatus("ACTIVE");
  };

  const resetAssignModal = () => {
    setAssignMeterOpen(false);
    setSelectedConnection(null);
    setSelectedMeterId("");
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Connections</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setModalOpen(true)}>
          Add Connection
        </Button>
      </Box>

      {/* Search Bar */}
      <TextField
        fullWidth
        placeholder="Search by connection, customer name, account, meter, phone..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
          endAdornment: search && (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => setSearch("")}>
                <Clear />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      {/* Table */}
      <TableContainer component={Paper}>
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>Connection #</strong></TableCell>
                <TableCell><strong>Account #</strong></TableCell>
                <TableCell><strong>Customer Name</strong></TableCell>
                <TableCell><strong>Phone</strong></TableCell>
                <TableCell><strong>Email</strong></TableCell>
                <TableCell><strong>Meter SN</strong></TableCell>
                <TableCell><strong>Model</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Created At</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {connections.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} align="center">
                    No connections found
                  </TableCell>
                </TableRow>
              ) : (
                connections.map((conn) => (
                  <TableRow key={conn.id} hover>
                    <TableCell>{conn.id}</TableCell>
                    <TableCell>{conn.connectionNumber}</TableCell>
                    <TableCell>{conn.customer?.accountNumber || "-"}</TableCell>
                    <TableCell>{conn.customer?.customerName || "-"}</TableCell>
                    <TableCell>{conn.customer?.phoneNumber || "-"}</TableCell>
                    <TableCell>{conn.customer?.email || "-"}</TableCell>
                    <TableCell>{conn.meter?.serialNumber || "-"}</TableCell>
                    <TableCell>{conn.meter?.model || "-"}</TableCell>
                    <TableCell>
                      <Box
                        component="span"
                        sx={{
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          fontSize: "0.75rem",
                          fontWeight: "bold",
                          backgroundColor:
                            conn.status === "ACTIVE"
                              ? "success.light"
                              : conn.status === "INACTIVE"
                              ? "warning.light"
                              : "error.light",
                          color: "white",
                        }}
                      >
                        {conn.status}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {new Date(conn.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
  <Button
    variant="outlined"
    size="small"
    color={conn.meter ? theme.palette.secondary.main : theme.palette.primary.main}
    onClick={() => {
      setSelectedConnection(conn);
      setAssignMeterOpen(true);
    }}
    disabled={!!conn.meter}
    sx={{
      textTransform: "none",
      borderRadius: 1,
      fontWeight: 500,
    }}
  >
    {conn.meter ? "Assigned" : "Assign Meter"}
  </Button>
</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>




      

      {/* Pagination */}
      <TablePagination
        component="div"
        count={total}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
        labelRowsPerPage="Rows per page:"
      />

      {/* Add Connection Modal */}
      <Dialog open={modalOpen} onClose={resetModal} fullWidth maxWidth="sm">
        <DialogTitle>Add New Connection</DialogTitle>
        <DialogContent>
          <TextField
            label="Connection Number"
            type="number"
            fullWidth
            margin="dense"
            value={connectionNumber}
            onChange={(e) => setConnectionNumber(e.target.value)}
          />
          <TextField
            label="Customer ID (Optional)"
            fullWidth
            margin="dense"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
          />
          <TextField
            select
            label="Status"
            fullWidth
            margin="dense"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <MenuItem value="ACTIVE">Active</MenuItem>
            <MenuItem value="INACTIVE">Inactive</MenuItem>
            <MenuItem value="SUSPENDED">Suspended</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={resetModal}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateConnection}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Meter Modal */}
      <Dialog open={assignMeterOpen} onClose={resetAssignModal} fullWidth maxWidth="sm">
        <DialogTitle>Assign Meter to Connection #{selectedConnection?.connectionNumber}</DialogTitle>
        <DialogContent>
          <TextField
            select
            label="Select Meter"
            fullWidth
            margin="dense"
            value={selectedMeterId}
            onChange={(e) => setSelectedMeterId(e.target.value)}
          >
            {meters.length === 0 ? (
              <MenuItem disabled>No available meters</MenuItem>
            ) : (
              meters.map((meter) => (
                <MenuItem key={meter.id} value={meter.id}>
                  {meter.serialNumber}
                </MenuItem>
              ))
            )}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={resetAssignModal}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAssignMeter}
            disabled={!selectedMeterId}
          >
            Assign
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ConnectionsScreen;