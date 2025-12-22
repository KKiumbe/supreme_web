import React, { useEffect, useState, useMemo } from "react";
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
import LocationOnIcon from "@mui/icons-material/LocationOn";
import MapIcon from "@mui/icons-material/Map";
import axios from "axios";
import PropTypes from "prop-types";

const BASE_URL = import.meta.env.VITE_BASE_URL;

export default function MeterReadingDetails({ readingId, onClose }) {
  const [reading, setReading] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageOpen, setImageOpen] = useState(false);

  useEffect(() => {
    if (!readingId) return;

    const fetchData = async () => {
      try {
        const res = await axios.get(
          `${BASE_URL}/get-meter-reading/${readingId}`,
          { withCredentials: true }
        );
        setReading(res.data.data);
      } catch (err) {
        console.error("Failed to fetch reading:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [readingId]);

  // Prepare variables for useMemo so it is always called
  const lat = reading?.latitude ? Number(reading.latitude) : null;
  const lng = reading?.longitude ? Number(reading.longitude) : null;
  const hasLocation = lat && lng;

  const googleMapsUrl = useMemo(() => {
    if (!hasLocation) return null;
    return `https://www.google.com/maps?q=${lat},${lng}&z=18`;
  }, [lat, lng, hasLocation]);

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
        <Typography color="error">
          Unable to load meter reading.
        </Typography>
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
    ExceptionType,
    meter,
    readBy,
    latitude,
    longitude,
  } = reading;

  return (
    <>
      <Box p={2} sx={{ position: "relative" }}>
        {/* Close */}
        <IconButton
          onClick={onClose}
          sx={{ position: "absolute", top: 4, left: 4 }}
        >
          <CloseIcon />
        </IconButton>

        <Box mb={2} mt={4}>
          <Typography variant="h6" fontWeight={600}>
            Meter Reading Details
          </Typography>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* SUMMARY */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography fontWeight={600}>Reading Summary</Typography>
          <Divider sx={{ my: 1 }} />

          <Info label="Previous Reading" value={previousReading} />
          <Info label="Current Reading" value={currentReading} />
          <Info label="Consumption" value={consumption} />
          <Info
            label="Reading Date"
            value={new Date(readingDate).toLocaleString()}
          />

          {ExceptionType && (
            <Chip
              label={ExceptionType.name}
              color="warning"
              size="small"
              sx={{ mt: 1 }}
            />
          )}

          {notes && <Info label="Notes" value={notes} />}
        </Paper>

        {/* READ BY */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography fontWeight={600}>Read By</Typography>
          <Divider sx={{ my: 1 }} />

          {readBy ? (
            <Box display="flex" gap={2} alignItems="center">
              <Avatar>{readBy.firstName?.[0]}</Avatar>
              <Box>
                <Typography fontWeight={600}>
                  {readBy.firstName} {readBy.lastName}
                </Typography>
                <Typography>{readBy.phoneNumber}</Typography>
              </Box>
            </Box>
          ) : (
            <Typography color="text.secondary">
              Unknown Reader
            </Typography>
          )}
        </Paper>

        {/* METER */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography fontWeight={600}>Meter Information</Typography>
          <Divider sx={{ my: 1 }} />

          <Info label="Meter Serial" value={meter?.serialNumber} />
          <Info
            label="Connection Number"
            value={meter?.connection?.connectionNumber}
          />
          <Info
            label="Tariff"
            value={meter?.connection?.tariffCategory?.name}
          />
        </Paper>

        {/* CUSTOMER */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography fontWeight={600}>Customer</Typography>
          <Divider sx={{ my: 1 }} />

          <Info
            label="Customer Name"
            value={meter?.connection?.customer?.customerName}
          />
          <Info
            label="Phone"
            value={meter?.connection?.customer?.phoneNumber}
          />
          <Info
            label="Account Number"
            value={meter?.connection?.customer?.accountNumber}
          />
        </Paper>

        {/* LOCATION + MAP */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography fontWeight={600} display="flex" alignItems="center" gap={1}>
            <LocationOnIcon fontSize="small" />
            Location
          </Typography>
          <Divider sx={{ my: 1 }} />

          {hasLocation ? (
            <>
              <Info label="Latitude" value={lat} />
              <Info label="Longitude" value={lng} />

              <Box mt={1} mb={1}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<MapIcon />}
                  onClick={() => window.open(googleMapsUrl, "_blank")}
                >
                  Open in Google Maps
                </Button>
              </Box>

              {/* MAP PREVIEW */}
              <Box
                sx={{
                  mt: 1,
                  borderRadius: 1,
                  overflow: "hidden",
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <iframe
                  title="Meter Location"
                  width="100%"
                  height="220"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps?q=${lat},${lng}&z=18&output=embed`}
                />
              </Box>
            </>
          ) : (
            <Typography color="text.secondary">
              Location not captured
            </Typography>
          )}
        </Paper>

        {/* IMAGE */}
        <Paper sx={{ p: 2 }}>
          <Typography fontWeight={600} mb={1}>
            Meter Image
          </Typography>

          {imageUrl ? (
            <IconButton
              onClick={() => setImageOpen(true)}
              sx={{
                width: 64,
                height: 64,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
              }}
            >
              <ImageIcon fontSize="large" />
            </IconButton>
          ) : (
            <Typography color="text.secondary">
              No image available
            </Typography>
          )}
        </Paper>
      </Box>

      {/* FULL IMAGE VIEWER */}
      {imageUrl && imageOpen && (
        <Box
          onClick={() => setImageOpen(false)}
          sx={{
            position: "fixed",
            inset: 0,
            bgcolor: "rgba(0,0,0,0.9)",
            zIndex: 9999,
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

function Info({ label, value }) {
  return (
    <Box display="flex" justifyContent="space-between" mb={0.5}>
      <Typography color="text.secondary">{label}:</Typography>
      <Typography fontWeight={500}>{value ?? "-"}</Typography>
    </Box>
  );
}

Info.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.any,
};

MeterReadingDetails.propTypes = {
  readingId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onClose: PropTypes.func.isRequired,
};
