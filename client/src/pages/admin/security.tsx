import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Layout from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, AlertTriangle, Key, Clock, Users, Activity } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export default function AdminSecurity() {
  const [globalSettings, setGlobalSettings] = useState({
    require2FA: false,
    sessionTimeout: 24,
    passwordMinLength: 8,
    allowPublicBookings: true,
    maxBookingsPerDay: 50,
  });

  // Mock security events data
  const securityEvents = [
    {
      id: 1,
      type: "login_failed",
      user: "john@example.com",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      details: "Failed login attempt from IP 192.168.1.100",
      severity: "warning",
    },
    {
      id: 2,
      type: "2fa_enabled",
      user: "sarah@company.com",
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      details: "Two-factor authentication enabled",
      severity: "info",
    },
    {
      id: 3,
      type: "password_changed",
      user: "mike@company.com",
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      details: "Password successfully changed",
      severity: "info",
    },
    {
      id: 4,
      type: "suspicious_login",
      user: "admin@company.com",
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
      details: "Login from unusual location (New York, US)",
      severity: "error",
    },
  ];

  // Mock active sessions data
  const activeSessions = [
    {
      id: 1,
      user: "john@example.com",
      device: "Chrome on Windows",
      location: "San Francisco, CA",
      lastActive: new Date(Date.now() - 10 * 60 * 1000),
      ip: "192.168.1.100",
    },
    {
      id: 2,
      user: "sarah@company.com",
      device: "Safari on macOS",
      location: "New York, NY",
      lastActive: new Date(Date.now() - 30 * 60 * 1000),
      ip: "192.168.1.101",
    },
  ];

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "error":
        return <Badge className="bg-error-500">High</Badge>;
      case "warning":
        return <Badge className="bg-warning-500">Medium</Badge>;
      case "info":
        return <Badge variant="secondary">Low</Badge>;
      default:
        return <Badge variant="secondary">Info</Badge>;
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "login_failed":
      case "suspicious_login":
        return <AlertTriangle className="h-4 w-4 text-error-500" />;
      case "2fa_enabled":
      case "password_changed":
        return <Shield className="h-4 w-4 text-success-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Security Management</h1>
          <p className="text-gray-500 dark:text-gray-400">Monitor security events and configure system settings</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="events">Security Events</TabsTrigger>
            <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
            <TabsTrigger value="settings">Security Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Security Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Users className="h-8 w-8 text-primary" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Users with 2FA
                      </dt>
                      <dd className="text-lg font-medium text-gray-900 dark:text-white">
                        12 / 25
                      </dd>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <AlertTriangle className="h-8 w-8 text-warning-500" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Security Alerts
                      </dt>
                      <dd className="text-lg font-medium text-gray-900 dark:text-white">
                        3
                      </dd>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Activity className="h-8 w-8 text-success-500" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Active Sessions
                      </dt>
                      <dd className="text-lg font-medium text-gray-900 dark:text-white">
                        {activeSessions.length}
                      </dd>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Clock className="h-8 w-8 text-primary" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Avg Session Time
                      </dt>
                      <dd className="text-lg font-medium text-gray-900 dark:text-white">
                        2.4h
                      </dd>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Security Events */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Security Events</CardTitle>
                <CardDescription>
                  Latest security-related activities across the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {securityEvents.slice(0, 5).map((event) => (
                    <div key={event.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                      <div className="flex-shrink-0 mt-1">
                        {getEventIcon(event.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {event.user}
                          </p>
                          <div className="flex items-center space-x-2">
                            {getSeverityBadge(event.severity)}
                            <span className="text-xs text-gray-500">
                              {formatDateTime(event.timestamp)}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500">{event.details}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Events Tab */}
          <TabsContent value="events" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Event Log</CardTitle>
                <CardDescription>
                  Complete history of security events and incidents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Event</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {securityEvents.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getEventIcon(event.type)}
                              <span className="capitalize">{event.type.replace("_", " ")}</span>
                            </div>
                          </TableCell>
                          <TableCell>{event.user}</TableCell>
                          <TableCell>{getSeverityBadge(event.severity)}</TableCell>
                          <TableCell>{formatDateTime(event.timestamp)}</TableCell>
                          <TableCell className="max-w-xs truncate">{event.details}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Active Sessions Tab */}
          <TabsContent value="sessions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Active User Sessions</CardTitle>
                <CardDescription>
                  Monitor and manage currently active user sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Device</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Last Active</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeSessions.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell>{session.user}</TableCell>
                          <TableCell>{session.device}</TableCell>
                          <TableCell>{session.location}</TableCell>
                          <TableCell>{formatDateTime(session.lastActive)}</TableCell>
                          <TableCell className="font-mono text-sm">{session.ip}</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" className="text-red-600">
                              Terminate
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Global Security Settings</CardTitle>
                <CardDescription>
                  Configure system-wide security policies and requirements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Authentication Settings */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Authentication</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Require Two-Factor Authentication</h4>
                        <p className="text-sm text-gray-500">
                          Force all users to enable 2FA for their accounts
                        </p>
                      </div>
                      <Switch
                        checked={globalSettings.require2FA}
                        onCheckedChange={(checked) =>
                          setGlobalSettings(prev => ({ ...prev, require2FA: checked }))
                        }
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="sessionTimeout">Session Timeout (hours)</Label>
                        <Input
                          id="sessionTimeout"
                          type="number"
                          value={globalSettings.sessionTimeout}
                          onChange={(e) =>
                            setGlobalSettings(prev => ({ 
                              ...prev, 
                              sessionTimeout: parseInt(e.target.value) 
                            }))
                          }
                          min="1"
                          max="168"
                        />
                      </div>
                      <div>
                        <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
                        <Input
                          id="passwordMinLength"
                          type="number"
                          value={globalSettings.passwordMinLength}
                          onChange={(e) =>
                            setGlobalSettings(prev => ({ 
                              ...prev, 
                              passwordMinLength: parseInt(e.target.value) 
                            }))
                          }
                          min="6"
                          max="32"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Booking Security */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Booking Security</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Allow Public Bookings</h4>
                        <p className="text-sm text-gray-500">
                          Enable public booking pages for non-registered users
                        </p>
                      </div>
                      <Switch
                        checked={globalSettings.allowPublicBookings}
                        onCheckedChange={(checked) =>
                          setGlobalSettings(prev => ({ ...prev, allowPublicBookings: checked }))
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="maxBookingsPerDay">Max Bookings per Day (per visitor)</Label>
                      <Input
                        id="maxBookingsPerDay"
                        type="number"
                        value={globalSettings.maxBookingsPerDay}
                        onChange={(e) =>
                          setGlobalSettings(prev => ({ 
                            ...prev, 
                            maxBookingsPerDay: parseInt(e.target.value) 
                          }))
                        }
                        min="1"
                        max="100"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button>Save Security Settings</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
