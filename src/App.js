import './App.css';
import {
  HashRouter as Router,
  Routes,
  Route,
} from "react-router-dom";

import LoginPage from "./pages/LoginPage.tsx";
import RegisterPage from "./pages/RegisterPage.tsx";
import UserDashboard from "./pages/UserDashboard.jsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import Table from "./pages/Table.tsx";
import TempAddReading from './pages/TempAddReadings.tsx';
import WebcamCapture from './components/CaptureImg.jsx';
import ImageUpload from './components/ImgUpload.jsx';
import ImageCompare from './components/SimilarityImage.jsx';
import CaptureBarcode from './components/CaptureBarcode.jsx';
import BlurChecker from './components/CaptureBlurImage.jsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route exact path="/" element={<UserDashboard />} />
        <Route exact path="/CreateAccount" element={<RegisterPage />} />
        <Route exact path="/login" element={<LoginPage />} />
        <Route exact path="/dashboard" element={<UserDashboard />} />
        <Route exact path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
