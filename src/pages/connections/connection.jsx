// src/pages/ConnectionsScreen.jsx  (or adjust path as needed)
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
} from "@mui/material";
import {
  Add,
  Search,
  Clear,
  Visibility,
  Edit,
  FilterList,
  GetApp,
  PowerOff,
} from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import { useAuthStore, useThemeStore } from "../../store/authStore";
import axios from "axios";
import { debounce } from "lodash";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";

// Custom components
import AssignMeterTaskDialog from "../../components/meterAssign/assignTask";
import CreateDisconnectionTaskPage from "../../components/disconnectionTasks/create";
import DisconnectionPreviewDialog from "../../components/connections/disconnectionPrev";

// Simple ErrorBoundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch() {
    // You can log error here
  }
  render() {
    if (this.state.hasError) {
      return this.props.FallbackComponent ? <this.props.FallbackComponent /> : null;
    }
    return this.props.children;
  }
}

const ErrorFallback = () => (
  <Box sx={{ p: 2, textAlign: "center" }}>
    <Typography color="error" variant="h6">
      Something went wrong
    </Typography>
    <Button variant="contained" onClick={() => window.location.reload()} sx={{ mt: 2 }}>
      Retry
    </Button>
  </Box>
);

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

const ConnectionsScreen = () => {
  const { currentUser } = useAuthStore();
  const { theme } = useThemeStore();
  const navigate = useNavigate();

  // Main connections data
  const [connections, setConnections] = useState([]);
  const [meters, setMeters] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [zones, setZones] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [tariffCategories, setTariffCategories] = useState([]);

  // Filters & pagination
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [schemeFilter, setSchemeFilter] = useState("");
  const [zoneFilter, setZoneFilter] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // UI states
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "error" });
  const [filterOpen, setFilterOpen] = useState(false);

  // Create connection modal
  const [modalOpen, setModalOpen] = useState(false);
  const [connectionNumber, setConnectionNumber] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [selectedZoneId, setSelectedZoneId] = useState("");
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [selectedSchemeId, setSelectedSchemeId] = useState("");
  const [selectedTariffCategoryId, setSelectedTariffCategoryId] = useState("");

  // Assign meter
  const [assignMeterOpen, setAssignMeterOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [selectedMeterId, setSelectedMeterId] = useState("");

  // Task & details dialogs
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskConnection, setTaskConnection] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // Disconnection preview & task
  const [previewScope, setPreviewScope] = useState("");
  const [previewScopeId, setPreviewScopeId] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewConnections, setPreviewConnections] = useState([]);
  const [previewSelectedIds, setPreviewSelectedIds] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [disconnectionDialogOpen, setDisconnectionDialogOpen] = useState(false);

  useEffect(() => {
    if (!currentUser) navigate("/login");
  }, [currentUser, navigate]);

  const customers = useMemo(() => {
    const unique = [];
    const seen = new Set();
    connections.forEach((conn) => {
      if (conn.customerId && !seen.has(conn.customerId)) {
        unique.push({
          id: conn.customerId,
          customerName: conn.customerName,
          phoneNumber: conn.customerPhoneNumber,
          email: conn.customerEmail,
          status: conn.customerStatus,
        });
        seen.add(conn.customerId);
      }
    });
    return unique;
  }, [connections]);

  const filteredZones = useMemo(
    () => (selectedSchemeId ? zones.filter(z => z.schemeId === selectedSchemeId) : zones),
    [zones, selectedSchemeId]
  );

  const filteredRoutes = useMemo(
    () => (selectedZoneId ? routes.filter(r => r.zoneId === selectedZoneId) : routes),
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
        const valid = (res.data.data || [])
          .filter(c => c && typeof c === "object" && c.id)
          .map(flattenConnection);
        setConnections(valid);
        setTotal(res.data.pagination?.total || 0);
      } catch (err) {
        console.error("fetchConnections error:", err);
        setConnections([]);
        setSnackbar({ open: true, message: "Failed to fetch connections", severity: "error" });
      } finally {
        setLoading(false);
      }
    },
    [currentUser]
  );

  const fetchMeters = useCallback(async () => {
    try {
      const res = await axios.get(`${BASEURL}/meters`, { withCredentials: true });
      setMeters((res.data?.data?.meters ?? []).filter(m => !m.connectionId));
    } catch (err) {
      setSnackbar({ open: true, message: "Failed to fetch meters", severity: "error" });
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
      setZones(schemesData.flatMap(s => s.zones || []));
      setRoutes(schemesData.flatMap(s => s.zones?.flatMap(z => z.routes || []) || []));
      const tariffData = tariffsRes.data.data || [];
      const uniqueCats = Object.values(
        tariffData.reduce((acc, t) => {
          acc[t.categoryId] = { id: t.categoryId, name: t.category.name };
          return acc;
        }, {})
      );
      setTariffCategories(uniqueCats);
    } catch (err) {
      setSnackbar({ open: true, message: "Failed to load metadata", severity: "error" });
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([
        fetchConnections("", page, rowsPerPage, { status: statusFilter, schemeId: schemeFilter, zoneId: zoneFilter }),
        fetchMeters(),
        fetchMetaData(),
      ]);
      setLoading(false);
    };
    init();
  }, [
    page,
    rowsPerPage,
    statusFilter,
    schemeFilter,
    zoneFilter,
    fetchConnections,
    fetchMeters,
    fetchMetaData,
  ]);

  const debouncedSearch = useMemo(
    () => debounce((q) => {
      setPage(0);
      fetchConnections(q, 0, rowsPerPage, { status: statusFilter, schemeId: schemeFilter, zoneId: zoneFilter });
    }, 500),
    [fetchConnections, rowsPerPage, statusFilter, schemeFilter, zoneFilter]
  );

  useEffect(() => {
    debouncedSearch(search);
    return () => debouncedSearch.cancel();
  }, [search]);

  const fetchDueForDisconnection = async () => {
    if (!previewScope || !previewScopeId) {
      setSnackbar({ open: true, severity: "warning", message: "Select scope and value" });
      return;
    }

    const scope = previewScope.toUpperCase();
    const url = `${BASEURL}/connections-due-disconnection/${scope}/${previewScopeId}`;

    try {
      setPreviewLoading(true);
      const res = await axios.get(url, { withCredentials: true });
      setPreviewConnections(res.data.data || []);
      setPreviewSelectedIds([]);
      setPreviewOpen(true);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to load preview";
      setSnackbar({ open: true, message: msg, severity: "error" });
    } finally {
      setPreviewLoading(false);
    }
  };



  const handleDownloadDueForDisconnection = async () => {
  if (!previewScope || !previewScopeId) {
    setSnackbar({
      open: true,
      severity: "warning",
      message: "Select scope and value before downloading",
    });
    return;
  }

  try {
    const scope = previewScope.toUpperCase();

    const url = `${BASEURL}/reports/disconnections-due?scope=${scope}&id=${previewScopeId}`;

    const res = await axios.get(url, {
      withCredentials: true,
      responseType: "blob", // 🔴 critical
    });

    const blob = new Blob([res.data], { type: "application/pdf" });
    const fileURL = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = fileURL;
    a.download = `connections_due_for_disconnection_${scope}_${previewScopeId}.pdf`;
    document.body.appendChild(a);
    a.click();

    window.URL.revokeObjectURL(fileURL);
    a.remove();
  } catch (err) {
    console.error(err);
    setSnackbar({
      open: true,
      severity: "error",
      message: "Failed to download report",
    });
  }
};


  const handleOpenDisconnectionPreview = () => {
    if (previewScope && !previewScopeId) {
      setSnackbar({ open: true, severity: "warning", message: "Select specific scheme/zone/route" });
      return;
    }
    fetchDueForDisconnection();
  };

  const handleProceedToCreateDisconnection = () => {
    setPreviewOpen(false);
    setDisconnectionDialogOpen(true);
  };

  const handleCreateConnection = async () => {
    if (!connectionNumber || !selectedCustomerId) {
      setSnackbar({ open: true, message: "Connection Number and Customer required", severity: "error" });
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
      fetchConnections(search, page, rowsPerPage, { status: statusFilter, schemeId: schemeFilter, zoneId: zoneFilter });
      fetchMeters();
      setSnackbar({ open: true, message: "Connection created", severity: "success" });
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.message || "Create failed", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignMeter = async () => {
    if (!selectedConnection || !selectedMeterId) return;
    setLoading(true);
    try {
      await axios.put(`${BASEURL}/assign-meter`, {
        connectionId: selectedConnection.id,
        meterId: selectedMeterId,
      }, { withCredentials: true });
      resetAssignModal();
      fetchConnections(search, page, rowsPerPage, { status: statusFilter, schemeId: schemeFilter, zoneId: zoneFilter });
      fetchMeters();
      setSnackbar({ open: true, message: "Meter assigned", severity: "success" });
    } catch (err) {
      setSnackbar({ open: true, message: "Assign failed", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleTaskCreated = () => {
    setTaskDialogOpen(false);
    setTaskConnection(null);
    fetchConnections(search, page, rowsPerPage, { status: statusFilter, schemeId: schemeFilter, zoneId: zoneFilter });
    setSnackbar({ open: true, message: "Task created", severity: "success" });
  };

  const handleViewDetails = (connection) => {
    setSelectedConnection(connection);
    setDetailsDialogOpen(true);
  };

  const handleExport = () => {
    const csv = connections
      .map(c => ({
        Conn: c.connectionNumber,
        Customer: c.customerName,
        Email: c.customerEmail,
        Phone: c.customerPhoneNumber,
        Status: c.status,
        Scheme: c.schemeName,
        Zone: c.zoneName,
        Route: c.routeName,
      }))
      .map(row => Object.values(row).join(","))
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
      setSnackbar({ open: true, message: "Invalid connection", severity: "error" });
      return;
    }
    setTaskConnection(connection);
    setTaskDialogOpen(true);
  };

  const handleDisconnectionTaskCreated = () => {
    setDisconnectionDialogOpen(false);
    fetchConnections(search, page, rowsPerPage, { status: statusFilter, schemeId: schemeFilter, zoneId: zoneFilter });
    setSnackbar({ open: true, message: "Disconnection task created", severity: "success" });
  };

  const statusOptions = [
    "ACTIVE",
    "DISCONNECTED",
    "PENDING_PAYMENT",
    "PENDING_CONNECTION",
    "PENDING_METER",
    "DORMANT",
  ];

  const columns = useMemo(() => [
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      align: "center",
      renderCell: (params) => (
        <Box>
          {params.row.status === "PENDING_METER" ? (
            <Tooltip title="Assign Meter Task">
              <IconButton
                sx={{ color: theme?.palette?.primary?.contrastText }}
                onClick={(e) => {
                  e.stopPropagation();
                  openTaskDialog(params.row);
                }}
              >
                <Edit />
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title="View Details">
              <IconButton
                sx={{ color: theme?.palette?.primary?.contrastText }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewDetails(params.row);
                }}
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
            params.value === "ACTIVE" ? "success" :
            params.value === "PENDING_METER" ? "warning" :
            "default"
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
        const accs = params.row.rawCustomerAccounts || [];
        const hasPending = accs.some(a => a.status === "PENDING_METER");
        const text = accs.length ? accs.map(a => `${a.customerAccount}: ${a.status}`).join(", ") : "-";
        return (
          <Box sx={{
            bgcolor: hasPending ? "Highlight" : "transparent",
            p: "4px 8px",
            borderRadius: "4px",
            width: "100%",
          }}>
            {text}
          </Box>
        );
      },
    },
    {
      field: "createdAt",
      headerName: "Created",
      width: 150,
      valueGetter: (p) => p.row?.createdAt ? new Date(p.row?.createdAt).toLocaleDateString() : "-",
    },
  ], [theme]);

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Box sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        p: 3,
        bgcolor: "background.default",
        gap: 2,
      }}>
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

        {/* Header */}
        <Box sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 2,
          mb: 1,
        }}>
          <Typography variant="h5" fontWeight={600}>Connections</Typography>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center" }}>
            <Box sx={{ display: "flex", gap: 1.5 }}>
             

              <Button
                variant="outlined"
                color="error"
                startIcon={<PowerOff />}
                onClick={() => setDisconnectionDialogOpen(true)}
                disabled={loading}
              >
                Create Disconnection Task
              </Button>
            </Box>

            <Box sx={{ display: "flex", gap: 1.5 }}>
              <Button variant="outlined" size="small" startIcon={<FilterList />} onClick={() => setFilterOpen(!filterOpen)}>
                Filters
              </Button>
              <Button variant="outlined" size="small" startIcon={<GetApp />} onClick={handleExport}>
                Export
              </Button>
              {currentUser?.role === "ADMIN" && (
                <Button variant="contained" color="primary" size="small" startIcon={<Add />} onClick={() => setModalOpen(true)}>
                  New Connection
                </Button>
              )}
            </Box>
          </Box>
        </Box>

        {/* Search & Scope */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            fullWidth
            placeholder="Search by connection, customer, phone, meter..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
              endAdornment: search && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearch("")}><Clear fontSize="small" /></IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Collapse in={true}>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap", p: 1.5, bgcolor: "action.hover", borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>connections with overdue bills:</Typography>

              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>By</InputLabel>
                <Select
                  value={previewScope}
                  label="By"
                  onChange={e => { setPreviewScope(e.target.value); setPreviewScopeId(""); }}
                >
                  <MenuItem value="">All overdue</MenuItem>
                  <MenuItem value="SCHEME">Scheme</MenuItem>
                  <MenuItem value="ZONE">Zone</MenuItem>
                  <MenuItem value="ROUTE">Route</MenuItem>
                </Select>
              </FormControl>

{previewScope && (
  <>
    <FormControl size="small" sx={{ minWidth: 220 }}>
      <InputLabel>{previewScope === "SCHEME" ? "Scheme" : previewScope === "ZONE" ? "Zone" : "Route"}</InputLabel>
      <Select
        value={previewScopeId}
        label={previewScope === "SCHEME" ? "Scheme" : previewScope === "ZONE" ? "Zone" : "Route"}
        onChange={e => setPreviewScopeId(e.target.value)}
      >
        <MenuItem value="">— Select —</MenuItem>
        {previewScope === "SCHEME" && schemes.map(s => <MenuItem key={s.id} value={String(s.id)}>{s.name}</MenuItem>)}
        {previewScope === "ZONE" && zones.map(z => <MenuItem key={z.id} value={String(z.id)}>{z.name} {z.scheme?.name ? `(${z.scheme.name})` : ""}</MenuItem>)}
        {previewScope === "ROUTE" && routes.map(r => <MenuItem key={r.id} value={String(r.id)}>{r.name} {r.zone?.name ? `(${r.zone.name})` : ""}</MenuItem>)}
      </Select>
    </FormControl>

    <Button
      variant="outlined"
       color="theme.palette.primary.contrastText"
   
      startIcon={<Visibility />}
      onClick={handleOpenDisconnectionPreview}
      disabled={loading || (previewScope && !previewScopeId)}
    >
      Preview
    </Button>

    <Button
      variant="outlined"
      color="theme.palette.primary.contrastText"
      startIcon={<GetApp />}
      onClick={handleDownloadDueForDisconnection}
      disabled={loading || !previewScope || !previewScopeId}
    >
      download
    </Button>
  </>
)}

              
            </Box>
          </Collapse>

          <Collapse in={filterOpen}>
            <Box sx={{ p: 2, bgcolor: "background.paper", borderRadius: 1, boxShadow: 1 }}>
              <Box display="flex" gap={2} flexWrap="wrap">
                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel>Status</InputLabel>
                  <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} label="Status">
                    <MenuItem value="">All</MenuItem>
                    {statusOptions.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                  </Select>
                </FormControl>
                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel>Scheme</InputLabel>
                  <Select value={schemeFilter} onChange={e => setSchemeFilter(e.target.value)} label="Scheme">
                    <MenuItem value="">All</MenuItem>
                    {schemes.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                  </Select>
                </FormControl>
                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel>Zone</InputLabel>
                  <Select value={zoneFilter} onChange={e => setZoneFilter(e.target.value)} label="Zone" disabled={!schemeFilter}>
                    <MenuItem value="">All</MenuItem>
                    {zones.filter(z => !schemeFilter || z.schemeId === schemeFilter).map(z => <MenuItem key={z.id} value={z.id}>{z.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Box>
            </Box>
          </Collapse>
        </Box>

        {/* DataGrid */}
        <Box sx={{ flex: 1, overflow: "hidden", borderRadius: 1, boxShadow: 1 }}>
          {loading ? (
            <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CircularProgress />
            </Box>
          ) : (
            <DataGrid
              rows={connections}
              columns={columns}
              getRowId={(row, idx) => row?.id || `row-${idx}`}
              pageSizeOptions={[10, 25, 50, 100]}
              paginationModel={{ page, pageSize: rowsPerPage }}
              onPaginationModelChange={({ page: p, pageSize: ps }) => { setPage(p); setRowsPerPage(ps); }}
              rowCount={total}
              paginationMode="server"
              disableSelectionOnClick
              sx={{
                height: "100%",
                border: "none",
                "& .MuiDataGrid-columnHeaders": { bgcolor: "background.default", fontWeight: 600 },
                "& .MuiDataGrid-row:hover": { bgcolor: "action.hover" },
              }}
              localeText={{ noRowsLabel: "No connections found" }}
            />
          )}
        </Box>

        {/* Dialogs */}
        {/* New Connection */}
        <Dialog open={modalOpen} onClose={resetModal} fullWidth maxWidth="sm">
          <DialogTitle>Add New Connection</DialogTitle>
          <DialogContent>
            <TextField fullWidth required label="Connection Number" type="number" value={connectionNumber} onChange={e => setConnectionNumber(e.target.value)} margin="dense" />
            <TextField select fullWidth required label="Customer" value={selectedCustomerId} onChange={e => setSelectedCustomerId(e.target.value)} margin="dense">
              <MenuItem value="">Select Customer</MenuItem>
              {customers.map(c => <MenuItem key={c.id} value={c.id}>{c.customerName} ({c.phoneNumber || "N/A"})</MenuItem>)}
            </TextField>
            {/* ... other select fields for scheme/zone/route/tariff/status ... */}
          </DialogContent>
          <DialogActions>
            <Button onClick={resetModal} disabled={loading}>Cancel</Button>
            <Button variant="contained" onClick={handleCreateConnection} disabled={loading}>
              {loading ? <CircularProgress size={20} /> : "Create"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Assign Meter */}
        <Dialog open={assignMeterOpen} onClose={resetAssignModal} fullWidth maxWidth="sm">
          <DialogTitle>Assign Meter</DialogTitle>
          <DialogContent>
            <TextField select fullWidth label="Meter" value={selectedMeterId} onChange={e => setSelectedMeterId(e.target.value)} margin="dense">
              {meters.map(m => <MenuItem key={m.id} value={m.id}>{m.serialNumber}</MenuItem>)}
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={resetAssignModal}>Cancel</Button>
            <Button variant="contained" onClick={handleAssignMeter} disabled={!selectedMeterId}>Assign</Button>
          </DialogActions>
        </Dialog>

        {/* Task Dialog */}
        <Dialog open={taskDialogOpen} onClose={() => setTaskDialogOpen(false)} fullWidth maxWidth="sm">
          <AssignMeterTaskDialog
            open={taskDialogOpen}
            onClose={() => { setTaskDialogOpen(false); setTaskConnection(null); }}
            connectionId={taskConnection?.id || ""}
            schemeId={String(taskConnection?.schemeId || "")}
            zoneId={String(taskConnection?.zoneId || "")}
            routeId={String(taskConnection?.routeId || "")}
            NewCustomerId={taskConnection?.customerId || ""}
            RelatedSurveyId=""
            assigneeId={currentUser?.id || ""}
            onTaskCreated={handleTaskCreated}
            theme={theme}
            taskTitle="Meter Installation Task"
            taskDescription={`Install meter for #${taskConnection?.connectionNumber}`}
          />
        </Dialog>

        {/* Details Dialog */}
        <Dialog open={detailsDialogOpen} onClose={() => setDetailsDialogOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle>Connection Details</DialogTitle>
          <DialogContent>
            {selectedConnection && (
              <Box component="dl">
                <dt><strong>Connection #</strong></dt><dd>{selectedConnection.connectionNumber}</dd>
                <dt><strong>Customer</strong></dt><dd>{selectedConnection.customerName}</dd>
                {/* ... other fields ... */}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Disconnection Task */}
        <Dialog open={disconnectionDialogOpen} onClose={() => setDisconnectionDialogOpen(false)} fullWidth maxWidth="md" scroll="paper">
          <DialogTitle>Create Disconnection Task</DialogTitle>
          <DialogContent dividers>
            <CreateDisconnectionTaskPage
              onTaskCreated={handleDisconnectionTaskCreated}
              onCancel={() => setDisconnectionDialogOpen(false)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDisconnectionDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Preview Dialog */}
        <DisconnectionPreviewDialog
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          dueConnections={previewConnections}
          selectedIds={previewSelectedIds}
          onSelectionChange={setPreviewSelectedIds}
          onProceed={handleProceedToCreateDisconnection}
          loading={previewLoading}
        />
      </Box>
    </ErrorBoundary>
  );
};

export default ConnectionsScreen;