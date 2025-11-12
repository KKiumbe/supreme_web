import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Button,
  TextField,
  IconButton,
  useMediaQuery,
  Snackbar,
  Alert,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { Refresh, Visibility } from "@mui/icons-material";
import { Chip } from "@mui/material";
import axios from "axios";
import dayjs from "dayjs";

import AssignMeterConnectionTask from "../../../components/customerConnection/customerConnection";
import CustomerDetailsView from "../../../components/customers/assignMeter";
import { getTheme } from "../../../store/theme";

const API_URL = import.meta.env.VITE_BASE_URL;

const ApprovedCustomersScreen = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "error" });
  const [filter, setFilter] = useState({
    page: 1,
    limit: 10,
    search: "",
    schemeId: "",
    zoneId: "",
    routeId: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [selectedApplicationId, setSelectedApplicationId] = useState(null);
  const [showAssignTask, setShowAssignTask] = useState(false);
  const theme = getTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Flatten application data
  const flattenApplication = (app) => ({
    ...app,
    schemeName: app.schemeName || "-",
    zoneName: app.zoneName || "-",
    routeName: app.routeName || "-",
    tasks: app.tasks || [],
    surveys: app.surveys || [],
    createdAt: app.createdAt ? dayjs(app.createdAt).format("MMM D, YYYY") : "-",
    updatedAt: app.updatedAt ? dayjs(app.updatedAt).format("MMM D, YYYY") : "-",
  });

  // Fetch approved applications
  const fetchApplications = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/approved-customers`, {
        withCredentials: true,
        params: {
          page: filter.page,
          limit: filter.limit,
          search: filter.search || undefined,
          schemeId: filter.schemeId || undefined,
          zoneId: filter.zoneId || undefined,
          routeId: filter.routeId || undefined,
        },
      });
      if (response.data.success) {
        const flattenedApplications = response.data.data.applications.map(flattenApplication);
        setApplications(flattenedApplications);
        setPagination(response.data.data.pagination);
      } else {
        setSnackbar({ open: true, message: "Failed to fetch approved customers", severity: "error" });
      }
    } catch (error) {
      setSnackbar({ open: true, message: "Error fetching approved customers: " + error.message, severity: "error" });
    } finally {
      setLoading(false);
    }
  }, [filter.page, filter.limit, filter.search, filter.schemeId, filter.zoneId, filter.routeId]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);
  const handleSearch = (e) => {
    setFilter((prev) => ({ ...prev, search: e.target.value, page: 1 }));
  };

  // Handle application selection
  const handleSelectApplication = (applicationId) => {
    if (selectedApplicationId === applicationId) {
      setSelectedApplicationId(null);
      setShowAssignTask(false);
    } else {
      setSelectedApplicationId(applicationId);
      setShowAssignTask(false);
    }
  };

  // Handle close details/task
  const handleClose = () => {
    setSelectedApplicationId(null);
    setShowAssignTask(false);
  };

  // Handle assign task
  const handleAssignTask = () => {
    setShowAssignTask(true);
  };

  // Handle back to details
  const handleBackToDetails = () => {
    setShowAssignTask(false);
  };

  // Status color (APPROVED)
  const getStatusColor = () => "success";

  // DataGrid columns
  const columns = [
    {
      field: "actions",
      headerName: "Actions",
      width: 100,
      align: "center",
      renderCell: (params) => (
        <IconButton
          sx={{ color: theme.palette.primary.main }}
          onClick={(e) => {
            e.stopPropagation();
            handleSelectApplication(params.row.id);
          }}
        >
          <Visibility />
        </IconButton>
      ),
    },
    { field: "name", headerName: "Name", width: 150 },
    { field: "phoneNumber", headerName: "Phone", width: 120 },
    { field: "email", headerName: "Email", width: 200 },
    { field: "nationalId", headerName: "National ID", width: 120 },
    { field: "schemeName", headerName: "Scheme", width: 120 },
    { field: "zoneName", headerName: "Zone", width: 120 },
    {
      field: "status",
      headerName: "Status",
      width: 150,
      renderCell: (params) => (
        <Chip label={params.row.status} color={getStatusColor()} size="small" />
      ),
    },
    {
      field: "createdAt",
      headerName: "Created At",
      width: 120,
    },
    {
      field: "updatedAt",
      headerName: "Updated At",
      width: 120,
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
      {/* Left Side: Approved Customers List */}
      <Box
        sx={{
          flex: isMobile ? "1" : selectedApplicationId ? "0 0 50%" : "1",
          transition: "flex 0.3s ease",
          overflow: "auto",
          mb: isMobile && selectedApplicationId ? 2 : 0,
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6" fontWeight="bold">
            Approved Customer Applications
          </Typography>
          <Button variant="outlined" startIcon={<Refresh />} onClick={fetchApplications}>
            Refresh
          </Button>
        </Box>

        {/* Filters */}
        <Box display="flex" gap={1} mb={3}>
          <TextField
            label="Search by Name"
            variant="outlined"
            size="small"
            value={filter.search}
            onChange={handleSearch}
            sx={{ width: 250 }}
          />
        </Box>

        {/* Data Grid */}
        <Paper sx={{ p: 1, height: "calc(100% - 120px)" }}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" p={5}>
              <CircularProgress />
            </Box>
          ) : (
            <DataGrid
              rows={applications}
              columns={columns}
              pageSize={pagination.limit}
              rowsPerPageOptions={[10, 25, 50]}
              pagination
              paginationMode="server"
              rowCount={pagination.total}
              onPageChange={(newPage) => setFilter((prev) => ({ ...prev, page: newPage + 1 }))}
              onPageSizeChange={(newPageSize) =>
                setFilter((prev) => ({ ...prev, limit: newPageSize, page: 1 }))
              }
              onRowClick={(params) => handleSelectApplication(params.row.id)}
              disableSelectionOnClick
              sx={{ height: "100%" }}
              getRowId={(row) => row.id}
            />
          )}
        </Paper>
      </Box>

      {/* Right Side: Customer Details or Task Assignment */}
      <Box
        sx={{
          flex: isMobile ? "1" : selectedApplicationId ? "0 0 400px" : "0 0 0",
          transition: "flex 0.3s ease",
          overflow: "auto",
          display: selectedApplicationId || isMobile ? "block" : "none",
        }}
      >
        {selectedApplicationId ? (
          showAssignTask ? (
            <AssignMeterConnectionTask
              applicationId={selectedApplicationId}
              onClose={handleClose}
              fetchApplications={fetchApplications}
              onBack={handleBackToDetails}
            />
          ) : (
            <CustomerDetailsView
              applicationId={selectedApplicationId}
              onClose={handleClose}
              onAssignTask={handleAssignTask}
            />
          )
        ) : (
          <Box sx={{ p: 3 }}>
            <Typography>Select an approved customer to view details</Typography>
          </Box>
        )}
      </Box>

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

export default ApprovedCustomersScreen;