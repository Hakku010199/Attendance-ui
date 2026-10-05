export default function AttendanceHeader({ centerName, userEmail, onSignOut }) {
  return (
    <header className="app-header">
      <div className="container header-inner">
        <div className="header-icon" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10 12 5 2 10l10 5 10-5z" />
            <path d="M6 12v5c3 2 9 2 12 0v-5" />
          </svg>
        </div>
        <div className="header-text">
          <h1>Attendance Dashboard</h1>
          <p>{centerName ? `${centerName} — mark daily student attendance` : "Mark daily student attendance"}</p>
        </div>
        {(userEmail || onSignOut) && (
          <div className="header-actions">
            {userEmail && <span className="header-user" title={userEmail}>{userEmail}</span>}
            {onSignOut && (
              <button type="button" className="btn-secondary btn-small" onClick={onSignOut}>
                Sign out
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

