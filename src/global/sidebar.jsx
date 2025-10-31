import { useState } from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Collapse,
} from "@mui/material";
import {
  Dashboard,
  Receipt,
  Payment,
  BarChart,
  Settings,
  Person,
  ExpandLess,
  ExpandMore,
  Add,
  AttachMoney,
  Chat,
  Send,
  MonetizationOn,
  Assignment,
  ReceiptLong,
  Business,
  Water,
  FlashOn,
  LocalGasStation,
  AccountTree,
} from "@mui/icons-material";
import MenuIcon from "@mui/icons-material/Menu";
import BusinessIcon from "@mui/icons-material/Business";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import { useNavigate } from "react-router-dom";

const Sidebar = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true); // Sidebar width
  const [submenuOpen, setSubmenuOpen] = useState({
    customers: false,
    invoices: false,
    payments: false,
    communication: false,
    settings: false,
    reports: false,
    metering: false,
    meterReading: false,
  });

  const toggleSidebar = () => setOpen(!open);

  const toggleSubmenu = (menu) => {
    setSubmenuOpen((prev) => ({ ...prev, [menu]: !prev[menu] }));
  };

  const renderSubmenu = (menuKey, items) => (
    <Collapse in={submenuOpen[menuKey]} timeout="auto" unmountOnExit>
      <List component="div" disablePadding>
        {items.map(({ icon, label, path }, idx) => (
          <ListItem
            button
            key={idx}
            sx={{ pl: 3, py: 0.5 }}
            onClick={() => navigate(path)}
          >
            <ListItemIcon sx={{ minWidth: 30 }}>{icon}</ListItemIcon>
            {open && <ListItemText primary={label} sx={{ fontSize: "0.8rem" }} />}
          </ListItem>
        ))}
      </List>
    </Collapse>
  );

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: open ? 220 : 55,
        transition: "width 0.3s",
        "& .MuiDrawer-paper": {
          width: open ? 220 : 55,
          overflowX: "hidden",
          boxSizing: "border-box",
        },
      }}
    >
      {/* Toggle Button */}
      <IconButton onClick={toggleSidebar} sx={{ p: 1, mb: 1 }}>
        <MenuIcon sx={{ fontSize: 24 }} />
      </IconButton>

      <List sx={{ p: 0 }}>
        {/* Dashboard */}
        <ListItem button onClick={() => navigate("/")} sx={{ py: 1 }}>
          <ListItemIcon sx={{ minWidth: 40 }}>
            <Dashboard sx={{ fontSize: 24 }} />
          </ListItemIcon>
          {open && <ListItemText primary="Dashboard" sx={{ fontSize: "0.9rem" }} />}
        </ListItem>

     
      {/* Customers */}
<ListItem button onClick={() => toggleSubmenu("customers")} sx={{ py: 1 }}>
  <ListItemIcon sx={{ minWidth: 40 }}>
    <Person sx={{ fontSize: 24 }} />
  </ListItemIcon>
  {open && <ListItemText primary="Customers" sx={{ fontSize: "0.9rem" }} />}
  {open && (submenuOpen.customers ? <ExpandLess /> : <ExpandMore />)}
</ListItem>
{renderSubmenu("customers", [
  { icon: <Person sx={{ fontSize: 20 }} />, label: "Customers", path: "/customers" },
  { icon: <Add sx={{ fontSize: 20 }} />, label: "Add Customer", path: "/add-customer" },
  { icon: <Person sx={{ fontSize: 20 }} />, label: "New Customers", path: "/new-customers" }, // <-- new submenu
])}


        {/* Utilities */}
        <ListItem button onClick={() => toggleSubmenu("meterReading")} sx={{ py: 1 }}>
          <ListItemIcon sx={{ minWidth: 40 }}>
            <Settings sx={{ fontSize: 24 }} />
          </ListItemIcon>
          {open && <ListItemText primary="Meter Readings" sx={{ fontSize: "0.9rem" }} />}
          {open && (submenuOpen.meterReading ? <ExpandLess /> : <ExpandMore />)}
        </ListItem>
        {renderSubmenu("meterReading", [
          { icon: <Water sx={{ fontSize: 20 }} />, label: "Normal Readings", path: "/water-readings" },
          { icon: <Water sx={{ fontSize: 20 }} />, label: "Abnormal Readings", path: "/abnormal-readings" },
         
        ])}

      
      
      {/* Meter Inventory */}
<ListItem button onClick={() => toggleSubmenu("metering")} sx={{ py: 1 }}>
  <ListItemIcon sx={{ minWidth: 40 }}>
    <Business sx={{ fontSize: 24 }} />
  </ListItemIcon>
  {open && <ListItemText primary="Meter & connections" sx={{ fontSize: "0.9rem" }} />}
  {open && (submenuOpen.metering ? <ExpandLess /> : <ExpandMore />)}
</ListItem>
{renderSubmenu("metering", [
  { icon: <Business sx={{ fontSize: 20 }} />, label: "Meter Inventory", path: "/meter-inventory" },
  { icon: <HomeWorkIcon sx={{ fontSize: 20 }} />, label: "Connections", path: "/connections" },
])}


        {/* Invoices */}
        <ListItem button onClick={() => toggleSubmenu("invoices")} sx={{ py: 1 }}>
          <ListItemIcon sx={{ minWidth: 40 }}>
            <Receipt sx={{ fontSize: 24 }} />
          </ListItemIcon>
          {open && <ListItemText primary="Invoices" sx={{ fontSize: "0.9rem" }} />}
          {open && (submenuOpen.invoices ? <ExpandLess /> : <ExpandMore />)}
        </ListItem>
        {renderSubmenu("invoices", [
          { icon: <Receipt sx={{ fontSize: 20 }} />, label: "View", path: "/invoices" },
          { icon: <Add sx={{ fontSize: 20 }} />, label: "Create", path: "/create-invoice" },
        ])}

        {/* Payments */}
        <ListItem button onClick={() => toggleSubmenu("payments")} sx={{ py: 1 }}>
          <ListItemIcon sx={{ minWidth: 40 }}>
            <Payment sx={{ fontSize: 24 }} />
          </ListItemIcon>
          {open && <ListItemText primary="Payments" sx={{ fontSize: "0.9rem" }} />}
          {open && (submenuOpen.payments ? <ExpandLess /> : <ExpandMore />)}
        </ListItem>
        {renderSubmenu("payments", [
          { icon: <Payment sx={{ fontSize: 20 }} />, label: "View", path: "/payments" },
          { icon: <AttachMoney sx={{ fontSize: 20 }} />, label: "Create", path: "/add-payment" },
          { icon: <ReceiptLong sx={{ fontSize: 20 }} />, label: "Receipts", path: "/receipts" },
        ])}

        {/* Communication */}
        <ListItem button onClick={() => toggleSubmenu("communication")} sx={{ py: 1 }}>
          <ListItemIcon sx={{ minWidth: 40 }}>
            <Chat sx={{ fontSize: 24 }} />
          </ListItemIcon>
          {open && <ListItemText primary="Communication" sx={{ fontSize: "0.9rem" }} />}
          {open && (submenuOpen.communication ? <ExpandLess /> : <ExpandMore />)}
        </ListItem>
        {renderSubmenu("communication", [
          { icon: <Chat sx={{ fontSize: 20 }} />, label: "Sent SMS", path: "/sent-sms" },
          { icon: <Send sx={{ fontSize: 20 }} />, label: "Send SMS", path: "/send-sms" },
          { icon: <Receipt sx={{ fontSize: 20 }} />, label: "Send Bills", path: "/send-bills" },
          { icon: <MonetizationOn sx={{ fontSize: 20 }} />, label: "Debt Mgmt", path: "/debt-management" },
        ])}

        {/* Reports */}
        <ListItem button onClick={() => toggleSubmenu("reports")} sx={{ py: 1 }}>
          <ListItemIcon sx={{ minWidth: 40 }}>
            <BarChart sx={{ fontSize: 24 }} />
          </ListItemIcon>
          {open && <ListItemText primary="Reports" sx={{ fontSize: "0.9rem" }} />}
          {open && (submenuOpen.reports ? <ExpandLess /> : <ExpandMore />)}
        </ListItem>
        {renderSubmenu("reports", [
          { icon: <Assignment sx={{ fontSize: 20 }} />, label: "View", path: "/view-reports" },
          { icon: <Assignment sx={{ fontSize: 20 }} />, label: "Custom", path: "/request-custom-reports" },
        ])}

        {/* Settings */}
        <ListItem button onClick={() => toggleSubmenu("settings")} sx={{ py: 1 }}>
          <ListItemIcon sx={{ minWidth: 40 }}>
            <Settings sx={{ fontSize: 24 }} />
          </ListItemIcon>
          {open && <ListItemText primary="Settings" sx={{ fontSize: "0.9rem" }} />}
          {open && (submenuOpen.settings ? <ExpandLess /> : <ExpandMore />)}
        </ListItem>
        {renderSubmenu("settings", [
          { icon: <Person sx={{ fontSize: 20 }} />, label: "Users", path: "/users" },
          { icon: <BusinessIcon sx={{ fontSize: 20 }} />, label: "Org Details", path: "/org-details" },
          { icon: <AccountTree sx={{ fontSize: 20 }} />, label: "Schemes & Zones", path: "/schemes/zones" },
        ])}
      </List>
    </Drawer>
  );
};

export default Sidebar;
