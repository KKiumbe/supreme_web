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
  Snackbar,
  Alert,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { Refresh, Visibility } from "@mui/icons-material";
import { Chip } from "@mui/material";
import axios from "axios";
import dayjs from "dayjs";
import { getTheme } from "../../store/theme"; // Assuming same theme setup as TaskBoard
import CustomerDetails from "../../components/customers/customersDetails";

const API_URL = import.meta.env.VITE_BASE_URL;

// CustomerDetails Component

// Main CustomerApplications Component
const NewCustomersScreen = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "error" });
  const [filter, setFilter] = useState({
    page: 1,
    limit: 10,
    search: "",
    status: "",
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
  const theme = getTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Flatten application data
  const flattenApplication = React.useCallback((app) => ({
    ...app,
    schemeName: app.schemeName || "-",
    zoneName: app.zoneName || "-",
    routeName: app.routeName || "-",
    tasks: app.tasks || [],
    surveys: app.surveys || [],
    createdAt: app.createdAt ? dayjs(app.createdAt).format("MMM D, YYYY") : "-",
    updatedAt: app.updatedAt ? dayjs(app.updatedAt).format("MMM D, YYYY") : "-",
  }), []);

  // Fetch applications
  const fetchApplications = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/new-customers`, {
        withCredentials: true,
        params: {
          page: filter.page,
          limit: filter.limit,
          search: filter.search || undefined,
          status: filter.status || undefined,
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
        setSnackbar({ open: true, message: "Failed to fetch applications", severity: "error" });
      }
    } catch (error) {
      setSnackbar({ open: true, message: "Error fetching applications: " + error.message, severity: "error" });
    } finally {
      setLoading(false);
    }
  }, [
    filter.page,
    filter.limit,
    filter.search,
    filter.status,
    filter.schemeId,
    filter.zoneId,
    filter.routeId,
    flattenApplication
  ]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

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

  // Filter and search handlers
  const handleSearch = (e) => {
    setFilter((prev) => ({ ...prev, search: e.target.value, page: 1 }));
  };

  const handleStatusChange = (e) => {
    setFilter((prev) => ({ ...prev, status: e.target.value, page: 1 }));
  };

  // Handle application selection
  const handleSelectApplication = (applicationId) => {
    if (selectedApplicationId === applicationId) {
      setSelectedApplicationId(null);
    } else {
      setSelectedApplicationId(applicationId);
    }
  };

  // Handle close details
  const handleCloseDetails = () => {
    setSelectedApplicationId(null);
  };

  // DataGrid columns
  const columns = [
    {
      field: "actions",
      headerName: "Actions",
      width: 100,
      align: "center",
      renderCell: (params) => (
        <IconButton
          color="theme.palette.primary.main"
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
        <Chip
          label={params?.row?.status}
          color={getStatusColor(params.row.status)}
          size="small"
        />
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

  // Filter applications locally for search
  const filteredApplications = applications.filter((app) =>
    app.name.toLowerCase().includes(filter.search.toLowerCase())
  );

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
      {/* Left Side: Applications List */}
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
            New Customer Applications
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
          <TextField
            select
            label="Status"
            size="small"
            value={filter.status}
            onChange={handleStatusChange}
            sx={{ width: 200 }}
          >
            <MenuItem value="">All</MenuItem>
            {[
              "PENDING",
              "SURVEY_SCHEDULED",
              "SURVEY_COMPLETED",
              "APPROVED",
              "REJECTED",
              "CONVERTED",
            ].map((status) => (
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
              rows={filteredApplications}
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

      {/* Right Side: Application Details */}
      <Box
        sx={{
          flex: isMobile ? "1" : selectedApplicationId ? "0 0 400px" : "0 0 0",
          transition: "flex 0.3s ease",
          overflow: "auto",
          display: selectedApplicationId || isMobile ? "block" : "none",
        }}
      >
        {selectedApplicationId ? (
          <CustomerDetails applicationId={selectedApplicationId} onClose={handleCloseDetails} />
        ) : (
          <Box sx={{ p: 3 }}>
            <Typography>Select an application to view details</Typography>
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

export default NewCustomersScreen;
