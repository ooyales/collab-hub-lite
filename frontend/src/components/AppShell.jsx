import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useIsMobile } from '../hooks/useIsMobile';
import { apiGet, apiPut } from '../hooks/useApi';
import {
  Home, Package, CheckSquare, BookOpen, FileText, Upload,
  BarChart3, Clock, DollarSign, Target, Layers, Building2,
  Bell, LogOut, Menu, X, ChevronLeft, ChevronRight
} from 'lucide-react';

const navItems = [
  { label: 'Home', path: '/', icon: Home },
  { label: 'Assets', path: '/assets', icon: Package },
  { label: 'My Tasks', path: '/tasks', icon: CheckSquare },
  { label: 'Journal Feed', path: '/journals', icon: BookOpen },
  { label: 'Documents', path: '/documents', icon: FileText },
  { label: 'Upload Document', path: '/upload', icon: Upload },
  { type: 'divider', label: 'Analytics' },
  { label: 'Executive Summary', path: '/dashboard/executive', icon: BarChart3 },
  { label: 'Renewal Management', path: '/dashboard/renewals', icon: Clock },
  { label: 'Budget Analysis', path: '/dashboard/budget', icon: DollarSign },
  { label: 'Task Performance', path: '/dashboard/tasks', icon: Target },
  { label: 'Consolidation', path: '/dashboard/consolidation', icon: Layers },
  { label: 'Dept Scorecard', path: '/dashboard/departments', icon: Building2 },
];

export default function AppShell() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [collapsed, setCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location.pathname, isMobile]);

  useEffect(() => {
    apiGet('/notifications/count').then(d => setUnreadCount(d.unread_count)).catch(() => {});
    const interval = setInterval(() => {
      apiGet('/notifications/count').then(d => setUnreadCount(d.unread_count)).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    const data = await apiGet('/notifications');
    setNotifications(data);
    setShowNotifications(true);
  };

  const markAllRead = async () => {
    await apiPut('/notifications/read-all', {});
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const sidebarWidth = collapsed && !isMobile ? 'w-16' : 'w-60';

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      {(sidebarOpen || !isMobile) && (
        <>
          {isMobile && sidebarOpen && (
            <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />
          )}
          <aside className={`${isMobile ? 'fixed z-50 h-full' : 'relative'} ${sidebarWidth} bg-[var(--eaw-sidebar)] text-white flex flex-col transition-all duration-200`}>
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              {(!collapsed || isMobile) && <span className="font-bold text-sm">Collab Hub</span>}
              {isMobile ? (
                <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-white">
                  <X size={20} />
                </button>
              ) : (
                <button onClick={() => setCollapsed(!collapsed)} className="text-slate-400 hover:text-white">
                  {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
              )}
            </div>
            <nav className="flex-1 overflow-y-auto py-2">
              {navItems.map((item, i) => {
                if (item.type === 'divider') {
                  return (!collapsed || isMobile) ? (
                    <div key={i} className="px-4 pt-4 pb-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      {item.label}
                    </div>
                  ) : <div key={i} className="border-t border-slate-700 my-2 mx-2" />;
                }
                const Icon = item.icon;
                const active = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                      active ? 'bg-[var(--eaw-primary)] text-white' : 'text-slate-300 hover:bg-[var(--eaw-sidebar-hover)] hover:text-white'
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon size={18} className="shrink-0" />
                    {(!collapsed || isMobile) && <span>{item.label}</span>}
                  </button>
                );
              })}
            </nav>
          </aside>
        </>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <header className="bg-[var(--eaw-navbar)] text-white flex items-center justify-between px-4 h-12 shrink-0">
          <div className="flex items-center gap-3">
            {isMobile && (
              <button onClick={() => setSidebarOpen(true)} className="text-slate-300 hover:text-white">
                <Menu size={20} />
              </button>
            )}
            <span className="text-sm font-medium text-slate-300">Collaboration Hub</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button onClick={loadNotifications} className="relative text-slate-300 hover:text-white p-1">
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                  <div className="absolute right-0 top-8 w-80 max-h-96 bg-white text-slate-800 rounded-lg shadow-xl z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 border-b bg-slate-50">
                      <span className="text-sm font-semibold">Notifications</span>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">Mark all read</button>
                      )}
                    </div>
                    <div className="overflow-y-auto max-h-80">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-slate-400">No notifications</div>
                      ) : notifications.slice(0, 15).map(n => (
                        <div key={n.id} className={`px-3 py-2 border-b text-sm ${n.is_read ? 'bg-white' : 'bg-blue-50'}`}>
                          <div className="flex items-start gap-2">
                            <span className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                              n.notification_type === 'critical' ? 'bg-red-500' :
                              n.notification_type === 'warning' ? 'bg-yellow-500' :
                              n.notification_type === 'success' ? 'bg-green-500' : 'bg-blue-500'
                            }`} />
                            <div>
                              <div className="font-medium text-xs">{n.title}</div>
                              <div className="text-xs text-slate-500 mt-0.5">{n.message}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
            <span className="text-xs text-slate-400">{user?.display_name}</span>
            <button onClick={logout} className="text-slate-400 hover:text-white" title="Sign Out">
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
