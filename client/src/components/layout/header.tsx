import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Bell, ChevronDown, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function Header() {
  const { user, logout } = useAuth();
  const [notificationCount] = useState(3); // Mock notification count

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Calendar className="h-8 w-8 text-primary mr-3" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">SmartCal</h1>
            </div>
          </div>

          {/* Navigation - Hidden on mobile, shown on desktop */}
          <nav className="hidden md:flex md:space-x-8">
            <a
              href="/dashboard"
              className="text-primary border-b-2 border-primary px-1 pt-1 pb-4 text-sm font-medium"
            >
              Dashboard
            </a>
            <a
              href="/calendars"
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 px-1 pt-1 pb-4 text-sm font-medium"
            >
              Calendars
            </a>
            <a
              href="/bookings"
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 px-1 pt-1 pb-4 text-sm font-medium"
            >
              Bookings
            </a>
            <a
              href="/teams"
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 px-1 pt-1 pb-4 text-sm font-medium"
            >
              Teams
            </a>
            <a
              href="/settings"
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 px-1 pt-1 pb-4 text-sm font-medium"
            >
              Settings
            </a>
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              {notificationCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {notificationCount}
                </Badge>
              )}
            </Button>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.profileImage || ""} alt={user?.name || ""} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(user?.name || "U")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:block text-gray-700 dark:text-gray-300 font-medium">
                    {user?.name}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <a href="/settings">Profile Settings</a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="/settings">Account Settings</a>
                </DropdownMenuItem>
                {user?.role === "super_admin" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <a href="/admin/users">User Management</a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a href="/admin/security">Security</a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a href="/admin/blacklist">Alias Blacklist</a>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-600 dark:text-red-400">
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
