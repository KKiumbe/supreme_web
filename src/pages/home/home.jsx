import React, { useEffect, useState } from "react";
import {
  Typography,
  Card,
  CardContent,
  Box,
  CircularProgress,
} from "@mui/material";
import axios from "axios";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";
import { getTheme } from "../../store/theme";
import PropTypes from "prop-types";

import {
  ActiveConnectionsCircle,
  DisconnectedConnectionsAlert,
  DomarmantACC,
  TaskCompletionPieChart,
  TaskDailyTrendChart,
} from "../../components/home/dashboard";

// Dummy Stats (TEMPORARY)
const dummyStats = {
  activeConnections: 200,
  dormantAccounts: 25,
  disconnectedConnections: 22,
  pendingTasks: 65,
  completedTasksThisMonth: 40,
  pendingTasksThisMonth: 25,
  tasksOlderThanMonth: 5,
  refreshedAt: "2025-12-01T19:43:47.717Z",
};

// Dummy Trend Data for Last 30 Days
const dummyTrendData = Array.from({ length: 30 }).map((_, i) => ({
  day: `Day ${i + 1}`,
  tasks: Math.floor(Math.random() * 20) + 1,
}));

const HomeScreen = () => {
  const [dashboardStats] = useState(dummyStats);
  const [loading] = useState(false);

  const currentUser = useAuthStore((state) => state.currentUser);
  const navigate = useNavigate();
  const theme = getTheme();

  useEffect(() => {
    if (!currentUser) navigate("/login");
  }, [currentUser]);

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
        <CircularProgress color="primary" />
      </Box>
    );
  }

  /** Clean StatCard Component **/
  const StatCard = ({ title, value }) => (
    <Card
      sx={{
        boxShadow: 3,
        borderRadius: 3,
        transition: "transform .2s",
        "&:hover": { transform: "scale(1.02)" },
        height: 130,
      }}
    >
      <CardContent>
        <Typography sx={{ fontSize: 14, mb: 1, opacity: 0.7 }}>
          {title}
        </Typography>
        <Typography sx={{ fontWeight: "bold", fontSize: 30 }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );

  StatCard.propTypes = {
    title: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  };

  return (
    <Box sx={{ width: "100%", px: 3, py: 3 }}>
      {/* Greeting */}
      <Typography variant="h5" sx={{ mb: 4, fontWeight: "bold" }}>
        Hi {currentUser?.firstName}!
      </Typography>

      {/* ================================
          SECTION: Overview Cards
      =================================*/}

      <Typography
        variant="h6"
        sx={{
          mt: 2,
          mb: 2,
          fontWeight: "bold",
          opacity: 0.8,
          maxWidth: "1600px",
          mx: "auto",
        }}
      >
        Overview
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "1fr 1fr",
            md: "repeat(3, 1fr)",
            lg: "repeat(4, 1fr)",
          },
          gap: 2,
          maxWidth: "1600px",
          mx: "auto",
        }}
      >
        <StatCard title="Dormant Accounts" value={dashboardStats.dormantAccounts} />
        <StatCard title="Tasks Older Than 1 Month" value={dashboardStats.tasksOlderThanMonth} />
        <StatCard title="Completed This Month" value={dashboardStats.completedTasksThisMonth} />
        <StatCard title="Pending This Month" value={dashboardStats.pendingTasksThisMonth} />
      </Box>

      {/* ================================
          SECTION: Connections 
      =================================*/}

      <Typography
        variant="h6"
        sx={{
          mt: 5,
          mb: 2,
          fontWeight: "bold",
          opacity: 0.8,
          maxWidth: "1600px",
          mx: "auto",
        }}
      >
        Connections
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "1fr 1fr",
            lg: "repeat(3, 1fr)",
          },
          gap: 3,
          maxWidth: "1600px",
          mx: "auto",
          alignItems: "stretch",
        }}
      >
        <ActiveConnectionsCircle
          value={dashboardStats.activeConnections}
          max={500}
        />

        <DomarmantACC value={dashboardStats.dormantAccounts} />

        <DisconnectedConnectionsAlert
          value={dashboardStats.disconnectedConnections}
        />
      </Box>

      {/* ================================
          SECTION: Task Analytics (Charts)
      =================================*/}

      <Typography
        variant="h6"
        sx={{
          mt: 5,
          mb: 2,
          fontWeight: "bold",
          opacity: 0.8,
          maxWidth: "1600px",
          mx: "auto",
        }}
      >
        Task Analytics
      </Typography>

      <Box
  sx={{
    mt: 3,
    display: "grid",
    gridTemplateColumns: {
      xs: "1fr",          // full width on small screens
      md: "7fr 3fr",      // 70% / 30% split
      lg: "7fr 3fr",      // same for large screens
    },
    gap: 3,
    width: "100%",
    maxWidth: "1600px",
    mx: "auto",
    alignItems: "stretch",
  }}
>
  {/* 70% WIDTH */}
  <Box sx={{ width: "100%" }}>
    <TaskDailyTrendChart data={dummyTrendData} />
  </Box>

  {/* 30% WIDTH */}
  <Box sx={{ width: "100%" }}>
    <TaskCompletionPieChart
      completed={dashboardStats.completedTasksThisMonth}
      open={dashboardStats.pendingTasks}
    />
  </Box>
</Box>


      {/* Timestamp */}
      <Typography
        sx={{
          mt: 3,
          opacity: 0.6,
          textAlign: "right",
          fontSize: 12,
          maxWidth: "1600px",
          mx: "auto",
        }}
      >
        Last updated: {new Date(dashboardStats.refreshedAt).toLocaleString()}
      </Typography>
    </Box>
  );
};

export default HomeScreen;
