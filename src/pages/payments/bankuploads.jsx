import { useState, useEffect, useCallback, useMemo } from "react";
import {
  PermissionDeniedUI,
  isPermissionDenied,
} from "../../utils/permissionHelper";
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Tooltip,
  Grid,
  Skeleton,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import {
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import axios from "axios";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import apiClient from "../../services/apiClient";
import BatchDetailsModal from "./BatchDetailsModal";

/* -------------------------------------------------------
   CONSTANTS
------------------------------------------------------- */
const BANK_OPTIONS = [
  { label: "Equity Bank", value: "EQUITY", endpoint: "equity" },
  {
    label: "Consolidated Bank",
    value: "CONSOLIDATED",
    endpoint: "consolidated",
  },
  { label: "M-Pesa", value: "MPESA", endpoint: "mpesa-upload" },
];

/* -------------------------------------------------------
   Screen
------------------------------------------------------- */
const BankUploadsScreen = () => {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.currentUser);
  const BASEURL = import.meta.env.VITE_BASE_URL;

  /* -------------------------------------------------------
     Auth Guard
  ------------------------------------------------------- */
  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  /* -------------------------------------------------------
     State
  ------------------------------------------------------- */
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
  });

  // Modal state
  const [open, setOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState(""); // "preparing", "uploading", "processing"

  // Mark as processed state
  const [processingBatchId, setProcessingBatchId] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    batchId: null,
  });

  // Batch details modal state
  const [batchDetailsOpen, setBatchDetailsOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);

  /* -------------------------------------------------------
     Fetch Upload Batches
  ------------------------------------------------------- */
  const fetchUploads = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.pageSize?.toString(),
      });

      const res = await axios.get(
        `${BASEURL}/payments/bank-uploads?${params.toString()}`,
        { withCredentials: true },
      );

      setRows(res.data?.data ?? []);
      setPagination((prev) => ({
        ...prev,
        total: res.data.pagination.total,
      }));
      setPermissionDenied(false);
    } catch (err) {
      if (isPermissionDenied(err)) {
        setPermissionDenied(true);
        setRows([]);
        setPagination((prev) => ({
          ...prev,
          total: 0,
        }));
      } else {
        setError(err.response?.data?.message || "Failed to load uploads");
        setRows([]);
      }
    } finally {
      setLoading(false);
    }
  }, [BASEURL, pagination.page, pagination.pageSize]);

  useEffect(() => {
    fetchUploads();
  }, [fetchUploads]);

  /* -------------------------------------------------------
     Upload Handler
  ------------------------------------------------------- */

  const handleUpload = async () => {
    if (!selectedBank || !file) {
      return;
    }

    const bank = BANK_OPTIONS.find((b) => b.value === selectedBank);
    if (!bank) {
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("bank", selectedBank);

    setUploading(true);
    setUploadStatus("preparing");
    setUploadProgress(10);

    try {
      let uploadUrl;
      if (selectedBank === "MPESA") {
        uploadUrl = `${BASEURL}/payments/${bank.endpoint}`;
      } else {
        // Bank uploads use the bank-upload endpoint
        uploadUrl = `${BASEURL}/payments/bank-upload/${bank.endpoint}`;
      }

      console.warn("📤 Uploading to endpoint:", uploadUrl);
      console.warn("📋 File:", file.name, "Bank:", selectedBank);
      console.warn("📦 File size:", (file.size / 1024 / 1024).toFixed(2), "MB");
      console.warn("📋 FormData contents:", {
        bank: selectedBank,
        fileName: file.name,
      });

      setUploadStatus("uploading");
      setUploadProgress(30);

      const response = await axios.post(uploadUrl, formData, {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );
            setUploadProgress(30 + percentCompleted * 0.6);
          }
        },
      });

      console.warn("✅ Upload response:", response.data);

      setUploadStatus("processing");
      setUploadProgress(95);

      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setOpen(false);
      setSelectedBank("");
      setFile(null);
      setUploadProgress(0);
      setUploadStatus("");
      fetchUploads();
      toast.success("✅ File uploaded and processed successfully!");
    } catch (err) {
      console.error("❌ Upload error:", err);
      setUploadStatus("error");
      setUploadProgress(0);
      toast.error(err.response?.data?.message || "❌ Upload failed");
    } finally {
      setUploading(false);
    }
  };

  /* -------------------------------------------------------
     Mark as Processed Handler
  ------------------------------------------------------- */
  const handleMarkAsProcessed = async (batchId) => {
    setProcessingBatchId(batchId);
    try {
      await apiClient.patch(`/payments/bank-uploads/${batchId}/mark-processed`);

      toast.success("Batch marked as processed successfully");
      setConfirmDialog({ open: false, batchId: null });
      fetchUploads(); // Refresh the list
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to mark as processed");
    } finally {
      setProcessingBatchId(null);
    }
  };

  const openConfirmDialog = (batchId) => {
    setConfirmDialog({ open: true, batchId });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog({ open: false, batchId: null });
  };

  const openBatchDetails = (batch) => {
    setSelectedBatch(batch);
    setBatchDetailsOpen(true);
  };

  const closeBatchDetails = () => {
    setBatchDetailsOpen(false);
    setSelectedBatch(null);
  };

  /* -------------------------------------------------------
     CSV Export
  ------------------------------------------------------- */
  const exportToCSV = (data, filename) => {
    const headers = [
      "Bank",
      "Filename",
      "Variant",
      "Total Rows",
      "Processed Rows",
      "Status",
      "Uploaded By",
      "Created At",
    ];

    const rows = data.map((r) =>
      [
        r.bank,
        r.filename,
        r.variant,
        r.totalRows,
        r.processedRows,
        r.status,
        r.uploadedBy,
        r.createdAt,
      ]
        .map((v) => `"${v}"`)
        .join(","),
    );

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* -------------------------------------------------------
     Normalize for DataGrid
  ------------------------------------------------------- */
  const normalizedRows = useMemo(
    () =>
      rows.map((r) => ({
        id: r.id,
        bank: r.bank,
        filename: r.filename,
        variant: r.variant,
        totalRows: r.totalRows,
        processedRows: r.processedRows,
        status: r.status,
        uploadedBy: r.uploadedBy,
        createdAt: new Date(r.createdAt)?.toLocaleString(),
      })),
    [rows],
  );

  /* -------------------------------------------------------
     Columns
  ------------------------------------------------------- */
  const columns = useMemo(
    () => [
      { field: "bank", headerName: "Bank", width: 120 },
      { field: "filename", headerName: "Filename", width: 180 },
      {
        field: "variant",
        headerName: "Variant",
        width: 120,
        renderCell: (p) => <Chip size="small" label={p.value} />,
      },
      { field: "totalRows", headerName: "Rows", width: 100 },
      { field: "processedRows", headerName: "Processed", width: 120 },
      {
        field: "status",
        headerName: "Status",
        width: 120,
        renderCell: (p) => (
          <Chip
            size="small"
            color={p.value === "POSTED" ? "success" : "warning"}
            label={p.value}
          />
        ),
      },
      { field: "uploadedBy", headerName: "Uploaded By", width: 120 },
      { field: "createdAt", headerName: "Created At", width: 200 },
      {
        field: "actions",
        headerName: "Actions",
        width: 200,
        sortable: false,
        renderCell: (params) => (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Tooltip title="View Details">
              <IconButton
                size="small"
                color="info"
                onClick={() => openBatchDetails(params.row)}
              >
                <VisibilityIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Mark as Processed">
              <span>
                <IconButton
                  size="small"
                  color="success"
                  onClick={() => openConfirmDialog(params.row.id)}
                  disabled={
                    params.row.status === "POSTED" ||
                    processingBatchId === params.row.id
                  }
                >
                  {processingBatchId === params.row.id ? (
                    <CircularProgress size={20} />
                  ) : (
                    <CheckCircleIcon />
                  )}
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        ),
      },
    ],
    [processingBatchId],
  );

  /* -------------------------------------------------------
     Render
  ------------------------------------------------------- */
  return (
    <Box sx={{ p: 3, minHeight: "100vh" }}>
      {permissionDenied ? (
        <PermissionDeniedUI permission="payments:bank-uploads" />
      ) : (
        <>
          {/* Header */}
          <Grid
            container
            justifyContent="space-between"
            alignItems="center"
            mb={3}
          >
            <Typography variant="h5" fontWeight="bold">
              Bank Uploads
            </Typography>

            <Box>
              <Tooltip title="New Upload">
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  sx={{ mr: 1 }}
                  onClick={() => setOpen(true)}
                >
                  New Upload
                </Button>
              </Tooltip>

              <Tooltip title="Refresh">
                <IconButton onClick={fetchUploads}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title="Export CSV">
                <IconButton
                  onClick={() =>
                    exportToCSV(normalizedRows, "bank_uploads.csv")
                  }
                >
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>

          {/* Table */}
          <Paper sx={{ minHeight: 420 }}>
            {loading ? (
              <>
                <Skeleton height={60} />
                <Skeleton height={360} />
              </>
            ) : (
              <DataGrid
                rows={normalizedRows}
                columns={columns}
                paginationMode="server"
                rowCount={pagination.total}
                pageSizeOptions={[10, 20, 50]}
                paginationModel={{
                  page: pagination.page - 1,
                  pageSize: pagination.pageSize,
                }}
                onPaginationModelChange={(model) =>
                  setPagination((prev) => ({
                    ...prev,
                    page: model.page + 1,
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
                        {error || "No uploads found"}
                      </Typography>
                    </Box>
                  ),
                }}
                sx={{ height: "100%" }}
              />
            )}
          </Paper>

          {/* Upload Modal */}
          <Dialog
            open={open}
            onClose={() => !uploading && setOpen(false)}
            maxWidth="sm"
            fullWidth
            disableEscapeKeyDown={uploading}
          >
            <DialogTitle>
              {uploading ? `Uploading... ${uploadStatus}` : "New Bank Upload"}
            </DialogTitle>

            <DialogContent>
              {uploading ? (
                <Box sx={{ py: 3, textAlign: "center" }}>
                  <CircularProgress
                    variant="determinate"
                    value={uploadProgress}
                    size={100}
                    sx={{ mb: 2 }}
                  />
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    {uploadProgress.toFixed(0)}%
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    {uploadStatus === "preparing" && "📦 Preparing file..."}
                    {uploadStatus === "uploading" &&
                      `📤 Uploading ${file?.name}...`}
                    {uploadStatus === "processing" && "⚙️ Processing upload..."}
                    {uploadStatus === "error" && "❌ Upload failed"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {file &&
                      `File size: ${(file.size / 1024 / 1024).toFixed(2)} MB`}
                  </Typography>
                </Box>
              ) : (
                <>
                  <TextField
                    select
                    fullWidth
                    label="Bank"
                    margin="normal"
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                  >
                    {BANK_OPTIONS.map((b) => (
                      <MenuItem key={b.value} value={b.value}>
                        {b.label}
                      </MenuItem>
                    ))}
                  </TextField>

                  <Button
                    variant="outlined"
                    component="label"
                    fullWidth
                    sx={{ mt: 2 }}
                  >
                    {file ? `✅ ${file.name}` : "Choose Excel File"}
                    <input
                      type="file"
                      hidden
                      accept=".xlsx,.xls"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                  </Button>
                </>
              )}
            </DialogContent>

            <DialogActions>
              <Button onClick={() => setOpen(false)} disabled={uploading}>
                {uploading ? "Uploading..." : "Cancel"}
              </Button>
              <Button
                variant="contained"
                onClick={handleUpload}
                disabled={!selectedBank || !file || uploading}
              >
                {uploading ? (
                  <>
                    <CircularProgress
                      size={18}
                      sx={{ mr: 1, color: "inherit" }}
                    />
                    Uploading...
                  </>
                ) : (
                  "Upload"
                )}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Confirm Mark as Processed Dialog */}
          <Dialog
            open={confirmDialog.open}
            onClose={closeConfirmDialog}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Mark as Processed</DialogTitle>
            <DialogContent>
              <Typography>
                Are you sure you want to mark this batch as processed? This will
                update the status to POSTED even if not all rows were
                successfully processed.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={closeConfirmDialog}
                disabled={processingBatchId !== null}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={() => handleMarkAsProcessed(confirmDialog.batchId)}
                disabled={processingBatchId !== null}
                startIcon={
                  processingBatchId !== null && <CircularProgress size={18} />
                }
              >
                {processingBatchId !== null
                  ? "Processing..."
                  : "Mark as Processed"}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Batch Details Modal */}
          <BatchDetailsModal
            open={batchDetailsOpen}
            onClose={closeBatchDetails}
            batch={selectedBatch}
          />
        </>
      )}
    </Box>
  );
};

export default BankUploadsScreen;
