
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline, Box } from "@mui/material";



import HomeScreen from "./pages/home/home";
import CustomersScreen from "./pages/customers/customers";
import BuildingsScreen from "./pages/property/property";
import AddPropertyScreen from "./pages/property/addProperty";
import AddUnitScreen from "./pages/property/addUnit";
import BuildingDetailsScreen from "./pages/property/propertyDetails";
import EditBuildingScreen from "./pages/property/editBuilding";
import BillList from "./pages/billing/Invoices"
import CreateInvoice from "./pages/billing/createInvoice";

import InvoiceDetails from "./pages/billing/InvoiceDetail";
import CustomerDetails from "./pages/customers/customerDetails";

import PaymentDetails from "./pages/payments/PaymentDetail";
import CreatePayment from "./pages/payments/addPayment";
import WaterReadingsList from "./pages/meterReading/waterReadings";
import MeterReadingDetails from "./pages/meterReading/meterReadingDetails";
import LandlordsScreen from "./pages/property/landlords";
import LandlordDetailsScreen from "./pages/property/landlordDetails";
import Receipts from "./pages/receipts/receipts";
import ReceiptDetail from "./pages/receipts/receiptDetails";
import SentSMSPage from "./pages/communication/sentSMS";
import SmsScreen from "./pages/communication/sendSMS";
import SendBillsScreen from "./pages/communication/sendBills";
import DebtManager from "./pages/communication/debtManager";
import ReportScreen from "./pages/reports/reports";
import ComingSoonPage from "./pages/comingSoon/comingSoon";
import CustomerEditScreen from "./pages/customers/editCustomers";
import UserManagementScreen from "./pages/settings/users/users";
import AddUser from "./pages/settings/addUser";
import UserDetails from "./pages/settings/users/userDetails";
import Organization from "./pages/settings/org/orgDetails";
import EditOrganization from "./pages/settings/org/editOrg";


import TaskDetailsScreen from "./pages/task/taskDetails";
import SchemeZoneRouteScreen from "./pages/settings/schemes/scheme";
import { useAuthStore, useThemeStore } from "./store/authStore";
import { getTheme } from "./store/theme";

import Navbar from "./global/navbar";
import ForgotPasswordScreen from "./pages/auth/forgotPassword";
import ChangePasswordScreen from "./pages/auth/ChangePasswordScreen";
import VerifyOtpScreen from "./pages/auth/VerifyOtpScreen";
import ProtectedRoute from "./ProtectedRoute";
import Sidebar from "./global/sidebar";
import Payments from "./pages/payments/payments";
import Login from "./pages/auth/login";
import MeterScreen from "./pages/meterInventory/meters";
import ConnectionsScreen from "./pages/connections/connection";
import NewCustomersScreen from "./pages/customers/newCustomers";
import AbnormalMeterReadingsList from "./pages/meterReading/abnormalReadings";
import BillTypeScreen from "./pages/billing/billtypes";
import UnreceipedPayments from "./pages/payments/unreceipted";
import TaskBoard from "./pages/tasks/tasks";
import Surveys from "./pages/surveys/survey";
import ApprovedCustomersScreen from "./pages/customers/assignMeter/assignMeter";
import CreateSurvey from "./pages/surveys/addsurvey";
import CreateCustomerScreen from "./pages/customers/addCustomer";
import AdjustmentsList from "./pages/billing/adjustment/adjustment";

const App = () => {
  const { darkMode } = useThemeStore();
  const { isAuthenticated } = useAuthStore();
  const theme = getTheme(darkMode ? "dark" : "light");

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box
          sx={{
            minHeight: "100vh", // Full viewport height
            width: "100%", // Full width
            backgroundColor: theme.palette.background.default, // Theme background
            display: "flex", // Flexbox for sidebar and content
            flexDirection: "row",
          }}
        >
          {isAuthenticated && <Sidebar />}
          <Box
            sx={{
              flexGrow: 1, // Takes remaining space
              display: "flex",
              flexDirection: "column",
              minHeight: "100vh", // Ensure content fills height
            }}
          >
            {isAuthenticated && <Navbar />}
            <Box
              component="main"
              sx={{
                flexGrow: 1, // Content expands to fill space
                backgroundColor: theme.palette.background.default, // Consistent background
                p: 3, // Padding for content
              }}
            >
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/reset-password" element={<ForgotPasswordScreen />} />
                <Route path="/change-password" element={<ChangePasswordScreen />} />
                <Route path="/verify-otp" element={<VerifyOtpScreen />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <HomeScreen />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/customers"
                  element={
                    <ProtectedRoute>
                      <CustomersScreen />
                    </ProtectedRoute>
                  }
                />


                  <Route
                  path="/properties"
                  element={
                    <ProtectedRoute>
                      <BuildingsScreen />
                    </ProtectedRoute>
                  }
                /> 

                   <Route
                  path="/add-property"
                  element={
                    <ProtectedRoute>
                      <AddPropertyScreen />
                    </ProtectedRoute>
                  }
                /> 
              
                <Route
                  path="/add-unit/:buildingId"
                  element={
                    <ProtectedRoute>
                      <AddUnitScreen />
                    </ProtectedRoute>
                  }
                  />






                   <Route
                  path="/building-details/:id"
                  element={
                    <ProtectedRoute>
                      <BuildingDetailsScreen />
                    </ProtectedRoute>
                  }
                />


                <Route
                  path="/edit-building/:buildingId"
                  element={
                    <ProtectedRoute>
                      <EditBuildingScreen/>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/invoices"
                  element={
                    <ProtectedRoute>
                      <BillList/>
                    </ProtectedRoute>
                  }
                />

                   <Route
                  path="/bill-adjustments"
                  element={
                    <ProtectedRoute>
                      <AdjustmentsList/>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/add-survey"
                  element={
                    <ProtectedRoute>
                      <CreateSurvey />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/create-invoice"
                  element={
                    <ProtectedRoute>
                      <CreateInvoice />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/get-invoice/:id"
                  element={
                    <ProtectedRoute>
                      <InvoiceDetails />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/customer-details/:id"
                  element={
                    <ProtectedRoute>
                      <CustomerDetails />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/payments"
                  element={
                    <ProtectedRoute>
                      <Payments />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/payments/:id"
                  element={
                    <ProtectedRoute>
                      <PaymentDetails />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/add-payment"
                  element={
                    <ProtectedRoute>
                      <CreatePayment />
                    </ProtectedRoute>
                  }
                />


                     <Route
                  path="/meter-readings"
                  element={
                    <ProtectedRoute>
                      <WaterReadingsList/>
                    </ProtectedRoute>
                  }
                /> 

                <Route
                  path="/water-reading/:id"
                  element={
                    <ProtectedRoute>
                      <MeterReadingDetails />
                    </ProtectedRoute>
                  }/>


                   <Route
                  path="/landlords"
                  element={
                    <ProtectedRoute>
                      <LandlordsScreen />
                    </ProtectedRoute>
                  }  
                /> 


                  <Route
                  path="/landlord/:id"
                  element={
                    <ProtectedRoute>
                      <LandlordDetailsScreen />
                    </ProtectedRoute>
                  }
                />
                

                

                <Route
                  path="/receipts"
                  element={
                    <ProtectedRoute>
                      <Receipts />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/receipts/:id"
                  element={
                    <ProtectedRoute>
                      <ReceiptDetail />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/sent-sms"
                  element={
                    <ProtectedRoute>
                      <SentSMSPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/send-sms"
                  element={
                    <ProtectedRoute>
                      <SmsScreen />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/send-bills"
                  element={
                    <ProtectedRoute>
                      <SendBillsScreen />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/debt-management"
                  element={
                    <ProtectedRoute>
                      <DebtManager />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/view-reports"
                  element={
                    <ProtectedRoute>
                      <ReportScreen />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/request-custom-reports"
                  element={
                    <ProtectedRoute>
                      <ComingSoonPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/customer-edit/:id"
                  element={
                    <ProtectedRoute>
                      <CustomerEditScreen />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/users"
                  element={
                    <ProtectedRoute>
                      <UserManagementScreen />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/add-user"
                  element={
                    <ProtectedRoute>
                      <AddUser />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/user/:id"
                  element={
                    <ProtectedRoute>
                      <UserDetails />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/org-details"
                  element={
                    <ProtectedRoute>
                      <Organization />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/organization/edit"
                  element={
                    <ProtectedRoute>
                      <EditOrganization />
                    </ProtectedRoute>
                  }
                />


               

                 

<Route
                  path="task-details/:taskId"
                  element={
                    <ProtectedRoute>
                      <TaskDetailsScreen />
                    </ProtectedRoute>
                  }
                />  

                  <Route
                  path="schemes/zones"
                  element={
                    <ProtectedRoute>
                      <SchemeZoneRouteScreen />
                    </ProtectedRoute>
                  }
                /> 

                     <Route
                  path="meter-inventory"
                  element={
                    <ProtectedRoute>
                      <MeterScreen />
                    </ProtectedRoute>
                  }
                /> 

                   <Route
                  path="connections"
                  element={
                    <ProtectedRoute>
                      <ConnectionsScreen />
                    </ProtectedRoute>
                  }
                /> 

                  <Route
                  path="new-customers"
                  element={
                    <ProtectedRoute>
                      <NewCustomersScreen />
                    </ProtectedRoute>
                  }
                /> 

                   <Route
                  path="abnormal-readings"
                  element={
                    <ProtectedRoute>
                      <AbnormalMeterReadingsList />
                    </ProtectedRoute>
                  }
                /> 



                   <Route
                  path="bill-types"
                  element={
                    <ProtectedRoute>
                      <BillTypeScreen />
                    </ProtectedRoute>
                  }
                /> 

                    <Route
                  path="unreceipted-payments"
                  element={
                    <ProtectedRoute>
                      <UnreceipedPayments />
                    </ProtectedRoute>
                  }
                /> 

                    <Route
                  path="tasks"
                  element={
                    <ProtectedRoute>
                      <TaskBoard />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="surveys"
                  element={
                    <ProtectedRoute>
                      <Surveys />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="approved-customers"
                  element={
                    <ProtectedRoute>
                      <ApprovedCustomersScreen />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="add-customer"
                  element={
                    <ProtectedRoute>
                      <CreateCustomerScreen />
                    </ProtectedRoute>
                  }
                />







               
              </Routes>
            </Box>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
};

export default App;