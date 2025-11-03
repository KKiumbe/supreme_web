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

const ConnectionsScreen = () => {
  const { currentUser } = useAuthStore();
  const BASEURL = import.meta.env.VITE_BASE_URL || "";
  const theme = getTheme();

  // State
  const [connections, setConnections] = useState([]);
  const [meters, setMeters] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [zones, setZones] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [tariffCategories, setTariffCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25); // Increased default
  const [total, setTotal] = useState(0);

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [connectionNumber, setConnectionNumber] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [selectedZoneId, setSelectedZoneId] = useState("");
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [selectedSchemeId, setSelectedSchemeId] = useState("");
  const [selectedTariffCategoryId, setSelectedTariffCategoryId] = useState("");
  const [assignMeterOpen, setAssignMeterOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [selectedMeterId, setSelectedMeterId] = useState("");

  // Fetch connections
  const fetchConnections = useCallback(
    async (searchQuery = "", pageNum = 0, limit = 25) => {
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
        console.error("Error fetching connections:", err);
      } finally {
        setLoading(false);
      }
    },
    [currentUser, BASEURL]
  );

  // Fetch dropdown data (schemes, zones, routes, tariff categories)
  const fetchMetaData = useCallback(async () => {
    try {
      const [schemesRes, tariffsRes] = await Promise.all([
        axios.get(`${BASEURL}/schemes`, { withCredentials: true }),
        axios.get(`${BASEURL}/tarrifs/block`, { withCredentials: true }),
      ]);

      // Schemes, zones, routes
      const schemesData = schemesRes.data.data || [];
      setSchemes(schemesData);
      const allZones = schemesData.flatMap((scheme) => scheme.zones || []);
      setZones(allZones);
      const allRoutes = allZones.flatMap((zone) => zone.routes || []);
      setRoutes(allRoutes);

      // Tariff categories (deduplicate by categoryId)
      const tariffData = tariffsRes.data.data || [];
      const uniqueCategories = Object.values(
        tariffData.reduce((acc, t) => {
          acc[t.categoryId] = {
            id: t.categoryId,
            name: t.category.name,
          };
          return acc;
        }, {})
      );
      setTariffCategories(uniqueCategories);
    } catch (err) {
      console.error("Error fetching metadata:", err);
    }
  }, [BASEURL]);

  // Fetch available meters
  const fetchMeters = useCallback(async () => {
    try {
      const res = await axios.get(`${BASEURL}/meters`, { withCredentials: true });
      setMeters(res.data.data.meters.filter((m) => !m.connectionId));
    } catch (err) {
      console.error("Error fetching meters:", err);
    }
  }, [BASEURL]);

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
    fetchMetaData();
  }, [page, rowsPerPage, fetchConnections, fetchMeters, fetchMetaData]);

  // Filter zones and routes based on selected scheme and zone
  const filteredZones = useMemo(() => {
    if (!selectedSchemeId) return zones;
    return zones.filter((zone) => zone.schemeId === parseInt(selectedSchemeId));
  }, [zones, selectedSchemeId]);

  const filteredRoutes = useMemo(() => {
    if (!selectedZoneId) return routes;
    return routes.filter((route) => route.zoneId === parseInt(selectedZoneId));
  }, [routes, selectedZoneId]);

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
        tariffCategoryId: selectedTariffCategoryId || null,
        schemeId: selectedSchemeId ? Number(selectedSchemeId) : null,
        zoneId: selectedZoneId ? Number(selectedZoneId) : null,
        routeId: selectedRouteId ? Number(selectedRouteId) : null,
      },
      { withCredentials: true }
    );
    resetModal();
    fetchConnections(search, page, rowsPerPage);
    fetchMeters();
  } catch (err) {
    console.error("Error creating connection:", err);
  }
};


  const resetModal = () => {
    setModalOpen(false);
    setConnectionNumber("");
    setCustomerId("");
    setStatus("ACTIVE");
    setSelectedZoneId("");
    setSelectedRouteId("");
    setSelectedSchemeId("");
    setSelectedTariffCategoryId("");
  };

  const resetAssignModal = () => {
    setAssignMeterOpen(false);
    setSelectedConnection(null);
    setSelectedMeterId("");
  };

  // Assign Meter to Connection
  const handleAssignMeter = async () => {
    if (!selectedConnection || !selectedMeterId) return;
    try {
    // In handleAssignMeter
await axios.put(
  `${BASEURL}/assign-meter`,
  {
    connectionId: selectedConnection.id,
    meterId: selectedMeterId,
  },
  { withCredentials: true }
);
      resetAssignModal();
      fetchConnections(search, page, rowsPerPage);
      fetchMeters();
    } catch (err) {
      console.error("Error assigning meter:", err);
    }
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", p: 2 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Connections</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setModalOpen(true)}>
          Add Connection
        </Button>
      </Box>

      {/* Search */}
      <TextField
        fullWidth
        placeholder="Search by connection, customer, phone, meter..."
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
      <Box sx={{ flex: 1, overflow: "hidden" }}>
        <TableContainer component={Paper} sx={{ maxHeight: "calc(100vh - 200px)", overflowX: "auto" }}>
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : (
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Conn #</strong></TableCell>
                  <TableCell><strong>Customer</strong></TableCell>
                  <TableCell><strong>Email</strong></TableCell>
                  <TableCell><strong>Phone</strong></TableCell>
                  <TableCell><strong>Zone</strong></TableCell>
                  <TableCell><strong>Route</strong></TableCell>
                  <TableCell><strong>Scheme</strong></TableCell>
                  <TableCell><strong>Tariff</strong></TableCell>
                  <TableCell><strong>Meter</strong></TableCell>
                  <TableCell><strong>Meter Model</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Created At</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {connections.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={13} align="center">
                      No connections found
                    </TableCell>
                  </TableRow>
                ) : (
                  connections.map((conn) => (
                    <TableRow key={conn.id} hover>
                      <TableCell>{conn.connectionNumber || "-"}</TableCell>
                      <TableCell>{conn.customer?.customerName || "-"}</TableCell>
                      <TableCell>{conn.customer?.email || "-"}</TableCell>
                      <TableCell>{conn.customer?.phoneNumber || "-"}</TableCell>
                      <TableCell>{conn.zone?.name || "-"}</TableCell>
                      <TableCell>{conn.route?.name || "-"}</TableCell>
                      <TableCell>{conn.scheme?.name || "-"}</TableCell>
                      <TableCell>{conn.tariffCategory?.name || "-"}</TableCell>
                      <TableCell>{conn.meter?.serialNumber || "-"}</TableCell>
                      <TableCell>{conn.meter?.model || "-"}</TableCell>
                      <TableCell>{conn.status || "-"}</TableCell>
                      <TableCell>
                        {conn.createdAt ? new Date(conn.createdAt).toLocaleString() : "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => {
                            setSelectedConnection(conn);
                            setAssignMeterOpen(true);
                          }}
                          disabled={!!conn.meter}
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
      </Box>

      {/* Pagination */}
      <TablePagination
        component="div"
        count={total}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[10, 25, 50, 100]} // Added more options
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
            label="Scheme"
            fullWidth
            margin="dense"
            value={selectedSchemeId}
            onChange={(e) => {
              setSelectedSchemeId(e.target.value);
              setSelectedZoneId("");
              setSelectedRouteId("");
            }}
          >
            <MenuItem value="">Select Scheme</MenuItem>
            {schemes.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Zone"
            fullWidth
            margin="dense"
            value={selectedZoneId}
            onChange={(e) => {
              setSelectedZoneId(e.target.value);
              setSelectedRouteId("");
            }}
            disabled={!selectedSchemeId}
          >
            <MenuItem value="">Select Zone</MenuItem>
            {filteredZones.map((z) => (
              <MenuItem key={z.id} value={z.id}>
                {z.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Route"
            fullWidth
            margin="dense"
            value={selectedRouteId}
            onChange={(e) => setSelectedRouteId(e.target.value)}
            disabled={!selectedZoneId}
          >
            <MenuItem value="">Select Route</MenuItem>
            {filteredRoutes.map((r) => (
              <MenuItem key={r.id} value={r.id}>
                {r.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Tariff Category"
            fullWidth
            margin="dense"
            value={selectedTariffCategoryId}
            onChange={(e) => setSelectedTariffCategoryId(e.target.value)}
          >
            <MenuItem value="">Select Tariff Category</MenuItem>
            {tariffCategories.map((t) => (
              <MenuItem key={t.id} value={t.id}>
                {t.name}
              </MenuItem>
            ))}
          </TextField>
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
        <DialogTitle>
          Assign Meter to Connection #{selectedConnection?.connectionNumber}
        </DialogTitle>
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
          <Button variant="contained" onClick={handleAssignMeter} disabled={!selectedMeterId}>
            Assign
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ConnectionsScreen;