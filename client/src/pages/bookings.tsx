import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Layout from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Link, ExternalLink, Settings, Copy, Clock, Eye } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBookingPageSchema, type BookingPage } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { generateBookingUrl } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function Bookings() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { toast } = useToast();

  const { data: bookingPages, isLoading } = useQuery({
    queryKey: ["/api/booking-pages"],
  });

  const { data: calendars } = useQuery({
    queryKey: ["/api/calendars"],
  });

  const createBookingPageMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/booking-pages", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/booking-pages"] });
      setIsCreateOpen(false);
      toast({
        title: "Booking page created",
        description: "Your booking page has been created and is pending approval.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to create booking page. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateBookingPageMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest("PUT", `/api/booking-pages/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/booking-pages"] });
      toast({
        title: "Booking page updated",
        description: "Your changes have been saved.",
      });
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(insertBookingPageSchema.omit({ userId: true })),
    defaultValues: {
      duration: 30,
      bufferBefore: 0,
      bufferAfter: 0,
      maxBookingsPerVisitor: 5,
    },
  });

  const watchedAlias = watch("alias");

  const onSubmit = (data: any) => {
    createBookingPageMutation.mutate(data);
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "URL copied",
      description: "The booking URL has been copied to your clipboard.",
    });
  };

  const getStatusBadge = (page: BookingPage) => {
    if (!page.isApproved) {
      return <Badge variant="outline" className="text-warning-600 border-warning-300 bg-warning-100">Pending Approval</Badge>;
    }
    if (!page.isActive) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    return <Badge variant="default" className="bg-success-500">Active</Badge>;
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
                  <Skeleton className="h-32 w-full" />
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Booking Pages</h1>
            <p className="text-gray-500 dark:text-gray-400">Create and manage your public booking pages</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Booking Page
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Booking Page</DialogTitle>
                <DialogDescription>
                  Set up a public booking page where visitors can schedule meetings with you.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="alias">Page Alias</Label>
                    <Input
                      id="alias"
                      {...register("alias")}
                      placeholder="work-consultations"
                    />
                    {errors.alias && (
                      <p className="text-sm text-red-600 mt-1">{errors.alias.message}</p>
                    )}
                    {watchedAlias && (
                      <p className="text-xs text-gray-500 mt-1">
                        URL: smartcal.one/username.{watchedAlias}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="calendarId">Calendar</Label>
                    <Select {...register("calendarId", { valueAsNumber: true })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select calendar" />
                      </SelectTrigger>
                      <SelectContent>
                        {calendars?.map((calendar: any) => (
                          <SelectItem key={calendar.id} value={calendar.id.toString()}>
                            {calendar.alias}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...register("description")}
                    placeholder="Describe what this booking page is for..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Select defaultValue="30" {...register("duration", { valueAsNumber: true })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="45">45 minutes</SelectItem>
                        <SelectItem value="60">60 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="bufferBefore">Buffer Before (min)</Label>
                    <Input
                      id="bufferBefore"
                      type="number"
                      {...register("bufferBefore", { valueAsNumber: true })}
                      min="0"
                      max="60"
                    />
                  </div>

                  <div>
                    <Label htmlFor="bufferAfter">Buffer After (min)</Label>
                    <Input
                      id="bufferAfter"
                      type="number"
                      {...register("bufferAfter", { valueAsNumber: true })}
                      min="0"
                      max="60"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="maxBookingsPerVisitor">Max Bookings per Visitor</Label>
                  <Input
                    id="maxBookingsPerVisitor"
                    type="number"
                    {...register("maxBookingsPerVisitor", { valueAsNumber: true })}
                    min="1"
                    max="50"
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createBookingPageMutation.isPending}>
                    {createBookingPageMutation.isPending ? "Creating..." : "Create Page"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Booking Pages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookingPages?.map((page: BookingPage) => {
            const bookingUrl = generateBookingUrl("username", page.alias); // TODO: Get actual user alias
            
            return (
              <Card key={page.id} className="card-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <Link className="h-5 w-5 text-primary" />
                        <span className="capitalize">{page.alias}</span>
                      </CardTitle>
                      <CardDescription>
                        {page.duration} min • {page.bufferBefore + page.bufferAfter}min buffer
                      </CardDescription>
                    </div>
                    {getStatusBadge(page)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Public URL */}
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-xs text-gray-500">Public URL:</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(bookingUrl)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs font-mono text-primary break-all">
                      {bookingUrl}
                    </p>
                  </div>

                  {/* Booking Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <div className="font-semibold text-gray-900 dark:text-white">12</div>
                      <div className="text-gray-500">This Week</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <div className="font-semibold text-gray-900 dark:text-white">45</div>
                      <div className="text-gray-500">Total</div>
                    </div>
                  </div>

                  {/* Description */}
                  {page.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {page.description}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Settings className="h-4 w-4 mr-1" />
                      Settings
                    </Button>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Pending Approval Message */}
                  {!page.isApproved && (
                    <div className="bg-warning-100 text-warning-800 p-3 rounded-md">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm font-medium">Awaiting Admin Approval</span>
                      </div>
                      <p className="text-xs mt-1">
                        Your booking page will be public once approved by a Super Administrator.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {/* Empty State */}
          {bookingPages?.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Link className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No booking pages yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-center mb-4">
                  Create your first booking page to let visitors schedule meetings with you.
                </p>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Booking Page
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
