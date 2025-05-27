import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout/layout";
import StatsGrid from "@/components/dashboard/stats-grid";
import CalendarWidget from "@/components/dashboard/calendar-widget";
import QuickActions from "@/components/dashboard/quick-actions";
import IntegrationsStatus from "@/components/dashboard/integrations-status";
import RecentBookings from "@/components/dashboard/recent-bookings";
import BookingPageManagement from "@/components/dashboard/booking-page-management";
import { useAuth } from "@/hooks/use-auth";

export default function Dashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: bookingPages, isLoading: bookingPagesLoading } = useQuery({
    queryKey: ["/api/booking-pages"],
  });

  const { data: meetings, isLoading: meetingsLoading } = useQuery({
    queryKey: ["/api/meetings"],
  });

  return (
    <Layout>
      {/* Page Header */}
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl sm:truncate">
            Welcome back, <span className="text-primary">{user?.name}</span>
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Here's what's happening with your calendars today
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
          <button className="btn-secondary">
            <i className="fas fa-plus mr-2"></i>
            New Meeting
          </button>
          <button className="btn-primary">
            <i className="fas fa-calendar-plus mr-2"></i>
            Create Calendar
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <StatsGrid stats={stats} isLoading={statsLoading} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Calendar View */}
        <div className="lg:col-span-2">
          <CalendarWidget meetings={meetings} isLoading={meetingsLoading} />
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <QuickActions />
          <IntegrationsStatus />
          <RecentBookings />
        </div>
      </div>

      {/* Booking Pages Section */}
      <div className="mt-8">
        <BookingPageManagement bookingPages={bookingPages} isLoading={bookingPagesLoading} />
      </div>
    </Layout>
  );
}
