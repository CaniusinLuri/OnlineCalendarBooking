import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Calendar, Video, MapPin, Clock } from "lucide-react";
import { formatTime, getCurrentWeekDates, isToday } from "@/lib/utils";
import { type Meeting } from "@shared/schema";

interface CalendarWidgetProps {
  meetings?: Meeting[];
  isLoading: boolean;
}

export default function CalendarWidget({ meetings, isLoading }: CalendarWidgetProps) {
  const [currentWeek, setCurrentWeek] = useState(getCurrentWeekDates());

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = currentWeek.map(date => {
      const newDate = new Date(date);
      newDate.setDate(date.getDate() + (direction === 'next' ? 7 : -7));
      return newDate;
    });
    setCurrentWeek(newWeek);
  };

  const getWeekRange = () => {
    const start = currentWeek[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const end = currentWeek[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${start} - ${end}`;
  };

  const getTodaysMeetings = () => {
    if (!meetings) return [];
    
    const today = new Date();
    return meetings.filter(meeting => {
      const meetingDate = new Date(meeting.startTime);
      return meetingDate.toDateString() === today.toDateString();
    }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  };

  const getMeetingTypeIcon = (meeting: Meeting) => {
    if (meeting.meetingType === "in_person") {
      return <MapPin className="h-4 w-4 text-blue-600" />;
    }
    return <Video className="h-4 w-4 text-success-500" />;
  };

  const getMeetingTypeBadge = (meeting: Meeting) => {
    if (meeting.meetingType === "in_person") {
      return (
        <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50">
          <MapPin className="h-3 w-3 mr-1" />
          In-person
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-success-600 border-success-300 bg-success-50">
        <Video className="h-3 w-3 mr-1" />
        Virtual
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card className="card-shadow">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-24" />
            <div className="flex items-center space-x-2">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="bg-white p-2 text-center">
                <Skeleton className="h-4 w-8 mx-auto mb-2" />
                <Skeleton className="h-6 w-6 mx-auto" />
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const todaysMeetings = getTodaysMeetings();

  return (
    <Card className="card-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-primary" />
            <span>This Week</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={() => navigateWeek('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[140px] text-center">
              {getWeekRange()}
            </span>
            <Button variant="ghost" size="sm" onClick={() => navigateWeek('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Week Calendar Grid */}
        <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
          {currentWeek.map((date, index) => {
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const dayNumber = date.getDate();
            const isCurrentDay = isToday(date);
            
            return (
              <div
                key={index}
                className={`p-3 text-center transition-colors ${
                  isCurrentDay
                    ? "bg-primary text-primary-foreground"
                    : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <div className="text-xs font-medium uppercase opacity-75">
                  {dayName}
                </div>
                <div className="text-lg font-semibold mt-1">
                  {dayNumber}
                </div>
              </div>
            );
          })}
        </div>

        {/* Today's Schedule */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Today's Schedule
          </h3>
          
          {todaysMeetings.length > 0 ? (
            <div className="space-y-3">
              {todaysMeetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400 min-w-[60px]">
                      {formatTime(meeting.startTime)}
                    </div>
                    <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0"></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {meeting.title}
                      </div>
                      {meeting.description && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {meeting.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getMeetingTypeBadge(meeting)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No meetings scheduled for today
              </p>
              <Button variant="outline" size="sm" className="mt-2">
                Schedule a meeting
              </Button>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {meetings?.length || 0}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              This Week
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {todaysMeetings.length}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Today
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
