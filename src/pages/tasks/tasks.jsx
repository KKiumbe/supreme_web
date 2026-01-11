import React, { useCallback, useEffect, useState } from "react";
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
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { Add, Refresh, Visibility } from "@mui/icons-material";
import axios from "axios";
import dayjs from "dayjs";

import AssignTaskDialog from "../../components/tasks/createTasks";
import TaskDetails from "../../components/tasks/tasksDetails";
import { getTheme } from "../../store/theme";

const API_URL = import.meta.env.VITE_BASE_URL;

const TaskBoard = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

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
    }[status] || "default");

  const getPriorityColor = (priority) =>
    ({
      HIGH: "error",
      MEDIUM: "warning",
      LOW: "success",
      CRITICAL: "secondary",
    }[priority] || "default");

  /* --------------------------------------
   * 📦 Fetch Tasks (SERVER search + pagination)
   * ------------------------------------ */


const fetchTasks = useCallback(async () => {
  setLoading(true);

  try {
    const response = await axios.get(`${API_URL}/get-tasks`, {
      withCredentials: true,
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
  } catch (error) {
    console.error("Error fetching tasks:", error);
  } finally {
    setLoading(false);
  }
}, [paginationModel.page, paginationModel.pageSize, filter.status, filter.search]);


  /* --------------------------------------
   * 🔍 Task Details
   * ------------------------------------ */
  const fetchTaskDetails = async (taskId) => {
    setDetailsLoading(true);
    setDetailsError(null);
    try {
      const response = await axios.get(`${API_URL}/get-task/${taskId}`, {
        withCredentials: true,
      });

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
  fetchTasks,              // ← keep this (it's stable thanks to useCallback)
  paginationModel.page,    // important triggers
  paginationModel.pageSize,
  filter.status,
  filter.search
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
   * 📊 Columns
   * ------------------------------------ */
  const columns = [
    {
      field: "actions",
      headerName: "View",
      width: 60,
      align: "center",
      renderCell: (params) => (
        <IconButton
          color="primary"
          onClick={(e) => {
            e.stopPropagation();
            handleSelectTask(params?.row?.id);
          }}
        >
          <Visibility />
        </IconButton>
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
      valueGetter: (params) =>
        params?.row?.dueDate
          ? dayjs(params?.row?.dueDate).format("MMM D, YYYY")
          : "-",
    },
    {
      field: "createdAt",
      headerName: "Created At",
      width: 150,
      valueGetter: (params) =>
        dayjs(params?.row?.createdAt).format("MMM D, YYYY"),
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
          <Box>
            <Button
              variant="contained"
              startIcon={<Add />}
              sx={{ mr: 2 }}
              onClick={() => openAssignDialog()}
            >
              Create Task
            </Button>
            <Button variant="outlined" startIcon={<Refresh />} onClick={fetchTasks}>
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
            {["PENDING", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "FAILED"].map(
              (status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              )
            )}
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
    </Box>
  );
};

export default TaskBoard;
