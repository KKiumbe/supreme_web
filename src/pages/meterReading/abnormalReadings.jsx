import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Button,
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
  Delete as DeleteIcon,
  Search as SearchIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import axios from "axios";
import { useAuthStore, useThemeStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";
import EditAbnormalReadingModal from "../../components/meterReading/updateAbnormal";


const BASEURL = import.meta.env.VITE_BASE_URL;

export default function AbnormalMeterReadingsList() {
  const { currentUser } = useAuthStore();
  const navigate = useNavigate();
    const theme = useThemeStore()
  const [readings, setReadings] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Edit modal
  const [editModal, setEditModal] = useState({ open: false, reading: null });
  const openEditModal = (reading) => setEditModal({ open: true, reading });
  const closeEditModal = () => setEditModal({ open: false, reading: null });

  // Redirect if not logged in
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
        connStatus: item.meter?.connection?.status || "-",
        accountNumber: item.meter?.connection?.customer?.accountNumber || "-",
        customerName: item.meter?.connection?.customer?.customerName || "-",
        phoneNumber: item.meter?.connection?.customer?.phoneNumber || "-",
        email: item.meter?.connection?.customer?.email || "-",
        previousReading: item.previousReading || "-",
        currentReading: item.currentReading || "-",
        readingDate: item.readingDate,
        notes: item.notes,
        status: item.status,
      }));

      setReadings(normalized);

      const newPagination = res.data.pagination;
      if (
        newPagination &&
        (newPagination.page !== pagination.page ||
          newPagination.limit !== pagination.limit ||
          newPagination.total !== pagination.total)
      ) {
        setPagination((prev) => ({ ...prev, ...newPagination }));
      }
    } catch (err) {
      console.error(err);
      alert("Failed to fetch abnormal meter readings.");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, pagination.total, search]);

  useEffect(() => {
    fetchReadings();
  }, [fetchReadings]);

  // Delete
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this abnormal reading?")) return;
    try {
      await axios.delete(`${BASEURL}/delete-meter-reading/${id}`, {
        withCredentials: true,
      });
      alert("Reading deleted");
      fetchReadings();
    } catch (err) {
      alert("Failed to delete");
    }
  };

  // Columns (same as normal screen + Edit button always shown)
  const columns = [
    {
      field: "meterId",
      headerName: "Meter ID",
      width: 100,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "edit",
      headerName: "",
      width: 70,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => (
        <Tooltip title="Correct reading">
          <IconButton
            color={theme.palette?.primary?.main}
            size="small"
            onClick={() => openEditModal(params.row)}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      width: 130,
      headerAlign: "center",
      align: "center",
      renderCell: () => (
        <Chip
          label="ABNORMAL"
          color="warning"
          size="small"
          sx={{ fontWeight: 600, color: "#fff" }}
        />
      ),
    },
    {
      field: "connectionNumber",
      headerName: "Connection #",
      width: 130,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "previousReading",
      headerName: "Previous",
      width: 110,
      headerAlign: "center",
      align: "right",
    },
    {
      field: "currentReading",
      headerName: "Current",
      width: 110,
      headerAlign: "center",
      align: "right",
    },
    {
      field: "consumption",
      headerName: "Usage",
      width: 110,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => {
        const prev = parseFloat(params.row.previousReading || 0);
        const curr = parseFloat(params.row.currentReading || 0);
        const diff = curr - prev;
        const positive = diff > 0;
        return (
          <Chip
            label={`${positive ? "+" : ""}${diff}`}
            color={positive ? "success" : "default"}
            size="small"
            sx={{ fontWeight: 600, color: positive ? "white" : "text.primary" }}
          />
        );
      },
    },
    {
      field: "readingDate",
      headerName: "Reading Date",
      width: 140,
      valueFormatter: (p) =>
        new Date(p.value).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
    },
    {
      field: "accountNumber",
      headerName: "Account #",
      width: 130,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "customerName",
      headerName: "Customer Name",
      width: 180,
      flex: 1,
      renderCell: (params) => (
        <Typography noWrap sx={{ fontWeight: 500 }}>
          {params.value || "N/A"}
        </Typography>
      ),
    },
    {
      field: "phoneNumber",
      headerName: "Phone",
      width: 140,
      renderCell: (params) => (
        <a href={`tel:${params.value}`} style={{ color: "#1976d2", textDecoration: "none" }}>
          {params.value || "-"}
        </a>
      ),
    },
    {
      field: "email",
      headerName: "Email",
      width: 200,
      renderCell: (params) => (
        <a href={`mailto:${params.value}`} style={{ color: "#1976d2", textDecoration: "none" }}>
          {params.value || "-"}
        </a>
      ),
    },
    {
      field: "notes",
      headerName: "Notes",
      width: 200,
      flex: 1,
      renderCell: (params) => (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
        >
          {params.value || "-"}
        </Typography>
      ),
    },
    {
      field: "serialNumber",
      headerName: "Serial #",
      width: 130,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "model",
      headerName: "Model",
      width: 120,
      headerAlign: "center",
      align: "center",
    },
    // Edit Button (always visible – all are abnormal)
    
    // Delete
    
  ];

  return (
    <Box p={3}>

     <Typography variant="h6" gutterBottom>
        Abnormal Meter Readings
      </Typography>

      {/* Header: Search only (no Add button) */}
      <Grid container justifyContent="flex-end" alignItems="center" mb={2}>
        <TextField
          size="small"
          placeholder="Search (meter, customer, account...)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />,
          }}
          sx={{ width: 320 }}
        />
      </Grid>

      {/* Data Table */}
      <Paper sx={{ height: 680, width: "100%" }}>
        <DataGrid
          rows={readings}
          columns={columns}
          getRowId={(row) => row.id}
          loading={loading}
          pagination
          paginationMode="server"
          rowCount={pagination.total}
          pageSizeOptions={[10, 20, 50]}
          paginationModel={{
            page: pagination.page - 1,
            pageSize: pagination.limit,
          }}
          onPaginationModelChange={(model) =>
            setPagination((prev) => ({
              ...prev,
              page: model.page + 1,
              limit: model.pageSize,
            }))
          }
          disableRowSelectionOnClick
          slots={{
            noRowsOverlay: () => (
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                height="100%"
              >
                <Typography color="text.secondary">
                  No abnormal meter readings found
                </Typography>
              </Box>
            ),
          }}
        />
      </Paper>

      {/* Edit Modal */}
      <EditAbnormalReadingModal
        open={editModal.open}
        onClose={closeEditModal}
        reading={editModal.reading}
        onSuccess={fetchReadings}
      />
    </Box>
  );
}