import React, { useState, useEffect, useCallback } from "react";
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
import { DataGrid } from "@mui/x-data-grid";
import { Add as AddIcon, Refresh as RefreshIcon } from "@mui/icons-material";
import axios from "axios";
import { useAuthStore } from "../../store/authStore";
import AddMeterModal from "./addMeter";


const MeterScreen = () => {
  const { currentUser } = useAuthStore();
  const BASEURL = import.meta.env.VITE_BASE_URL;

  // Table data & pagination
  const [meters, setMeters] = useState([]);
  const [page, setPage] = useState(0); // DataGrid pages are 0-based
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);

  // Fetch meters from API
  const fetchMeters = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const res = await axios.get(`${BASEURL}/meters`, {
        params: { page: page + 1, limit, search }, // API is 1-based
        withCredentials: true,
      });

      setMeters(res.data.data.meters ?? []);
      setTotal(res.data.data.pagination?.total ?? 0);
    } catch (err) {
      console.error(err);
      setMeters([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, BASEURL, currentUser]);

  useEffect(() => {
    fetchMeters();
  }, [fetchMeters]);

  if (!currentUser) return null;

  const columns = [
    { field: "serialNumber", headerName: "Serial #", width: 150 },
    { field: "model", headerName: "Model", width: 120 },
    { field: "installationDate", headerName: "Installed", width: 120 },
    { field: "lastInspectedAt", headerName: "Last Inspected", width: 130 },
    { field: "status", headerName: "Status", width: 100 },
    { field: "meterSize", headerName: "Size", width: 80 },
    {
      field: "connection",
      headerName: "Connection",
      width: 180,
      valueGetter: (params) => params.row.connection?.connectionNumber ?? "-",
    },
    {
      field: "customer",
      headerName: "Customer",
      width: 180,
      valueGetter: (params) => params.row.connection?.customer?.customerName ?? "-",
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight="bold" mb={2}>
        Meters
      </Typography>

      {/* Search + Actions */}
      <Grid container spacing={2} alignItems="center" mb={2}>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search meters..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
            onClick={() => setModalOpen(true)}
          >
            Add Meter
          </Button>
        </Grid>
      </Grid>

      {/* DataGrid */}
      <Paper sx={{ height: 500, width: "100%" }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <DataGrid
            rows={meters}
            columns={columns}
            getRowId={(row) => row.id}
            pageSizeOptions={[10, 20, 50]}
            paginationModel={{ page, pageSize: limit }}
            onPaginationModelChange={(model) => {
              setPage(model.page);
              setLimit(model.pageSize);
            }}
            rowCount={total}
            paginationMode="server"
          />
        )}
      </Paper>

      {/* Add Meter Modal */}
      <AddMeterModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={fetchMeters}
      />
    </Box>
  );
};

export default MeterScreen;
