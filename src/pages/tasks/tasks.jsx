import React, { useEffect, useState } from "react";
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
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { Add, Refresh, Visibility } from "@mui/icons-material";
import { Chip } from "@mui/material";
import axios from "axios";
import dayjs from "dayjs";
import AssignTaskDialog from "../../components/tasks/createTasks";

import { getTheme } from "../../store/theme";
import TaskDetails from "../../components/tasks/tasksDetails";

const API_URL = import.meta.env.VITE_BASE_URL;

const TaskBoard = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState({ status: "", search: "" });
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(null);
  const theme = getTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Flatten task data
  const flattenTask = (task) => ({
    ...task,
    typeName: task.Type?.name || "-", // Flatten Type.name
    assigneeName: task.Assignee
      ? `${task.Assignee.firstName} ${task.Assignee.lastName}`
      : "Unassigned", // Flatten Assignee
    createdByName: task.CreatedByUser
      ? `${task.CreatedByUser.firstName} ${task.CreatedByUser.lastName}`
      : "Unknown", // Flatten CreatedByUser

      
  });

  // Fetch tasks
  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/get-tasks`, {
        withCredentials: true,
        params: filter.status ? { status: filter.status } : {},
      });
      // Flatten tasks before setting state
      const flattenedTasks = (response.data || []).map(flattenTask);
      setTasks(flattenedTasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch task details (keep original nested structure for TaskDetails)
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
  }, [filter.status]);

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

  // Filter and search handlers
  const handleSearch = (e) => {
    setFilter((prev) => ({ ...prev, search: e.target.value }));
  };

  const filteredTasks = tasks.filter((task) =>
    task.title.toLowerCase().includes(filter.search.toLowerCase())
  );

  // Dialog handlers
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

  // Handle task selection
  const handleSelectTask = (taskId) => {
    if (selectedTaskId === taskId) {
      setSelectedTaskId(null);
      setSelectedTask(null);
    } else {
      setSelectedTaskId(taskId);
      fetchTaskDetails(taskId);
    }
  };

  // Handle close details
  const handleCloseDetails = () => {
    setSelectedTaskId(null);
    setSelectedTask(null);
    setDetailsError(null);
  };

  // DataGrid columns
  const columns = [
     {
      field: "actions",
      headerName: "Actions",
      width: 20,
      align: "center",

        renderCell: (params) => (
                <IconButton
                  color="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectTask(params.row.id);
                  }}
                >
                  <Visibility />
                </IconButton>
              ),
     
  
     
    },
    {
      field: "title",
      headerName: "Title",
      width: 200,
     
    },
    {
      field: "typeName",
      headerName: "Type",
      width: 150,
    },
    {
      field: "priority",
      headerName: "Priority",
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params?.row?.priority}
          color={getPriorityColor(params.row.priority)}
          size="small"
        />
      ),
    },
    {
      field: "status",
      headerName: "Status",
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params?.row?.status}
          color={getStatusColor(params.row.status)}
          size="small"
        />
      ),
    },
    {
      field: "assigneeName",
      headerName: "Assignee",
      width: 150,
    },
    {
      field: "createdByName",
      headerName: "Created By",
      width: 150,
    },
    {
      field: "dueDate",
      headerName: "Due Date",
      width: 120,
      valueGetter: (params) =>
        params?.row?.dueDate ? dayjs(params?.row?.dueDate).format("MMM D, YYYY") : "-",
    },
    {
      field: "createdAt",
      headerName: "Created At",
      width: 120,
      valueGetter: (params) => dayjs(params?.row?.createdAt).format("MMM D, YYYY"),
    },
   
  ];

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
      {/* Left Side: Task List */}
      <Box
        sx={{
          flex: isMobile ? "1" : selectedTask ? "0 0 50%" : "1",
          transition: "flex 0.3s ease",
          overflow: "auto",
          mb: isMobile && selectedTask ? 2 : 0,
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
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
            variant="outlined"
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
            onChange={(e) => setFilter((prev) => ({ ...prev, status: e.target.value }))}
            sx={{ width: 200 }}
          >
            <MenuItem value="">All</MenuItem>
            {["PENDING", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "FAILED"].map((status) => (
              <MenuItem key={status} value={status}>
                {status.charAt(0) + status.slice(1).toLowerCase()}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        {/* Data Grid */}
        <Paper sx={{ p: 1, height: "calc(100% - 120px)" }}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" p={5}>
              <CircularProgress />
            </Box>
          ) : (
            <DataGrid
              rows={filteredTasks}
              columns={columns}
              pageSize={10}
              rowsPerPageOptions={[10, 25, 50]}
              onRowClick={(params) => handleSelectTask(params.row.id)}
              disableSelectionOnClick
              sx={{ height: "100%" }}
              getRowId={(row) => row.id}
            />
          )}
        </Paper>
      </Box>

      {/* Right Side: Task Details */}
      <Box
        sx={{
          flex: isMobile ? "1" : selectedTask ? "0 0 500px" : "0 0 0",
          transition: "flex 0.3s ease",
          overflow: "auto",
          //borderLeft: !isMobile && selectedTask ? `1px solid ${theme.palette.divider}` : "none",
          display: selectedTask || isMobile ? "block" : "none",
        }}
      >
        {detailsLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" p={5}>
            <CircularProgress />
          </Box>
        ) : detailsError ? (
          <Box sx={{ p: 3 }}>
            <Typography color="error">{detailsError}</Typography>
            <Button
              variant="outlined"
              onClick={handleCloseDetails}
              sx={{ mt: 2 }}
            >
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

      {/* Assign Task Dialog */}
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