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
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import axios from "axios";
import { useAuthStore } from "../../store/authStore";
import AddOrEditMeterModal from "../../components/meters/createUpdate";


const MeterScreen = () => {
  const { currentUser } = useAuthStore();
  const BASEURL = import.meta.env.VITE_BASE_URL;

  // Table state
  const [meters, setMeters] = useState([]);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMeter, setSelectedMeter] = useState(null);

  // ✅ Fetch meters from API
  const fetchMeters = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const res = await axios.get(`${BASEURL}/meters`, {
        params: { page: page + 1, limit, search },
        withCredentials: true,
      });

      setMeters(res.data.data.meters ?? []);
      setTotal(res.data.data.pagination?.total ?? 0);
    } catch (err) {
      console.error("Failed to fetch meters:", err);
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

  // ✅ DataGrid Columns
  const columns = [
     {
      field: "actions",
      headerName: "Actions",
      width: 90,
      renderCell: (params) => (
        <Tooltip title="Edit Meter">
          <IconButton
            color="primary"
            onClick={() => {
              setSelectedMeter(params.row); // prepopulate modal
              setModalOpen(true);
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
   
    { field: "serialNumber", headerName: "Serial #", width: 150 },
    { field: "model", headerName: "Model", width: 120 },
    {
      field: "installationDate",
      headerName: "Installed",
      width: 120,
      valueGetter: (params) =>
        params?.row?.installationDate
          ? new Date(params.row.installationDate).toLocaleDateString()
          : "-",
    },
    {
      field: "lastInspectedAt",
      headerName: "Last Inspected",
      width: 130,
      valueGetter: (params) =>
        params?.row?.lastInspectedAt
          ? new Date(params?.row?.lastInspectedAt).toLocaleDateString()
          : "-",
    },
    { field: "status", headerName: "Status", width: 150 },
    { field: "meterSize", headerName: "Size", width: 100 },
    {
      field: "connection",
      headerName: "Connection",
      width: 160,
      valueGetter: (params) =>
        params.row.connection?.connectionNumber
          ? `#${params?.row?.connection?.connectionNumber}`
          : "-",
    },
    {
      field: "customer",
      headerName: "Customer",
      width: 180,
      valueGetter: (params) =>
        params?.row?.connection?.customer?.customerName || "-",
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 100,
      renderCell: (params) => (
        <Tooltip title="Edit Status">
          <IconButton
            color="primary"
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
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight="bold" mb={2}>
        Meter Management
      </Typography>

      {/* 🔍 Search & Actions */}
      <Grid container spacing={2} alignItems="center" mb={2}>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search by Serial Number..."
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
            onClick={() => {
              setSelectedMeter(null); // clear for create mode
              setModalOpen(true);
            }}
          >
            Add Meter
          </Button>
        </Grid>
      </Grid>

      {/* 📋 Meters Table */}
      <Paper sx={{ height: 520, width: "100%" }}>
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
            disableRowSelectionOnClick
          />
        )}
      </Paper>

      {/* 🧩 Modal (Create / Update) */}
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
