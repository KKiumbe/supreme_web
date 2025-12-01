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
  const [detailsModal, setDetailsModal] = useState({ open: false, readingId: null });

const openEditModal = async (row) => {
  try {
    const res = await axios.get(
      `${BASEURL}/get-abnormal-reading/${row.id}`, 
      { withCredentials: true }
    );

    const fullReading = res.data.data;   // contains consumption average
    setAverageReading(fullReading.average);

    setEditModal({
      open: true,
      reading: fullReading,
    });

  } catch (err) {
    console.error("Failed to load reading details:", err);
    alert("Could not load full meter reading details.");
  }
};


  const closeEditModal = () =>
    setEditModal({ open: false, reading: null });

  const openDetails = (id) =>
    setDetailsModal({ open: true, readingId: id });
  const closeDetails = () =>
    setDetailsModal({ open: false, readingId: null });

  // Redirect if unauthenticated
  useEffect(() => {
    if (!currentUser) navigate("/login");
  }, [currentUser, navigate]);

  // Fetch abnormal readings
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
        serialNumber: item.meter?.serialNumber || "-",
        model: item.meter?.model || "-",
        connectionNumber: item.meter?.connection?.connectionNumber || "-",
        accountNumber: item.meter?.connection?.customer?.accountNumber || "-",
        customerName: item.meter?.connection?.customer?.customerName || "-",
        phoneNumber: item.meter?.connection?.customer?.phoneNumber || "-",
        previousReading: item.previousReading || "-",
        currentReading: item.currentReading || "-",
        readingDate: item.readingDate,
        notes: item.notes,
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


  //   const consumptionAverage = async () => {
  //   try {
  //     const res = await axios.get(`${BASEURL}/get-abnormal-reading/${readingId}`, {
  //       withCredentials: true,
  //     });
      
  //     setAverageReading(res.data.data.average);
  //   } catch (err) {
  //     console.error("Failed to fetch reading:", err);
  //   } finally {
  //     setLoading(false);
  //   }
  // };


  const columns = [
    {
      field: "view",
      headerName: "",
      width: 60,
      renderCell: (params) => (
        <Tooltip title="View Details">
          <IconButton size="small" onClick={() => openDetails(params.row.id)}>
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
      field: "readingDate",
      headerName: "Date",
      width: 140,
      
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

  return (
    <Box p={3}>
      <Typography variant="h6" mb={2}>
        Abnormal Meter Readings
      </Typography>

      <Grid container justifyContent="flex-end" mb={2}>
        <TextField
          size="small"
          placeholder="Search meter/customer..."
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
          getRowId={(row) => row.id}
          rowCount={pagination.total}
        />
      </Paper>

      {/* UPDATE MODAL */}
    <EditAbnormalReadingModal
  open={editModal.open}
  onClose={closeEditModal}
  reading={editModal.reading}
  average={averageReading}
  onSuccess={() => {
    closeEditModal();   // close modal
    fetchReadings();    // auto refresh list
  }}
/>


      {/* VIEW DETAILS MODAL */}
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
