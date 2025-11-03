import { useState, useEffect, useMemo } from "react";
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
} from "@mui/material";
import axios from "axios";
import { debounce } from "lodash";
import TitleComponent from "../../components/title";

const Receipts = () => {
  const [receipts, setReceipts] = useState([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const theme = useTheme();
  const BASEURL = import.meta.env.VITE_BASE_URL;

  /** Fetch receipts from API */
  const fetchReceipts = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `${BASEURL}/receipts?page=${page + 1}&limit=${pageSize}&search=${encodeURIComponent(searchQuery)}`,
        { withCredentials: true }
      );

      const { data, totalRecords } = response.data;
      setReceipts(data || []);
      setTotalRows(totalRecords || 0);
    } catch (error) {
      console.error("Error fetching receipts:", error);
      setError(error.response?.data?.message || "Failed to fetch receipts.");
      setReceipts([]);
      setTotalRows(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, [page, pageSize, searchQuery]);

  /** Debounced search handler */
  const debouncedSearch = useMemo(
    () =>
      debounce((value) => {
        setSearchQuery(value);
        setPage(0);
      }, 500),
    []
  );

  const handleSearchChange = (event) => debouncedSearch(event.target.value);

  /** Dialog handlers */
  const handleOpenDialog = (row) => {
    setSelectedDetails({
      receiptNumber: row.receiptNumber,
      customerName: row.customer?.customerName,
      phoneNumber: row.customer?.phoneNumber || row.phoneNumber,
      amount: row.amount,
      modeOfPayment: row.modeOfPayment,
      transactionId: row.payment?.transactionId,
      paidBy: row.paidBy,
      createdAt: row.createdAt,
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedDetails(null);
  };

  /** Table columns */
  const columns = useMemo(
    () => [
      { field: "receiptNumber", headerName: "Receipt Number", width: 150 },
      { field: "customerName", headerName: "Customer Name", width: 200, },
      { field: "phoneNumber", headerName: "Phone Number", width: 150, },
      { field: "amount", headerName: "Amount", width: 120 },
      { field: "modeOfPayment", headerName: "Payment Mode", width: 150 },
      {
        field: "transactionId",
        headerName: "Transaction ID",
        width: 180,
        valueGetter: (params) => params.row.payment?.transactionId || "N/A",
      },
      {
        field: "createdAt",
        headerName: "Date",
        width: 180,
        valueFormatter: (params) =>
          new Date(params.value).toLocaleString(undefined, {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          }),
      },
      {
        field: "details",
        headerName: "Details",
        width: 120,
        sortable: false,
        renderCell: (params) => (
          <Button variant="text" onClick={() => handleOpenDialog(params.row)}>
            View
          </Button>
        ),
      },
    ],
    []
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        p: 2,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Box sx={{ minWidth: 600, maxWidth: 1200, width: "100%" }}>
        <Typography component="div" variant="h4" sx={{ mb: 2, ml: -5 }}>
          <TitleComponent title="Receipts History" />
        </Typography>

        {/* Search */}
        <Box sx={{ mb: 2 }}>
          <TextField
            label="Search by Receipt, Customer, Phone, or Transaction ID"
            variant="outlined"
            onChange={handleSearchChange}
            sx={{ width: 400 }}
          />
        </Box>

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 2, borderRadius: 2, bgcolor: theme.palette.grey[200] }}
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
            <CircularProgress size={70} color="primary" />
          </Box>
        ) : (
          <Box sx={{ height: 600, width: "100%" }}>
            <DataGrid
              rows={receipts}
              columns={columns}
              getRowId={(row) => row.id}
              paginationMode="server"
              rowCount={totalRows}
              pageSizeOptions={[10, 20, 50]}
              paginationModel={{ page, pageSize }}
              onPaginationModelChange={(params) => {
                setPage(params.page);
                setPageSize(params.pageSize);
              }}
              loading={loading}
              disableRowSelectionOnClick
            />
          </Box>
        )}

        {!loading && totalRows > 0 && (
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

      {/* Receipt Details Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        aria-labelledby="receipt-dialog-title"
        sx={{ "& .MuiDialog-paper": { minWidth: 320, maxWidth: 480 } }}
      >
        <DialogTitle id="receipt-dialog-title">Receipt Details</DialogTitle>
        <DialogContent>
          <DialogContentText
            sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
          >
            {selectedDetails ? (
              <>
                <strong>Receipt Number:</strong> {selectedDetails.receiptNumber}
                <br />
                <strong>Customer Name:</strong>{" "}
                {selectedDetails.customerName || "N/A"}
                <br />
                <strong>Phone Number:</strong> {selectedDetails.phoneNumber}
                <br />
                <strong>Amount:</strong> {selectedDetails.amount}
                <br />
                <strong>Payment Mode:</strong>{" "}
                {selectedDetails.modeOfPayment || "N/A"}
                <br />
                <strong>Transaction ID:</strong>{" "}
                {selectedDetails.transactionId || "N/A"}
                <br />
                <strong>Paid By:</strong> {selectedDetails.paidBy || "N/A"}
                <br />
                <strong>Date:</strong>{" "}
                {selectedDetails.createdAt
                  ? new Date(selectedDetails.createdAt).toLocaleString()
                  : "N/A"}
              </>
            ) : (
              "No details available."
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} variant="contained" color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Receipts;
