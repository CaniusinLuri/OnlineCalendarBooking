import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Layout from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Ban, Trash2, AlertTriangle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAliasBlacklistSchema, type AliasBlacklist } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";

export default function AdminBlacklist() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const { data: blacklistedAliases, isLoading } = useQuery({
    queryKey: ["/api/admin/blacklist"],
  });

  const addToBlacklistMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/admin/blacklist", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blacklist"] });
      setIsAddOpen(false);
      reset();
      toast({
        title: "Alias blacklisted",
        description: "The alias has been added to the blacklist.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to add alias to blacklist. Please try again.",
        variant: "destructive",
      });
    },
  });

  const removeFromBlacklistMutation = useMutation({
    mutationFn: async (alias: string) => {
      await apiRequest("DELETE", `/api/admin/blacklist/${alias}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blacklist"] });
      toast({
        title: "Alias removed",
        description: "The alias has been removed from the blacklist.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove alias from blacklist.",
        variant: "destructive",
      });
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(insertAliasBlacklistSchema.omit({ createdBy: true })),
  });

  const onSubmit = (data: any) => {
    addToBlacklistMutation.mutate(data);
  };

  const filteredAliases = blacklistedAliases?.filter((item: AliasBlacklist) =>
    item.alias.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.reason && item.reason.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Common blacklisted aliases to suggest
  const commonBlacklistedAliases = [
    "admin", "api", "www", "mail", "email", "support", "help", "contact",
    "root", "user", "test", "demo", "null", "undefined", "system", "config",
    "security", "login", "register", "auth", "oauth", "sso", "calendar",
    "booking", "schedule", "meeting", "app", "application", "service"
  ];

  const addCommonAlias = (alias: string) => {
    addToBlacklistMutation.mutate({
      alias,
      reason: "Common system/reserved word"
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
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-8 w-20" />
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Alias Blacklist</h1>
            <p className="text-gray-500 dark:text-gray-400">Manage restricted aliases for booking pages</p>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add to Blacklist
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Alias to Blacklist</DialogTitle>
                <DialogDescription>
                  Prevent users from creating booking pages with this alias.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="alias">Alias</Label>
                  <Input
                    id="alias"
                    {...register("alias")}
                    placeholder="restricted-alias"
                    className="lowercase"
                  />
                  {errors.alias && (
                    <p className="text-sm text-red-600 mt-1">{errors.alias.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="reason">Reason (optional)</Label>
                  <Textarea
                    id="reason"
                    {...register("reason")}
                    placeholder="Why is this alias restricted?"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={addToBlacklistMutation.isPending}>
                    {addToBlacklistMutation.isPending ? "Adding..." : "Add to Blacklist"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Quick Add Common Aliases */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Add Common Restricted Aliases</CardTitle>
            <CardDescription>
              Add commonly restricted system words and reserved aliases
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {commonBlacklistedAliases
                .filter(alias => !blacklistedAliases?.some((item: AliasBlacklist) => item.alias === alias))
                .slice(0, 10)
                .map((alias) => (
                <Button
                  key={alias}
                  variant="outline"
                  size="sm"
                  onClick={() => addCommonAlias(alias)}
                  disabled={addToBlacklistMutation.isPending}
                >
                  <Ban className="h-3 w-3 mr-1" />
                  {alias}
                </Button>
              ))}
            </div>
            {commonBlacklistedAliases.every(alias => 
              blacklistedAliases?.some((item: AliasBlacklist) => item.alias === alias)
            ) && (
              <p className="text-sm text-gray-500 mt-2">
                All common restricted aliases have been added.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Blacklist Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Blacklisted Aliases</CardTitle>
                <CardDescription>
                  {filteredAliases?.length || 0} restricted aliases
                </CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search aliases..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredAliases && filteredAliases.length > 0 ? (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Alias</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Added</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAliases.map((item: AliasBlacklist) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Badge variant="destructive">
                              <Ban className="h-3 w-3 mr-1" />
                              {item.alias}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.reason ? (
                            <span className="text-sm">{item.reason}</span>
                          ) : (
                            <span className="text-sm text-gray-400 italic">No reason provided</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {formatDate(item.createdAt!)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromBlacklistMutation.mutate(item.alias)}
                            disabled={removeFromBlacklistMutation.isPending}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Ban className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {searchTerm ? "No matching aliases found" : "No blacklisted aliases"}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {searchTerm 
                    ? "Try adjusting your search terms."
                    : "Add aliases to prevent users from creating booking pages with restricted names."
                  }
                </p>
                {!searchTerm && (
                  <Button onClick={() => setIsAddOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Blacklisted Alias
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Warning Notice */}
        <Card className="border-warning-300 bg-warning-50 dark:bg-warning-900/10">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-warning-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-warning-800 dark:text-warning-200">
                  Important Notice
                </h3>
                <p className="text-sm text-warning-700 dark:text-warning-300 mt-1">
                  Blacklisted aliases cannot be used by any user when creating booking pages. 
                  Existing booking pages using these aliases will need to be renamed. 
                  Consider the impact before adding commonly used words.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
