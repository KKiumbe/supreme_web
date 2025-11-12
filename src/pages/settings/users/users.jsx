import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Collapse,
  Paper,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  List,
  ListItem,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  ExpandMore,
  ExpandLess,
  Search,
  Description,
  Payment,
  Group,
  Settings,
  BarChart,
  Store,
  Edit,
  Close,
  Add,
} from "@mui/icons-material";
import axios from "axios";
import { motion } from "framer-motion";

const BASE_URL = import.meta.env.VITE_BASE_URL;

// ✅ Helper: Get icon for module
const getModuleIcon = (module) => {
  switch (module) {
    case "bills":
      return <Description fontSize="small" color="action" />;
    case "payments":
      return <Payment fontSize="small" color="action" />;
    case "users":
      return <Group fontSize="small" color="action" />;
    case "settings":
      return <Settings fontSize="small" color="action" />;
    case "reports":
      return <BarChart fontSize="small" color="action" />;
    case "store":
      return <Store fontSize="small" color="action" />;
    default:
      return <Description fontSize="small" color="disabled" />;
  }
};

// ✅ Helper: Group permissions by module
const groupPermissions = (permissions) => {
  const grouped = {};
  permissions.forEach((perm) => {
    const [module, action] = perm.split(":");
    if (!grouped[module]) grouped[module] = [];
    grouped[module].push(action);
  });
  return grouped;
};

const UserManagementScreen = () => {
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [availableRoles, setAvailableRoles] = useState([]);
  const [editUserId, setEditUserId] = useState(null);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [originalRoles, setOriginalRoles] = useState([]);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    gender: "",
    role: [],
  });
  const [formErrors, setFormErrors] = useState({});

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get(`${BASE_URL}/users`, {
        withCredentials: true,
      });
      if (res.data?.success && res.data?.data) {
        setUsers(res.data.data);
        setMeta(res.data.meta);
        console.log("✅ Users fetched:", res.data.data);
      } else {
        setError("Unexpected response from server.");
      }
    } catch (err) {
      console.error("❌ Error fetching users:", err);
      setError("Failed to fetch users. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch available roles
  const fetchRoles = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/permissions`, {
        withCredentials: true,
      });
      if (res.data?.success && res.data?.data) {
        setAvailableRoles(res.data.data);
        console.log("✅ Roles fetched:", res.data.data);
      } else {
        setError("Unexpected response from server.");
      }
    } catch (err) {
      console.error("❌ Error fetching roles:", err);
      setError("Failed to fetch roles. Please try again later.");
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  // Handle edit roles
  const handleEditRoles = (user) => {
    const userRoles = user.roles.map((r) => r.role);
    setEditUserId(user.id);
    setSelectedRoles(userRoles);
    setOriginalRoles(userRoles);
    setOpenEditDialog(true);
  };

  // Handle role checkbox change for edit dialog
  const handleRoleChange = (role) => {
    setSelectedRoles((prev) =>
      prev.includes(role)
        ? prev.filter((r) => r !== role)
        : [...prev, role]
    );
  };

  // Handle remove role
  const handleRemoveRole = async (userId, role) => {
    try {
      setLoading(true);
      setError("");
      const updatedRoles = users
        .find((user) => user.id === userId)
        .roles.map((r) => r.role)
        .filter((r) => r !== role);
      await axios.put(
        `${BASE_URL}/users/${userId}/roles`,
        { roles: updatedRoles },
        {
          withCredentials: true,
        }
      );
      fetchUsers();
      console.log(`✅ Role ${role} removed for user:`, userId);
    } catch (err) {
      console.error(`❌ Error removing role ${role}:`, err);
      setError(`Failed to remove role ${role}. Please try again later.`);
    } finally {
      setLoading(false);
    }
  };

  // Handle save roles
  const handleSaveRoles = async () => {
    try {
      setLoading(true);
      setError("");
      await axios.put(
        `${BASE_URL}/users/${editUserId}/roles`,
        { roles: selectedRoles },
        {
          withCredentials: true,
        }
      );
      setOpenEditDialog(false);
      fetchUsers();
      console.log("✅ Roles updated for user:", editUserId);
    } catch (err) {
      console.error("❌ Error updating roles:", err);
      setError("Failed to update roles. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel edit dialog
  const handleCancelEdit = () => {
    setSelectedRoles(originalRoles);
    setOpenEditDialog(false);
  };

  // Handle new user input change
  const handleNewUserChange = (field, value) => {
    setNewUser((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: "" }));
  };

  // Handle new user role change
  const handleNewUserRoleChange = (role) => {
    setNewUser((prev) => ({
      ...prev,
      role: prev.role.includes(role)
        ? prev.role.filter((r) => r !== role)
        : [...prev.role, role],
    }));
    setFormErrors((prev) => ({ ...prev, role: "" }));
  };

  // Validate new user form
  const validateNewUser = () => {
    const errors = {};
    if (!newUser.firstName.trim()) errors.firstName = "First name is required";
    if (!newUser.lastName.trim()) errors.lastName = "Last name is required";
    if (!newUser.email.trim()) errors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(newUser.email)) errors.email = "Invalid email format";
    if (!newUser.phoneNumber.trim()) errors.phoneNumber = "Phone number is required";
    if (!newUser.gender) errors.gender = "Gender is required";
    if (newUser.role.length === 0) errors.role = "At least one role is required";
    return errors;
  };

  // Handle add user
  const handleAddUser = async () => {
    const errors = validateNewUser();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    try {
      setLoading(true);
      setError("");
      await axios.post(
        `${BASE_URL}/adduser`,
        {
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          phoneNumber: newUser.phoneNumber,
          gender: newUser.gender,
          role: newUser.role,
        },
        {
          withCredentials: true,
        }
      );
      setOpenAddDialog(false);
      setNewUser({
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        gender: "",
        role: [],
      });
      fetchUsers();
      console.log("✅ User added successfully");
    } catch (err) {
      console.error("❌ Error adding user:", err);
      setError("Failed to add user. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel add dialog
  const handleCancelAdd = () => {
    setNewUser({
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      gender: "",
      role: [],
    });
    setFormErrors({});
    setOpenAddDialog(false);
  };

  const filteredUsers = users.filter((user) => {
    const term = search.toLowerCase();
    return (
      user.firstName?.toLowerCase().includes(term) ||
      user.lastName?.toLowerCase().includes(term) ||
      user.email?.toLowerCase().includes(term) ||
      user.phoneNumber?.toLowerCase().includes(term)
    );
  });

  return (
    <Box sx={{ p: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight="bold">
          👥 User Management
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          {meta && (
            <Typography variant="body2">
              Total Users: <strong>{meta.totalUsers}</strong>
            </Typography>
          )}
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenAddDialog(true)}
          >
            Add User
          </Button>
        </Box>
      </Box>

      {/* Search Bar */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Search color="action" />
          <TextField
            fullWidth
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            variant="outlined"
            size="small"
          />
        </Box>
      </Card>

      {/* Table */}
      {loading ? (
        <Box display="flex" justifyContent="center" mt={5}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mt: 3 }}>
          {error}
        </Alert>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Email</strong></TableCell>
                <TableCell><strong>Phone</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Roles</strong></TableCell>
                <TableCell align="right"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1">No users found.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <React.Fragment key={user.id}>
                    <TableRow hover>
                      <TableCell>{`${user.firstName} ${user.lastName}`}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.phoneNumber}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.status}
                          color={user.status === "ACTIVE" ? "success" : "default"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {(user.roles || []).map((r) => (
                          <Tooltip title={`Remove ${r.role} role`} key={r.role}>
                            <Chip
                              label={r.role}
                              size="small"
                              sx={{ mr: 0.5, mb: 0.5 }}
                              deleteIcon={<Close />}
                              onDelete={() => handleRemoveRole(user.id, r.role)}
                            />
                          </Tooltip>
                        ))}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton onClick={() => handleEditRoles(user)}>
                          <Edit />
                        </IconButton>
                        <IconButton
                          onClick={() =>
                            setExpanded(expanded === user.id ? null : user.id)
                          }
                        >
                          {expanded === user.id ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                        <Collapse in={expanded === user.id} timeout="auto" unmountOnExit>
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                          >
                            <Card sx={{ m: 2, p: 2, borderRadius: 3 }}>
                              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                Role Permissions
                              </Typography>
                              {(user.roles || []).map((r) => {
                                const grouped = groupPermissions(r.permissions || []);
                                return (
                                  <Box key={r.role} mb={3}>
                                    <Typography
                                      sx={{ fontWeight: 700, textTransform: "uppercase", mb: 1 }}
                                    >
                                      {r.role}
                                    </Typography>
                                    {Object.keys(grouped).map((module) => (
                                      <Card
                                        key={module}
                                        variant="outlined"
                                        sx={{ mb: 1, borderRadius: 2, px: 2, py: 1 }}
                                      >
                                        <Box
                                          display="flex"
                                          alignItems="center"
                                          justifyContent="space-between"
                                        >
                                          <Typography
                                            sx={{
                                              fontWeight: 600,
                                              display: "flex",
                                              alignItems: "center",
                                              gap: 1,
                                            }}
                                          >
                                            {getModuleIcon(module)} {module.toUpperCase()}
                                          </Typography>
                                          <Box display="flex" flexWrap="wrap" gap={1}>
                                            {["view", "create", "edit", "delete"].map((action) => (
                                              <Chip
                                                key={action}
                                                label={action}
                                                color={grouped[module].includes(action) ? "success" : "default"}
                                                size="small"
                                                variant={grouped[module].includes(action) ? "filled" : "outlined"}
                                              />
                                            ))}
                                          </Box>
                                        </Box>
                                      </Card>
                                    ))}
                                  </Box>
                                );
                              })}
                            </Card>
                          </motion.div>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Edit Roles Dialog */}
      <Dialog open={openEditDialog} onClose={handleCancelEdit} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Roles</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Check or uncheck roles to assign to the user:
          </Typography>
          <List sx={{ maxHeight: 300, overflow: "auto" }}>
            {availableRoles.map((role) => (
              <ListItem key={role.role} sx={{ py: 0 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedRoles.includes(role.role)}
                      onChange={() => handleRoleChange(role.role)}
                    />
                  }
                  label={
                    <Tooltip title={role.permissions.join(", ")}>
                      <Typography>{role.role}</Typography>
                    </Tooltip>
                  }
                />
              </ListItem>
            ))}
          </List>
          {selectedRoles.length === 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              At least one role is required.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelEdit} color="secondary" variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleSaveRoles}
            variant="contained"
            disabled={loading || selectedRoles.length === 0}
          >
            {loading ? <CircularProgress size={24} /> : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={openAddDialog} onClose={handleCancelAdd} maxWidth="sm" fullWidth>
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            <TextField
              label="First Name"
              value={newUser.firstName}
              onChange={(e) => handleNewUserChange("firstName", e.target.value)}
              fullWidth
              error={!!formErrors.firstName}
              helperText={formErrors.firstName}
            />
            <TextField
              label="Last Name"
              value={newUser.lastName}
              onChange={(e) => handleNewUserChange("lastName", e.target.value)}
              fullWidth
              error={!!formErrors.lastName}
              helperText={formErrors.lastName}
            />
            <TextField
              label="Email"
              value={newUser.email}
              onChange={(e) => handleNewUserChange("email", e.target.value)}
              fullWidth
              error={!!formErrors.email}
              helperText={formErrors.email}
            />
            <TextField
              label="Phone Number"
              value={newUser.phoneNumber}
              onChange={(e) => handleNewUserChange("phoneNumber", e.target.value)}
              fullWidth
              error={!!formErrors.phoneNumber}
              helperText={formErrors.phoneNumber}
            />
            <FormControl fullWidth error={!!formErrors.gender}>
              <InputLabel>Gender</InputLabel>
              <Select
                value={newUser.gender}
                onChange={(e) => handleNewUserChange("gender", e.target.value)}
                label="Gender"
              >
                <MenuItem value="MALE">Male</MenuItem>
                <MenuItem value="FEMALE">Female</MenuItem>
                <MenuItem value="OTHER">Other</MenuItem>
              </Select>
              {formErrors.gender && (
                <Typography color="error" variant="caption">
                  {formErrors.gender}
                </Typography>
              )}
            </FormControl>
            <Box>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                Select Roles:
              </Typography>
              <List sx={{ maxHeight: 200, overflow: "auto" }}>
                {availableRoles.map((role) => (
                  <ListItem key={role.role} sx={{ py: 0 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={newUser.role.includes(role.role)}
                          onChange={() => handleNewUserRoleChange(role.role)}
                        />
                      }
                      label={
                        <Tooltip title={role.permissions.join(", ")}>
                          <Typography>{role.role}</Typography>
                        </Tooltip>
                      }
                    />
                  </ListItem>
                ))}
              </List>
              {formErrors.role && (
                <Typography color="error" variant="caption">
                  {formErrors.role}
                </Typography>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelAdd} color="secondary" variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleAddUser}
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "Add User"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagementScreen;