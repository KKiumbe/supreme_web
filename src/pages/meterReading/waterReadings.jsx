import React, { useEffect, useState, useCallback } from "react";
import {
  PermissionDeniedUI,
  isPermissionDenied,
} from "../../utils/permissionHelper";
import {
  Box,
  Button,
  Paper,
  TextField,
  Typography,
  IconButton,
  Tooltip,
  Grid,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import {
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import axios from "axios";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";
import ImageIcon from "@mui/icons-material/Image";

import AddReadingStepperModal from "../../components/meterReading/addReading";
import EditAbnormalReadingModal from "../../components/meterReading/updateAbnormal";
import MeterReadingDetails from "../../components/meterReading/viewMeterReadings";
import PropTypes from "prop-types";

const BASEURL = import.meta.env.VITE_BASE_URL;

export default function MeterReadingsList() {
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

  const [modalOpen, setModalOpen] = useState(false);
  const [editModal, setEditModal] = useState({ open: false, reading: null });

  const [selectedReadingId, setSelectedReadingId] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, []);

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

      const normalized = (res?.data?.data || []).map((item) => ({
        id: item.id,
        type: item.type,
        meterId: item.meterId,
        serialNumber: item.meter?.serialNumber,
        connectionNumber: item.meter?.connection?.connectionNumber,
        previousReading: item.previousReading,
        currentReading: item.currentReading,
        consumption: item.consumption,
        readingDate: item?.readingDate,
        customerBalance: item.meter?.connection?.customerAccounts?.[0]?.balance,
        customerName: item?.customer?.customerName,
        phoneNumber: item?.customer?.phoneNumber,

        // ✅ FIX HERE
        imageUrl: item?.imageUrl,

        ExceptionId: item?.ExceptionId,
      }));

      setReadings(normalized);

      // Fix: use backend pagination fields
      setPagination({
        page: res.data.currentPage,
        limit: pagination.limit,
        total: res.data.total,
      });
      setPermissionDenied(false);
    } catch (err) {
      console.error("Fetch error:", err);
      if (isPermissionDenied(err)) {
        setPermissionDenied(true);
        setReadings([]);
        setPagination({
          page: 1,
          limit: 20,
          total: 0,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search]);

  useEffect(() => {
    fetchReadings();
  }, [fetchReadings]);

  const handleSelectReading = (id) => {
    setSelectedReadingId(id);
  };

  function ReadingImageThumbnail({ src, onClick }) {
    const [error, setError] = useState(false);

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
        onClick={onClick}
        sx={{
          width: 42,
          height: 42,
          borderRadius: 1,
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
          cursor: "pointer",
        }}
      >
        <Box
          component="img"
          src={src}
          alt="Meter"
          loading="lazy"
          onError={() => setError(true)}
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: error ? 0.3 : 1,
          }}
        />
      </Box>
    );
  }

  ReadingImageThumbnail.propTypes = {
    src: PropTypes.string,
    onClick: PropTypes.func,
  };

  const columns = [
    {
      field: "view",
      headerName: "",
      width: 60,
      renderCell: (params) => (
        <Tooltip title="View Details">
          <IconButton
            size="small"
            onClick={() => handleSelectReading(params.row.id)}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
    { field: "meterId", headerName: "Meter ID", width: 110 },
    {
      field: "image",
      headerName: "Image",
      width: 80,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <ReadingImageThumbnail
          src={params.row.imageUrl}
          onClick={() => handleSelectReading(params.row.id)}
        />
      ),
    },

    { field: "type", headerName: "Type", width: 130 },
    { field: "connectionNumber", headerName: "Connection No.", width: 130 },
    { field: "previousReading", headerName: "Prev", width: 110 },
    { field: "currentReading", headerName: "Current", width: 110 },
    { field: "consumption", headerName: "Consumption", width: 110 },
    {
      field: "readingDate",
      headerName: "Date",
      width: 150,
    },
    { field: "customerName", headerName: "Customer", width: 180 },
    { field: "phoneNumber", headerName: "Phone", width: 140 },
    { field: "customerBalance", headerName: "Balance", width: 150 },
  ];

  return (
    <>
      <Box p={3}>
        {permissionDenied ? (
          <PermissionDeniedUI permission="meter-readings:view" />
        ) : (
          <>
            <Typography variant="h6" mb={2}>
              Meter Readings
            </Typography>

            {/* Header */}
            <Grid
              container
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setModalOpen(true)}
              >
                Add Reading
              </Button>

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
                getRowClassName={(params) =>
                  params.row.type === "ESTIMATE" ? "estimated-row" : ""
                }
                sx={{
                  "& .estimated-row": {
                    color: "#f7e02b !important",
                  },
                }}
              />
            </Paper>
          </>
        )}
      </Box>

      {permissionDenied ? null : (
        <>
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
              boxShadow: selectedReadingId
                ? "-4px 0 12px rgba(0,0,0,0.1)"
                : "none",
              zIndex: 2000,
            }}
          >
            {selectedReadingId && (
              <MeterReadingDetails
                readingId={selectedReadingId}
                onClose={() => setSelectedReadingId(null)}
              />
            )}
          </Box>

          {/* Modals */}
          <AddReadingStepperModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            onReadingAdded={fetchReadings}
          />

          <EditAbnormalReadingModal
            open={editModal.open}
            onClose={() => setEditModal({ open: false, reading: null })}
            reading={editModal.reading}
            onSuccess={fetchReadings}
          />
        </>
      )}
    </>
  );
}
