import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, ExternalLink, Settings, Eye, Copy, Clock } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { generateBookingUrl } from "@/lib/utils";
import { type BookingPage } from "@shared/schema";

interface BookingPageManagementProps {
  bookingPages?: BookingPage[];
  isLoading: boolean;
}

export default function BookingPageManagement({ bookingPages, isLoading }: BookingPageManagementProps) {
  const { toast } = useToast();

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

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "URL copied",
      description: "The booking URL has been copied to your clipboard.",
    });
  };

  const getStatusBadge = (page: BookingPage) => {
    if (!page.isApproved) {
      return (
        <Badge variant="outline" className="text-warning-600 border-warning-300 bg-warning-100">
          Pending Approval
        </Badge>
      );
    }
    if (!page.isActive) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    return <Badge className="bg-success-500">Active</Badge>;
  };

  const togglePageStatus = (page: BookingPage) => {
    updateBookingPageMutation.mutate({
      id: page.id,
      data: { isActive: !page.isActive },
    });
  };

  if (isLoading) {
    return (
      <Card className="card-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-10 w-40" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-6 w-16" />
                </div>
                <Skeleton className="h-20 w-full mb-3" />
                <div className="flex space-x-2">
                  <Skeleton className="h-8 flex-1" />
                  <Skeleton className="h-8 flex-1" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Booking Pages</CardTitle>
          <Button onClick={() => window.location.href = "/bookings"}>
            <Plus className="h-4 w-4 mr-2" />
            Create Booking Page
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {bookingPages && bookingPages.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookingPages.slice(0, 6).map((page) => {
              // TODO: Get actual user alias from context/props
              const bookingUrl = generateBookingUrl("username", page.alias);
              
              return (
                <div key={page.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                      {page.alias}
                    </h4>
                    {getStatusBadge(page)}
                  </div>
                  
                  {/* Public URL */}
                  <div className="mb-3">
                    <div className="text-xs text-gray-500 mb-1">Public URL:</div>
                    <div className="flex items-center space-x-2">
                      <div className="text-xs font-mono text-primary bg-primary-50 dark:bg-primary-900/20 p-2 rounded border flex-1 truncate">
                        {bookingUrl}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(bookingUrl)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Settings Summary */}
                  <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 dark:text-gray-400 mb-3">
                    <div>
                      <span className="font-medium">Duration:</span> {page.duration}min
                    </div>
                    <div>
                      <span className="font-medium">Buffer:</span> {(page.bufferBefore || 0) + (page.bufferAfter || 0)}min
                    </div>
                  </div>

                  {/* Mock booking stats */}
                  <div className="grid grid-cols-2 gap-4 text-xs mb-4">
                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <div className="font-semibold text-gray-900 dark:text-white">0</div>
                      <div className="text-gray-500">This Week</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <div className="font-semibold text-gray-900 dark:text-white">0</div>
                      <div className="text-gray-500">Total</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="h-3 w-3 mr-1" />
                      Preview
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Settings className="h-3 w-3 mr-1" />
                      Settings
                    </Button>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Pending approval message */}
                  {!page.isApproved && (
                    <div className="mt-3 bg-warning-100 dark:bg-warning-900/20 text-warning-800 dark:text-warning-200 p-2 rounded text-xs">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span className="font-medium">Awaiting Admin Approval</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No booking pages yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Create your first booking page to let visitors schedule meetings with you.
            </p>
            <Button onClick={() => window.location.href = "/bookings"}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Booking Page
            </Button>
          </div>
        )}

        {bookingPages && bookingPages.length > 6 && (
          <div className="mt-6 text-center">
            <Button variant="outline" onClick={() => window.location.href = "/bookings"}>
              View All Booking Pages
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
