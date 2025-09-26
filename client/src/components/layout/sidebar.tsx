import { Link, useLocation } from 'wouter';
import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useSettings } from '@/contexts/settings-context';
import { useT } from '@/hooks/use-translation';
import { useFeedbackNotifications } from '@/hooks/use-feedback-notifications';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  MessageCircle, 
  List, 
  Users, 
  Bot, 
  FileBarChart, 
  Settings,
  LogOut,
  TrendingUp,
  Building2,
  AlertCircle,
  MessageSquare,
  DollarSign,
  Bell,
  MessageSquare,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  Layers
} from 'lucide-react';

const getNavigationItems = (userRole: string) => [
  {
    sectionKey: 'navigation.main',
    items: [
      { nameKey: 'navigation.conversations', href: '/conversations', icon: MessageCircle },
      { nameKey: 'navigation.tickets', href: '/tickets', icon: AlertCircle },
      { nameKey: 'navigation.clients', href: '/clients', icon: Users },
      { nameKey: 'navigation.dashboard', href: '/', icon: BarChart3 },
      { nameKey: 'navigation.reports', href: '/enhanced-reports', icon: TrendingUp },
    ]
  },
  {
    sectionKey: 'navigation.management',
    items: [
      { nameKey: 'navigation.users', href: '/users', icon: Users, adminOnly: true },
      { nameKey: 'navigation.queues', href: '/queues', icon: Layers, adminOnly: true },
      { nameKey: 'navigation.chatbots', href: '/chatbots', icon: Bot, adminOnly: true },
      { nameKey: 'navigation.chatBot', href: '/ai-agent', icon: Bot },
      { nameKey: 'navigation.whatsapp', href: '/whatsapp-settings', icon: Smartphone },
      { nameKey: 'navigation.financeiro', href: '/financeiro', icon: DollarSign },
      { nameKey: 'navigation.settings', href: '/settings', icon: Settings },
    ]
  },
  {
    sectionKey: 'navigation.administration',
    items: [
      { nameKey: 'navigation.announcements', href: '/announcements', icon: Bell, superadminOnly: true },
      { nameKey: 'navigation.admin', href: '/admin', icon: Building2, superadminOnly: true },
    ]
  }
];

export default function Sidebar() {
  const [location] = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const { t } = useT();
  const { shouldShowNotifications, pendingCount } = useFeedbackNotifications();

  const companyLogo = (user as any)?.company?.logoUrl as string | undefined;
  const logoSrc = companyLogo || '/logo.svg';

  const navigationItems = getNavigationItems(user?.role || 'agent');

  const handleLogout = () => {
    if (window.confirm(t('auth.logoutConfirm'))) {
      logout();
    }
  };

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300`}>
      {/* Toggle Button */}
      <div className="p-2 border-b border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full justify-center"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Company Header */}
      <div className={`${isCollapsed ? 'p-2' : 'p-6'} border-b border-sidebar-border`}>
        <div className="flex items-center justify-center">
          <img src={logoSrc} alt="Fi.V App" className={`${isCollapsed ? 'h-8 w-8' : 'h-12 w-auto'} transition-all duration-300`} />
        </div>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 ${isCollapsed ? 'p-2' : 'p-4'} space-y-6 sidebar-nav`}>
        {navigationItems.map((section) => (
          <div key={section.sectionKey}>
            {!isCollapsed && (
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {t(section.sectionKey)}
              </p>
            )}
            {section.items
              .filter((item) => {
                // Filter out admin-only items for non-admin/superadmin users
                if ('adminOnly' in item && item.adminOnly && user?.role !== 'admin' && user?.role !== 'superadmin') {
                  return false;
                }
                // Filter out superadmin-only items for non-superadmin users
                if ('superadminOnly' in item && item.superadminOnly && user?.role !== 'superadmin') {
                  return false;
                }
                return true;
              })
              .map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href || 
                (item.href !== '/' && location.startsWith(item.href));
              const itemName = t(item.nameKey);
              
              return (
                <Link
                  key={item.nameKey}
                  href={item.href}
                  className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-between px-3'} py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${
                    isActive 
                      ? 'active bg-sidebar-primary text-sidebar-primary-foreground shadow-sm' 
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:translate-x-1'
                  }`}
                  data-testid={`link-${(itemName || '').toLowerCase().replace(/\s+/g, '-')}`}
                  title={isCollapsed ? itemName : undefined}
                >
                  <div className={`flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
                    <Icon className={`${isCollapsed ? 'w-5 h-5' : 'mr-3 w-5 h-5'} transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
                    {!isCollapsed && itemName}
                  </div>
                  {item.href === '/feedback' && shouldShowNotifications && pendingCount > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] h-5 flex items-center justify-center">
                      {pendingCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Profile Section */}
      <div className={`${isCollapsed ? 'p-2' : 'p-4'} border-t border-sidebar-border`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} ${isCollapsed ? '' : 'mb-3'}`}>
          <div className="w-8 h-8 bg-sidebar-primary rounded-full flex items-center justify-center">
            <span className="text-sidebar-primary-foreground text-sm font-medium" data-testid="text-user-initials">
              {user?.initials}
            </span>
          </div>
          {!isCollapsed && (
            <div>
              <p className="text-sm font-medium text-sidebar-foreground" data-testid="text-user-name">
                {user?.name}
              </p>
              <p className="text-xs text-muted-foreground" data-testid="text-user-role">
                {user?.role === 'admin' ? t('users.admin') :
                 user?.role === 'supervisor' ? t('users.supervisor') :
                 user?.role === 'superadmin' ? 'Superadmin' : t('users.agent')}
              </p>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className={`w-full ${isCollapsed ? 'justify-center px-2' : 'justify-start px-3'} py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent`}
          data-testid="button-logout"
          title={isCollapsed ? t('common.logout') : undefined}
        >
          <LogOut className={`${isCollapsed ? 'h-4 w-4' : 'mr-2 h-4 w-4'}`} />
          {!isCollapsed && t('common.logout')}
        </Button>
      </div>
    </div>
  );
}
