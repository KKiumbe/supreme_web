import { Box, Typography, Chip } from "@mui/material";
import { LockOutlined } from "@mui/icons-material";

/**
 * Check if an error is a 403 Permission Denied error
 * @param {Error} error - The error object to check
 * @returns {boolean} - True if the error is a 403 permission denied error
 */
export const isPermissionDenied = (error) => {
  return error?.response?.status === 403;
};

/**
 * Reusable Permission Denied UI Component
 * @param {Object} props
 * @param {string|string[]} props.permission - Required permission(s)
 * @param {string} props.message - Optional custom message
 */
export const PermissionDeniedUI = ({ permission, message }) => {
  const permissions = Array.isArray(permission) ? permission : [permission];

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "400px",
        py: 6,
        gap: 2,
      }}
    >
      <Box
        sx={{
          width: 120,
          height: 120,
          borderRadius: "50%",
          bgcolor: (theme) =>
            theme.palette.mode === "dark"
              ? "rgba(244, 67, 54, 0.05)"
              : "rgba(244, 67, 54, 0.03)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 2,
        }}
      >
        <LockOutlined
          sx={{
            fontSize: 80,
            color: (theme) => theme.palette.text.secondary,
          }}
        />
      </Box>
      <Typography variant="h4" fontWeight="bold" color="text.primary">
        Access Denied
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        textAlign="center"
        maxWidth={500}
      >
        {message ||
          "You don't have permission to access this resource. Please contact your administrator to request access."}
      </Typography>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 1,
          mt: 2,
          justifyContent: "center",
        }}
      >
        {permissions.map((perm) => (
          <Chip
            key={perm}
            label={`Permission Required: ${perm}`}
            color="error"
            variant="outlined"
            size="small"
          />
        ))}
      </Box>
    </Box>
  );
};
