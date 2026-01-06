import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    Menu,
    X,
    User,
    LogOut,
    Plus,
    Settings,
    ChevronRight
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { cn } from '../../lib/utils';

const navigation = {
    participant: [
        { name: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
        { name: 'Browse', href: '/hackathons', icon: 'Trophy' },
        { name: 'Teams', href: '/my/teams', icon: 'Users' },
        { name: 'Submissions', href: '/my/submissions', icon: 'FileText' },
    ],
    judge: [
        { name: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
        { name: 'Browse', href: '/hackathons', icon: 'Trophy' },
        { name: 'Evaluations', href: '/my/evaluations', icon: 'BarChart3' },
        { name: 'Teams', href: '/my/teams', icon: 'Users' },
        { name: 'Submissions', href: '/my/submissions', icon: 'FileText' },
    ],
    organizer: [
        { name: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
        { name: 'Browse', href: '/hackathons', icon: 'Trophy' },
        { name: 'My Hackathons', href: '/my/hackathons', icon: 'Trophy' },
        { name: 'Teams', href: '/my/teams', icon: 'Users' },
        { name: 'Submissions', href: '/my/submissions', icon: 'FileText' },
    ],
    admin: [
        { name: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
        { name: 'Browse', href: '/hackathons', icon: 'Trophy' },
        { name: 'My Hackathons', href: '/my/hackathons', icon: 'Trophy' },
        { name: 'Evaluations', href: '/my/evaluations', icon: 'BarChart3' },
        { name: 'Users', href: '/admin/users', icon: 'Users' },
        { name: 'Audit Logs', href: '/admin/audit', icon: 'Shield' },
    ],
};

// Import icons dynamically or mapping
import {
    LayoutDashboard,
    Trophy,
    Users,
    FileText,
    BarChart3,
    Shield
} from 'lucide-react';

const iconMap = {
    LayoutDashboard,
    Trophy,
    Users,
    FileText,
    BarChart3,
    Shield
};

function BottomNav() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

    const userNavigation = navigation[user?.role] || navigation.participant;
    const primaryItems = userNavigation.slice(0, 4);
    const secondaryItems = userNavigation.slice(4);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="sm:hidden">
            {/* Bottom Navigation Bar */}
            <nav className="fixed bottom-0 left-0 right-0 z-40 bg-primary border-t border-border safe-area-bottom shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
                <div className="flex h-16 items-center justify-around px-2">
                    {primaryItems.map((item) => {
                        const Icon = iconMap[item.icon];
                        const isActive = location.pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                to={item.href}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all active:scale-95",
                                    isActive ? "text-secondary" : "text-muted-foreground"
                                )}
                            >
                                <Icon size={20} className={cn("transition-colors", isActive && "stroke-[2.5px]")} />
                                <span className="text-[10px] font-medium truncate w-full text-center">
                                    {item.name}
                                </span>
                            </Link>
                        );
                    })}

                    {/* More Menu Trigger */}
                    <button
                        onClick={() => setIsMoreMenuOpen(true)}
                        className={cn(
                            "flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all active:scale-95",
                            isMoreMenuOpen ? "text-secondary" : "text-muted-foreground"
                        )}
                    >
                        <Menu size={20} />
                        <span className="text-[10px] font-medium">More</span>
                    </button>
                </div>
            </nav>

            {/* More Menu Backdrop */}
            {isMoreMenuOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200"
                    onClick={() => setIsMoreMenuOpen(false)}
                />
            )}

            {/* More Menu Sheet */}
            <div className={cn(
                "fixed inset-x-0 bottom-0 z-50 bg-primary rounded-t-2xl shadow-2xl safe-area-bottom transition-transform duration-300 ease-out transform",
                isMoreMenuOpen ? "translate-y-0" : "translate-y-full"
            )}>
                <div className="w-12 h-1.5 bg-muted rounded-full mx-auto my-3" onClick={() => setIsMoreMenuOpen(false)} />

                <div className="px-4 pb-8 space-y-2 max-h-[70vh] overflow-y-auto">
                    <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl mb-4">
                        {user?.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full object-cover shadow-sm" />
                        ) : (
                            <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center">
                                <User size={24} className="text-secondary" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground truncate">{user?.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                        </div>
                    </div>

                    <div className="space-y-1">
                        {secondaryItems.map((item) => {
                            const Icon = iconMap[item.icon];
                            return (
                                <Link
                                    key={item.href}
                                    to={item.href}
                                    onClick={() => setIsMoreMenuOpen(false)}
                                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted active:bg-muted transition-colors"
                                >
                                    <Icon size={18} className="text-muted-foreground" />
                                    <span className="text-sm font-medium flex-1">{item.name}</span>
                                    <ChevronRight size={16} className="text-muted-foreground/50" />
                                </Link>
                            );
                        })}

                        {(user?.role === 'organizer' || user?.role === 'admin') && (
                            <button
                                onClick={() => {
                                    navigate('/hackathons/create');
                                    setIsMoreMenuOpen(false);
                                }}
                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted active:bg-muted transition-colors w-full text-left"
                            >
                                <div className="p-1 bg-secondary/10 rounded-md">
                                    <Plus size={18} className="text-secondary" />
                                </div>
                                <span className="text-sm font-medium flex-1 text-secondary">Create Hackathon</span>
                            </button>
                        )}

                        <Link
                            to="/profile"
                            onClick={() => setIsMoreMenuOpen(false)}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted active:bg-muted transition-colors"
                        >
                            <Settings size={18} className="text-muted-foreground" />
                            <span className="text-sm font-medium flex-1">Profile Settings</span>
                        </Link>

                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-error/5 active:bg-error/10 transition-colors w-full text-left text-error mt-4"
                        >
                            <LogOut size={18} />
                            <span className="text-sm font-medium flex-1">Logout</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default BottomNav;
