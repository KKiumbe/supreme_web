import React from "react";
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Chip,
  Divider,
  Grid,
  Button,
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

  const getPriorityColor = (priority) =>
    ({
      HIGH: "error",
      MEDIUM: "warning",
      LOW: "success",
      CRITICAL: "secondary",
    }[priority] || "default");

  return (
    <Box sx={{ p: 3, height: "100%",
        
        
        maxWidth: "500px", // Set smaller maxWidth (400px)
        width: "100%", // Ensure it takes full width up to maxWidth
        mx: "auto",
    
    overflow: "auto",  }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" fontWeight="bold">
          Task Details
        </Typography>
        <IconButton onClick={onClose}>
          <Close />
        </IconButton>
      </Box>
      <Paper sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Avatar
            src={task.imageUrl}
            alt={task.title}
            sx={{ width: 48, height: 48 }}
          >
            {!task.imageUrl && task.title[0].toUpperCase()}
          </Avatar>
          <Typography variant="h5" fontWeight="bold">
            {task.title}
          </Typography>
        </Box>
        <Divider sx={{ mb: 3 }} />

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
            <Chip
              label={task.status}
              color={getStatusColor(task.status)}
              size="small"
            />
          </Grid>
          <Grid item xs={6}>
            <Typography variant="subtitle1" fontWeight="bold">
              Priority
            </Typography>
            <Chip
              label={task.priority}
              color={getPriorityColor(task.priority)}
              size="small"
            />
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
            <Typography>
              {task.dueDate ? dayjs(task.dueDate).format("MMM D, YYYY") : "-"}
            </Typography>
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
            <Typography>
              {task.updatedAt ? dayjs(task.updatedAt).format("MMM D, YYYY") : "-"}
            </Typography>
          </Grid>
          {task.NewCustomerApplication && (
            <>
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold" mt={2}>
                  Customer Details
                </Typography>
                <Divider sx={{ my: 1 }} />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Customer Name
                </Typography>
                <Typography>{task.NewCustomerApplication.name}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Phone Number
                </Typography>
                <Typography>{task.NewCustomerApplication.phoneNumber || "-"}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Email
                </Typography>
                <Typography>{task.NewCustomerApplication.email || "-"}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle1" fontWeight="bold">
                  National ID
                </Typography>
                <Typography>{task.NewCustomerApplication.nationalId || "-"}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Address
                </Typography>
                <Typography>{task.NewCustomerApplication.address || "-"}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Plot Number
                </Typography>
                <Typography>{task.NewCustomerApplication.plotNumber || "-"}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Landmark
                </Typography>
                <Typography>{task.NewCustomerApplication.landmark || "-"}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Coordinates
                </Typography>
                <Typography>
                  {task.NewCustomerApplication.latitude && task.NewCustomerApplication.longitude
                    ? `${task.NewCustomerApplication.latitude}, ${task.NewCustomerApplication.longitude}`
                    : "-"}
                </Typography>
              </Grid>
            </>
          )}
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
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold" mt={2}>
              Attachments
            </Typography>
            <Typography>
              {task.Attachments.length > 0 ? task.Attachments.length + " files" : "No attachments"}
            </Typography>
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
