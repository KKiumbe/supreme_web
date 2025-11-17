import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  InputAdornment,
  CircularProgress,
  IconButton,
  Typography,
  MenuItem,
  Snackbar,
  Alert,
  Tooltip,
  Chip,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  Skeleton,
} from "@mui/material";
import {
  Add,
  Search,
  Clear,
  Visibility,
  Edit,
  FilterList,
  GetApp,
} from "@mui/icons-material";

// Simple ErrorBoundary implementation
import PropTypes from "prop-types";
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    // You can log error here
  }
  render() {
    if (this.state.hasError) {
      return this.props.FallbackComponent ? (
        <this.props.FallbackComponent />
      ) : null;
    }
    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  FallbackComponent: PropTypes.elementType,
  children: PropTypes.node,
};


import { DataGrid } from "@mui/x-data-grid";
import { useAuthStore, useThemeStore } from "../../store/authStore";
import axios from "axios";
import { debounce } from "lodash";
import AssignMeterTaskDialog from "../../components/meterAssign/assignTask";


const BASEURL = import.meta.env.VITE_BASE_URL || "http://localhost:3000/api";

const flattenConnection = (conn) => ({
  id: conn.id,
  connectionNumber: conn.connectionNumber,
  customerId: conn.customerId,
  tenantId: conn.tenantId,
  schemeId: conn.schemeId,
  zoneId: conn.zoneId,
  routeId: conn.routeId,
  tariffCategoryId: conn.tariffCategoryId,
  customerTariffId: conn.customerTariffId,
  hasSewer: conn.hasSewer,
  hasWater: conn.hasWater,
  plotNumber: conn.plotNumber,
  status: conn.status,
  createdAt: conn.createdAt,
  customerName: conn.customer?.customerName || "-",
  customerAccountNumber: conn.customer?.accountNumber || "-",
  customerPhoneNumber: conn.customer?.phoneNumber || "-",
  customerEmail: conn.customer?.email || "-",
  customerStatus: conn.customer?.status || "-",
  customerAccountId: conn.customerAccounts?.[0]?.id || "-",
  customerAccount: conn.customerAccounts?.[0]?.customerAccount || "-",
  customerAccountBalance: conn.customerAccounts?.[0]?.balance || 0,
  customerAccountDeposit: conn.customerAccounts?.[0]?.deposit || 0,
  customerAccountStatus: conn.customerAccounts?.[0]?.status || "-",
  meterId: conn.meter?.id || null,
  meterSerialNumber: conn.meter?.serialNumber || null,
  meterModel: conn.meter?.model || null,
  meterStatus: conn.meter?.status || null,
  schemeName: conn.scheme?.name || null,
  zoneName: conn.zone?.name || null,
  routeName: conn.route?.name || null,
  tariffCategoryName: conn.tariffCategory?.name || null,
  rawCustomerAccounts: conn.customerAccounts || [],
});

const ErrorFallback = () => (
  <Box sx={{ p: 2, textAlign: "center" }}>
    <Typography color="error" variant="h6">
      Something went wrong: {}
    </Typography>
    <Button variant="contained" onClick={() => window.location.reload()} sx={{ mt: 2 }}>
      Retry
    </Button>
  </Box>
);

const ConnectionsScreen = () => {

  const { currentUser } = useAuthStore();
  const {theme} = useThemeStore();

  const [connections, setConnections] = useState([]);
  const [meters, setMeters] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [zones, setZones] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [tariffCategories, setTariffCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [schemeFilter, setSchemeFilter] = useState("");
  const [zoneFilter, setZoneFilter] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "error",
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [connectionNumber, setConnectionNumber] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [selectedZoneId, setSelectedZoneId] = useState("");
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [selectedSchemeId, setSelectedSchemeId] = useState("");
  const [selectedTariffCategoryId, setSelectedTariffCategoryId] = useState("");
  const [assignMeterOpen, setAssignMeterOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [selectedMeterId, setSelectedMeterId] = useState("");
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskConnection, setTaskConnection] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const customers = useMemo(() => {
    const uniqueCustomers = [];
    const seenIds = new Set();
    connections.forEach((conn) => {
      if (conn.customerId && !seenIds.has(conn.customerId)) {
        uniqueCustomers.push({
          id: conn.customerId,
          customerName: conn.customerName,
          phoneNumber: conn.customerPhoneNumber,
          email: conn.customerEmail,
          status: conn.customerStatus,
        });
        seenIds.add(conn.customerId);
      }
    });
    return uniqueCustomers;
  }, [connections]);

  const filteredZones = useMemo(
    () =>
      selectedSchemeId
        ? zones.filter((zone) => zone.schemeId === selectedSchemeId)
        : zones,
    [zones, selectedSchemeId]
  );

  const filteredRoutes = useMemo(
    () =>
      selectedZoneId
        ? routes.filter((route) => route.zoneId === selectedZoneId)
        : routes,
    [routes, selectedZoneId]
  );

  const fetchConnections = useCallback(
    async (searchQuery = "", pageNum = 0, limit = 25, filters = {}) => {
      if (!currentUser) return;
      setLoading(true);
      try {
        const res = await axios.get(`${BASEURL}/get-connections`, {
          params: {
            search: searchQuery || undefined,
            page: pageNum + 1,
            limit,
            status: filters.status || undefined,
            schemeId: filters.schemeId || undefined,
            zoneId: filters.zoneId || undefined,
          },
          withCredentials: true,
        });
        const validConnections = (res.data.data || [])
          .filter((conn) => conn && typeof conn === "object" && conn.id)
          .map(flattenConnection);
        setConnections(validConnections);
        setTotal(res.data.pagination?.total || 0);
      } catch (err) {
        console.error("Error fetching connections:", err);
        setConnections([]);
        setSnackbar({
          open: true,
          message: "Failed to fetch connections.",
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    },
    [currentUser]
  );

  const fetchMeters = useCallback(async () => {
    try {
      const res = await axios.get(`${BASEURL}/meters`, { withCredentials: true });
      const metersData = res.data?.data?.meters ?? [];
      setMeters(metersData.filter((m) => !m.connectionId));
    } catch (err) {
      console.error("Error fetching meters:", err);
      setSnackbar({
        open: true,
        message: "Failed to fetch meters.",
        severity: "error",
      });
    }
  }, []);

  const fetchMetaData = useCallback(async () => {
    try {
      const [schemesRes, tariffsRes] = await Promise.all([
        axios.get(`${BASEURL}/schemes`, { withCredentials: true }),
        axios.get(`${BASEURL}/tarrifs/block`, { withCredentials: true }),
      ]);
      const schemesData = schemesRes.data.data || [];
      setSchemes(schemesData);
      const allZones = schemesData.flatMap((scheme) => scheme.zones || []);
      setZones(allZones);
      const allRoutes = allZones.flatMap((zone) => zone.routes || []);
      setRoutes(allRoutes);
      const tariffData = tariffsRes.data.data || [];
      const uniqueCategories = Object.values(
        tariffData.reduce((acc, t) => {
          acc[t.categoryId] = { id: t.categoryId, name: t.category.name };
          return acc;
        }, {})
      );
      setTariffCategories(uniqueCategories);
    } catch (err) {
      console.error("Error fetching metadata:", err);
      setSnackbar({
        open: true,
        message: "Failed to load metadata.",
        severity: "error",
      });
    }
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchConnections("", page, rowsPerPage, {
            status: statusFilter,
            schemeId: schemeFilter,
            zoneId: zoneFilter,
          }),
          fetchMeters(),
          fetchMetaData(),
        ]);
      } catch (err) {
        console.error("Error fetching initial data:", err);
        setSnackbar({
          open: true,
          message: "Failed to load initial data.",
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [
    page,
    rowsPerPage,
    fetchConnections,
    fetchMeters,
    fetchMetaData,
    statusFilter,
    schemeFilter,
    zoneFilter,
  ]);

  const debouncedSearch = useMemo(
    () =>
      debounce((query) => {
        setPage(0);
        fetchConnections(query, 0, rowsPerPage, {
          status: statusFilter,
          schemeId: schemeFilter,
          zoneId: zoneFilter,
        });
      }, 500),
    [fetchConnections, rowsPerPage, statusFilter, schemeFilter, zoneFilter]
  );

  useEffect(() => {
    debouncedSearch(search);
    return () => debouncedSearch.cancel();
  }, [search, debouncedSearch]);

  const handleCreateConnection = async () => {
    if (!currentUser) return;
    if (!connectionNumber || !selectedCustomerId) {
      setSnackbar({
        open: true,
        message: "Connection Number and Customer are required.",
        severity: "error",
      });
      return;
    }
    setLoading(true);
    try {
      await axios.post(
        `${BASEURL}/create-connection`,
        {
          connectionNumber: Number(connectionNumber),
          customerId: selectedCustomerId,
          status,
          tariffCategoryId: selectedTariffCategoryId || null,
          schemeId: selectedSchemeId ? Number(selectedSchemeId) : null,
          zoneId: selectedZoneId ? Number(selectedZoneId) : null,
          routeId: selectedRouteId ? Number(selectedRouteId) : null,
        },
        { withCredentials: true }
      );
      resetModal();
      fetchConnections(search, page, rowsPerPage, {
        status: statusFilter,
        schemeId: schemeFilter,
        zoneId: zoneFilter,
      });
      fetchMeters();
      setSnackbar({
        open: true,
        message: "Connection created successfully!",
        severity: "success",
      });
    } catch (err) {
      console.error("Error creating connection:", err);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || "Failed to create connection.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignMeter = async () => {
    if (!selectedConnection || !selectedMeterId) return;
    setLoading(true);
    try {
      await axios.put(
        `${BASEURL}/assign-meter`,
        {
          connectionId: selectedConnection.id,
          meterId: selectedMeterId,
        },
        { withCredentials: true }
      );
      resetAssignModal();
      fetchConnections(search, page, rowsPerPage, {
        status: statusFilter,
        schemeId: schemeFilter,
        zoneId: zoneFilter,
      });
      fetchMeters();
      setSnackbar({
        open: true,
        message: "Meter assigned successfully!",
        severity: "success",
      });
    } catch (err) {
      console.error("Error assigning meter:", err);
      setSnackbar({
        open: true,
        message: "Failed to assign meter.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTaskCreated = async (taskData) => {
    setLoading(true);
    try {
      console.log("Task created:", taskData);
      setTaskDialogOpen(false);
      setTaskConnection(null);
      fetchConnections(search, page, rowsPerPage, {
        status: statusFilter,
        schemeId: schemeFilter,
        zoneId: zoneFilter,
      });
      setSnackbar({
        open: true,
        message: "Meter installation task created successfully!",
        severity: "success",
      });
    } catch (err) {
      console.error("Error handling task creation:", err);
      setSnackbar({
        open: true,
        message: "Failed to process task creation.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (connection) => {
    setSelectedConnection(connection);
    setDetailsDialogOpen(true);
  };

  const handleExport = () => {
    const csv = connections
      .map((conn) => ({
        Connection: conn.connectionNumber,
        Customer: conn.customerName,
        Email: conn.customerEmail,
        Phone: conn.customerPhoneNumber,
        Status: conn.status,
        Scheme: conn.schemeName,
        Zone: conn.zoneName,
        Route: conn.routeName,
      }))
      .map((row) => Object.values(row).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "connections.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const resetModal = () => {
    setModalOpen(false);
    setConnectionNumber("");
    setSelectedCustomerId("");
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

  const openTaskDialog = (connection) => {
    if (!connection?.id || !connection?.customerId) {
      setSnackbar({
        open: true,
        message: "Invalid connection selected.",
        severity: "error",
      });
      return;
    }
    setTaskConnection(connection);
    setTaskDialogOpen(true);
  };

  const columns = useMemo(
    () => [
      {
        field: "actions",
        headerName: "Actions",
        width: 120,
        align: "center",
        renderCell: (params) => (
          <Box>
            {params?.row?.status === "PENDING_METER" ? (
              <Tooltip title="Assign Meter Installation Task">
                <IconButton
                 color="theme.palette.primary.contrastText"
                  onClick={(e) => {
                    e.stopPropagation();
                    openTaskDialog(params.row);
                  }}
                  aria-label={`Assign meter installation task for connection ${params.row.connectionNumber}`}
                >
                  <Edit />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title="View Details">
                <IconButton
                  color="theme.palette.primary.contrastText"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewDetails(params.row);
                  }}
                  aria-label={`View details for connection ${params.row.connectionNumber}`}
                >
                  <Visibility />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        ),
      },
      { field: "connectionNumber", headerName: "Conn #", width: 100 },
      { field: "customerName", headerName: "Customer", width: 150 },
      { field: "customerEmail", headerName: "Email", width: 150 },
      { field: "customerPhoneNumber", headerName: "Phone", width: 120 },
      { field: "zoneName", headerName: "Zone", width: 120 },
      { field: "routeName", headerName: "Route", width: 100 },
      { field: "schemeName", headerName: "Scheme", width: 120 },
      { field: "tariffCategoryName", headerName: "Tariff", width: 150 },
      { field: "meterSerialNumber", headerName: "Meter", width: 120 },
      { field: "meterModel", headerName: "Meter Model", width: 120 },
      {
        field: "status",
        headerName: "Status",
        width: 100,
        renderCell: (params) => (
          <Chip
            label={params.value}
            color={
              params.value === "ACTIVE"
                ? "success"
                : params.value === "PENDING_METER"
                ? "warning"
                : "default"
            }
            size="small"
          />
        ),
      },
      {
        field: "accountStatus",
        headerName: "Account Status",
        width: 200,
        renderCell: (params) => {
          const accounts = params.row.rawCustomerAccounts || [];
          const hasPendingMeter = accounts.some(
            (acc) => acc.status === "PENDING_METER"
          );
          const statusText =
            accounts.length > 0
              ? accounts
                  .map((acc) => `${acc.customerAccount}: ${acc.status}`)
                  .join(", ")
              : "-";
          return (
            <Box
              sx={{
                backgroundColor: hasPendingMeter
                  ? "Highlight"
                  : "transparent",
                padding: "4px 8px",
                borderRadius: "4px",
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
              }}
            >
              {statusText}
            </Box>
          );
        },
      },
      {
        field: "createdAt",
        headerName: "Created At",
        width: 150,
        valueGetter: (params) =>
          params?.row?.createdAt
            ? new Date(params.row.createdAt).toLocaleDateString()
            : "-",
      },
    ],
    [theme]
  );

  const statusOptions = [
    "ACTIVE",
    "DISCONNECTED",
    "PENDING_PAYMENT",
    "PENDING_CONNECTION",
    "PENDING_METER",
    "DORMANT",
  ];

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => fetchConnections()}
    >
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          p: 2,
          bgcolor: "background.default",
        }}
      >
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
            {snackbar.message}
          </Alert>
        </Snackbar>

        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h4" fontWeight="bold">
            Connections Management
          </Typography>
          <Box>
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => setFilterOpen(!filterOpen)}
              sx={{ mr: 1 }}
              aria-label="Toggle filters"
            >
              Filters
            </Button>
            <Button
              variant="outlined"
              startIcon={<GetApp />}
              onClick={handleExport}
              sx={{ mr: 1 }}
              aria-label="Export connections"
            >
              Export
            </Button>
            {currentUser?.role === "ADMIN" && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setModalOpen(true)}
                aria-label="Add new connection"
              >
                Add Connection
              </Button>
            )}
          </Box>
        </Box>

        <Collapse in={filterOpen}>
          <Box
            sx={{
              mb: 2,
              p: 2,
              bgcolor: "background.paper",
              borderRadius: 1,
              boxShadow: 1,
            }}
          >
            <Box display="flex" gap={2}>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="">All</MenuItem>
                  {statusOptions.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Scheme</InputLabel>
                <Select
                  value={schemeFilter}
                  onChange={(e) => setSchemeFilter(e.target.value)}
                  label="Scheme"
                >
                  <MenuItem value="">All</MenuItem>
                  {schemes.map((scheme) => (
                    <MenuItem key={scheme.id} value={scheme.id}>
                      {scheme.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Zone</InputLabel>
                <Select
                  value={zoneFilter}
                  onChange={(e) => setZoneFilter(e.target.value)}
                  label="Zone"
                  disabled={!schemeFilter}
                >
                  <MenuItem value="">All</MenuItem>
                  {zones
                    .filter((zone) => !schemeFilter || zone.schemeId === schemeFilter)
                    .map((zone) => (
                      <MenuItem key={zone.id} value={zone.id}>
                        {zone.name}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Box>
          </Box>
        </Collapse>

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
                <IconButton
                  size="small"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  <Clear />
                </IconButton>
              </InputAdornment>
            ),
          }}
          aria-label="Search connections"
        />

        <Box sx={{ flex: 1, overflow: "hidden" }}>
          {loading ? (
            <Box sx={{ p: 2 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} height={60} sx={{ mb: 1 }} />
              ))}
            </Box>
          ) : (
            <DataGrid
              rows={connections}
              columns={columns}
              getRowId={(row, index) => row?.id || `fallback-${index}`}
              pageSizeOptions={[10, 25, 50, 100]}
              paginationModel={{ page, pageSize: rowsPerPage }}
              onPaginationModelChange={({ page: newPage, pageSize: newPageSize }) => {
                setPage(newPage);
                setRowsPerPage(newPageSize);
              }}
              rowCount={total}
              paginationMode="server"
              disableSelectionOnClick
              sx={{ height: "calc(100vh - 300px)", borderRadius: 1, boxShadow: 1 }}
              localeText={{ noRowsLabel: "No connections found" }}
              aria-label="Connections table"
            />
          )}
        </Box>

        <Dialog open={modalOpen} onClose={resetModal} fullWidth maxWidth="sm">
          <DialogTitle>Add New Connection</DialogTitle>
          <DialogContent>
            <TextField
              label="Connection Number"
              type="number"
              fullWidth
              required
              margin="dense"
              value={connectionNumber}
              onChange={(e) => setConnectionNumber(e.target.value)}
              error={!connectionNumber && modalOpen}
              helperText={
                !connectionNumber && modalOpen ? "Connection Number is required" : ""
              }
              aria-describedby="connection-number-error"
            />
            <TextField
              select
              label="Customer"
              fullWidth
              required
              margin="dense"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              error={!selectedCustomerId && modalOpen}
              helperText={
                !selectedCustomerId && modalOpen ? "Customer is required" : ""
              }
            >
              <MenuItem value="">Select Customer</MenuItem>
              {customers.length > 0 ? (
                customers.map((customer) => (
                  <MenuItem key={customer.id} value={customer.id}>
                    {customer.customerName} ({customer.phoneNumber || "N/A"})
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>No customers available</MenuItem>
              )}
            </TextField>
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
              {statusOptions.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={resetModal} disabled={loading} aria-label="Cancel">
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleCreateConnection}
              disabled={loading}
              aria-label="Create connection"
            >
              {loading ? <CircularProgress size={24} /> : "Create"}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={assignMeterOpen}
          onClose={resetAssignModal}
          fullWidth
          maxWidth="sm"
        >
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
            <Button
              onClick={resetAssignModal}
              disabled={loading}
              aria-label="Cancel"
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleAssignMeter}
              disabled={!selectedMeterId || loading}
              aria-label="Assign meter"
            >
              {loading ? <CircularProgress size={24} /> : "Assign"}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={taskDialogOpen}
          onClose={() => {
            setTaskDialogOpen(false);
            setTaskConnection(null);
          }}
          fullWidth
          maxWidth="sm"
        >
          <AssignMeterTaskDialog
            open={taskDialogOpen}
            onClose={() => {
              setTaskDialogOpen(false);
              setTaskConnection(null);
            }}
            connectionId={taskConnection?.id || ""}
            schemeId={taskConnection?.schemeId ? String(taskConnection.schemeId) : ""}
            zoneId={taskConnection?.zoneId ? String(taskConnection.zoneId) : ""}
            routeId={taskConnection?.routeId ? String(taskConnection.routeId) : ""}
            NewCustomerId={taskConnection?.customerId || ""}
            RelatedSurveyId=""
            assigneeId={currentUser?.id || ""}
            onTaskCreated={handleTaskCreated}
            theme={theme}
            taskTitle="Meter Installation Task"
            taskDescription={`Install meter for connection #${taskConnection?.connectionNumber} (Customer: ${taskConnection?.customerName || "N/A"})`}
          />
        </Dialog>

        <Dialog
          open={detailsDialogOpen}
          onClose={() => {
            setDetailsDialogOpen(false);
            setSelectedConnection(null);
          }}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Connection Details</DialogTitle>
          <DialogContent>
            {selectedConnection ? (
              <Box>
                <Typography>
                  <strong>Connection #:</strong> {selectedConnection.connectionNumber}
                </Typography>
                <Typography>
                  <strong>Customer:</strong> {selectedConnection.customerName}
                </Typography>
                <Typography>
                  <strong>Email:</strong> {selectedConnection.customerEmail}
                </Typography>
                <Typography>
                  <strong>Phone:</strong> {selectedConnection.customerPhoneNumber}
                </Typography>
                <Typography>
                  <strong>Status:</strong> {selectedConnection.status}
                </Typography>
                <Typography>
                  <strong>Scheme:</strong> {selectedConnection.schemeName || "-"}
                </Typography>
                <Typography>
                  <strong>Zone:</strong> {selectedConnection.zoneName || "-"}
                </Typography>
                <Typography>
                  <strong>Route:</strong> {selectedConnection.routeName || "-"}
                </Typography>
                <Typography>
                  <strong>Tariff:</strong> {selectedConnection.tariffCategoryName || "-"}
                </Typography>
                <Typography>
                  <strong>Meter:</strong> {selectedConnection.meterSerialNumber || "-"}
                </Typography>
                <Typography>
                  <strong>Created At:</strong>{" "}
                  {new Date(selectedConnection.createdAt).toLocaleString()}
                </Typography>
              </Box>
            ) : (
              <Typography>No details available</Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setDetailsDialogOpen(false);
                setSelectedConnection(null);
              }}
              aria-label="Close details"
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ErrorBoundary>
  );
};

export default ConnectionsScreen;