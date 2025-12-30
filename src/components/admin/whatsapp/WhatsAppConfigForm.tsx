"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { whatsappService, WhatsAppConfig } from "@/services/whatsapp.service";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";
import { MessageSquare, Save } from "lucide-react";

export function WhatsAppConfigForm() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [config, setConfig] = useState<Partial<WhatsAppConfig>>({
        enabled: false,
        notificationsEnabled: true,
        botEnabled: false,
        phoneNumberId: "",
        businessAccountId: "",
        accessToken: "",
        webhookVerifyToken: process.env.NEXT_PUBLIC_WHATSAPP_VERIFY_TOKEN || "neutra_whatsapp_verify_token"
    });

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            const data = await whatsappService.getConfig();
            if (data) {
                setConfig({
                    ...data,
                    // Keep existing masks if returned, or handle empty
                });
            }
        } catch (err) {
            console.error("Failed to load configs", err);
            toast.error("Failed to load WhatsApp configuration");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await whatsappService.updateConfig(config);
            toast.success("Configuration saved successfully");
            await loadConfig(); // Reload to get confirmed state
        } catch (err: any) {
            const message = err instanceof ApiError ? err.message : "Failed to save configuration";
            toast.error(message);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="p-8 flex justify-center"><Spinner /></div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <MessageSquare className="h-6 w-6 text-green-600" />
                        <div>
                            <CardTitle>WhatsApp Business API</CardTitle>
                            <CardDescription>Configure your WhatsApp integration for notifications and bot.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Status Toggles */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-muted/20 rounded-lg">
                        <div className="flex flex-col space-y-2">
                            <Label className="text-base">Integration Status</Label>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    checked={config.enabled}
                                    onCheckedChange={(c) => setConfig({ ...config, enabled: c })}
                                />
                                <span className="text-sm text-muted-foreground">{config.enabled ? "Active" : "Inactive"}</span>
                            </div>
                        </div>
                        <div className="flex flex-col space-y-2">
                            <Label className="text-base">Notifications</Label>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    checked={config.notificationsEnabled}
                                    onCheckedChange={(c) => setConfig({ ...config, notificationsEnabled: c })}
                                />
                                <span className="text-sm text-muted-foreground">{config.notificationsEnabled ? "Enabled" : "Disabled"}</span>
                            </div>
                        </div>
                        <div className="flex flex-col space-y-2">
                            <Label className="text-base">Bot / Auto-Reply</Label>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    checked={config.botEnabled}
                                    onCheckedChange={(c) => setConfig({ ...config, botEnabled: c })}
                                />
                                <span className="text-sm text-muted-foreground">{config.botEnabled ? "Enabled" : "Disabled"}</span>
                            </div>
                        </div>
                    </div>

                    {/* API Credentials */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">API Credentials</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Phone Number ID</Label>
                                <Input
                                    value={config.phoneNumberId || ""}
                                    onChange={(e) => setConfig({ ...config, phoneNumberId: e.target.value })}
                                    placeholder="e.g. 1045..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Business Account ID</Label>
                                <Input
                                    value={config.businessAccountId || ""}
                                    onChange={(e) => setConfig({ ...config, businessAccountId: e.target.value })}
                                    placeholder="e.g. 1015..."
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Access Token (Permanent)</Label>
                            < Input
                                type="password"
                                value={config.accessToken || ""}
                                onChange={(e) => setConfig({ ...config, accessToken: e.target.value })}
                                placeholder="****************"
                            />
                            <p className="text-xs text-muted-foreground">Only update if generating a new token. Old token is masked.</p>
                        </div>
                    </div>

                    {/* Webhook Config */}
                    <div className="space-y-4 pt-4 border-t">
                        <h3 className="text-lg font-medium">Webhook Configuration</h3>
                        <div className="space-y-2">
                            <Label>Verify Token</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={config.webhookVerifyToken || ""}
                                    readOnly
                                    className="bg-muted"
                                />
                                <Button variant="outline" size="sm" onClick={() => {
                                    navigator.clipboard.writeText(config.webhookVerifyToken || "");
                                    toast.success("Copied to clipboard");
                                }}>Copy</Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Use this token in your Meta App Dashboard &gt; WhatsApp &gt; Configuration &gt; Webhook
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label>Callback URL</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/whatsapp`}
                                    readOnly
                                    className="bg-muted"
                                />
                                <Button variant="outline" size="sm" onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/api/webhooks/whatsapp`);
                                    toast.success("Copied to clipboard");
                                }}>Copy</Button>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-6">
                        <Button onClick={handleSave} disabled={isSaving} className="w-full md:w-auto">
                            {isSaving ? <><Spinner className="mr-2" /> Saving...</> : <><Save className="mr-2 h-4 w-4" /> Save Configuration</>}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
