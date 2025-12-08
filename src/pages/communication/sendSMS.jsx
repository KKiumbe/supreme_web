import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  CircularProgress,
  Alert,
  Container,
  Paper,
  Stack,
} from "@mui/material";
import axios from "axios";

const BASEURL = import.meta.env.VITE_BASE_URL;

export default function SmsScreen() {
  const [schemes, setSchemes] = useState([]);
  const [zones, setZones] = useState([]);
  const [routes, setRoutes] = useState([]);

  const [selectedScheme, setSelectedScheme] = useState("");
  const [selectedZone, setSelectedZone] = useState("");
  const [selectedRoute, setSelectedRoute] = useState("");
  const [sendToAll, setSendToAll] = useState(true);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);

  useEffect(() => {
    const fetchSchemes = async () => {
      try {
        const res = await axios.get(`${BASEURL}/schemes`, { withCredentials: true });
        setSchemes(res.data.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSchemes();
  }, []);

  useEffect(() => {
    if (selectedScheme) {
      const scheme = schemes.find((s) => s.id === selectedScheme);
      setZones(scheme?.zones || []);
      setSelectedZone("");
      setRoutes([]);
      setSelectedRoute("");
    }
  }, [selectedScheme]);

  useEffect(() => {
    if (selectedZone) {
      const zone = zones.find((z) => z.id === selectedZone);
      setRoutes(zone?.routes || []);
      setSelectedRoute("");
    }
  }, [selectedZone]);

  const handleSendSMS = async () => {
    if (!message) {
      setResponse("Please enter a message.");
      return;
    }

    setLoading(true);
    setResponse(null);

    try {
      let url = "";
      if (sendToAll) {
        url = `${BASEURL}/send-sms-to-all`;
      } else if (selectedScheme && !selectedZone && !selectedRoute) {
        url = `${BASEURL}/send-sms-by-scheme/${selectedScheme}`;
      } else if (selectedZone && !selectedRoute) {
        url = `${BASEURL}/send-sms-by-zone/${selectedZone}`;
      } else if (selectedRoute) {
        url = `${BASEURL}/send-sms-by-route/${selectedRoute}`;
      } else {
        setResponse("Please select scheme/zone/route or choose 'All Customers'");
        setLoading(false);
        return;
      }

      await axios.post(url, { message }, { withCredentials: true });
      setResponse("SMS sent successfully!");
    } catch (err) {
      console.error(err);
      setResponse("Failed to send SMS.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 6,ml:20, minWidth: 600 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 } }}>
        <Typography variant="h5" mb={3} textAlign="center">
          Filter to Send Bulk SMS
        </Typography>

        <Stack spacing={3}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Scheme</InputLabel>
                <Select
                  value={selectedScheme}
                  onChange={(e) => {
                    setSelectedScheme(e.target.value);
                    setSendToAll(false);
                  }}
                  label="Scheme"
                >
                  <MenuItem value="">Select Scheme</MenuItem>
                  {schemes.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={!selectedScheme}>
                <InputLabel>Zone</InputLabel>
                <Select
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  label="Zone"
                >
                  <MenuItem value="">Select Zone</MenuItem>
                  {zones.map((z) => (
                    <MenuItem key={z.id} value={z.id}>
                      {z.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={!selectedZone}>
                <InputLabel>Route</InputLabel>
                <Select
                  value={selectedRoute}
                  onChange={(e) => setSelectedRoute(e.target.value)}
                  label="Route"
                >
                  <MenuItem value="">Select Route</MenuItem>
                  {routes.map((r) => (
                    <MenuItem key={r.id} value={r.id}>
                      {r.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Message"
                multiline
                rows={4}
                fullWidth
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Dear {{customerName}}, your latest bill is {{billAmount}} KES."
              />
            </Grid>
          </Grid>

          {response && <Alert severity="info">{response}</Alert>}

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="flex-start">
            <Button
              variant="contained"
              onClick={handleSendSMS}
              disabled={loading}
              startIcon={loading && <CircularProgress size={20} />}
            >
              Send SMS
            </Button>

            <Button
              variant={sendToAll ? "contained" : "outlined"}
              onClick={() => {
                setSendToAll(true);
                setSelectedScheme("");
                setSelectedZone("");
                setSelectedRoute("");
              }}
            >
              Send to All Customers
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Container>
  );
}
