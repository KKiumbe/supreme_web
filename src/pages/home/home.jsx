import { useEffect, useState } from "react";
import {
  PermissionDeniedUI,
  isPermissionDenied,
} from "../../utils/permissionHelper";
import {
  Typography,
  Card,
  CardContent,
  Box,
  CircularProgress,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  useTheme,
} from "@mui/material";
import {
  TrendingUp,
  TrendingDown,
  Refresh,
  CheckCircle,
  HourglassEmpty,
  Water,
  Receipt,
  Assessment,
} from "@mui/icons-material";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import apiClient from "../../services/apiClient";
import { toast } from "react-toastify";

import {
  ActiveConnectionsCircle,
  DisconnectedConnectionsAlert,
  DomarmantACC,
  TaskCompletionPieChart,
} from "../../components/home/dashboard";

const HomeScreen = () => {
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const theme = useTheme();

  const currentUser = useAuthStore((state) => state.currentUser);
  const navigate = useNavigate();

  // Fetch dashboard data
  const fetchDashboardStats = async (showToast = false) => {
    try {
      if (showToast) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const response = await apiClient.get("/dashboard");
      // API returns { success: true, data: { ... } }, so we need response.data.data
      setDashboardStats(response.data.data || response.data);
      setPermissionDenied(false);
      if (showToast) {
        toast.success("Dashboard refreshed successfully");
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);

      // Handle 403 Permission Denied
      if (isPermissionDenied(error)) {
        setPermissionDenied(true);
        setDashboardStats(null);
      } else {
        toast.error("Failed to load dashboard data");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    fetchDashboardStats();
  }, [currentUser, navigate]);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress color="primary" size={60} />
      </Box>
    );
  }

  // Show permission denied message
  if (permissionDenied) {
    return <PermissionDeniedUI permission="dashboard:view" />;
  }

  if (!dashboardStats) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress color="primary" size={60} />
      </Box>
    );
  }

  /** Get color based on color name from theme **/
  const getColorFromTheme = (colorName) => {
    const colorMap = {
      primary: theme.palette.primary.main,
      success: theme.palette.success.main,
      warning: theme.palette.redAccent?.main || "#ff9800",
      error: theme.palette.redAccent?.main || "#f44336",
      info: theme.palette.blueAccent?.main || "#2196f3",
    };
    return colorMap[colorName] || theme.palette.primary.main;
  };

  /** Enhanced StatCard Component with Icons **/
  const StatCard = ({ title, value, icon: Icon, color = "primary", trend }) => {
    const mainColor = getColorFromTheme(color);

    return (
      <Card
        sx={{
          boxShadow:
            theme.palette.mode === "dark"
              ? "0 4px 20px rgba(0,0,0,0.3)"
              : "0 4px 20px rgba(0,0,0,0.08)",
          borderRadius: 3,
          transition: "all 0.3s ease-in-out",
          "&:hover": {
            transform: "translateY(-8px)",
            boxShadow:
              theme.palette.mode === "dark"
                ? "0 8px 30px rgba(0,0,0,0.5)"
                : "0 8px 30px rgba(0,0,0,0.12)",
          },
          height: "100%",
          bgcolor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: -20,
            right: -20,
            width: 100,
            height: 100,
            borderRadius: "50%",
            background: mainColor,
            opacity: 0.08,
          }}
        />
        <CardContent sx={{ position: "relative", zIndex: 1 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              mb: 2,
            }}
          >
            <Box
              sx={{
                bgcolor: mainColor,
                color: "white",
                p: 1.5,
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon sx={{ fontSize: 28 }} />
            </Box>
            {trend && (
              <Chip
                icon={trend > 0 ? <TrendingUp /> : <TrendingDown />}
                label={`${Math.abs(trend)}%`}
                size="small"
                color={trend > 0 ? "success" : "error"}
                sx={{ fontWeight: "bold" }}
              />
            )}
          </Box>
          <Typography
            sx={{
              fontSize: 14,
              mb: 1,
              opacity: 0.7,
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            {title}
          </Typography>
          <Typography
            sx={{
              fontWeight: "bold",
              fontSize: 36,
              color: mainColor,
              lineHeight: 1,
            }}
          >
            {typeof value === "number" ? value.toLocaleString() : value || "0"}
          </Typography>
        </CardContent>
      </Card>
    );
  };

  StatCard.propTypes = {
    title: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    icon: PropTypes.elementType.isRequired,
    color: PropTypes.string,
    trend: PropTypes.number,
  };

  return (
    <Box sx={{ width: "100%", px: 3, py: 3, bgcolor: "background.default" }}>
      {/* Header with Greeting and Refresh */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
          maxWidth: "1600px",
          mx: "auto",
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: "bold",
              color: theme.palette.text.primary,
              mb: 0.5,
            }}
          >
            Welcome back, {currentUser?.firstName}!
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: theme.palette.text.secondary }}
          >
            Here&apos;s what&apos;s happening with your water utility today
          </Typography>
        </Box>
        <Tooltip title="Refresh Dashboard">
          <IconButton
            onClick={() => fetchDashboardStats(true)}
            disabled={refreshing}
            sx={{
              bgcolor:
                theme.palette.blueAccent?.main || theme.palette.primary.main,
              color: "white",
              "&:hover": {
                bgcolor:
                  theme.palette.blueAccent?.dark || theme.palette.primary.dark,
              },
              boxShadow: 2,
            }}
          >
            {refreshing ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              <Refresh />
            )}
          </IconButton>
        </Tooltip>
      </Box>

      {/* ================================
          SECTION: Monthly Operations (TOP PRIORITY)
      =================================*/}

      <Box sx={{ maxWidth: "1600px", mx: "auto", mb: 5 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 3, gap: 1 }}>
          <Receipt
            sx={{
              color:
                theme.palette.blueAccent?.main || theme.palette.primary.main,
              fontSize: 28,
            }}
          />
          <Typography
            variant="h5"
            sx={{
              fontWeight: "bold",
              color: theme.palette.text.primary,
            }}
          >
            Monthly Operations
          </Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "1fr 1fr",
              md: "repeat(3, 1fr)",
            },
            gap: 3,
          }}
        >
          <StatCard
            title="Meters Read This Month"
            value={dashboardStats?.totalMetersReadThisMonth || 0}
            icon={Water}
            color="info"
          />
          <StatCard
            title="Bills Generated"
            value={dashboardStats?.totalBillsGeneratedThisMonth || 0}
            icon={Receipt}
            color="success"
          />
          <StatCard
            title="Connections Not Read"
            value={dashboardStats?.connectionsNotRead || 0}
            icon={TrendingDown}
            color="warning"
          />
        </Box>
      </Box>

      {/* ================================
          SECTION: Overview Cards
      =================================*/}

      <Box sx={{ maxWidth: "1600px", mx: "auto", mb: 5 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 3, gap: 1 }}>
          <Assessment
            sx={{
              color:
                theme.palette.blueAccent?.main || theme.palette.primary.main,
              fontSize: 28,
            }}
          />
          <Typography
            variant="h5"
            sx={{
              fontWeight: "bold",
              color: theme.palette.text.primary,
            }}
          >
            Key Metrics
          </Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "1fr 1fr",
              md: "repeat(4, 1fr)",
            },
            gap: 3,
          }}
        >
          <StatCard
            title="Dormant Accounts"
            value={dashboardStats?.dormantAccounts || 0}
            icon={HourglassEmpty}
            color="warning"
          />
          <StatCard
            title="Tasks Older Than 1 Month"
            value={dashboardStats?.tasksOlderThan30Days || 0}
            icon={TrendingDown}
            color="error"
          />
          <StatCard
            title="Completed This Month"
            value={dashboardStats?.completedTasksThisMonth || 0}
            icon={CheckCircle}
            color="success"
          />
          <StatCard
            title="Pending This Month"
            value={dashboardStats?.pendingTasksThisMonth || 0}
            icon={HourglassEmpty}
            color="info"
          />
        </Box>
      </Box>

      {/* ================================
          SECTION: Connections 
      =================================*/}

      <Box sx={{ maxWidth: "1600px", mx: "auto", mb: 5 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 3, gap: 1 }}>
          <Water
            sx={{
              color:
                theme.palette.blueAccent?.main || theme.palette.primary.main,
              fontSize: 28,
            }}
          />
          <Typography
            variant="h5"
            sx={{
              fontWeight: "bold",
              color: theme.palette.text.primary,
            }}
          >
            Connection Status
          </Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "1fr 1fr",
              lg: "repeat(3, 1fr)",
            },
            gap: 3,
            alignItems: "stretch",
          }}
        >
          <ActiveConnectionsCircle
            value={dashboardStats?.totalActiveConnections || 0}
            max={500}
          />

          <DomarmantACC value={dashboardStats?.dormantAccounts || 0} />

          <DisconnectedConnectionsAlert
            value={dashboardStats?.disconnectedConnections || 0}
          />
        </Box>
      </Box>

      {/* ================================
          SECTION: Task Analytics (Charts)
      =================================*/}

      <Box sx={{ maxWidth: "1600px", mx: "auto", mb: 5 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 3, gap: 1 }}>
          <Assessment
            sx={{
              color:
                theme.palette.blueAccent?.main || theme.palette.primary.main,
              fontSize: 28,
            }}
          />
          <Typography
            variant="h5"
            sx={{
              fontWeight: "bold",
              color: theme.palette.text.primary,
            }}
          >
            Task Analytics
          </Typography>
        </Box>

        <Box
          sx={{
            mt: 3,
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "7fr 3fr",
            },
            gap: 3,
            width: "100%",
            alignItems: "stretch",
          }}
        >
          {/* 70% WIDTH - Placeholder for trend chart */}
          <Box sx={{ width: "100%" }}>
            <Card
              sx={{
                boxShadow:
                  theme.palette.mode === "dark"
                    ? "0 4px 20px rgba(0,0,0,0.3)"
                    : "0 4px 20px rgba(0,0,0,0.08)",
                borderRadius: 3,
                p: 3,
                height: "100%",
                bgcolor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  mb: 2,
                  fontWeight: "bold",
                  color: theme.palette.text.primary,
                }}
              >
                Task Daily Trend (Last 30 Days)
              </Typography>
              <Divider sx={{ mb: 3 }} />
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  minHeight: 300,
                }}
              >
                <Typography
                  sx={{
                    opacity: 0.5,
                    textAlign: "center",
                    color: theme.palette.text.secondary,
                  }}
                >
                  📊 Trend visualization coming soon...
                  <br />
                  <Typography
                    variant="caption"
                    sx={{
                      mt: 1,
                      display: "block",
                      color: theme.palette.text.secondary,
                    }}
                  >
                    This will show daily task completion trends
                  </Typography>
                </Typography>
              </Box>
            </Card>
          </Box>

          {/* 30% WIDTH */}
          <Box sx={{ width: "100%" }}>
            <TaskCompletionPieChart
              completed={dashboardStats?.completedTasksThisMonth || 0}
              open={dashboardStats?.pendingTasksThisMonth || 0}
            />
          </Box>
        </Box>
      </Box>

      {/* Footer with Timestamp */}
      <Box
        sx={{
          maxWidth: "1600px",
          mx: "auto",
          mt: 4,
          p: 2,
          bgcolor: theme.palette.background.paper,
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Chip
              label="Live"
              color="success"
              size="small"
              sx={{ fontWeight: "bold" }}
            />
            <Typography
              variant="body2"
              sx={{ color: theme.palette.text.secondary }}
            >
              Dashboard auto-refreshes every 5 minutes
            </Typography>
          </Box>
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.text.secondary,
              display: "flex",
              alignItems: "center",
              gap: 0.5,
            }}
          >
            📅 Last updated:{" "}
            {dashboardStats?.refreshedAt
              ? new Date(dashboardStats.refreshedAt).toLocaleString()
              : "N/A"}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default HomeScreen;
