import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { Button } from '../ui';
import {
  Trophy,
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  User,
  Bell,
  Search,
  Plus,
  BarChart3,
  Shield,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react';
import { cn } from '../../lib/utils';
import BottomNav from './BottomNav';

const navigation = {
  participant: [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Browse Hackathons', href: '/hackathons', icon: Trophy },
    { name: 'My Teams', href: '/my/teams', icon: Users },
    { name: 'My Submissions', href: '/my/submissions', icon: FileText },
  ],
  judge: [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Browse Hackathons', href: '/hackathons', icon: Trophy },
    { name: 'My Evaluations', href: '/my/evaluations', icon: BarChart3 },
    { name: 'My Teams', href: '/my/teams', icon: Users },
    { name: 'My Submissions', href: '/my/submissions', icon: FileText },
  ],
  organizer: [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Browse Hackathons', href: '/hackathons', icon: Trophy },
    { name: 'My Hackathons', href: '/my/hackathons', icon: Trophy },
    { name: 'My Teams', href: '/my/teams', icon: Users },
    { name: 'My Submissions', href: '/my/submissions', icon: FileText },
  ],
  admin: [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Browse Hackathons', href: '/hackathons', icon: Trophy },
    { name: 'My Hackathons', href: '/my/hackathons', icon: Trophy },
    { name: 'My Evaluations', href: '/my/evaluations', icon: BarChart3 },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Audit Logs', href: '/admin/audit', icon: Shield },
  ],
};

// Sidebar width constants
const SIDEBAR_WIDTH_EXPANDED = 256; // 64 * 4 = 256px (w-64)
const SIDEBAR_WIDTH_COLLAPSED = 72; // 18 * 4 = 72px (w-18)

function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isLoading, fetchCurrentUser } = useAuthStore();

  // Mobile sidebar state (overlay)
  const [mobileOpen, setMobileOpen] = useState(false);
  // Desktop sidebar collapsed state
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Fetch full user profile on mount (for avatar, etc.)
  useEffect(() => {
    if (user && !user.avatar) {
      fetchCurrentUser();
    }
  }, []);

  // Persist collapsed state
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', collapsed.toString());
  }, [collapsed]);

  // Track window width for responsive margin
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const userNavigation = navigation[user?.role] || navigation.participant;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleDisplay = (role) => {
    const roleConfig = {
      admin: { label: 'Administrator', color: 'bg-error/10 text-error' },
      organizer: { label: 'Organizer', color: 'bg-info/10 text-info' },
      judge: { label: 'Judge', color: 'bg-warning/10 text-warning' },
      participant: { label: 'Participant', color: 'bg-success/10 text-success' },
    };
    return roleConfig[role] || { label: role, color: 'bg-muted text-muted-foreground' };
  };

  const roleInfo = getRoleDisplay(user?.role);

  // Calculate sidebar width based on collapsed state
  const sidebarWidth = collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED;

  return (
    <div className="min-h-screen bg-muted/30 flex overflow-x-hidden">
      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full bg-primary border-r border-border transition-all duration-300 ease-in-out',
          // Mobile: slide in/out
          'lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        style={{ width: `${sidebarWidth}px` }}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border">
          <Link to="/dashboard" className="flex items-center gap-2 overflow-hidden">
            <div className="p-1.5 bg-secondary rounded-lg shrink-0">
              <Trophy size={20} className="text-white" />
            </div>
            <span className={cn(
              'font-bold text-foreground whitespace-nowrap transition-opacity duration-300',
              collapsed ? 'opacity-0 w-0' : 'opacity-100'
            )}>
              Hackathon Judge
            </span>
          </Link>
          {/* Mobile close button */}
          <button
            className="lg:hidden p-1 hover:bg-muted rounded"
            onClick={() => setMobileOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-2 space-y-1">
          {userNavigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? item.name : undefined}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-secondary text-white'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  collapsed && 'justify-center px-2'
                )}
              >
                <item.icon size={18} className="shrink-0" />
                <span className={cn(
                  'whitespace-nowrap transition-opacity duration-300',
                  collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
                )}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Collapse Toggle Button (Desktop only) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute top-20 -right-3 w-6 h-6 bg-primary border border-border rounded-full items-center justify-center hover:bg-muted transition-colors shadow-sm"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight size={14} className="text-muted-foreground" />
          ) : (
            <ChevronLeft size={14} className="text-muted-foreground" />
          )}
        </button>

        {/* Create Hackathon Button (for organizers/admins) */}
        {(user?.role === 'organizer' || user?.role === 'admin') && (
          <div className={cn(
            'absolute bottom-20 left-0 right-0 px-2',
            collapsed ? 'px-2' : 'px-4'
          )}>
            {collapsed ? (
              <Button
                size="icon"
                className="w-full"
                onClick={() => {
                  navigate('/hackathons/create');
                  setMobileOpen(false);
                }}
                title="Create Hackathon"
              >
                <Plus size={18} />
              </Button>
            ) : (
              <Button
                className="w-full"
                onClick={() => {
                  navigate('/hackathons/create');
                  setMobileOpen(false);
                }}
              >
                <Plus size={18} />
                Create Hackathon
              </Button>
            )}
          </div>
        )}

        {/* User Info (Sidebar Bottom) */}
        <div className={cn(
          'absolute bottom-0 left-0 right-0 p-3 border-t border-border',
          collapsed ? 'px-2' : 'p-4'
        )}>
          <Link
            to="/profile"
            onClick={() => setMobileOpen(false)}
            className={cn(
              'flex items-center gap-3 hover:opacity-80 transition-opacity',
              collapsed && 'justify-center'
            )}
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center shrink-0">
                <User size={18} className="text-secondary" />
              </div>
            )}
            <div className={cn(
              'flex-1 min-w-0 transition-opacity duration-300',
              collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
            )}>
              <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
              <span className={cn('text-xs px-2 py-0.5 rounded-full', roleInfo.color)}>
                {roleInfo.label}
              </span>
            </div>
          </Link>
        </div>
      </aside>

      <div
        className="flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out overflow-x-hidden max-w-full"
        style={{ marginLeft: isLargeScreen ? `${sidebarWidth}px` : 0 }}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 bg-primary border-b border-border shrink-0">
          <div className="h-full px-4 flex items-center justify-between gap-4">
            {/* Left Side: Toggle Buttons */}
            <div className="flex items-center gap-2">
              {/* Mobile Menu Button */}
              <button
                className="hidden sm:block lg:hidden p-2 hover:bg-muted rounded-lg"
                onClick={() => setMobileOpen(true)}
              >
                <Menu size={20} />
              </button>

              {/* Desktop Toggle Button */}
              <button
                className="hidden lg:flex p-2 hover:bg-muted rounded-lg"
                onClick={() => setCollapsed(!collapsed)}
                title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {collapsed ? (
                  <PanelLeft size={20} className="text-muted-foreground" />
                ) : (
                  <PanelLeftClose size={20} className="text-muted-foreground" />
                )}
              </button>
            </div>

            {/* Search Bar */}
            <div className="hidden sm:flex flex-1 max-w-md">
              <div className="relative w-full">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Search hackathons..."
                  className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
                />
              </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <button className="p-2 hover:bg-muted rounded-lg relative">
                <Bell size={20} className="text-muted-foreground" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-secondary rounded-full" />
              </button>

              {/* User Menu */}
              <div className="relative">
                <button
                  className="flex items-center gap-2 p-2 hover:bg-muted rounded-lg"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center">
                      <User size={16} className="text-secondary" />
                    </div>
                  )}
                  <ChevronDown size={16} className="text-muted-foreground hidden sm:block" />
                </button>

                {/* Dropdown */}
                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-primary rounded-lg border border-border shadow-lg z-50">
                      <div className="p-3 border-b border-border">
                        <p className="font-medium text-foreground">{user?.name}</p>
                        <p className="text-sm text-muted-foreground">{user?.email}</p>
                      </div>
                      <div className="p-2">
                        <Link
                          to="/profile"
                          className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Settings size={16} />
                          Profile Settings
                        </Link>
                        <button
                          onClick={handleLogout}
                          disabled={isLoading}
                          className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors w-full text-left text-error"
                        >
                          <LogOut size={16} />
                          Logout
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-20 sm:pb-8 overflow-x-hidden">
          <Outlet />
        </main>

        {/* Bottom Navigation (Mobile only) */}
        <BottomNav />
      </div>
    </div>
  );
}

export default MainLayout;
