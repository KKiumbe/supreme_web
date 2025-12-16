import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Paper,
  TextField,
  Typography,
  IconButton,
  Tooltip,
  Chip,
  Grid,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Visibility,
} from "@mui/icons-material";
import axios from "axios";
import { useAuthStore, useThemeStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";
import ImageIcon from "@mui/icons-material/Image";
import CircularProgress from "@mui/material/CircularProgress";

import EditAbnormalReadingModal from "../../components/meterReading/abnornal/edit";
import MeterReadingDetails from "../../components/meterReading/abnornal/viewAbnormalReading";

const BASEURL = import.meta.env.VITE_BASE_URL;

export default function AbnormalMeterReadingsList() {
  const { currentUser } = useAuthStore();
  const theme = useThemeStore();
  const navigate = useNavigate();

  const [readings, setReadings] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [averageReading, setAverageReading] = useState(null);

  // Modals
  const [editModal, setEditModal] = useState({ open: false, reading: null });
  const [detailsModal, setDetailsModal] = useState({
    open: false,
    readingId: null,
  });

  // -----------------------------
  // AUTH GUARD
  // -----------------------------
  useEffect(() => {
    if (!currentUser) navigate("/login");
  }, [currentUser, navigate]);

  // -----------------------------
  // FETCH LIST
  // -----------------------------
  const fetchReadings = useCallback(async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
      });

      const res = await axios.get(
        `${BASEURL}/get-abnormal-readings?${params}`,
        { withCredentials: true }
      );

      const normalized = (res.data.data || []).map((item) => ({
        id: item.id,
        meterId: item.meterId,

        connectionNumber:
          item.meter?.connection?.connectionNumber ?? "-",

        serialNumber: item.meter?.serialNumber ?? "-",
        model: item.meter?.model ?? "-",

        customerName:
          item.meter?.connection?.customer?.customerName ?? "-",

        phoneNumber:
          item.meter?.connection?.customer?.phoneNumber ?? "-",

        previousReading: item.previousReading ?? "-",
        currentReading: item.currentReading ?? "-",

        readingDate: item.readingDate,
        notes: item.notes,

        exception: item.Exception ?? null,     // ✅ IMPORTANT
        imageUrl: item.imageUrl ?? null,       // ✅ IMPORTANT
      }));

      setReadings(normalized);
      setPagination((prev) => ({
        ...prev,
        total: res.data.pagination?.total || prev.total,
      }));
    } catch (err) {
      console.error(err);
      alert("Failed to load abnormal readings");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search]);

  useEffect(() => {
    fetchReadings();
  }, [fetchReadings]);

  // -----------------------------
  // MODAL HANDLERS
  // -----------------------------
  const openDetails = (id) =>
    setDetailsModal({ open: true, readingId: id });

  const closeDetails = () =>
    setDetailsModal({ open: false, readingId: null });

  const openEditModal = async (row) => {
    try {
      const res = await axios.get(
        `${BASEURL}/get-abnormal-reading/${row.id}`,
        { withCredentials: true }
      );

      const fullReading = res.data.data;
      setAverageReading(fullReading.average);

      setEditModal({
        open: true,
        reading: fullReading,
      });
    } catch (err) {
      console.error(err);
      alert("Could not load full meter reading details.");
    }
  };

  const closeEditModal = () =>
    setEditModal({ open: false, reading: null });


  function ImageThumbnail({ src, onClick }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (!src) {
    return <Typography variant="caption">-</Typography>;
  }

  return (
    <Box
      onClick={onClick}
      sx={{
        width: 42,
        height: 42,
        borderRadius: 1,
        border: "1px solid",
        borderColor: "divider",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        cursor: "pointer",
        bgcolor: "background.default",
      }}
    >
      {/* Placeholder icon */}
      {!loaded && !error && (
        <ImageIcon sx={{ fontSize: 20, color: "text.secondary" }} />
      )}

      {/* Loader */}
      {!loaded && !error && (
        <CircularProgress
          size={14}
          sx={{ position: "absolute", bottom: 2, right: 2 }}
        />
      )}

      {/* Image */}
      {!error && (
        <Box
          component="img"
          src={src}
          alt="meter"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: 1,
            opacity: loaded ? 1 : 0,
            transition: "opacity 0.2s ease-in-out",
          }}
        />
      )}

      {/* Error */}
      {error && (
        <Typography variant="caption" color="error">
          !
        </Typography>
      )}
    </Box>
  );
}


  // -----------------------------
  // COLUMNS
  // -----------------------------
  const columns = [
    {
      field: "view",
      headerName: "",
      width: 60,
      renderCell: (params) => (
        <Tooltip title="View Details">
          <IconButton
            size="small"
            onClick={() => openDetails(params.row.id)}
          >
            <Visibility fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
    {
      field: "edit",
      headerName: "",
      width: 60,
      renderCell: (params) => (
        <Tooltip title="Correct Reading">
          <IconButton
            size="small"
            onClick={() => openEditModal(params.row)}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
     {
  field: "image",
  headerName: "Image",
  width: 90,
  sortable: false,
  filterable: false,
  renderCell: (params) => (
    <ImageThumbnail
      src={params.row.imageUrl}
      onClick={() => openDetails(params.row.id)}
    />
  ),
},

    
    {
      field: "connectionNumber",
      headerName: "Connection #",
      width: 120,
    },
    {
      field: "customerName",
      headerName: "Customer",
      flex: 1,
    },
    {
      field: "previousReading",
      headerName: "Previous",
      width: 110,
    },
    {
      field: "currentReading",
      headerName: "Current",
      width: 110,
    },
    {
      field: "exception",
      headerName: "Exception",
      width: 160,
      renderCell: (params) =>
        params.value ? (
          <Chip
            label={params.value}
            size="small"
            color="warning"
            variant="outlined"
          />
        ) : (
          "-"
        ),
    },
    {
      field: "readingDate",
      headerName: "Date",
      width: 150,
      
    },
    {
      field: "phoneNumber",
      headerName: "Phone",
      width: 150,
      renderCell: (params) => (
        <a href={`tel:${params.value}`} style={{ color: "#1976d2" }}>
          {params.value}
        </a>
      ),
    },
    {
      field: "serialNumber",
      headerName: "Meter Serial",
      width: 150,
    },
    {
      field: "model",
      headerName: "Model",
      width: 120,
    },
   
  ];

  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <Box p={3}>
      <Typography variant="h6" mb={2}>
        Abnormal Meter Readings
      </Typography>

      <Grid container justifyContent="flex-end" mb={2}>
        <TextField
          size="small"
          placeholder="Search meter / customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1 }} />,
          }}
          sx={{ width: 320 }}
        />
      </Grid>

      <Paper sx={{ height: 700 }}>
        <DataGrid
          rows={readings}
          columns={columns}
          loading={loading}
          pagination
          paginationMode="server"
          pageSizeOptions={[10, 20, 50]}
          rowCount={pagination.total}
          getRowId={(row) => row.id}
        />
      </Paper>

      {/* EDIT MODAL */}
      <EditAbnormalReadingModal
        open={editModal.open}
        onClose={closeEditModal}
        reading={editModal.reading}
        average={averageReading}
        onSuccess={() => {
          closeEditModal();
          fetchReadings();
        }}
      />

      {/* DETAILS PANEL (IMAGE PREVIEW + EXCEPTION) */}
      {detailsModal.open && (
        <MeterReadingDetails
          readingId={detailsModal.readingId}
          onClose={closeDetails}
          onResolve={(reading) => openEditModal(reading)}
        />
      )}
    </Box>
  );
}
