import { Calendar, Clock, Users, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsGridProps {
  stats?: {
    todayMeetings: number;
    pendingBookings: number;
    activeTeams: number;
    syncedCalendars: number;
  };
  isLoading: boolean;
}

export default function StatsGrid({ stats, isLoading }: StatsGridProps) {
  const statItems = [
    {
      name: "Today's Meetings",
      value: stats?.todayMeetings || 0,
      icon: Calendar,
      color: "text-primary",
    },
    {
      name: "Pending Bookings",
      value: stats?.pendingBookings || 0,
      icon: Clock,
      color: "text-warning-500",
    },
    {
      name: "Active Teams",
      value: stats?.activeTeams || 0,
      icon: Users,
      color: "text-success-500",
    },
    {
      name: "Synced Calendars",
      value: stats?.syncedCalendars || 0,
      icon: RefreshCw,
      color: "text-primary",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="flex items-center">
                <Skeleton className="h-8 w-8 rounded" />
                <div className="ml-5 w-0 flex-1">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-6 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {statItems.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.name} className="card-shadow">
            <CardContent className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Icon className={`h-8 w-8 ${item.color}`} />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    {item.name}
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {item.value}
                  </dd>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
