import React, { useEffect, useState } from "react";
import {
  Typography,
  Button,
  TextField,
  MenuItem,
  Grid,
  Alert,
  Container,
  Paper,
  Stack,
  Snackbar,
} from "@mui/material";
import axios from "axios";
// @ts-ignore - permissionHelper is a .jsx file
import {
  PermissionDeniedUI,
  isPermissionDenied,
} from "../../utils/permissionHelper";

const BASEURL = import.meta.env.VITE_BASE_URL;

interface Scheme {
  id: number;
  name: string;
}

export default function SmsScreen() {
  /* ───────── Data ───────── */
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [selectedScheme, setSelectedScheme] = useState("");
  const [permissionDenied, setPermissionDenied] = useState(false);

  /* ───────── Message ───────── */
  const [message, setMessage] = useState("");

  /* ───────── UI State ───────── */
  const [submitting, setSubmitting] = useState(false);
  const [snack, setSnack] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  /* ───────── Fetch Schemes ───────── */
  useEffect(() => {
    axios
      .get(`${BASEURL}/schemes`, { withCredentials: true })
      .then((res) => {
        setSchemes(res.data.data || []);
        setPermissionDenied(false);
      })
      .catch((err) => {
        console.error("Failed to fetch schemes", err);
        if (isPermissionDenied(err)) {
          setPermissionDenied(true);
        }
      });
  }, []);

  /* ───────── Helpers ───────── */
  const showMessage = (msg: string, type: "success" | "error") =>
    setSnack({ msg, type });

  const sendQueuedSMS = async () => {
    if (!message.trim()) {
      showMessage("Please enter an SMS message.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const url = selectedScheme
        ? `/send-sms-by-scheme/${selectedScheme}`
        : `/send-sms-to-all`;

      const res = await axios.post(
        `${BASEURL}${url}`,
        { message },
        { withCredentials: true },
      );

      showMessage(
        `${res.data?.message || "SMS job queued"}${
          res.data?.jobId ? ` (Job ID: ${res.data.jobId})` : ""
        }. Messages are being sent in the background.`,
        "success",
      );

      setMessage("");
    } catch (err: any) {
      showMessage(
        err?.response?.data?.message || "Failed to queue SMS messages",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* ───────── Render ───────── */
  return (
    <Container maxWidth="md" sx={{ mt: 6, minWidth: 600 }}>
      {permissionDenied ? (
        <PermissionDeniedUI permission={["sms:send", "schemes:view"]} />
      ) : (
        <>
          <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 } }}>
            <Typography variant="h5" mb={1} fontWeight="bold">
              Send Bulk SMS
            </Typography>

            <Typography variant="body2" color="text.secondary" mb={3}>
              Messages are queued and sent asynchronously. You may continue
              using the system after submission.
            </Typography>

            <Stack spacing={3}>
              {/* Scope */}
              <TextField
                select
                size="small"
                fullWidth
                label="Choose Scheme"
                value={selectedScheme}
                onChange={(e) => setSelectedScheme(e.target.value)}
                helperText={
                  selectedScheme
                    ? "SMS will be sent only to customers in this scheme"
                    : "SMS will be sent to all customers"
                }
              >
                <MenuItem value="">All Customers</MenuItem>
                {schemes.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
              </TextField>

              {/* Message */}
              <TextField
                label="SMS Message"
                multiline
                minRows={4}
                fullWidth
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter the SMS message to send to customers"
              />

              <Alert severity="info">
                This action queues SMS messages for background processing.
              </Alert>

              {/* Actions */}
              <Grid container spacing={2}>
                <Grid item>
                  <Button
                    variant="contained"
                    disabled={submitting}
                    onClick={sendQueuedSMS}
                  >
                    {selectedScheme ? "Send SMS (Scheme)" : "Send SMS (All)"}
                  </Button>
                </Grid>

                {selectedScheme && (
                  <Grid item>
                    <Button
                      variant="outlined"
                      onClick={() => setSelectedScheme("")}
                    >
                      Switch to All Customers
                    </Button>
                  </Grid>
                )}
              </Grid>
            </Stack>
          </Paper>

          <Snackbar
            open={!!snack}
            autoHideDuration={8000}
            onClose={() => setSnack(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          >
            <Alert severity={snack?.type} variant="filled">
              {snack?.msg}
            </Alert>
          </Snackbar>
        </>
      )}
    </Container>
  );
}
