import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { createBillType, fetchBillTypes } from "./api/billtypes";

const BillTypeScreen = () => {
  const [billTypes, setBillTypes] = useState([]);
  const [newBillType, setNewBillType] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  // ✅ Fetch all bill types on mount
  useEffect(() => {
    const loadBillTypes = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchBillTypes();
        setBillTypes(res.data || []);
      } catch (err) {
        setError("Failed to fetch bill types.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadBillTypes();
  }, []);

  // ✅ Create a new bill type
  const handleCreate = async () => {
    if (!newBillType.trim()) {
      setError("Please enter a bill type name.");
      return;
    }

    setCreating(true);
    setError(null);
    setMessage("");
    try {
      const res = await createBillType(newBillType);
      setMessage(res.message);
      setBillTypes((prev) => [...prev, res.data]);
      setNewBillType("");
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Failed to create bill type.");
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        minHeight: "100vh",
        minWidth:"100vh",
       
        py: 6,
        px: 2,
        ml:20
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 900,
        }}
      >
        <Typography
          variant="h5"
          gutterBottom
          fontWeight={600}
          textAlign="center"
          mb={4}
        >
          Bill Types Manager
        </Typography>

        {/* Create Bill Type */}
        <Paper
          sx={{
            p: 3,
            mb: 4,
            borderRadius: 3,
            boxShadow: 2,
          }}
        >
          <Typography variant="subtitle1" gutterBottom fontWeight={500}>
            Add New Bill Type
          </Typography>

          <Box
            display="flex"
            flexDirection={isSmallScreen ? "column" : "row"}
            gap={2}
            mt={1}
          >
            <TextField
              label="Bill Type Name"
              value={newBillType}
              onChange={(e) => setNewBillType(e.target.value)}
              fullWidth
              variant="outlined"
              size="small"
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreate}
              disabled={creating}
              sx={{
                minWidth: 120,
                height: 40,
                alignSelf: isSmallScreen ? "flex-end" : "center",
              }}
            >
              {creating ? <CircularProgress size={22} /> : "Add"}
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
          {message && (
            <Alert severity="success" sx={{ mt: 2 }}>
              {message}
            </Alert>
          )}
        </Paper>

        {/* Table of Bill Types */}
        <Paper
          sx={{
            p: 3,
            borderRadius: 3,
            boxShadow: 2,
            
          }}
        >
          <Typography variant="subtitle1" gutterBottom fontWeight={500}>
            Existing Bill Types
          </Typography>

          {loading ? (
            <Box textAlign="center" py={3}>
              <CircularProgress />
            </Box>
          ) : billTypes.length === 0 ? (
            <Typography sx={{ textAlign: "center", py: 2 }}>
              No bill types found.
            </Typography>
          ) : (
            <TableContainer sx={{ mt: 2 }}>
              <Table size={isSmallScreen ? "small" : "medium"}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Bill Type Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Bill Type ID</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {billTypes.map((type, index) => (
                    <TableRow key={type.id || index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{type.name}</TableCell>
                      <TableCell sx={{ wordBreak: "break-word" }}>
                        {type.id}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default BillTypeScreen;
