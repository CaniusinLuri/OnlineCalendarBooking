import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, User, Eye } from "lucide-react";
import { formatDate, formatTime } from "@/lib/utils";

interface RecentBooking {
  id: number;
  visitorName?: string;
  visitorEmail: string;
  startTime: Date;
  endTime: Date;
  status: string;
  bookingPageAlias: string;
  isRegisteredUser?: boolean;
}

interface RecentBookingsProps {
  bookings?: RecentBooking[];
  isLoading?: boolean;
}

export default function RecentBookings({ bookings, isLoading }: RecentBookingsProps) {
  // Mock data for demonstration
  const mockBookings: RecentBooking[] = [
    {
      id: 1,
      visitorName: "Jane Smith",
      visitorEmail: "jane@example.com",
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
      status: "confirmed",
      bookingPageAlias: "consultation",
      isRegisteredUser: false,
    },
    {
      id: 2,
      visitorName: "Michael Johnson",
      visitorEmail: "michael@company.com",
      startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
      endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000),
      status: "confirmed",
      bookingPageAlias: "meeting",
      isRegisteredUser: true,
    },
    {
      id: 3,
      visitorEmail: "alex@startup.io",
      startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
      status: "confirmed",
      bookingPageAlias: "demo",
      isRegisteredUser: false,
    },
  ];

  const displayBookings = bookings || mockBookings;

  const getInitials = (email: string, name?: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-success-500 text-xs">Confirmed</Badge>;
      case "pending":
        return <Badge variant="outline" className="text-warning-600 border-warning-300 text-xs">Pending</Badge>;
      case "cancelled":
        return <Badge variant="destructive" className="text-xs">Cancelled</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">{status}</Badge>;
    }
  };

  const getUserIndicator = (isRegistered?: boolean) => {
    if (isRegistered) {
      return (
        <div className="h-2 w-2 rounded-full bg-success-500" title="Registered user" />
      );
    }
    return (
      <div className="h-2 w-2 rounded-full bg-gray-400" title="External user" />
    );
  };

  if (isLoading) {
    return (
      <Card className="card-shadow">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-shadow">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-primary" />
          <span>Recent Bookings</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {displayBookings.length > 0 ? (
          <div className="space-y-3">
            {displayBookings.slice(0, 5).map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="" alt={booking.visitorName || booking.visitorEmail} />
                      <AvatarFallback className="text-xs">
                        {getInitials(booking.visitorEmail, booking.visitorName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -top-1 -right-1">
                      {getUserIndicator(booking.isRegisteredUser)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {booking.visitorName || booking.visitorEmail}
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="capitalize">{booking.bookingPageAlias}</span>
                      <span>•</span>
                      <span>{formatDate(booking.startTime)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-right text-xs">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {formatTime(booking.startTime)}
                    </div>
                    {getStatusBadge(booking.status)}
                  </div>
                </div>
              </div>
            ))}
            
            {displayBookings.length > 5 && (
              <div className="pt-3 border-t">
                <Button variant="outline" className="w-full" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  View All Bookings
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <User className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No recent bookings
            </p>
            <Button variant="outline" size="sm" className="mt-2">
              Share booking link
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
