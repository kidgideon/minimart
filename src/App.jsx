import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import Home from './pages/home';
import Signup from './pages/signup';
import Signin from './pages/signin';
import Dashboard from '../businessPages/dashboard';
import Catalogue from '../businessPages/catalogue';

function App() {
  return (
    <Router>
      {/* Sonner toaster config */}
      <Toaster position="top-right" richColors />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup/>}/>
         <Route path="/signin" element={<Signin/>}/>
           <Route path="/dashboard" element={<Dashboard/>}/>
              <Route path="/catalogue" element={<Catalogue/>}/>
      </Routes>
    </Router>
  );
}

export default App;
