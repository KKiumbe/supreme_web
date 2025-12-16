import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  Divider,
  Chip,
  Avatar,
  IconButton,
  Button,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ImageIcon from "@mui/icons-material/Image";
import axios from "axios";
import PropTypes from "prop-types";
import EditAbnormalReadingModal from "./edit";
import { getTheme } from "../../../store/theme";

const BASE_URL = import.meta.env.VITE_BASE_URL;

export default function MeterReadingDetails({ readingId, onClose, onResolve }) {
  const [reading, setReading] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [averageReading, setAverageReading] = useState(null);

  // Image states
  const [previewOpen, setPreviewOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const theme = getTheme();

  const fetchReading = async () => {
    try {
      const res = await axios.get(
        `${BASE_URL}/get-abnormal-reading/${readingId}`,
        { withCredentials: true }
      );
      setReading(res.data.data);
      setAverageReading(res.data.data.average);
    } catch (err) {
      console.error("Failed to fetch reading:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReading();
  }, [readingId]);

  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [reading?.imageUrl]);

  if (loading) {
    return (
      <Box p={3} display="flex" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }

  if (!reading) {
    return (
      <Box p={3}>
        <Typography color="error">Unable to load meter reading.</Typography>
      </Box>
    );
  }

  const {
    previousReading,
    currentReading,
    consumption,
    readingDate,
    notes,
    imageUrl,
    meter,
    readBy,
  } = reading;

  return (
    <>
      {/* SIDE PANEL */}
      <Box
        sx={{
          position: "fixed",
          top: 40,
          right: 40,
          width: 420,
          height: "90vh",
          overflowY: "auto",
          backgroundColor: theme?.palette?.background.paper,
          borderRadius: 2,
          boxShadow: 4,
          p: 2,
          zIndex: 9999,
        }}
      >
        {/* Close */}
        <IconButton
          onClick={onClose}
          sx={{ position: "absolute", top: 4, left: 4 }}
        >
          <CloseIcon />
        </IconButton>

        <Typography variant="h6" mt={3} fontWeight={600}>
          Abnormal Meter Reading
        </Typography>

        <Divider sx={{ my: 1 }} />

        {/* SUMMARY */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography fontWeight={600}>Summary</Typography>
          <Divider sx={{ my: 1 }} />

          <Info
            label="Moving Average"
            value={averageReading}
            valueSx={{ color: "success.main", fontWeight: 700 }}
          />
          <Info label="Previous" value={previousReading} />
          <Info label="Current" value={currentReading} />
          <Info
            label="Consumption"
            value={consumption}
            valueSx={{ color: "warning.main", fontWeight: 700 }}
          />
          <Info
            label="Date"
            value={new Date(readingDate).toLocaleString()}
          />
        </Paper>

        {/* EXCEPTION */}
        {reading.Exception && (
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography fontWeight={600} color="warning.dark">
              Exception
            </Typography>
            <Divider sx={{ my: 1 }} />
            <Chip
              label={reading.Exception}
              color="warning"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
            {notes && <Info label="Notes" value={notes} />}
          </Paper>
        )}

        {/* READ BY */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography fontWeight={600}>Read By</Typography>
          {readBy ? (
            <Box display="flex" gap={2} mt={1}>
              <Avatar>{readBy.firstName?.[0]}</Avatar>
              <Box>
                <Typography fontWeight={500}>
                  {readBy.firstName} {readBy.lastName}
                </Typography>
                <Typography>{readBy.phoneNumber}</Typography>
              </Box>
            </Box>
          ) : (
            <Typography color="text.secondary">Unknown</Typography>
          )}
        </Paper>

        {/* METER */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography fontWeight={600}>Meter</Typography>
          <Divider sx={{ my: 1 }} />
          <Info label="Serial" value={meter?.serialNumber} />
          <Info
            label="Connection"
            value={meter?.connection?.connectionNumber}
          />
        </Paper>

        {/* CUSTOMER */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography fontWeight={600}>Customer</Typography>
          <Divider sx={{ my: 1 }} />
          <Info
            label="Name"
            value={meter?.connection?.customer?.customerName}
          />
          <Info
            label="Phone"
            value={meter?.connection?.customer?.phoneNumber}
          />
          <Info
            label="Account"
            value={meter?.connection?.customer?.accountNumber}
          />
        </Paper>

        {/* IMAGE WITH ICON PLACEHOLDER */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography fontWeight={600}>Meter Image</Typography>
          <Divider sx={{ my: 1 }} />

          <Box
            sx={{
              width: 110,
              height: 110,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              cursor: imageLoaded ? "pointer" : "default",
              bgcolor: "background.default",
            }}
            onClick={() => imageLoaded && setPreviewOpen(true)}
          >
            {!imageLoaded && !imageError && (
              <>
                <ImageIcon sx={{ fontSize: 40, color: "text.secondary" }} />
                <CircularProgress
                  size={26}
                  sx={{ position: "absolute", bottom: 8, right: 8 }}
                />
              </>
            )}

            {imageUrl && !imageError && (
              <Box
                component="img"
                src={imageUrl}
                alt="Meter"
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
                sx={{
                  width: "100%",
                  height: "100%",
                  borderRadius: 2,
                  objectFit: "cover",
                  position: "absolute",
                  inset: 0,
                  opacity: imageLoaded ? 1 : 0,
                  transition: "opacity 0.3s ease-in-out",
                }}
              />
            )}

            {imageError && (
              <Typography variant="caption" color="error">
                Image unavailable
              </Typography>
            )}
          </Box>
        </Paper>

        {/* RESOLVE */}
        <Button
          variant="outlined"
          fullWidth
          sx={{
            mt: 4,
            fontWeight: 700,
            border: "2px solid #FFD700",
            color: "#FFD700",
            "&:hover": { bgcolor: "#FFD700", color: "#000" },
          }}
          onClick={() => {
            onClose();
            onResolve(reading);
          }}
        >
          RESOLVE
        </Button>

        {/* EDIT MODAL */}
        <EditAbnormalReadingModal
          open={editModal}
          onClose={() => setEditModal(false)}
          reading={reading}
          average={averageReading}
          onSuccess={() => {
            setEditModal(false);
            onClose();
          }}
        />
      </Box>

      {/* FULLSCREEN PREVIEW */}
      {imageUrl && previewOpen && (
        <Box
          onClick={() => setPreviewOpen(false)}
          sx={{
            position: "fixed",
            inset: 0,
            bgcolor: "rgba(0,0,0,0.9)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "zoom-out",
          }}
        >
          <Box
            component="img"
            src={imageUrl}
            alt="Meter Full"
            sx={{
              maxWidth: "90%",
              maxHeight: "90%",
              borderRadius: 2,
              boxShadow: 6,
            }}
          />
        </Box>
      )}
    </>
  );
}

function Info({ label, value, valueSx }) {
  return (
    <Box display="flex" justifyContent="space-between" mb={0.5}>
      <Typography color="text.secondary">{label}</Typography>
      <Typography fontWeight={500} sx={valueSx}>
        {value ?? "-"}
      </Typography>
    </Box>
  );
}

Info.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  valueSx: PropTypes.object,
};

MeterReadingDetails.propTypes = {
  readingId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onClose: PropTypes.func.isRequired,
  onResolve: PropTypes.func.isRequired,
};
