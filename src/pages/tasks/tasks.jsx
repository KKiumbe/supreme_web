import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Button,
  TextField,
  MenuItem,
  IconButton,
  useMediaQuery,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import {
  Add,
  Refresh,
  Visibility,
  Cancel,
  CheckCircle,
} from "@mui/icons-material";
import dayjs from "dayjs";
import { toast } from "react-toastify";

import AssignTaskDialog from "../../components/tasks/createTasks";
import TaskDetails from "../../components/tasks/tasksDetails";
import { getTheme } from "../../store/theme";
import apiClient from "../../services/apiClient";
import {
  PermissionDeniedUI,
  isPermissionDenied,
} from "../../utils/permissionHelper";

const TaskBoard = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  const [totalItems, setTotalItems] = useState(0);

  const [filter, setFilter] = useState({ status: "", search: "" });

  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const [selectedTask, setSelectedTask] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(null);

  // Complete & Cancel dialogs
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const theme = getTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  /* --------------------------------------
   * 🔧 Helpers
   * ------------------------------------ */
  const flattenTask = (task) => ({
    ...task,
    typeName: task.Type?.name || "-",
    assigneeName: task.Assignee
      ? `${task.Assignee.firstName} ${task.Assignee.lastName}`
      : "Unassigned",
    createdByName: task.CreatedByUser
      ? `${task.CreatedByUser.firstName} ${task.CreatedByUser.lastName}`
      : "Unknown",
  });

  const getStatusColor = (status) =>
    ({
      PENDING: "warning",
      ASSIGNED: "info",
      IN_PROGRESS: "primary",
      COMPLETED: "success",
      FAILED: "error",
    })[status] || "default";

  const getPriorityColor = (priority) =>
    ({
      HIGH: "error",
      MEDIUM: "warning",
      LOW: "success",
      CRITICAL: "secondary",
    })[priority] || "default";

  /* --------------------------------------
   * 📦 Fetch Tasks (SERVER search + pagination)
   * ------------------------------------ */

  const fetchTasks = useCallback(async () => {
    setLoading(true);

    try {
      const response = await apiClient.get("/get-tasks", {
        params: {
          page: paginationModel.page + 1, // API is 1-based
          limit: paginationModel.pageSize,
          status: filter.status || undefined,
          q: filter.search?.trim() || undefined,
        },
      });

      const { data, pagination } = response.data;

      setTasks(data.map(flattenTask));
      setTotalItems(pagination.totalItems);
      setPermissionDenied(false);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      if (isPermissionDenied(error)) {
        setPermissionDenied(true);
        setTasks([]);
      } else {
        toast.error("Failed to load tasks");
      }
    } finally {
      setLoading(false);
    }
  }, [
    paginationModel.page,
    paginationModel.pageSize,
    filter.status,
    filter.search,
  ]);

  /* --------------------------------------
   * 🔍 Task Details
   * ------------------------------------ */
  const fetchTaskDetails = async (taskId) => {
    setDetailsLoading(true);
    setDetailsError(null);
    try {
      const response = await apiClient.get(`/get-task/${taskId}`);

      if (response.data.success) {
        setSelectedTask(response.data.data);
      } else {
        setDetailsError("Failed to fetch task details");
      }
    } catch (err) {
      setDetailsError("Error fetching task details: " + err.message);
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [
    fetchTasks, // ← keep this (it's stable thanks to useCallback)
    paginationModel.page, // important triggers
    paginationModel.pageSize,
    filter.status,
    filter.search,
  ]);

  /* --------------------------------------
   * 🧭 Handlers
   * ------------------------------------ */
  const handleSearch = (e) => {
    setFilter((prev) => ({ ...prev, search: e.target.value }));
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  };

  const openAssignDialog = (taskId = null) => {
    setSelectedTaskId(taskId);
    setAssignDialogOpen(true);
  };

  const closeAssignDialog = () => {
    setAssignDialogOpen(false);
    setSelectedTaskId(null);
  };

  const handleAssigned = () => {
    closeAssignDialog();
    fetchTasks();
  };

  const handleSelectTask = (taskId) => {
    if (selectedTaskId === taskId) {
      setSelectedTaskId(null);
      setSelectedTask(null);
    } else {
      setSelectedTaskId(taskId);
      fetchTaskDetails(taskId);
    }
  };

  const handleCloseDetails = () => {
    setSelectedTaskId(null);
    setSelectedTask(null);
    setDetailsError(null);
  };

  /* --------------------------------------
   * ❌ Cancel Task
   * ------------------------------------ */
  const handleCancelTask = async () => {
    if (!selectedTaskId) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await apiClient.patch(
        `/tasks/${selectedTaskId}/cancel`,
        {},
      );

      if (response.data.success) {
        toast.success("Task cancelled successfully");
        setCancelDialogOpen(false);
        fetchTasks();
        if (selectedTask) {
          fetchTaskDetails(selectedTaskId); // Refresh details
        }
      }
    } catch (error) {
      console.error("Error cancelling task:", error);
      toast.error(error.response?.data?.message || "Failed to cancel task");
    } finally {
      setActionLoading(false);
    }
  };

  /* --------------------------------------
   * ✅ Complete Task
   * ------------------------------------ */
  const handleCompleteTask = async () => {
    if (!selectedTaskId) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await apiClient.patch(
        `/tasks/${selectedTaskId}/complete`,
        {},
      );

      if (response.data.success) {
        toast.success("Task completed successfully");
        setCompleteDialogOpen(false);
        fetchTasks();
        if (selectedTask) {
          fetchTaskDetails(selectedTaskId); // Refresh details
        }
      }
    } catch (error) {
      console.error("Error completing task:", error);
      toast.error(error.response?.data?.message || "Failed to complete task");
    } finally {
      setActionLoading(false);
    }
  };

  /* --------------------------------------
   * 📊 Columns
   * ------------------------------------ */
  const columns = [
    {
      field: "actions",
      headerName: "Actions",
      width: 150,
      align: "center",
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <IconButton
            color="primary"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleSelectTask(params?.row?.id);
            }}
            title="View Details"
          >
            <Visibility fontSize="small" />
          </IconButton>
          <IconButton
            color="success"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTaskId(params?.row?.id);
              setCompleteDialogOpen(true);
            }}
            disabled={
              params?.row?.status === "CANCELLED" ||
              params?.row?.status === "COMPLETED"
            }
            title="Mark as Complete"
          >
            <CheckCircle fontSize="small" />
          </IconButton>
          <IconButton
            color="warning"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTaskId(params?.row?.id);
              setCancelDialogOpen(true);
            }}
            disabled={
              params?.row?.status === "CANCELLED" ||
              params?.row?.status === "COMPLETED"
            }
            title="Cancel Task"
          >
            <Cancel fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
    { field: "title", headerName: "Title", width: 200 },
    { field: "typeName", headerName: "Type", width: 150 },
    {
      field: "priority",
      headerName: "Priority",
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params?.row?.priority}
          color={getPriorityColor(params?.row?.priority)}
          size="small"
        />
      ),
    },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params?.row?.status}
          color={getStatusColor(params?.row?.status)}
          size="small"
        />
      ),
    },
    { field: "assigneeName", headerName: "Assignee", width: 180 },
    { field: "createdByName", headerName: "Created By", width: 180 },
    {
      field: "dueDate",
      headerName: "Due Date",
      width: 150,
      renderCell: (params) => {
        const dueDate = params?.row?.dueDate;
        if (!dueDate) {
          return "-";
        }
        return dayjs(dueDate).format("MMM D, YYYY");
      },
    },
    {
      field: "createdAt",
      headerName: "Created At",
      width: 150,
      renderCell: (params) => {
        const createdAt = params?.row?.createdAt;
        if (!createdAt) {
          return "-";
        }
        return dayjs(createdAt).format("MMM D, YYYY");
      },
    },
  ];

  /* --------------------------------------
   * 🖥️ Render
   * ------------------------------------ */
  return (
    <Box
      sx={{
        p: 3,
        display: isMobile ? "block" : "flex",
        gap: 2,
        height: "calc(100vh - 64px)",
        overflow: "auto",
        maxWidth: "100vw",
      }}
    >
      {permissionDenied ? (
        <PermissionDeniedUI permission="tasks:view" />
      ) : (
        <>
          {/* Left Side */}
          <Box
            sx={{
              flex: isMobile ? "1" : selectedTask ? "0 0 50%" : "1",
              transition: "flex 0.3s ease",
            }}
          >
            <Box display="flex" justifyContent="space-between" mb={3}>
              <Typography variant="h6" fontWeight="bold">
                Task Board
              </Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => openAssignDialog()}
                >
                  Create Task
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={fetchTasks}
                >
                  Refresh
                </Button>
              </Box>
            </Box>

            {/* Filters */}
            <Box display="flex" gap={1} mb={3}>
              <TextField
                label="Search Task"
                size="small"
                value={filter.search}
                onChange={handleSearch}
                sx={{ width: 250 }}
              />
              <TextField
                select
                label="Status"
                size="small"
                value={filter.status}
                onChange={(e) => {
                  setFilter((prev) => ({ ...prev, status: e.target.value }));
                  setPaginationModel((prev) => ({ ...prev, page: 0 }));
                }}
                sx={{ width: 200 }}
              >
                <MenuItem value="">All</MenuItem>
                {[
                  "PENDING",
                  "ASSIGNED",
                  "IN_PROGRESS",
                  "COMPLETED",
                  "FAILED",
                ].map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Paper sx={{ p: 1, height: "calc(100% - 120px)" }}>
              {loading ? (
                <Box display="flex" justifyContent="center" p={5}>
                  <CircularProgress />
                </Box>
              ) : (
                <DataGrid
                  rows={tasks}
                  columns={columns}
                  loading={loading}
                  paginationMode="server"
                  rowCount={totalItems}
                  paginationModel={paginationModel}
                  onPaginationModelChange={setPaginationModel}
                  pageSizeOptions={[10, 25, 50]}
                  getRowId={(row) => row.id}
                  disableSelectionOnClick
                  sx={{ height: "100%" }}
                />
              )}
            </Paper>
          </Box>

          {/* Right Side */}
          <Box
            sx={{
              flex: isMobile ? "1" : selectedTask ? "0 0 500px" : "0 0 0",
              transition: "flex 0.3s ease",
              overflow: "auto",
              display: selectedTask || isMobile ? "block" : "none",
            }}
          >
            {detailsLoading ? (
              <Box display="flex" justifyContent="center" p={5}>
                <CircularProgress />
              </Box>
            ) : detailsError ? (
              <Box sx={{ p: 3 }}>
                <Typography color="error">{detailsError}</Typography>
                <Button onClick={handleCloseDetails} sx={{ mt: 2 }}>
                  Close
                </Button>
              </Box>
            ) : selectedTask ? (
              <TaskDetails task={selectedTask} onClose={handleCloseDetails} />
            ) : (
              <Box sx={{ p: 3 }}>
                <Typography>Select a task to view details</Typography>
              </Box>
            )}
          </Box>

          <AssignTaskDialog
            open={assignDialogOpen}
            onClose={closeAssignDialog}
            taskId={selectedTaskId}
            onAssigned={handleAssigned}
            theme={theme}
          />

          {/* Complete Task Dialog */}
          <Dialog
            open={completeDialogOpen}
            onClose={() => !actionLoading && setCompleteDialogOpen(false)}
          >
            <DialogTitle>Complete Task</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Are you sure you want to mark this task as completed? This
                action will set the task status to COMPLETED.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => setCompleteDialogOpen(false)}
                disabled={actionLoading}
              >
                No, Keep Pending
              </Button>
              <Button
                onClick={handleCompleteTask}
                color="success"
                variant="contained"
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <CircularProgress size={20} />
                ) : (
                  "Yes, Mark Complete"
                )}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Cancel Task Dialog */}
          <Dialog
            open={cancelDialogOpen}
            onClose={() => !actionLoading && setCancelDialogOpen(false)}
          >
            <DialogTitle>Cancel Task</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Are you sure you want to cancel this task? This action will set
                the task status to CANCELLED.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => setCancelDialogOpen(false)}
                disabled={actionLoading}
              >
                No, Keep Task
              </Button>
              <Button
                onClick={handleCancelTask}
                color="warning"
                variant="contained"
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <CircularProgress size={20} />
                ) : (
                  "Yes, Cancel Task"
                )}
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Box>
  );
};

export default TaskBoard;
