import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  MenuItem,
  Grid,
  IconButton,
  Tooltip,
  Chip,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import {
  Search as SearchIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

// Debounce hook
const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const CustomersScreen = () => {
  const { currentUser } = useAuthStore();
  const navigate = useNavigate();
  const BASEURL = import.meta.env.VITE_BASE_URL;

  // State
  const [rawCustomers, setRawCustomers] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Dropdowns
  const [schemes, setSchemes] = useState([]);
  const [zones, setZones] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [tariffCategories, setTariffCategories] = useState([]);

  // Filters
  const [search, setSearch] = useState("");
  const [schemeId, setSchemeId] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [routeId, setRouteId] = useState("");
  const [tariffCategoryId, setTariffCategoryId] = useState("");
  const [status, setStatus] = useState("");

  const debouncedSearch = useDebounce(search);

  // Fetch dropdowns
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [schemesRes, tariffsRes] = await Promise.all([
          axios.get(`${BASEURL}/schemes`, { withCredentials: true }),
          axios.get(`${BASEURL}/tarrifs/block`, { withCredentials: true }),
        ]);

        setSchemes(schemesRes.data.data || []);
        const uniqueCats = Object.values(
          (tariffsRes.data.data || []).reduce((acc, t) => {
            acc[t.category.id] = t.category;
            return acc;
          }, {})
        );
        setTariffCategories(uniqueCats);
      } catch (err) {
        console.error("Failed to load dropdowns", err);
      }
    };
    fetchDropdowns();
  }, [BASEURL]);

  // Zones → when scheme changes
  useEffect(() => {
    if (!schemeId) return setZones([]);
    const fetchZones = async () => {
      try {
        const res = await axios.get(`${BASEURL}/schemes/${schemeId}`, { withCredentials: true });
        setZones(res.data.data.zones || []);
      } catch {
        setZones([]);
      }
    };
    fetchZones();
  }, [schemeId, BASEURL]);

  // Routes → when zone changes
  useEffect(() => {
    if (!zoneId) return setRoutes([]);
    const fetchRoutes = async () => {
      try {
        const res = await axios.get(`${BASEURL}/zones/${zoneId}/routes`, { withCredentials: true });
        setRoutes(res.data.data || []);
      } catch {
        setRoutes([]);
      }
    };
    fetchRoutes();
  }, [zoneId, BASEURL]);

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(schemeId && { schemeId }),
        ...(zoneId && { zoneId }),
        ...(routeId && { routeId }),
        ...(tariffCategoryId && { tariffCategoryId }),
        ...(status && { status }),
      });

      const res = await axios.get(`${BASEURL}/customers?${params}`, { withCredentials: true });
      const { customers, pagination: pag } = res.data.data;

      setRawCustomers(customers);
      setPagination({
        page: pag.page,
        limit: pag.limit,
        total: pag.total,
        totalPages: pag.totalPages,
        hasNext: pag.hasNext,
        hasPrev: pag.hasPrev,
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, [
    BASEURL,
    pagination.page,
    pagination.limit,
    debouncedSearch,
    schemeId,
    zoneId,
    routeId,
    tariffCategoryId,
    status,
  ]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Reset filters
  const handleReset = () => {
    setSearch("");
    setSchemeId("");
    setZoneId("");
    setRouteId("");
    setTariffCategoryId("");
    setStatus("");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleAddCustomer = () => navigate("/add-customer");

  // ==============================
  // NORMALIZE DATA
  // ==============================
  const normalizedCustomers = useMemo(() => {
    // Build lookup maps
    const schemeMap = Object.fromEntries(schemes.map((s) => [s.id, s.name]));
    const zoneMap = Object.fromEntries(zones.map((z) => [z.id, z.name]));
    const routeMap = Object.fromEntries(routes.map((r) => [r.id, r.name]));
    const tariffMap = Object.fromEntries(tariffCategories.map((t) => [t.id, t.name]));

    return rawCustomers.map((c) => {
      const connections = c.connections || [];

      // Extract connection numbers
      const connectionNumbers = connections
        .map((conn) => conn.connectionNumber)
        .filter(Boolean)
        .join(", ") || "-";

      // Extract meter serials
      const meterSerials = connections
        .map((conn) => conn.meter?.serialNumber)
        .filter(Boolean)
        .join(", ") || "-";

      // First meter model
      const firstMeterModel =
        connections.find((conn) => conn.meter)?.meter?.model || "-";

      // Latest reading (first reading of first meter)
      const firstReading = connections
        .flatMap((conn) => conn.meter?.meterReadings || [])
        .sort((a, b) => new Date(b.readingDate) - new Date(a.readingDate))[0];

      const latestReading = firstReading?.reading ?? null;
      const latestReadingDate = firstReading
        ? new Date(firstReading.readingDate).toLocaleDateString()
        : null;

      return {
        id: c.id,
        accountNumber: c.accountNumber,
        customerName: c.customerName,
        email: c.email,
        phoneNumber: c.phoneNumber,
        customerIdNo: c.customerIdNo || "-",
        customerKraPin: c.customerKraPin || "-",
        customerDeposit: c.customerDeposit ? `KES ${c.customerDeposit}` : "-",
        hasWater: c.hasWater ? "Yes" : "No",
        hasSewer: c.hasSewer ? "Yes" : "No",
        customerDiscoType: c.customerDiscoType || "-",
        customerDob: c.customerDob
          ? new Date(c.customerDob).toLocaleDateString()
          : "-",

        // Normalized location
        schemeName: schemeMap[c.customerSchemeId] || "-",
        zoneName: zoneMap[c.customerZoneId] || "-",
        routeName: routeMap[c.customerRouteId] || "-",
        tariffName: tariffMap[c.tariffCategoryId ?? ""] || "-",

        // Connections
        connectionNumbers,
        meterSerials,
        firstMeterModel,

        // Latest reading
        latestReading: latestReading ? `${latestReading}` : "-",
        latestReadingDate: latestReadingDate ? `(${latestReadingDate})` : "",

        status: c.status,
        createdAt: new Date(c.createdAt).toLocaleString(),
      };
    });
  }, [rawCustomers, schemes, zones, routes, tariffCategories]);

  if (!currentUser) {
    navigate("/login");
    return null;
  }

  // ==============================
  // COLUMNS
  // ==============================
  const columns = [
    { field: "accountNumber", headerName: "Account #", width: 130 },
    { field: "customerName", headerName: "Name", width: 180 },
    { field: "phoneNumber", headerName: "Phone", width: 140 },
    { field: "email", headerName: "Email", width: 200 },
    { field: "customerIdNo", headerName: "ID No", width: 130 },
    { field: "customerKraPin", headerName: "KRA PIN", width: 140 },
  
    { field: "hasWater", headerName: "Water", width: 90 },
    { field: "hasSewer", headerName: "Sewer", width: 90 },
    { field: "customerDiscoType", headerName: "Disco Type", width: 120 },
    { field: "schemeName", headerName: "Scheme", width: 140 },
    { field: "zoneName", headerName: "Zone", width: 120 },
    { field: "routeName", headerName: "Route", width: 120 },
    { field: "tariffName", headerName: "Tariff", width: 150 },
      { field: "customerDeposit", headerName: "Deposit", width: 110 },

    // Connections
    {
      field: "connectionNumbers",
      headerName: "Connections",
      width: 160,
      renderCell: (params) => (
        <Tooltip title={params.row.meterSerials}>
          <span>{params.value}</span>
        </Tooltip>
      ),
    },
    {
      field: "firstMeterModel",
      headerName: "Meter Model",
      width: 140,
    },

    // Last Reading
    {
      field: "latestReading",
      headerName: "Last Reading",
      width: 180,
      renderCell: (params) => (
        <span>
          {params.value}{" "}
          <Typography component="span" color="text.secondary" fontSize="0.75rem">
            {params.row.latestReadingDate}
          </Typography>
        </span>
      ),
    },

    // Status
    {
      field: "status",
      headerName: "Status",
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value === "ACTIVE" ? "success" : params.value === "NEW" ? "warning" : "default"}
          size="small"
        />
      ),
    },

    { field: "createdAt", headerName: "Created", width: 160 },
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Grid container justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold">
          Customers
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddCustomer}>
          Add Customer
        </Button>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />,
              }}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Scheme"
              value={schemeId}
              onChange={(e) => {
                setSchemeId(e.target.value);
                setZoneId("");
                setRouteId("");
              }}
            >
              <MenuItem value="">All</MenuItem>
              {schemes.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Zone"
              value={zoneId}
              onChange={(e) => {
                setZoneId(e.target.value);
                setRouteId("");
              }}
              disabled={!schemeId}
            >
              <MenuItem value="">All</MenuItem>
              {zones.map((z) => (
                <MenuItem key={z.id} value={z.id}>
                  {z.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Route"
              value={routeId}
              onChange={(e) => setRouteId(e.target.value)}
              disabled={!zoneId}
            >
              <MenuItem value="">All</MenuItem>
              {routes.map((r) => (
                <MenuItem key={r.id} value={r.id}>
                  {r.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Tariff"
              value={tariffCategoryId}
              onChange={(e) => setTariffCategoryId(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {tariffCategories.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={1}>
            <Tooltip title="Reset Filters">
              <IconButton onClick={handleReset}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      </Paper>

      {/* DataGrid */}
      <Paper sx={{ height: 680 }}>
        <DataGrid
          rows={normalizedCustomers}
          getRowId={(row) => row.id}
          columns={columns}
          loading={loading}
          pagination
          paginationMode="server"
          rowCount={pagination.total}
          pageSizeOptions={[10, 20, 50]}
          paginationModel={{
            page: pagination.page - 1,
            pageSize: pagination.limit,
          }}
          onPaginationModelChange={(model) =>
            setPagination({
              ...pagination,
              page: model.page + 1,
              limit: model.pageSize,
            })
          }
          disableRowSelectionOnClick
          slots={{
            noRowsOverlay: () => (
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                height="100%"
              >
                <Typography color="text.secondary">
                  {error || "No customers found"}
                </Typography>
              </Box>
            ),
          }}
        />
      </Paper>
    </Box>
  );
};

export default CustomersScreen;