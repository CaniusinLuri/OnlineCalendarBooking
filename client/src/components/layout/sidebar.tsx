import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { isSuperAdmin } from "@/lib/auth";
import {
  Home,
  Calendar,
  Clock,
  Link as LinkIcon,
  Users,
  RefreshCw,
  UserCog,
  Shield,
  Ban,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigationItems = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "My Calendars", href: "/calendars", icon: Calendar },
  { name: "Availability", href: "/settings", icon: Clock },
  { name: "Booking Pages", href: "/bookings", icon: LinkIcon },
  { name: "Meeting", href: "/teams", icon: Users },
  { name: "Integrations", href: "/integrations", icon: RefreshCw },
];

const adminItems = [
  { name: "User Management", href: "/admin/users", icon: UserCog },
  { name: "Security", href: "/admin/security", icon: Shield },
  { name: "Alias Blacklist", href: "/admin/blacklist", icon: Ban },
];

interface SidebarItemProps {
  item: { name: string; href: string; icon: any };
  isActive: boolean;
}

function SidebarItem({ item, isActive }: SidebarItemProps) {
  const Icon = item.icon;

  return (
    <Link href={item.href}>
      <div
        className={cn(
          "sidebar-item",
          isActive ? "sidebar-item-active" : "sidebar-item-inactive"
        )}
      >
        <Icon className="mr-3 h-5 w-5" />
        {item.name}
      </div>
    </Link>
  );
}

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const isUserSuperAdmin = isSuperAdmin(user);

  return (
    <aside className="hidden lg:flex lg:flex-shrink-0">
      <div className="flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <nav className="mt-5 flex-1 px-2 space-y-1">
            {/* Main navigation */}
            {navigationItems.map((item) => (
              <SidebarItem
                key={item.name}
                item={item}
                isActive={location.startsWith(item.href) && (location === item.href || item.href !== '/')}
              />
            ))}

            {/* Super Admin section */}
            {isUserSuperAdmin && (
              <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="px-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                  Admin
                </p>
                <div className="mt-1 space-y-1">
                  {adminItems.map((item) => (
                    <SidebarItem
                      key={item.name}
                      item={item}
                      isActive={location.startsWith(item.href) && (location === item.href || item.href !== '/')}
                    />
                  ))}
                </div>
              </div>
            )}
          </nav>
        </div>
      </div>
    </aside>
  );
}
