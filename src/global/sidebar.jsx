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
  AccountTree,
  Poll,
  Ballot,
  Search,
  HowToReg,
  PersonAddAlt,
  PostAdd,
  AutoFixHigh,
} from "@mui/icons-material";

import BusinessIcon from "@mui/icons-material/Business";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import MenuIcon from "@mui/icons-material/Menu";
import { useNavigate } from "react-router-dom";

const Sidebar = () => {
  const navigate = useNavigate();

  const [open, setOpen] = useState(true);

  const [submenuOpen, setSubmenuOpen] = useState({});

  const toggleSidebar = () => setOpen(!open);

  const toggleSubmenu = (menu) => {
    setSubmenuOpen((prev) => ({ ...prev, [menu]: !prev[menu] }));
  };

  // Reusable submenu renderer
  const renderSubmenu = (menuKey, items) => (
    <Collapse in={submenuOpen[menuKey]} timeout="auto" unmountOnExit>
      <List component="div" disablePadding>
        {items.map(({ icon, label, path, isSubmenu, submenuKey, children }, idx) => (
          <div key={idx}>
            <ListItem
              button
              sx={{ pl: 3, py: 0.5 }}
              onClick={() => {
                if (isSubmenu) toggleSubmenu(submenuKey);
                else navigate(path);
              }}
            >
              <ListItemIcon sx={{ minWidth: 30 }}>{icon}</ListItemIcon>
              {open && <ListItemText primary={label} />}
              {open && isSubmenu && (
                submenuOpen[submenuKey] ? <ExpandLess /> : <ExpandMore />
              )}
            </ListItem>

            {/* Nested submenu children */}
            {isSubmenu && submenuOpen[submenuKey] && children && (
              <Collapse in={submenuOpen[submenuKey]} timeout="auto" unmountOnExit>
                <List component="div" disablePadding sx={{ pl: 4 }}>
                  {children.map((child, cIdx) => (
                    <ListItem
                      key={cIdx}
                      button
                      sx={{ py: 0.5 }}
                      onClick={() => navigate(child.path)}
                    >
                      <ListItemIcon sx={{ minWidth: 30 }}>{child.icon}</ListItemIcon>
                      {open && <ListItemText primary={child.label} />}
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            )}
          </div>
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
      {/* Sidebar Toggle */}
      <IconButton onClick={toggleSidebar} sx={{ p: 1, mb: 1 }}>
        <MenuIcon sx={{ fontSize: 24 }} />
      </IconButton>

      <List sx={{ p: 0 }}>

        {/* DASHBOARD */}
        <ListItem button onClick={() => navigate("/")} sx={{ py: 1 }}>
          <ListItemIcon sx={{ minWidth: 40 }}>
            <Dashboard sx={{ fontSize: 24 }} />
          </ListItemIcon>
          {open && <ListItemText primary="Dashboard" />}
        </ListItem>

        {/* ACCOUNTS */}
        <ListItem button onClick={() => toggleSubmenu("Accounts")} sx={{ py: 1 }}>
          <ListItemIcon sx={{ minWidth: 40 }}>
            <Person sx={{ fontSize: 24 }} />
          </ListItemIcon>
          {open && <ListItemText primary="Accounts" />}
          {open && (submenuOpen.Accounts ? <ExpandLess /> : <ExpandMore />)}
        </ListItem>

        {renderSubmenu("Accounts", [
          { icon: <Search sx={{ fontSize: 20 }} />, label: "Account Inquiry", path: "/customers" },
          { icon: <HowToReg sx={{ fontSize: 20 }} />, label: "Approvals", path: "/new-customers" },
          { icon: <PersonAddAlt sx={{ fontSize: 20 }} />, label: "Create Customer", path: "/add-customer" },
          { icon: <AccountTree sx={{ fontSize: 20 }} />, label: "Schemes & Zones", path: "/schemes/zones" },

          {
            icon: <Poll sx={{ fontSize: 20 }} />,
            label: "Survey",
            isSubmenu: true,
            submenuKey: "Survey",
            children: [
              { icon: <Ballot sx={{ fontSize: 20 }} />, label: "View Surveys", path: "/surveys" },
              { icon: <PostAdd sx={{ fontSize: 20 }} />, label: "Add Survey", path: "/add-survey" },
            ],
          },
        ])}

        {/* BILLING */}
        <ListItem button onClick={() => toggleSubmenu("Billing")} sx={{ py: 1 }}>
          <ListItemIcon sx={{ minWidth: 40 }}>
            <Receipt sx={{ fontSize: 24 }} />
          </ListItemIcon>
          {open && <ListItemText primary="Billing" />}
          {open && (submenuOpen.Billing ? <ExpandLess /> : <ExpandMore />)}
        </ListItem>

        {renderSubmenu("Billing", [
          { icon: <Receipt sx={{ fontSize: 20 }} />, label: "View", path: "/invoices" },
          { icon: <Add sx={{ fontSize: 20 }} />, label: "Create", path: "/create-invoice" },
          {icon: <AutoFixHigh sx={{ fontSize: 20 }} />, label: "Bill Adjustments", path: "/bill-adjustments" },

          {
            icon: <Water sx={{ fontSize: 20 }} />,
            label: "Meter Reading",
            isSubmenu: true,
            submenuKey: "meterReading",
            children: [
              { icon: <Water sx={{ fontSize: 20 }} />, label: "Normal Readings", path: "/meter-readings" },
              { icon: <FlashOn sx={{ fontSize: 20 }} />, label: "Abnormal Readings", path: "/abnormal-readings" },
            ],
          },
        ])}

        {/* PAYMENTS */}
        <ListItem button onClick={() => toggleSubmenu("payments")} sx={{ py: 1 }}>
          <ListItemIcon sx={{ minWidth: 40 }}>
            <Payment sx={{ fontSize: 24 }} />
          </ListItemIcon>
          {open && <ListItemText primary="Payments" />}
          {open && (submenuOpen.payments ? <ExpandLess /> : <ExpandMore />)}
        </ListItem>

        {renderSubmenu("payments", [
          { icon: <Payment sx={{ fontSize: 20 }} />, label: "View", path: "/payments" },
          { icon: <Payment sx={{ fontSize: 20 }} />, label: "Unreceipted", path: "/unreceipted-payments" },
          { icon: <AttachMoney sx={{ fontSize: 20 }} />, label: "Create", path: "/add-payment" },
          { icon: <ReceiptLong sx={{ fontSize: 20 }} />, label: "Receipts", path: "/receipts" },
        ])}

        {/* METER MANAGER */}
        <ListItem button onClick={() => toggleSubmenu("meterManager")} sx={{ py: 1 }}>
          <ListItemIcon sx={{ minWidth: 40 }}>
            <Business sx={{ fontSize: 24 }} />
          </ListItemIcon>
          {open && <ListItemText primary="Meter Manager" />}
          {open && (submenuOpen.meterManager ? <ExpandLess /> : <ExpandMore />)}
        </ListItem>

        {renderSubmenu("meterManager", [
          { icon: <Business sx={{ fontSize: 20 }} />, label: "Meter Inventory", path: "/meter-inventory" },
          { icon: <HomeWorkIcon sx={{ fontSize: 20 }} />, label: "Connections", path: "/connections" },
        ])}

        {/* TASKS */}
        <ListItem button onClick={() => toggleSubmenu("tasks")} sx={{ py: 1 }}>
          <ListItemIcon sx={{ minWidth: 40 }}>
            <Assignment sx={{ fontSize: 24 }} />
          </ListItemIcon>
          {open && <ListItemText primary="Tasks" />}
          {open && (submenuOpen.tasks ? <ExpandLess /> : <ExpandMore />)}
        </ListItem>

        {renderSubmenu("tasks", [
          { icon: <Assignment sx={{ fontSize: 20 }} />, label: "Task Board", path: "/tasks" },
          { icon: <Add sx={{ fontSize: 20 }} />, label: "Create Task", path: "/tasks/create" },
          { icon: <ReceiptLong sx={{ fontSize: 20 }} />, label: "Task Types", path: "/tasks/types" },
          { icon: <AttachMoney sx={{ fontSize: 20 }} />, label: "Attachments", path: "/tasks/attachments" },
        ])}

        {/* COMMUNICATION */}
        <ListItem button onClick={() => toggleSubmenu("communication")} sx={{ py: 1 }}>
          <ListItemIcon sx={{ minWidth: 40 }}>
            <Chat sx={{ fontSize: 24 }} />
          </ListItemIcon>
          {open && <ListItemText primary="Communication" />}
          {open && (submenuOpen.communication ? <ExpandLess /> : <ExpandMore />)}
        </ListItem>

        {renderSubmenu("communication", [
          { icon: <Chat sx={{ fontSize: 20 }} />, label: "Sent SMS", path: "/sent-sms" },
          { icon: <Send sx={{ fontSize: 20 }} />, label: "Send SMS", path: "/send-sms" },
          { icon: <Receipt sx={{ fontSize: 20 }} />, label: "Send Bills", path: "/send-bills" },
          { icon: <MonetizationOn sx={{ fontSize: 20 }} />, label: "Debt Mgmt", path: "/debt-management" },
        ])}

        {/* REPORTS */}
        <ListItem button onClick={() => toggleSubmenu("reports")} sx={{ py: 1 }}>
          <ListItemIcon sx={{ minWidth: 40 }}>
            <BarChart sx={{ fontSize: 24 }} />
          </ListItemIcon>
          {open && <ListItemText primary="Reports" />}
          {open && (submenuOpen.reports ? <ExpandLess /> : <ExpandMore />)}
        </ListItem>

        {renderSubmenu("reports", [
          { icon: <Assignment sx={{ fontSize: 20 }} />, label: "View", path: "/view-reports" },
          { icon: <Assignment sx={{ fontSize: 20 }} />, label: "Custom", path: "/request-custom-reports" },
        ])}

        {/* SETTINGS */}
        <ListItem button onClick={() => toggleSubmenu("settings")} sx={{ py: 1 }}>
          <ListItemIcon sx={{ minWidth: 40 }}>
            <Settings sx={{ fontSize: 24 }} />
          </ListItemIcon>
          {open && <ListItemText primary="Settings" />}
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
