import { useEffect, useState, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Divider,
  Chip,
  TextField,
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { DataGrid } from "@mui/x-data-grid";
import { Visibility } from "@mui/icons-material";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";
import ReceiptDetails from "../../components/receipts/receiptsDetails";

const BASEURL = import.meta.env.VITE_BASE_URL;

interface Receipt {
  id: string;
  receiptNumber: string;
  customerName: string;
  phoneNumber?: string;
  connectionNumber?: string;
  amount: number;
  modeOfPayment: string;
  createdAt: string;
  raw?: any;
}

export default function ReceiptsPage() {
  const currentUser = useAuthStore((s: any) => s.currentUser);
  const navigate = useNavigate();

  const [rows, setRows] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [rowCount, setRowCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [search, setSearch] = useState("");

  /* ----------------------------------
     Normalize API data
  ---------------------------------- */
  function normalizeReceipts(receipts: any[] = []) {
    return receipts.map((r) => {
      const customer = r?.connection?.customer;
      return {
        id: r.id,
        receiptNumber: r.receiptNumber,
        customerName: customer?.customerName ?? r.paidBy ?? "UNKNOWN",
        phoneNumber: customer?.phoneNumber ?? r.phoneNumber ?? null,
        connectionNumber: r?.connection?.connectionNumber ?? null,
        amount: r.amount,
        modeOfPayment: r.modeOfPayment,
        createdAt: r.createdAt,
        raw: r,
      };
    });
  }

  /* ----------------------------------
     Fetch receipts
  ---------------------------------- */
  const fetchReceipts = useCallback(
    async (activeSearch = search) => {
      setLoading(true);

      try {
        const params = new URLSearchParams({
          page: String(page + 1),
          limit: String(pageSize),
        });

        if (activeSearch.trim()) {
          params.append("search", activeSearch.trim());
        }

        const res = await fetch(`${BASEURL}/receipts?${params.toString()}`, {
          credentials: "include",
        });

        const json = await res.json();

        if (res.ok) {
          setRows(normalizeReceipts(json.data));
          setRowCount(json.pagination.totalRecords);
          setTotalPages(json.pagination.totalPages);
        }
      } catch (e) {
        console.error(e);
      }

      setLoading(false);
    },
    [page, pageSize, search],
  );

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    fetchReceipts();
  }, [currentUser, fetchReceipts, navigate]);

  /* ----------------------------------
     Search debounce
  ---------------------------------- */
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(0);
      fetchReceipts(search);
    }, 400);

    return () => clearTimeout(t);
  }, [search, fetchReceipts]);

  /* ----------------------------------
     Columns
  ---------------------------------- */
  const columns = [
    {
      field: "actions",
      headerName: "",
      width: 60,
      sortable: false,
      renderCell: (p: any) => (
        <IconButton size="small" onClick={() => setSelectedReceipt(p.row.raw)}>
          <Visibility fontSize="small" />
        </IconButton>
      ),
    },
    { field: "receiptNumber", headerName: "Receipt #", width: 170 },
    { field: "customerName", headerName: "Customer", flex: 1 },
    { field: "connectionNumber", headerName: "Connection #", width: 140 },
    { field: "phoneNumber", headerName: "Phone", width: 140 },
    { field: "amount", headerName: "Amount", width: 140 },
    {
      field: "modeOfPayment",
      headerName: "Mode",
      width: 120,
      renderCell: (p: any) => <Chip size="small" label={p.value} />,
    },
    { field: "createdAt", headerName: "Date", width: 180 },
  ];

  /* ----------------------------------
     Render
  ---------------------------------- */
  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 2 }}>
        {/* TITLE */}
        <Typography variant="h5" fontWeight={700} mb={0.5}>
          Receipts
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {rowCount.toLocaleString()} records • Page {page + 1} of {totalPages}
        </Typography>

        {/* 🔍 SEARCH BAR — VERY VISIBLE */}
        <Box
          mt={2}
          mb={2}
          p={2}
          sx={{
            borderRadius: 1,
          }}
        >
          <TextField
            fullWidth
            label="Search receipts"
            placeholder="Name, phone number, or connection number"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* TABLE */}
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          getRowId={(r) => r.id}
          pagination
          paginationMode="server"
          rowCount={rowCount}
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={({ page, pageSize }) => {
            setPage(page);
            setPageSize(pageSize);
          }}
          disableRowSelectionOnClick
          autoHeight
        />
      </Paper>

      {/* DETAILS PANEL */}
      {selectedReceipt && (
        <Paper
          sx={{
            width: 420,
            p: 2,
            position: "fixed",
            right: 16,
            top: 96,
            height: "calc(100vh - 120px)",
            overflow: "auto",
          }}
        >
          <ReceiptDetails
            receipt={selectedReceipt}
            onClose={() => setSelectedReceipt(null)}
          />
        </Paper>
      )}
    </Box>
  );
}
