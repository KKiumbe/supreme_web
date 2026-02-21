import {
  Box,
  Typography,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Button,
  CircularProgress,
} from "@mui/material";
import { Visibility, GetApp } from "@mui/icons-material";

const DisconnectionSection = ({
  previewScope,
  onPreviewScopeChange,
  previewScopeId,
  onPreviewScopeIdChange,
  minBalance,
  onMinBalanceChange,
  minUnpaidMonths,
  onMinUnpaidMonthsChange,
  schemes,
  zones,
  routes,
  previewLoading,
  onPreview,
  onDownload,
}) => {
  const getScopeLabel = (scope) => {
    const upper = scope?.toUpperCase();
    switch (upper) {
      case "SCHEME":
        return "Scheme";
      case "ZONE":
        return "Zone";
      case "ROUTE":
        return "Route";
      default:
        return "Scope";
    }
  };

  return (
    <Collapse in={true}>
      <Box sx={{ p: 2, bgcolor: "action.hover", borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          Overdue connections for disconnection
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            alignItems: "center",
            mt: 1.5,
          }}
        >
          <FormControl size="small" sx={{ minWidth: 90 }}>
            <InputLabel>Level</InputLabel>
            <Select
              value={previewScope}
              label="Level"
              onChange={(e) => {
                onPreviewScopeChange(e.target.value);
                onPreviewScopeIdChange("");
                onMinBalanceChange("");
                onMinUnpaidMonthsChange("");
              }}
            >
              <MenuItem value="">All overdue</MenuItem>
              <MenuItem value="SCHEME">Scheme</MenuItem>
              <MenuItem value="ZONE">Zone</MenuItem>
              <MenuItem value="ROUTE">Route</MenuItem>
            </Select>
          </FormControl>

          {previewScope && (
            <>
              <FormControl size="small" sx={{ minWidth: 80 }}>
                <InputLabel>{getScopeLabel(previewScope)}</InputLabel>
                <Select
                  value={previewScopeId}
                  label={getScopeLabel(previewScope)}
                  onChange={(e) => onPreviewScopeIdChange(e.target.value)}
                >
                  <MenuItem value="">— Select —</MenuItem>
                  {previewScope === "SCHEME" &&
                    schemes.map((s) => (
                      <MenuItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </MenuItem>
                    ))}
                  {previewScope === "ZONE" &&
                    zones.map((z) => (
                      <MenuItem key={z.id} value={String(z.id)}>
                        {z.name}{" "}
                        {z.scheme?.name && `(${z.scheme.name})`}
                      </MenuItem>
                    ))}
                  {previewScope === "ROUTE" &&
                    routes.map((r) => (
                      <MenuItem key={r.id} value={String(r.id)}>
                        {r.name} {r.zone?.name && `(${r.zone.name})`}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>

              <TextField
                size="small"
                type="number"
                label="Min. Balance"
                placeholder="e.g. 1000"
                value={minBalance}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || Number(val) >= 0) {
                    onMinBalanceChange(val);
                  }
                }}
                sx={{ maxWidth: 140 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      KES
                    </InputAdornment>
                  ),
                }}
                helperText="≥ this amount"
                variant="outlined"
              />

              <TextField
                size="small"
                type="number"
                label="Unpaid Months"
                placeholder="e.g. 2"
                value={minUnpaidMonths}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || Number(val) >= 1) {
                    onMinUnpaidMonthsChange(val);
                  }
                }}
                sx={{ maxWidth: 140 }}
                helperText="≥ number of months unpaid"
                variant="outlined"
              />

              <Box sx={{ display: "flex", gap: 1.5 }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  startIcon={
                    previewLoading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <Visibility />
                    )
                  }
                  onClick={onPreview}
                  disabled={previewLoading || !previewScopeId}
                >
                  Preview
                </Button>

                <Button
                  variant="outlined"
                  color="theme.palette.primary.contrastText"
                  size="small"
                  startIcon={<GetApp />}
                  onClick={onDownload}
                  disabled={!previewScopeId}
                >
                  Download PDF
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Box>
    </Collapse>
  );
};

export default DisconnectionSection;
