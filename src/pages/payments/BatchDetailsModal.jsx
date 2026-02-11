import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  Chip,
  Paper,
  Grid,
  Skeleton,
  Alert,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { Close as CloseIcon } from "@mui/icons-material";
import axios from "axios";
import { toast } from "react-toastify";

/**
 * BatchDetailsModal Component
 * Displays detailed rows from a bank upload batch
 * @param {Object} props
 * @param {boolean} props.open - Whether the modal is open
 * @param {Function} props.onClose - Callback when modal closes
 * @param {Object} props.batch - The batch object containing { id, bank, filename, totalRows, processedRows, status }
 */
const BatchDetailsModal = ({ open, onClose, batch }) => {
  const BASEURL = import.meta.env.VITE_BASE_URL;
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 0,
    pageSize: 10,
    total: 0,
  });

  /**
   * Fetch batch rows from API
   */
  const fetchBatchRows = useCallback(async () => {
    if (!batch?.id) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: (pagination.page + 1).toString(),
        limit: pagination.pageSize.toString(),
      });

      console.warn("📊 Fetching batch rows:", {
        batchId: batch.id,
        page: pagination.page,
        pageSize: pagination.pageSize,
        endpoint: `/payments/upload-batch/${batch.id}/rows`,
      });

      const response = await axios.get(
        `${BASEURL}/payments/upload-batch/${batch.id}/rows?${params.toString()}`,
        { withCredentials: true },
      );

      console.warn("📋 Batch rows response:", response.data);

      setRows(response.data?.data ?? []);
      setPagination((prev) => ({
        ...prev,
        total: response.data?.pagination?.total ?? 0,
      }));
    } catch (err) {
      console.error("Error fetching batch rows:", err);
      setError(err.response?.data?.message || "Failed to fetch batch details");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [batch?.id, pagination.page, pagination.pageSize, BASEURL]);

  /**
   * Fetch rows when modal opens or pagination changes
   */
  useEffect(() => {
    if (open && batch?.id) {
      fetchBatchRows();
    }
  }, [open, batch?.id, pagination.page, pagination.pageSize, fetchBatchRows]);

  /**
   * Normalize rows for DataGrid
   */
  const normalizedRows = useMemo(
    () =>
      rows.map((row) => ({
        id: row.id,
        status: row.status,
        connectionNumber: row.connectionNumber,
        amount: row.amount,
        paidAt: new Date(row.paidAt)?.toLocaleString() || "N/A",
        bankReference: row.bankReference,
        failureReason: row.failureReason || "N/A",
        narration: row.rawData?.narration || "N/A",
      })),
    [rows],
  );

  /**
   * DataGrid columns definition
   */
  const columns = useMemo(
    () => [
      {
        field: "status",
        headerName: "Status",
        width: 100,
        renderCell: (params) => (
          <Chip
            size="small"
            label={params.value}
            color={params.value === "POSTED" ? "success" : "error"}
            variant="outlined"
          />
        ),
      },
      { field: "connectionNumber", headerName: "Connection #", width: 130 },
      { field: "amount", headerName: "Amount", width: 100 },
      { field: "paidAt", headerName: "Paid At", width: 180 },
      { field: "bankReference", headerName: "Reference", width: 140 },
      { field: "narration", headerName: "Narration", width: 250, flex: 1 },
      {
        field: "failureReason",
        headerName: "Failure Reason",
        width: 180,
        renderCell: (params) => (
          <Typography
            variant="body2"
            sx={{
              color: params.value === "N/A" ? "text.secondary" : "error.main",
            }}
          >
            {params.value}
          </Typography>
        ),
      },
    ],
    [],
  );

  if (!batch) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      {/* Header */}
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          <Typography variant="h6">Batch Details</Typography>
          <Typography variant="body2" color="text.secondary">
            {batch.filename}
          </Typography>
        </Box>
        <Button onClick={onClose} size="small" startIcon={<CloseIcon />}>
          Close
        </Button>
      </DialogTitle>

      {/* Content */}
      <DialogContent dividers>
        {/* Batch Summary Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                Bank
              </Typography>
              <Typography variant="h6">{batch.bank}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                Total Rows
              </Typography>
              <Typography variant="h6">{batch.totalRows}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                Processed
              </Typography>
              <Typography variant="h6" sx={{ color: "success.main" }}>
                {batch.processedRows}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                Status
              </Typography>
              <Chip
                label={batch.status}
                color={batch.status === "POSTED" ? "success" : "warning"}
                size="small"
                sx={{ mt: 1 }}
              />
            </Paper>
          </Grid>
        </Grid>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Data Grid */}
        <Box sx={{ height: 450, width: "100%" }}>
          {loading ? (
            <>
              <Skeleton height={60} />
              <Skeleton height={350} />
            </>
          ) : (
            <DataGrid
              rows={normalizedRows}
              columns={columns}
              paginationMode="server"
              rowCount={pagination.total}
              pageSizeOptions={[10, 20, 50]}
              paginationModel={{
                page: pagination.page,
                pageSize: pagination.pageSize,
              }}
              onPaginationModelChange={(model) =>
                setPagination((prev) => ({
                  ...prev,
                  page: model.page,
                  pageSize: model.pageSize,
                }))
              }
              disableRowSelectionOnClick
              slots={{
                noRowsOverlay: () => (
                  <Box
                    height="100%"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Typography color="text.secondary">
                      No rows found
                    </Typography>
                  </Box>
                ),
              }}
              sx={{ "& .MuiDataGrid-root": { border: "none" } }}
            />
          )}
        </Box>
      </DialogContent>

      {/* Footer */}
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BatchDetailsModal;
