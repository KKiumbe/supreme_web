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
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import axios from "axios";
import { useAuthStore, useThemeStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";
import TitleComponent from "../../components/title";
import AddReadingStepperModal from "../../components/meterReading/addReading";
import EditAbnormalReadingModal from "../../components/meterReading/updateAbnormal";
import ImageIcon from "@mui/icons-material/Image"; // Add this import at the top

const BASEURL = import.meta.env.VITE_BASE_URL;

export default function MeterReadingsList() {
  const { currentUser } = useAuthStore();
  const navigate = useNavigate();
  const theme = useThemeStore();

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
  const [modalOpen, setModalOpen] = useState(false);
  const [editModal, setEditModal] = useState({
    open: false,
    reading: null,
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) navigate("/login");
  }, [currentUser, navigate]);

  // Fetch readings
  const fetchReadings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
      });

      const res = await axios.get(`${BASEURL}/get-meter-readings?${params}`, {
        withCredentials: true,
      });

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
        type: item.type,
        imageUrl: item.imageUrl || "", // Add imageUrl
        ExceptionId: item.ExceptionId, // Add ExceptionId
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
      alert("Failed to fetch meter readings.");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, pagination.total, search]);

  useEffect(() => {
    fetchReadings();
  }, [fetchReadings]);

  const openEditModal = (reading) => {
    setEditModal({ open: true, reading });
  };
  const closeEditModal = () => {
    setEditModal({ open: false, reading: null });
  };

  // DataGrid columns
  const columns = [
      {
    field: "imageUrl",
    headerName: "Image",
    width: 100,
    headerAlign: "center",
    align: "center",
    renderCell: (params) =>
      params.value ? (
        <Tooltip title="View meter reading image">
          <IconButton
            size="small"
            onClick={() => window.open(params.value, "_blank")} // Opens image in new tab
            sx={{ color: "text.secondary" }}
          >
            <ImageIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ) : (
        <Typography color="text.secondary">-</Typography>
      ),
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
      renderCell: (params) =>
        params.row.ExceptionId ? (
          <Tooltip title="Edit abnormal reading">
            <IconButton
              color="primary"
              size="small"
              onClick={() => openEditModal(params.row)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : null,
    },
    {
      field: "type",
      headerName: "type",
      width: 130,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => {
        const status = params.value;
        let chipColor = "default";
        let textColor = "inherit";

        if (status === "ABNORMAL" || params.row.ExceptionId) {
          chipColor = "warning";
          textColor = "#fff";
        } else if (status === "NORMAL") {
          chipColor = "success";
          textColor = "#fff";
        }

        return (
          <Chip
            label={status || "UNKNOWN"}
            color={chipColor}
            size="small"
            sx={{
              fontWeight: 600,
              color: textColor,
              textTransform: "capitalize",
            }}
          />
        );
      },
    },
    {
      field: "meterId",
      headerName: "Meter ID",
      width: 100,
      headerAlign: "center",
      align: "center",
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
            sx={{
              fontWeight: 600,
              color: positive ? "white" : "text.primary",
            }}
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
        <a
          href={`tel:${params.value}`}
          style={{ color: "#1976d2", textDecoration: "none" }}
        >
          {params.value || "-"}
        </a>
      ),
    },
    {
      field: "email",
      headerName: "Email",
      width: 200,
      renderCell: (params) => (
        <a
          href={`mailto:${params.value}`}
          style={{ color: "#1976d2", textDecoration: "none" }}
        >
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
          sx={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
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
  ];

  return (
    <Box p={3}>
      <Typography variant="h6" gutterBottom>
        Meter Readings
      </Typography>

      {/* Header: Add + Search */}
      <Grid container justifyContent="space-between" alignItems="center" mb={2}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setModalOpen(true)}
        >
          Add Reading
        </Button>

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
          getRowClassName={(params) =>
            params.row.ExceptionId ? "highlight-row" : ""
          }
          sx={{
            "& .highlight-row": {
              backgroundColor: "#fff3e0", // Light orange for highlighting
              "&:hover": {
                backgroundColor: "#ffe0b2", // Slightly darker on hover
              },
            },
          }}
          slots={{
            noRowsOverlay: () => (
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                height="100%"
              >
                <Typography color="text.secondary">
                  No meter readings found
                </Typography>
              </Box>
            ),
          }}
        />
      </Paper>

      {/* Reusable Add Reading Modal */}
      <AddReadingStepperModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchReadings}
      />

      {/* Edit Abnormal Reading Modal */}
      <EditAbnormalReadingModal
        open={editModal.open}
        onClose={closeEditModal}
        reading={editModal.reading}
        onSuccess={fetchReadings}
      />
    </Box>
  );
}