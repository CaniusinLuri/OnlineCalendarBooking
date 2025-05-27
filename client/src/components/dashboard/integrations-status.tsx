import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, ExternalLink, AlertTriangle } from "lucide-react";
import { SiGoogle, SiMicrosoft, SiApple } from "react-icons/si";

interface Integration {
  id: string;
  name: string;
  provider: string;
  icon: React.ComponentType<{ className?: string }>;
  isConnected: boolean;
  lastSync?: Date;
  hasError?: boolean;
  errorMessage?: string;
}

export default function IntegrationsStatus() {
  // Mock data - in real app this would come from props or query
  const integrations: Integration[] = [
    {
      id: "1",
      name: "Google Calendar",
      provider: "google",
      icon: SiGoogle,
      isConnected: true,
      lastSync: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
    },
    {
      id: "2",
      name: "Microsoft Outlook",
      provider: "microsoft",
      icon: SiMicrosoft,
      isConnected: true,
      lastSync: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    },
    {
      id: "3",
      name: "Apple Calendar",
      provider: "apple",
      icon: SiApple,
      isConnected: false,
      hasError: true,
      errorMessage: "Connection expired",
    },
  ];

  const getStatusBadge = (integration: Integration) => {
    if (integration.hasError) {
      return (
        <Badge variant="destructive" className="text-xs">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Error
        </Badge>
      );
    }
    
    if (integration.isConnected) {
      return (
        <Badge variant="default" className="bg-success-500 text-xs">
          <RefreshCw className="h-3 w-3 mr-1" />
          Connected
        </Badge>
      );
    }
    
    return (
      <Badge variant="secondary" className="text-xs">
        Disconnected
      </Badge>
    );
  };

  const getLastSyncText = (integration: Integration) => {
    if (!integration.lastSync) return null;
    
    const now = new Date();
    const diffMs = now.getTime() - integration.lastSync.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const handleConnect = (integration: Integration) => {
    // TODO: Implement OAuth flow for calendar connections
    console.log(`Connecting to ${integration.provider}...`);
  };

  const handleDisconnect = (integration: Integration) => {
    // TODO: Implement disconnection
    console.log(`Disconnecting from ${integration.provider}...`);
  };

  const handleReconnect = (integration: Integration) => {
    // TODO: Implement reconnection
    console.log(`Reconnecting to ${integration.provider}...`);
  };

  return (
    <Card className="card-shadow">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Calendar Integrations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {integrations.map((integration) => {
          const Icon = integration.icon;
          
          return (
            <div
              key={integration.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 flex items-center justify-center">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">{integration.name}</span>
                    {getStatusBadge(integration)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {integration.hasError ? (
                      <span className="text-red-600">{integration.errorMessage}</span>
                    ) : integration.isConnected && integration.lastSync ? (
                      `Last sync: ${getLastSyncText(integration)}`
                    ) : (
                      "Not connected"
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {integration.hasError ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReconnect(integration)}
                  >
                    Reconnect
                  </Button>
                ) : integration.isConnected ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDisconnect(integration)}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleConnect(integration)}
                  >
                    Connect
                  </Button>
                )}
              </div>
            </div>
          );
        })}
        
        {/* Add New Integration */}
        <div className="pt-3 border-t">
          <Button variant="outline" className="w-full" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Add New Integration
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
