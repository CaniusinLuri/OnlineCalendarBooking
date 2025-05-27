import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Shield, Smartphone, Copy, Check, AlertTriangle } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface TwoFactorSetupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TwoFactorSetup({ open, onOpenChange }: TwoFactorSetupProps) {
  const [step, setStep] = useState<"setup" | "verify" | "complete">("setup");
  const [qrCode, setQrCode] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackup, setCopiedBackup] = useState(false);
  
  const { user, updateUser } = useAuth();
  const { toast } = useToast();

  const setupTwoFactorMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/2fa/setup");
      return response.json();
    },
    onSuccess: (data) => {
      setQrCode(data.qrCode);
      setSecretKey(data.secret);
      setStep("verify");
    },
    onError: () => {
      toast({
        title: "Setup failed",
        description: "Unable to set up 2FA. Please try again.",
        variant: "destructive",
      });
    },
  });

  const verifyTwoFactorMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest("POST", "/api/auth/2fa/verify", { code });
      return response.json();
    },
    onSuccess: (data) => {
      setBackupCodes(data.backupCodes || []);
      setStep("complete");
      updateUser({ twoFactorEnabled: true });
      toast({
        title: "2FA enabled",
        description: "Two-factor authentication has been successfully enabled.",
      });
    },
    onError: () => {
      toast({
        title: "Verification failed",
        description: "Invalid verification code. Please try again.",
        variant: "destructive",
      });
    },
  });

  const disableTwoFactorMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest("POST", "/api/auth/2fa/disable", { code });
      return response.json();
    },
    onSuccess: () => {
      updateUser({ twoFactorEnabled: false });
      onOpenChange(false);
      toast({
        title: "2FA disabled",
        description: "Two-factor authentication has been disabled.",
      });
    },
    onError: () => {
      toast({
        title: "Disable failed",
        description: "Invalid verification code. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSetup = () => {
    setupTwoFactorMutation.mutate();
  };

  const handleVerify = () => {
    if (verificationCode.length === 6) {
      verifyTwoFactorMutation.mutate(verificationCode);
    }
  };

  const handleDisable = () => {
    if (verificationCode.length === 6) {
      disableTwoFactorMutation.mutate(verificationCode);
    }
  };

  const copyToClipboard = async (text: string, type: "secret" | "backup") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "secret") {
        setCopiedSecret(true);
        setTimeout(() => setCopiedSecret(false), 2000);
      } else {
        setCopiedBackup(true);
        setTimeout(() => setCopiedBackup(false), 2000);
      }
      toast({
        title: "Copied to clipboard",
        description: `${type === "secret" ? "Secret key" : "Backup codes"} copied successfully.`,
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setStep("setup");
    setQrCode("");
    setSecretKey("");
    setVerificationCode("");
    setBackupCodes([]);
    setCopiedSecret(false);
    setCopiedBackup(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-primary" />
            <span>Two-Factor Authentication</span>
          </DialogTitle>
          <DialogDescription>
            {user?.twoFactorEnabled
              ? "Manage your two-factor authentication settings"
              : "Add an extra layer of security to your account"
            }
          </DialogDescription>
        </DialogHeader>

        {/* Current Status for Enabled 2FA */}
        {user?.twoFactorEnabled && step === "setup" && (
          <div className="space-y-4">
            <div className="flex items-center justify-center p-4 bg-success-50 dark:bg-success-900/20 rounded-lg">
              <div className="text-center">
                <Shield className="h-8 w-8 text-success-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-success-800 dark:text-success-200">
                  2FA is currently enabled
                </p>
                <p className="text-xs text-success-600 dark:text-success-300 mt-1">
                  Your account is protected with two-factor authentication
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="disableCode">Enter 2FA code to disable</Label>
                <InputOTP
                  value={verificationCode}
                  onChange={setVerificationCode}
                  maxLength={6}
                  className="mt-2"
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDisable}
                  disabled={verificationCode.length !== 6 || disableTwoFactorMutation.isPending}
                  variant="destructive"
                  className="flex-1"
                >
                  {disableTwoFactorMutation.isPending ? "Disabling..." : "Disable 2FA"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Setup Flow for New 2FA */}
        {!user?.twoFactorEnabled && (
          <>
            {/* Step 1: Setup */}
            {step === "setup" && (
              <div className="space-y-4">
                <div className="text-center">
                  <Smartphone className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Set up 2FA</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Use an authenticator app like Google Authenticator or Authy to generate verification codes.
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Before you start:
                  </h4>
                  <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• Download an authenticator app on your phone</li>
                    <li>• Keep your phone nearby for the setup process</li>
                    <li>• Save the backup codes in a secure location</li>
                  </ul>
                </div>

                <div className="flex space-x-2">
                  <Button variant="outline" onClick={handleClose} className="flex-1">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSetup}
                    disabled={setupTwoFactorMutation.isPending}
                    className="flex-1"
                  >
                    {setupTwoFactorMutation.isPending ? "Setting up..." : "Start Setup"}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Verify */}
            {step === "verify" && (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-medium mb-2">Scan QR Code</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Scan this QR code with your authenticator app
                  </p>

                  {/* Mock QR Code */}
                  <div className="w-48 h-48 bg-gray-100 dark:bg-gray-800 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-32 h-32 bg-white dark:bg-gray-700 rounded grid grid-cols-8 gap-1 p-2">
                        {Array.from({ length: 64 }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-full h-full ${
                              Math.random() > 0.5 ? "bg-black" : "bg-white"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">QR Code</p>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Can't scan? Enter this key manually:</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <Input
                      value={secretKey}
                      readOnly
                      className="font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(secretKey, "secret")}
                    >
                      {copiedSecret ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label>Enter the 6-digit code from your app</Label>
                  <InputOTP
                    value={verificationCode}
                    onChange={setVerificationCode}
                    maxLength={6}
                    className="mt-2"
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <div className="flex space-x-2">
                  <Button variant="outline" onClick={handleClose} className="flex-1">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleVerify}
                    disabled={verificationCode.length !== 6 || verifyTwoFactorMutation.isPending}
                    className="flex-1"
                  >
                    {verifyTwoFactorMutation.isPending ? "Verifying..." : "Verify & Enable"}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Complete */}
            {step === "complete" && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="h-8 w-8 text-success-600" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">2FA Enabled Successfully!</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Your account is now protected with two-factor authentication.
                  </p>
                </div>

                {backupCodes.length > 0 && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-2 mb-3">
                        <AlertTriangle className="h-4 w-4 text-warning-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="text-sm font-medium">Save Your Backup Codes</h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Store these codes safely. You can use them to access your account if you lose your phone.
                          </p>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded font-mono text-xs">
                        {backupCodes.map((code, index) => (
                          <div key={index}>{code}</div>
                        ))}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(backupCodes.join("\n"), "backup")}
                        className="w-full mt-3"
                      >
                        {copiedBackup ? (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Backup Codes
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )}

                <Button onClick={handleClose} className="w-full">
                  Done
                </Button>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
