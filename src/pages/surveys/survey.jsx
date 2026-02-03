import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  PermissionDeniedUI,
  isPermissionDenied,
} from "../../utils/permissionHelper";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Button,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { PhotoCamera, Visibility } from "@mui/icons-material";
import axios from "axios";
import { debounce } from "lodash";
import { useAuthStore } from "../../store/authStore";

import PropTypes from "prop-types";

// Error Boundary
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <Alert severity="error" sx={{ m: 2 }}>
          Something went wrong: {this.state.error?.message || "Unknown error"}
        </Alert>
      );
    }
    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node,
};

const API_URL = import.meta.env.VITE_BASE_URL;

const Surveys = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTaskStatus, setFilterTaskStatus] = useState("all");
  const currentUser = useAuthStore((state) => state.currentUser);

  // Debounced search handler
  const debouncedSetSearchTerm = useMemo(
    () => debounce((value) => setSearchTerm(value), 300),
    [],
  );

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    const fetchSurveys = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/get-surveys`, {
          withCredentials: true,
          params: {
            search: searchTerm || undefined, // Search by customer name, phone, plot, or officer
            taskStatus:
              filterTaskStatus !== "all" ? filterTaskStatus : undefined,
          },
        });

        if (response.data.success) {
          // Flatten the API response
          const flattened = response.data.data.map((item) => ({
            id: item.id,
            customerName: item.application?.name || "N/A",
            phoneNumber: item.application?.phone || "N/A",
            plotNumber: item.application?.plotNumber || "N/A",
            applicationStatus: item.application?.status || "N/A",
            taskStatus: item.task?.status || "N/A",
            officerName: item.officer?.name || "N/A",
            officerPhone: item.officer?.phone || "N/A",
            pipelineNearby: item.pipelineNearby ? "Yes" : "No",
            approved: item.approved ? "Yes" : "No",
            verifiedAt: item.verifiedAt
              ? new Date(item.verifiedAt).toLocaleDateString()
              : "N/A",
            photoUrl: item.photoUrl,
          }));

          setSurveys(flattened);
          setPermissionDenied(false);
        } else {
          setError(response.data.message || "Failed to fetch surveys");
        }
      } catch (err) {
        if (isPermissionDenied(err)) {
          setPermissionDenied(true);
          setSurveys([]);
          setError(null);
        } else {
          setError(`Error fetching surveys: ${err.message}`);
        }
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchSurveys();
    }
  }, [currentUser, searchTerm, filterTaskStatus]);

  const handleRowClick = (params) => {
    navigate(`/surveys/${params.id}`);
  };

  const columns = useMemo(
    () => [
      { field: "customerName", headerName: "Customer", flex: 1.2 },
      { field: "phoneNumber", headerName: "Phone", flex: 1 },
      { field: "plotNumber", headerName: "Plot Number", flex: 1 },
      { field: "applicationStatus", headerName: "Application Status", flex: 1 },
      { field: "taskStatus", headerName: "Task Status", flex: 1 },
      { field: "officerName", headerName: "Officer Incharge", flex: 1.2 },
      { field: "officerPhone", headerName: "Officer Phone", flex: 1 },
      { field: "pipelineNearby", headerName: "Pipeline Nearby", flex: 0.8 },
      { field: "approved", headerName: "Approved", flex: 0.8 },
      { field: "verifiedAt", headerName: "Verified At", flex: 1 },
      {
        field: "photoUrl",
        headerName: "Photo",
        flex: 0.6,
        sortable: false,
        renderCell: (params) =>
          params.value ? (
            <img
              src={params.value}
              alt="Survey"
              style={{
                width: 40,
                height: 40,
                borderRadius: "8px",
                objectFit: "cover",
              }}
            />
          ) : (
            <PhotoCamera sx={{ fontSize: 22, color: "grey.500" }} />
          ),
      },
    ],
    [],
  );

  const filteredSurveys = useMemo(() => {
    // Client-side filtering as a fallback
    return surveys.filter(
      (s) =>
        s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.phoneNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.plotNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.officerName.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [surveys, searchTerm]);

  return (
    <ErrorBoundary>
      <Box
        sx={{
          p: { xs: 2, sm: 3 },
          display: "flex",
          flexDirection: "column",
          width: "100vw",
          minHeight: "100vh",
          backgroundColor: "background.default",
          overflowX: "hidden",
        }}
      >
        {permissionDenied ? (
          <PermissionDeniedUI permission="surveys:view" />
        ) : (
          <>
            {/* Header */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 2,
                mb: 3,
                width: "100%",
              }}
            >
              <Typography
                variant={isMobile ? "h6" : "h5"}
                sx={{ fontWeight: 600 }}
              >
                Surveys
              </Typography>
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                <TextField
                  label="Search by Customer, Phone, Plot, or Officer"
                  variant="outlined"
                  size={isMobile ? "small" : "medium"}
                  onChange={(e) => debouncedSetSearchTerm(e.target.value)}
                  sx={{ width: { xs: "100%", sm: 300 } }}
                />
                <FormControl
                  sx={{ width: { xs: "100%", sm: 200 } }}
                  size={isMobile ? "small" : "medium"}
                >
                  <InputLabel id="task-status-filter-label">
                    Task Status
                  </InputLabel>
                  <Select
                    labelId="task-status-filter-label"
                    value={filterTaskStatus}
                    label="Task Status"
                    onChange={(e) => setFilterTaskStatus(e.target.value)}
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="PENDING">Pending</MenuItem>
                    <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                    <MenuItem value="COMPLETED">Completed</MenuItem>
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate("/surveys/new")}
                  sx={{ height: "fit-content" }}
                >
                  New Survey
                </Button>
              </Box>
            </Box>

            {/* Content */}
            <Box sx={{ flex: 1, width: "100%" }}>
              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              ) : surveys.length === 0 ? (
                <Alert severity="info">No surveys found.</Alert>
              ) : (
                <Paper
                  elevation={3}
                  sx={{
                    width: "100%",
                    height: "calc(100vh - 220px)",
                    p: 2,
                    borderRadius: 3,
                    backgroundColor: "background.paper",
                  }}
                >
                  <DataGrid
                    rows={filteredSurveys}
                    columns={columns}
                    getRowId={(row) => row.id}
                    disableRowSelectionOnClick
                    pageSizeOptions={[10, 20, 50]}
                    initialState={{
                      pagination: {
                        paginationModel: { pageSize: 10, page: 0 },
                      },
                    }}
                    onRowClick={handleRowClick}
                    sx={{
                      "& .MuiDataGrid-columnHeaders": {
                        backgroundColor: "primary.main",
                        color: "#fff",
                        fontWeight: 600,
                        fontSize: "0.95rem",
                      },
                      "& .MuiDataGrid-cell": {
                        fontSize: "0.875rem",
                        display: "flex",
                        alignItems: "center",
                      },
                      "& .MuiDataGrid-row:hover": {
                        backgroundColor: "action.hover",
                        cursor: "pointer",
                      },
                      "& .MuiDataGrid-footerContainer": {
                        justifyContent: "center",
                      },
                    }}
                  />
                </Paper>
              )}
            </Box>
          </>
        )}
      </Box>
    </ErrorBoundary>
  );
};

export default Surveys;
