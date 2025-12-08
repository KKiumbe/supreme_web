import React from "react";
import PropTypes from "prop-types";
import {
  Box,
  Typography,
  Button,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  Paper,
} from "@mui/material";

import DownloadIcon from "@mui/icons-material/Download";

import CloseIcon from "@mui/icons-material/Close";
const BillDetails = ({ task: bill, onClose }) => {

    const API_URL = import.meta.env.VITE_BASE_URL;
  if (!bill) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>No bill selected</Typography>
      </Box>
    );
  }

  console.log(`this is the bill ${JSON.stringify(bill.billId)}`);
const realBillId = bill?.billId
  // Destructure bill data with fallbacks
  const {
    billNumber = "-",
    customer = {},
    billAmount = 0,
    amountPaid = 0,
    closingBalance = 0,
    status = "-",
    billPeriod = "-",
    createdAt = "-",
    type = {},
    items = [],
  } = bill;

  const customerName = customer.customerName || "-";
  const phoneNumber = customer.phoneNumber || "-";
  const billType = type.name || "-";

  // Format dates
  const formattedBillPeriod =
    billPeriod !== "-" && !isNaN(new Date(billPeriod).getTime())
      ? new Date(billPeriod).toLocaleDateString()
      : "-";
  const formattedCreatedAt =
    createdAt !== "-" && !isNaN(new Date(createdAt).getTime())
      ? new Date(createdAt).toLocaleString()
      : "-";


const downloadBill = async (billId) => {
  try {

    console.log(billId);


    const token = localStorage.getItem("token"); // or use your auth provider/context
    const response = await fetch(`${API_URL}/download-bill/${billId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
      credentials: "include"
    });

    if (!response.ok) {
      console.error("Status:", response.status);
      throw new Error("Failed to download bill");
    }

    const blob = await response.blob();

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Bill-${billNumber}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error(error);
  }
};




  return (
    <Box sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <Box display="flex" justifyContent={"left"} alignItems="center" mb={2}>
        <Typography variant="h6" fontWeight="bold">
          Bill Details
        </Typography>
        <Button
         
        
          onClick={onClose}
          size="small"
          color="theme.palette.primary.contrastText"
        >
          <CloseIcon />
        </Button>
        <Button
  variant="contained"
  color="primary"
  onClick={() => downloadBill(realBillId)}
>
  <DownloadIcon />
  
</Button>

      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Bill Information */}
      <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" fontWeight="medium" mb={1}>
          Bill Information
        </Typography>
        <Box display="flex" flexDirection="column" gap={1}>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">
              Bill Number:
            </Typography>
            <Typography variant="body2">{billNumber}</Typography>
          </Box>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">
              Bill Type:
            </Typography>
            <Typography variant="body2">{billType}</Typography>
          </Box>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">
              Status:
            </Typography>
            <Chip
              label={status}
              color={status === "PAID" ? "success" : status === "UNPAID" ? "warning" : "default"}
              size="small"
            />
          </Box>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">
              Bill Period:
            </Typography>
            <Typography variant="body2">{formattedBillPeriod}</Typography>
          </Box>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">
              Created At:
            </Typography>
            <Typography variant="body2">{formattedCreatedAt}</Typography>
          </Box>
        </Box>
      </Paper>

      {/* Customer Information */}
      <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" fontWeight="medium" mb={1}>
          Customer Information
        </Typography>
        <Box display="flex" flexDirection="column" gap={1}>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">
              Name:
            </Typography>
            <Typography variant="body2">{customerName}</Typography>
          </Box>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">
              Phone:
            </Typography>
            <Typography variant="body2">{phoneNumber}</Typography>
          </Box>
        </Box>
      </Paper>

      {/* Financial Information */}
      <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" fontWeight="medium" mb={1}>
          Financial Details
        </Typography>
        <Box display="flex" flexDirection="column" gap={1}>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">
              Bill Amount:
            </Typography>
            <Typography variant="body2">KES {billAmount.toLocaleString()}</Typography>
          </Box>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">
              Amount Paid:
            </Typography>
            <Typography variant="body2">KES {amountPaid.toLocaleString()}</Typography>
          </Box>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">
              Closing Balance(At Bill Creation):
            </Typography>
            <Typography variant="body2">KES {closingBalance.toLocaleString()}</Typography>
          </Box>
        </Box>
      </Paper>

      {/* Bill Items */}
      <Paper elevation={1} sx={{ p: 2, flex: 1, overflow: "auto" }}>
        <Typography variant="subtitle1" fontWeight="medium" mb={1}>
          Bill Items
        </Typography>
        {items.length > 0 ? (
          <List dense>
            {items.map((item, index) => (
              <ListItem key={index} sx={{ py: 1 }}>
                <ListItemText
                  primary={item.description || "-"}
                  secondary={`Quantity: ${item.quantity || 0}, Amount: KES ${
                    item.amount ? item.amount.toLocaleString() : 0
                  }`}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No items found
          </Typography>
        )}
      </Paper>
    </Box>
  );
};
BillDetails.propTypes = {
  task: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    billId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    billNumber: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    customer: PropTypes.shape({
      customerName: PropTypes.string,
      phoneNumber: PropTypes.string,
    }),
    billAmount: PropTypes.number,
    amountPaid: PropTypes.number,
    closingBalance: PropTypes.number,
    status: PropTypes.string,
    billPeriod: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    type: PropTypes.shape({
      name: PropTypes.string,
    }),
    items: PropTypes.arrayOf(
      PropTypes.shape({
        description: PropTypes.string,
        quantity: PropTypes.number,
        amount: PropTypes.number,
      })
    ),
  }),
  onClose: PropTypes.func,
};

export default BillDetails;
