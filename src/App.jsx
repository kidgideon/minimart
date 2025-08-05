import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import Home from './pages/home';
import Signup from './pages/signup';
import Signin from './pages/signin';
import Dashboard from '../businessPages/dashboard';
import Catalogue from '../businessPages/catalogue';
import Settings from '../businessPages/settings';
import Appearance from '../businessPages/appearance';
import { ThemeProvider } from './ThemeContext';

function App() {
  return (
    <Router>
      {/* Global toaster */}
      <Toaster position="top-right" richColors />

      <Routes>
        {/* Public Pages (no ThemeProvider) */}
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/signin" element={<Signin />} />

        {/* Business Pages (with ThemeProvider) */}
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
          path="/settings"
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
      </Routes>
    </Router>
  );
}

export default App;
