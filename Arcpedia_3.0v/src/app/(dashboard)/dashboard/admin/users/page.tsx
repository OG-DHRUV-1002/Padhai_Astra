"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useStudent } from "@/context/student-context";
import { Search, MoreVertical, Plus, Filter, Shield, GraduationCap, Briefcase, Loader2, Users, UserCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { getAllUsers, createUser, getColleges } from "@/lib/db-service";
import { UserData, UserRole, College } from "@/lib/types";

export default function UserManagementPage() {
    const { studentData: authUser } = useStudent();
    const [users, setUsers] = useState<UserData[]>([]);
    const [colleges, setColleges] = useState<College[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");

    // Add User State
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newName, setNewName] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [newRole, setNewRole] = useState<UserRole>("student");
    const [newCollegeId, setNewCollegeId] = useState("");
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const [userDataResp, collegeData] = await Promise.all([
                    getAllUsers(),
                    getColleges(authUser?.uid || "ADMIN-001")
                ]);
                setUsers(userDataResp);
                setColleges(collegeData);
            } catch (error) {
                console.error("Failed to fetch data", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const handleAddUser = async () => {
        if (!newName.trim() || !newEmail.trim()) {
            setCreateError("Name and Email are required.");
            return;
        }

        setCreating(true);
        setCreateError(null);
        try {
            const userData: Partial<UserData> = {
                name: newName.trim(),
                email: newEmail.trim(),
                role: newRole,
                collegeId: newCollegeId || undefined,
            };

            const uid = await createUser(userData);

            // Update local state
            setUsers(prev => [...prev, { ...userData, uid } as UserData]);

            // Reset
            setNewName("");
            setNewEmail("");
            setNewRole("student");
            setNewCollegeId("");
            setIsAddOpen(false);
        } catch (err: any) {
            console.error("Failed to add user:", err);
            setCreateError(err.message || "Failed to add user.");
        } finally {
            setCreating(false);
        }
    };

    const filtered = useMemo(() => {
        return users.filter(user => {
            const matchesRole = roleFilter === "all" || user.role === roleFilter;
            const matchesSearch = search === "" ||
                (user.name?.toLowerCase().includes(search.toLowerCase())) ||
                (user.email?.toLowerCase().includes(search.toLowerCase()));
            return matchesRole && matchesSearch;
        });
    }, [users, search, roleFilter]);

    const counts = useMemo(() => ({
        total: users.length,
        admin: users.filter(u => u.role === "admin").length,
        teacher: users.filter(u => u.role === "teacher").length,
        student: users.filter(u => u.role === "student").length,
    }), [users]);

    const roleButtons: { key: UserRole | "all"; label: string; icon: React.ReactNode }[] = [
        { key: "all", label: "All", icon: <Users className="h-3.5 w-3.5" /> },
        { key: "admin", label: "Admins", icon: <Shield className="h-3.5 w-3.5" /> },
        { key: "teacher", label: "Teachers", icon: <Briefcase className="h-3.5 w-3.5" /> },
        { key: "student", label: "Students", icon: <GraduationCap className="h-3.5 w-3.5" /> },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-headline">User Management</h1>
                    <p className="text-muted-foreground">Manage accounts, roles, and permissions.</p>
                </div>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2">
                            <Plus className="h-4 w-4" /> Add User
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[480px]">
                        <DialogHeader>
                            <DialogTitle>Add New User</DialogTitle>
                            <DialogDescription>
                                Create a new account for a student, teacher, or admin.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="user-name">Full Name <span className="text-red-400">*</span></Label>
                                <Input
                                    id="user-name"
                                    placeholder="e.g. John Doe"
                                    value={newName}
                                    onChange={e => { setNewName(e.target.value); setCreateError(null); }}
                                    className="bg-white/5 border-white/10"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="user-email">Email Address <span className="text-red-400">*</span></Label>
                                <Input
                                    id="user-email"
                                    type="email"
                                    placeholder="john@example.com"
                                    value={newEmail}
                                    onChange={e => { setNewEmail(e.target.value); setCreateError(null); }}
                                    className="bg-white/5 border-white/10"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Role</Label>
                                    <Select value={newRole} onValueChange={(v: any) => setNewRole(v)}>
                                        <SelectTrigger className="bg-white/5 border-white/10">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="student">Student</SelectItem>
                                            <SelectItem value="teacher">Teacher</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Institution</Label>
                                    <Select value={newCollegeId} onValueChange={setNewCollegeId}>
                                        <SelectTrigger className="bg-white/5 border-white/10">
                                            <SelectValue placeholder="Optional" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            {colleges.map(c => (
                                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            {createError && (
                                <p className="text-sm text-red-500">{createError}</p>
                            )}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddOpen(false)} disabled={creating}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleAddUser}
                                disabled={creating}
                                className="bg-indigo-600 hover:bg-indigo-700"
                            >
                                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                {creating ? "Creating..." : "Create Account"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Users", value: counts.total, icon: Users, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
                    { label: "Admins", value: counts.admin, icon: Shield, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
                    { label: "Teachers", value: counts.teacher, icon: Briefcase, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
                    { label: "Students", value: counts.student, icon: GraduationCap, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
                ].map((stat, i) => (
                    <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                        <Card className={`${stat.bg} backdrop-blur-xl`}>
                            <CardContent className="pt-4 pb-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                                        <p className="text-2xl font-bold mt-1">{loading ? "—" : stat.value}</p>
                                    </div>
                                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <Card className="bg-black/20 border-white/5 backdrop-blur-xl">
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <CardTitle>System Users</CardTitle>
                        <CardDescription>
                            {loading ? "Loading..." : `Showing ${filtered.length} of ${users.length} accounts`}
                        </CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or email..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-8 bg-white/5 border-white/10"
                            />
                        </div>
                        <div className="flex gap-1.5">
                            {roleButtons.map(r => (
                                <Button
                                    key={r.key}
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setRoleFilter(r.key)}
                                    className={`text-xs gap-1.5 rounded-lg transition-all ${roleFilter === r.key
                                        ? "bg-indigo-600 text-white hover:bg-indigo-700"
                                        : "text-muted-foreground hover:text-foreground hover:bg-white/10"
                                        }`}
                                >
                                    {r.icon} {r.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                            <Search className="h-10 w-10 mb-3 opacity-30" />
                            <p className="font-medium">No users match your criteria</p>
                            <p className="text-sm">Try adjusting your search or filter.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-white/5">
                                    <TableHead>User</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>College/Organization</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((user, i) => (
                                    <motion.tr
                                        key={user.uid}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                        className="group hover:bg-white/5 border-white/5 transition-colors"
                                    >
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} />
                                                    <AvatarFallback className="bg-indigo-500/20 text-indigo-400">{user.name?.[0] || 'U'}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span>{user.name}</span>
                                                    <span className="text-xs text-muted-foreground hidden sm:inline">{user.uid.substring(0, 8)}...</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={
                                                user.role === 'admin' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                                                    user.role === 'teacher' ? "bg-indigo-500/10 text-indigo-500 border-indigo-500/20" :
                                                        "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                            }>
                                                {user.role === 'admin' && <Shield className="h-3 w-3 mr-1" />}
                                                {user.role === 'teacher' && <Briefcase className="h-3 w-3 mr-1" />}
                                                {user.role === 'student' && <GraduationCap className="h-3 w-3 mr-1" />}
                                                {(user.role || 'user').toUpperCase()}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                                        <TableCell>{user.collegeId || "N/A"}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem>View Profile</DropdownMenuItem>
                                                    <DropdownMenuItem>Edit Role</DropdownMenuItem>
                                                    <DropdownMenuItem>Reset Password</DropdownMenuItem>
                                                    <DropdownMenuItem className="text-red-400">Suspend Account</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </motion.tr>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
