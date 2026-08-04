import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PageTransition from './PageTransition';
import {
  DashboardIcon,
  UsersIcon,
  TransactionsIcon,
  WithdrawalsIcon,
  BookingsIcon,
  ListingsIcon,
  NotificationsIcon,
  SettingsIcon,
  LogoutIcon,
  BellIcon,
  MenuIcon,
  ChevronsLeftIcon,
  ChevronDownIcon,
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
    <div className={`flex shrink-0 items-center justify-center rounded-lg bg-white/15 font-bold text-white ${className}`}>
      A
    </div>
  );
}

export default function Layout({ title, children }) {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Close mobile drawer automatically on route change.
  const prevPath = useRef(location.pathname);
  useEffect(() => {
    if (prevPath.current !== location.pathname) {
      prevPath.current = location.pathname;
      setMobileOpen(false);
    }
  }, [location.pathname]);

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

  const dateLabel = now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  const timeLabel = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 84 : 256 }}
        transition={{ duration: 0.22, ease: 'easeInOut' }}
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-primary shadow-xl transition-transform duration-300 md:relative md:translate-x-0 md:shadow-none ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className={`flex items-center gap-2.5 px-5 py-5 ${collapsed ? 'md:justify-center md:px-0' : ''}`}>
          <LogoMark className="h-9 w-9 text-lg" />
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold leading-tight text-white">AgroChain</p>
              <p className="truncate text-xs font-medium text-white/60">Admin Console</p>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors duration-150 ${
                  collapsed ? 'md:justify-center md:px-0' : ''
                } ${
                  isActive
                    ? 'bg-primary-light text-white shadow-sm'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          ))}

          <div className="my-2 border-t border-white/10" />

          <button
            onClick={handleLogout}
            title={collapsed ? 'Settings' : undefined}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-white/70 transition-colors duration-150 hover:bg-red-500/20 hover:text-white ${
              collapsed ? 'md:justify-center md:px-0' : ''
            }`}
          >
            <SettingsIcon className="h-5 w-5 shrink-0" />
            {!collapsed && 'Settings'}
          </button>
        </nav>

        {/* Collapse toggle (desktop only) */}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="mx-3 mb-4 hidden items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold text-white/60 transition-colors hover:bg-white/10 hover:text-white md:flex"
        >
          <motion.span animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.22 }}>
            <ChevronsLeftIcon className="h-4 w-4" />
          </motion.span>
          {!collapsed && 'Collapse'}
        </button>
      </motion.aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top navbar */}
        <header className="relative z-30 flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 md:hidden"
            >
              <MenuIcon className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">{title}</h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-semibold text-gray-700">{dateLabel}</p>
              <p className="text-xs tabular-nums text-gray-400">{timeLabel}</p>
            </div>

            {/* Notification bell */}
            <div className="relative">
              <button
                onClick={() => { setBellOpen((v) => !v); setAvatarOpen(false); }}
                className="relative rounded-full p-2 text-gray-500 transition hover:bg-gray-100"
              >
                <BellIcon className="h-5 w-5" />
              </button>
              <AnimatePresence>
                {bellOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setBellOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 z-40 mt-2 w-64 rounded-xl border border-gray-100 bg-white p-4 shadow-xl"
                    >
                      <p className="text-sm font-bold text-gray-900">Notifications</p>
                      <p className="mt-2 text-xs text-gray-400">You're all caught up — no new notifications.</p>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Avatar dropdown */}
            <div className="relative">
              <button
                onClick={() => { setAvatarOpen((v) => !v); setBellOpen(false); }}
                className="flex items-center gap-2 rounded-full p-1 pr-2 transition hover:bg-gray-100"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                  {initials}
                </div>
                <ChevronDownIcon className={`h-4 w-4 text-gray-400 transition-transform ${avatarOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {avatarOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setAvatarOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 z-40 mt-2 w-56 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl"
                    >
                      <div className="border-b border-gray-100 px-4 py-3">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {admin?.fullName || admin?.name || 'Admin'}
                        </p>
                        <p className="truncate text-xs text-gray-400">{admin?.email}</p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2.5 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        <LogoutIcon className="h-4 w-4" />
                        Log Out
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
          <AnimatePresence mode="wait">
            <PageTransition key={location.pathname}>{children}</PageTransition>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
