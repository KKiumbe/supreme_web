import React from "react";
import {
  Box,
  Typography,
  Divider,
  IconButton,
  Chip,
  Paper,
  Tooltip,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import PropTypes from "prop-types";

const BASEURL = import.meta.env.VITE_BASE_URL;

export default function ReceiptDetails({ receipt, onClose }) {
  if (!receipt) {
    return (
      <Box p={3}>
        <Typography textAlign="center" color="text.secondary">
          No receipt selected
        </Typography>
      </Box>
    );
  }

  const handleDownload = () => {
    window.open(`${BASEURL}/receipt/download/${receipt.id}`, "_blank");
  };

  return (
    <Box sx={{ width: 420, p: 3 }}>
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h6" fontWeight={600}>
          Receipt Details
        </Typography>

        <Box>
          <Tooltip title="Download PDF">
            <IconButton onClick={handleDownload} sx={{ mr: 1 }}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>

          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* SUMMARY */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography fontWeight={600} gutterBottom>
          Summary
        </Typography>

        <Detail label="Receipt Number" value={receipt.receiptNumber} />
        <Detail
          label="Amount"
          value={`KES ${parseFloat(receipt.amount).toLocaleString()}`}
        />
        <Detail label="Payment Mode" value={receipt.modeOfPayment} />
        <Detail label="Transaction Code" value={receipt.transactionCode} />
        <Detail label="Phone" value={receipt.phoneNumber || "-"} />
        <Detail
          label="Date"
          value={new Date(receipt.createdAt).toLocaleString()}
        />

        <Box mt={1}>
          <Chip
            label={receipt.status || "Completed"}
            color="success"
            size="small"
          />
        </Box>
      </Paper>

      {/* CUSTOMER INFO */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography fontWeight={600} gutterBottom>
          Customer Details
        </Typography>

        <Detail
          label="Customer Name"
          value={receipt.customer?.customerName || "-"}
        />
        <Detail label="Account" value={receipt.customer?.accountNumber || "-"} />
        <Detail
          label="Closing Balance"
          value={`KES ${parseFloat(
            receipt.customer?.closingBalance || 0
          ).toLocaleString()}`}
        />
      </Paper>

      {/* INVOICES */}
      <Paper sx={{ p: 2 }}>
        <Typography fontWeight={600} gutterBottom>
          Invoices Paid
        </Typography>

        {!receipt.receiptInvoices?.length ? (
          <Typography color="text.secondary">
            No invoice items found
          </Typography>
        ) : (
          receipt.receiptInvoices.map((ri) => (
            <Box
              key={ri.id}
              sx={{
                mt: 1,
                p: 1.5,
                border: "1px solid #e0e0e0",
                borderRadius: 1,
              }}
            >
              <Detail
                label="Bill Number"
                value={ri.invoice?.billNumber}
              />
              <Detail
                label="Amount Paid"
                value={`KES ${parseFloat(ri.amount).toLocaleString()}`}
              />
              <Detail
                label="Billing Period"
                value={
                  ri.invoice?.billPeriod
                    ? new Date(ri.invoice.billPeriod).toLocaleDateString()
                    : "-"
                }
              />
              <Detail label="Status" value={ri.invoice?.status} />
            </Box>
          ))
        )}
      </Paper>
    </Box>
  );
}

function Detail({ label, value }) {
  return (
    <Box display="flex" justifyContent="space-between" mb={0.8}>
      <Typography color="text.secondary">{label}</Typography>
      <Typography fontWeight={500}>{value}</Typography>
    </Box>
  );
}

Detail.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.any,
};

ReceiptDetails.propTypes = {
  receipt: PropTypes.object,
  onClose: PropTypes.func.isRequired,
};
