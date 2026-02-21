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

const flattenSuspectedRecord = (record) => ({
  id: record.id,
  connectionNumber: record.connection?.connectionNumber || "-",
  customerName: record.customer?.customerName || "-",
  customerPhone: record.customer?.phoneNumber || "-",
  customerEmail: record.customer?.email || "-",
  meterSerialNumber: record.meter?.serialNumber || "-",
  disconnectionReading: record.disconnectionReading?.finalReading || null,
  reconnectionReading: record.meterReading?.currentReading || null,
  flaggedAt: record.flaggedAt,
  status: record.status || "PENDING",
  rawData: record,
});

const SuspectedSelfReconnectionsScreen = () => {
  const { currentUser } = useAuthStore();
  useThemeStore();

  const [records, setRecords] = useState([]);
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

  const [selectedRecordForDetails, setSelectedRecordForDetails] =
    useState(null);
  const [detailedRecordData, setDetailedRecordData] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Fetch detailed record
  const fetchDetailedRecord = useCallback(
    async (recordId) => {
      if (!currentUser || !recordId) {
        return;
      }

      setDetailsLoading(true);
      try {
        const response = await axios.get(
          `${BASEURL}/suspected-self-reconnections/${recordId}`,
          { withCredentials: true },
        );

        if (response.data?.data) {
          setDetailedRecordData(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching record details:", error);
        setSnackbar({
          open: true,
          message: "Failed to fetch record details",
          severity: "error",
        });
      } finally {
        setDetailsLoading(false);
      }
    },
    [currentUser],
  );

  // Fetch suspected self-reconnection records
  const fetchRecords = useCallback(
    async (searchQuery = "", pageNum = 0, limit = 25, filters = {}) => {
      if (!currentUser) {
        return;
      }
      setLoading(true);
      try {
        const res = await axios.get(`${BASEURL}/suspected-self-reconnections`, {
          params: {
            search: searchQuery || undefined,
            page: pageNum + 1,
            limit,
            status: filters.status || undefined,
            sortBy: "flaggedAt",
            sortOrder: "desc",
          },
          withCredentials: true,
        });

        if (res.data?.data) {
          const flattened = res.data.data.map((record) =>
            flattenSuspectedRecord(record),
          );
          setRecords(flattened);
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
              "Failed to fetch suspected records",
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
      await fetchRecords(search, page, rowsPerPage, {
        status: statusFilter,
      });
    };
    init();
  }, [search, page, rowsPerPage, statusFilter, fetchRecords]);

  const debouncedSearch = useMemo(
    () =>
      debounce((q) => {
        setPage(0);
        fetchRecords(q, 0, rowsPerPage, {
          status: statusFilter,
        });
      }, 500),
    [fetchRecords, rowsPerPage, statusFilter],
  );

  useEffect(() => {
    debouncedSearch(search);
    return () => debouncedSearch.cancel();
  }, [search, debouncedSearch]);

  const handleViewDetails = useCallback(
    (record) => {
      if (selectedRecordForDetails?.id === record.id) {
        setSelectedRecordForDetails(null);
        setDetailedRecordData(null);
      } else {
        setSelectedRecordForDetails(record);
        fetchDetailedRecord(record.id);
      }
    },
    [selectedRecordForDetails, fetchDetailedRecord],
  );

  const statusOptions = ["PENDING", "CONFIRMED", "RESOLVED", "DISMISSED"];

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
      {
        field: "status",
        headerName: "Status",
        width: 110,
        renderCell: (params) => (
          <Chip
            label={params.value}
            color={
              params.value === "CONFIRMED"
                ? "error"
                : params.value === "RESOLVED"
                  ? "success"
                  : params.value === "DISMISSED"
                    ? "warning"
                    : "default"
            }
            size="small"
          />
        ),
      },
      { field: "connectionNumber", headerName: "Conn #", width: 100 },
      { field: "customerName", headerName: "Customer", width: 160 },
      { field: "customerPhone", headerName: "Phone", width: 130 },
      { field: "meterSerialNumber", headerName: "Meter", width: 130 },
      {
        field: "disconnectionReading",
        headerName: "Disc. Reading",
        width: 130,
        renderCell: (params) => (
          <Typography variant="body2">{params.value || "-"}</Typography>
        ),
      },
      {
        field: "reconnectionReading",
        headerName: "Recon. Reading",
        width: 130,
        renderCell: (params) => (
          <Typography variant="body2" color="error" fontWeight={600}>
            {params.value || "-"}
          </Typography>
        ),
      },
      {
        field: "flaggedAt",
        headerName: "Flagged Date",
        width: 140,
        renderCell: (params) => (
          <Typography variant="body2">
            {new Date(params.value).toLocaleDateString()}
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
          Suspected Self-Reconnections
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
              fetchRecords(search, page, rowsPerPage, {
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
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Status"
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
            flex: selectedRecordForDetails ? "0 0 55%" : "1",
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
              rows={records}
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
        {selectedRecordForDetails && (
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
            ) : detailedRecordData ? (
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
                    {detailedRecordData.customer?.customerName}
                  </Typography>
                  <Chip
                    label={detailedRecordData.status || "PENDING"}
                    color={
                      detailedRecordData.status === "CONFIRMED"
                        ? "error"
                        : detailedRecordData.status === "RESOLVED"
                          ? "success"
                          : detailedRecordData.status === "DISMISSED"
                            ? "warning"
                            : "default"
                    }
                    size="small"
                  />
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
                    Connection
                  </Typography>
                  <Typography variant="body2">
                    <strong>Conn #:</strong>{" "}
                    {detailedRecordData.connection?.connectionNumber}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Status:</strong>{" "}
                    {detailedRecordData.connection?.status}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Scheme:</strong>{" "}
                    {detailedRecordData.connection?.scheme?.name}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Zone:</strong>{" "}
                    {detailedRecordData.connection?.zone?.name}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Route:</strong>{" "}
                    {detailedRecordData.connection?.route?.name}
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
                    {detailedRecordData.customer?.customerName}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Phone:</strong>{" "}
                    {detailedRecordData.customer?.phoneNumber}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Email:</strong> {detailedRecordData.customer?.email}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Account #:</strong>{" "}
                    {detailedRecordData.customer?.accountNumber}
                  </Typography>
                </Box>

                <Divider />

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
                    {detailedRecordData.meter?.serialNumber}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Model:</strong> {detailedRecordData.meter?.model}
                  </Typography>
                </Box>

                <Divider />

                {/* Disconnection Reading */}
                {detailedRecordData.disconnectionReading && (
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
                        {detailedRecordData.disconnectionReading.finalReading}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Date:</strong>{" "}
                        {new Date(
                          detailedRecordData.disconnectionReading
                            .disconnectionDate,
                        ).toLocaleDateString()}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Recorded By:</strong>{" "}
                        {detailedRecordData.disconnectionReading.recordedBy ||
                          "-"}
                      </Typography>
                      {detailedRecordData.disconnectionReading.notes && (
                        <Typography variant="body2">
                          <strong>Notes:</strong>{" "}
                          {detailedRecordData.disconnectionReading.notes}
                        </Typography>
                      )}
                    </Box>
                    <Divider />
                  </>
                )}

                {/* Reconnection Reading */}
                {detailedRecordData.meterReading && (
                  <>
                    <Box>
                      <Typography
                        variant="subtitle2"
                        color="text.secondary"
                        fontWeight={600}
                        gutterBottom
                      >
                        Reconnection Reading
                      </Typography>
                      <Typography
                        variant="body2"
                        color="error"
                        fontWeight={600}
                      >
                        <strong>Reading:</strong>{" "}
                        {detailedRecordData.meterReading.currentReading}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Date:</strong>{" "}
                        {new Date(
                          detailedRecordData.meterReading.createdAt,
                        ).toLocaleDateString()}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Consumption:</strong>{" "}
                        {detailedRecordData.meterReading.consumption || "-"}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Recorded By:</strong>{" "}
                        {detailedRecordData.meterReading.recordedBy || "-"}
                      </Typography>
                      {detailedRecordData.meterReading.notes && (
                        <Typography variant="body2">
                          <strong>Notes:</strong>{" "}
                          {detailedRecordData.meterReading.notes}
                        </Typography>
                      )}
                    </Box>
                    <Divider />
                  </>
                )}

                {/* Flagged Info */}
                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    fontWeight={600}
                    gutterBottom
                  >
                    Flagged Information
                  </Typography>
                  <Typography variant="body2">
                    <strong>Flagged At:</strong>{" "}
                    {new Date(
                      detailedRecordData.flaggedAt,
                    ).toLocaleDateString()}
                  </Typography>
                </Box>
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
    </Box>
  );
};

export default SuspectedSelfReconnectionsScreen;
