import { useAuth } from "../context/AuthContext";
import { UserCircle } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="app-main-inner">
      <div className="page-head">
        <h1>Profile</h1>
        <p>Your account details.</p>
      </div>

      <div className="card card-pad" style={{ maxWidth: 480, marginTop: 18 }}>
        <div className="row-12" style={{ marginBottom: 20 }}>
          <div className="profile-avatar"><UserCircle size={30} /></div>
          <div>
            <p style={{ fontWeight: 700, fontSize: "1.05rem" }}>{user?.name || "—"}</p>
            <p className="text-soft text-sm">{user?.email || "—"}</p>
          </div>
        </div>
        <dl className="meta-grid">
          <div className="meta-grid-row">
            <dt className="text-soft text-sm">Account type</dt>
            <dd>Standard</dd>
          </div>
          <div className="meta-grid-row">
            <dt className="text-soft text-sm">Member since</dt>
            <dd>{new Date().toLocaleDateString()}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
