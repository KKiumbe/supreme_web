import React, { useState, useEffect, useMemo, useCallback, Component } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Grid,
  IconButton,
  Tooltip,
  CircularProgress,
  Button,
} from "@mui/material";
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import axios from "axios";
import { useAuthStore } from "../../store/authStore";
import AddOrEditMeterModal from "../../components/meters/createUpdate";
import debounce from "lodash/debounce";

// Error Boundary Component
import PropTypes from "prop-types";
class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Typography color="error" sx={{ p: 2 }}>
          Failed to render table. Please refresh or contact support.
        </Typography>
      );
    }
    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node,
};

const MeterScreen = () => {
  const { currentUser } = useAuthStore();
  const BASEURL = import.meta.env.VITE_BASE_URL || "";

  // State
  const [meters, setMeters] = useState([]);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMeter, setSelectedMeter] = useState(null);

  // Format date for EAT (UTC+3)
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-KE", {
      timeZone: "Africa/Nairobi",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Fetch meters from API
  const fetchMeters = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${BASEURL}/meters`, {
        params: { page: page + 1, limit, search: search || undefined },
        withCredentials: true,
      });
      const validMeters = (res.data.data?.meters ?? []).filter(
        (meter) => meter && typeof meter === "object" && meter.id && meter.serialNumber
      );
      console.log("Fetched meters:", validMeters); // Debug log
      setMeters(validMeters);
      setTotal(res.data.data?.pagination?.total ?? 0);
    } catch (err) {
      console.error("Failed to fetch meters:", err);
      setError(err.response?.data?.message || "Failed to load meters.");
      setMeters([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, BASEURL, currentUser]);

  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce((value) => {
      setSearch(value);
      setPage(0);
    }, 500),
    []
  );

  // Handle search input change
  const handleSearchChange = (e) => {
    debouncedSearch(e.target.value);
  };

  // Initial fetch
  useEffect(() => {
    fetchMeters();
  }, [fetchMeters]);

  // DataGrid Columns
  const columns = useMemo(
    () => [
      {
        field: "actions",
        headerName: "Actions",
        width: 100,
        renderCell: (params) => (
          <Tooltip title="Edit Meter">
            <IconButton
              color='theme.palette.primary.contrastText'
              onClick={() => {
                setSelectedMeter(params.row);
                setModalOpen(true);
              }}
              disabled={!params.row}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ),
      },
      {
        field: "serialNumber",
        headerName: "Serial #",
        width: 150,
        //valueGetter: (params) => (params.row ? params.row.serialNumber || "-" : "-"),
      },
      {
        field: "model",
        headerName: "Model",
        width: 120,
        //valueGetter: (params) => (params.row ? params.row.model || "-" : "-"),
      },
       {
        field: "status",
        headerName: "Status",
        width: 150,
        //valueGetter: (params) => (params.row ? params.row.status || "-" : "-"),
      },
      {
        field: "meterSize",
        headerName: "Size",
        width: 100,
        //valueGetter: (params) => (params.row ? params.row.meterSize || "-" : "-"),
      },
      {
        field: "installationDate",
        headerName: "Installed",
        width: 120,
       // valueGetter: (params) => (params.row ? formatDate(params?.row?.installationDate) : "-"),
      },
      {
        field: "lastInspectedAt",
        headerName: "Last Inspected",
        width: 130,
        valueGetter: (params) => (params?.row ? formatDate(params?.row?.lastInspectedAt) : "-"),
      },
      {
        field: "createdAt",
        headerName: "Created",
        width: 130,
        valueGetter: (params) => (params?.row ? formatDate(params?.row?.createdAt) : "-"),
      },
     
      {
        field: "connection",
        headerName: "Connection",
        width: 160,
        valueGetter: (params) =>
          params?.row && params?.row?.connection?.connectionNumber
            ? `#${params?.row?.connection?.connectionNumber}`
            : "-",
      },
      {
        field: "customer",
        headerName: "Customer",
        width: 180,
        valueGetter: (params) =>
          params?.row && params?.row?.connection?.customer?.customerName || "-",
      },
      
    ],
    []
  );

  if (!currentUser) return null;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight="bold" mb={2}>
        Meter Management
      </Typography>

      {/* Search & Actions */}
      <Grid container spacing={2} alignItems="center" mb={2}>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search by Serial Number..."
            onChange={handleSearchChange}
            variant="outlined"
          />
        </Grid>
        <Grid item>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchMeters}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setSelectedMeter(null);
              setModalOpen(true);
            }}
          >
            Add Meter
          </Button>
        </Grid>
      </Grid>

      {/* Error Message */}
      {error && (
        <Typography color="error" mb={2}>
          {error}
        </Typography>
      )}

      {/* Meters Table */}
      <Paper sx={{ height: 520, width: "100%" }}>
        <ErrorBoundary>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
              <CircularProgress />
            </Box>
          ) : (
            <DataGrid
              rows={meters}
              columns={columns}
              getRowId={(row) => row.id || `fallback-${Math.random()}`}
              pageSizeOptions={[10, 20, 50]}
              paginationModel={{ page, pageSize: limit }}
              onPaginationModelChange={(model) => {
                setPage(model.page);
                setLimit(model.pageSize);
              }}
              rowCount={total}
              paginationMode="server"
              disableRowSelectionOnClick
              localeText={{ noRowsLabel: "No meters found" }}
            />
          )}
        </ErrorBoundary>
      </Paper>

      {/* Modal (Create / Update) */}
      <AddOrEditMeterModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={fetchMeters}
        meter={selectedMeter}
      />
    </Box>
  );
};

export default MeterScreen;