"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
    Save, Shield, Bell, Globe, Key, Lock, Clock,
    Mail, Webhook, Zap, Eye, EyeOff, Copy, Check
} from "lucide-react";

export default function AdminSettingsPage() {
    const [saved, setSaved] = useState(false);
    const [showApiKey, setShowApiKey] = useState(false);
    const [copiedKey, setCopiedKey] = useState(false);

    // General
    const [appName, setAppName] = useState("Arcpedia");
    const [tagline, setTagline] = useState("Enterprise AI Learning Platform");
    const [supportEmail, setSupportEmail] = useState("support@arcpedia.edu");
    const [timezone, setTimezone] = useState("Asia/Kolkata (UTC+5:30)");
    const [language, setLanguage] = useState("English");

    // Security
    const [sessionTimeout, setSessionTimeout] = useState("30");
    const [minPasswordLength, setMinPasswordLength] = useState("8");
    const [requireSpecialChars, setRequireSpecialChars] = useState(true);
    const [requireUppercase, setRequireUppercase] = useState(true);
    const [enable2FA, setEnable2FA] = useState(false);
    const [ipWhitelist, setIpWhitelist] = useState("");

    // Notifications
    const [emailNewUser, setEmailNewUser] = useState(true);
    const [emailSystemAlerts, setEmailSystemAlerts] = useState(true);
    const [emailWeeklyDigest, setEmailWeeklyDigest] = useState(false);
    const [inAppNotifications, setInAppNotifications] = useState(true);
    const [emailLoginAlerts, setEmailLoginAlerts] = useState(true);
    const [slackIntegration, setSlackIntegration] = useState(false);

    // Integrations
    const apiKey = "arc_sk_7f3a9b2c4d5e6f1a8b9c0d1e2f3a4b5c";
    const [webhookUrl, setWebhookUrl] = useState("https://hooks.arcpedia.edu/events");
    const [geminiEnabled, setGeminiEnabled] = useState(true);
    const [firebaseEnabled, setFirebaseEnabled] = useState(true);
    const [analyticsEnabled, setAnalyticsEnabled] = useState(true);

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleCopyKey = () => {
        navigator.clipboard.writeText(apiKey);
        setCopiedKey(true);
        setTimeout(() => setCopiedKey(false), 2000);
    };

    const fadeIn = {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3 }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-headline">Platform Settings</h1>
                    <p className="text-muted-foreground">Configure global application preferences and security policies.</p>
                </div>
                <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
                    {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                    {saved ? "Saved!" : "Save All Changes"}
                </Button>
            </div>

            <Tabs defaultValue="general" className="space-y-6">
                <TabsList className="bg-white/5 border border-white/10 p-1">
                    <TabsTrigger value="general" className="gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                        <Globe className="h-4 w-4" /> General
                    </TabsTrigger>
                    <TabsTrigger value="security" className="gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                        <Shield className="h-4 w-4" /> Security
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                        <Bell className="h-4 w-4" /> Notifications
                    </TabsTrigger>
                    <TabsTrigger value="integrations" className="gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                        <Key className="h-4 w-4" /> Integrations
                    </TabsTrigger>
                </TabsList>

                {/* ===================== GENERAL ===================== */}
                <TabsContent value="general">
                    <motion.div {...fadeIn} className="grid gap-6">
                        <Card className="bg-black/20 border-white/5 backdrop-blur-xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Globe className="h-5 w-5 text-indigo-400" />
                                    General Configuration
                                </CardTitle>
                                <CardDescription>Core application identity and localization settings.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="app-name">Application Name</Label>
                                        <Input id="app-name" value={appName} onChange={e => setAppName(e.target.value)} className="bg-white/5 border-white/10" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="tagline">Tagline</Label>
                                        <Input id="tagline" value={tagline} onChange={e => setTagline(e.target.value)} className="bg-white/5 border-white/10" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="support-email">Support Email</Label>
                                        <Input id="support-email" type="email" value={supportEmail} onChange={e => setSupportEmail(e.target.value)} className="bg-white/5 border-white/10" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="timezone">Default Timezone</Label>
                                        <Input id="timezone" value={timezone} onChange={e => setTimezone(e.target.value)} className="bg-white/5 border-white/10" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="language">Default Language</Label>
                                        <Input id="language" value={language} onChange={e => setLanguage(e.target.value)} className="bg-white/5 border-white/10" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-black/20 border-white/5 backdrop-blur-xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Zap className="h-5 w-5 text-amber-400" />
                                    System Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {[
                                        { label: "Version", value: "3.0.1" },
                                        { label: "Environment", value: "Production" },
                                        { label: "Last Deploy", value: "Feb 20, 2026" },
                                        { label: "Uptime", value: "99.97%" },
                                    ].map(item => (
                                        <div key={item.label} className="p-4 rounded-xl bg-white/5 border border-white/5">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{item.label}</p>
                                            <p className="font-semibold text-lg">{item.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </TabsContent>

                {/* ===================== SECURITY ===================== */}
                <TabsContent value="security">
                    <motion.div {...fadeIn} className="grid gap-6">
                        <Card className="bg-black/20 border-white/5 backdrop-blur-xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Lock className="h-5 w-5 text-red-400" />
                                    Session & Authentication
                                </CardTitle>
                                <CardDescription>Control how users authenticate and session lifetimes.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                                        <Input id="session-timeout" type="number" value={sessionTimeout} onChange={e => setSessionTimeout(e.target.value)} className="bg-white/5 border-white/10" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="ip-whitelist">IP Whitelist (comma-separated)</Label>
                                        <Input id="ip-whitelist" placeholder="e.g. 192.168.1.0/24, 10.0.0.1" value={ipWhitelist} onChange={e => setIpWhitelist(e.target.value)} className="bg-white/5 border-white/10" />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                                    <div className="space-y-0.5">
                                        <p className="font-medium">Two-Factor Authentication</p>
                                        <p className="text-sm text-muted-foreground">Require 2FA for all admin and teacher accounts</p>
                                    </div>
                                    <Switch checked={enable2FA} onCheckedChange={setEnable2FA} />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-black/20 border-white/5 backdrop-blur-xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="h-5 w-5 text-indigo-400" />
                                    Password Policy
                                </CardTitle>
                                <CardDescription>Define minimum password requirements for all users.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2 max-w-xs">
                                    <Label htmlFor="min-pw-len">Minimum Password Length</Label>
                                    <Input id="min-pw-len" type="number" value={minPasswordLength} onChange={e => setMinPasswordLength(e.target.value)} className="bg-white/5 border-white/10" />
                                </div>
                                <div className="space-y-3">
                                    {[
                                        { label: "Require special characters (@, #, $, etc.)", checked: requireSpecialChars, onChange: setRequireSpecialChars },
                                        { label: "Require at least one uppercase letter", checked: requireUppercase, onChange: setRequireUppercase },
                                    ].map(item => (
                                        <div key={item.label} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                                            <p className="text-sm font-medium">{item.label}</p>
                                            <Switch checked={item.checked} onCheckedChange={item.onChange} />
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </TabsContent>

                {/* ===================== NOTIFICATIONS ===================== */}
                <TabsContent value="notifications">
                    <motion.div {...fadeIn} className="grid gap-6">
                        <Card className="bg-black/20 border-white/5 backdrop-blur-xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Mail className="h-5 w-5 text-cyan-400" />
                                    Email Notifications
                                </CardTitle>
                                <CardDescription>Configure which events trigger email notifications.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {[
                                    { label: "New user registration", desc: "Receive an email when a new user account is created", checked: emailNewUser, onChange: setEmailNewUser },
                                    { label: "System alerts & errors", desc: "Critical system events and error notifications", checked: emailSystemAlerts, onChange: setEmailSystemAlerts },
                                    { label: "Weekly digest report", desc: "Summary of platform activity every Monday", checked: emailWeeklyDigest, onChange: setEmailWeeklyDigest },
                                    { label: "Suspicious login alerts", desc: "Email when a login attempt from new device/location", checked: emailLoginAlerts, onChange: setEmailLoginAlerts },
                                ].map(item => (
                                    <div key={item.label} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                                        <div className="space-y-0.5">
                                            <p className="font-medium text-sm">{item.label}</p>
                                            <p className="text-xs text-muted-foreground">{item.desc}</p>
                                        </div>
                                        <Switch checked={item.checked} onCheckedChange={item.onChange} />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card className="bg-black/20 border-white/5 backdrop-blur-xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Bell className="h-5 w-5 text-violet-400" />
                                    In-App & Integrations
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {[
                                    { label: "In-app push notifications", desc: "Show real-time notifications inside the dashboard", checked: inAppNotifications, onChange: setInAppNotifications },
                                    { label: "Slack channel integration", desc: "Forward critical alerts to a Slack channel", checked: slackIntegration, onChange: setSlackIntegration },
                                ].map(item => (
                                    <div key={item.label} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                                        <div className="space-y-0.5">
                                            <p className="font-medium text-sm">{item.label}</p>
                                            <p className="text-xs text-muted-foreground">{item.desc}</p>
                                        </div>
                                        <Switch checked={item.checked} onCheckedChange={item.onChange} />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </motion.div>
                </TabsContent>

                {/* ===================== INTEGRATIONS ===================== */}
                <TabsContent value="integrations">
                    <motion.div {...fadeIn} className="grid gap-6">
                        <Card className="bg-black/20 border-white/5 backdrop-blur-xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Key className="h-5 w-5 text-amber-400" />
                                    API Configuration
                                </CardTitle>
                                <CardDescription>Manage your platform API key and webhook endpoints.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label>Platform API Key</Label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Input
                                                readOnly
                                                value={showApiKey ? apiKey : "arc_sk_••••••••••••••••••••••••"}
                                                className="bg-white/5 border-white/10 pr-20 font-mono text-sm"
                                            />
                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowApiKey(!showApiKey)}>
                                                    {showApiKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopyKey}>
                                                    {copiedKey ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                                                </Button>
                                            </div>
                                        </div>
                                        <Button variant="outline" className="border-white/10">Regenerate</Button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="webhook-url">Webhook Endpoint URL</Label>
                                    <div className="flex gap-2">
                                        <Input id="webhook-url" value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} className="bg-white/5 border-white/10 font-mono text-sm flex-1" />
                                        <Button variant="outline" className="border-white/10 gap-2">
                                            <Webhook className="h-4 w-4" /> Test
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-black/20 border-white/5 backdrop-blur-xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Zap className="h-5 w-5 text-emerald-400" />
                                    Connected Services
                                </CardTitle>
                                <CardDescription>Manage third-party service integrations.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {[
                                    { label: "Google Gemini AI", desc: "Powers AI Assistant, quiz generation, and smart tutoring", enabled: geminiEnabled, onChange: setGeminiEnabled, color: "text-blue-400" },
                                    { label: "Firebase / Firestore", desc: "Primary database, authentication, and real-time sync", enabled: firebaseEnabled, onChange: setFirebaseEnabled, color: "text-amber-400" },
                                    { label: "Analytics Engine", desc: "Student engagement tracking and performance metrics", enabled: analyticsEnabled, onChange: setAnalyticsEnabled, color: "text-emerald-400" },
                                ].map(svc => (
                                    <div key={svc.label} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 group hover:bg-white/[0.07] transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center">
                                                <Zap className={`h-5 w-5 ${svc.color}`} />
                                            </div>
                                            <div className="space-y-0.5">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium text-sm">{svc.label}</p>
                                                    <Badge variant="outline" className={svc.enabled ? "border-emerald-500/20 text-emerald-400 text-[10px]" : "border-white/10 text-muted-foreground text-[10px]"}>
                                                        {svc.enabled ? "Active" : "Disabled"}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground">{svc.desc}</p>
                                            </div>
                                        </div>
                                        <Switch checked={svc.enabled} onCheckedChange={svc.onChange} />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </motion.div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
