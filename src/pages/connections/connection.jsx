import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Box,
  CircularProgress,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  Button,
} from "@mui/material";
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
import ActiveCommitmentConnectionsTab from "./activeCommitments";

// Refactored components
import ConnectionHeaderBar from "../../components/connections/ConnectionHeaderBar";
import ConnectionsDataGrid from "../../components/connections/ConnectionsDataGrid";
import ConnectionDetailsPanel from "../../components/connections/ConnectionDetailsPanel";
import ConnectionFilters from "../../components/connections/ConnectionFilters";
import DisconnectionSection from "../../components/connections/DisconnectionSection";
import CreateConnectionDialog from "../../components/connections/CreateConnectionDialog";
import EditConnectionDialog from "../../components/connections/EditConnectionDialog";
import AssignMeterDialog from "../../components/connections/AssignMeterDialog";

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
  const { darkMode } = useThemeStore();
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
  const [activeTab, setActiveTab] = useState(0);

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
  const [selectedConnectionForDetails, setSelectedConnectionForDetails] =
    useState(null);

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
    if (selectedConnectionForDetails?.id === connection.id) {
      setSelectedConnectionForDetails(null); // Toggle off if already selected
    } else {
      setSelectedConnectionForDetails(connection); // Show details for new connection
    }
  };

  const handleCloseConnectionDetails = () => {
    setSelectedConnectionForDetails(null);
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
      { field: "customerName", headerName: "Customer", width: 150 },
      { field: "customerPhoneNumber", headerName: "Phone", width: 120 },

      { field: "schemeName", headerName: "Scheme", width: 120 },
      { field: "zoneName", headerName: "Zone", width: 110 },

      { field: "tariffCategoryName", headerName: "Tariff", width: 140 },
      { field: "meterSerialNumber", headerName: "Meter", width: 120 },
    ],
    [],
  );

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Box
        sx={{
          height: "calc(100vh - 48px)",
          display: "flex",
          flexDirection: "column",
          p: { xs: 1, sm: 1.5, md: 1.5 },
          gap: 1.5,
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
            <ConnectionHeaderBar
              activeTab={activeTab}
              loading={loading}
              currentUser={currentUser}
              onDisconnectionClick={() => setDisconnectionDialogOpen(true)}
              onFilterClick={() => setFilterOpen(!filterOpen)}
              onExportClick={handleExport}
              onNewConnectionClick={() => setModalOpen(true)}
              filterOpen={filterOpen}
            />

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
              <Tabs
                value={activeTab}
                onChange={(e, newValue) => setActiveTab(newValue)}
                aria-label="connections tabs"
              >
                <Tab label="All Connections" />
                <Tab label="Active Commitments" />
              </Tabs>
            </Box>

            {/* Tab 0: All Connections */}
            {activeTab === 0 && (
              <>
                <ConnectionFilters
                  search={search}
                  onSearchChange={setSearch}
                  statusFilter={statusFilter}
                  onStatusFilterChange={setStatusFilter}
                  schemeFilter={schemeFilter}
                  onSchemeFilterChange={setSchemeFilter}
                  zoneFilter={zoneFilter}
                  onZoneFilterChange={setZoneFilter}
                  filterOpen={filterOpen}
                  onFilterToggle={() => setFilterOpen(!filterOpen)}
                  disconnectionSection={
                    <DisconnectionSection
                      previewScope={previewScope}
                      onPreviewScopeChange={setPreviewScope}
                      previewScopeId={previewScopeId}
                      onPreviewScopeIdChange={setPreviewScopeId}
                      minBalance={minBalance}
                      onMinBalanceChange={setMinBalance}
                      minUnpaidMonths={minUnpaidMonths}
                      onMinUnpaidMonthsChange={setMinUnpaidMonths}
                      schemes={schemes}
                      zones={zones}
                      routes={routes}
                      previewLoading={previewLoading}
                      onPreview={handleOpenDisconnectionPreview}
                      onDownload={handleDownloadDueForDisconnection}
                    />
                  }
                  schemes={schemes}
                  zones={zones}
                  statusOptions={statusOptions}
                />

                {/* Data Grid + Details Panel Container */}
                <Box
                  sx={{
                    display: "flex",
                    gap: 1.5,
                    flex: 1,
                    overflow: "hidden",
                    p: { xs: 1.5, sm: 2 },
                  }}
                >
                  <ConnectionsDataGrid
                    connections={connections}
                    loading={loading}
                    page={page}
                    pageSize={rowsPerPage}
                    rowsPerPage={rowsPerPage}
                    total={total}
                    onPageChange={setPage}
                    onPageSizeChange={setRowsPerPage}
                    onEditClick={handleOpenEditModal}
                    onAssignMeterClick={handleOpenAssignMeterModal}
                    onViewDetailsClick={handleViewDetails}
                  />

                  {/* Connection Details Panel */}
                  <Box
                    sx={{
                      flex: selectedConnectionForDetails ? "0 0 40%" : "0 0 0",
                      transition: "flex 0.3s ease",
                      overflow: "auto",
                      borderRadius: 1,
                      bgcolor: "background.paper",
                      boxShadow: 1,
                      display: selectedConnectionForDetails ? "block" : "none",
                      p: 2,
                    }}
                  >
                    <ConnectionDetailsPanel
                      connection={selectedConnectionForDetails}
                      onClose={handleCloseConnectionDetails}
                    />
                  </Box>
                </Box>
              </>
            )}

            {/* Tab 1: Active Commitments */}
            {activeTab === 1 && <ActiveCommitmentConnectionsTab />}

            {/* Dialogs */}
            <CreateConnectionDialog
              open={modalOpen}
              onClose={resetModal}
              connectionNumber={connectionNumber}
              onConnectionNumberChange={setConnectionNumber}
              selectedCustomerId={selectedCustomerId}
              onCustomerChange={setSelectedCustomerId}
              status={status}
              onStatusChange={setStatus}
              selectedSchemeId={selectedSchemeId}
              onSchemeChange={setSelectedSchemeId}
              selectedZoneId={selectedZoneId}
              onZoneChange={setSelectedZoneId}
              selectedRouteId={selectedRouteId}
              onRouteChange={setSelectedRouteId}
              selectedTariffCategoryId={selectedTariffCategoryId}
              onTariffChange={setSelectedTariffCategoryId}
              schemes={schemes}
              zones={zones}
              routes={routes}
              tariffCategories={tariffCategories}
              loading={loading}
              onSubmit={handleCreateConnection}
              onReset={resetModal}
            />

            <AssignMeterDialog
              open={assignMeterOpen}
              onClose={resetAssignModal}
              connectionNumber={selectedConnection?.connectionNumber}
              customerName={selectedConnection?.customerName}
              selectedMeterId={selectedMeterId}
              onMeterChange={setSelectedMeterId}
              meters={meters}
              loading={loading}
              onSubmit={handleAssignMeter}
              onReset={resetAssignModal}
              meterId={selectedConnection?.meterId}
              meterSerialNumber={selectedConnection?.meterSerialNumber}
            />

            {/* Edit Connection Modal */}
            <EditConnectionDialog
              open={editModalOpen}
              onClose={resetEditModal}
              connectionNumber={editConnectionNumber}
              onConnectionNumberChange={setEditConnectionNumber}
              status={editStatus}
              onStatusChange={setEditStatus}
              selectedSchemeId={editSelectedSchemeId}
              onSchemeChange={setEditSelectedSchemeId}
              selectedZoneId={editSelectedZoneId}
              onZoneChange={setEditSelectedZoneId}
              selectedRouteId={editSelectedRouteId}
              onRouteChange={setEditSelectedRouteId}
              selectedTariffCategoryId={editSelectedTariffCategoryId}
              onTariffChange={setEditSelectedTariffCategoryId}
              schemes={schemes}
              zones={zones}
              routes={routes}
              tariffCategories={tariffCategories}
              loading={editSubmitting}
              onSubmit={handleEditConnection}
              onReset={resetEditModal}
            />

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
                theme={darkMode}
                taskTitle="Meter Installation Task"
                taskDescription={`Install meter for #${taskConnection?.connectionNumber}`}
              />
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
