import React from "react";
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Chip,
  Divider,
  Grid,
  IconButton,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import dayjs from "dayjs";
import { getTheme } from "../../store/theme";
import PropTypes from "prop-types";

const TaskDetails = ({ task, onClose }) => {
  const theme = getTheme();

  // Status and priority colors
  const getStatusColor = (status) =>
    ({
      PENDING: "warning",
      ASSIGNED: "info",
      IN_PROGRESS: "primary",
      COMPLETED: "success",
      FAILED: "error",
    }[status] || "default");



const TASK_STATUS_COLORS = {
  PENDING: "default",
  ASSIGNED: "primary",
  IN_PROGRESS: "warning",
  COMPLETED: "success",
  CANCELLED: "error",
  FAILED: "error",
}

  // Calculate progress
  const totalConnections = task.taskDetails.length;
  const completedConnections = task.taskDetails.filter(
    (td) => td.taskStatus === "COMPLETED"
  ).length;
  const progressPercent = totalConnections
    ? Math.round((completedConnections / totalConnections) * 100)
    : 0;

  const getPriorityColor = (priority) =>
    ({
      HIGH: "error",
      MEDIUM: "warning",
      LOW: "success",
      CRITICAL: "secondary",
    }[priority] || "default");

  return (
    <Box
      sx={{
        p: 3,
        height: "100%",
        maxWidth: "600px",
        width: "100%",
        mx: "auto",
        overflow: "auto",
      }}
    >
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" fontWeight="bold">
          Task Details
        </Typography>
        <IconButton onClick={onClose}>
          <Close />
        </IconButton>
      </Box>

      {/* Task Paper */}
      <Paper sx={{ p: 3 }}>
        {/* Title and Avatar */}
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Avatar src={task.imageUrl} sx={{ width: 48, height: 48 }}>
            {!task.imageUrl && task.title[0].toUpperCase()}
          </Avatar>
          <Typography variant="h5" fontWeight="bold">
            {task.title}
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Task Main Details */}
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold">
              Description
            </Typography>
            <Typography>{task.description || "No description provided"}</Typography>
          </Grid>

          <Grid item xs={6}>
            <Typography variant="subtitle1" fontWeight="bold">
              Status
            </Typography>
            <Chip label={task.status} color={getStatusColor(task.status)} size="small" />
             
          </Grid>

            <Grid item xs={6}>
            <Typography variant="subtitle1" fontWeight="bold">
              Completion Percentage
            </Typography>
            
             <Chip label={progressPercent}  size="small" />
          </Grid>

          <Grid item xs={6}>
            <Typography variant="subtitle1" fontWeight="bold">
              Priority
            </Typography>
            <Chip label={task.priority} color={getPriorityColor(task.priority)} size="small" />
          </Grid>

          <Grid item xs={6}>
            <Typography variant="subtitle1" fontWeight="bold">
              Assignee
            </Typography>
            <Typography>
              {task.Assignee
                ? `${task.Assignee.firstName} ${task.Assignee.lastName} (${task.Assignee.email})`
                : "Unassigned"}
            </Typography>
          </Grid>

          <Grid item xs={6}>
            <Typography variant="subtitle1" fontWeight="bold">
              Created By
            </Typography>
            <Typography>
              {task.CreatedByUser
                ? `${task.CreatedByUser.firstName} ${task.CreatedByUser.lastName}`
                : "Unknown"}
            </Typography>
          </Grid>

          <Grid item xs={6}>
            <Typography variant="subtitle1" fontWeight="bold">
              Due Date
            </Typography>
            <Typography>{task.dueDate ? dayjs(task.dueDate).format("MMM D, YYYY") : "-"}</Typography>
          </Grid>

          <Grid item xs={6}>
            <Typography variant="subtitle1" fontWeight="bold">
              Scheduled At
            </Typography>
            <Typography>
              {task.scheduledAt ? dayjs(task.scheduledAt).format("MMM D, YYYY") : "-"}
            </Typography>
          </Grid>

          <Grid item xs={6}>
            <Typography variant="subtitle1" fontWeight="bold">
              Created At
            </Typography>
            <Typography>{dayjs(task.createdAt).format("MMM D, YYYY")}</Typography>
          </Grid>

          <Grid item xs={6}>
            <Typography variant="subtitle1" fontWeight="bold">
              Updated At
            </Typography>
            <Typography>{task.updatedAt ? dayjs(task.updatedAt).format("MMM D, YYYY") : "-"}</Typography>
          </Grid>

          {/* Location Details */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold" mt={2}>
              Location Details
            </Typography>
            <Divider sx={{ my: 1 }} />
          </Grid>

          <Grid item xs={6}>
            <Typography variant="subtitle1" fontWeight="bold">
              Scheme
            </Typography>
            <Typography>{task.RelatedScheme?.name || "-"}</Typography>
          </Grid>

          <Grid item xs={6}>
            <Typography variant="subtitle1" fontWeight="bold">
              Zone
            </Typography>
            <Typography>{task.RelatedZone?.name || "-"}</Typography>
          </Grid>

          <Grid item xs={6}>
            <Typography variant="subtitle1" fontWeight="bold">
              Route
            </Typography>
            <Typography>{task.RelatedRoute?.name || "-"}</Typography>
          </Grid>

          {/* Attachments */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold" mt={2}>
              Attachments
            </Typography>
            <Typography>
              {task.Attachments.length > 0 ? task.Attachments.length + " files" : "No attachments"}
            </Typography>
          </Grid>

          {/* Affected Connections */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold" mt={2}>
              Affected Connections
            </Typography>
            <Divider sx={{ my: 1 }} />
            {task.taskDetails && task.taskDetails.length > 0 ? (
              task.taskDetails.map((td) => (
                <Paper
                  key={td.id}
                  sx={{
                    p: 2,
                    mb: 2,
                   
                    borderRadius: 1,
                    boxShadow: 1,
                  }}
                >
                  <Chip
                      label={td.taskStatus}
                      color={TASK_STATUS_COLORS[td.taskStatus]}
                      size="small"
                    />
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="body2" fontWeight="bold">
                        Connection Number
                      </Typography>
                      <Typography>{td.Connection?.connectionNumber || "-"}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" fontWeight="bold">
                        Customer
                      </Typography>
                      <Typography>{td.Connection?.customer?.customerName || "-"}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" fontWeight="bold">
                        Plot Number
                      </Typography>
                      <Typography>{td.Connection?.plotNumber || "-"}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" fontWeight="bold">
                        Route
                      </Typography>
                      <Typography>{td.Connection?.route?.name || "-"}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" fontWeight="bold">
                        Meter Serial
                      </Typography>
                      <Typography>{td.Connection?.meter?.serialNumber || "-"}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" fontWeight="bold">
                        Meter Status
                      </Typography>
                      <Typography>{td.Connection?.meter?.status || "-"}</Typography>
                    </Grid>
                  </Grid>
                </Paper>
              ))
            ) : (
              <Typography>No connections affected.</Typography>
            )}
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

TaskDetails.propTypes = {
  task: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default TaskDetails;
