import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Link, RefreshCw, Calendar, Users, Settings } from "lucide-react";
import MeetingCreationModal from "@/components/modals/meeting-creation";

export default function QuickActions() {
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);

  const quickActions = [
    {
      icon: Plus,
      label: "Schedule Meeting",
      description: "Create a new meeting",
      action: () => setIsMeetingModalOpen(true),
      primary: true,
    },
    {
      icon: Link,
      label: "Share Booking Link",
      description: "Copy your booking URL",
      action: () => {
        // TODO: Get actual user booking link
        const bookingUrl = "https://smartcal.one/username.work";
        navigator.clipboard.writeText(bookingUrl);
        // Could show a toast here
      },
    },
    {
      icon: RefreshCw,
      label: "Sync Calendars",
      description: "Update calendar data",
      action: () => {
        // TODO: Trigger calendar sync
        console.log("Syncing calendars...");
      },
    },
    {
      icon: Calendar,
      label: "New Calendar",
      description: "Add a calendar",
      action: () => {
        window.location.href = "/calendars";
      },
    },
    {
      icon: Users,
      label: "Create Team",
      description: "Manage team groups",
      action: () => {
        window.location.href = "/teams";
      },
    },
    {
      icon: Settings,
      label: "Settings",
      description: "Account preferences",
      action: () => {
        window.location.href = "/settings";
      },
    },
  ];

  return (
    <>
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            
            return (
              <Button
                key={action.label}
                variant={action.primary ? "default" : "outline"}
                className="w-full justify-start h-auto p-3"
                onClick={action.action}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <div className="text-left">
                    <div className="font-medium">{action.label}</div>
                    <div className="text-xs opacity-75">{action.description}</div>
                  </div>
                </div>
              </Button>
            );
          })}
        </CardContent>
      </Card>

      <MeetingCreationModal
        open={isMeetingModalOpen}
        onOpenChange={setIsMeetingModalOpen}
      />
    </>
  );
}
