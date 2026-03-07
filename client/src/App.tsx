import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import ItemsPage from "./pages/ItemsPage";
import Login from "./pages/Login";
import NotFoundPage from "./pages/NotFoundPage";
import Register from "./pages/Register";
import PostDonation from "./pages/PostDonation";
import MyDonations from "./pages/MyDonations";
import Dashboard from "./pages/Dashboard";




function App() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/explore" element={<ItemsPage />} />
        <Route path="/items" element={<ItemsPage />} />
        <Route path="/post-donation" element={<PostDonation />} />
        <Route path="/my-donations" element={<MyDonations />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

export default App;