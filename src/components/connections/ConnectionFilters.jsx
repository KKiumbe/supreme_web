import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
} from "@mui/material";
import {
  Search,
  Clear,
  FilterList,
  Visibility,
  GetApp,
} from "@mui/icons-material";
import { Typography } from "@mui/material";

const ConnectionFilters = ({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  schemeFilter,
  onSchemeFilterChange,
  zoneFilter,
  onZoneFilterChange,
  filterOpen,
  onFilterToggle,
  disconnectionSection,
  schemes,
  zones,
  statusOptions,
}) => {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <TextField
        fullWidth
        size="small"
        placeholder="Search by conn #, customer name, phone, meter..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
          endAdornment: search && (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => onSearchChange("")}>
                <Clear />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      {disconnectionSection}

      {/* Filters Collapse */}
      <Collapse in={filterOpen}>
        <Box
          sx={{
            p: 2,
            bgcolor: "background.paper",
            borderRadius: 1,
            boxShadow: 1,
          }}
        >
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <FormControl sx={{ minWidth: 160 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => onStatusFilterChange(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {statusOptions.map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 180 }}>
              <InputLabel>Scheme</InputLabel>
              <Select
                value={schemeFilter}
                label="Scheme"
                onChange={(e) => onSchemeFilterChange(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {schemes.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 180 }} disabled={!schemeFilter}>
              <InputLabel>Zone</InputLabel>
              <Select
                value={zoneFilter}
                label="Zone"
                onChange={(e) => onZoneFilterChange(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {zones
                  .filter(
                    (z) => !schemeFilter || z.schemeId === Number(schemeFilter),
                  )
                  .map((z) => (
                    <MenuItem key={z.id} value={z.id}>
                      {z.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
};

export default ConnectionFilters;
