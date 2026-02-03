import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  PermissionDeniedUI,
  isPermissionDenied,
} from "../../utils/permissionHelper";
import {
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Autocomplete,
  MenuItem,
} from "@mui/material";
import { debounce } from "lodash";
import { useNavigate } from "react-router-dom";
import { getTheme } from "../../store/theme";
import { useAuthStore } from "../../store/authStore";

const ModeOfPayment = {
  CASH: "CASH",
  BANK_TRANSFER: "BANK_TRANSFER",
  MPESA: "MPESA",
  AIRTELMONEY: "AIRTELMONEY",
};

const BASEURL = import.meta.env?.VITE_BASE_URL || "";

const CreatePayment = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [totalAmount, setTotalAmount] = useState("");
  const [modeOfPayment, setModeOfPayment] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [permissionDenied, setPermissionDenied] = useState(false);

  const navigate = useNavigate();
  const theme = getTheme();
  const { currentUser } = useAuthStore();

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  // Fetch all customers initially
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await axios.get(`${BASEURL}/customers`, {
          withCredentials: true,
        });
        const fetchedCustomers = res.data?.data?.customers || [];
        setCustomers(fetchedCustomers);
        setFilteredCustomers(fetchedCustomers);
        setPermissionDenied(false);
      } catch (err) {
        console.error(err);
        if (isPermissionDenied(err)) {
          setPermissionDenied(true);
          setCustomers([]);
          setFilteredCustomers([]);
        } else {
          setMessage("Failed to load customers.");
        }
      }
    };
    fetchCustomers();
  }, []);

  // Debounced search
  const fetchCustomersSearch = useCallback(
    debounce(async (query) => {
      if (query.trim() === "") {
        setFilteredCustomers(customers);
        return;
      }

      try {
        const res = await axios.get(`${BASEURL}/customers`, {
          params: { search: query },
          withCredentials: true,
        });
        setFilteredCustomers(res.data?.data?.customers || []);
      } catch (err) {
        console.error(err);
        setMessage("Failed to search customers.");
        setFilteredCustomers(customers);
      }
    }, 300),
    [customers],
  );

  const handleSearch = (event, value) => {
    setSearchQuery(value);
    fetchCustomersSearch(value);
  };

  // Handle customer selection
  const handleCustomerSelect = (event, value) => {
    setSelectedCustomer(value);
    setSelectedConnection(null);

    if (value?.connections?.length === 1) {
      // Auto-select single connection
      setSelectedConnection(value.connections[0]);
    }
  };

  // Submit payment
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedCustomer) {
      setMessage("Please select a customer.");
      return;
    }

    if (!selectedConnection) {
      setMessage("Please select a connection for this customer.");
      return;
    }

    if (!totalAmount || !modeOfPayment || !paidBy) {
      setMessage("Please fill in all required fields.");
      return;
    }

    const paymentAmount = parseFloat(totalAmount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      setMessage("Invalid payment amount. Must be a positive number.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const payload = {
        connectionId: selectedConnection.id, // IMPORTANT
        totalAmount: paymentAmount,
        modeOfPayment,
        paidBy,
      };

      const res = await axios.post(
        `${BASEURL}/receipt/create-payment`,
        payload,
        {
          withCredentials: true,
        },
      );

      setMessage(res.data?.message || "Payment created successfully!");
      setSelectedCustomer(null);
      setSelectedConnection(null);
      setTotalAmount("");
      setModeOfPayment("");
      setPaidBy("");
      setSearchQuery("");
      setFilteredCustomers(customers);
    } catch (err) {
      console.error(err);
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Error creating payment.";
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 6, ml: 10 }}>
      {permissionDenied ? (
        <PermissionDeniedUI permission="payments:create" />
      ) : (
        <>
          <Paper sx={{ p: 4, borderRadius: 3, boxShadow: 3 }}>
            <Typography variant="h5" gutterBottom>
              Create Payment
            </Typography>

            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                {/* CUSTOMER SEARCH */}
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    options={filteredCustomers}
                    getOptionLabel={(option) =>
                      `${option.customerName} (${option.accountNumber})${
                        option.phoneNumber ? ` - ${option.phoneNumber}` : ""
                      }`
                    }
                    onInputChange={handleSearch}
                    onChange={handleCustomerSelect}
                    value={selectedCustomer}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        label="Search Customer (Name, Phone, Account)"
                        required
                      />
                    )}
                    noOptionsText="No customers found"
                    isOptionEqualToValue={(option, value) =>
                      option.id === value.id
                    }
                  />
                </Grid>

                {/* CONNECTION SELECTION */}
                {selectedCustomer &&
                  selectedCustomer.connections?.length > 1 && (
                    <Grid item xs={12} sm={6}>
                      <TextField
                        select
                        fullWidth
                        label="Select Connection"
                        value={selectedConnection?.id || ""}
                        onChange={(e) => {
                          const conn = selectedCustomer.connections.find(
                            (c) => c.id === Number(e.target.value),
                          );
                          setSelectedConnection(conn);
                        }}
                        required
                      >
                        {selectedCustomer.connections.map((conn) => (
                          <MenuItem key={conn.id} value={conn.id}>
                            {`Conn #${conn.connectionNumber} — ${conn.tariffCategory?.name}`}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                  )}

                {/* READONLY CONNECTION DISPLAY (when only 1) */}
                {selectedCustomer &&
                  selectedCustomer.connections?.length === 1 && (
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Connection"
                        value={`Conn #${selectedCustomer.connections[0].connectionNumber} — ${
                          selectedCustomer.connections[0].tariffCategory?.name
                        }`}
                        disabled
                      />
                    </Grid>
                  )}

                {/* MODE OF PAYMENT */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label="Mode of Payment"
                    value={modeOfPayment}
                    onChange={(e) => setModeOfPayment(e.target.value)}
                    required
                  >
                    {Object.values(ModeOfPayment).map((mode) => (
                      <MenuItem key={mode} value={mode}>
                        {mode}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* TOTAL AMOUNT */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Total Amount (KES)"
                    type="number"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    required
                    inputProps={{ min: 0, step: "0.01" }}
                  />
                </Grid>

                {/* PAID BY */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Paid By"
                    value={paidBy}
                    onChange={(e) => setPaidBy(e.target.value)}
                    required
                  />
                </Grid>

                {/* SUBMIT */}
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={loading}
                    sx={{ mt: 2 }}
                  >
                    {loading ? "Processing..." : "Create Payment"}
                  </Button>
                </Grid>
              </Grid>
            </form>

            {message && (
              <Typography
                sx={{
                  mt: 2,
                  color: message.includes("Error")
                    ? "error.main"
                    : "success.main",
                }}
              >
                {message}
              </Typography>
            )}
          </Paper>
        </>
      )}
    </Container>
  );
};

export default CreatePayment;
