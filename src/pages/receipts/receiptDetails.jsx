import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  CircularProgress,
  Alert,
  Divider,
  Paper,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DownloadIcon from "@mui/icons-material/Download";
import EmailIcon from "@mui/icons-material/Email";
import ReceiptIcon from "@mui/icons-material/Receipt";
import DeleteIcon from "@mui/icons-material/Delete";
import { getTheme } from "../../store/theme";

const ReceiptDetail = (id) => {
  //const { id } = useParams();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [canceling, setCanceling] = useState(false);

  const theme = getTheme();
  const BASEURL = import.meta.env.VITE_BASE_URL;

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        const response = await axios.get(`${BASEURL}/receipt/${id}`, {
          withCredentials: true,
        });
        setReceipt(response.data);
      } catch (err) {
        setError(
          err.response?.data?.error || "Failed to fetch receipt details.",
        );
        console.error("Error fetching receipt:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReceipt();
  }, [id, BASEURL]);

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoToReceipts = () => {
    navigate("/receipts");
  };

  const handleDownloadReceipt = () => {
    alert("Download receipt functionality not implemented yet.");
    // Implement PDF download logic here
  };

  const handleEmailReceipt = () => {
    alert("Email receipt functionality not implemented yet.");
    // Implement email logic here
  };

  const handleOpenCancelDialog = () => {
    setOpenCancelDialog(true);
  };

  const handleCloseCancelDialog = () => {
    setOpenCancelDialog(false);
  };

  const handleConfirmCancel = () => {
    setOpenCancelDialog(false);
    setOpenConfirmDialog(true);
  };

  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false);
  };

  const handleCancelReceipt = async () => {
    setCanceling(true);
    try {
      console.warn(`📋 Canceling receipt: ${receipt.id}`);

      const response = await axios.post(
        `${BASEURL}/receipt/${receipt.id}/cancel`,
        {},
        { withCredentials: true },
      );

      console.warn("✅ Receipt canceled successfully:", response.data);

      // Show success alert
      alert(
        "Receipt canceled successfully. Affected customer has been notified.",
      );

      // Navigate back to receipts
      navigate("/receipts");
    } catch (err) {
      console.error("❌ Error canceling receipt:", err);
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to cancel receipt.";
      setError(errorMsg);
      alert(`Error: ${errorMsg}`);
    } finally {
      setCanceling(false);
      setOpenConfirmDialog(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress
          size={70}
          sx={{ color: theme.palette.greenAccent.main }}
        />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ padding: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!receipt) {
    return (
      <Box sx={{ padding: 2 }}>
        <Typography>No receipt found.</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh", // Full page height
        width: "40%", // Full width
        bgcolor: theme.palette.background.paper, // Uniform background
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        ml: 20, // Center content

        p: 0,
      }}
    >
      {/* Back Button (Top Left) */}
      <IconButton
        onClick={handleGoBack}
        sx={{
          position: "absolute",
          top: -10,
          left: -10,
          color: theme.palette.greenAccent.main,
          "&:hover": { bgcolor: theme.palette.greenAccent.main + "20" },
        }}
      >
        <ArrowBackIcon sx={{ fontSize: 40 }} />
      </IconButton>

      {/* Receipt Container */}
      <Paper
        elevation={3}
        sx={{
          maxWidth: 900,
          mx: "auto",
          p: 4,

          borderRadius: 2,
        }}
      >
        {/* Header */}
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Typography
            variant="h4"
            sx={{ fontWeight: "bold", color: theme.palette.primary }}
          >
            Receipt
          </Typography>
          <Typography variant="h6" sx={{ color: theme.palette.primary }}>
            {receipt.receiptNumber}
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.primary }}>
            Issued on: {new Date(receipt.createdAt).toLocaleDateString()}
          </Typography>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mb: 4 }}>
          <Button
            variant="outlined"
            startIcon={<ReceiptIcon />}
            onClick={handleGoToReceipts}
            sx={{
              borderColor: theme.palette.grey[200],

              color: theme.palette.greenAccent.main,
              "&:hover": {
                borderColor: theme.palette.greenAccent.main,
                color: theme.palette.grey,
              },
              px: 3,
              ml: 70,
            }}
          >
            Receipts Page
          </Button>
        </Box>

        {/* Receipt Details */}
        <Grid container spacing={3}>
          {/* Customer Details */}
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: "bold",
                    mb: 2,
                    color: theme.palette.primary.contrastText,
                  }}
                >
                  Customer Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography
                      variant="body2"
                      sx={{ color: theme.palette.primary.contrastText }}
                    >
                      <strong>First Name:</strong>{" "}
                      {receipt.customer?.firstName || "N/A"}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography
                      variant="body2"
                      sx={{ color: theme.palette.primary.contrastText }}
                    >
                      <strong>Last Name:</strong>{" "}
                      {receipt.customer?.lastName || "N/A"}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography
                      variant="body2"
                      sx={{ color: theme.palette.primary.contrastText }}
                    >
                      <strong>Phone Number:</strong>{" "}
                      {receipt.customer?.phoneNumber || "N/A"}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography
                      variant="body2"
                      sx={{ color: theme.palette.primary.contrastText }}
                    >
                      <strong>Closing Balance:</strong>{" "}
                      {receipt.customer?.closingBalance || 0} KES
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Payment Details */}
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: "bold",
                    mb: 2,
                    color: theme.palette.primary.contrastText,
                  }}
                >
                  Payment Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography
                      variant="body2"
                      sx={{ color: theme.palette.primary.contrastText }}
                    >
                      <strong>Payment ID:</strong>{" "}
                      {receipt.payment?.id || "N/A"}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography
                      variant="body2"
                      sx={{ color: theme.palette.primary.contrastText }}
                    >
                      <strong>Amount:</strong>{" "}
                      {receipt.payment?.amount || receipt.amount} KES
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography
                      variant="body2"
                      sx={{ color: theme.palette.primary.contrastText }}
                    >
                      <strong>Mode of Payment:</strong>{" "}
                      {receipt.payment?.modeOfPayment || receipt.modeOfPayment}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography
                      variant="body2"
                      sx={{ color: theme.palette.primary.contrastText }}
                    >
                      <strong>Paid By:</strong>{" "}
                      {receipt.payment?.firstName || receipt.paidBy}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography
                      variant="body2"
                      sx={{ color: theme.palette.primary.contrastText }}
                    >
                      <strong>Transaction ID:</strong>{" "}
                      {receipt.payment?.transactionId ||
                        receipt.transactionCode}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography
                      variant="body2"
                      sx={{ color: theme.palette.primary.contrastText }}
                    >
                      <strong>Reference:</strong>{" "}
                      {receipt.payment?.ref || "N/A"}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography
                      variant="body2"
                      sx={{ color: theme.palette.primary.contrastText }}
                    >
                      <strong>Receipted:</strong>{" "}
                      {receipt.payment?.receipted ? "Yes" : "No"}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography
                      variant="body2"
                      sx={{ color: theme.palette.primary.contrastText }}
                    >
                      <strong>Date:</strong>{" "}
                      {(() => {
                        const date = new Date(
                          receipt.payment?.createdAt || receipt.createdAt,
                        );
                        date.setHours(date.getHours() - 1); // Offset by -1 hour
                        return date.toLocaleString();
                      })()}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Invoices Affected */}
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: "bold",
                    mb: 2,
                    color: theme.palette.primary.contrastText,
                  }}
                >
                  Invoices Affected
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {receipt.receiptInvoices?.length > 0 ? (
                  receipt.receiptInvoices.map((ri, index) => (
                    <Box
                      key={index}
                      sx={{
                        mb: index < receipt.receiptInvoices.length - 1 ? 2 : 0,
                      }}
                    >
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Typography
                            variant="body2"
                            sx={{ color: theme.palette.primary.contrastText }}
                          >
                            <strong>Invoice ID:</strong>{" "}
                            {ri.invoice?.id || "N/A"}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography
                            variant="body2"
                            sx={{ color: theme.palette.primary.contrastText }}
                          >
                            <strong>Invoice Number:</strong>{" "}
                            {ri.invoice?.invoiceNumber || "N/A"}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography
                            variant="body2"
                            sx={{ color: theme.palette.primary.contrastText }}
                          >
                            <strong>Amount:</strong>{" "}
                            {ri.invoice?.invoiceAmount || 0} KES
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography
                            variant="body2"
                            sx={{ color: theme.palette.primary.contrastText }}
                          >
                            <strong>Amount Paid:</strong>{" "}
                            {ri.invoice?.amountPaid || 0} KES
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography
                            variant="body2"
                            sx={{ color: theme.palette.primary.contrastText }}
                          >
                            <strong>Closing Balance:</strong>{" "}
                            {ri.invoice?.closingBalance || 0} KES
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography
                            variant="body2"
                            sx={{ color: theme.palette.primary.contrastText }}
                          >
                            <strong>Status:</strong>{" "}
                            {ri.invoice?.status || "N/A"}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography
                            variant="body2"
                            sx={{ color: theme.palette.primary.contrastText }}
                          >
                            <strong>Period:</strong>{" "}
                            {new Date(
                              ri.invoice?.invoicePeriod,
                            ).toLocaleDateString() || "N/A"}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography
                            variant="body2"
                            sx={{ color: theme.palette.primary.contrastText }}
                          >
                            <strong>Created At:</strong>{" "}
                            {ri.invoice?.createdAt
                              ? new Date(
                                  new Date(ri.invoice.createdAt).setHours(
                                    new Date(ri.invoice.createdAt).getHours() -
                                      1,
                                  ),
                                ).toLocaleString()
                              : "N/A"}
                          </Typography>
                        </Grid>
                      </Grid>
                      {index < receipt.receiptInvoices.length - 1 && (
                        <Divider sx={{ my: 2 }} />
                      )}
                    </Box>
                  ))
                ) : (
                  <Typography sx={{ color: theme.palette.grey[700] }}>
                    No invoices associated with this receipt.
                  </Typography>
                )}
              </CardContent>
            </Card>

            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                gap: 2,
                mb: 4,
                margin: 5,
              }}
            >
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadReceipt}
                sx={{
                  color: theme.palette.primary.contrastText,
                  "&:hover": {
                    borderColor: theme.palette.greenAccent.main,
                    color: theme.palette.grey,
                  },
                  px: 3,
                }}
              >
                Download
              </Button>
              <Button
                variant="contained"
                startIcon={<EmailIcon />}
                onClick={handleEmailReceipt}
                sx={{
                  color: theme.palette.primary.contrastText,
                  borderColor: theme.palette.grey[900],
                  "&:hover": {
                    borderColor: theme.palette.greenAccent.main,
                    color: theme.palette.grey,
                  },
                  px: 3,
                }}
              >
                Email {receipt?.customer?.firstName}
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleOpenCancelDialog}
                sx={{
                  px: 3,
                }}
              >
                Cancel Receipt
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* First Confirmation Dialog - Warning */}
      <Dialog
        open={openCancelDialog}
        onClose={handleCloseCancelDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{ color: theme.palette.error.main, fontWeight: "bold" }}
        >
          ⚠️ Cancel Receipt
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: theme.palette.text.primary, mt: 2 }}>
            <strong>This action will:</strong>
            <ul>
              <li>💰 Affect paid invoices</li>
              <li>📊 Reverse customer balance changes</li>
              <li>📧 Alert the affected customer via email</li>
            </ul>
            <strong>Receipt:</strong> {receipt.receiptNumber}
            <br />
            <strong>Customer:</strong> {receipt?.customer?.firstName}{" "}
            {receipt?.customer?.lastName}
            <br />
            <strong>Amount:</strong> {receipt?.amount || "N/A"} KES
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseCancelDialog} variant="outlined">
            Keep Receipt
          </Button>
          <Button
            onClick={handleConfirmCancel}
            color="error"
            variant="contained"
          >
            Proceed to Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Second Confirmation Dialog - Final Confirmation */}
      <Dialog
        open={openConfirmDialog}
        onClose={handleCloseConfirmDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{ color: theme.palette.error.main, fontWeight: "bold" }}
        >
          🚨 Final Confirmation
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: theme.palette.text.primary, mt: 2 }}>
            <strong>
              Are you absolutely sure you want to cancel this receipt?
            </strong>
            <br />
            <br />
            This is a permanent action that will:
            <ul style={{ color: theme.palette.error.main }}>
              <li>❌ Reverse the payment</li>
              <li>❌ Restore invoice amounts</li>
              <li>❌ Update customer balance</li>
              <li>✉️ Send cancellation notice to customer</li>
            </ul>
            <strong style={{ color: theme.palette.error.main }}>
              Receipt: {receipt.receiptNumber}
            </strong>
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseConfirmDialog} variant="outlined">
            Don&apos;t Cancel
          </Button>
          <Button
            onClick={handleCancelReceipt}
            color="error"
            variant="contained"
            disabled={canceling}
          >
            {canceling ? "Canceling..." : "Yes, Cancel Receipt"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReceiptDetail;
