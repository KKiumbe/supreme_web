import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
  Divider,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import axios from "axios";

const BASEURL = import.meta.env.VITE_BASE_URL;

const ConnectionDetailsPanel = ({ connectionNumber, onClose }) => {
  const [connection, setConnection] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!connectionNumber) {
      return;
    }

    let active = true;

    const fetchConnection = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await axios.get(
          `${BASEURL}/connection/${connectionNumber}`,
          {
            withCredentials: true,
          },
        );

        if (active) {
          setConnection(res.data.data);
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message || "Failed to load connection details",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchConnection();

    return () => {
      active = false;
    };
  }, [connectionNumber]);

  if (!connectionNumber) {
    return null;
  }

  const account = connection?.customerAccounts?.[0];

  return (
    <Box sx={{ position: "relative", minHeight: 350 }}>
      <IconButton
        sx={{ position: "absolute", top: 8, right: 8 }}
        size="small"
        onClick={onClose}
      >
        <Close />
      </IconButton>

      {loading && (
        <Box sx={{ mt: 5, textAlign: "center" }}>
          <CircularProgress size={28} />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 5 }}>
          {error}
        </Alert>
      )}

      {connection && !loading && (
        <Box sx={{ mt: 4, display: "flex", flexDirection: "column", gap: 2 }}>
          <Typography variant="h6">
            Connection #{connection.connectionNumber}
          </Typography>

          <Divider />

          {/* Customer */}
          <Box>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Customer
            </Typography>
            <Typography variant="body2">
              <strong>Name:</strong> {connection.customer?.customerName || "—"}
            </Typography>
            <Typography variant="body2">
              <strong>Phone:</strong> {connection.customer?.phoneNumber || "—"}
            </Typography>
            <Typography variant="body2">
              <strong>Email:</strong> {connection.customer?.email || "—"}
            </Typography>
          </Box>

          <Divider />

          {/* Account */}
          <Box>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Account
            </Typography>

            {account ? (
              <>
                <Typography variant="body2">
                  <strong>Account #:</strong> {account.customerAccount}
                </Typography>

                <Typography
                  variant="body2"
                  color={account.balance < 0 ? "error" : "inherit"}
                >
                  <strong>Balance:</strong> KES{" "}
                  {account.balance?.toLocaleString()}
                </Typography>

                <Typography variant="body2">
                  <strong>Deposit:</strong> KES{" "}
                  {account.deposit?.toLocaleString()}
                </Typography>
              </>
            ) : (
              <Typography variant="body2">No account found</Typography>
            )}
          </Box>

          <Divider />

          {/* Meter */}
          <Box>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Meter
            </Typography>

            <Typography variant="body2">
              <strong>Serial:</strong>{" "}
              {connection.meter?.serialNumber || "Not assigned"}
            </Typography>

            <Typography variant="body2">
              <strong>Status:</strong> {connection.meter?.status || "—"}
            </Typography>
          </Box>

          {/* Transactions */}
          {account?.transactions?.length > 0 && (
            <>
              <Divider />
              <Box>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Recent Transactions
                </Typography>

                {account.transactions.slice(0, 5).map((tx) => (
                  <Box key={tx.id} sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      {tx.type} — KES {tx.amount?.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </>
          )}
        </Box>
      )}
    </Box>
  );
};

export default ConnectionDetailsPanel;
