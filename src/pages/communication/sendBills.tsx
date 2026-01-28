import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  TextField,
  Grid,
  Typography,
  Snackbar,
  Alert,
  MenuItem,
  Paper,
  FormHelperText,
  IconButton,
  Tooltip,
  Divider,
  Switch,
  FormControlLabel,
} from "@mui/material";
import { Restore as RestoreIcon } from "@mui/icons-material";
import axios from "axios";

const BASEURL = import.meta.env.VITE_BASE_URL;

interface Scheme {
  id: number;
  name: string;
}

/* ───────── Sleek Reusable Selector ───────── */
const SchemeSelect = ({
  schemes,
  value,
  onChange,
}: {
  schemes: Scheme[];
  value: string;
  onChange: (v: string) => void;
}) => (
  <TextField
    select
    size="small"
    fullWidth
    label="Scheme"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    sx={{ maxWidth: 360 }}
  >
    <MenuItem value="">All Schemes</MenuItem>
    {schemes.map((s) => (
      <MenuItem key={s.id} value={s.id}>
        {s.name}
      </MenuItem>
    ))}
  </TextField>
);

export default function SmsBillingScreen() {
  /* ───────── Data ───────── */
  const [schemes, setSchemes] = useState<Scheme[]>([]);

  /* ───────── Scheme per panel ───────── */
  const [billScheme, setBillScheme] = useState("");
  const [reminderScheme, setReminderScheme] = useState("");
  const [disconnectionScheme, setDisconnectionScheme] = useState("");

  /* ───────── UI State ───────── */
  const [submitting, setSubmitting] = useState(false);
  const [snack, setSnack] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  /* ───────── Reminder Message State ───────── */
  const [useCustomReminderMessage, setUseCustomReminderMessage] =
    useState(false);
  const [reminderMessage, setReminderMessage] = useState(
    "Dear {name}, your outstanding bill is KES {balance}. Please pay before {dueDate}. Use Paybill 4183721 Account {connectionNumber}."
  );
  const defaultReminderMessage = reminderMessage;

  /* ───────── Disconnection Message State ───────── */
  const [useCustomDisconnectionMessage, setUseCustomDisconnectionMessage] =
    useState(false);
  const [disconnectionMinBalance, setDisconnectionMinBalance] = useState("");
  const [disconnectionMinUnpaidMonths, setDisconnectionMinUnpaidMonths] =
    useState("");
  const [disconnectionMessage, setDisconnectionMessage] = useState(
    "Dear {name}, you have an outstanding balance of KES {balance} since {since}. Please pay immediately to avoid disconnection. Paybill 4183721 Account {connectionNumber}."
  );
  const defaultDisconnectionMessage = disconnectionMessage;

  /* ───────── Fetch Schemes ───────── */
  useEffect(() => {
    axios
      .get(`${BASEURL}/schemes`, { withCredentials: true })
      .then((res) => setSchemes(res.data.data || []))
      .catch(() => console.error("Failed to fetch schemes"));
  }, []);

  /* ───────── Helpers ───────── */
  const showMessage = (msg: string, type: "success" | "error") =>
    setSnack({ msg, type });

  const sendQueuedRequest = async (url: string, payload: any = {}) => {
    setSubmitting(true);
    try {
      const res = await axios.post(`${BASEURL}${url}`, payload, {
        withCredentials: true,
      });

      showMessage(
        `${res.data.message} .Messages are being sent in the background.`,
        "success"
      );
    } catch (err: any) {
      showMessage(
        err?.response?.data?.message || "Failed to queue messages",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ minWidth: 900, mx: "auto", p: { xs: 2, md: 4 } }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        SMS Billing & Alerts
      </Typography>

      <Alert severity="info" sx={{ mb: 4 }}>
        All SMS messages are queued and processed asynchronously.
      </Alert>

      {/* ================= SEND BILLS ================= */}
      <Paper elevation={3} sx={{ p: 4, mb: 5 }}>
        <Box display="flex" justifyContent="space-between" mb={2}>
          <Typography variant="h6">Send Bills</Typography>
          <SchemeSelect
            schemes={schemes}
            value={billScheme}
            onChange={setBillScheme}
          />
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={2}>
          <Grid item>
            <Button
              variant="contained"
              disabled={submitting}
              onClick={() => sendQueuedRequest("/send-bills-to-all")}
            >
              Send Bills (All)
            </Button>
          </Grid>

          <Grid item>
            <Button
              variant="outlined"
              color="secondary"
              disabled={submitting || !billScheme}
              onClick={() =>
                sendQueuedRequest(`/send-bills-by-scheme/${billScheme}`)
              }
            >
              Send Bills (Scheme)
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* ================= BILL REMINDERS ================= */}
      <Paper elevation={3} sx={{ p: 4, mb: 5 }}>
        <Box display="flex" justifyContent="space-between" mb={2}>
          <Typography variant="h6">Bill Reminders</Typography>
          <SchemeSelect
            schemes={schemes}
            value={reminderScheme}
            onChange={setReminderScheme}
          />
        </Box>

        <Divider sx={{ mb: 3 }} />

        <FormControlLabel
          control={
            <Switch
              checked={useCustomReminderMessage}
              onChange={(e) =>
                setUseCustomReminderMessage(e.target.checked)
              }
            />
          }
          label="Use custom message template"
        />

        <TextField
          fullWidth
          multiline
          minRows={4}
          disabled={!useCustomReminderMessage}
          label={
            useCustomReminderMessage
              ? "Custom Reminder Message"
              : "System will generate reminder message"
          }
          value={reminderMessage}
          onChange={(e) => setReminderMessage(e.target.value)}
          InputProps={{
            endAdornment: useCustomReminderMessage && (
              <Tooltip title="Reset to default">
                <IconButton
                  onClick={() =>
                    setReminderMessage(defaultReminderMessage)
                  }
                >
                  <RestoreIcon />
                </IconButton>
              </Tooltip>
            ),
          }}
        />

        <FormHelperText sx={{ mt: 1 }}>
          {useCustomReminderMessage
            ? "Variables: {name} {balance} {dueDate} {connectionNumber}"
            : "The system will automatically generate the reminder message."}
        </FormHelperText>

        <Grid container spacing={2} mt={3}>
          <Grid item>
            <Button
              variant="contained"
              disabled={submitting}
              onClick={() =>
                sendQueuedRequest("/send-bills-reminder", {
                  messageTemplate: useCustomReminderMessage
                    ? reminderMessage.trim() || undefined
                    : undefined,
                })
              }
            >
              Send Reminders (All)
            </Button>
          </Grid>

          <Grid item>
            <Button
              variant="outlined"
                 color="secondary"
              disabled={submitting || !reminderScheme}
              onClick={() =>
                sendQueuedRequest(
                  `/send-reminders-by-scheme/${reminderScheme}`,
                  {
                    messageTemplate: useCustomReminderMessage
                      ? reminderMessage.trim() || undefined
                      : undefined,
                  }
                )
              }
            >
              Send Reminders (Scheme)
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* ================= DISCONNECTION ALERTS ================= */}
      <Paper
        elevation={3}
        sx={{
          p: 4,
          mb: 5,
          borderLeft: "6px solid",
          borderColor: "error.main",
        }}
      >
        <Box display="flex" justifyContent="space-between" mb={2}>
          <Typography variant="h6" color="error">
            Disconnection Alerts
          </Typography>
          <SchemeSelect
            schemes={schemes}
            value={disconnectionScheme}
            onChange={setDisconnectionScheme}
          />
        </Box>

        <Divider sx={{ mb: 3 }} />

        <TextField
          fullWidth
          type="number"
          label="Minimum Balance (KES) – optional"
          value={disconnectionMinBalance}
          onChange={(e) => setDisconnectionMinBalance(e.target.value)}
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          type="number"
          label="Minimum Unpaid Months – optional"
          value={disconnectionMinUnpaidMonths}
          onChange={(e) => setDisconnectionMinUnpaidMonths(e.target.value)}
          sx={{ mb: 3 }}
        />

        <FormControlLabel
          control={
            <Switch
              checked={useCustomDisconnectionMessage}
              onChange={(e) =>
                setUseCustomDisconnectionMessage(e.target.checked)
              }
            />
          }
          label="Use custom disconnection message"
        />

        <TextField
          fullWidth
          multiline
          minRows={4}
          disabled={!useCustomDisconnectionMessage}
          label={
            useCustomDisconnectionMessage
              ? "Custom Disconnection Message"
              : "System will generate disconnection message"
          }
          value={disconnectionMessage}
          onChange={(e) => setDisconnectionMessage(e.target.value)}
          InputProps={{
            endAdornment: useCustomDisconnectionMessage && (
              <Tooltip title="Reset to default">
                <IconButton
                  onClick={() =>
                    setDisconnectionMessage(defaultDisconnectionMessage)
                  }
                >
                  <RestoreIcon />
                </IconButton>
              </Tooltip>
            ),
          }}
        />

        <FormHelperText sx={{ mt: 1 }}>
          {useCustomDisconnectionMessage
            ? "Variables: {name} {balance} {since} {connectionNumber}"
            : "The system will automatically generate the disconnection message."}
        </FormHelperText>

        <Grid container spacing={2} mt={3}>
          <Grid item>
            <Button
              variant="contained"
              color="error"
              disabled={submitting}
              onClick={() =>
                sendQueuedRequest("/send-disconnection-alert", {
                  minBalance: disconnectionMinBalance || undefined,
                  minUnpaidMonths:
                    disconnectionMinUnpaidMonths || undefined,
                  messageTemplate: useCustomDisconnectionMessage
                    ? disconnectionMessage.trim() || undefined
                    : undefined,
                })
              }
            >
              Send Alerts (All)
            </Button>
          </Grid>

          <Grid item>
            <Button
              variant="outlined"
              color="error"
              disabled={submitting || !disconnectionScheme}
              onClick={() =>
                sendQueuedRequest(
                  `/send-disconnection-alert/${disconnectionScheme}`,
                  {
                    minBalance: disconnectionMinBalance || undefined,
                    minUnpaidMonths:
                      disconnectionMinUnpaidMonths || undefined,
                    messageTemplate: useCustomDisconnectionMessage
                      ? disconnectionMessage.trim() || undefined
                      : undefined,
                  }
                )
              }
            >
              Send Alerts (Scheme)
            </Button>
          </Grid>
        </Grid>
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
    </Box>
  );
}
