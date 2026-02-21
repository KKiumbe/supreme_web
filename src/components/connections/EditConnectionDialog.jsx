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
  Box,
} from "@mui/material";

const EditConnectionDialog = ({
  open,
  onClose,
  connectionNumber,
  onConnectionNumberChange,
  status,
  onStatusChange,
  selectedSchemeId,
  onSchemeChange,
  selectedZoneId,
  onZoneChange,
  selectedRouteId,
  onRouteChange,
  selectedTariffCategoryId,
  onTariffChange,
  schemes,
  zones,
  routes,
  tariffCategories,
  loading,
  onSubmit,
  onReset,
}) => {
  return (
    <Dialog open={open} onClose={onReset} fullWidth maxWidth="sm">
      <DialogTitle>Edit Connection</DialogTitle>
      <DialogContent sx={{ pt: 3, display: "flex", flexDirection: "column", gap: 2 }}>
        <TextField
          fullWidth
          label="Connection Number"
          value={connectionNumber}
          onChange={(e) => onConnectionNumberChange(e.target.value)}
          type="number"
          disabled={loading}
        />

        <FormControl fullWidth disabled={loading}>
          <InputLabel>Status</InputLabel>
          <Select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            label="Status"
          >
            <MenuItem value="ACTIVE">Active</MenuItem>
            <MenuItem value="PENDING_METER">Pending Meter</MenuItem>
            <MenuItem value="DISCONNECTED">Disconnected</MenuItem>
            <MenuItem value="INACTIVE">Inactive</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth disabled={loading}>
          <InputLabel>Scheme</InputLabel>
          <Select
            value={selectedSchemeId}
            onChange={(e) => {
              onSchemeChange(e.target.value);
              onZoneChange("");
              onRouteChange("");
            }}
            label="Scheme"
          >
            <MenuItem value="">None</MenuItem>
            {schemes.map((s) => (
              <MenuItem key={s.id} value={String(s.id)}>
                {s.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {selectedSchemeId && (
          <FormControl fullWidth disabled={loading}>
            <InputLabel>Zone</InputLabel>
            <Select
              value={selectedZoneId}
              onChange={(e) => {
                onZoneChange(e.target.value);
                onRouteChange("");
              }}
              label="Zone"
            >
              <MenuItem value="">None</MenuItem>
              {schemes
                .find((s) => String(s.id) === selectedSchemeId)
                ?.zones?.map((z) => (
                  <MenuItem key={z.id} value={String(z.id)}>
                    {z.name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        )}

        {selectedZoneId && (
          <FormControl fullWidth disabled={loading}>
            <InputLabel>Route</InputLabel>
            <Select
              value={selectedRouteId}
              onChange={(e) => onRouteChange(e.target.value)}
              label="Route"
            >
              <MenuItem value="">None</MenuItem>
              {schemes
                .find((s) => String(s.id) === selectedSchemeId)
                ?.zones?.find(
                  (z) => String(z.id) === selectedZoneId,
                )
                ?.routes?.map((r) => (
                  <MenuItem key={r.id} value={String(r.id)}>
                    {r.name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        )}

        <FormControl fullWidth disabled={loading}>
          <InputLabel>Tariff Category</InputLabel>
          <Select
            value={selectedTariffCategoryId}
            onChange={(e) => onTariffChange(e.target.value)}
            label="Tariff Category"
          >
            <MenuItem value="">None</MenuItem>
            {tariffCategories.map((t) => (
              <MenuItem key={t.id} value={String(t.id)}>
                {t.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>

      <DialogActions>
        <Button onClick={onReset} disabled={loading}>
          Cancel
        </Button>
        <Button variant="contained" onClick={onSubmit} disabled={loading}>
          {loading ? <CircularProgress size={20} /> : "Update"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditConnectionDialog;
