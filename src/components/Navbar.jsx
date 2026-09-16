import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { ShieldCheck, Menu, X, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/", label: "Home" },
  { to: "/verify", label: "Verify document" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/history", label: "History" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-brand" onClick={() => setOpen(false)}>
          <ShieldCheck size={22} strokeWidth={2.2} />
          <span>VeriGate</span>
        </Link>

        <nav className="navbar-links navbar-links-desktop">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => "navbar-link" + (isActive ? " active" : "")}
              end={l.to === "/"}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="navbar-actions navbar-links-desktop">
          {isAuthenticated ? (
            <>
              <Link to="/profile" className="row-8 navbar-profile">
                <User size={16} /> {user?.name || "Account"}
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">Log in</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Sign up</Link>
            </>
          )}
        </div>

        <button className="navbar-burger" aria-label="Toggle menu" onClick={() => setOpen((o) => !o)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="navbar-mobile-panel">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className="navbar-mobile-link" onClick={() => setOpen(false)} end={l.to === "/"}>
              {l.label}
            </NavLink>
          ))}
          <div className="navbar-mobile-divider" />
          {isAuthenticated ? (
            <Link to="/profile" className="navbar-mobile-link" onClick={() => setOpen(false)}>Profile</Link>
          ) : (
            <>
              <Link to="/login" className="navbar-mobile-link" onClick={() => setOpen(false)}>Log in</Link>
              <Link to="/register" className="navbar-mobile-link" onClick={() => setOpen(false)}>Sign up</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
