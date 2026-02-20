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
  Devices,
} from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import { useAuthStore } from "../../store/authStore";
import { useThemeStore } from "../../store/theme";
import axios from "axios";
import { debounce } from "lodash";
import { useNavigate } from "react-router-dom";
import {
  PermissionDeniedUI,
  isPermissionDenied,
} from "../../utils/permissionHelper";

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

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
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

const ErrorFallback = () => (
  <Box sx={{ p: 4, textAlign: "center" }}>
    <Typography color="error" variant="h6" gutterBottom>
      Something went wrong with the connections view
    </Typography>
    <Button
      variant="contained"
      color="primary"
      onClick={() => window.location.reload()}
    >
      Reload Page
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
  customerAccountId: conn.customerAccounts?.[0]?.id || null,
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
  const [permissionDenied, setPermissionDenied] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "error",
  });
  const [filterOpen, setFilterOpen] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [connectionNumber, setConnectionNumber] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [selectedSchemeId, setSelectedSchemeId] = useState("");
  const [selectedZoneId, setSelectedZoneId] = useState("");
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [selectedTariffCategoryId, setSelectedTariffCategoryId] = useState("");

  const [assignMeterOpen, setAssignMeterOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [selectedMeterId, setSelectedMeterId] = useState("");

  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskConnection, setTaskConnection] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const [previewScope, setPreviewScope] = useState("");
  const [previewScopeId, setPreviewScopeId] = useState("");
  const [minBalance, setMinBalance] = useState(""); // ← NEW state for minimum balance filter
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewConnections, setPreviewConnections] = useState([]);
  const [previewSelectedIds, setPreviewSelectedIds] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Edit Connection Modal States
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editConnection, setEditConnection] = useState(null);
  const [editConnectionNumber, setEditConnectionNumber] = useState("");
  const [editStatus, setEditStatus] = useState("ACTIVE");
  const [editSelectedSchemeId, setEditSelectedSchemeId] = useState("");
  const [editSelectedZoneId, setEditSelectedZoneId] = useState("");
  const [editSelectedRouteId, setEditSelectedRouteId] = useState("");
  const [editSelectedTariffCategoryId, setEditSelectedTariffCategoryId] =
    useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [disconnectionDialogOpen, setDisconnectionDialogOpen] = useState(false);
  const [minUnpaidMonths, setMinUnpaidMonths] = useState(""); // ✅ NEW

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  const customers = useMemo(() => {
    const seen = new Set();
    return connections
      .filter((c) => c.customerId && !seen.has(c.customerId))
      .map((c) => {
        seen.add(c.customerId);
        return {
          id: c.customerId,
          customerName: c.customerName,
          phoneNumber: c.customerPhoneNumber,
          email: c.customerEmail,
          status: c.customerStatus,
        };
      });
  }, [connections]);

  const fetchConnections = useCallback(
    async (searchQuery = "", pageNum = 0, limit = 25, filters = {}) => {
      if (!currentUser) {
        return;
      }
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
          .filter((c) => c && typeof c === "object" && c.id)
          .map(flattenConnection);
        setConnections(valid);
        setTotal(res.data.pagination?.total || 0);
        setPermissionDenied(false);
      } catch (err) {
        console.error("fetchConnections error:", err);
        if (isPermissionDenied(err)) {
          setPermissionDenied(true);
          setConnections([]);
        } else {
          setConnections([]);
          setSnackbar({
            open: true,
            message: "Failed to load connections",
            severity: "error",
          });
        }
      } finally {
        setLoading(false);
      }
    },
    [currentUser],
  );

  const fetchMeters = useCallback(async () => {
    try {
      const res = await axios.get(`${BASEURL}/meters`, {
        withCredentials: true,
      });
      setMeters((res.data?.data?.meters ?? []).filter((m) => !m.connectionId));
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to load meters",
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
      setZones(schemesData.flatMap((s) => s.zones || []));
      setRoutes(
        schemesData.flatMap(
          (s) => s.zones?.flatMap((z) => z.routes || []) || [],
        ),
      );
      const tariffData = tariffsRes.data.data || [];
      const uniqueCats = Object.values(
        tariffData.reduce((acc, t) => {
          acc[t.categoryId] = { id: t.categoryId, name: t.category.name };
          return acc;
        }, {}),
      );
      setTariffCategories(uniqueCats);
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to load metadata",
        severity: "error",
      });
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([
        fetchConnections("", page, rowsPerPage, {
          status: statusFilter,
          schemeId: schemeFilter,
          zoneId: zoneFilter,
        }),
        fetchMeters(),
        fetchMetaData(),
      ]);
      setLoading(false);
    };
    init();
  }, [page, rowsPerPage, statusFilter, schemeFilter, zoneFilter]);

  const debouncedSearch = useMemo(
    () =>
      debounce((q) => {
        setPage(0);
        fetchConnections(q, 0, rowsPerPage, {
          status: statusFilter,
          schemeId: schemeFilter,
          zoneId: zoneFilter,
        });
      }, 500),
    [fetchConnections, rowsPerPage, statusFilter, schemeFilter, zoneFilter],
  );

  useEffect(() => {
    debouncedSearch(search);
    return () => debouncedSearch.cancel();
  }, [search]);

  // ────────────────────────────────────────────────
  // Disconnection Preview & Download with minBalance
  // ────────────────────────────────────────────────
  const getScopeLabel = (scope) => {
    const upper = scope?.toUpperCase();
    switch (upper) {
      case "SCHEME":
        return "Scheme";
      case "ZONE":
        return "Zone";
      case "ROUTE":
        return "Route";
      default:
        return "Scope";
    }
  };

  const fetchDueForDisconnection = async () => {
    if (!previewScope || !previewScopeId) {
      setSnackbar({
        open: true,
        severity: "warning",
        message: "Please select scope and specific value",
      });
      return;
    }

    setPreviewLoading(true);
    try {
      const scope = previewScope.toUpperCase();

      const res = await axios.get(
        `${BASEURL}/connections-due-disconnection/${scope}/${previewScopeId}`,
        {
          params: {
            minBalance: minBalance.trim() || undefined,
            minUnpaidMonths: minUnpaidMonths.trim() || undefined, // ✅ NEW
          },
          withCredentials: true,
        },
      );

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
        message: "Select scope and value to download report",
      });
      return;
    }

    try {
      const scope = previewScope.toUpperCase();

      const res = await axios.get(`${BASEURL}/reports/disconnections-due`, {
        params: {
          scope,
          id: previewScopeId,
          minBalance: minBalance.trim() || undefined,
          minUnpaidMonths: minUnpaidMonths.trim() || undefined, // ✅ NEW
        },
        withCredentials: true,
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const fileNameParts = [
        "due-disconnection",
        scope.toLowerCase(),
        previewScopeId,
        minBalance && `minBal-${minBalance}`,
        minUnpaidMonths && `minMonths-${minUnpaidMonths}`,
        new Date().toISOString().slice(0, 10),
      ].filter(Boolean);

      const link = document.createElement("a");
      link.href = url;
      link.download = `${fileNameParts.join("_")}.pdf`;

      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      link.remove();

      setSnackbar({
        open: true,
        severity: "success",
        message: "Report downloaded",
      });
    } catch (err) {
      console.error("Download error:", err);
      setSnackbar({
        open: true,
        severity: "error",
        message: "Failed to download disconnection report",
      });
    }
  };

  const handleOpenDisconnectionPreview = () => {
    fetchDueForDisconnection();
  };

  const handleProceedToCreateDisconnection = () => {
    setPreviewOpen(false);
    setDisconnectionDialogOpen(true);
  };

  const handleCreateConnection = async () => {
    if (!connectionNumber || !selectedCustomerId) {
      setSnackbar({
        open: true,
        message: "Connection Number and Customer required",
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
        { withCredentials: true },
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
        message: "Connection created",
        severity: "success",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || "Create failed",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignMeter = async () => {
    if (!selectedConnection || !selectedMeterId) {
      setSnackbar({
        open: true,
        message: "Please select both a connection and a meter",
        severity: "error",
      });
      return;
    }
    setLoading(true);
    try {
      console.warn("📤 Assigning meter:", {
        connectionId: selectedConnection.id,
        meterId: selectedMeterId,
      });

      await axios.put(
        `${BASEURL}/assign-meter`,
        {
          connectionId: selectedConnection.id,
          meterId: selectedMeterId,
        },
        { withCredentials: true },
      );

      console.warn("✅ Meter assignment response: Success");

      resetAssignModal();
      fetchConnections(search, page, rowsPerPage, {
        status: statusFilter,
        schemeId: schemeFilter,
        zoneId: zoneFilter,
      });
      fetchMeters();
      setSnackbar({
        open: true,
        message: "✅ Meter assigned successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("❌ Meter assignment error:", error);
      if (isPermissionDenied(error)) {
        setPermissionDenied(true);
      } else {
        setSnackbar({
          open: true,
          message: error.response?.data?.message || "Failed to assign meter",
          severity: "error",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Open Assign Meter Modal
  const handleOpenAssignMeterModal = (connection) => {
    // Check if connection already has a meter
    if (connection.meterId) {
      setSnackbar({
        open: true,
        message:
          "⚠️ This connection already has a meter assigned. Please unassign it first if you want to change it.",
        severity: "warning",
      });
      return;
    }
    setSelectedConnection(connection);
    setSelectedMeterId("");
    setAssignMeterOpen(true);
  };

  const handleTaskCreated = () => {
    setTaskDialogOpen(false);
    setTaskConnection(null);
    fetchConnections(search, page, rowsPerPage, {
      status: statusFilter,
      schemeId: schemeFilter,
      zoneId: zoneFilter,
    });
    setSnackbar({
      open: true,
      message: "Task created successfully",
      severity: "success",
    });
  };

  const handleDisconnectionTaskCreated = () => {
    setDisconnectionDialogOpen(false);
    fetchConnections(search, page, rowsPerPage, {
      status: statusFilter,
      schemeId: schemeFilter,
      zoneId: zoneFilter,
    });
    setSnackbar({
      open: true,
      message: "Disconnection task created",
      severity: "success",
    });
  };

  const handleExport = () => {
    const csv = connections
      .map((c) => ({
        Conn: c.connectionNumber,
        Customer: c.customerName,
        Email: c.customerEmail,
        Phone: c.customerPhoneNumber,
        Status: c.status,
        Scheme: c.schemeName,
        Zone: c.zoneName,
        Route: c.routeName,
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
    setSelectedSchemeId("");
    setSelectedZoneId("");
    setSelectedRouteId("");
    setSelectedTariffCategoryId("");
  };

  const resetAssignModal = () => {
    setAssignMeterOpen(false);
    setSelectedConnection(null);
    setSelectedMeterId("");
  };

  // Open Edit Connection Modal
  const handleOpenEditModal = (connection) => {
    setEditConnection(connection);
    setEditConnectionNumber(connection.connectionNumber || "");
    setEditStatus(connection.status || "ACTIVE");
    setEditSelectedSchemeId(connection.schemeId || "");
    setEditSelectedZoneId(connection.zoneId || "");
    setEditSelectedRouteId(connection.routeId || "");
    setEditSelectedTariffCategoryId(connection.tariffCategoryId || "");
    setEditModalOpen(true);
  };

  // Reset Edit Modal
  const resetEditModal = () => {
    setEditModalOpen(false);
    setEditConnection(null);
    setEditConnectionNumber("");
    setEditStatus("ACTIVE");
    setEditSelectedSchemeId("");
    setEditSelectedZoneId("");
    setEditSelectedRouteId("");
    setEditSelectedTariffCategoryId("");
  };

  // Handle Edit Connection Submit
  const handleEditConnection = async () => {
    if (!editConnection || !editConnectionNumber) {
      setSnackbar({
        open: true,
        message: "Connection Number is required",
        severity: "error",
      });
      return;
    }

    setEditSubmitting(true);
    try {
      const payload = {
        connectionNumber: Number(editConnectionNumber),
        status: editStatus,
        tariffCategoryId: editSelectedTariffCategoryId || null,
        schemeId: editSelectedSchemeId ? Number(editSelectedSchemeId) : null,
        zoneId: editSelectedZoneId ? Number(editSelectedZoneId) : null,
        routeId: editSelectedRouteId ? Number(editSelectedRouteId) : null,
      };

      console.warn("📤 Updating connection:", payload);

      await axios.put(
        `${BASEURL}/update-connection/${editConnection.id}`,
        payload,
        { withCredentials: true },
      );

      resetEditModal();
      fetchConnections(search, page, rowsPerPage, {
        status: statusFilter,
        schemeId: schemeFilter,
        zoneId: zoneFilter,
      });

      setSnackbar({
        open: true,
        message: "✅ Connection updated successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("❌ Error updating connection:", error);
      if (isPermissionDenied(error)) {
        setPermissionDenied(true);
      } else {
        setSnackbar({
          open: true,
          message:
            error.response?.data?.message || "Failed to update connection",
          severity: "error",
        });
      }
    } finally {
      setEditSubmitting(false);
    }
  };

  const openTaskDialog = (connection) => {
    if (!connection?.id || !connection?.customerId) {
      setSnackbar({
        open: true,
        message: "Invalid connection selected",
        severity: "error",
      });
      return;
    }
    setTaskConnection(connection);
    setTaskDialogOpen(true);
  };

  const handleViewDetails = (connection) => {
    setSelectedConnection(connection);
    setDetailsDialogOpen(true);
  };

  const statusOptions = [
    "ACTIVE",
    "DISCONNECTED",
    "PENDING_PAYMENT",
    "PENDING_CONNECTION",
    "PENDING_METER",
    "DORMANT",
  ];

  const columns = useMemo(
    () => [
      {
        field: "actions",
        headerName: "Actions",
        width: 180,
        align: "center",
        renderCell: (params) => (
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <Tooltip title="Edit Connection">
              <IconButton
                size="small"
                color="theme.palette.primary.contrastText"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenEditModal(params.row);
                }}
              >
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* Show Assign Meter button if no meter assigned */}
            {!params?.row?.meterId ? (
              <Tooltip title="Assign Meter">
                <IconButton
                  size="small"
                  color="warning"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenAssignMeterModal(params.row);
                  }}
                >
                  <Devices fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title="View Details">
                <IconButton
                  size="small"
                  color="info"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewDetails(params.row);
                  }}
                >
                  <Visibility fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        ),
      },
      {
        field: "status",
        headerName: "Status",
        width: 130,
        renderCell: (params) => (
          <Chip
            label={params.value}
            color={
              params.value === "ACTIVE"
                ? "success"
                : params.value === "PENDING_METER"
                  ? "warning"
                  : params.value === "DISCONNECTED"
                    ? "error"
                    : "default"
            }
            size="small"
          />
        ),
      },
      { field: "connectionNumber", headerName: "Conn #", width: 100 },
      { field: "customerName", headerName: "Customer", width: 180 },
      { field: "customerPhoneNumber", headerName: "Phone", width: 130 },
      { field: "customerEmail", headerName: "Email", width: 220 },
      { field: "schemeName", headerName: "Scheme", width: 140 },
      { field: "zoneName", headerName: "Zone", width: 130 },
      { field: "routeName", headerName: "Route", width: 110 },
      { field: "tariffCategoryName", headerName: "Tariff", width: 160 },
      { field: "meterSerialNumber", headerName: "Meter", width: 130 },
    ],
    [],
  );

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          p: 3,
          gap: 2,
        }}
      >
        <Snackbar
          open={snackbar.open}
          autoHideDuration={5000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
            {snackbar.message}
          </Alert>
        </Snackbar>

        {/* Permission Denied UI */}
        {permissionDenied ? (
          <PermissionDeniedUI permission="connections:view" />
        ) : (
          <>
            {/* Header */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 2,
              }}
            >
              <Typography variant="h5" fontWeight={600}>
                Connections
              </Typography>

              <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<PowerOff />}
                  onClick={() => setDisconnectionDialogOpen(true)}
                  disabled={loading}
                >
                  Create Disconnection Task
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<FilterList />}
                  onClick={() => setFilterOpen(!filterOpen)}
                >
                  Filters
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<GetApp />}
                  onClick={handleExport}
                >
                  Export CSV
                </Button>

                {currentUser?.role === "ADMIN" && (
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setModalOpen(true)}
                  >
                    New Connection
                  </Button>
                )}
              </Box>
            </Box>

            {/* Search + Disconnection Controls */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by conn #, customer name, phone, meter..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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

              <Collapse in={true}>
                <Box sx={{ p: 2, bgcolor: "action.hover", borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Overdue connections for disconnection
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 2,
                      alignItems: "center",
                      mt: 1.5,
                    }}
                  >
                    <FormControl size="small" sx={{ minWidth: 90 }}>
                      <InputLabel>Level</InputLabel>
                      <Select
                        value={previewScope}
                        label="Level"
                        onChange={(e) => {
                          setPreviewScope(e.target.value);
                          setPreviewScopeId("");
                          setMinBalance("");
                          setMinUnpaidMonths(""); // ✅ reset
                        }}
                      >
                        <MenuItem value="">All overdue</MenuItem>
                        <MenuItem value="SCHEME">Scheme</MenuItem>
                        <MenuItem value="ZONE">Zone</MenuItem>
                        <MenuItem value="ROUTE">Route</MenuItem>
                      </Select>
                    </FormControl>

                    {previewScope && (
                      <>
                        <FormControl size="small" sx={{ minWidth: 80 }}>
                          <InputLabel>{getScopeLabel(previewScope)}</InputLabel>
                          <Select
                            value={previewScopeId}
                            label={getScopeLabel(previewScope)}
                            onChange={(e) => setPreviewScopeId(e.target.value)}
                          >
                            <MenuItem value="">— Select —</MenuItem>
                            {previewScope === "SCHEME" &&
                              schemes.map((s) => (
                                <MenuItem key={s.id} value={String(s.id)}>
                                  {s.name}
                                </MenuItem>
                              ))}
                            {previewScope === "ZONE" &&
                              zones.map((z) => (
                                <MenuItem key={z.id} value={String(z.id)}>
                                  {z.name}{" "}
                                  {z.scheme?.name && `(${z.scheme.name})`}
                                </MenuItem>
                              ))}
                            {previewScope === "ROUTE" &&
                              routes.map((r) => (
                                <MenuItem key={r.id} value={String(r.id)}>
                                  {r.name} {r.zone?.name && `(${r.zone.name})`}
                                </MenuItem>
                              ))}
                          </Select>
                        </FormControl>

                        {/* Min Balance Filter */}
                        <TextField
                          size="small"
                          type="number"
                          label="Min. Balance"
                          placeholder="e.g. 1000"
                          value={minBalance}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "" || Number(val) >= 0) {
                              setMinBalance(val);
                            }
                          }}
                          sx={{ maxWidth: 140 }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                KES
                              </InputAdornment>
                            ),
                          }}
                          helperText="≥ this amount"
                          variant="outlined"
                        />

                        <TextField
                          size="small"
                          type="number"
                          label="Unpaid Months"
                          placeholder="e.g. 2"
                          value={minUnpaidMonths}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "" || Number(val) >= 1) {
                              setMinUnpaidMonths(val);
                            }
                          }}
                          sx={{ maxWidth: 140 }}
                          helperText="≥ number of months unpaid"
                          variant="outlined"
                        />

                        <Box sx={{ display: "flex", gap: 1.5 }}>
                          <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            startIcon={
                              previewLoading ? (
                                <CircularProgress size={20} color="inherit" />
                              ) : (
                                <Visibility />
                              )
                            }
                            onClick={handleOpenDisconnectionPreview}
                            disabled={previewLoading || !previewScopeId}
                          >
                            Preview
                          </Button>

                          <Button
                            variant="outlined"
                            color="theme.palette.primary.contrastText"
                            size="small"
                            startIcon={<GetApp />}
                            onClick={handleDownloadDueForDisconnection}
                            disabled={!previewScopeId}
                          >
                            Download PDF
                          </Button>
                        </Box>
                      </>
                    )}
                  </Box>
                </Box>
              </Collapse>

              {/* Filters Collapse */}
              <Collapse in={filterOpen}>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: "background.paper",
                    borderRadius: 1,
                    boxShadow: 1,
                  }}
                >
                  <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                    <FormControl sx={{ minWidth: 160 }}>
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={statusFilter}
                        label="Status"
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        <MenuItem value="">All</MenuItem>
                        {statusOptions.map((s) => (
                          <MenuItem key={s} value={s}>
                            {s}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl sx={{ minWidth: 180 }}>
                      <InputLabel>Scheme</InputLabel>
                      <Select
                        value={schemeFilter}
                        label="Scheme"
                        onChange={(e) => setSchemeFilter(e.target.value)}
                      >
                        <MenuItem value="">All</MenuItem>
                        {schemes.map((s) => (
                          <MenuItem key={s.id} value={s.id}>
                            {s.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl
                      sx={{ minWidth: 180 }}
                      disabled={!schemeFilter}
                    >
                      <InputLabel>Zone</InputLabel>
                      <Select
                        value={zoneFilter}
                        label="Zone"
                        onChange={(e) => setZoneFilter(e.target.value)}
                      >
                        <MenuItem value="">All</MenuItem>
                        {zones
                          .filter(
                            (z) =>
                              !schemeFilter ||
                              z.schemeId === Number(schemeFilter),
                          )
                          .map((z) => (
                            <MenuItem key={z.id} value={z.id}>
                              {z.name}
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                  </Box>
                </Box>
              </Collapse>
            </Box>

            {/* Data Grid */}
            <Box
              sx={{
                flex: 1,
                overflow: "hidden",
                borderRadius: 1,
                boxShadow: 1,
              }}
            >
              {loading ? (
                <Box
                  sx={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CircularProgress />
                </Box>
              ) : (
                <DataGrid
                  rows={connections}
                  columns={columns}
                  getRowId={(row) => row.id}
                  pageSizeOptions={[10, 25, 50, 100]}
                  paginationModel={{ page, pageSize: rowsPerPage }}
                  onPaginationModelChange={({ page: p, pageSize: ps }) => {
                    setPage(p);
                    setRowsPerPage(ps);
                  }}
                  rowCount={total}
                  paginationMode="server"
                  disableRowSelectionOnClick
                  sx={{
                    height: "100%",
                    border: "none",
                    "& .MuiDataGrid-columnHeaders": {
                      bgcolor: "background.default",
                      fontWeight: 600,
                    },
                  }}
                  localeText={{ noRowsLabel: "No connections found" }}
                />
              )}
            </Box>

            {/* Dialogs */}
            <Dialog
              open={modalOpen}
              onClose={resetModal}
              fullWidth
              maxWidth="sm"
            >
              <DialogTitle>New Connection</DialogTitle>
              <DialogContent>
                {/* Your connection creation form fields go here */}
              </DialogContent>
              <DialogActions>
                <Button onClick={resetModal} disabled={loading}>
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={handleCreateConnection}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={20} /> : "Create"}
                </Button>
              </DialogActions>
            </Dialog>

            <Dialog
              open={assignMeterOpen}
              onClose={resetAssignModal}
              fullWidth
              maxWidth="sm"
            >
              <DialogTitle>Assign Meter to Connection</DialogTitle>
              <DialogContent
                sx={{ pt: 3, display: "flex", flexDirection: "column", gap: 2 }}
              >
                {selectedConnection && (
                  <>
                    <TextField
                      fullWidth
                      label="Connection Number"
                      value={selectedConnection.connectionNumber || ""}
                      disabled
                    />
                    <TextField
                      fullWidth
                      label="Customer"
                      value={selectedConnection.customerName || ""}
                      disabled
                    />

                    {/* Warning if connection already has a meter */}
                    {selectedConnection.meterId && (
                      <Alert severity="warning">
                        ⚠️ This connection already has a meter:{" "}
                        <strong>{selectedConnection.meterSerialNumber}</strong>
                      </Alert>
                    )}
                  </>
                )}

                <FormControl fullWidth disabled={loading}>
                  <InputLabel>Select Meter</InputLabel>
                  <Select
                    value={selectedMeterId}
                    onChange={(e) => setSelectedMeterId(e.target.value)}
                    label="Select Meter"
                  >
                    <MenuItem value="">-- Choose a meter --</MenuItem>
                    {meters
                      .filter((m) => m.status === "AVAILABLE")
                      .map((m) => (
                        <MenuItem key={m.id} value={m.id}>
                          {m.serialNumber} ({m.model})
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>

                {!meters.some((m) => m.status === "AVAILABLE") && (
                  <Typography color="warning.main" variant="caption">
                    ⚠️ No available meters. Please add a new meter first.
                  </Typography>
                )}
              </DialogContent>

              <DialogActions>
                <Button onClick={resetAssignModal} disabled={loading}>
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={handleAssignMeter}
                  disabled={loading || !selectedMeterId}
                >
                  {loading ? <CircularProgress size={20} /> : "Assign Meter"}
                </Button>
              </DialogActions>
            </Dialog>

            <Dialog
              open={taskDialogOpen}
              onClose={() => setTaskDialogOpen(false)}
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

            <Dialog
              open={detailsDialogOpen}
              onClose={() => setDetailsDialogOpen(false)}
              fullWidth
              maxWidth="md"
            >
              <DialogTitle>
                Connection Details – #
                {selectedConnection?.connectionNumber || "—"}
              </DialogTitle>

              <DialogContent dividers>
                {selectedConnection ? (
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 2.5,
                      py: 1,
                    }}
                  >
                    {/* Customer section */}
                    <Box>
                      <Typography
                        variant="subtitle2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Customer
                      </Typography>
                      <Typography variant="body1">
                        <strong>Name:</strong>{" "}
                        {selectedConnection.customerName || "—"}
                      </Typography>
                      <Typography>
                        <strong>Phone:</strong>{" "}
                        {selectedConnection.customerPhoneNumber || "—"}
                      </Typography>
                      <Typography>
                        <strong>Email:</strong>{" "}
                        {selectedConnection.customerEmail || "—"}
                      </Typography>
                      <Typography>
                        <strong>Account #:</strong>{" "}
                        {selectedConnection.customerAccount || "—"}
                      </Typography>
                    </Box>

                    {/* Connection / Meter section */}
                    <Box>
                      <Typography
                        variant="subtitle2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Connection & Meter
                      </Typography>
                      <Typography>
                        <strong>Status:</strong> {selectedConnection.status}
                      </Typography>
                      <Typography>
                        <strong>Meter Serial:</strong>{" "}
                        {selectedConnection.meterSerialNumber || "Not assigned"}
                      </Typography>
                      <Typography>
                        <strong>Meter Model:</strong>{" "}
                        {selectedConnection.meterModel || "—"}
                      </Typography>
                      <Typography>
                        <strong>Plot Number:</strong>{" "}
                        {selectedConnection.plotNumber || "—"}
                      </Typography>
                    </Box>

                    {/* Location section */}
                    <Box>
                      <Typography
                        variant="subtitle2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Location
                      </Typography>
                      <Typography>
                        <strong>Scheme:</strong>{" "}
                        {selectedConnection.schemeName || "—"}
                      </Typography>
                      <Typography>
                        <strong>Zone:</strong>{" "}
                        {selectedConnection.zoneName || "—"}
                      </Typography>
                      <Typography>
                        <strong>Route:</strong>{" "}
                        {selectedConnection.routeName || "—"}
                      </Typography>
                    </Box>

                    {/* Tariff & Financials */}
                    <Box>
                      <Typography
                        variant="subtitle2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Tariff & Balance
                      </Typography>
                      <Typography>
                        <strong>Tariff Category:</strong>{" "}
                        {selectedConnection.tariffCategoryName || "—"}
                      </Typography>
                      <Typography
                        color={
                          selectedConnection.customerAccountBalance < 0
                            ? "error"
                            : "inherit"
                        }
                      >
                        <strong>Account Balance:</strong> KES{" "}
                        {selectedConnection.customerAccountBalance?.toLocaleString() ||
                          "0"}
                      </Typography>
                      <Typography>
                        <strong>Deposit:</strong> KES{" "}
                        {selectedConnection.customerAccountDeposit?.toLocaleString() ||
                          "0"}
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Typography color="text.secondary">
                    No connection selected
                  </Typography>
                )}
              </DialogContent>

              <DialogActions>
                <Button onClick={() => setDetailsDialogOpen(false)}>
                  Close
                </Button>
                {/* Optional: Add Edit / Assign meter / Create task buttons here later */}
              </DialogActions>
            </Dialog>

            <Dialog
              open={disconnectionDialogOpen}
              onClose={() => setDisconnectionDialogOpen(false)}
              fullWidth
              maxWidth="md"
              scroll="paper"
            >
              <DialogTitle>Create Disconnection Task</DialogTitle>
              <DialogContent dividers>
                <CreateDisconnectionTaskPage
                  onTaskCreated={handleDisconnectionTaskCreated}
                  onCancel={() => setDisconnectionDialogOpen(false)}
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setDisconnectionDialogOpen(false)}>
                  Close
                </Button>
              </DialogActions>
            </Dialog>

            {/* Edit Connection Modal */}
            <Dialog
              open={editModalOpen}
              onClose={resetEditModal}
              fullWidth
              maxWidth="sm"
            >
              <DialogTitle>Edit Connection</DialogTitle>
              <DialogContent
                sx={{ pt: 3, display: "flex", flexDirection: "column", gap: 2 }}
              >
                <TextField
                  fullWidth
                  label="Connection Number"
                  value={editConnectionNumber}
                  onChange={(e) => setEditConnectionNumber(e.target.value)}
                  type="number"
                  disabled={editSubmitting}
                />

                <FormControl fullWidth disabled={editSubmitting}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    label="Status"
                  >
                    <MenuItem value="ACTIVE">Active</MenuItem>
                    <MenuItem value="PENDING_METER">Pending Meter</MenuItem>
                    <MenuItem value="DISCONNECTED">Disconnected</MenuItem>
                    <MenuItem value="INACTIVE">Inactive</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth disabled={editSubmitting}>
                  <InputLabel>Scheme</InputLabel>
                  <Select
                    value={editSelectedSchemeId}
                    onChange={(e) => {
                      setEditSelectedSchemeId(e.target.value);
                      setEditSelectedZoneId("");
                      setEditSelectedRouteId("");
                    }}
                    label="Scheme"
                  >
                    <MenuItem value="">None</MenuItem>
                    {schemes.map((s) => (
                      <MenuItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {editSelectedSchemeId && (
                  <FormControl fullWidth disabled={editSubmitting}>
                    <InputLabel>Zone</InputLabel>
                    <Select
                      value={editSelectedZoneId}
                      onChange={(e) => {
                        setEditSelectedZoneId(e.target.value);
                        setEditSelectedRouteId("");
                      }}
                      label="Zone"
                    >
                      <MenuItem value="">None</MenuItem>
                      {schemes
                        .find((s) => String(s.id) === editSelectedSchemeId)
                        ?.zones?.map((z) => (
                          <MenuItem key={z.id} value={String(z.id)}>
                            {z.name}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                )}

                {editSelectedZoneId && (
                  <FormControl fullWidth disabled={editSubmitting}>
                    <InputLabel>Route</InputLabel>
                    <Select
                      value={editSelectedRouteId}
                      onChange={(e) => setEditSelectedRouteId(e.target.value)}
                      label="Route"
                    >
                      <MenuItem value="">None</MenuItem>
                      {schemes
                        .find((s) => String(s.id) === editSelectedSchemeId)
                        ?.zones?.find(
                          (z) => String(z.id) === editSelectedZoneId,
                        )
                        ?.routes?.map((r) => (
                          <MenuItem key={r.id} value={String(r.id)}>
                            {r.name}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                )}

                <FormControl fullWidth disabled={editSubmitting}>
                  <InputLabel>Tariff Category</InputLabel>
                  <Select
                    value={editSelectedTariffCategoryId}
                    onChange={(e) =>
                      setEditSelectedTariffCategoryId(e.target.value)
                    }
                    label="Tariff Category"
                  >
                    <MenuItem value="">None</MenuItem>
                    {tariffCategories.map((t) => (
                      <MenuItem key={t.id} value={String(t.id)}>
                        {t.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </DialogContent>

              <DialogActions>
                <Button onClick={resetEditModal} disabled={editSubmitting}>
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={handleEditConnection}
                  disabled={editSubmitting}
                >
                  {editSubmitting ? <CircularProgress size={20} /> : "Update"}
                </Button>
              </DialogActions>
            </Dialog>

            <DisconnectionPreviewDialog
              open={previewOpen}
              onClose={() => setPreviewOpen(false)}
              dueConnections={previewConnections}
              selectedIds={previewSelectedIds}
              onSelectionChange={setPreviewSelectedIds}
              onProceed={handleProceedToCreateDisconnection}
              loading={previewLoading}
            />
          </>
        )}
      </Box>
    </ErrorBoundary>
  );
};

export default ConnectionsScreen;
