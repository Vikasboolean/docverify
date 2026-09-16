import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, ScanSearch, History, FileBarChart2, UserCircle, LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/verify", label: "Verify document", icon: ScanSearch },
  { to: "/history", label: "Verification history", icon: History },
  { to: "/reports", label: "Reports", icon: FileBarChart2 },
  { to: "/profile", label: "Profile", icon: UserCircle },
];

export default function Sidebar() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <aside className="sidebar">
      <NavLink to="/" className="sidebar-brand">
        <ShieldCheck size={22} strokeWidth={2.2} />
        <span>VeriGate</span>
      </NavLink>

      <nav className="sidebar-nav">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => "sidebar-link" + (isActive ? " active" : "")}>
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <button
        className="sidebar-link sidebar-logout"
        onClick={() => {
          signOut();
          navigate("/");
        }}
      >
        <LogOut size={18} />
        <span>Logout</span>
      </button>
    </aside>
  );
}
