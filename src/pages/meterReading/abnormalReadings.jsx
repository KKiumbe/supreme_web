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
  Download,
} from "@mui/icons-material";
import axios from "axios";
import { useAuthStore, useThemeStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";
import ImageIcon from "@mui/icons-material/Image";
import CircularProgress from "@mui/material/CircularProgress";

import EditAbnormalReadingModal from "../../components/meterReading/abnornal/edit";
import MeterReadingDetails from "../../components/meterReading/abnornal/viewAbnormalReading";
  import PropTypes from "prop-types";

const BASEURL = import.meta.env.VITE_BASE_URL;

export default function AbnormalMeterReadingsList() {
  const { currentUser } = useAuthStore();
  const theme = useThemeStore();
  const navigate = useNavigate();

  /* -----------------------------
     STATE
  ----------------------------- */
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [pagination, setPagination] = useState({
    page: 0,       // DataGrid uses 0-based index
    pageSize: 20,
    total: 0,
  });

  const [averageReading, setAverageReading] = useState(null);

  const [editModal, setEditModal] = useState({
    open: false,
    reading: null,
  });

  const [detailsModal, setDetailsModal] = useState({
    open: false,
    readingId: null,
  });

  /* -----------------------------
     AUTH GUARD
  ----------------------------- */
  useEffect(() => {
    if (!currentUser) navigate("/login");
  }, [currentUser, navigate]);

  /* -----------------------------
     FETCH DATA
  ----------------------------- */
  const fetchReadings = useCallback(async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams({
        page: String(pagination.page + 1), // convert to backend page
        limit: String(pagination.pageSize),
        ...(search && { search }),
      });

      const res = await axios.get(
        `${BASEURL}/get-abnormal-readings?${params.toString()}`,
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

        exception: item.Exception ?? null,
        imageUrl: item.imageUrl ?? null,
      }));

      setRows(normalized);
      setPagination((prev) => ({
        ...prev,
        total: res.data.pagination?.total || 0,
      }));
    } catch (err) {
      console.error(err);
      alert("Failed to load abnormal meter readings");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, search]);

  useEffect(() => {
    fetchReadings();
  }, [fetchReadings]);

  /* -----------------------------
     MODALS
  ----------------------------- */
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

      setAverageReading(res.data.data.average);
      setEditModal({
        open: true,
        reading: res.data.data,
      });
    } catch (err) {
      console.error(err);
      alert("Could not load reading details.");
    }
  };

  const handleDownloadAbnormalReport = async () => {
  try {
    setLoading(true);

    const res = await axios.get(
      `${BASEURL}/reports/abnormal-meter-readings`,
      {
        withCredentials: true,
        responseType: "blob", // ✅ VERY IMPORTANT
      }
    );

    // Create blob URL
    const blob = new Blob([res.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);

    // Trigger download
    const link = document.createElement("a");
    link.href = url;
    link.download = "Abnormal-Meter-Readings.pdf";
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error(err);
    alert("Failed to download abnormal readings report");
  } finally {
    setLoading(false);
  }
};


  const closeEditModal = () =>
    setEditModal({ open: false, reading: null });

  /* -----------------------------
     IMAGE CELL
  ----------------------------- */

  function ImageThumbnail({ src, onClick }) {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);

    if (!src) return <Typography variant="caption">-</Typography>;

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
        }}
      >
        {!loaded && !error && <ImageIcon fontSize="small" />}

        {!loaded && !error && (
          <CircularProgress size={14} sx={{ position: "absolute" }} />
        )}

        {!error && (
          <Box
            component="img"
            src={src}
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
            }}
          />
        )}
      </Box>
    );
  }

  ImageThumbnail.propTypes = {
    src: PropTypes.string,
    onClick: PropTypes.func,
  };

  /* -----------------------------
     COLUMNS
  ----------------------------- */
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
      renderCell: (params) => (
        <ImageThumbnail
          src={params.row.imageUrl}
          onClick={() => openDetails(params.row.id)}
        />
      ),
    },
    { field: "connectionNumber", headerName: "Connection #", width: 130 },
    { field: "customerName", headerName: "Customer", flex: 1 },
    { field: "previousReading", headerName: "Previous", width: 110 },
    { field: "currentReading", headerName: "Current", width: 110 },
    {
      field: "exception",
      headerName: "Exception",
      width: 160,
      renderCell: (params) =>
        params.value ? (
          <Chip label={params.value} size="small" color="warning" />
        ) : (
          "-"
        ),
    },
    { field: "readingDate", headerName: "Date", width: 160 },
    {
      field: "phoneNumber",
      headerName: "Phone",
      width: 150,
      renderCell: (params) => (
        <a href={`tel:${params.value}`}>{params.value}</a>
      ),
    },
    { field: "serialNumber", headerName: "Meter Serial", width: 150 },
    { field: "model", headerName: "Model", width: 120 },
  ];

  /* -----------------------------
     RENDER
  ----------------------------- */
  return (
    <Box p={3}>
   
   <Grid
  container
  justifyContent="space-between"
  alignItems="center"
  mb={2}
>
  <Typography variant="h6">
    Abnormal Meter Readings
  </Typography>

  <Box display="flex" gap={2}>

     <Tooltip title="Download PDF report">
      <span>
        <IconButton
          color="primary"
          onClick={handleDownloadAbnormalReport}
          disabled={loading}
        >
          {loading ? (
            <CircularProgress size={12} />
          ) : (
            <Download fontSize="large"  color="action"/> // or Download icon if you prefer
          )}
        </IconButton>
      </span>
    </Tooltip>


    <TextField
      size="small"
      placeholder="Search meter / customer..."
      value={search}
      onChange={(e) => {
        setSearch(e.target.value);
        setPagination((p) => ({ ...p, page: 0 }));
      }}
      InputProps={{
        startAdornment: <SearchIcon sx={{ mr: 1 }} />,
      }}
      sx={{ width: 320 }}
    />

   
  </Box>
</Grid>


      <Paper sx={{ height: 700 }}>
        <DataGrid
  rows={rows}
  columns={columns}
  loading={loading}
  paginationMode="server"
  rowCount={pagination.total}

  paginationModel={{
    page: pagination.page,
    pageSize: pagination.pageSize,
  }}

  onPaginationModelChange={(model) => {
    setPagination((prev) => ({
      ...prev,
      page: model.page,
      pageSize: model.pageSize,
    }));
  }}

  pageSizeOptions={[10, 20, 50]}
  getRowId={(row) => row.id}
/>

      </Paper>

      {/* MODALS */}
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
