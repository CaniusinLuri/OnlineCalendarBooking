import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Layout from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Calendar as CalendarIcon, Settings, ExternalLink, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCalendarSchema, type Calendar } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function Calendars() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { toast } = useToast();

  const { data: calendars, isLoading } = useQuery({
    queryKey: ["/api/calendars"],
  });

  const createCalendarMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/calendars", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendars"] });
      setIsCreateOpen(false);
      toast({
        title: "Calendar created",
        description: "Your new calendar has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to create calendar. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateCalendarMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest("PUT", `/api/calendars/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendars"] });
      toast({
        title: "Calendar updated",
        description: "Calendar settings have been saved.",
      });
    },
  });

  const deleteCalendarMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/calendars/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendars"] });
      toast({
        title: "Calendar deleted",
        description: "The calendar has been removed.",
      });
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(insertCalendarSchema.omit({ userId: true })),
  });

  const onSubmit = (data: any) => {
    createCalendarMutation.mutate(data);
  };

  const handleSyncToggle = (calendar: Calendar, enabled: boolean) => {
    updateCalendarMutation.mutate({
      id: calendar.id,
      data: { syncEnabled: enabled },
    });
  };

  const handlePrimaryToggle = (calendar: Calendar) => {
    updateCalendarMutation.mutate({
      id: calendar.id,
      data: { isPrimary: true },
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Calendars</h1>
            <p className="text-gray-500 dark:text-gray-400">Manage your calendars and sync settings</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Calendar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Calendar</DialogTitle>
                <DialogDescription>
                  Add a new calendar to organize your meetings and bookings.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="alias">Calendar Name</Label>
                  <Input
                    id="alias"
                    {...register("alias")}
                    placeholder="e.g., work, personal, meetings"
                  />
                  {errors.alias && (
                    <p className="text-sm text-red-600 mt-1">{errors.alias.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="syncDirection">Sync Direction</Label>
                  <Select defaultValue="one_way" {...register("syncDirection")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one_way">One-way sync</SelectItem>
                      <SelectItem value="two_way">Two-way sync</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="titleReplacement">Title Handling</Label>
                  <Select defaultValue="prefix" {...register("titleReplacement")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="replace">Replace with [Busy]</SelectItem>
                      <SelectItem value="prefix">Add prefix to title</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="titlePrefix">Title Prefix (optional)</Label>
                  <Input
                    id="titlePrefix"
                    {...register("titlePrefix")}
                    placeholder="[Work]"
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createCalendarMutation.isPending}>
                    {createCalendarMutation.isPending ? "Creating..." : "Create Calendar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {calendars?.map((calendar: Calendar) => (
            <Card key={calendar.id} className={cn(
              "card-shadow",
              calendar.isPrimary && "ring-2 ring-primary"
            )}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <CalendarIcon className="h-5 w-5 text-primary" />
                      <span className="capitalize">{calendar.alias}</span>
                      {calendar.isPrimary && (
                        <Badge variant="default" className="ml-2">Primary</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {calendar.syncDirection === "two_way" ? "Two-way sync" : "One-way sync"}
                    </CardDescription>
                  </div>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteCalendarMutation.mutate(calendar.id)}
                      disabled={calendar.isPrimary}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Sync Toggle */}
                <div className="flex items-center justify-between">
                  <Label htmlFor={`sync-${calendar.id}`} className="text-sm">
                    Sync Enabled
                  </Label>
                  <Switch
                    id={`sync-${calendar.id}`}
                    checked={calendar.syncEnabled}
                    onCheckedChange={(checked) => handleSyncToggle(calendar, checked)}
                  />
                </div>

                {/* Primary Calendar Toggle */}
                {!calendar.isPrimary && (
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Set as Primary</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePrimaryToggle(calendar)}
                    >
                      Make Primary
                    </Button>
                  </div>
                )}

                {/* Sync Settings */}
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span>Title handling:</span>
                    <span className="capitalize">{calendar.titleReplacement}</span>
                  </div>
                  {calendar.titlePrefix && (
                    <div className="flex justify-between">
                      <span>Prefix:</span>
                      <span className="font-mono">{calendar.titlePrefix}</span>
                    </div>
                  )}
                </div>

                {/* Integration Status */}
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      External Calendars
                    </span>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Connect
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Empty State */}
          {calendars?.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CalendarIcon className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No calendars yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-center mb-4">
                  Create your first calendar to start organizing your meetings and appointments.
                </p>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Calendar
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
