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
import axios from "axios";
import PropTypes from "prop-types";
import EditAbnormalReadingModal from "./edit";
import { getTheme } from "../../../store/theme";



const BASE_URL = import.meta.env.VITE_BASE_URL;

export default function MeterReadingDetails({ readingId, onClose,onResolve }) {
  const [reading, setReading] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [averageReading, setAverageReading] = useState(null);

  const theme = getTheme()

  const fetchReading = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/get-abnormal-reading/${readingId}`, {
        withCredentials: true,
      });
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
      {/* Close Button */}
      <IconButton
        onClick={onClose}
        sx={{ position: "absolute", top: 4, left: 4 }}
      >
        <CloseIcon />
      </IconButton>

      {/* Header */}
      <Typography variant="h6" mt={3} fontWeight={600}>
       
      </Typography>
      <Divider sx={{ my: 1 }} />

      {/* Summary */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography fontWeight={600}>Summary</Typography>
        <Divider sx={{ my: 1 }} />
           <Info label="Moving average" value={averageReading}  valueSx={{ color: "success.main", fontWeight: 700 }}   />

        <Info label="Previous" value={previousReading} />
        <Info label="Current" value={currentReading} />
        <Info label="Consumption" value={consumption} valueSx={{ color: "yellow", fontWeight: 700 }} />
        <Info label="Date" value={new Date(readingDate).toLocaleString()} />
        {ExceptionType && (
          <Chip label={ExceptionType.name} color="warning" size="small" />
        )}
        {notes && <Info label="Notes" value={notes} />}
      </Paper>


         <Paper sx={{ p: 2, mb: 2 }}>
        <Typography fontWeight={600}>Exception : {reading.Exception} </Typography>
        <Divider sx={{ my: 1 }} />

          
        
        {notes && <Info label="Notes" value={notes} />}
      </Paper>

      {/* Reader */}
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

      {/* Meter */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography fontWeight={600}>Meter</Typography>
        <Divider sx={{ my: 1 }} />
        <Info label="Serial" value={meter?.serialNumber} />
        <Info label="Connection" value={meter?.connection?.connectionNumber} />
        <Info label="Tariff" value={meter?.connection?.tariffCategory?.name} />
     
      </Paper>

      {/* Customer */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography fontWeight={600}>Customer</Typography>
        <Divider sx={{ my: 1 }} />
        <Info label="Name" value={meter?.connection?.customer?.customerName} />
        <Info label="Phone" value={meter?.connection?.customer?.phoneNumber} />
        <Info label="Account" value={meter?.connection?.customer?.accountNumber} />
            <Info label="Scheme" value={meter?.connection?.scheme?.name} />
          <Info label="Zone" value={meter?.connection?.zone?.name} />
           <Info label="Route" value={meter?.connection?.route?.name} />
      </Paper>

      {/* Image */}
   <Info
  label="Meter Image"
  value={
    imageUrl ? (
      <img
        src={imageUrl}
        alt="Meter"
        style={{ width: 80, height: 80, borderRadius: 8, objectFit: "cover" }}
      />
    ) : (
      <Avatar
        sx={{
          width: 80,
          height: 80,
          bgcolor: "grey.300",
          color: "text.primary",
          fontWeight: 700,
        }}
      >
        {meter?.serialNumber?.[0] ?? "M"}
      </Avatar>
    )
  }
/>


      {/* Update Button */}
<Button
  variant="outlined"
  fullWidth
  sx={{
    mt: 5,
    color: "yellow",
    fontWeight: 700,
    border: "2px solid #FFD700",
    "&:hover": { color: "white" },
  }}
onClick={() => {
  onClose();             // close details panel
  onResolve(reading);    // open edit modal in parent with reading
}}

>
  RESOLVE
</Button>


      {/* Edit Modal */}
<EditAbnormalReadingModal
  open={editModal}
  onClose={() => setEditModal(false)}
  reading={reading}
  average={averageReading}
  onSuccess={() => {  
    setEditModal(false);   // close modal
    onClose();             // close meter reading window
  }}
/>

    </Box>
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
