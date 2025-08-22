import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import Home from "./pages/home";
import Signup from "./pages/signup";
import Signin from "./pages/signin";
import Dashboard from "../businessPages/dashboard";
import Catalogue from "../businessPages/catalogue";
import Settings from "../businessPages/settings";
import Appearance from "../businessPages/appearance";
import Storefront from "./pages/store/storefront";
import Cart from "./pages/store/cart";
import ProductDetail from "./pages/store/components/product";
import Checkout from "./pages/store/checkout";
import Order from "./pages/store/order";
import Payments from "../businessPages/payments";
import Business from "../businessPages/business";
import Security from "../businessPages/security";
import { ThemeProvider } from "./ThemeContext";
import { StoreThemeProvider } from "./storeTheme";
import { getStoreIdFromSubdomain } from "./hooks/getStoreId";
import DashboardOrder from "../businessPages/order";
import OrderArea from "../businessPages/orderArea";
import Analysis from "../businessPages/analysis";
import ScrollToTop from "./hooks/scrolltotop";

function App() {
  const storeId = getStoreIdFromSubdomain();

  return (
    <Router>
       <ScrollToTop/>
      <Toaster position="top-right" richColors />

      <Routes>
        {storeId ? (
          <>
            {/* Storefront routes */}
            <Route
              path="/"
              element={
                <StoreThemeProvider storeId={storeId}>
                  <Storefront storeId={storeId} />
                </StoreThemeProvider>
              }
            />
            <Route
              path="/cart"
              element={
                <StoreThemeProvider storeId={storeId}>
                  <Cart storeId={storeId} />
                </StoreThemeProvider>
              }
            />
            <Route
              path="store/:storeid/cart"
              element={
                <StoreThemeProvider storeId={storeId}>
                  <Cart storeId={storeId} />
                </StoreThemeProvider>
              }
            />
            <Route
              path="/checkout/:orderId"
              element={
                <StoreThemeProvider storeId={storeId}>
                  <Checkout storeId={storeId} />
                </StoreThemeProvider>
              }
            />
            <Route
              path="store/:storeid/checkout/:orderId"
              element={
                <StoreThemeProvider storeId={storeId}>
                  <Checkout storeId={storeId} />
                </StoreThemeProvider>
              }
            />
            <Route
              path="/order/:orderId"
              element={
                <StoreThemeProvider storeId={storeId}>
                  <Order storeId={storeId} />
                </StoreThemeProvider>
              }
            />
            <Route
              path="store/:storeid/order/:orderId"
              element={
                <StoreThemeProvider storeId={storeId}>
                  <Order storeId={storeId} />
                </StoreThemeProvider>
              }
            />
            <Route
              path="/product/:id"
              element={
                <StoreThemeProvider storeId={storeId}>
                  <ProductDetail storeId={storeId} />
                </StoreThemeProvider>
              }
            />
            {/* fallback for /store/:storeId paths */}
            <Route
              path="/store/:storeid/*"
              element={
                <StoreThemeProvider storeId={storeId}>
                  <Storefront />
                </StoreThemeProvider>
              }
            />
          </>
        ) : (
          <>
            {/* Main app routes */}
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
                  <DashboardOrder/>
                </ThemeProvider>
              }
            />

            <Route
              path="/orders/order/:orderId"
              element={
                <ThemeProvider>
                  <OrderArea/>
                </ThemeProvider>
              }
            />

            <Route
              path="/analysis"
              element={
                <ThemeProvider>
                  <Analysis/>
                </ThemeProvider>
              }
            />
          </>
        )}
      </Routes>
    </Router>
  );
}

export default App;
