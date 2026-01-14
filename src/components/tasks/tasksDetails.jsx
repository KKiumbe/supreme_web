import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Chip,
  Divider,
  Grid,
  IconButton,
  TextField,
  InputAdornment,
} from "@mui/material";
import { Close, Search } from "@mui/icons-material";
import dayjs from "dayjs";
import { getTheme } from "../../store/theme";
import PropTypes from "prop-types";

const TaskDetails = ({ task, onClose }) => {
  const theme = getTheme();
  const [searchTerm, setSearchTerm] = useState("");

  const getStatusColor = (status) =>
    ({
      PENDING: "warning",
      ASSIGNED: "info",
      IN_PROGRESS: "primary",
      COMPLETED: "success",
      CANCELLED: "error",
      FAILED: "error",
    }[status] || "default");

  const TASK_STATUS_COLORS = {
    PENDING: "warning",
    ASSIGNED: "info",
    IN_PROGRESS: "primary",
    COMPLETED: "success",
    CANCELLED: "error",
    FAILED: "error",
  };

  const getPriorityColor = (priority) =>
    ({
      HIGH: "error",
      MEDIUM: "warning",
      LOW: "success",
      CRITICAL: "secondary",
    }[priority] || "default");

  // Progress calculation
  const totalConnections = task.taskDetails?.length || 0;
  const completedConnections =
    task.taskDetails?.filter((td) => td.taskStatus === "COMPLETED").length || 0;
  const progressPercent = totalConnections
    ? Math.round((completedConnections / totalConnections) * 100)
    : 0;

  // Filter connections
  const filteredTaskDetails = task.taskDetails?.filter((td) =>
    td.Connection?.connectionNumber
      ?.toString()
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <Box
      sx={{
        p: 3,
        height: "100%",
        maxWidth: "720px",
        width: "100%",
        mx: "auto",
        overflow: "auto",
      }}
    >
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6" fontWeight="bold">
          Task Details
        </Typography>
        <IconButton onClick={onClose}>
          <Close />
        </IconButton>
      </Box>

      <Paper sx={{ p: 3, borderRadius: 2 }}>
        {/* Title & Avatar */}
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Avatar src={task.imageUrl} sx={{ width: 56, height: 56 }}>
            {!task.imageUrl && task.title?.[0]?.toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight="bold">
              {task.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {task.description?.substring(0, 120) || "No description"}
              {task.description?.length > 120 ? "..." : ""}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Quick Stats Row */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={6} sm={3}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Status
            </Typography>
            <Chip
              label={task.status}
              color={getStatusColor(task.status)}
              size="medium"
            />
          </Grid>

          <Grid item xs={6} sm={3}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Priority
            </Typography>
            <Chip
              label={task.priority}
              color={getPriorityColor(task.priority)}
              size="medium"
            />
          </Grid>

          <Grid item xs={6} sm={3}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Progress
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Chip
                label={`${completedConnections}/${totalConnections}`}
                color="primary"
                variant="outlined"
                size="medium"
              />
              <Chip
                label={`${progressPercent}%`}
                color="success"
                size="medium"
              />
            </Box>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Assignee
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {task.Assignee
                ? `${task.Assignee.firstName} ${task.Assignee.lastName}`
                : "Unassigned"}
            </Typography>
          </Grid>
        </Grid>

        {/* Core Dates & Info */}
        <Grid container spacing={2} mb={4}>
          <Grid item xs={6} sm={4}>
            <Typography variant="subtitle2" color="text.secondary">
              Due Date
            </Typography>
            <Typography>
              {task.dueDate ? dayjs(task.dueDate).format("MMM D, YYYY") : "—"}
            </Typography>
          </Grid>
          <Grid item xs={6} sm={4}>
            <Typography variant="subtitle2" color="text.secondary">
              Scheduled At
            </Typography>
            <Typography>
              {task.scheduledAt ? dayjs(task.scheduledAt).format("MMM D, YYYY") : "—"}
            </Typography>
          </Grid>
          <Grid item xs={6} sm={4}>
            <Typography variant="subtitle2" color="text.secondary">
              Created At
            </Typography>
            <Typography>{dayjs(task.createdAt).format("MMM D, YYYY")}</Typography>
          </Grid>
        </Grid>

        {/* Location Details – Prominently grouped */}
        <Box mb={4}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Location Details
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={3}>
            <Grid item xs={6} sm={4}>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                Scheme
              </Typography>
              <Typography variant="body1">
                {task.RelatedScheme?.name || "—"}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={4}>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                Zone
              </Typography>
              <Typography variant="body1">
                {task.RelatedZone?.name || "—"}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={4}>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                Route
              </Typography>
              <Typography variant="body1">
                {task.RelatedRoute?.name || "—"}
              </Typography>
            </Grid>
          </Grid>
        </Box>

        {/* Attachments Summary */}
        <Box mb={4}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Attachments
          </Typography>
          <Typography>
            {task.Attachments?.length > 0
              ? `${task.Attachments.length} file${task.Attachments.length !== 1 ? "s" : ""}`
              : "None"}
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Affected Connections */}
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Affected Connections ({filteredTaskDetails.length} shown)
        </Typography>

        <TextField
          fullWidth
          size="small"
          placeholder="Filter by connection number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 3, maxWidth: 420 }}
        />

        {totalConnections === 0 ? (
          <Typography color="text.secondary" align="center" py={4}>
            No connections affected by this task.
          </Typography>
        ) : filteredTaskDetails.length === 0 ? (
          <Typography color="text.secondary" align="center" py={4}>
            No connections match your search.
          </Typography>
        ) : (
          filteredTaskDetails.map((td) => (
            <Paper
              key={td.id}
              variant="outlined"
              sx={{
                p: 2.5,
                mb: 2,
                borderColor:
                  td.taskStatus === "COMPLETED"
                    ? "success.main"
                    : td.taskStatus === "FAILED" || td.taskStatus === "CANCELLED"
                    ? "error.main"
                    : "grey.300",
              }}
            >
              <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
                <Chip
                  label={td.taskStatus}
                  color={TASK_STATUS_COLORS[td.taskStatus] || "default"}
                  size="small"
                />
                {td.taskStatus === "COMPLETED" && (
                  <Typography variant="caption" color="success.main">
                    Completed
                  </Typography>
                )}
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="text.secondary">
                    Connection No.
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {td.Connection?.connectionNumber || "—"}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="text.secondary">
                    Customer
                  </Typography>
                  <Typography variant="body1">
                    {td.Connection?.customer?.customerName || "—"}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="text.secondary">
                    Plot No.
                  </Typography>
                  <Typography variant="body1">
                    {td.Connection?.plotNumber || "—"}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="text.secondary">
                    Route
                  </Typography>
                  <Typography variant="body1">
                    {td.Connection?.route?.name || "—"}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="text.secondary">
                    Meter Serial
                  </Typography>
                  <Typography variant="body1">
                    {td.Connection?.meter?.serialNumber || "—"}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="text.secondary">
                    Meter Status
                  </Typography>
                  <Typography variant="body1">
                    {td.Connection?.meter?.status || "—"}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          ))
        )}
      </Paper>
    </Box>
  );
};

TaskDetails.propTypes = {
  task: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default TaskDetails;