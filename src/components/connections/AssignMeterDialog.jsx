import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Button,
  Alert,
  Typography,
} from "@mui/material";

const AssignMeterDialog = ({
  open,
  onClose,
  connectionNumber,
  customerName,
  selectedMeterId,
  onMeterChange,
  meters,
  loading,
  onSubmit,
  onReset,
  meterId,
  meterSerialNumber,
}) => {
  return (
    <Dialog open={open} onClose={onReset} fullWidth maxWidth="sm">
      <DialogTitle>Assign Meter to Connection</DialogTitle>
      <DialogContent sx={{ pt: 3, display: "flex", flexDirection: "column", gap: 2 }}>
        <TextField
          fullWidth
          label="Connection Number"
          value={connectionNumber || ""}
          disabled
        />
        <TextField
          fullWidth
          label="Customer"
          value={customerName || ""}
          disabled
        />

        {/* Warning if connection already has a meter */}
        {meterId && (
          <Alert severity="warning">
            ⚠️ This connection already has a meter:{" "}
            <strong>{meterSerialNumber}</strong>
          </Alert>
        )}

        <FormControl fullWidth disabled={loading}>
          <InputLabel>Select Meter</InputLabel>
          <Select
            value={selectedMeterId}
            onChange={(e) => onMeterChange(e.target.value)}
            label="Select Meter"
          >
            <MenuItem value="">-- Choose a meter --</MenuItem>
            {meters
              .filter((m) => m.status === "AVAILABLE")
              .map((m) => (
                <MenuItem key={m.id} value={m.id}>
                  {m.serialNumber} ({m.model})
                </MenuItem>
              ))}
          </Select>
        </FormControl>

        {!meters.some((m) => m.status === "AVAILABLE") && (
          <Typography color="warning.main" variant="caption">
            ⚠️ No available meters. Please add a new meter first.
          </Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onReset} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onSubmit}
          disabled={loading || !selectedMeterId}
        >
          {loading ? <CircularProgress size={20} /> : "Assign Meter"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssignMeterDialog;
