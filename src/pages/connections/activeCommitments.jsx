import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Box,
  CircularProgress,
  IconButton,
  Typography,
  TextField,
  InputAdornment,
  Snackbar,
  Alert,
  Tooltip,
  Chip,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from "@mui/material";
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList,
  Visibility,
  Refresh,
} from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import { useAuthStore } from "../../store/authStore";
import { useThemeStore } from "../../store/theme";
import axios from "axios";
import { debounce } from "lodash";
import {
  PermissionDeniedUI,
  isPermissionDenied,
} from "../../utils/permissionHelper";

const BASEURL = import.meta.env.VITE_BASE_URL || "http://localhost:3000/api";

const flattenConnectionWithCommitment = (conn) => ({
  id: conn.id,
  connectionNumber: conn.connectionNumber,
  status: conn.status,
  customerName: conn.customer?.customerName || "-",
  customerPhone: conn.customer?.phoneNumber || "-",
  scheme: conn.location?.scheme?.name || "-",
  zone: conn.location?.zone?.name || "-",
  route: conn.location?.route?.name || "-",
  meterNumber: conn.meter?.serialNumber || "-",
  tariff: conn.tariffCategory?.name || "-",
  commitmentActive: conn.commitment?.commitmentActive || false,
  commitmentAmount: conn.commitment?.commitmentAmount || 0,
  commitmentStartDate: conn.commitment?.commitmentStartDate || null,
  commitmentLastPaidAt: conn.commitment?.commitmentLastPaidAt || null,
  accountBalance: conn.commitment?.accountBalance || 0,
  accountStatus: conn.commitment?.accountStatus || "-",
  rawData: conn,
});

const ActiveCommitmentConnectionsTab = () => {
  const { currentUser } = useAuthStore();
  useThemeStore();

  const [connections, setConnections] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

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

  const [selectedConnectionForDetails, setSelectedConnectionForDetails] =
    useState(null);
  const [detailedConnectionData, setDetailedConnectionData] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Fetch detailed connection
  const fetchDetailedConnection = useCallback(
    async (connectionNumber) => {
      if (!currentUser || !connectionNumber) {
        return;
      }

      setDetailsLoading(true);
      try {
        const response = await axios.get(
          `${BASEURL}/connection/${connectionNumber}`,
          { withCredentials: true },
        );

        if (response.data?.data) {
          setDetailedConnectionData(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching connection details:", error);
        setSnackbar({
          open: true,
          message: "Failed to fetch connection details",
          severity: "error",
        });
      } finally {
        setDetailsLoading(false);
      }
    },
    [currentUser],
  );

  // Fetch connections with active commitments
  const fetchConnections = useCallback(
    async (searchQuery = "", pageNum = 0, limit = 25, filters = {}) => {
      if (!currentUser) {
        return;
      }
      setLoading(true);
      try {
        const res = await axios.get(
          `${BASEURL}/get-connections-with-active-commitment`,
          {
            params: {
              search: searchQuery || undefined,
              page: pageNum + 1,
              limit,
              status: filters.status || undefined,
              sortBy: "connectionNumber",
              sortOrder: "asc",
            },
            withCredentials: true,
          },
        );

        if (res.data?.data) {
          const flattened = res.data.data.map((conn) =>
            flattenConnectionWithCommitment(conn),
          );
          setConnections(flattened);
          setTotal(res.data.pagination?.total || 0);
          setPermissionDenied(false);
        }
      } catch (error) {
        if (isPermissionDenied(error)) {
          setPermissionDenied(true);
        } else {
          console.warn("Fetch error:", error.response?.data || error.message);
          setSnackbar({
            open: true,
            message:
              error.response?.data?.message ||
              "Failed to fetch connections with active commitments",
            severity: "error",
          });
        }
      } finally {
        setLoading(false);
      }
    },
    [currentUser],
  );

  // Initialize
  useEffect(() => {
    const init = async () => {
      await fetchConnections(search, page, rowsPerPage, {
        status: statusFilter,
      });
    };
    init();
  }, [search, page, rowsPerPage, statusFilter, fetchConnections]);

  const debouncedSearch = useMemo(
    () =>
      debounce((q) => {
        setPage(0);
        fetchConnections(q, 0, rowsPerPage, {
          status: statusFilter,
        });
      }, 500),
    [fetchConnections, rowsPerPage, statusFilter],
  );

  useEffect(() => {
    debouncedSearch(search);
    return () => debouncedSearch.cancel();
  }, [search, debouncedSearch]);

  const handleViewDetails = useCallback(
    (connection) => {
      if (selectedConnectionForDetails?.id === connection.id) {
        setSelectedConnectionForDetails(null);
        setDetailedConnectionData(null);
      } else {
        setSelectedConnectionForDetails(connection);
        fetchDetailedConnection(connection.id);
      }
    },
    [selectedConnectionForDetails, fetchDetailedConnection],
  );

  const statusOptions = ["ACTIVE", "DISCONNECTED", "PENDING_METER"];

  const columns = useMemo(
    () => [
      {
        field: "actions",
        headerName: "Actions",
        width: 100,
        align: "center",
        renderCell: (params) => (
          <Box sx={{ display: "flex", gap: 0.5 }}>
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
          </Box>
        ),
      },
      {
        field: "status",
        headerName: "Status",
        width: 110,
        renderCell: (params) => (
          <Chip
            label={params.value}
            color={
              params.value === "ACTIVE"
                ? "success"
                : params.value === "PENDING_METER"
                  ? "warning"
                  : "error"
            }
            size="small"
          />
        ),
      },
      { field: "connectionNumber", headerName: "Conn #", width: 100 },
      { field: "customerName", headerName: "Customer", width: 160 },
      { field: "customerPhone", headerName: "Phone", width: 130 },
      { field: "scheme", headerName: "Scheme", width: 120 },

      { field: "meterNumber", headerName: "Meter", width: 130 },
      {
        field: "commitmentActive",
        headerName: "Commitment",
        width: 120,
        renderCell: (params) => (
          <Chip
            label={params.value ? "Active" : "Inactive"}
            color={params.value ? "success" : "default"}
            size="small"
          />
        ),
      },
      {
        field: "commitmentAmount",
        headerName: "Commitment Amt",
        width: 140,
        renderCell: (params) => (
          <Typography variant="body2" fontWeight={600}>
            {parseFloat(params.value || 0).toLocaleString("en-KE", {
              style: "currency",
              currency: "KES",
            })}
          </Typography>
        ),
      },
      {
        field: "accountBalance",
        headerName: "Balance",
        width: 130,
        renderCell: (params) => (
          <Typography
            variant="body2"
            color={parseFloat(params.value) > 0 ? "error" : "success"}
            fontWeight={600}
          >
            {parseFloat(params.value || 0).toLocaleString("en-KE", {
              style: "currency",
              currency: "KES",
            })}
          </Typography>
        ),
      },
    ],
    [handleViewDetails],
  );

  if (permissionDenied) {
    return <PermissionDeniedUI />;
  }

  return (
    <Box
      sx={{
        height: "calc(100vh - 48px)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h5" fontWeight={600}>
          Connections with Active Commitments
        </Typography>
      </Box>

      {/* Search & Filter Bar */}
      <Box
        sx={{
          p: { xs: 1.5, sm: 2 },
          display: "flex",
          gap: 1,
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        {/* Search Field */}
        <TextField
          size="small"
          placeholder="Search by connection #, customer, phone, meter..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: search && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => setSearch("")}
                  edge="end"
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{ flex: "1 1 250px" }}
        />

        {/* Filter Toggle */}
        <Button
          startIcon={<FilterList />}
          onClick={() => setFilterOpen(!filterOpen)}
          variant={filterOpen ? "contained" : "outlined"}
          size="small"
        >
          Filter
        </Button>

        {/* Refresh */}
        <Tooltip title="Refresh">
          <IconButton
            size="small"
            onClick={() =>
              fetchConnections(search, page, rowsPerPage, {
                status: statusFilter,
              })
            }
            disabled={loading}
          >
            <Refresh fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Filter Panel */}
      <Collapse in={filterOpen} sx={{ borderBottom: "1px solid #ddd" }}>
        <Box
          sx={{
            p: 2,
            bgcolor: "background.paper",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 2,
          }}
        >
          <FormControl size="small">
            <InputLabel>Connection Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Connection Status"
            >
              <MenuItem value="">All Status</MenuItem>
              {statusOptions.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Collapse>

      {/* DataGrid & Details Panel Container */}
      <Box
        sx={{
          display: "flex",
          gap: 1.5,
          flex: 1,
          overflow: "hidden",
          p: { xs: 1.5, sm: 2 },
        }}
      >
        {/* DataGrid */}
        <Box
          sx={{
            flex: selectedConnectionForDetails ? "0 0 55%" : "1",
            bgcolor: "background.paper",
            borderRadius: 1,
            overflow: "hidden",
            transition: "flex 0.3s ease",
            boxShadow: 1,
          }}
        >
          {loading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
              }}
            >
              <CircularProgress />
            </Box>
          ) : (
            <DataGrid
              rows={connections}
              columns={columns}
              pagination
              paginationModel={{ pageSize: rowsPerPage, page }}
              onPaginationModelChange={(newModel) => {
                setPage(newModel.page);
                setRowsPerPage(newModel.pageSize);
              }}
              rowCount={total}
              paginationMode="server"
              loading={loading}
              onRowClick={(params) => handleViewDetails(params.row)}
              sx={{
                "& .MuiDataGrid-row": {
                  cursor: "pointer",
                  "&:hover": { bgcolor: "action.hover" },
                },
              }}
            />
          )}
        </Box>

        {/* Details Panel */}
        {selectedConnectionForDetails && (
          <Box
            sx={{
              flex: "0 0 45%",
              bgcolor: "background.paper",
              borderRadius: 1,
              overflow: "auto",
              transition: "flex 0.3s ease",
              boxShadow: 1,
              p: 2,
            }}
          >
            {detailsLoading ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                }}
              >
                <CircularProgress />
              </Box>
            ) : detailedConnectionData ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {/* Header */}
                <Typography variant="h6" fontWeight={600}>
                  {detailedConnectionData.customer?.customerName}
                </Typography>

                {/* Connection Info */}
                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    fontWeight={600}
                    gutterBottom
                  >
                    Connection Details
                  </Typography>
                  <Typography variant="body2">
                    <strong>Conn #:</strong>{" "}
                    {selectedConnectionForDetails.connectionNumber}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Status:</strong>{" "}
                    {selectedConnectionForDetails.status}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Tariff:</strong>{" "}
                    {selectedConnectionForDetails.tariff}
                  </Typography>
                </Box>

                {/* Location Info */}
                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    fontWeight={600}
                    gutterBottom
                  >
                    Location
                  </Typography>
                  <Typography variant="body2">
                    <strong>Scheme:</strong>{" "}
                    {selectedConnectionForDetails.scheme}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Zone:</strong> {selectedConnectionForDetails.zone}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Route:</strong> {selectedConnectionForDetails.route}
                  </Typography>
                </Box>

                {/* Meter Info */}
                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    fontWeight={600}
                    gutterBottom
                  >
                    Meter
                  </Typography>
                  <Typography variant="body2">
                    <strong>Serial:</strong>{" "}
                    {selectedConnectionForDetails.meterNumber}
                  </Typography>
                </Box>

                {/* Commitment Info */}
                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    fontWeight={600}
                    gutterBottom
                  >
                    Payment Plan / Commitment
                  </Typography>
                  <Chip
                    label={
                      selectedConnectionForDetails.commitmentActive
                        ? "Active"
                        : "Inactive"
                    }
                    color={
                      selectedConnectionForDetails.commitmentActive
                        ? "success"
                        : "default"
                    }
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="body2">
                    <strong>Commitment Amount:</strong>{" "}
                    {parseFloat(
                      selectedConnectionForDetails.commitmentAmount || 0,
                    ).toLocaleString("en-KE", {
                      style: "currency",
                      currency: "KES",
                    })}
                  </Typography>
                  {selectedConnectionForDetails.commitmentStartDate && (
                    <Typography variant="body2">
                      <strong>Started:</strong>{" "}
                      {new Date(
                        selectedConnectionForDetails.commitmentStartDate,
                      ).toLocaleDateString()}
                    </Typography>
                  )}
                  {selectedConnectionForDetails.commitmentLastPaidAt && (
                    <Typography variant="body2">
                      <strong>Last Paid:</strong>{" "}
                      {new Date(
                        selectedConnectionForDetails.commitmentLastPaidAt,
                      ).toLocaleDateString()}
                    </Typography>
                  )}
                </Box>

                {/* Account Info */}
                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    fontWeight={600}
                    gutterBottom
                  >
                    Account Status
                  </Typography>
                  <Typography variant="body2">
                    <strong>Status:</strong>{" "}
                    {selectedConnectionForDetails.accountStatus}
                  </Typography>
                  <Typography
                    variant="body2"
                    color={
                      parseFloat(selectedConnectionForDetails.accountBalance) >
                      0
                        ? "error"
                        : "success"
                    }
                    fontWeight={600}
                  >
                    <strong>Balance:</strong>{" "}
                    {parseFloat(
                      selectedConnectionForDetails.accountBalance || 0,
                    ).toLocaleString("en-KE", {
                      style: "currency",
                      currency: "KES",
                    })}
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Typography color="text.secondary">
                Failed to load connection details
              </Typography>
            )}
          </Box>
        )}
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default ActiveCommitmentConnectionsTab;
