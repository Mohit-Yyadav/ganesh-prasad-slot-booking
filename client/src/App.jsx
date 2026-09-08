import React from "react";
import { Routes, Route } from "react-router-dom";

import PublicLayout from "./layouts/PublicLayout.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";

import Home from "./pages/Home.jsx";
import BookSlot from "./pages/BookSlot.jsx";
import Status from "./pages/Status.jsx";
import NotFound from "./pages/NotFound.jsx";

import AdminLogin from "./pages/admin/Login.jsx";
import Dashboard from "./pages/admin/Dashboard.jsx";
import Applications from "./pages/admin/Applications.jsx";
import ApplicationDetail from "./pages/admin/ApplicationDetail.jsx";
import Slots from "./pages/admin/Slots.jsx";

export default function App() {
  return (
    <Routes>
      {/* Public site */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/book" element={<BookSlot />} />
        <Route path="/status" element={<Status />} />
      </Route>

      {/* Admin auth */}
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Admin panel (protected) */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="applications" element={<Applications />} />
        <Route path="applications/:id" element={<ApplicationDetail />} />
        <Route path="slots" element={<Slots />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
