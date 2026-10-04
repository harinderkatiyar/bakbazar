import { Routes, Route } from "react-router-dom";
import { Footer } from "./components/Footer";
import { ScrollToTop } from "./components/ScrollToTop";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Sell from "./pages/Sell";
import "./App.css";
import ListingDetail from "./components/cardListing/ListingDetail";
import MyAds from "./pages/Listingform";
import EditListing from "./pages/Editlisting";
import Chat from "./pages/Chat";
import { Navbar } from "./components/header/Navbar";
import AdminPanel from "./components/Adminpanel";

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/listing/:id" element={<ListingDetail />} />
        <Route
          path="/my-ads"
          element={
            <ProtectedRoute>
              <MyAds />
            </ProtectedRoute>
          }
        />   <Route
          path="/edit-listing/:id"
          element={
            <ProtectedRoute>
              <EditListing />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sell"
          element={
            <ProtectedRoute>
              <Sell />
            </ProtectedRoute>
          }
        />
        <Route path="/chats" element={<Chat />} />
        <Route path="/bikabazar-admin" element={<AdminPanel />} />
        <Route path="*" element={<div className="container py-16 text-center">Page not found</div>} />
      </Routes>
      <Footer />
      <ScrollToTop />
    </>
  );
}

export default App;