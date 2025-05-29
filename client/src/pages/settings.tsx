import { useState, useEffect } from "react";
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
import { User as UserIcon, Clock, Shield, Bell, Link, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import TwoFactorSetup from "@/components/modals/two-factor-setup";
import { type User } from "@shared/schema";
import { getStoredAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import axios from "axios";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

interface Availability {
  day: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
  dayOfWeek: number;
}

export default function Settings() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [is2FAOpen, setIs2FAOpen] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [success, setSuccess] = useState<string | undefined>(undefined);
  const [avatarFile, setAvatarFile] = useState<File | undefined>(undefined);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(undefined);
  const [availability, setAvailability] = useState<Availability[]>([
    { day: "Sunday", enabled: false, startTime: "09:00", endTime: "17:00", dayOfWeek: 0 },
    { day: "Monday", enabled: false, startTime: "09:00", endTime: "17:00", dayOfWeek: 1 },
    { day: "Tuesday", enabled: false, startTime: "09:00", endTime: "17:00", dayOfWeek: 2 },
    { day: "Wednesday", enabled: false, startTime: "09:00", endTime: "17:00", dayOfWeek: 3 },
    { day: "Thursday", enabled: false, startTime: "09:00", endTime: "17:00", dayOfWeek: 4 },
    { day: "Friday", enabled: false, startTime: "09:00", endTime: "17:00", dayOfWeek: 5 },
    { day: "Saturday", enabled: false, startTime: "09:00", endTime: "17:00", dayOfWeek: 6 },
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

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

  const handleAvailabilityUpdate = async (index: number, field: string, value: any) => {
    const newAvailability = [...availability];
    newAvailability[index] = {
      ...newAvailability[index],
      [field]: value
    };
    setAvailability(newAvailability);

    // Save to server
    try {
      const availabilityData = newAvailability.map(day => ({
        dayOfWeek: day.dayOfWeek,
        startTime: day.startTime,
        endTime: day.endTime,
        isAvailable: day.enabled
      }));

      await api.put("/api/availability", availabilityData);
      toast({
        title: "Success",
        description: "Availability settings updated",
      });
    } catch (error) {
      console.error("Error updating availability:", error);
      toast({
        title: "Error",
        description: "Failed to update availability settings",
        variant: "destructive",
      });
    }
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
    dayOfWeek: index,
  }));

  useEffect(() => {
    loadAvailability();
  }, []);

  const loadAvailability = async () => {
    try {
      const response = await api.get("/api/availability");
      const data = response.data;
      
      if (!Array.isArray(data)) {
        throw new Error("Invalid response format from server");
      }
      
      // Update availability state with data from server
      setAvailability(prev => prev.map(day => {
        const serverDay = data.find((d: any) => d.dayOfWeek === day.dayOfWeek);
        if (serverDay) {
          return {
            ...day,
            enabled: serverDay.isAvailable,
            startTime: serverDay.startTime,
            endTime: serverDay.endTime
          };
        }
        return day;
      }));
    } catch (error) {
      console.error("Error loading availability:", error);
      let errorMessage = "Failed to load availability settings";
      
      if (axios.isAxiosError(error)) {
        if (error.code === "ERR_NETWORK") {
          errorMessage = "Cannot connect to server. Please check if the server is running.";
        } else if (error.response?.status === 401) {
          errorMessage = "Please log in to view availability settings";
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        setError(`File size must be less than 5MB. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
        e.target.value = ''; // Clear the file input
        return;
      }

      setAvatarFile(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;

    setIsLoading(true);
    setError(undefined);
    setSuccess(undefined);

    try {
      const { token } = getStoredAuth();
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const formData = new FormData();
      formData.append('avatar', avatarFile);

      const response = await fetch('/api/users/avatar', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload avatar');
      }

      const data = await response.json();
      await updateUser(data);
      setSuccess('Avatar updated successfully');
      setAvatarFile(undefined);
      setAvatarPreview(undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload avatar');
      console.error('Avatar upload error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAvailability = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      // Convert UI format to database format
      const dbAvailability = availability.map((day, index) => ({
        userId: user.id,
        dayOfWeek: index,
        startTime: day.startTime,
        endTime: day.endTime,
        isAvailable: day.enabled
      }));

      await apiRequest("POST", `/api/users/${user.id}/availability`, dbAvailability);
      toast({
        title: "Availability settings saved",
        description: "Your availability has been saved successfully.",
      });
    } catch (error) {
      console.error("Failed to save availability:", error);
      toast({
        title: "Error",
        description: "Failed to save availability settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast({
        title: "Error",
        description: "New password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { token } = getStoredAuth();
      console.log('=== Password Update Debug ===');
      console.log('Auth token:', token ? 'Present' : 'Missing');
      console.log('Full request URL:', `${api.defaults.baseURL}/api/users/password`);
      console.log('Request headers:', api.defaults.headers);
      console.log('Request payload:', {
        currentPassword: passwordData.currentPassword ? 'Present' : 'Missing',
        newPassword: passwordData.newPassword ? 'Present' : 'Missing'
      });
      
      const response = await api.put("/api/users/password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      // Debug: Log response
      console.log('Password update response:', response.status);

      // Clear form
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });

      toast({
        title: "Success",
        description: "Password updated successfully",
      });
    } catch (error) {
      console.error("Password update error:**********************", error);
      let errorMessage = "Failed to update password";
      
      if (axios.isAxiosError(error)) {
        // Debug: Log detailed error information
        console.log('Error response:', {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers
        });
        
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage your account and preferences</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <UserIcon className="h-4 w-4" />
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
                  <div className="max-w-4xl mx-auto p-6">
                    <h2 className="text-xl font-semibold mb-4">Profile Picture</h2>
                    <div className="flex items-center space-x-6">
                      <div className="relative">
                        <img
                          src={avatarPreview || user?.profileImage || '/default-avatar.png'}
                          alt="Profile"
                          className="w-24 h-24 rounded-full object-cover"
                        />
                        <label
                          htmlFor="avatar-upload"
                          className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full cursor-pointer hover:bg-blue-600"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                        </label>
                        <input
                          id="avatar-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarChange}
                        />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-2">
                          Upload a new profile picture
                        </p>
                        {avatarFile && (
                          <button
                            onClick={handleAvatarUpload}
                            disabled={isLoading}
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                          >
                            {isLoading ? 'Uploading...' : 'Save Avatar'}
                          </button>
                        )}
                      </div>
                    </div>
                    {error && (
                      <p className="mt-2 text-sm text-red-600">{error}</p>
                    )}
                    {success && (
                      <p className="mt-2 text-sm text-green-600">{success}</p>
                    )}
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
                {availability.map((dayAvail, index) => (
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
                  <form onSubmit={handlePasswordUpdate} className="space-y-4">
                    <div>
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        name="currentPassword"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        placeholder="Enter current password"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        placeholder="Enter new password"
                        required
                        minLength={8}
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        placeholder="Confirm new password"
                        required
                        minLength={8}
                      />
                    </div>
                    <Button type="submit" disabled={isUpdatingPassword}>
                      {isUpdatingPassword ? "Updating..." : "Update Password"}
                    </Button>
                  </form>
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
                    checked={!!user?.receiveAgendaEmail}
                    onCheckedChange={(checked) => 
                      handleNotificationToggle("receiveAgendaEmail", checked)
                    }
                  />
                </div>

                {user?.receiveAgendaEmail && (
                  <div className="ml-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Label htmlFor="agendaTime">Daily agenda time</Label>
                    <Select
                      value={user?.agendaEmailTime ?? undefined}
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
        </Tabs>

        {/* 2FA Setup Modal */}
        <TwoFactorSetup open={is2FAOpen} onOpenChange={setIs2FAOpen} />
      </div>
    </Layout>
  );
}
