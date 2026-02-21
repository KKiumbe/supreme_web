import { useState, useEffect } from "react";
import PropTypes from "prop-types";

import { Box, Card, CardContent, Typography } from "@mui/material";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = ["#4caf50", "#f44336"]; // green = completed, red = open
const TaskCompletionPieChart = ({ completed, open }) => {
  const data = [
    { name: "Completed", value: completed },
    { name: "Open", value: open },
  ];

  return (
    <Card
      sx={{
        boxShadow: 3,
        borderRadius: 3,
        height: 350,
        transition: "transform .2s",
        "&:hover": { transform: "scale(1.02)" },
      }}
    >
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
          Task Completion Overview
        </Typography>

        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={100}
              innerRadius={60}
              paddingAngle={6}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={COLORS[index]}
                  stroke="white"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend verticalAlign="bottom" height={36} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

TaskCompletionPieChart.propTypes = {
  completed: PropTypes.number.isRequired,
  open: PropTypes.number.isRequired,
};

const TaskDailyTrendChart = ({ data }) => {
  return (
    <Card
      sx={{
        boxShadow: 3,
        borderRadius: 3,
        height: 400,
        width: "100%",
        transition: "transform .2s",
        "&:hover": { transform: "scale(1.02)" },
      }}
    >
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
          Tasks Recorded (Last 30 Days)
        </Typography>

        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                <stop offset="15%" stopColor="#2196f3" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#2196f3" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />

            <XAxis dataKey="day" tick={{ fontSize: 12 }} minTickGap={12} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />

            <Area
              type="monotone"
              dataKey="tasks"
              stroke="#2196f3"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorTasks)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

TaskDailyTrendChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      day: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      tasks: PropTypes.number.isRequired,
    }),
  ).isRequired,
};

const ActiveConnectionsCircle = ({ value, max = 500 }) => {
  const [progress, setProgress] = useState(0);

  // Animate progress
  useEffect(() => {
    const timeout = setTimeout(() => {
      setProgress((value / max) * 100);
    }, 200);
    return () => clearTimeout(timeout);
  }, [value, max]);

  return (
    <Card
      sx={{
        boxShadow: 3,
        borderRadius: 3,
        height: 260,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "transform .2s",
        "&:hover": { transform: "scale(1.02)" },
      }}
    >
      <CardContent sx={{ textAlign: "center" }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
          Active Connections
        </Typography>

        <Box
          sx={{
            position: "relative",
            width: 150,
            height: 150,
            mx: "auto",
          }}
        >
          {/* Background circle */}
          <svg width="150" height="150">
            <circle
              cx="75"
              cy="75"
              r="60"
              stroke="#e0e0e0"
              strokeWidth="12"
              fill="none"
            />
            {/* Animated progress arc */}
            <circle
              cx="75"
              cy="75"
              r="60"
              stroke="url(#Gradient)"
              strokeWidth="12"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 60}`}
              strokeDashoffset={(1 - progress / 100) * 2 * Math.PI * 60}
              strokeLinecap="round"
              style={{
                transition: "stroke-dashoffset 1s ease",
              }}
            />

            {/* Gradient for stroke */}
            <defs>
              <linearGradient id="Gradient">
                <stop offset="0%" stopColor="#4caf50" />
                <stop offset="100%" stopColor="#2e7d32" />
              </linearGradient>
            </defs>
          </svg>

          {/* Centered value */}
          <Typography
            variant="h4"
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              fontWeight: "bold",
            }}
          >
            {value}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

ActiveConnectionsCircle.propTypes = {
  value: PropTypes.number.isRequired,
  max: PropTypes.number,
};

const DomarmantACC = ({ value }) => {
  return (
    <Card
      sx={{
        p: 0,
        borderRadius: 3,
        boxShadow: 4,
        background: "linear-gradient(135deg, #ff5722, #ff9800)",
        color: "white",
        height: 180,
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Flame glow animation */}
      <Box
        sx={{
          position: "absolute",
          top: -40,
          left: -40,
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.2)",
          filter: "blur(40px)",
          animation: "pulse 2s infinite",
          "@keyframes pulse": {
            "0%": { opacity: 0.7 },
            "50%": { opacity: 0.2 },
            "100%": { opacity: 0.7 },
          },
        }}
      />

      <CardContent sx={{ position: "relative", zIndex: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
          Dormant connections
        </Typography>

        <Typography
          variant="h2"
          sx={{
            fontWeight: "bold",
            textShadow: "0px 0px 10px rgba(255,255,255,0.4)",
          }}
        >
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
};

DomarmantACC.propTypes = {
  value: PropTypes.number.isRequired,
};

const DisconnectedConnectionsAlert = ({ value, max = 300 }) => {
  const [progress, setProgress] = useState(0);

  // Animate ring progress
  useEffect(() => {
    const p = (value / max) * 100;
    setTimeout(() => setProgress(p), 200);
  }, [value, max]);

  return (
    <Card
      sx={{
        boxShadow: 3,
        borderRadius: 3,
        height: 260,
        transition: "transform 0.2s",
        position: "relative",
        "&:hover": { transform: "scale(1.02)" },
        overflow: "hidden",
      }}
    >
      {/* Pulsating red background glow */}
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 180,
          height: 180,
          background: "rgba(255, 0, 0, 0.25)",
          borderRadius: "50%",
          transform: "translate(-50%, -50%)",
          filter: "blur(40px)",
          animation: "pulseGlow 2s infinite",
          "@keyframes pulseGlow": {
            "0%": { opacity: 0.25 },
            "50%": { opacity: 0.4 },
            "100%": { opacity: 0.25 },
          },
        }}
      />

      <CardContent
        sx={{ textAlign: "center", position: "relative", zIndex: 2 }}
      >
        <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
          Disconnected Connections
        </Typography>

        <Box sx={{ position: "relative", width: 150, height: 150, mx: "auto" }}>
          <svg width="150" height="150">
            {/* Background circle */}
            <circle
              cx="75"
              cy="75"
              r="60"
              stroke="#dddddd"
              strokeWidth="12"
              fill="none"
            />

            {/* Animated red danger circle */}
            <circle
              cx="75"
              cy="75"
              r="60"
              stroke="url(#redDanger)"
              strokeWidth="12"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 60}`}
              strokeDashoffset={(1 - progress / 100) * 2 * Math.PI * 60}
              strokeLinecap="round"
              style={{
                transition: "stroke-dashoffset 1s ease",
              }}
            />

            <defs>
              <linearGradient id="redDanger">
                <stop offset="0%" stopColor="#ff5252" />
                <stop offset="100%" stopColor="#b71c1c" />
              </linearGradient>
            </defs>
          </svg>

          {/* Center number */}
          <Typography
            variant="h3"
            sx={{
              fontWeight: "bold",
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          >
            {value}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

DisconnectedConnectionsAlert.propTypes = {
  value: PropTypes.number.isRequired,
  max: PropTypes.number,
};

export {
  TaskCompletionPieChart,
  TaskDailyTrendChart,
  ActiveConnectionsCircle,
  DomarmantACC,
  DisconnectedConnectionsAlert,
  SuspectedSelfReconnectionsAlert,
};

const SuspectedSelfReconnectionsAlert = ({ value }) => {
  return (
    <Card
      sx={{
        p: 0,
        borderRadius: 3,
        boxShadow: 4,
        background: "linear-gradient(135deg, #d32f2f, #ff6f00)",
        color: "white",
        height: 180,
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Alert glow animation */}
      <Box
        sx={{
          position: "absolute",
          top: -40,
          right: -40,
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.2)",
          filter: "blur(40px)",
          animation: "pulse 2s infinite",
          "@keyframes pulse": {
            "0%": { opacity: 0.7 },
            "50%": { opacity: 0.2 },
            "100%": { opacity: 0.7 },
          },
        }}
      />

      <CardContent sx={{ position: "relative", zIndex: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
          Suspected Reconnections
        </Typography>

        <Typography
          variant="h2"
          sx={{
            fontWeight: "bold",
            textShadow: "0px 0px 10px rgba(255,255,255,0.4)",
          }}
        >
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
};

SuspectedSelfReconnectionsAlert.propTypes = {
  value: PropTypes.number.isRequired,
};
