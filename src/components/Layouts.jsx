import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import Sidebar from "./Sidebar";

export function PublicLayout() {
  return (
    <div>
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export function DashboardLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <Outlet />
      </div>
    </div>
  );
}
