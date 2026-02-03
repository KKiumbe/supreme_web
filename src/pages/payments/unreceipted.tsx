import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
// @ts-ignore
import {
  PermissionDeniedUI,
  isPermissionDenied,
} from "../../utils/permissionHelper";
import {
  Container,
  Typography,
  TextField,
  Paper,
  Grid,
  Button,
  MenuItem,
  CircularProgress,
  Box,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import debounce from "lodash/debounce";
// @ts-ignore
import { getTheme } from "../../store/theme";
// @ts-ignore
import ReceiptPayment from "../../components/payments/receiptPayment";

const BASEURL = import.meta.env.VITE_BASE_URL || "";

type Payment = {
  id: number;
  name: string;
  modeOfPayment: string;
  amount: number;
  transactionId: string;
  ref: string;
  receipted: boolean;
  createdAt: string;
  // Add any other fields returned by your API if needed
};

const UnreceiptedPayments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  // ✅ MUI v6 pagination model
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  const [searchParams, setSearchParams] = useState({
    name: "",
    transactionId: "",
    status: "",
    ref: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [openReceiptModal, setOpenReceiptModal] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(
    null,
  );

  const theme = getTheme();

  const fetchPayments = useCallback(
    debounce(async (params, pageNum, size) => {
      setLoading(true);
      setMessage("");

      try {
        const query = new URLSearchParams({
          ...params,
          page: (pageNum + 1).toString(),
          pageSize: size.toString(),
        }).toString();

        const res = await axios.get(
          `${BASEURL}/payments/unreceipted?${query}`,
          {
            withCredentials: true,
          },
        );

        if (!res.data || typeof res.data !== "object") {
          throw new Error("Invalid API response structure");
        }

        setPayments(res.data.data || []);
        setTotalCount(res.data.totalCount || 0);
        setMessage(res.data.message || "Payments fetched successfully");
        setPermissionDenied(false);
      } catch (err: any) {
        console.error("Error fetching payments:", {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
        });

        if (isPermissionDenied(err)) {
          setPermissionDenied(true);
          setPayments([]);
          setTotalCount(0);
          setMessage("");
        } else {
          setMessage(
            err.response?.data?.message ||
              "Failed to fetch payments. Please check the network or API configuration.",
          );
        }
      } finally {
        setLoading(false);
      }
    }, 300),
    [],
  );

  useEffect(() => {
    fetchPayments(searchParams, paginationModel.page, paginationModel.pageSize);
  }, [searchParams, paginationModel, fetchPayments]);

  const handleSearchChange = useCallback((field: string, value: string) => {
    setSearchParams((prev) => ({ ...prev, [field]: value }));
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  }, []);

  const handleReset = useCallback(() => {
    setSearchParams({ name: "", transactionId: "", status: "", ref: "" });
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  }, []);

  const handleOpenReceipt = useCallback((paymentId: number) => {
    setSelectedPaymentId(paymentId);
    setOpenReceiptModal(true);
  }, []);

  const handleCloseReceipt = useCallback(() => {
    setOpenReceiptModal(false);
    setSelectedPaymentId(null);
  }, []);

  const handleReceiptSuccess = useCallback(() => {
    handleCloseReceipt();
    fetchPayments(searchParams, paginationModel.page, paginationModel.pageSize);
  }, [searchParams, paginationModel, fetchPayments]);

  const columns = [
    { field: "name", headerName: "Customer", flex: 1, minWidth: 150 },
    {
      field: "action",
      headerName: "Action",
      minWidth: 150,
      renderCell: ({ row }: any) => (
        <Button
          variant="contained"
          sx={{
            backgroundColor: theme.palette.primary.main,
            "&:hover": { backgroundColor: theme.palette.primary.dark },
            color: "#e8ea4bff",
          }}
          onClick={() => handleOpenReceipt(row.id)}
        >
          Receipt
        </Button>
      ),
    },
    {
      field: "modeOfPayment",
      headerName: "Payment Method",
      flex: 1,
      minWidth: 140,
    },
    { field: "amount", headerName: "Amount", width: 120 },
    {
      field: "transactionId",
      headerName: "Transaction ID",
      flex: 1,
      minWidth: 180,
    },
    {
      field: "ref",
      headerName: "Payment Reference ID",
      flex: 1,
      minWidth: 180,
    },
    {
      field: "receipted",
      headerName: "Receipted",
      width: 120,
      renderCell: ({ value }: any) => (
        <Typography
          sx={{
            color: value
              ? theme.palette.success.main
              : theme.palette.error.main,
          }}
        >
          {value ? "Yes" : "No"}
        </Typography>
      ),
    },
    {
      field: "createdAt",
      headerName: "Date",
      flex: 1,
      minWidth: 150,
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: { xs: 2, sm: 4 }, mb: 4 }}>
      {permissionDenied ? (
        <PermissionDeniedUI permission="payments:view" />
      ) : (
        <>
          <Paper sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2 }}>
            <Typography variant="h5" gutterBottom>
              Unreceipted Payments
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Search by Name"
                  value={searchParams.name}
                  onChange={(e) => handleSearchChange("name", e.target.value)}
                  size="small"
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Transaction ID"
                  value={searchParams.transactionId}
                  onChange={(e) =>
                    handleSearchChange("transactionId", e.target.value)
                  }
                  size="small"
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  select
                  fullWidth
                  label="Status"
                  value={searchParams.status}
                  onChange={(e) => handleSearchChange("status", e.target.value)}
                  size="small"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="true">Receipted</MenuItem>
                  <MenuItem value="false">Not Receipted</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Reference"
                  value={searchParams.ref}
                  onChange={(e) => handleSearchChange("ref", e.target.value)}
                  size="small"
                />
              </Grid>

              <Grid item xs={12}>
                <Button variant="outlined" onClick={handleReset}>
                  Reset Search
                </Button>
              </Grid>
            </Grid>

            <Box sx={{ height: { xs: 400, sm: 550 }, width: "100%" }}>
              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <DataGrid
                  rows={payments}
                  columns={columns}
                  getRowId={(row) => row.id}
                  paginationMode="server"
                  rowCount={totalCount}
                  paginationModel={paginationModel}
                  onPaginationModelChange={setPaginationModel}
                  pageSizeOptions={[10, 20, 50]}
                  loading={loading}
                  sx={{ "& .MuiDataGrid-root": { overflowX: "auto" } }}
                />
              )}
            </Box>

            {message && (
              <Typography sx={{ mt: 2, color: theme.palette.text.secondary }}>
                {message}
              </Typography>
            )}
          </Paper>

          {openReceiptModal && (
            <ReceiptPayment
              open={openReceiptModal}
              paymentId={selectedPaymentId}
              onClose={handleCloseReceipt}
              onReceiptComplete={handleReceiptSuccess}
            />
          )}
        </>
      )}
    </Container>
  );
};

export default UnreceiptedPayments;
