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
import debounce from "lodash/debounce";
import PropTypes from "prop-types";

import { useAuthStore } from "../../store/authStore";
import AddOrEditMeterModal from "../../components/meters/createUpdate";

const BASEURL = import.meta.env.VITE_BASE_URL || "";

/* -----------------------------
   Error Boundary
----------------------------- */
class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Typography color="error" sx={{ p: 2 }}>
          Failed to render meters. Please refresh the page.
        </Typography>
      );
    }
    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node,
};

/* -----------------------------
   Screen
----------------------------- */
const MeterScreen = () => {
  const { currentUser } = useAuthStore();

  const [meters, setMeters] = useState([]);
  const [page, setPage] = useState(0); // DataGrid is 0-based
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMeter, setSelectedMeter] = useState(null);

  /* -----------------------------
     Date formatter (EAT)
  ----------------------------- */
  const formatDate = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("en-KE", {
      timeZone: "Africa/Nairobi",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  /* -----------------------------
     Fetch meters
  ----------------------------- */
  const fetchMeters = useCallback(async () => {
    if (!currentUser) return;

    setLoading(true);
    setError("");

    try {
      const res = await axios.get(`${BASEURL}/meters`, {
        params: {
          page: page + 1, // API is 1-based
          limit,
          ...(search ? { search } : {}),
        },
        withCredentials: true,
      });

      const payload = res.data?.data;

      setMeters(payload?.meters ?? []);
      setTotal(payload?.pagination?.total ?? 0);
    } catch (err) {
      console.error("Failed to fetch meters:", err);
      setError(err.response?.data?.message || "Failed to load meters.");
      setMeters([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [currentUser, page, limit, search]);

  /* -----------------------------
     Debounced search
  ----------------------------- */
  const debouncedSearch = useMemo(
    () =>
      debounce((value) => {
        setPage(0);
        setSearch(value);
      }, 500),
    []
  );

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    debouncedSearch(value.trim());
  };

  /* -----------------------------
     Initial + reactive fetch
  ----------------------------- */
  useEffect(() => {
    fetchMeters();
  }, [fetchMeters]);

  /* -----------------------------
     Columns
  ----------------------------- */
  const columns = useMemo(
    () => [
      {
        field: "actions",
        headerName: "Actions",
        width: 90,
        sortable: false,
        renderCell: (params) => (
          <Tooltip title="Edit Meter">
            <IconButton
              size="small"
              onClick={() => {
                setSelectedMeter(params.row);
                setModalOpen(true);
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ),
      },
      { field: "serialNumber", headerName: "Serial Number", width: 160 },
      { field: "model", headerName: "Model", width: 130 },
      { field: "status", headerName: "Status", width: 140 },
      { field: "meterSize", headerName: "Size", width: 100 },
      {
        field: "installationDate",
        headerName: "Installed",
        width: 130,
        
      },
      {
        field: "lastInspectedAt",
        headerName: "Last Inspected",
        width: 140,
       
      },
      {
        field: "createdAt",
        headerName: "Created",
        width: 130,
        
      },
      {
        field: "connection",
        headerName: "Connection",
        width: 150,
        valueGetter: (params) =>
          params.row?.connection?.connectionNumber
            ? `#${params.row.connection.connectionNumber}`
            : "-",
      },
      {
        field: "customer",
        headerName: "Customer",
        width: 200,
        
      },
    ],
    []
  );

  if (!currentUser) return null;

  /* -----------------------------
     Render
  ----------------------------- */
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight="bold" mb={2}>
        Meter Management
      </Typography>

      {/* Search & Actions */}
      <Grid container spacing={2} alignItems="center" mb={2}>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            size="small"
            value={searchInput}
            placeholder="Search by serial number or model"
            onChange={handleSearchChange}
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

      {error && (
        <Typography color="error" mb={2}>
          {error}
        </Typography>
      )}

      {/* Table */}
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
              getRowId={(row) => row.id}
              rowCount={total}
              paginationMode="server"
              paginationModel={{ page, pageSize: limit }}
              onPaginationModelChange={(model) => {
                setPage(model.page);
                setLimit(model.pageSize);
              }}
              pageSizeOptions={[10, 20, 50]}
              disableRowSelectionOnClick
              localeText={{ noRowsLabel: "No meters found" }}
            />
          )}
        </ErrorBoundary>
      </Paper>

      {/* Modal */}
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
