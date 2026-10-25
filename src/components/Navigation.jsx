import { ProfileAvatar } from "./Account.jsx";
const paths = {
  day: (
    <>
      <rect x="4" y="5" width="16" height="16" rx="3" />
      <path d="M8 3v4m8-4v4M4 10h16m-11 5 2 2 4-4" />
    </>
  ),
  week: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M7 3v4m10-4v4M3 10h18m-13 4h2m4 0h2m-8 3h2m4 0h2" />
    </>
  ),
  month: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M7 3v4m10-4v4M3 10h18M7 14h.01M12 14h.01M17 14h.01M7 17h.01M12 17h.01M17 17h.01" />
    </>
  ),
  shopping: (
    <>
      <path d="m3 4 2 1 2 12h11l3-9H6m3 13h.01M17 21h.01" />
    </>
  ),
  tasks: (
    <>
      <path d="m3 6 2 2 3-4m3 2h10M3 13l2 2 3-4m3 2h10M3 20l2 2 3-4m3 2h10" />
    </>
  ),
  settings: (
    <>
      <path d="M4 6h16M4 12h16M4 18h16" />
      <circle cx="8" cy="6" r="2" />
      <circle cx="16" cy="12" r="2" />
      <circle cx="10" cy="18" r="2" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
    </>
  ),
};
export function NavigationIcon({ name }) {
  return (
    <svg
      className="nav-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name] || paths.user}
    </svg>
  );
}
export default function Navigation({
  pages,
  page,
  onNavigate,
  user,
  onAccount,
}) {
  return (
    <aside className="sidebar">
      <div className="brand">
        {user && (
          <button
            className="brand-profile"
            aria-label="Öppna ditt konto"
            onClick={onAccount}
          >
            <ProfileAvatar user={user} />
          </button>
        )}
        <div className="brand-mark" aria-hidden="true">
          ⌂
        </div>
        <div className="brand-copy">
          <h1>Hemma.</h1>
          <small>Vår städtavla</small>
        </div>
      </div>
      <nav className="nav" aria-label="Vyer">
        {pages.map(([key, label]) => (
          <button
            key={key}
            className={`navbtn ${page === key ? "active" : ""}`}
            aria-current={page === key ? "page" : undefined}
            onClick={() => onNavigate(key)}
          >
            <NavigationIcon name={key} />
            <span className="nav-label">{label}</span>
          </button>
        ))}
      </nav>
      <button className="account-nav" onClick={onAccount}>
        {user ? <ProfileAvatar user={user} /> : <NavigationIcon name="user" />}
        <span>{user ? user.displayName || "Mitt konto" : "Logga in"}</span>
      </button>
    </aside>
  );
}
