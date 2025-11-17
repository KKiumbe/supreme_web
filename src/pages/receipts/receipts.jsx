import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Tooltip,
} from "@mui/material";

import RefreshIcon from "@mui/icons-material/Refresh";
import { DataGrid } from "@mui/x-data-grid";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";
import ReceiptDetails from "../../components/receipts/receiptsDetails";
import { Visibility } from "@mui/icons-material";

const BASEURL = import.meta.env.VITE_BASE_URL;

export default function ReceiptsPage() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const [page, setPage] = useState(0); // 0-based
  const [pageSize, setPageSize] = useState(10);
  const [rowCount, setRowCount] = useState(0);

  // ---------------------------------------------------------
  // ✅ Fetch Receipts (must be declared BEFORE useEffect)
  // ---------------------------------------------------------
  const fetchReceipts = useCallback(async () => {
    setLoading(true);

    try {
      const res = await fetch(
        `${BASEURL}/receipts?page=${page + 1}&pageSize=${pageSize}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          credentials: "include",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        console.error("API ERROR:", data);
      } else {
        setRows(data.data);
        setRowCount(data.pagination.totalRecords);
      }
    } catch (err) {
      console.error("Network error:", err);
    }

    setLoading(false);
  }, [page, pageSize]);

  // ---------------------------------------------------------
  // ✅ useEffect: Only runs after fetchReceipts exists
  // ---------------------------------------------------------
  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    fetchReceipts(); // 🔥 now safe
  }, [currentUser, fetchReceipts, navigate]);

  // ---------------------------------------------------------
  // DataGrid columns
  // ---------------------------------------------------------
  
  
  // Function to handle viewing a bill by id
  const handleViewBill = (id) => {
    const receipt = rows.find((row) => row.id === id);
    setSelectedReceipt(receipt);
  };

  const columns = [
    {
      field: "actions",
      headerName: "Actions",
      width: 100,
      
      renderCell: (params) => (
        <IconButton onClick={() => handleViewBill(params.row.id)}>
          <Visibility
          color="theme.palette.primary.contrastText"
          />
        </IconButton>
      ),
    },
    { field: "receiptNumber", headerName: "Receipt #", width: 160 },

    {
      field: "customerName",
      headerName: "Customer",
      flex: 1,
     
    },

    {
      field: "phone",
      headerName: "Phone",
      width: 130,
     
    },

    {
      field: "amount",
      headerName: "Amount",
      width: 140,
     
    },

    { field: "modeOfPayment", headerName: "Payment Mode", width: 150 },

    {
      field: "createdAt",
      headerName: "Date",
      width: 200,
      valueGetter: (p) =>
        new Date(p?.row?.createdAt).toLocaleString(),
    },
  ];

  // ---------------------------------------------------------
  // Render
  // ---------------------------------------------------------
  return (
    <Box sx={{ p: 3, width: "100%", minWidth: "1100px" }}>

      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={700}>Receipts</Typography>

        <Tooltip title="Refresh">
          <IconButton onClick={fetchReceipts}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* TABLE */}
      <Paper sx={{ height: "72vh", position: "relative" }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          getRowId={(row) => row.id}
          pagination
          paginationMode="server"
          rowCount={rowCount}
          page={page}
          pageSize={pageSize}
          onPageChange={(newPage) => setPage(newPage)}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(0);
          }}
          onRowClick={(params) => setSelectedReceipt(params.row)}
        />
      </Paper>

      {/* RIGHT PANEL */}
      <Box
        sx={{
          position: "fixed",
          top: 64,
          right: 0,
          width: selectedReceipt ? 450 : 0,
          height: "calc(100vh - 64px)",
          overflow: "auto",
          bgcolor: "background.paper",
          boxShadow: selectedReceipt
            ? "-4px 0px 12px rgba(0,0,0,0.1)"
            : "none",
          transition: "width 0.3s ease",
          zIndex: 1300,
        }}
      >
        {selectedReceipt && (
          <ReceiptDetails
            receipt={selectedReceipt}
            onClose={() => setSelectedReceipt(null)}
          />
        )}
      </Box>
    </Box>
  );
}
