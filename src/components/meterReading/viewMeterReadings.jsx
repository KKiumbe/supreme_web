import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  Divider,
  Chip,
  Avatar,
  IconButton
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import axios from "axios";
import PropTypes from "prop-types";

const BASE_URL = import.meta.env.VITE_BASE_URL;

export default function MeterReadingDetails({ readingId, onClose }) {
  const [reading, setReading] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!readingId) return;

    const fetchData = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/get-meter-reading/${readingId}`, {
          withCredentials: true,
        });
        setReading(res.data.data);
      } catch (err) {
        console.error("Failed to fetch reading:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [readingId]);

  MeterReadingDetails.propTypes = {
    readingId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    onClose: PropTypes.func.isRequired,
  };

  if (loading)
    return (
      <Box p={3} display="flex" justifyContent="center">
        <CircularProgress />
      </Box>
    );

  if (!reading)
    return (
      <Box p={3}>
        <Typography color="error">Unable to load meter reading.</Typography>
      </Box>
    );

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
    <Box p={2} sx={{ position: "relative" }}>
      {/* X Close Button */}
      <IconButton
        onClick={onClose}
        sx={{
          position: "absolute",
          top: 4,
          left: 4,
         
          boxShadow: 1,
        }}
      >
        <CloseIcon />
      </IconButton>

      {/* Header */}
      <Box mb={2} mt={4}>
        <Typography variant="h6" fontWeight={600}>
          Meter Reading Details
        </Typography>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Reading Summary */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography fontWeight={600}>Reading Summary</Typography>
        <Divider sx={{ my: 1 }} />

        <Info label="Previous Reading" value={previousReading} />
        <Info label="Current Reading" value={currentReading} />
        <Info label="Consumption (Units)" value={consumption} />
        <Info
          label="Reading Date"
          value={new Date(readingDate).toLocaleString()}
        />

        {ExceptionType && (
          <Chip label={ExceptionType.name} color="warning" size="small" sx={{ mt: 1 }} />
        )}

        {notes && <Info label="Notes" value={notes} />}
      </Paper>

      {/* Reader Info */}
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
          <Typography color="text.secondary">Unknown Reader</Typography>
        )}
      </Paper>

      {/* Meter Information */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography fontWeight={600}>Meter Information</Typography>
        <Divider sx={{ my: 1 }} />

        <Info label="Meter Serial" value={meter?.serialNumber} />
        <Info label="Connection Number" value={meter?.connection?.connectionNumber} />
        <Info label="Tariff" value={meter?.connection?.tariffCategory?.name} />
     
      </Paper>

      {/* Customer */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography fontWeight={600}>Customer</Typography>
        <Divider sx={{ my: 1 }} />

        <Info label="Customer Name" value={meter?.connection?.customer?.customerName} />
        <Info label="Phone" value={meter?.connection?.customer?.phoneNumber} />
        <Info label="Account Number" value={meter?.connection?.customer?.accountNumber} />
               <Info label="Scheme" value={meter?.connection?.scheme?.name} />
          <Info label="Zone" value={meter?.connection?.zone?.name} />
           <Info label="Route" value={meter?.connection?.route?.name} />
      </Paper>

      {/* Location */}
      {(latitude || longitude) && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography fontWeight={600}>Location</Typography>
          <Divider sx={{ my: 1 }} />
          <Info label="Latitude" value={latitude} />
          <Info label="Longitude" value={longitude} />
        </Paper>
      )}

      {/* Image */}
      {imageUrl && (
        <Paper sx={{ p: 2 }}>
          <Typography fontWeight={600} mb={1}>
            Meter Image
          </Typography>
          <img src={imageUrl} alt="Meter" style={{ width: "100%", borderRadius: 8 }} />
        </Paper>
      )}
    </Box>
  );
}

// Reusable info row
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
