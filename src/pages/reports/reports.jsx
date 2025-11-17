import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  TextField,
  Drawer,
  Button,
  Divider,
  Skeleton,
  MenuItem,
  useTheme,
  useMediaQuery,
} from "@mui/material";

import { Download, Print, Refresh, Close } from "@mui/icons-material";

import axios from "axios";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";

const REPORT_TYPES = [
  { label: "Meter Readings", value: "meter-readings" },
  { label: "Bills", value: "bills" },
  { label: "Customers", value: "customers" },
  { label: "Disconnected Customers", value: "disconnected-customers" },
  { label: "Payments", value: "payments" },
  { label: "Bills Aging", value: "bills-aging" },
];

// Reports requiring month/year
const REPORTS_WITH_DATE = ["meter-readings", "bills", "payments"];

const ReportScreen = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const currentUser = useAuthStore((state) => state.currentUser);
  const navigate = useNavigate();

  const BASEURL = import.meta.env.VITE_BASE_URL;

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [reportType, setReportType] = useState("meter-readings");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  const showDateFilters = REPORTS_WITH_DATE.includes(reportType);

  // Main report fetch function
const fetchReport = async () => {
  setLoading(true);

  try {
    const url = `${BASEURL}/reports/${reportType}`;

    // validate only when needed
    if (showDateFilters) {
      if (!month || !year) {
        alert("Please enter month & year");
        setLoading(false);
        return;
      }
    }

    // 🔥 correct post body
    const body = showDateFilters 
      ? { month, year }
      : {}; 

    // 🔥 correct axios call
    const res = await axios.post(
      url,
      body,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        withCredentials: true,
        responseType: "blob",
      }
    );

    // download PDF
    const blob = new Blob([res.data], { type: "application/pdf" });
    const urlBlob = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = urlBlob;
    a.download = `${reportType}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(urlBlob);

  } catch (error) {
    console.error(error);
  }

  setLoading(false);
};



  return (
    <Box
      sx={{
        p: 3,
        width: "100%",
        height: "100%",
        minWidth: "1100px", // 🔥 SET MIN WIDTH
      }}
    >
      {/* HEADER */}
      <Grid container alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h5" fontWeight="bold">
          Reports
        </Typography>

        <Box>
          <Tooltip title="Export">
            <IconButton><Download /></IconButton>
          </Tooltip>
          <Tooltip title="Print">
            <IconButton><Print /></IconButton>
          </Tooltip>
          <Tooltip title="Refresh">
            <IconButton><Refresh /></IconButton>
          </Tooltip>
        </Box>
      </Grid>

      {/* FILTERS */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>

          {/* Report Type */}
          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Report Type"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              {REPORT_TYPES.map((rt) => (
                <MenuItem key={rt.value} value={rt.value}>
                  {rt.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Month (conditional) */}
          {showDateFilters && (
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Month"
                placeholder="1 - 12"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
            </Grid>
          )}

          {/* Year (conditional) */}
          {showDateFilters && (
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Year"
                placeholder="2025"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </Grid>
          )}

          {/* Fetch Report Button */}
          <Grid item xs={12} md={showDateFilters ? 3 : 9}>
            <Button
              fullWidth
              variant="contained"
              onClick={fetchReport}
            >
              Fetch Report
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* DATA VIEW */}
      <Paper sx={{ p: 2, height: "60vh" }}>
        {loading && <Skeleton variant="rectangular" height="100%" />}

        {!loading && !reportData && (
          <Typography
            textAlign="center"
            color="text.secondary"
            sx={{ mt: 5 }}
          >
            Select filters and fetch report
          </Typography>
        )}

        {!loading && reportData && (
          <Box sx={{ overflow: "auto", maxHeight: "100%" }}>
            <pre style={{ fontSize: 12 }}>
              {JSON.stringify(reportData, null, 2)}
            </pre>
          </Box>
        )}
      </Paper>

      {/* DETAILS DRAWER */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          "& .MuiDrawer-paper": {
            width: isMobile ? "100%" : 420,
          },
        }}
      >
        <Box sx={{ p: 3 }}>
          <Grid container justifyContent="space-between" mb={2}>
            <Typography variant="h6">Details</Typography>
            <IconButton onClick={() => setDrawerOpen(false)}>
              <Close />
            </IconButton>
          </Grid>

          <Divider sx={{ mb: 2 }} />

          <Skeleton variant="rectangular" height={40} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={40} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={200} />
        </Box>
      </Drawer>
    </Box>
  );
};

export default ReportScreen;
