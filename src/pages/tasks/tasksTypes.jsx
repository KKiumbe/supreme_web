import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Stack,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import axios from "axios";

const BASEURL = import.meta.env.VITE_BASE_URL;

export default function TaskTypesScreen() {
  const [taskTypes, setTaskTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  // Fetch task types
  const fetchTaskTypes = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASEURL}/get-tasks-types`, { withCredentials: true });
      setTaskTypes(res.data || []);
    } catch (err) {
      console.error(err);
      setResponse("Failed to fetch task types.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskTypes();
  }, []);

  // Handle creating a new task type
  const handleCreateTaskType = async () => {
    if (!name || !code || !description) {
      setResponse("All fields are required.");
      return;
    }

    setCreating(true);
    setResponse(null);

    try {
      await axios.post(
        `${BASEURL}/create-task-type`,
        { name, code, description },
        { withCredentials: true }
      );
      setResponse("Task type created successfully!");
      setName("");
      setCode("");
      setDescription("");
      fetchTaskTypes();
    } catch (err) {
      console.error(err);
      setResponse("Failed to create task type.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4,ml:15, mb: 4 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 } }}>
        <Typography variant="h5" mb={3} textAlign="center">
          Task Types
        </Typography>

        {response && <Alert severity="info" sx={{ mb: 2 }}>{response}</Alert>}

        {/* Create Task Type Form */}
        <Box mb={4}>
          <Typography variant="h6" mb={2}>
            Create New Task Type
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
            />
            <TextField
              label="Code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              fullWidth
              placeholder="E.g. MTR_READING"
            />
            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              rows={3}
            />
            <Button
              variant="contained"
              onClick={handleCreateTaskType}
              disabled={creating}
              startIcon={creating && <CircularProgress size={20} />}
            >
              Create Task Type
            </Button>
          </Stack>
        </Box>

        {/* Render Task Types Table */}
        <Box>
          <Typography variant="h6" mb={2}>
            Existing Task Types
          </Typography>
          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>System Type</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {taskTypes.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>{task.name}</TableCell>
                      <TableCell>{task.code}</TableCell>
                      <TableCell>{task.description}</TableCell>
                      <TableCell>{task.isSystem ? "Yes" : "No"}</TableCell>
                    </TableRow>
                  ))}
                  {taskTypes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No task types available.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Paper>
    </Container>
  );
}
