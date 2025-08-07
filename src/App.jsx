import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import Home from './pages/home';
import Signup from './pages/signup';
import Signin from './pages/signin';
import Dashboard from '../businessPages/dashboard';
import Catalogue from '../businessPages/catalogue';
import Settings from '../businessPages/settings';
import Appearance from '../businessPages/appearance';
import Storefront from './pages/store/storefront';
import Cart from './pages/store/cart';
import ProductDetail from './pages/store/components/product';
import { ThemeProvider } from './ThemeContext';
import { getStoreIdFromSubdomain } from "./hooks/getStoreId";

function App() {
  const storeId = getStoreIdFromSubdomain();

  return (
    <Router>
      <Toaster position="top-right" richColors />

      <Routes>
        {storeId ? (
          <>
            <Route path="/" element={<Storefront storeId={storeId} />} />
            <Route path="/cart" element={<Cart storeId={storeId} />} />
            <Route path="/product/:id" element={<ProductDetail storeId={storeId} />} />
            {/* fallback if someone uses /store/:storeId style in dev */}
            <Route path="/store/:storeid/*" element={<Storefront />} />
          </>
        ) : (
          // Main application routes
          <>
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
          </>
        )}
      </Routes>
    </Router>
  );
}

export default App;
