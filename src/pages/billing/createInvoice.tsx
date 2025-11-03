import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  Container,
  Typography,
  TextField,
  Button,
  MenuItem,
  Paper,
  Grid,
  IconButton,
  Divider,
  Autocomplete,
} from "@mui/material";
import { AddCircleOutline, RemoveCircleOutline } from "@mui/icons-material";
import { debounce } from "lodash"; // Install lodash for debouncing
import { useNavigate } from "react-router-dom";
import { getTheme } from "../../store/theme";

const BASEURL = (import.meta as any).env?.VITE_BASE_URL || "";

const CreateInvoice = () => {
  type Customer = {
    id: string;
    customerName: string;
    accountNumber: string;
    phoneNumber?: string;
  };

  type BillType = {
    id: string;
    name: string;
  };

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [billTypes, setBillTypes] = useState<BillType[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedBillType, setSelectedBillType] = useState("");
  const [billPeriod, setBillPeriod] = useState("");
  const [items, setItems] = useState([{ description: "", amount: "", quantity: 1 }]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");


    const navigate = useNavigate();
    const theme = getTheme();

  // Fetch customers and bill types
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [custRes, billRes] = await Promise.all([
          axios.get(`${BASEURL}/customers`, { withCredentials: true }),
          axios.get(`${BASEURL}/get-bill-types`, { withCredentials: true }),
        ]);

        const fetchedCustomers = custRes.data?.data?.customers || [];
        setCustomers(fetchedCustomers);
        setFilteredCustomers(fetchedCustomers); // Initially, show all customers
        setBillTypes(billRes.data?.data || []);
      } catch (err) {
        console.error(err);
        setMessage("Failed to load data.");
      }
    };
    fetchData();
  }, []);

  // Debounced search function
  const fetchCustomers = useCallback(
    debounce(async (query: string) => {
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
        setFilteredCustomers(customers); // Fallback to all customers
      }
    }, 300),
    [customers]
  );

  // Handle search input change
  const handleSearch = (event: React.ChangeEvent<{}>, value: string) => {
    setSearchQuery(value);
    fetchCustomers(value);
  };

  // Handle customer selection
  const handleCustomerSelect = (event: React.ChangeEvent<{}>, value: Customer | null) => {
    setSelectedCustomer(value);
  };

  // Handle dynamic items
  const handleItemChange = (index: number, field: string, value: string) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { description: "", amount: "", quantity: 1 }]);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  // Calculate total
  const totalAmount = items.reduce(
    (sum, item) => sum + Number(item.amount || 0) * Number(item.quantity || 1),
    0
  );

  // Submit invoice
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) {
      setMessage("Please select a customer.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const payload = {
        customerId: selectedCustomer.id,
        billTypeId: selectedBillType,
        billPeriod,
        items: items.map((i) => ({
          description: i.description,
          amount: parseFloat(i.amount),
          quantity: parseInt(String(i.quantity), 10) || 1,
        })),
      };

      const res = await axios.post(`${BASEURL}/create-bill`, payload, {
        withCredentials: true,
      });

      setMessage(res.data?.message || "Invoice created successfully!");
      setItems([{ description: "", amount: "", quantity: 1 }]);
      setSelectedCustomer(null);
      setSelectedBillType("");
      setBillPeriod("");
      setSearchQuery("");
      setFilteredCustomers(customers); // Reset filtered customers
    } catch (err) {
      console.error(err);
      setMessage("Error creating invoice.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 6 ,ml:10 }}>
      <Paper sx={{ p: 4, borderRadius: 3, boxShadow: 3 }}>
        <Typography variant="h5" gutterBottom>
          Create Invoice
        </Typography>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            {/* Customer Search with Autocomplete */}
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
                    placeholder="Enter name, phone, or account number"
                    required
                  />
                )}
                noOptionsText="No customers found"
                isOptionEqualToValue={(option, value) => option.id === value.id}
              />
            </Grid>

            {/* Bill Type */}
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Select Bill Type"
                value={selectedBillType}
                onChange={(e) => setSelectedBillType(e.target.value)}
                required
              >
                {billTypes.map((bt) => (
                  <MenuItem key={bt.id} value={bt.id}>
                    {bt.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Billing Period */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="month"
                label="Billing Period"
                value={billPeriod}
                onChange={(e) => setBillPeriod(e.target.value)}
                required
              />
            </Grid>

            {/* Items */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2 }}>
                Items
              </Typography>
              {items.map((item, index) => (
                <Grid
                  container
                  spacing={1}
                  alignItems="center"
                  key={index}
                  sx={{ mt: 1 }}
                >
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Description"
                      value={item.description}
                      onChange={(e) =>
                        handleItemChange(index, "description", e.target.value)
                      }
                      required
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <TextField
                      fullWidth
                      label="Amount"
                      type="number"
                      value={item.amount}
                      onChange={(e) =>
                        handleItemChange(index, "amount", e.target.value)
                      }
                      required
                    />
                  </Grid>
                  <Grid item xs={2}>
                    <TextField
                      fullWidth
                      label="Qty"
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(index, "quantity", e.target.value)
                      }
                      required
                    />
                  </Grid>
                  <Grid item xs={1}>
                    <IconButton
                      color="error"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                    >
                      <RemoveCircleOutline />
                    </IconButton>
                  </Grid>
                </Grid>
              ))}

              <Button
                startIcon={<AddCircleOutline  />}
                sx={{ mt: 2, color:theme.palette.primary.contrastText }}
                onClick={addItem}
              >
                Add Item
              </Button>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1">
                Total Amount: <strong>KES {totalAmount.toFixed(2)}</strong>
              </Typography>
            </Grid>

            {/* Submit */}
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
              >
                {loading ? "Creating..." : "Create Invoice"}
              </Button>
            </Grid>
          </Grid>
        </form>

        {message && (
          <Typography  sx={{ mt: 2 }}>
            {message}
          </Typography>
        )}
      </Paper>
    </Container>
  );
};

export default CreateInvoice;