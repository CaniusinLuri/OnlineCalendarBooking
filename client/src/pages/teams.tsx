import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Layout from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Users, Mail, Trash2, Edit, UserCheck, UserX } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTeamSchema, type Team } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isEmailValid } from "@/lib/utils";

export default function Teams() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [teamEmails, setTeamEmails] = useState<string[]>([]);
  const { toast } = useToast();

  const { data: teams, isLoading } = useQuery({
    queryKey: ["/api/teams"],
  });

  const createTeamMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/teams", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      setIsCreateOpen(false);
      setTeamEmails([]);
      reset();
      toast({
        title: "Team created",
        description: "Your new team has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to create team. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteTeamMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/teams/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      toast({
        title: "Team deleted",
        description: "The team has been removed.",
      });
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(insertTeamSchema.omit({ userId: true, emails: true })),
  });

  const onSubmit = (data: any) => {
    createTeamMutation.mutate({
      ...data,
      emails: teamEmails,
    });
  };

  const addEmail = () => {
    if (!newEmail.trim()) return;
    
    if (!isEmailValid(newEmail)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    if (teamEmails.includes(newEmail)) {
      toast({
        title: "Email already added",
        description: "This email is already in the team.",
        variant: "destructive",
      });
      return;
    }

    setTeamEmails([...teamEmails, newEmail]);
    setNewEmail("");
  };

  const removeEmail = (emailToRemove: string) => {
    setTeamEmails(teamEmails.filter(email => email !== emailToRemove));
  };

  const getEmailStatus = (email: string) => {
    // In a real app, this would check if the email is a registered user
    const isRegistered = email.includes("@company.com"); // Mock logic
    return isRegistered;
  };

  const getInitials = (email: string) => {
    return email.split("@")[0].slice(0, 2).toUpperCase();
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Meeting</h1>
            <p className="text-gray-500 dark:text-gray-400">Manage your team groups for easier meeting scheduling</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Meeting
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Team</DialogTitle>
                <DialogDescription>
                  Create a team to group email addresses for easier meeting invitations.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="name">Team Name</Label>
                  <Input
                    id="name"
                    {...register("name")}
                    placeholder="e.g., Engineering Team, Marketing"
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    {...register("description")}
                    placeholder="Brief description of this team..."
                    rows={2}
                  />
                </div>

                <div>
                  <Label>Team Members</Label>
                  <div className="flex space-x-2 mt-2">
                    <Input
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="Add email address"
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addEmail())}
                    />
                    <Button type="button" onClick={addEmail}>
                      Add
                    </Button>
                  </div>
                  
                  {/* Email List */}
                  <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                    {teamEmails.map((email) => {
                      const isRegistered = getEmailStatus(email);
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
                            onClick={() => removeEmail(email)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                  
                  {teamEmails.length === 0 && (
                    <p className="text-sm text-gray-500 mt-2">No members added yet</p>
                  )}
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createTeamMutation.isPending || teamEmails.length === 0}
                  >
                    {createTeamMutation.isPending ? "Creating..." : "Create Team"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Teams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams?.map((team: Team) => (
            <Card key={team.id} className="card-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="h-5 w-5 text-primary" />
                      <span>{team.name}</span>
                    </CardTitle>
                    <CardDescription>
                      {team.emails?.length || 0} members
                    </CardDescription>
                  </div>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTeamMutation.mutate(team.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Description */}
                {team.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {team.description}
                  </p>
                )}

                {/* Members Preview */}
                <div>
                  <Label className="text-sm text-gray-500">Members:</Label>
                  <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                    {team.emails?.slice(0, 5).map((email) => {
                      const isRegistered = getEmailStatus(email);
                      return (
                        <div key={email} className="flex items-center space-x-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {getInitials(email)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm truncate flex-1">{email}</span>
                          {isRegistered ? (
                            <div className="h-2 w-2 rounded-full bg-success-500" title="Registered user" />
                          ) : (
                            <div className="h-2 w-2 rounded-full bg-gray-400" title="External user" />
                          )}
                        </div>
                      );
                    })}
                    {team.emails && team.emails.length > 5 && (
                      <p className="text-xs text-gray-500">
                        +{team.emails.length - 5} more members
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-2 border-t">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Mail className="h-4 w-4 mr-1" />
                    Invite All
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Empty State */}
          {teams?.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No teams yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-center mb-4">
                  Create teams to group email addresses and make scheduling meetings easier.
                </p>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Team
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
