import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Plus, X, UserCheck, UserX, Video, MapPin } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMeetingSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isEmailValid, calculateBufferTimes } from "@/lib/utils";

interface MeetingCreationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function MeetingCreationModal({ open, onOpenChange }: MeetingCreationModalProps) {
  const [participants, setParticipants] = useState<string[]>([]);
  const [newParticipant, setNewParticipant] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const { toast } = useToast();

  const { data: calendars } = useQuery({
    queryKey: ["/api/calendars"],
    enabled: open,
  });

  const { data: teams } = useQuery({
    queryKey: ["/api/teams"],
    enabled: open,
  });

  const createMeetingMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/meetings", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      onOpenChange(false);
      reset();
      setParticipants([]);
      setNewParticipant("");
      toast({
        title: "Meeting created",
        description: "Your meeting has been scheduled successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to create meeting. Please try again.",
        variant: "destructive",
      });
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(insertMeetingSchema.omit({ userId: true, participants: true })),
    defaultValues: {
      meetingType: "virtual",
      bufferBefore: 5,
      bufferAfter: 5,
    },
  });

  const watchedMeetingType = watch("meetingType");
  const watchedDate = watch("startTime");

  const addParticipant = () => {
    if (!newParticipant.trim()) return;
    
    if (!isEmailValid(newParticipant)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    if (participants.includes(newParticipant)) {
      toast({
        title: "Email already added",
        description: "This email is already in the participants list.",
        variant: "destructive",
      });
      return;
    }

    setParticipants([...participants, newParticipant]);
    setNewParticipant("");
  };

  const removeParticipant = (emailToRemove: string) => {
    setParticipants(participants.filter(email => email !== emailToRemove));
  };

  const addTeamToParticipants = (teamId: string) => {
    const team = teams?.find((t: any) => t.id.toString() === teamId);
    if (team && team.emails) {
      const newEmails = team.emails.filter((email: string) => !participants.includes(email));
      setParticipants([...participants, ...newEmails]);
      setSelectedTeam("");
    }
  };

  const getParticipantStatus = (email: string) => {
    // Mock logic - in real app this would check against registered users
    const isRegistered = email.includes("@company.com");
    return isRegistered;
  };

  const getInitials = (email: string) => {
    return email.slice(0, 2).toUpperCase();
  };

  const onSubmit = (data: any) => {
    const startTime = new Date(data.startTime);
    const endTime = new Date(startTime.getTime() + parseInt(data.duration) * 60000);

    // Apply buffers based on meeting type
    const buffers = calculateBufferTimes(data.meetingType, parseInt(data.duration));

    createMeetingMutation.mutate({
      ...data,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      participants,
      bufferBefore: data.meetingType === "in_person" ? buffers.before : data.bufferBefore,
      bufferAfter: data.meetingType === "in_person" ? buffers.after : data.bufferAfter,
      travelBuffer: data.meetingType === "in_person" ? 30 : 0, // Default 30min travel buffer
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Meeting</DialogTitle>
          <DialogDescription>
            Schedule a meeting with your team or external participants.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Meeting Title *</Label>
              <Input
                id="title"
                {...register("title")}
                placeholder="Enter meeting title"
              />
              {errors.title && (
                <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Meeting agenda or notes"
                rows={3}
              />
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="startTime">Date & Time *</Label>
              <Input
                id="startTime"
                type="datetime-local"
                {...register("startTime")}
              />
              {errors.startTime && (
                <p className="text-sm text-red-600 mt-1">{errors.startTime.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="duration">Duration (minutes) *</Label>
              <Select defaultValue="30" onValueChange={(value) => setValue("duration", parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                  <SelectItem value="90">90 minutes</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="calendarId">Calendar *</Label>
              <Select onValueChange={(value) => setValue("calendarId", parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select calendar" />
                </SelectTrigger>
                <SelectContent>
                  {calendars?.map((calendar: any) => (
                    <SelectItem key={calendar.id} value={calendar.id.toString()}>
                      {calendar.alias} {calendar.isPrimary && "(Primary)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.calendarId && (
                <p className="text-sm text-red-600 mt-1">{errors.calendarId.message}</p>
              )}
            </div>
          </div>

          {/* Meeting Type */}
          <div>
            <Label>Meeting Type *</Label>
            <RadioGroup
              defaultValue="virtual"
              onValueChange={(value) => setValue("meetingType", value)}
              className="grid grid-cols-2 gap-4 mt-2"
            >
              <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                <RadioGroupItem value="virtual" id="virtual" />
                <Label htmlFor="virtual" className="flex items-center space-x-2 cursor-pointer">
                  <Video className="h-4 w-4 text-success-500" />
                  <div>
                    <div className="font-medium">Virtual</div>
                    <div className="text-xs text-gray-500">Online meeting</div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                <RadioGroupItem value="in_person" id="in_person" />
                <Label htmlFor="in_person" className="flex items-center space-x-2 cursor-pointer">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <div>
                    <div className="font-medium">In-person</div>
                    <div className="text-xs text-gray-500">Physical location</div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Location (for in-person meetings) */}
          {watchedMeetingType === "in_person" && (
            <div>
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                {...register("location")}
                placeholder="Meeting location or address"
              />
              {errors.location && (
                <p className="text-sm text-red-600 mt-1">{errors.location.message}</p>
              )}
            </div>
          )}

          <Separator />

          {/* Participants */}
          <div className="space-y-4">
            <div>
              <Label>Participants</Label>
              <div className="flex space-x-2 mt-2">
                <Input
                  value={newParticipant}
                  onChange={(e) => setNewParticipant(e.target.value)}
                  placeholder="Add participant email"
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addParticipant())}
                />
                <Button type="button" onClick={addParticipant}>
                  Add
                </Button>
              </div>
            </div>

            {/* Quick add team */}
            {teams && teams.length > 0 && (
              <div>
                <Label>Quick Add Team</Label>
                <Select value={selectedTeam} onValueChange={addTeamToParticipants}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select a team to add all members" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team: any) => (
                      <SelectItem key={team.id} value={team.id.toString()}>
                        {team.name} ({team.emails?.length || 0} members)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Participants List */}
            {participants.length > 0 && (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {participants.map((email) => {
                  const isRegistered = getParticipantStatus(email);
                  return (
                    <div key={email} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {getInitials(email)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">{email}</span>
                          {isRegistered ? (
                            <Badge variant="default" className="bg-success-500 text-xs">
                              <UserCheck className="h-3 w-3 mr-1" />
                              Registered
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              <UserX className="h-3 w-3 mr-1" />
                              External
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeParticipant(email)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Buffer Settings */}
          {watchedMeetingType === "virtual" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bufferBefore">Buffer Before (minutes)</Label>
                <Input
                  id="bufferBefore"
                  type="number"
                  {...register("bufferBefore", { valueAsNumber: true })}
                  min="0"
                  max="60"
                />
              </div>
              <div>
                <Label htmlFor="bufferAfter">Buffer After (minutes)</Label>
                <Input
                  id="bufferAfter"
                  type="number"
                  {...register("bufferAfter", { valueAsNumber: true })}
                  min="0"
                  max="60"
                />
              </div>
            </div>
          )}

          {/* Travel buffer info for in-person meetings */}
          {watchedMeetingType === "in_person" && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <MapPin className="h-4 w-4 inline mr-1" />
                Travel buffers will be automatically added (30 minutes before and 15 minutes after).
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMeetingMutation.isPending}>
              {createMeetingMutation.isPending ? "Creating..." : "Create Meeting"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
