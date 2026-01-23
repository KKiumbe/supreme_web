import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Typography,
  Grid,
  Paper,
  Stack,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import axios from "axios";

const API_URL = import.meta.env.VITE_BASE_URL || "";

interface AddCustomerModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const AddCustomerModal: React.FC<AddCustomerModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  /* ---------------- STATE ---------------- */
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [schemes, setSchemes] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [tariffs, setTariffs] = useState<any[]>([]);

  const [form, setForm] = useState({
    connectionNumber: "",
    customerName: "",
    phoneNumber: "",
    customerIdNo: "",
    Pin: "",
    plotNumber: "",
    status: "ACTIVE",

    tariffCategoryId: "",
    schemeId: "",
    zoneId: "",
    routeId: "",

    previousMeterReading: "",
    sixMonthsMean: "",
    closingBalance: "",
  });

  /* ---------------- FETCH LOOKUPS ---------------- */
  useEffect(() => {
    if (!open) return;

    axios
      .get(`${API_URL}/schemes`, { withCredentials: true })
      .then((res) => setSchemes(res.data.data || []))
      .catch(() => setSchemes([]));

    axios
      .get(`${API_URL}/tarrifs/block`, { withCredentials: true })
      .then((res) => {
        const map = new Map();
        (res.data.data || []).forEach((b: any) => {
          if (b.categoryId && b.category) {
            map.set(b.categoryId, {
              id: b.categoryId,
              name: b.category.name,
            });
          }
        });
        setTariffs(Array.from(map.values()));
      })
      .catch(() => setTariffs([]));
  }, [open]);

  /* ---------------- HANDLERS ---------------- */
  const handleSchemeChange = (schemeId: string) => {
    const scheme = schemes.find((s) => String(s.id) === schemeId);
    setZones(scheme?.zones || []);
    setRoutes([]);
    setForm((f) => ({ ...f, schemeId, zoneId: "", routeId: "" }));
  };

  const handleZoneChange = (zoneId: string) => {
    const zone = zones.find((z) => String(z.id) === zoneId);
    setRoutes(zone?.routes || []);
    setForm((f) => ({ ...f, zoneId, routeId: "" }));
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (
      !form.connectionNumber ||
      !form.customerName ||
      !form.phoneNumber ||
      !form.tariffCategoryId
    ) {
      setError("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `${API_URL}/customers-by-pass`,
        {
          connectionNumber: Number(form.connectionNumber),
          customerName: form.customerName.trim(),
          phoneNumber: form.phoneNumber.trim(),
          customerIdNo: form.customerIdNo || null,
          Pin: form.Pin || null,
          plotNumber: form.plotNumber || null,
          status: form.status,

          tariffCategoryId: form.tariffCategoryId,
          schemeId: form.schemeId || null,
          zoneId: form.zoneId || null,
          routeId: form.routeId || null,

          previousMeterReading: form.previousMeterReading
            ? Number(form.previousMeterReading)
            : null,
          sixMonthsMean: form.sixMonthsMean
            ? Number(form.sixMonthsMean)
            : null,
          closingBalance: form.closingBalance
            ? Number(form.closingBalance)
            : null,
        },
        { withCredentials: true }
      );

      setSuccess("Customer created successfully");

      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create customer");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Add Customer</DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3}>
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Connection Number *"
                  fullWidth
                  value={form.connectionNumber}
                  onChange={(e) =>
                    setForm({ ...form, connectionNumber: e.target.value })
                  }
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  label="Customer Name *"
                  fullWidth
                  value={form.customerName}
                  onChange={(e) =>
                    setForm({ ...form, customerName: e.target.value })
                  }
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  label="Phone Number *"
                  fullWidth
                  value={form.phoneNumber}
                  onChange={(e) =>
                    setForm({ ...form, phoneNumber: e.target.value })
                  }
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  select
                  label="Tariff Category *"
                  fullWidth
                  value={form.tariffCategoryId}
                  onChange={(e) =>
                    setForm({ ...form, tariffCategoryId: e.target.value })
                  }
                >
                  {tariffs.map((t) => (
                    <MenuItem key={t.id} value={t.id}>
                      {t.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  select
                  label="Scheme"
                  fullWidth
                  value={form.schemeId}
                  onChange={(e) => handleSchemeChange(e.target.value)}
                >
                  {schemes.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  select
                  label="Zone"
                  fullWidth
                  disabled={!zones.length}
                  value={form.zoneId}
                  onChange={(e) => handleZoneChange(e.target.value)}
                >
                  {zones.map((z) => (
                    <MenuItem key={z.id} value={z.id}>
                      {z.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  select
                  label="Route"
                  fullWidth
                  disabled={!routes.length}
                  value={form.routeId}
                  onChange={(e) =>
                    setForm({ ...form, routeId: e.target.value })
                  }
                >
                  {routes.map((r) => (
                    <MenuItem key={r.id} value={r.id}>
                      {r.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  label="Previous Meter Reading"
                  type="number"
                  fullWidth
                  value={form.previousMeterReading}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      previousMeterReading: e.target.value,
                    })
                  }
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  label="6 Months Mean"
                  type="number"
                  fullWidth
                  value={form.sixMonthsMean}
                  onChange={(e) =>
                    setForm({ ...form, sixMonthsMean: e.target.value })
                  }
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  label="Opening Balance"
                  type="number"
                  fullWidth
                  value={form.closingBalance}
                  onChange={(e) =>
                    setForm({ ...form, closingBalance: e.target.value })
                  }
                />
              </Grid>
            </Grid>
          </Paper>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? <CircularProgress size={20} /> : "Create Customer"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddCustomerModal;
