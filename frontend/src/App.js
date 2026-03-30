import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import ConnectDevices from "./pages/ConnectDevices";
import { Toaster } from "./components/ui/sonner";

function App() {
  return (
    <div className="App bg-neutral-950 min-h-screen">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/devices" element={<ConnectDevices />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;