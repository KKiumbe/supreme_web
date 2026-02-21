import React from "react";
import { Box, Typography, IconButton, Divider } from "@mui/material";
import { Clear } from "@mui/icons-material";

const ConnectionDetailsPanel = ({ connection, onClose }) => {
  if (!connection) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography color="text.secondary">
          Select a connection to view details
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6" fontWeight={600}>
          Connection #{connection.connectionNumber}
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <Clear />
        </IconButton>
      </Box>

      <Divider />

      {/* Customer section */}
      <Box>
        <Typography
          variant="subtitle2"
          color="text.secondary"
          gutterBottom
          fontWeight={600}
        >
          Customer
        </Typography>
        <Typography variant="body2">
          <strong>Name:</strong> {connection.customerName || "—"}
        </Typography>
        <Typography variant="body2">
          <strong>Phone:</strong> {connection.customerPhoneNumber || "—"}
        </Typography>
        <Typography variant="body2">
          <strong>Email:</strong> {connection.customerEmail || "—"}
        </Typography>
        <Typography variant="body2">
          <strong>Account #:</strong> {connection.customerAccount || "—"}
        </Typography>
      </Box>

      <Divider />

      {/* Connection / Meter section */}
      <Box>
        <Typography
          variant="subtitle2"
          color="text.secondary"
          gutterBottom
          fontWeight={600}
        >
          Connection & Meter
        </Typography>
        <Typography variant="body2">
          <strong>Status:</strong> {connection.status}
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          <strong>Meter Serial:</strong>{" "}
          {connection.meterSerialNumber || "Not assigned"}
        </Typography>
        <Typography variant="body2">
          <strong>Meter Model:</strong> {connection.meterModel || "—"}
        </Typography>
        <Typography variant="body2">
          <strong>Plot Number:</strong> {connection.plotNumber || "—"}
        </Typography>
      </Box>

      <Divider />

      {/* Location section */}
      <Box>
        <Typography
          variant="subtitle2"
          color="text.secondary"
          gutterBottom
          fontWeight={600}
        >
          Location
        </Typography>
        <Typography variant="body2">
          <strong>Scheme:</strong> {connection.schemeName || "—"}
        </Typography>
        <Typography variant="body2">
          <strong>Zone:</strong> {connection.zoneName || "—"}
        </Typography>
        <Typography variant="body2">
          <strong>Route:</strong> {connection.routeName || "—"}
        </Typography>
      </Box>

      <Divider />

      {/* Tariff & Financials */}
      <Box>
        <Typography
          variant="subtitle2"
          color="text.secondary"
          gutterBottom
          fontWeight={600}
        >
          Tariff & Balance
        </Typography>
        <Typography variant="body2">
          <strong>Tariff Category:</strong>{" "}
          {connection.tariffCategoryName || "—"}
        </Typography>
        <Typography
          variant="body2"
          color={connection.customerAccountBalance < 0 ? "error" : "inherit"}
        >
          <strong>Account Balance:</strong> KES{" "}
          {connection.customerAccountBalance?.toLocaleString() || "0"}
        </Typography>
        <Typography variant="body2">
          <strong>Deposit:</strong> KES{" "}
          {connection.customerAccountDeposit?.toLocaleString() || "0"}
        </Typography>
      </Box>
    </Box>
  );
};

export default ConnectionDetailsPanel;
