import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  DashboardIcon,
  UsersIcon,
  TransactionsIcon,
  WithdrawalsIcon,
  BookingsIcon,
  ListingsIcon,
  NotificationsIcon,
  SettingsIcon,
} from './icons';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: DashboardIcon, end: true },
  { to: '/users', label: 'Users', icon: UsersIcon },
  { to: '/transactions', label: 'Transactions', icon: TransactionsIcon },
  { to: '/withdrawals', label: 'Withdrawals', icon: WithdrawalsIcon },
  { to: '/bookings', label: 'Bookings', icon: BookingsIcon },
  { to: '/listings', label: 'Listings', icon: ListingsIcon },
  { to: '/notifications', label: 'Notifications', icon: NotificationsIcon },
];

function LogoMark({ className }) {
  return (
    <div className={`flex items-center justify-center rounded-lg bg-primary text-white font-bold ${className}`}>
      A
    </div>
  );
}

export default function Layout({ title, children }) {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const initials = (admin?.fullName || admin?.name || admin?.email || 'A')
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-gray-200 bg-white md:flex">
        <div className="flex items-center gap-2.5 px-6 py-5">
          <LogoMark className="h-9 w-9 text-lg" />
          <div>
            <p className="text-sm font-extrabold leading-tight text-gray-900">AgroChain</p>
            <p className="text-xs font-medium text-gray-400">Admin Console</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                }`
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              {label}
            </NavLink>
          ))}

          <div className="my-2 border-t border-gray-100" />

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <SettingsIcon className="h-5 w-5 shrink-0" />
            Settings
          </button>
        </nav>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top navbar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-8">
          <div className="flex items-center gap-2 md:hidden">
            <LogoMark className="h-8 w-8 text-base" />
          </div>
          <h1 className="text-lg font-bold text-gray-900">{title}</h1>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold leading-tight text-gray-900">
                {admin?.fullName || admin?.name || 'Admin'}
              </p>
              <p className="text-xs text-gray-400">{admin?.email}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
              {initials}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
