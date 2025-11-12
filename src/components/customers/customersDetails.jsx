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
  TextField,
  MenuItem,
  IconButton,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import axios from "axios";
import dayjs from "dayjs";
import { getTheme } from "../../store/theme";
import PropTypes from "prop-types";

const API_URL = import.meta.env.VITE_BASE_URL;

const CustomerDetails = ({ applicationId, onClose, fetchApplications }) => {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "error" });
  const [decision, setDecision] = useState("");
  const [remarks, setRemarks] = useState("");
  const theme = getTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Flatten customer data
  const flattenCustomer = (data) => ({
    ...data,
    schemeName: data.scheme?.name || "-",
    zoneName: data.zone?.name || "-",
    routeName: data.route?.name || "-",
    tasks: data.tasks.map((task) => ({
      ...task,
      assigneeName: task.Assignee
        ? `${task.Assignee.firstName} ${task.Assignee.lastName}`
        : "-",
      relatedSurveyNotes: task.RelatedSurvey?.notes || "-",
      relatedSurveyPipelineNearby: task.RelatedSurvey?.pipelineNearby ? "Yes" : "No",
      relatedSurveyPhotoUrl: task.RelatedSurvey?.photoUrl || "-",
      officerName: task.RelatedSurvey?.Officer
        ? `${task.RelatedSurvey.Officer.firstName} ${task.RelatedSurvey.Officer.lastName}`
        : "-",
      createdAt: task.createdAt ? dayjs(task.createdAt).format("MMM D, YYYY") : "-",
      updatedAt: task.updatedAt ? dayjs(task.updatedAt).format("MMM D, YYYY") : "-",
    })),
    surveys: data.surveys.map((survey) => ({
      ...survey,
      officerName: survey.Officer
        ? `${survey.Officer.firstName} ${survey.Officer.lastName}`
        : "-",
      pipelineNearby: survey.pipelineNearby ? "Yes" : "No",
      verifiedAt: survey.verifiedAt ? dayjs(survey.verifiedAt).format("MMM D, YYYY") : "-",
    })),
    createdAt: data.createdAt ? dayjs(data.createdAt).format("MMM D, YYYY") : "-",
    updatedAt: data.updatedAt ? dayjs(data.updatedAt).format("MMM D, YYYY") : "-",
  });

  // Fetch customer details
  const fetchCustomerDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/new-customers-details/${applicationId}`, {
        withCredentials: true,
      });
      if (response.data.success) {
        setCustomer(flattenCustomer(response.data.data));
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

  // Handle approve/reject submission
  const handleSubmitDecision = async () => {
    if (!decision) {
      setSnackbar({ open: true, message: "Please select a decision", severity: "warning" });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.put(
        `${API_URL}/approve-customer-application/${applicationId}/approve`,
        { decision, remarks },
        { withCredentials: true }
      );

      if (response.data.success) {
        setSnackbar({
          open: true,
          message: response.data.message,
          severity: "success",
        });
        // Refresh customer details and parent application list
        await fetchCustomerDetails();
        if (fetchApplications) {
          fetchApplications();
        }
      } else {
        setSnackbar({ open: true, message: response.data.message, severity: "error" });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Error submitting decision: " + error.response?.data?.message || error.message,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Status colors
  const getStatusColor = (status) =>
    ({
      PENDING: "warning",
      SURVEY_SCHEDULED: "info",
      SURVEY_COMPLETED: "primary",
      APPROVED: "success",
      REJECTED: "error",
      CONVERTED: "secondary",
    }[status] || "default");

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
          Customer Application Details
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
        <Typography><strong>Landmark:</strong> {customer.landmark || "-"}</Typography>
        <Typography><strong>Scheme:</strong> {customer.schemeName}</Typography>
        <Typography><strong>Zone:</strong> {customer.zoneName}</Typography>
        <Typography><strong>Route:</strong> {customer.routeName}</Typography>
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
          <Chip label={customer.status} color={getStatusColor(customer.status)} size="small" />
        </Typography>
        <Typography>
          <strong>Approvals:</strong>{" "}
          {customer.approvalRecord?.length || 0}/{customer.numberOfAprovalsNeeded}
        </Typography>
        <Typography>
          <strong>Water Connectable:</strong> {customer.isWaterConnectable ? "Yes" : "No"}
        </Typography>
        <Typography>
          <strong>Distance from Pipeline:</strong> {customer.approximateDistanceFromPipeLine || "-"}
        </Typography>
        <Typography><strong>Notes:</strong> {customer.notes || "-"}</Typography>
        <Typography><strong>Created At:</strong> {customer.createdAt}</Typography>
        <Typography><strong>Updated At:</strong> {customer.updatedAt}</Typography>
      </Box>

      {customer.tasks.length > 0 && (
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
              <Typography><strong>Assignee:</strong> {task.assigneeName}</Typography>
              <Typography><strong>Related Survey Notes:</strong> {task.relatedSurveyNotes}</Typography>
              <Typography>
                <strong>Pipeline Nearby:</strong> {task.relatedSurveyPipelineNearby}
              </Typography>
              <Typography>
                <strong>Survey Photo:</strong>{" "}
                {task.relatedSurveyPhotoUrl !== "-" ? (
                  <a href={task.relatedSurveyPhotoUrl} target="_blank" rel="noopener noreferrer">
                    View
                  </a>
                ) : (
                  "-"
                )}
              </Typography>
              <Typography><strong>Survey Officer:</strong> {task.officerName}</Typography>
              <Typography><strong>Created At:</strong> {task.createdAt}</Typography>
              <Typography><strong>Updated At:</strong> {task.updatedAt}</Typography>
            </Box>
          ))}
        </Box>
      )}

      {customer.surveys.length > 0 && (
        <Box mb={2}>
          <Typography variant="subtitle1" fontWeight="bold">Surveys</Typography>
          {customer.surveys.map((survey) => (
            <Box key={survey.id} sx={{ ml: 2, mb: 1, p: 1, border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
              <Typography><strong>Notes:</strong> {survey.notes || "-"}</Typography>
              <Typography><strong>Pipeline Nearby:</strong> {survey.pipelineNearby}</Typography>
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
              <Typography><strong>Officer:</strong> {survey.officerName}</Typography>
              <Typography><strong>Verified At:</strong> {survey.verifiedAt}</Typography>
              <Typography><strong>Approved:</strong> {survey.approved ? "Yes" : "No"}</Typography>
            </Box>
          ))}
        </Box>
      )}

      {/* Approval/Rejection Form */}
      {customer.status !== "APPROVED" && customer.status !== "REJECTED" && (
        <Box mb={2}>
          <Typography variant="subtitle1" fontWeight="bold">Review Application</Typography>
          <TextField
            select
            label="Decision"
            size="small"
            value={decision}
            onChange={(e) => setDecision(e.target.value)}
            sx={{ width: 200, mb: 2 }}
          >
            <MenuItem value="APPROVE">Approve</MenuItem>
            <MenuItem value="REJECT">Reject</MenuItem>
          </TextField>
          <TextField
            label="Remarks"
            multiline
            rows={4}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmitDecision}
            disabled={loading || !decision}
          >
            {loading ? <CircularProgress size={24} /> : "Submit Decision"}
          </Button>
        </Box>
      )}

      {/* Approval History */}
      {customer.approvalRecord?.length > 0 && (
        <Box mb={2}>
          <Typography variant="subtitle1" fontWeight="bold">Approval History</Typography>
          {customer.approvalRecord.map((record) => (
            <Box key={record.id} sx={{ ml: 2, mb: 1, p: 1, border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
              <Typography>
                {record.decision} by {record.user?.firstName} {record.user?.lastName} on{" "}
                {dayjs(record.createdAt).format("MMM D, YYYY")}
              </Typography>
              <Typography><strong>Remarks:</strong> {record.remarks || "-"}</Typography>
            </Box>
          ))}
        </Box>
      )}

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

CustomerDetails.propTypes = {
  applicationId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onClose: PropTypes.func.isRequired,
  fetchApplications: PropTypes.func,
};

export default CustomerDetails;