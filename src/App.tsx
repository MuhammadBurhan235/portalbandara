import { BrowserRouter, Routes, Route } from "react-router-dom";
import FeedbackForm from "./pages/FeedbackForm";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rute untuk penumpang bandara */}
        <Route path="/" element={<FeedbackForm />} />

        {/* Rute tersembunyi untuk manajemen/admin */}
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
