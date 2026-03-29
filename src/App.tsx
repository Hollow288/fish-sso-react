import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Consent from './pages/Consent';
import Callback from './pages/Callback';
import Home from './pages/Home';
import './styles/common.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/consent" element={<Consent />} />
        <Route path="/oauth/consent" element={<Consent />} />
        <Route path="/callback" element={<Callback />} />
        <Route path="/oauth/callback" element={<Callback />} />
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
