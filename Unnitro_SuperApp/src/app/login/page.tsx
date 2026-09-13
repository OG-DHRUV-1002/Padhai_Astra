"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Loader2, Mail, Lock, Eye, EyeOff, User, CheckCircle,
    AlertCircle, GraduationCap, BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog-shadcn";
import { useAuth, DEFAULT_ACCOUNTS } from "@/context/student-context";
import { UserRole } from "@/lib/types";

// ──────── Validation Utilities ────────
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface PasswordRule {
    label: string;
    test: (pw: string) => boolean;
}

const PASSWORD_RULES: PasswordRule[] = [
    { label: "At least 8 characters", test: pw => pw.length >= 8 },
    { label: "One uppercase letter", test: pw => /[A-Z]/.test(pw) },
    { label: "One lowercase letter", test: pw => /[a-z]/.test(pw) },
    { label: "One digit", test: pw => /\d/.test(pw) },
    { label: "One special character (@$!%*?&#)", test: pw => /[@$!%*?&#]/.test(pw) },
];

const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" className="h-4 w-4">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

export default function LoginPage() {
    const router = useRouter();
    const { login, mockLogin, googleLogin, register } = useAuth();

    // Login state
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [loadingRole, setLoadingRole] = useState<UserRole | null>(null);

    // Register state
    const [regName, setRegName] = useState("");
    const [regEmail, setRegEmail] = useState("");
    const [regPassword, setRegPassword] = useState("");
    const [showRegPassword, setShowRegPassword] = useState(false);
    const [regRole, setRegRole] = useState<"student" | "teacher">("student");
    const [regError, setRegError] = useState("");
    const [regLoading, setRegLoading] = useState(false);

    // Google role picker dialog
    const [googleRoleDialogOpen, setGoogleRoleDialogOpen] = useState(false);
    const [googleRoleLoading, setGoogleRoleLoading] = useState(false);

    const navigateByRole = (role: UserRole) => {
        if (role === "admin") router.push("/admin/dashboard");
        else if (role === "teacher") router.push("/faculty/dashboard");
        else router.push("/student/dashboard");
    };

    // ─── Login ───
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!email || !password) { setError("Please fill in all fields."); return; }
        setIsLoading(true);
        const role = await login(email, password);
        setIsLoading(false);
        if (role) navigateByRole(role);
        else setError("Invalid email or password.");
    };

    const handleQuickLogin = async (role: UserRole) => {
        setLoadingRole(role);
        navigateByRole(role);
        setLoadingRole(null);
    };

    // ─── Google Sign-In ───
    const handleGoogleClick = () => {
        setError("");
        setGoogleRoleDialogOpen(true);
    };

    const handleGoogleWithRole = async (selectedRole: "student" | "teacher") => {
        setGoogleRoleLoading(true);
        try {
            const role = await googleLogin(selectedRole);
            setGoogleRoleDialogOpen(false);
            if (role) navigateByRole(role);
            else setError("Google sign-in failed. Please try again.");
        } catch (e) {
            setError("Google sign-in failed.");
        } finally {
            setGoogleRoleLoading(false);
        }
    };

    // ─── Register ───
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setRegError("");
        if (!regName || !regEmail || !regPassword) {
            setRegError("Please fill in all fields.");
            return;
        }
        if (!EMAIL_REGEX.test(regEmail)) {
            setRegError("Please enter a valid email address.");
            return;
        }
        const failedRules = PASSWORD_RULES.filter(r => !r.test(regPassword));
        if (failedRules.length > 0) {
            setRegError("Password does not meet all requirements.");
            return;
        }
        setRegLoading(true);
        try {
            const role = await register(regEmail, regPassword, regName, regRole);
            if (role) navigateByRole(role);
        } catch (err: any) {
            if (err?.code === "auth/email-already-in-use") {
                setRegError("An account with this email already exists.");
            } else {
                setRegError(err?.message || "Registration failed.");
            }
        } finally {
            setRegLoading(false);
        }
    };

    const emailValid = regEmail.length === 0 || EMAIL_REGEX.test(regEmail);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-lg relative z-10"
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                        Unnitro SuperApp
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">Unified Campus & Learning Platform</p>
                </div>

                {/* Quick Login */}
                <div className="grid grid-cols-3 gap-2 mb-6">
                    {(["admin", "teacher", "student"] as UserRole[]).map(role => (
                        <Button
                            key={role === 'teacher' ? 'faculty' : role}
                            variant="outline"
                            size="sm"
                            disabled={!!loadingRole}
                            onClick={() => handleQuickLogin(role)}
                            className="bg-white/5 border-white/10 hover:bg-white/10 text-xs capitalize group transition-all"
                        >
                            {loadingRole === role ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                            ) : (
                                <User className="h-3.5 w-3.5 mr-1.5 text-muted-foreground group-hover:text-foreground" />
                            )}
                            {role === 'teacher' ? 'faculty' : role}
                        </Button>
                    ))}
                </div>

                <Card className="bg-white/[0.04] backdrop-blur-xl border-white/10 shadow-2xl">
                    <Tabs defaultValue="login" className="w-full">
                        <CardHeader className="pb-2">
                            <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10">
                                <TabsTrigger value="login" className="text-sm">Sign In</TabsTrigger>
                                <TabsTrigger value="register" className="text-sm">Create Account</TabsTrigger>
                            </TabsList>
                        </CardHeader>

                        {/* ───── SIGN IN TAB ───── */}
                        <TabsContent value="login">
                            <CardContent className="space-y-4">
                                <form onSubmit={handleLogin} className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="email" className="text-sm text-muted-foreground flex items-center gap-1.5">
                                            <Mail className="h-3.5 w-3.5" /> Email
                                        </Label>
                                        <Input
                                            id="email" type="email" value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            placeholder="name@university.edu"
                                            className="bg-white/5 border-white/10 h-11"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="password" className="text-sm text-muted-foreground flex items-center gap-1.5">
                                            <Lock className="h-3.5 w-3.5" /> Password
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={e => setPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="bg-white/5 border-white/10 h-11 pr-10"
                                            />
                                            <Button type="button" variant="ghost" size="icon"
                                                className="absolute right-1 top-1 h-9 w-9 text-muted-foreground hover:text-foreground"
                                                onClick={() => setShowPassword(!showPassword)}>
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    </div>

                                    {error && (
                                        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                                            className="text-red-400 text-sm flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 p-2.5 rounded-lg">
                                            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                                        </motion.div>
                                    )}

                                    <Button type="submit" disabled={isLoading}
                                        className="w-full h-11 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold shadow-lg shadow-indigo-900/30">
                                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                        Sign In
                                    </Button>
                                </form>

                                <div className="relative my-2">
                                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
                                    <div className="relative flex justify-center text-xs uppercase text-muted-foreground"><span className="bg-background px-3">or</span></div>
                                </div>

                                <Button variant="outline" className="w-full h-11 bg-white/5 border-white/10 hover:bg-white/10 gap-2"
                                    onClick={handleGoogleClick} disabled={isLoading}>
                                    <GoogleIcon /> Sign in with Google
                                </Button>

                                <p className="text-[10px] text-center text-muted-foreground/50 mt-3">
                                    Quick logins above use demo accounts — or sign in with your credentials
                                </p>
                            </CardContent>
                        </TabsContent>

                        {/* ───── REGISTER TAB ───── */}
                        <TabsContent value="register">
                            <CardContent className="space-y-4">
                                <form onSubmit={handleRegister} className="space-y-4">
                                    {/* ─── ROLE SELECTOR ─── */}
                                    <div className="grid gap-2">
                                        <Label className="text-sm text-muted-foreground">I am a...</Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setRegRole("student")}
                                                className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-medium ${regRole === "student"
                                                    ? "border-indigo-500 bg-indigo-500/15 text-indigo-300 shadow-lg shadow-indigo-900/20"
                                                    : "border-white/10 bg-white/[0.02] text-muted-foreground hover:bg-white/5 hover:border-white/20"
                                                    }`}
                                            >
                                                <GraduationCap className="h-5 w-5" />
                                                Student
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setRegRole("teacher")}
                                                className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-medium ${regRole === "teacher"
                                                    ? "border-emerald-500 bg-emerald-500/15 text-emerald-300 shadow-lg shadow-emerald-900/20"
                                                    : "border-white/10 bg-white/[0.02] text-muted-foreground hover:bg-white/5 hover:border-white/20"
                                                    }`}
                                            >
                                                <BookOpen className="h-5 w-5" />
                                                Teacher
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="reg-name" className="text-sm text-muted-foreground flex items-center gap-1.5">
                                            <User className="h-3.5 w-3.5" /> Full Name
                                        </Label>
                                        <Input id="reg-name" value={regName}
                                            onChange={e => setRegName(e.target.value)}
                                            placeholder="e.g. Jane Doe"
                                            className="bg-white/5 border-white/10 h-11" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="reg-email" className="text-sm text-muted-foreground flex items-center gap-1.5">
                                            <Mail className="h-3.5 w-3.5" /> Email
                                        </Label>
                                        <Input id="reg-email" type="email" value={regEmail}
                                            onChange={e => setRegEmail(e.target.value)}
                                            placeholder="name@university.edu"
                                            className={`bg-white/5 border-white/10 h-11 ${!emailValid ? "border-red-500/50" : ""}`} />
                                        {!emailValid && (
                                            <p className="text-xs text-red-400 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" /> Invalid email format
                                            </p>
                                        )}
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="reg-password" className="text-sm text-muted-foreground flex items-center gap-1.5">
                                            <Lock className="h-3.5 w-3.5" /> Password
                                        </Label>
                                        <div className="relative">
                                            <Input id="reg-password"
                                                type={showRegPassword ? "text" : "password"}
                                                value={regPassword}
                                                onChange={e => setRegPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="bg-white/5 border-white/10 h-11 pr-10" />
                                            <Button type="button" variant="ghost" size="icon"
                                                className="absolute right-1 top-1 h-9 w-9 text-muted-foreground hover:text-foreground"
                                                onClick={() => setShowRegPassword(!showRegPassword)}>
                                                {showRegPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                        {regPassword.length > 0 && (
                                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1 mt-1">
                                                {PASSWORD_RULES.map(rule => {
                                                    const passes = rule.test(regPassword);
                                                    return (
                                                        <div key={rule.label} className={`text-[11px] flex items-center gap-1.5 ${passes ? "text-emerald-400" : "text-muted-foreground"}`}>
                                                            {passes ? <CheckCircle className="h-3 w-3" /> : <div className="h-3 w-3 rounded-full border border-white/20" />}
                                                            {rule.label}
                                                        </div>
                                                    );
                                                })}
                                            </motion.div>
                                        )}
                                    </div>

                                    {regError && (
                                        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                                            className="text-red-400 text-sm flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 p-2.5 rounded-lg">
                                            <AlertCircle className="h-4 w-4 shrink-0" /> {regError}
                                        </motion.div>
                                    )}

                                    <Button type="submit" disabled={regLoading}
                                        className={`w-full h-11 text-white font-semibold shadow-lg ${regRole === "teacher"
                                            ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-900/30"
                                            : "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-indigo-900/30"
                                            }`}>
                                        {regLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                        Create {regRole === "teacher" ? "Teacher" : "Student"} Account
                                    </Button>
                                </form>

                                <div className="relative my-2">
                                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
                                    <div className="relative flex justify-center text-xs uppercase text-muted-foreground"><span className="bg-background px-3">or</span></div>
                                </div>

                                <Button variant="outline" className="w-full h-11 bg-white/5 border-white/10 hover:bg-white/10 gap-2"
                                    onClick={handleGoogleClick} disabled={regLoading}>
                                    <GoogleIcon /> Sign up with Google
                                </Button>
                            </CardContent>
                        </TabsContent>
                    </Tabs>
                </Card>

                <p className="text-center text-xs text-muted-foreground/40 mt-6">
                    © {new Date().getFullYear()} Unnitro SuperApp · Unified Campus Platform
                </p>
            </motion.div>

            {/* ───── GOOGLE ROLE PICKER DIALOG ───── */}
            <Dialog open={googleRoleDialogOpen} onOpenChange={setGoogleRoleDialogOpen}>
                <DialogContent className="sm:max-w-[400px] bg-[hsl(224_71%_4%)] border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-center text-xl font-headline">Sign in with Google</DialogTitle>
                        <DialogDescription className="text-center text-slate-400">
                            Choose your role to get started
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-6">
                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            disabled={googleRoleLoading}
                            onClick={() => handleGoogleWithRole("student")}
                            className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 hover:border-indigo-500/50 transition-all group disabled:opacity-50"
                        >
                            <div className="h-14 w-14 rounded-full bg-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-500/30 transition-colors">
                                <GraduationCap className="h-7 w-7 text-indigo-400" />
                            </div>
                            <span className="font-semibold text-indigo-300">Student</span>
                            <span className="text-[10px] text-slate-400 text-center leading-tight">
                                Access courses, grades & learning tools
                            </span>
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            disabled={googleRoleLoading}
                            onClick={() => handleGoogleWithRole("teacher")}
                            className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all group disabled:opacity-50"
                        >
                            <div className="h-14 w-14 rounded-full bg-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/30 transition-colors">
                                <BookOpen className="h-7 w-7 text-emerald-400" />
                            </div>
                            <span className="font-semibold text-emerald-300">Teacher</span>
                            <span className="text-[10px] text-slate-400 text-center leading-tight">
                                Manage classes, quizzes & students
                            </span>
                        </motion.button>
                    </div>
                    {googleRoleLoading && (
                        <div className="flex items-center justify-center gap-2 text-indigo-400 pb-4">
                            <Loader2 className="h-4 w-4 animate-spin" /> Opening Google Sign-In...
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}



