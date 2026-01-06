import React, { useState, useEffect, useCallback, useMemo } from "react";
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
} from "@mui/icons-material";
import axios from "axios";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";

/* -------------------------------------------------------
   CONSTANTS
------------------------------------------------------- */
const BANK_OPTIONS = [
  { label: "Equity Bank", value: "EQUITY", endpoint: "equity" },
  { label: "Consolidated Bank", value: "CONSOLIDATED", endpoint: "consolidated" },
];

/* -------------------------------------------------------
   Screen
------------------------------------------------------- */
const BankUploadsScreen = () => {
  const navigate = useNavigate();
  const currentUser = useAuthStore(state => state.currentUser);
  const BASEURL = import.meta.env.VITE_BASE_URL;

  /* -------------------------------------------------------
     Auth Guard
  ------------------------------------------------------- */
  useEffect(() => {
    if (!currentUser) navigate("/login");
  }, [currentUser, navigate]);

  /* -------------------------------------------------------
     State
  ------------------------------------------------------- */
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
        { withCredentials: true }
      );

      setRows(res.data?.data ?? []);
      setPagination(prev => ({
        ...prev,
        total: res.data.pagination.total,
      }));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load uploads");
      setRows([]);
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
  if (!selectedBank || !file) return;

  const bank = BANK_OPTIONS.find(b => b.value === selectedBank);
  if (!bank) return;

  const formData = new FormData();
  formData.append("file", file);

  // ✅ THIS IS THE FIX
  formData.append("bank", selectedBank);

  setUploading(true);
  try {
    await axios.post(
      `${BASEURL}/payments/bank-upload/${bank.endpoint}`,
      formData,
      {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    setOpen(false);
    setSelectedBank("");
    setFile(null);
    fetchUploads();
  } catch (err) {
    alert(err.response?.data?.message || "Upload failed");
  } finally {
    setUploading(false);
  }
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

    const rows = data.map(r =>
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
        .map(v => `"${v}"`)
        .join(",")
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
      rows.map(r => ({
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
    [rows]
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
        renderCell: p => <Chip size="small" label={p.value} />,
      },
      { field: "totalRows", headerName: "Rows", width: 100 },
      { field: "processedRows", headerName: "Processed", width: 120 },
      {
        field: "status",
        headerName: "Status",
        width: 120,
        renderCell: p => (
          <Chip
            size="small"
            color={p.value === "POSTED" ? "success" : "warning"}
            label={p.value}
          />
        ),
      },
      { field: "uploadedBy", headerName: "Uploaded By", width: 120 },
      { field: "createdAt", headerName: "Created At", width: 200 },
    ],
    []
  );

  /* -------------------------------------------------------
     Render
  ------------------------------------------------------- */
  return (
    <Box sx={{ p: 3, minHeight: "100vh" }}>
      {/* Header */}
      <Grid container justifyContent="space-between" alignItems="center" mb={3}>
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
            onPaginationModelChange={model =>
              setPagination(prev => ({
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
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Bank Upload</DialogTitle>

        <DialogContent>
          <TextField
            select
            fullWidth
            label="Bank"
            margin="normal"
            value={selectedBank}
            onChange={e => setSelectedBank(e.target.value)}
          >
            {BANK_OPTIONS.map(b => (
              <MenuItem key={b.value} value={b.value}>
                {b.label}
              </MenuItem>
            ))}
          </TextField>

          <Button variant="outlined" component="label" fullWidth sx={{ mt: 2 }}>
            {file ? file.name : "Choose Excel File"}
            <input
              type="file"
              hidden
              accept=".xlsx,.xls"
              onChange={e => setFile(e.target.files?.[0] || null)}
            />
          </Button>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={!selectedBank || !file || uploading}
            startIcon={uploading && <CircularProgress size={18} />}
          >
            Upload
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BankUploadsScreen;
