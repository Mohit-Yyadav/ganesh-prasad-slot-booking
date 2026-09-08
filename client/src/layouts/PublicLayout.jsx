import React from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import FlowerShower from "../components/FlowerShower.jsx";

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col relative overflow-x-hidden">
      <FlowerShower />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
