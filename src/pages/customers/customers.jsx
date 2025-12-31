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
  Divider,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import {
  Search as SearchIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Visibility,
} from "@mui/icons-material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import CustomerDetails from "../../components/customers/customerDetail";
import EditCustomerModal from "../../components/customers/edit";
import EditIcon from '@mui/icons-material/Edit';
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
  const BASEURL = import.meta.env.VITE_BASE_URL || "";
  const isMobile = window.innerWidth < 600; // Simple mobile detection; adjust as needed

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
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

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
  const [editCustomerId, setEditCustomerId] = useState(null);
  const debouncedSearch = useDebounce(search);

  // Fetch dropdowns
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [schemesRes, tariffsRes] = await Promise.all([
          axios.get(`${BASEURL}/schemes`, { withCredentials: true }),
          axios.get(`${BASEURL}/tariffs/block`, { withCredentials: true }), // Fixed typo
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
        console.error("Failed to load dropdowns:", err);
        setError("Failed to load dropdown data");
      }
    };
    fetchDropdowns();
  }, [BASEURL]);

  // Zones → when scheme changes
  useEffect(() => {
    if (!schemeId) {
      setZones([]);
      return;
    }
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
    if (!zoneId) {
      setRoutes([]);
      return;
    }
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
        ...(Number.isFinite(Number(debouncedSearch)) && {
        connectionNumber: debouncedSearch,
      }),
        ...(schemeId && { schemeId }),
        ...(zoneId && { zoneId }),
        ...(routeId && { routeId }),
        ...(tariffCategoryId && { tariffCategoryId }),
        ...(status && { status }),
      });

      const res = await axios.get(`${BASEURL}/customers?${params}`, { withCredentials: true });
      const { customers, pagination: pag } = res.data.data || {};

      setRawCustomers(customers || []);
      setPagination({
        page: pag?.page || 1,
        limit: pag?.limit || 20,
        total: pag?.total || 0,
        totalPages: pag?.totalPages || 1,
        hasNext: pag?.hasNext || false,
        hasPrev: pag?.hasPrev || false,
      });
    } catch (err) {
      console.error("Failed to fetch customers:", err);
      setError(err.response?.data?.message || "Failed to load customers");
      setRawCustomers([]);
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
    setSelectedCustomerId(null); // Close details panel on reset
  };

  const handleAddCustomer = () => navigate("/add-customer");

  const handleSelectCustomer = (customerId) => {
    if (selectedCustomerId === customerId) {
      setSelectedCustomerId(null); // Toggle off if already selected
    } else {
      setSelectedCustomerId(customerId); // Show details for new customer
    }
  };

  const handleCloseDetails = () => {
    setSelectedCustomerId(null);
  };

  const handleOpenEdit = (customerId) => {
  setEditCustomerId(customerId);
};

const handleCloseEdit = () => {
  setEditCustomerId(null);
};

// Optional: refresh list after update
const handleCustomerUpdated = () => {
  fetchCustomers(); // your existing fetch function
};

  // Normalize data
  const normalizedCustomers = useMemo(() => {
    return rawCustomers.map((c) => {
      const connections = c.connections || [];
      const connectionNumbers = connections
        .map((conn) => conn.connectionNumber)
        .filter(Boolean)
        .join(", ") || "-";
      const schemeName = connections.find((conn) => conn.scheme)?.scheme?.name || "-";
      const zoneName = connections.find((conn) => conn.zone)?.zone?.name || "-";
      const routeName = connections.find((conn) => conn.route)?.route?.name || "-";
      const tariffName = connections.find((conn) => conn.tariffCategory)?.tariffCategory?.name || "-";
      const meterSerials = connections
        .map((conn) => conn.meter?.serialNumber)
        .filter(Boolean)
        .join(", ") || "-";
      const firstMeterModel = connections.find((conn) => conn.meter)?.meter?.model || "-";
      const firstReading = connections
        .flatMap((conn) => conn.meter?.meterReadings || [])
        .sort((a, b) => new Date(b.readingDate) - new Date(a.readingDate))[0];

      return {
        id: c.id || "",
        accountNumber: c.accountNumber || "-",
        customerName: c.customerName || "-",
        customerBalance: c.closingBalance ? `KES ${parseFloat(c.closingBalance).toFixed(2)}` : "-",
        phoneNumber: c.phoneNumber || "-",
        email: c.email || "-",
        customerIdNo: c.customerIdNo || "-",
        customerKraPin: c.customerKraPin || "-",
        customerDeposit: c.customerDeposit ? `KES ${c.customerDeposit}` : "-",
        hasWater: c.hasWater ? "Yes" : "No",
        hasSewer: c.hasSewer ? "Yes" : "No",
        customerDiscoType: c.customerDiscoType || "-",
        customerDob: c.customerDob ? new Date(c.customerDob).toLocaleDateString() : "-",
        schemeName: schemeName || "-",
        zoneName: zoneName || "-",
        routeName: routeName || "-",
        tariffName: tariffName || "-",
        connectionNumbers,
        meterSerials,
        firstMeterModel,
        previousReading: firstReading?.currentReading ? `${firstReading.currentReading}` : "-",
        currentReading: firstReading?.currentReading ? `${firstReading.currentReading}` : "-",
        consumption: firstReading?.consumption ? `${firstReading.consumption}` : "-",
        latestReadingDate: firstReading
          ? `(${new Date(firstReading.readingDate).toLocaleDateString()})`
          : "",
        status: c.status || "-",
        createdAt: c.createdAt ? new Date(c.createdAt).toLocaleString() : "-",
      };
    });
  }, [rawCustomers]);

  const columns = [
    // {
    //   field: "actions",
    //   headerName: "Actions",
    //   width: 100,
    //   align: "center",
    //   renderCell: (params) => (
    //     <IconButton
    //       color="theme.palette.primary.contrastText" // Fixed color syntax
    //       onClick={(e) => {
    //         e.stopPropagation();
    //         handleSelectCustomer(params?.row?.id);
    //       }}
    //     >
    //       <Visibility />
    //     </IconButton>
    //   ),
    // },

    {

    field: "actions",
  headerName: "Action",
  width: 140,
  align: "center",
  renderCell: (params) => (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <IconButton
        color="theme.palette.primary.contrastText"
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          handleSelectCustomer(params.row.id);
        }}
      >
        <Visibility />
      </IconButton>

      <IconButton
        color="theme.palette.primary.contrastText"
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          handleOpenEdit(params.row.id);
        }}
      >
        <EditIcon />
      </IconButton>
    </Box>
  )},
    { field: "accountNumber", headerName: "Account #", width: 130 },
    {
      field: "status",
      headerName: "Status",
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params?.value}
          color={params?.value === "ACTIVE" ? "success" : params?.value === "NEW" ? "warning" : "default"}
          size="small"
        />
      ),
    },
    { field: "customerName", headerName: "Name", width: 180 },
    { field: "customerBalance", headerName: "Balance", width: 140 },
    { field: "phoneNumber", headerName: "Phone", width: 140 },
    { field: "email", headerName: "Email", width: 200 },
    { field: "customerIdNo", headerName: "ID No", width: 130 },
    { field: "customerKraPin", headerName: "KRA PIN", width: 140 },
    { field: "schemeName", headerName: "Scheme", width: 140 },
    { field: "zoneName", headerName: "Zone", width: 120 },
    { field: "routeName", headerName: "Route", width: 120 },
    { field: "tariffName", headerName: "Tariff", width: 150 },
    { field: "customerDeposit", headerName: "Deposit", width: 110 },
    {
      field: "connectionNumbers",
      headerName: "Connections",
      width: 160,
      renderCell: (params) => (
        <Tooltip title={params?.row?.meterSerials}>
          <span>{params?.value}</span>
        </Tooltip>
      ),
    },
    { field: "firstMeterModel", headerName: "Meter Model", width: 140 },
    {
      field: "currentReading",
      headerName: "Current Reading",
      width: 150,
      renderCell: (params) => (
        <span>
          {params?.value}
          <Typography component="span" color="text.secondary" fontSize="0.75rem">
            {params?.row?.latestReadingDate}
          </Typography>
        </span>
      ),
    },
    {
      field: "consumption",
      headerName: "Consumption",
      width: 150,
      renderCell: (params) => (
        <span>
          {params?.value}
          <Typography component="span" color="text.secondary" fontSize="0.75rem">
            {params?.row?.latestReadingDate}
          </Typography>
        </span>
      ),
    },
    { field: "customerDiscoType", headerName: "Disco Type", width: 120 },
    { field: "hasWater", headerName: "Water", width: 90 },
    { field: "hasSewer", headerName: "Sewer", width: 90 },
    { field: "createdAt", headerName: "Created", width: 160 },
  ];

  if (!currentUser) {
    navigate("/login");
    return null;
  }

  return (
    <Box sx={{
        p: 3,
        display: isMobile ? "block" : "flex",
        gap: 2,
        height: "calc(100vh - 64px)",
        overflow: "auto",
        maxWidth: "100vw"
    }}>
      {/* Main Content */}
      <Box sx={{ flex: isMobile ? "1" : selectedCustomerId ? "0 0 50%" : "1",
          transition: "flex 0.3s ease",
          overflow: "auto",
          mb: isMobile && selectedCustomerId ? 2 : 0, }}>
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
        <Paper sx={{ height: 680, overflowX: "auto" }}>
          <DataGrid
            rows={normalizedCustomers}
            getRowId={(row) => row?.id}
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
            disableRowSelectionOnClick // Prevent row selection on click
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

      {/* Customer Details Panel */}
      <Box
        sx={{
          flex: isMobile ? "1" : selectedCustomerId ? "0 0 400px" : "0 0 0",
          transition: "flex 0.3s ease",
          overflow: "auto",
          display: selectedCustomerId || isMobile ? "block" : "none",
        }}
      >
        {selectedCustomerId ? (
          <CustomerDetails customerId={selectedCustomerId} onClose={handleCloseDetails} />
        ) : (
          <Box sx={{ p: 3 }}>
            <Typography>Select a customer to view details</Typography>
          </Box>
        )}
      </Box>

      {editCustomerId && (
  <EditCustomerModal
    open={!!editCustomerId}
    onClose={handleCloseEdit}
    customerId={editCustomerId}
    
    onCustomerUpdated={handleCustomerUpdated}
  />
)}
    </Box>
  );
};

export default CustomersScreen;