import DashboardBody from "./DashboardBody.jsx";
import LoginModal from "../components/LoginModal.jsx";
import { useAuth } from "../lib/auth.jsx";

export default function AttendanceDashboard() {
  const { user, membership, centerId, authLoading } = useAuth();
  if (authLoading) {
    return (
      <div className="attendance-page">
        <main className="container"><div className="panel empty">Loading...</div></main>
      </div>
    );
  }
  const gated = !user || !membership;
  return (
    <>
      <div className={gated ? "gated-blur" : undefined} aria-hidden={gated || undefined}>
        <DashboardBody centerId={centerId} />
      </div>
      {gated && <LoginModal />}
    </>
  );
}
