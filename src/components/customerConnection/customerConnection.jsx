import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  TextField,
  MenuItem,
  Snackbar,
  Alert,
  useMediaQuery,
  IconButton,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import axios from "axios";
import { getTheme } from "../../store/theme";
import PropTypes from "prop-types";

const API_URL = import.meta.env.VITE_BASE_URL;

const AssignMeterConnectionTask = ({ applicationId, onClose, fetchApplications, onBack }) => {
  const [meters, setMeters] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [tariffCategories, setTariffCategories] = useState([]);
  const [formData, setFormData] = useState({
    meterId: "",
    assignedTo: "",
    dueDate: "",
    tariffCategoryId: "",
  });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "error" });
  const theme = getTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Fetch available meters
  const fetchMeters = async () => {
    try {
      const response = await axios.get(`${API_URL}/meters`, {
        withCredentials: true,
        params: { status: "IN_STOCK" },
      });
      if (response.data.success) {
        setMeters(response.data.data.meters);
      } else {
        setSnackbar({ open: true, message: "Failed to fetch meters", severity: "error" });
      }
    } catch (err) {
      console.error("Error fetching meters:", err);
      setSnackbar({ open: true, message: "Error fetching meters: " + err.message, severity: "error" });
    }
  };

  // Fetch technicians
  const fetchTechnicians = async () => {
    try {
      const response = await axios.get(`${API_URL}/users`, {
        withCredentials: true,
        params: { role: "TECHNICIAN" },
      });
      if (response.data.success) {
        setTechnicians(response.data.data);
      } else {
        setSnackbar({ open: true, message: "Failed to fetch technicians", severity: "error" });
      }
    } catch (err) {
      console.error("Error fetching technicians:", err);
      setSnackbar({ open: true, message: "Error fetching technicians: " + err.message, severity: "error" });
    }
  };

  // Fetch tariff categories
  const fetchTariffCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/tarrifs/block`, {
        withCredentials: true,
      });
      console.log("Tariff categories response:", response.data); // Debug log
      if (response.data.message === "Tariff blocks fetched successfully") {
        // Deduplicate tariff categories by categoryId
        const uniqueCategories = Array.from(
          new Map(
            response.data.data.map((item) => [
              item.categoryId,
              { id: item.categoryId, name: item.category?.name || "Unknown" },
            ])
          ).values()
        );
        console.log("Unique tariff categories:", uniqueCategories); // Debug log
        setTariffCategories(uniqueCategories);
      } else {
        setSnackbar({ open: true, message: "Failed to fetch tariff categories", severity: "error" });
      }
    } catch (err) {
      console.error("Error fetching tariff categories:", err);
      setSnackbar({ open: true, message: "Error fetching tariff categories: " + err.message, severity: "error" });
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle task creation
  const handleCreateTask = async () => {
    const { meterId, assignedTo, dueDate, tariffCategoryId } = formData;
    if (!meterId || !assignedTo || !dueDate || !tariffCategoryId) {
      setSnackbar({ open: true, message: "Please fill all required fields", severity: "warning" });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/assign-meter-connection-task`,
        {
          meterId: Number(meterId),
          assignedTo: Number(assignedTo),
          dueDate,
          applicationId,
          tariffCategoryId,
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        setSnackbar({
          open: true,
          message: "Meter connection task created successfully",
          severity: "success",
        });
        if (fetchApplications) {
          fetchApplications(); // Refresh parent list
        }
        setFormData({ meterId: "", assignedTo: "", dueDate: "", tariffCategoryId: "" });
        onClose(); // Close form after success
      } else {
        setSnackbar({ open: true, message: response.data.message, severity: "error" });
      }
    } catch (error) {
      console.error("Error creating task:", error);
      setSnackbar({
        open: true,
        message: "Error creating task: " + (error.response?.data?.message || error.message),
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeters();
    fetchTechnicians();
    fetchTariffCategories();
  }, []);

  return (
    <Box
      sx={{
        p: 3,
        overflow: "auto",
        width: isMobile ? "100%" : "400px",
        borderLeft: !isMobile ? `1px solid ${theme.palette.divider}` : "none",
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" fontWeight="bold">
          Assign Meter Connection Task
        </Typography>
        <IconButton onClick={onClose}>
          <Close />
        </IconButton>
      </Box>

      <Box mb={2}>
        <TextField
          select
          label="Meter"
          name="meterId"
          size="small"
          value={formData.meterId}
          onChange={handleInputChange}
          sx={{ width: 200, mb: 2 }}
          disabled={loading}
        >
          <MenuItem value="">Select Meter</MenuItem>
          {meters.map((meter) => (
            <MenuItem key={meter.id} value={meter.id}>
              {meter.serialNumber} ({meter.model}, {meter.meterSize}")
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Technician"
          name="assignedTo"
          size="small"
          value={formData.assignedTo}
          onChange={handleInputChange}
          sx={{ width: 200, mb: 2 }}
          disabled={loading}
        >
          <MenuItem value="">Select Technician</MenuItem>
          {technicians.map((technician) => (
            <MenuItem key={technician.id} value={technician.id}>
              {technician.firstName} {technician.lastName}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Tariff Category"
          name="tariffCategoryId"
          size="small"
          value={formData.tariffCategoryId}
          onChange={handleInputChange}
          sx={{ width: 200, mb: 2 }}
          disabled={loading}
        >
          <MenuItem value="">Select Tariff Category</MenuItem>
          {tariffCategories.length > 0 ? (
            tariffCategories.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                {category.name}
              </MenuItem>
            ))
          ) : (
            <MenuItem value="" disabled>
              No tariff categories available
            </MenuItem>
          )}
        </TextField>
        <TextField
          label="Due Date"
          type="date"
          name="dueDate"
          size="small"
          value={formData.dueDate}
          onChange={handleInputChange}
          InputLabelProps={{ shrink: true }}
          sx={{ width: 200, mb: 2 }}
          disabled={loading}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleCreateTask}
          disabled={loading || !formData.meterId || !formData.assignedTo || !formData.dueDate || !formData.tariffCategoryId}
        >
          {loading ? <CircularProgress size={24} /> : "Create Connection Task"}
        </Button>
      </Box>

      <Button
        variant="outlined"
        color="secondary"
        onClick={onBack}
        sx={{ mt: 2, mr: 2 }}
      >
        Back to Details
      </Button>
      <Button
        variant="outlined"
        color="primary"
        onClick={onClose}
        sx={{
          mt: 2,
          borderColor: (theme) => theme.palette.primary.main,
          color: (theme) => theme.palette.primary.contrastText,
          "&:hover": {
            borderColor: (theme) => theme.palette.primary.dark,
            backgroundColor: (theme) => theme.palette.primary.main,
            color: (theme) => theme.palette.primary.contrastText,
          },
        }}
      >
        Close
      </Button>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

AssignMeterConnectionTask.propTypes = {
  applicationId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onClose: PropTypes.func.isRequired,
  fetchApplications: PropTypes.func,
  onBack: PropTypes.func.isRequired,
};

export default AssignMeterConnectionTask;