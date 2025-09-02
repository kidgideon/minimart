import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import Home from "./pages/home";
import Signup from "./pages/signup";
import Signin from "./pages/signin";
import Dashboard from "../businessPages/dashboard";
import Catalogue from "../businessPages/catalogue";
import Settings from "../businessPages/settings";
import Appearance from "../businessPages/appearance";
import Payments from "../businessPages/payments";
import Business from "../businessPages/business";
import Security from "../businessPages/security";
import DashboardOrder from "../businessPages/order";
import OrderArea from "../businessPages/orderArea";
import Analysis from "../businessPages/analysis";
import { ThemeProvider } from "./ThemeContext";
import ScrollToTop from "./hooks/scrolltotop";
import Customers from "../businessPages/customers";
import Help from "../businessPages/help";
import AdminDashboard from "../admin/home";

// Create a single QueryClient instance (recommended: create outside of component)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Data considered fresh for 5 mins
      cacheTime: 1000 * 60 * 30, // Cache persists for 30 mins if unused
      refetchOnWindowFocus: false, // Avoid unnecessary refetches when switching tabs
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <ScrollToTop />
        <Toaster position="top-right" richColors />

        <Routes>
          {/* Main platform routes */}
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/signin" element={<Signin />} />

          <Route
            path="/dashboard"
            element={
              <ThemeProvider>
                <Dashboard />
              </ThemeProvider>
            }
          />
          <Route
            path="/catalogue"
            element={
              <ThemeProvider>
                <Catalogue />
              </ThemeProvider>
            }
          />
          <Route
            path="/settings/*"
            element={
              <ThemeProvider>
                <Settings />
              </ThemeProvider>
            }
          />
          <Route
            path="/settings/appearance"
            element={
              <ThemeProvider>
                <Appearance />
              </ThemeProvider>
            }
          />
          <Route
            path="/settings/payments"
            element={
              <ThemeProvider>
                <Payments />
              </ThemeProvider>
            }
          />
          <Route
            path="/settings/business"
            element={
              <ThemeProvider>
                <Business />
              </ThemeProvider>
            }
          />
          <Route
            path="/settings/security"
            element={
              <ThemeProvider>
                <Security />
              </ThemeProvider>
            }
          />
          <Route
            path="/orders"
            element={
              <ThemeProvider>
                <DashboardOrder />
              </ThemeProvider>
            }
          />
          <Route
            path="/orders/order/:orderId"
            element={
              <ThemeProvider>
                <OrderArea />
              </ThemeProvider>
            }
          />
          <Route
            path="/analysis"
            element={
              <ThemeProvider>
                <Analysis />
              </ThemeProvider>
            }
          />

          <Route
            path="/customers"
            element={
              <ThemeProvider>
                <Customers />
              </ThemeProvider>
            }
          />

            <Route
            path="/help"
            element={
              <ThemeProvider>
                <Help />
              </ThemeProvider>
            }
          />

          <Route
            path="/admin/ceo/area"
            element={
                <AdminDashboard />
            }
          />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
