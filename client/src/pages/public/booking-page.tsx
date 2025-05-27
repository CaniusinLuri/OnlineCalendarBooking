import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, User, Video, MapPin, Check, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBookingSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatTime, getTimeSlots, isEmailValid } from "@/lib/utils";
import { z } from "zod";

const bookingFormSchema = insertBookingSchema.omit({ bookingPageId: true }).extend({
  visitorName: z.string().min(1, "Name is required"),
  visitorEmail: z.string().email("Please enter a valid email address"),
  selectedDate: z.string().min(1, "Please select a date"),
  selectedTime: z.string().min(1, "Please select a time slot"),
  notes: z.string().optional(),
});

export default function PublicBookingPage() {
  const params = useParams();
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [bookingComplete, setBookingComplete] = useState(false);
  const { toast } = useToast();

  // Extract userAlias and pageAlias from URL params
  const fullParam = params["*"] || "";
  const parts = fullParam.split(".");
  const userAlias = parts[0];
  const pageAlias = parts[1];

  const { data: bookingPage, isLoading, error } = useQuery({
    queryKey: [`/api/public/booking/${userAlias}/${pageAlias}`],
    enabled: !!userAlias && !!pageAlias,
  });

  const createBookingMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", `/api/public/booking/${userAlias}/${pageAlias}`, data);
      return response.json();
    },
    onSuccess: () => {
      setBookingComplete(true);
      toast({
        title: "Booking confirmed!",
        description: "Your meeting has been scheduled successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Booking failed",
        description: "Unable to schedule your meeting. Please try again.",
        variant: "destructive",
      });
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: zodResolver(bookingFormSchema),
  });

  useEffect(() => {
    setValue("selectedDate", selectedDate);
    setValue("selectedTime", selectedTime);
  }, [selectedDate, selectedTime, setValue]);

  const onSubmit = (data: any) => {
    const startTime = new Date(`${data.selectedDate}T${data.selectedTime}`);
    const endTime = new Date(startTime.getTime() + (bookingPage?.duration || 30) * 60000);

    createBookingMutation.mutate({
      visitorName: data.visitorName,
      visitorEmail: data.visitorEmail,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      notes: data.notes,
    });
  };

  const generateTimeSlots = () => {
    if (!selectedDate) return [];
    
    // Mock availability - in real app this would come from API
    const availability = {
      startTime: "09:00",
      endTime: "17:00",
    };
    
    const duration = bookingPage?.duration || 30;
    const buffer = (bookingPage?.bufferBefore || 0) + (bookingPage?.bufferAfter || 0);
    
    return getTimeSlots(availability.startTime, availability.endTime, duration + buffer);
  };

  const generateAvailableDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Skip weekends for demo
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        dates.push(date.toISOString().split('T')[0]);
      }
    }
    
    return dates;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !bookingPage) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Page Not Found</h1>
            </div>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              The booking page you're looking for doesn't exist or is no longer available.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (bookingComplete) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-success-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Booking Confirmed!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Your meeting has been scheduled successfully. You should receive a confirmation email shortly.
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span className="font-medium">{selectedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span>Time:</span>
                  <span className="font-medium">{selectedTime}</span>
                </div>
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span className="font-medium">{bookingPage.duration} minutes</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Calendar className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Book a Meeting
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Schedule your {bookingPage.duration}-minute {bookingPage.alias} session
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Booking Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-primary" />
                <span className="capitalize">{bookingPage.alias}</span>
              </CardTitle>
              <CardDescription>
                {bookingPage.description || "Schedule your meeting with us"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Meeting Details */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">{bookingPage.duration} minutes</div>
                    <div className="text-sm text-gray-500">Meeting duration</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Video className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">Virtual Meeting</div>
                    <div className="text-sm text-gray-500">Meeting link will be provided</div>
                  </div>
                </div>

                {(bookingPage.bufferBefore > 0 || bookingPage.bufferAfter > 0) && (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium">Buffer Time</div>
                      <div className="text-sm text-gray-500">
                        {bookingPage.bufferBefore}min before, {bookingPage.bufferAfter}min after
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* What to expect */}
              <div className="border-t pt-4">
                <h3 className="font-medium mb-3">What to expect:</h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <li>• You'll receive a confirmation email with meeting details</li>
                  <li>• A calendar invitation will be sent to your email</li>
                  <li>• Meeting link will be provided before the session</li>
                  <li>• Please join a few minutes early</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Booking Form */}
          <Card>
            <CardHeader>
              <CardTitle>Select Date & Time</CardTitle>
              <CardDescription>
                Choose your preferred meeting time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Date Selection */}
                <div>
                  <Label>Select Date</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {generateAvailableDates().slice(0, 9).map((date) => {
                      const dateObj = new Date(date);
                      const isSelected = selectedDate === date;
                      
                      return (
                        <button
                          key={date}
                          type="button"
                          onClick={() => setSelectedDate(date)}
                          className={`p-3 text-sm rounded-lg border transition-colors ${
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary"
                              : "hover:bg-gray-50 dark:hover:bg-gray-800"
                          }`}
                        >
                          <div className="font-medium">
                            {dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                          <div className="text-xs opacity-75">
                            {dateObj.toLocaleDateString('en-US', { weekday: 'short' })}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <input type="hidden" {...register("selectedDate")} />
                  {errors.selectedDate && (
                    <p className="text-sm text-red-600 mt-1">{errors.selectedDate.message}</p>
                  )}
                </div>

                {/* Time Selection */}
                {selectedDate && (
                  <div>
                    <Label>Select Time</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {generateTimeSlots().map((time) => {
                        const isSelected = selectedTime === time;
                        
                        return (
                          <button
                            key={time}
                            type="button"
                            onClick={() => setSelectedTime(time)}
                            className={`p-2 text-sm rounded-lg border transition-colors ${
                              isSelected
                                ? "bg-primary text-primary-foreground border-primary"
                                : "hover:bg-gray-50 dark:hover:bg-gray-800"
                            }`}
                          >
                            {formatTime(new Date(`2000-01-01T${time}`))}
                          </button>
                        );
                      })}
                    </div>
                    <input type="hidden" {...register("selectedTime")} />
                    {errors.selectedTime && (
                      <p className="text-sm text-red-600 mt-1">{errors.selectedTime.message}</p>
                    )}
                  </div>
                )}

                {/* Contact Information */}
                {selectedTime && (
                  <div className="space-y-4 border-t pt-6">
                    <div>
                      <Label htmlFor="visitorName">Your Name *</Label>
                      <Input
                        id="visitorName"
                        {...register("visitorName")}
                        placeholder="Enter your full name"
                      />
                      {errors.visitorName && (
                        <p className="text-sm text-red-600 mt-1">{errors.visitorName.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="visitorEmail">Email Address *</Label>
                      <Input
                        id="visitorEmail"
                        type="email"
                        {...register("visitorEmail")}
                        placeholder="Enter your email address"
                      />
                      {errors.visitorEmail && (
                        <p className="text-sm text-red-600 mt-1">{errors.visitorEmail.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="notes">Additional Notes (optional)</Label>
                      <Textarea
                        id="notes"
                        {...register("notes")}
                        placeholder="Any specific topics or requirements for the meeting?"
                        rows={3}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={createBookingMutation.isPending}
                    >
                      {createBookingMutation.isPending ? "Scheduling..." : "Schedule Meeting"}
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Powered by SmartCal</p>
        </div>
      </div>
    </div>
  );
}
