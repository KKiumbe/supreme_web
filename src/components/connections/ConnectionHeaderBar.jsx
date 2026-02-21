import { Box, Button, Typography } from "@mui/material";
import { Add, FilterList, GetApp, PowerOff } from "@mui/icons-material";

const ConnectionHeaderBar = ({
  activeTab,
  loading,
  currentUser,
  onDisconnectionClick,
  onFilterClick,
  onExportClick,
  onNewConnectionClick,
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 2,
      }}
    >
      <Typography variant="h5" fontWeight={600}>
        Connections
      </Typography>

      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
        {activeTab === 0 && (
          <>
            <Button
              variant="outlined"
              color="error"
              startIcon={<PowerOff />}
              onClick={onDisconnectionClick}
              disabled={loading}
            >
              Create Disconnection Task
            </Button>

            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={onFilterClick}
            >
              Filters
            </Button>

            <Button
              variant="outlined"
              startIcon={<GetApp />}
              onClick={onExportClick}
            >
              Export CSV
            </Button>

            {currentUser?.role === "ADMIN" && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={onNewConnectionClick}
              >
                New Connection
              </Button>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

export default ConnectionHeaderBar;
