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
    Accounts: false,
    Billing: false,
    payments: false,
    communication: false,
    settings: false,
    reports: false,
    meterManager: false,
    meterReading: false,
     tasks: false,
  
  });

  const toggleSidebar = () => setOpen(!open);

  const toggleSubmenu = (menu) => {
    setSubmenuOpen((prev) => ({ ...prev, [menu]: !prev[menu] }));
  };

const renderSubmenu = (menuKey, items) => (
  <Collapse in={submenuOpen[menuKey]} timeout="auto" unmountOnExit>
    <List component="div" disablePadding>
      {items.map(({ icon, label, path, isSubmenu, submenuKey }, idx) => (
        <ListItem
          button
          key={idx}
          sx={{ pl: 3, py: 0.5 }}
          onClick={() =>
            isSubmenu
              ? toggleSubmenu(submenuKey)
              : navigate(path)
          }
        >
          <ListItemIcon sx={{ minWidth: 30 }}>{icon}</ListItemIcon>
          {open && <ListItemText primary={label} />}
          {open && isSubmenu && (
            submenuOpen[submenuKey] ? <ExpandLess /> : <ExpandMore />
          )}
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
<ListItem button onClick={() => toggleSubmenu("Accounts")} sx={{ py: 1 }}>
  <ListItemIcon sx={{ minWidth: 40 }}>
    <Person sx={{ fontSize: 24 }} />
  </ListItemIcon>
  {open && <ListItemText primary="Accounts" sx={{ fontSize: "0.9rem" }} />}
  {open && (submenuOpen.Accounts ? <ExpandLess /> : <ExpandMore />)}
</ListItem>
{renderSubmenu("Accounts", [
  { icon: <Person sx={{ fontSize: 20 }} />, label: "Account Inquiry", path: "/customers" },
  { icon: <Add sx={{ fontSize: 20 }} />, label: "Create Survey", path: "/add-survey" },
  { icon: <Add sx={{ fontSize: 20 }} />, label: "surveys", path: "/surveys" },
  { icon: <Person sx={{ fontSize: 20 }} />, label: "Approvals", path: "/new-customers" }, // <-- new submenu
//approved-customers

//add-customer
  
  { icon: <Add sx={{ fontSize: 20 }} />, label: "connect-customer", path: "/approved-customers" },
   { icon: <Add sx={{ fontSize: 20 }} />, label: "create-customer", path: "/add-customer" },

    { icon: <AccountTree sx={{ fontSize: 20 }} />, label: "Schemes & Zones", path: "/schemes/zones" },
])}



{/* Billing */}
<ListItem button onClick={() => toggleSubmenu("Billing")} sx={{ py: 1 }}>
  <ListItemIcon sx={{ minWidth: 40 }}>
    <Receipt sx={{ fontSize: 24 }} />
  </ListItemIcon>
  {open && <ListItemText primary="Billing" sx={{ fontSize: "0.9rem" }} />}
  {open && (submenuOpen.Billing ? <ExpandLess /> : <ExpandMore />)}
</ListItem>
{renderSubmenu("Billing", [
  { icon: <Receipt sx={{ fontSize: 20 }} />, label: "View", path: "/invoices" },
  { icon: <Add sx={{ fontSize: 20 }} />, label: "Create", path: "/create-invoice" },

  // Add the Meter Reading section trigger
  {
    icon: <Water sx={{ fontSize: 20 }} />,
    label: "Meter Reading",
    path: null, // not navigable — toggles sub-submenu
    isSubmenu: true,
    submenuKey: "meterReading",
  },
])}

{/* Nested Meter Reading submenu */}
<Collapse in={submenuOpen.meterReading} timeout="auto" unmountOnExit>
  <List component="div" disablePadding sx={{ pl: 4 }}>
    <ListItem
      button
      sx={{ py: 0.5 }}
      onClick={() => navigate("/water-readings")}
    >
      <ListItemIcon sx={{ minWidth: 30 }}>
        <Water sx={{ fontSize: 20 }} />
      </ListItemIcon>
      {open && <ListItemText primary="Normal Readings" />}
    </ListItem>

    <ListItem
      button
      sx={{ py: 0.5 }}
      onClick={() => navigate("/abnormal-readings")}
    >
      <ListItemIcon sx={{ minWidth: 30 }}>
        <FlashOn sx={{ fontSize: 20 }} />
      </ListItemIcon>
      {open && <ListItemText primary="Abnormal Readings" />}
    </ListItem>
  </List>
</Collapse>

      
      



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
          //unreceipted-payments
          { icon: <Payment sx={{ fontSize: 20 }} />, label: "Unreceipted", path: "/unreceipted-payments" },
          { icon: <AttachMoney sx={{ fontSize: 20 }} />, label: "Create", path: "/add-payment" },
          { icon: <ReceiptLong sx={{ fontSize: 20 }} />, label: "Receipts", path: "/receipts" },
        ])}


              
      {/* Meter Inventory */}
<ListItem button onClick={() => toggleSubmenu("meterManager")} sx={{ py: 1 }}>
  <ListItemIcon sx={{ minWidth: 40 }}>
    <Business sx={{ fontSize: 24 }} />
  </ListItemIcon>
  {open && <ListItemText primary="Meter manager" sx={{ fontSize: "0.9rem" }} />}
  {open && (submenuOpen. meterManager ? <ExpandLess /> : <ExpandMore />)}
</ListItem>
{renderSubmenu("meterManager", [
  { icon: <Business sx={{ fontSize: 20 }} />, label: "Meter Inventory", path: "/meter-inventory" },
  { icon: <HomeWorkIcon sx={{ fontSize: 20 }} />, label: "Connections", path: "/connections" },
])}



{/* Task Management */}
<ListItem button onClick={() => toggleSubmenu("tasks")} sx={{ py: 1 }}>
  <ListItemIcon sx={{ minWidth: 40 }}>
    <Assignment sx={{ fontSize: 24 }} />
  </ListItemIcon>
  {open && <ListItemText primary="Tasks" sx={{ fontSize: "0.9rem" }} />}
  {open && (submenuOpen.tasks ? <ExpandLess /> : <ExpandMore />)}
</ListItem>

{renderSubmenu("tasks", [
  { icon: <Assignment sx={{ fontSize: 20 }} />, label: "Task Board", path: "/tasks" },
  { icon: <Add sx={{ fontSize: 20 }} />, label: "Create Task", path: "/tasks/create" },
  { icon: <ReceiptLong sx={{ fontSize: 20 }} />, label: "Task Types", path: "/tasks/types" },
  { icon: <AttachMoney sx={{ fontSize: 20 }} />, label: "Attachments", path: "/tasks/attachments" },
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
        
        ])}
      </List>
    </Drawer>
  );
};

export default Sidebar;
