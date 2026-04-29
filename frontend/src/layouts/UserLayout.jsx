import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import UserSidebar from "../components/UserSidebar";

const STORAGE_KEY = "vitalflow:user-sidebar-collapsed";

export default function UserLayout() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
    } catch {}
  }, [collapsed]);

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <Navbar />
      <div className="mx-auto flex max-w-[1540px]">
        <UserSidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
        <main className="min-w-0 flex-1 px-4 py-4 lg:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
