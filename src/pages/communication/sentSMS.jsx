import { useState, useEffect } from "react";
import { DataGrid } from "@mui/x-data-grid";
import {
  Box,
  Alert,
  CircularProgress,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  useTheme,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
} from "@mui/material";
import axios from "axios";
import TitleComponent from "../../components/title";
import {
  PermissionDeniedUI,
  isPermissionDenied,
} from "../../utils/permissionHelper";

const SentSMSPage = () => {
  const [smsMessages, setSmsMessages] = useState([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const theme = useTheme();
  const BASEURL = import.meta.env.VITE_BASE_URL;

  const fetchSmsMessages = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `${BASEURL}/sms-history?page=${page + 1}&limit=${pageSize}&search=${encodeURIComponent(
          searchQuery,
        )}&status=${statusFilter}`,
        { withCredentials: true },
      );
      const { data, totalRecords } = response.data;
      setSmsMessages(data || []);
      setTotalRows(totalRecords || 0);
      setPermissionDenied(false);
    } catch (error) {
      console.error("Error fetching SMS messages:", error);
      if (isPermissionDenied(error)) {
        setPermissionDenied(true);
        setSmsMessages([]);
        setTotalRows(0);
      } else {
        setError(
          error.response?.data?.message || "Failed to fetch SMS messages.",
        );
        setSmsMessages([]);
        setTotalRows(0);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSmsMessages();
  }, [page, pageSize, searchQuery, statusFilter]);

  const handleOpenDialog = (message) => {
    setSelectedMessage(message);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedMessage("");
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setPage(0); // Reset to first page on search
  };

  const handleStatusChange = (event) => {
    setStatusFilter(event.target.value);
    setPage(0); // Reset to first page on status change
  };

  const columns = [
    { field: "id", headerName: "ID", width: 100 },
    { field: "mobile", headerName: "Mobile", width: 150 },
    {
      field: "message",
      headerName: "Message",
      width: 400,
      renderCell: (params) => (
        <Box
          sx={{
            cursor: "pointer",
            "&:hover": { textDecoration: "underline" },
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          onClick={() => handleOpenDialog(params.value)}
        >
          {params.value || "N/A"}
        </Box>
      ),
    },
    { field: "status", headerName: "Status", width: 120 },
    {
      field: "createdAt",
      headerName: "Date Sent",
      width: 180,
      renderCell: (params) => {
        if (!params?.value) {
          return "N/A";
        }
        try {
          return new Date(params.value).toLocaleString(undefined, {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          });
        } catch (error) {
          console.error("Invalid Date:", params.value);
          return "Invalid Date";
        }
      },
    },
  ];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        padding: 2,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {permissionDenied ? (
        <PermissionDeniedUI permission="sms:view" />
      ) : (
        <>
          <Box
            sx={{
              minWidth: 600,
              maxWidth: 1200,
              width: "100%",
            }}
          >
            <Typography
              component="div"
              variant="h4"
              sx={{ color: theme.palette.primary.contrastText, mb: 2, ml: -5 }}
            >
              <TitleComponent title="Sent Messages History" />
            </Typography>

            {/* Search and Filter Controls */}
            <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
              <TextField
                label="Search by Mobile or Message"
                variant="outlined"
                value={searchQuery}
                onChange={handleSearchChange}
                sx={{ width: 300 }}
              />
              <FormControl sx={{ width: 200 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={handleStatusChange}
                  label="Status"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="PENDING">Pending</MenuItem>
                  <MenuItem value="SENT">Sent</MenuItem>
                  <MenuItem value="FAILED">Failed</MenuItem>
                  <MenuItem value="DELIVERED">Delivered</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 2,
                  borderRadius: 2,
                  bgcolor: theme.palette.grey[300],
                }}
              >
                {error}
              </Alert>
            )}

            {loading ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "50vh",
                }}
              >
                <CircularProgress
                  size={70}
                  sx={{ color: theme.palette.primary.main }}
                />
              </Box>
            ) : (
              <Box sx={{ height: 600, width: "100%" }}>
                <DataGrid
                  rows={smsMessages}
                  columns={columns}
                  paginationMode="server"
                  rowCount={totalRows || 0}
                  pageSizeOptions={[10, 20, 50]}
                  paginationModel={{ page, pageSize }}
                  onPaginationModelChange={(params) => {
                    setPage(params.page);
                    setPageSize(params.pageSize);
                  }}
                  loading={loading}
                  getRowId={(row) => row.id}
                />
              </Box>
            )}
            {!loading && (
              <Typography
                sx={{
                  textAlign: "center",
                  mt: 2,
                  color:
                    theme.palette.mode === "dark"
                      ? theme.palette.grey[100]
                      : theme.palette.grey[900],
                }}
              >
                Page {page + 1} of {Math.ceil(totalRows / pageSize) || 1}
              </Typography>
            )}
          </Box>

          {/* Dialog for displaying full message */}
          <Dialog
            open={openDialog}
            onClose={handleCloseDialog}
            aria-labelledby="message-dialog-title"
            aria-describedby="message-dialog-description"
            sx={{
              "& .MuiDialog-paper": { minWidth: "300px", maxWidth: "500px" },
            }}
          >
            <DialogTitle id="message-dialog-title">Message Content</DialogTitle>
            <DialogContent>
              <DialogContentText
                id="message-dialog-description"
                sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
              >
                {selectedMessage || "No message content available."}
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog} color="primary">
                Close
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Box>
  );
};

export default SentSMSPage;
