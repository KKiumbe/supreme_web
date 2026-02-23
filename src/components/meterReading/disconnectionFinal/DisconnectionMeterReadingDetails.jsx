import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  Divider,
  Chip,
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

export default function DisconnectionMeterReadingDetails({
  readingId,
  onClose,
}) {
  const [reading, setReading] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageOpen, setImageOpen] = useState(false);

  useEffect(() => {
    if (!readingId) {
      return;
    }

    const fetchData = async () => {
      try {
        const res = await axios.get(
          `${BASE_URL}/disconnection-meter-readings/${readingId}`,
          { withCredentials: true },
        );
        setReading(res.data.data);
      } catch (err) {
        console.error("Failed to fetch disconnection reading:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [readingId]);

  /* ---------------- Location ---------------- */
  const lat = reading?.latitude ? Number(reading.latitude) : null;
  const lng = reading?.longitude ? Number(reading.longitude) : null;
  const hasLocation = lat && lng;

  const googleMapsUrl = useMemo(() => {
    if (!hasLocation) {
      return null;
    }
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
          Unable to load disconnection meter reading.
        </Typography>
      </Box>
    );
  }

  const {
    finalReading,
    previousReading,
    finalConsumption,
    disconnectionDate,
    notes,
    imageUrl,
    meter,
    connection,
    customer,
    task,
  } = reading;

  return (
    <>
      <Box p={2} sx={{ position: "relative" }}>
        {/* Close Button */}
        <IconButton
          onClick={onClose}
          sx={{ position: "absolute", top: 4, left: 4 }}
        >
          <CloseIcon />
        </IconButton>

        <Box mb={2} mt={4}>
          <Typography variant="h6" fontWeight={600}>
            Disconnection Meter Reading
          </Typography>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* READING SUMMARY */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography fontWeight={600}>Reading Summary</Typography>
          <Divider sx={{ my: 1 }} />

          <Info label="Previous Reading" value={previousReading} />
          <Info label="Final Reading" value={finalReading} />
          <Info label="Final Consumption" value={finalConsumption} />
          <Info
            label="Disconnection Date"
            value={new Date(disconnectionDate).toLocaleString()}
          />

          {task?.status && (
            <Chip
              label={`Task: ${task.status}`}
              color="warning"
              size="small"
              sx={{ mt: 1 }}
            />
          )}

          {notes && <Info label="Notes" value={notes} />}
        </Paper>

        {/* METER */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography fontWeight={600}>Meter Information</Typography>
          <Divider sx={{ my: 1 }} />

          <Info label="Meter Serial" value={meter?.serialNumber} />
          <Info
            label="Connection Number"
            value={connection?.connectionNumber}
          />
          <Info label="Route ID" value={connection?.routeId} />
          <Info label="Zone ID" value={connection?.zoneId} />
          <Info label="Scheme ID" value={connection?.schemeId} />
        </Paper>

        {/* CUSTOMER */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography fontWeight={600}>Customer</Typography>
          <Divider sx={{ my: 1 }} />

          <Info label="Customer Name" value={customer?.customerName} />
          <Info label="Phone" value={customer?.phoneNumber} />
          <Info label="Account Number" value={customer?.accountNumber} />
        </Paper>

        {/* LOCATION */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography
            fontWeight={600}
            display="flex"
            alignItems="center"
            gap={1}
          >
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
                  title="Disconnection Location"
                  width="100%"
                  height="220"
                  loading="lazy"
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
            <Typography color="text.secondary">No image available</Typography>
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

/* ---------------- Helper ---------------- */

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

DisconnectionMeterReadingDetails.propTypes = {
  readingId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};
