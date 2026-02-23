import { useEffect, useState, useCallback } from "react";
import {
  Box,
  Typography,
  Grid,
  TextField,
  Paper,
  IconButton,
  Tooltip,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ImageIcon from "@mui/icons-material/Image";
import SearchIcon from "@mui/icons-material/Search";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import {
  PermissionDeniedUI,
  isPermissionDenied,
} from "../../utils/permissionHelper";
import DisconnectionMeterReadingDetails from "../../components/meterReading/disconnectionFinal/DisconnectionMeterReadingDetails";

const BASEURL = import.meta.env.VITE_BASE_URL;

export default function DisconnectionMeterReadingsList() {
  const { currentUser } = useAuthStore();
  const navigate = useNavigate();

  const [readings, setReadings] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
  });

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [selectedReadingId, setSelectedReadingId] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, []);

  /* ---------------- Fetch Data ---------------- */
  const fetchReadings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
      });

      const res = await axios.get(
        `${BASEURL}/disconnection-meter-readings?${params}`,
        { withCredentials: true },
      );

      const normalized = (res?.data?.data || []).map((item) => ({
        id: item.id,
        serialNumber: item.meter?.serialNumber,
        connectionNumber: item.connection?.connectionNumber,
        customerName: item.customer?.customerName,
        phoneNumber: item.customer?.phoneNumber,
        finalReading: item.finalReading,
        previousReading: item.previousReading,
        finalConsumption: item.finalConsumption,
        disconnectionDate: item.disconnectionDate,
        imageUrl: item.imageUrl,
      }));

      setReadings(normalized);

      setPagination({
        page: res.data.currentPage,
        limit: pagination.limit,
        total: res.data.total,
      });

      setPermissionDenied(false);
    } catch (err) {
      if (isPermissionDenied(err)) {
        setPermissionDenied(true);
        setReadings([]);
      }
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search]);

  useEffect(() => {
    fetchReadings();
  }, [fetchReadings]);

  /* ---------------- Image Thumbnail ---------------- */
  function ReadingImageThumbnail({ src, onClick }) {
    if (!src) {
      return (
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: 1,
            border: "1px solid",
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "text.disabled",
          }}
        >
          <ImageIcon fontSize="small" />
        </Box>
      );
    }

    return (
      <Box
        component="img"
        src={src}
        onClick={onClick}
        sx={{
          width: 42,
          height: 42,
          borderRadius: 1,
          border: "1px solid",
          borderColor: "divider",
          objectFit: "cover",
          cursor: "pointer",
        }}
      />
    );
  }

  /* ---------------- Columns ---------------- */
  const columns = [
    {
      field: "view",
      headerName: "",
      width: 60,
      renderCell: (params) => (
        <Tooltip title="View Details">
          <IconButton
            size="small"
            onClick={() => setSelectedReadingId(params.row.id)}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
    {
      field: "image",
      headerName: "Image",
      width: 80,
      renderCell: (params) => (
        <ReadingImageThumbnail
          src={params.row.imageUrl}
          onClick={() => setSelectedReadingId(params.row.id)}
        />
      ),
    },
    { field: "serialNumber", headerName: "Meter", width: 120 },
    { field: "connectionNumber", headerName: "Connection", width: 130 },
    { field: "customerName", headerName: "Customer", width: 180 },
    { field: "phoneNumber", headerName: "Phone", width: 140 },
    { field: "previousReading", headerName: "Prev", width: 100 },
    { field: "finalReading", headerName: "Final", width: 100 },
    { field: "finalConsumption", headerName: "Consumption", width: 120 },
    {
      field: "disconnectionDate",
      headerName: "Date",
      width: 160,
    },
  ];

  return (
    <>
      <Box p={3}>
        {permissionDenied ? (
          <PermissionDeniedUI permission="meter-readings:view" />
        ) : (
          <>
            <Typography variant="h6" mb={2}>
              Disconnection Meter Readings
            </Typography>

            <Grid container justifyContent="space-between" mb={2}>
              <TextField
                size="small"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1 }} />,
                }}
                sx={{ width: 300 }}
              />
            </Grid>

            <Paper sx={{ height: 680 }}>
              <DataGrid
                rows={readings}
                columns={columns}
                loading={loading}
                paginationMode="server"
                pageSizeOptions={[10, 20]}
                paginationModel={{
                  page: pagination.page - 1,
                  pageSize: pagination.limit,
                }}
                rowCount={pagination.total}
                onPaginationModelChange={(model) =>
                  setPagination({
                    ...pagination,
                    page: model.page + 1,
                    limit: model.pageSize,
                  })
                }
              />
            </Paper>
          </>
        )}
      </Box>

      {/* Sliding Details Panel */}
      <Box
        sx={{
          position: "fixed",
          top: 64,
          right: 0,
          width: selectedReadingId ? 450 : 0,
          height: "calc(100vh - 64px)",
          bgcolor: "background.paper",
          overflowY: "auto",
          transition: "width 0.3s ease",
          boxShadow: selectedReadingId ? "-4px 0 12px rgba(0,0,0,0.1)" : "none",
          zIndex: 2000,
        }}
      >
        {selectedReadingId && (
          <DisconnectionMeterReadingDetails
            id={selectedReadingId}
            onClose={() => setSelectedReadingId(null)}
          />
        )}
      </Box>
    </>
  );
}
