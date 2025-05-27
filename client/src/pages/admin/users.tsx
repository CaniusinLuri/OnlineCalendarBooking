import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Layout from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { UserPlus, Search, Download, MoreHorizontal, Eye, Edit, UserX, Shield } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, type User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";

export default function AdminUsers() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const { data: users, isLoading } = useQuery({
    queryKey: ["/api/users"],
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/auth/register", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsCreateOpen(false);
      reset();
      toast({
        title: "User created",
        description: "New user has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to create user. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest("PUT", `/api/users/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "User updated",
        description: "User information has been updated.",
      });
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(insertUserSchema.omit({ 
      emailVerified: true,
      twoFactorSecret: true,
      twoFactorEnabled: true,
      defaultCalendarCount: true,
      defaultBookingPageCount: true,
      defaultTeamCount: true,
      receiveAgendaEmail: true,
      agendaEmailTime: true,
    })),
    defaultValues: {
      role: "user",
      timezone: "UTC",
    },
  });

  const onSubmit = (data: any) => {
    createUserMutation.mutate(data);
  };

  const handleRoleChange = (userId: number, newRole: string) => {
    updateUserMutation.mutate({
      id: userId,
      data: { role: newRole },
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "super_admin":
        return <Badge className="bg-purple-100 text-purple-800">Super Admin</Badge>;
      default:
        return <Badge variant="secondary">User</Badge>;
    }
  };

  const getStatusBadge = (user: User) => {
    if (user.twoFactorEnabled) {
      return (
        <Badge variant="default" className="bg-success-500">
          <Shield className="h-3 w-3 mr-1" />
          2FA Enabled
        </Badge>
      );
    }
    return <Badge variant="secondary">Standard</Badge>;
  };

  const filteredUsers = users?.filter((user: User) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.alias && user.alias.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
            <p className="text-gray-500 dark:text-gray-400">Manage all users and their permissions</p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Users
            </Button>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                  <DialogDescription>
                    Add a new user to the system with their basic information.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        {...register("name")}
                        placeholder="John Doe"
                      />
                      {errors.name && (
                        <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        {...register("email")}
                        placeholder="john@example.com"
                      />
                      {errors.email && (
                        <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="alias">Username Alias</Label>
                      <Input
                        id="alias"
                        {...register("alias")}
                        placeholder="john-doe"
                      />
                      {errors.alias && (
                        <p className="text-sm text-red-600 mt-1">{errors.alias.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="role">Role</Label>
                      <Select defaultValue="user" {...register("role")}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="password">Temporary Password</Label>
                    <Input
                      id="password"
                      type="password"
                      {...register("password")}
                      placeholder="Temporary password"
                    />
                    {errors.password && (
                      <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>
                    )}
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createUserMutation.isPending}>
                      {createUserMutation.isPending ? "Creating..." : "Create User"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>
              {filteredUsers?.length || 0} total users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Users Table */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Calendars</TableHead>
                    <TableHead>Teams</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers?.map((user: User) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.profileImage || ""} alt={user.name} />
                            <AvatarFallback>
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            {user.alias && (
                              <div className="text-xs text-gray-400">@{user.alias}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getRoleBadge(user.role)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(user)}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">0</span> / {user.defaultCalendarCount}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">0</span> / {user.defaultTeamCount}
                      </TableCell>
                      <TableCell>
                        {formatDate(user.createdAt!)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit User
                            </DropdownMenuItem>
                            {user.role !== "super_admin" && (
                              <DropdownMenuItem
                                onClick={() => handleRoleChange(user.id, "super_admin")}
                              >
                                <Shield className="h-4 w-4 mr-2" />
                                Make Super Admin
                              </DropdownMenuItem>
                            )}
                            {user.role === "super_admin" && (
                              <DropdownMenuItem
                                onClick={() => handleRoleChange(user.id, "user")}
                              >
                                <UserX className="h-4 w-4 mr-2" />
                                Remove Admin
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredUsers?.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No users found matching your search.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
