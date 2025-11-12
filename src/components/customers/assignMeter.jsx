import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  Chip,
  Snackbar,
  Alert,
  useMediaQuery,
  IconButton,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import axios from "axios";
import dayjs from "dayjs";
import { getTheme } from "../../store/theme";
import PropTypes from "prop-types";

const API_URL = import.meta.env.VITE_BASE_URL;

const CustomerDetailsView = ({ applicationId, onClose, onAssignTask }) => {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "error" });
  const theme = getTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Fetch customer details
  const fetchCustomerDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/new-customers-details/${applicationId}`, {
        withCredentials: true,
      });
      if (response.data.success) {
        setCustomer(response.data.data);
      } else {
        setError("Failed to fetch customer details");
        setSnackbar({ open: true, message: "Failed to fetch customer details", severity: "error" });
      }
    } catch (err) {
      setError("Error fetching customer details: " + err.message);
      setSnackbar({ open: true, message: "Error fetching customer details", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (applicationId) {
      fetchCustomerDetails();
    }
  }, [applicationId]);

  // Status color (APPROVED)
  const getStatusColor = () => "success";

  // Task status and priority colors
  const getTaskStatusColor = (status) =>
    ({
      PENDING: "warning",
      ASSIGNED: "info",
      IN_PROGRESS: "primary",
      COMPLETED: "success",
      FAILED: "error",
    }[status] || "default");

  const getPriorityColor = (priority) =>
    ({
      HIGH: "error",
      MEDIUM: "warning",
      LOW: "success",
      CRITICAL: "secondary",
    }[priority] || "default");

  if (loading && !customer) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={5}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
        <Button variant="outlined" onClick={onClose} sx={{ mt: 2 }}>
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
  }

  if (!customer) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>No customer selected</Typography>
      </Box>
    );
  }

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
          Approved Customer Details
        </Typography>
        <IconButton onClick={onClose}>
          <Close />
        </IconButton>
      </Box>

      <Box mb={2}>
        <Typography variant="subtitle1" fontWeight="bold">Personal Information</Typography>
        <Typography><strong>Name:</strong> {customer.name}</Typography>
        <Typography><strong>Phone:</strong> {customer.phoneNumber}</Typography>
        <Typography><strong>Email:</strong> {customer.email || "-"}</Typography>
        <Typography><strong>National ID:</strong> {customer.nationalId || "-"}</Typography>
        <Typography><strong>Gender:</strong> {customer.gender || "-"}</Typography>
      </Box>

      <Box mb={2}>
        <Typography variant="subtitle1" fontWeight="bold">Location Information</Typography>
        <Typography><strong>Plot Number:</strong> {customer.plotNumber || "-"}</Typography>
        <Typography><strong>Address:</strong> {customer.address || "-"}</Typography>
        <Typography><strong>Scheme:</strong> {customer.schemeName || "-"}</Typography>
        <Typography><strong>Zone:</strong> {customer.zoneName || "-"}</Typography>
        <Typography><strong>Route:</strong> {customer.routeName || "-"}</Typography>
        <Typography>
          <strong>Coordinates:</strong>{" "}
          {customer.latitude && customer.longitude
            ? `${customer.latitude}, ${customer.longitude}`
            : "-"}
        </Typography>
      </Box>

      <Box mb={2}>
        <Typography variant="subtitle1" fontWeight="bold">Status</Typography>
        <Typography>
          <strong>Status:</strong>{" "}
          <Chip label={customer.status} color={getStatusColor()} size="small" />
        </Typography>
        <Typography>
          <strong>Water Connectable:</strong> {customer.isWaterConnectable ? "Yes" : "No"}
        </Typography>
        <Typography>
          <strong>Distance from Pipeline:</strong> {customer.approximateDistanceFromPipeLine || "-"}
        </Typography>
        <Typography><strong>Notes:</strong> {customer.notes || "-"}</Typography>
        <Typography><strong>Created At:</strong> {dayjs(customer.createdAt).format("MMM D, YYYY")}</Typography>
        <Typography><strong>Updated At:</strong> {dayjs(customer.updatedAt).format("MMM D, YYYY")}</Typography>
      </Box>

      {customer.approvalRecord?.length > 0 && (
        <Box mb={2}>
          <Typography variant="subtitle1" fontWeight="bold">Approval History</Typography>
          {customer.approvalRecord.map((record) => (
            <Box key={record.id} sx={{ ml: 2, mb: 1, p: 1, border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
              <Typography>
                {record.decision} by User ID {record.approvedBy} on{" "}
                {dayjs(record.createdAt).format("MMM D, YYYY")}
              </Typography>
              <Typography><strong>Remarks:</strong> {record.remarks || "-"}</Typography>
            </Box>
          ))}
        </Box>
      )}

      {customer.tasks?.length > 0 && (
        <Box mb={2}>
          <Typography variant="subtitle1" fontWeight="bold">Tasks</Typography>
          {customer.tasks.map((task) => (
            <Box key={task.id} sx={{ ml: 2, mb: 1, p: 1, border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
              <Typography><strong>Title:</strong> {task.title}</Typography>
              <Typography><strong>Description:</strong> {task.description || "-"}</Typography>
              <Typography>
                <strong>Status:</strong>{" "}
                <Chip label={task.status} color={getTaskStatusColor(task.status)} size="small" />
              </Typography>
              <Typography>
                <strong>Priority:</strong>{" "}
                <Chip label={task.priority} color={getPriorityColor(task.priority)} size="small" />
              </Typography>
              <Typography><strong>Assigned At:</strong> {task.AssignedAt ? dayjs(task.AssignedAt).format("MMM D, YYYY") : "-"}</Typography>
              <Typography><strong>Due Date:</strong> {task.dueDate ? dayjs(task.dueDate).format("MMM D, YYYY") : "-"}</Typography>
              <Typography><strong>Survey Notes:</strong> {task.RelatedSurveyId ? customer.surveys.find((s) => s.id === task.RelatedSurveyId)?.notes || "-" : "-"}</Typography>
              <Typography>
                <strong>Pipeline Nearby:</strong>{" "}
                {task.RelatedSurveyId ? (customer.surveys.find((s) => s.id === task.RelatedSurveyId)?.pipelineNearby ? "Yes" : "No") : "-"}
              </Typography>
              <Typography>
                <strong>Survey Photo:</strong>{" "}
                {task.RelatedSurveyId && customer.surveys.find((s) => s.id === task.RelatedSurveyId)?.photoUrl ? (
                  <a
                    href={customer.surveys.find((s) => s.id === task.RelatedSurveyId).photoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View
                  </a>
                ) : (
                  "-"
                )}
              </Typography>
              <Typography>
                <strong>Survey Officer:</strong>{" "}
                {task.RelatedSurveyId ? customer.surveys.find((s) => s.id === task.RelatedSurveyId)?.officerId || "-" : "-"}
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      {customer.surveys?.length > 0 && (
        <Box mb={2}>
          <Typography variant="subtitle1" fontWeight="bold">Surveys</Typography>
          {customer.surveys.map((survey) => (
            <Box key={survey.id} sx={{ ml: 2, mb: 1, p: 1, border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
              <Typography><strong>Notes:</strong> {survey.notes || "-"}</Typography>
              <Typography><strong>Pipeline Nearby:</strong> {survey.pipelineNearby ? "Yes" : "No"}</Typography>
              <Typography>
                <strong>Photo:</strong>{" "}
                {survey.photoUrl ? (
                  <a href={survey.photoUrl} target="_blank" rel="noopener noreferrer">
                    View
                  </a>
                ) : (
                  "-"
                )}
              </Typography>
              <Typography><strong>Officer ID:</strong> {survey.officerId || "-"}</Typography>
              <Typography><strong>Verified At:</strong> {survey.verifiedAt ? dayjs(survey.verifiedAt).format("MMM D, YYYY") : "-"}</Typography>
            </Box>
          ))}
        </Box>
      )}

      <Button
        variant="contained"
        color="primary"
        onClick={onAssignTask}
        sx={{ mb: 2 }}
      >
        Assign Meter Connection Task
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

CustomerDetailsView.propTypes = {
  applicationId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onClose: PropTypes.func.isRequired,
  onAssignTask: PropTypes.func.isRequired,
};

export default CustomerDetailsView;