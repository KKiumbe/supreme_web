import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Typography,
  MenuItem,
  Snackbar,
  Alert,
  Tooltip,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  TextField,
  InputAdornment,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
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

const flattenDisconnectedConnection = (conn) => ({
  id: conn.id,
  connectionNumber: conn.connectionNumber,
  status: conn.status,
  customerName: conn.customer?.customerName || "-",
  customerPhone: conn.customer?.phoneNumber || "-",
  customerEmail: conn.customer?.email || "-",
  schemeName: conn.scheme?.name || "-",
  zoneName: conn.zone?.name || "-",
  routeName: conn.route?.name || "-",
  meterSerialNumber: conn.meter?.serialNumber || "-",
  lastReading: conn.meter?.lastReading?.currentReading || null,
  accountBalance: conn.account?.balance || 0,
  accountDeposit: conn.account?.deposit || 0,
  latitude: conn.latitude,
  longitude: conn.longitude,
  disconnectionReading: conn.disconnectionReading?.currentReading || null,
  rawData: conn,
});

const DisconnectedConnectionsScreen = () => {
  const { currentUser } = useAuthStore();
  const { darkMode } = useThemeStore();

  const [connections, setConnections] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [zones, setZones] = useState([]);

  const [search, setSearch] = useState("");
  const [schemeFilter, setSchemeFilter] = useState("");
  const [zoneFilter, setZoneFilter] = useState("");
  const [sortBy, setSortBy] = useState("connectionNumber");
  const [sortOrder, setSortOrder] = useState("ASC");

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
  const [reconnectConfirmOpen, setReconnectConfirmOpen] = useState(false);

  // Fetch detailed connection data
  const fetchDetailedConnection = useCallback(
    async (connectionId) => {
      if (!currentUser || !connectionId) {
        return;
      }

      setDetailsLoading(true);
      try {
        const response = await axios.get(
          `${BASEURL}/get-disconnected-connection/${connectionId}`,
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

  // Fetch disconnected connections
  const fetchDisconnectedConnections = useCallback(
    async (searchQuery = "", pageNum = 0, limit = 25, filters = {}) => {
      if (!currentUser) {
        return;
      }
      setLoading(true);
      try {
        const res = await axios.get(`${BASEURL}/get-disconnected-connections`, {
          params: {
            search: searchQuery || undefined,
            page: pageNum + 1,
            limit,
            schemeId: filters.schemeId || undefined,
            zoneId: filters.zoneId || undefined,
            sortBy: filters.sortBy || "connectionNumber",
            sortOrder: filters.sortOrder || "ASC",
          },
          withCredentials: true,
        });

        if (res.data?.data) {
          const flattened = res.data.data.map((conn) =>
            flattenDisconnectedConnection(conn),
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
              error.response?.data?.message || "Failed to fetch connections",
            severity: "error",
          });
        }
      } finally {
        setLoading(false);
      }
    },
    [currentUser],
  );

  // Fetch metadata (schemes, zones)
  const fetchMetaData = useCallback(async () => {
    try {
      const schemesRes = await axios.get(`${BASEURL}/schemes`, {
        withCredentials: true,
      });

      if (schemesRes.data?.data) {
        const schemesData = schemesRes.data.data || [];
        setSchemes(schemesData);
        setZones(schemesData.flatMap((s) => s.zones || []));
      }
    } catch (error) {
      console.error("Metadata fetch error:", error);
    }
  }, []);

  // Initialize
  useEffect(() => {
    const init = async () => {
      await Promise.all([
        fetchDisconnectedConnections(search, page, rowsPerPage, {
          schemeId: schemeFilter,
          zoneId: zoneFilter,
          sortBy,
          sortOrder,
        }),
        fetchMetaData(),
      ]);
    };
    init();
  }, [
    search,
    page,
    rowsPerPage,
    schemeFilter,
    zoneFilter,
    sortBy,
    sortOrder,
    fetchDisconnectedConnections,
    fetchMetaData,
  ]);

  const debouncedSearch = useMemo(
    () =>
      debounce((q) => {
        setPage(0);
        fetchDisconnectedConnections(q, 0, rowsPerPage, {
          schemeId: schemeFilter,
          zoneId: zoneFilter,
          sortBy,
          sortOrder,
        });
      }, 500),
    [
      fetchDisconnectedConnections,
      rowsPerPage,
      schemeFilter,
      zoneFilter,
      sortBy,
      sortOrder,
    ],
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

  const handleConfirmReconnect = useCallback(() => {
    setReconnectConfirmOpen(false);
    // TODO: Implement reconnection logic
    setSnackbar({
      open: true,
      message: "Reconnection feature coming soon",
      severity: "info",
    });
  }, []);

  const columns = useMemo(
    () => [
      {
        field: "actions",
        headerName: "Actions",
        width: 120,
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
      { field: "connectionNumber", headerName: "Conn #", width: 100 },
      { field: "customerName", headerName: "Customer", width: 160 },
      { field: "customerPhone", headerName: "Phone", width: 130 },
      { field: "schemeName", headerName: "Scheme", width: 120 },
      { field: "zoneName", headerName: "Zone", width: 110 },
      { field: "routeName", headerName: "Route", width: 100 },
      { field: "meterSerialNumber", headerName: "Meter", width: 120 },
      {
        field: "accountBalance",
        headerName: "Balance",
        width: 120,
        renderCell: (params) => (
          <Typography
            variant="body2"
            color={params.value < 0 ? "error" : "inherit"}
          >
            KES {params.value?.toLocaleString() || "0"}
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
        height: "100vh",
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
          Disconnected Connections
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
          placeholder="Search by connection #, name, phone..."
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
              fetchDisconnectedConnections(search, page, rowsPerPage, {
                schemeId: schemeFilter,
                zoneId: zoneFilter,
                sortBy,
                sortOrder,
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

            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 2,
          }}
        >
          <FormControl size="small">
            <InputLabel>Scheme</InputLabel>
            <Select
              value={schemeFilter}
              onChange={(e) => {
                setSchemeFilter(e.target.value);
                setZoneFilter("");
              }}
              label="Scheme"
            >
              <MenuItem value="">All Schemes</MenuItem>
              {schemes.map((scheme) => (
                <MenuItem key={scheme.id} value={scheme.id}>
                  {scheme.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small">
            <InputLabel>Zone</InputLabel>
            <Select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              label="Zone"
            >
              <MenuItem value="">All Zones</MenuItem>
              {zones.map((zone) => (
                <MenuItem key={zone.id} value={zone.id}>
                  {zone.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small">
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              label="Sort By"
            >
              <MenuItem value="connectionNumber">Connection #</MenuItem>
              <MenuItem value="customerName">Customer Name</MenuItem>
              <MenuItem value="createdAt">Created Date</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small">
            <InputLabel>Order</InputLabel>
            <Select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              label="Order"
            >
              <MenuItem value="ASC">Ascending</MenuItem>
              <MenuItem value="DESC">Descending</MenuItem>
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
            />
          )}
        </Box>

        {/* Details Panel */}
        {selectedConnectionForDetails && (
          <Box
            sx={{
              flex: "0 0 45%",

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
                {/* Header with Status */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="h6" fontWeight={600}>
                    {detailedConnectionData.summary?.customerName}
                  </Typography>
                  <Chip label="DISCONNECTED" color="error" size="small" />
                </Box>

                <Divider />

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
                    {detailedConnectionData.connectionNumber}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Status:</strong> {detailedConnectionData.status}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Created:</strong>{" "}
                    {new Date(
                      detailedConnectionData.createdAt,
                    ).toLocaleDateString()}
                  </Typography>
                </Box>

                <Divider />

                {/* Customer Info */}
                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    fontWeight={600}
                    gutterBottom
                  >
                    Customer
                  </Typography>
                  <Typography variant="body2">
                    <strong>Name:</strong>{" "}
                    {detailedConnectionData.customer?.customerName || "-"}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Phone:</strong>{" "}
                    {detailedConnectionData.customer?.phoneNumber || "-"}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Email:</strong>{" "}
                    {detailedConnectionData.customer?.email || "-"}
                  </Typography>
                </Box>

                <Divider />

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
                    {detailedConnectionData.location?.scheme?.name || "-"}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Zone:</strong>{" "}
                    {detailedConnectionData.location?.zone?.name || "-"}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Route:</strong>{" "}
                    {detailedConnectionData.location?.route?.name || "-"}
                  </Typography>
                </Box>

                <Divider />

                {/* Meter Info */}
                {detailedConnectionData.meter && (
                  <>
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
                        {detailedConnectionData.meter.serialNumber}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Model:</strong>{" "}
                        {detailedConnectionData.meter.model || "-"}
                      </Typography>
                      {detailedConnectionData.meter.readingHistory?.length >
                        0 && (
                        <Typography variant="body2">
                          <strong>Last Reading:</strong>{" "}
                          {detailedConnectionData.meter.readingHistory[0]
                            ?.currentReading || "-"}
                        </Typography>
                      )}
                    </Box>
                    <Divider />
                  </>
                )}

                {/* Account Info */}
                {detailedConnectionData.account && (
                  <>
                    <Box>
                      <Typography
                        variant="subtitle2"
                        color="text.secondary"
                        fontWeight={600}
                        gutterBottom
                      >
                        Account
                      </Typography>
                      <Typography
                        variant="body2"
                        color={
                          detailedConnectionData.account.balance < 0
                            ? "error"
                            : "inherit"
                        }
                      >
                        <strong>Balance:</strong> KES{" "}
                        {detailedConnectionData.account.balance?.toLocaleString() ||
                          "0"}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Status:</strong>{" "}
                        {detailedConnectionData.account.status}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Disconnection Reason:</strong>{" "}
                        {detailedConnectionData.account.disconnectionReason ||
                          "-"}
                      </Typography>
                    </Box>
                    <Divider />
                  </>
                )}

                {/* Unpaid Bills */}
                {detailedConnectionData.unpaidBills &&
                  detailedConnectionData.unpaidBills.count > 0 && (
                    <>
                      <Box>
                        <Typography
                          variant="subtitle2"
                          color="text.secondary"
                          fontWeight={600}
                          gutterBottom
                        >
                          Unpaid Bills
                        </Typography>
                        <Typography variant="body2">
                          <strong>Count:</strong>{" "}
                          {detailedConnectionData.unpaidBills.count}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="error"
                          fontWeight={600}
                        >
                          <strong>Outstanding:</strong> KES{" "}
                          {detailedConnectionData.unpaidBills.totalOutstanding?.toLocaleString() ||
                            "0"}
                        </Typography>
                      </Box>
                      <Divider />
                    </>
                  )}

                {/* Disconnection Details */}
                {detailedConnectionData.disconnectionDetails && (
                  <>
                    <Box>
                      <Typography
                        variant="subtitle2"
                        color="text.secondary"
                        fontWeight={600}
                        gutterBottom
                      >
                        Disconnection Reading
                      </Typography>
                      <Typography variant="body2">
                        <strong>Reading:</strong>{" "}
                        {detailedConnectionData.disconnectionDetails.primary
                          ?.currentReading || "-"}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Date:</strong>{" "}
                        {new Date(
                          detailedConnectionData.disconnectionDetails.primary
                            ?.disconnectionDate,
                        ).toLocaleDateString() || "-"}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Records:</strong>{" "}
                        {detailedConnectionData.disconnectionDetails.count}
                      </Typography>
                    </Box>
                    <Divider />
                  </>
                )}

                {/* Coordinates */}
                {detailedConnectionData.latitude &&
                  detailedConnectionData.longitude && (
                    <Box>
                      <Typography variant="body2">
                        <strong>Coordinates:</strong>{" "}
                        {detailedConnectionData.latitude.toFixed(4)},
                        {detailedConnectionData.longitude.toFixed(4)}
                      </Typography>
                      <Button
                        size="small"
                        href={`https://maps.google.com/?q=${detailedConnectionData.latitude},${detailedConnectionData.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open in Maps
                      </Button>
                    </Box>
                  )}
              </Box>
            ) : (
              <Typography color="text.secondary">
                Failed to load details
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

      {/* Reconnect Confirmation Dialog */}
      <Dialog
        open={reconnectConfirmOpen}
        onClose={() => setReconnectConfirmOpen(false)}
      >
        <DialogTitle>Confirm Reconnection</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to reconnect this connection? This action will
            restore service.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReconnectConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmReconnect} variant="contained">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DisconnectedConnectionsScreen;
