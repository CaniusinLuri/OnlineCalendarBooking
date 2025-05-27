import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Layout from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Clock, Shield, Bell, Link, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import TwoFactorSetup from "@/components/modals/two-factor-setup";

export default function Settings() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [is2FAOpen, setIs2FAOpen] = useState(false);

  const updateUserMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/users/${user?.id}`, data);
      return response.json();
    },
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
      toast({
        title: "Settings updated",
        description: "Your settings have been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleProfileUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    updateUserMutation.mutate(data);
  };

  const handleAvailabilityUpdate = (dayIndex: number, field: string, value: any) => {
    // Handle availability updates
    console.log("Update availability:", { dayIndex, field, value });
  };

  const handleNotificationToggle = (setting: string, enabled: boolean) => {
    updateUserMutation.mutate({ [setting]: enabled });
  };

  const weekDays = [
    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
  ];

  const defaultAvailability = weekDays.map((day, index) => ({
    day,
    enabled: index >= 1 && index <= 5, // Mon-Fri
    startTime: "09:00",
    endTime: "17:00",
  }));

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage your account and preferences</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="availability" className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Availability</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Security</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center space-x-2">
              <Bell className="h-4 w-4" />
              <span>Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center space-x-2">
              <Link className="h-4 w-4" />
              <span>Integrations</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information and profile settings.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  {/* Avatar */}
                  <div className="flex items-center space-x-6">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={user?.profileImage || ""} alt={user?.name || ""} />
                      <AvatarFallback className="text-lg">
                        {user?.name?.split(" ").map(n => n[0]).join("").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <Button type="button" variant="outline">
                        Change Photo
                      </Button>
                      <p className="text-sm text-gray-500 mt-2">
                        JPG, GIF or PNG. 1MB max.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        name="name"
                        defaultValue={user?.name}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        defaultValue={user?.email}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="alias">Username Alias</Label>
                      <Input
                        id="alias"
                        name="alias"
                        defaultValue={user?.alias || ""}
                        placeholder="your-username"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Used in your public booking URLs
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select name="timezone" defaultValue={user?.timezone}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="America/New_York">Eastern Time</SelectItem>
                          <SelectItem value="America/Chicago">Central Time</SelectItem>
                          <SelectItem value="America/Denver">Mountain Time</SelectItem>
                          <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="profileDescription">Bio</Label>
                    <textarea
                      id="profileDescription"
                      name="profileDescription"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      defaultValue={user?.profileDescription || ""}
                      placeholder="Tell others about yourself..."
                    />
                  </div>

                  <Button type="submit" disabled={updateUserMutation.isPending}>
                    {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Availability Tab */}
          <TabsContent value="availability" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Working Hours</CardTitle>
                <CardDescription>
                  Set your available hours for each day of the week.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {defaultAvailability.map((dayAvail, index) => (
                  <div key={dayAvail.day} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="w-24">
                      <Label className="font-medium">{dayAvail.day}</Label>
                    </div>
                    <Switch
                      checked={dayAvail.enabled}
                      onCheckedChange={(checked) => 
                        handleAvailabilityUpdate(index, "enabled", checked)
                      }
                    />
                    {dayAvail.enabled && (
                      <>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="time"
                            value={dayAvail.startTime}
                            onChange={(e) => 
                              handleAvailabilityUpdate(index, "startTime", e.target.value)
                            }
                            className="w-32"
                          />
                          <span>to</span>
                          <Input
                            type="time"
                            value={dayAvail.endTime}
                            onChange={(e) => 
                              handleAvailabilityUpdate(index, "endTime", e.target.value)
                            }
                            className="w-32"
                          />
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Security</CardTitle>
                <CardDescription>
                  Manage your password and two-factor authentication.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Password Section */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Password</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        placeholder="Enter current password"
                      />
                    </div>
                    <div>
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="Enter new password"
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm new password"
                      />
                    </div>
                    <Button>Update Password</Button>
                  </div>
                </div>

                <Separator />

                {/* Two-Factor Authentication */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Two-Factor Authentication</h3>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">2FA Status</h4>
                        {user?.twoFactorEnabled ? (
                          <Badge variant="default" className="bg-success-500">Enabled</Badge>
                        ) : (
                          <Badge variant="secondary">Disabled</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {user?.twoFactorEnabled
                          ? "Your account is protected with 2FA"
                          : "Add an extra layer of security to your account"
                        }
                      </p>
                    </div>
                    <Button
                      onClick={() => setIs2FAOpen(true)}
                      variant={user?.twoFactorEnabled ? "outline" : "default"}
                    >
                      {user?.twoFactorEnabled ? "Manage 2FA" : "Enable 2FA"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Notifications</CardTitle>
                <CardDescription>
                  Choose what email notifications you'd like to receive.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Daily Agenda</h4>
                    <p className="text-sm text-gray-500">
                      Receive a daily email with your upcoming meetings
                    </p>
                  </div>
                  <Switch
                    checked={user?.receiveAgendaEmail}
                    onCheckedChange={(checked) => 
                      handleNotificationToggle("receiveAgendaEmail", checked)
                    }
                  />
                </div>

                {user?.receiveAgendaEmail && (
                  <div className="ml-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Label htmlFor="agendaTime">Daily agenda time</Label>
                    <Select
                      value={user?.agendaEmailTime}
                      onValueChange={(value) => updateUserMutation.mutate({ agendaEmailTime: value })}
                    >
                      <SelectTrigger className="w-48 mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="07:00">7:00 AM</SelectItem>
                        <SelectItem value="08:00">8:00 AM</SelectItem>
                        <SelectItem value="09:00">9:00 AM</SelectItem>
                        <SelectItem value="10:00">10:00 AM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Booking Confirmations</h4>
                    <p className="text-sm text-gray-500">
                      Get notified when someone books a meeting with you
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Calendar Sync Alerts</h4>
                    <p className="text-sm text-gray-500">
                      Receive alerts when calendar sync fails or needs attention
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Calendar Integrations</CardTitle>
                <CardDescription>
                  Connect your external calendars to sync your availability.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Google Calendar */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Google Calendar</h4>
                      <p className="text-sm text-gray-500">Sync with your Google Calendar</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="default" className="bg-success-500">Connected</Badge>
                    <Button variant="outline" size="sm">
                      Disconnect
                    </Button>
                  </div>
                </div>

                {/* Microsoft Outlook */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Microsoft Outlook</h4>
                      <p className="text-sm text-gray-500">Sync with your Outlook calendar</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Connect
                  </Button>
                </div>

                {/* Apple Calendar */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Apple Calendar</h4>
                      <p className="text-sm text-gray-500">Sync with your Apple Calendar via CalDAV</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Connect
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 2FA Setup Modal */}
        <TwoFactorSetup open={is2FAOpen} onOpenChange={setIs2FAOpen} />
      </div>
    </Layout>
  );
}
