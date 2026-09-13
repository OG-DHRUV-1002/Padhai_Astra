"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { auth } from "@/lib/firebase";
import {
    onAuthStateChanged,
    User,
    signInWithEmailAndPassword,
    signOut,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { UserData, UserRole } from "@/lib/types";
import {
    getUserProfile,
    createUserProfile,
    updateUserProfile,
    getFirstCollegeId,
    cleanupDuplicateProfiles
} from "@/lib/db-service";

// Default demo accounts with real email/password credentials
export const DEFAULT_ACCOUNTS: Record<UserRole, { email: string; password: string; name: string }> = {
    admin: { email: "admin@stark.edu", password: "Admin@123", name: "Tony Stark" },
    teacher: { email: "strange@stark.edu", password: "Teacher@123", name: "Dr. Strange" },
    student: { email: "peter@stark.edu", password: "Student@123", name: "Peter Parker" },
};

interface AuthContextType {
    user: User | null;
    userData: UserData | null;
    loading: boolean;
    role: UserRole;
    login: (email: string, password: string) => Promise<UserRole | null>;
    logout: () => Promise<void>;
    mockLogin: (role: UserRole) => Promise<void>;
    googleLogin: (selectedRole?: UserRole) => Promise<UserRole | null>;
    register: (email: string, password: string, name: string, role: UserRole) => Promise<UserRole | null>;
    toggleRole: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState<UserRole>('student');
    const router = useRouter();

    // Ref to prevent onAuthStateChanged from interfering during mockLogin
    const isMockLoginRef = useRef(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            // Skip if mockLogin is handling everything
            if (isMockLoginRef.current) return;

            setLoading(true);
            if (currentUser) {
                setUser(currentUser);
                try {
                    const profile = await getUserProfile(currentUser.uid);
                    if (profile) {
                        setUserData(profile);
                        setRole(profile.role || 'student');
                        localStorage.setItem('arc_role', profile.role || 'student');
                    } else {
                        // No profile in DB — check if this is a default demo account
                        const defaultEntry = Object.entries(DEFAULT_ACCOUNTS).find(
                            ([_, acc]) => acc.email === currentUser.email
                        );
                        const detectedRole = defaultEntry ? defaultEntry[0] as UserRole : 'student';

                        // Fetch a college ID for non-admin accounts
                        let collegeId: string | undefined;
                        if (detectedRole !== 'admin') {
                            const cid = await getFirstCollegeId();
                            if (cid) collegeId = cid;
                        }

                        const newProfile: UserData = {
                            uid: currentUser.uid,
                            name: defaultEntry ? defaultEntry[1].name : (currentUser.displayName || "New User"),
                            email: currentUser.email || "",
                            role: detectedRole,
                            ...(collegeId ? { collegeId } : {}),
                        };
                        await createUserProfile(newProfile);
                        setUserData(newProfile);
                        setRole(detectedRole);
                        localStorage.setItem('arc_role', detectedRole);
                    }
                } catch (error) {
                    console.error("Error fetching user profile:", error);
                }
            } else {
                setUser(null);
                setUserData(null);
                setRole('student');
                localStorage.removeItem('arc_role');
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async (email: string, password: string): Promise<UserRole | null> => {
        try {
            let cred;
            try {
                cred = await signInWithEmailAndPassword(auth, email, password);
            } catch (signInError: any) {
                if (signInError.code === 'auth/user-not-found' || signInError.code === 'auth/invalid-credential') {
                    const defaultEntry = Object.entries(DEFAULT_ACCOUNTS).find(
                        ([_, acc]) => acc.email === email && acc.password === password
                    );
                    if (defaultEntry) {
                        cred = await createUserWithEmailAndPassword(auth, email, password);
                        const r = defaultEntry[0] as UserRole;

                        let collegeId: string | undefined;
                        if (r !== 'admin') {
                            const cid = await getFirstCollegeId();
                            if (cid) collegeId = cid;
                        }

                        const profile: UserData = {
                            uid: cred.user.uid,
                            name: defaultEntry[1].name,
                            email,
                            role: r,
                            ...(collegeId ? { collegeId } : {}),
                        };
                        await createUserProfile(profile);
                        await cleanupDuplicateProfiles(email, cred.user.uid);
                        return r;
                    }
                }
                throw signInError;
            }

            const profile = await getUserProfile(cred.user.uid);
            return profile?.role || 'student';
        } catch (error) {
            console.error("Login failed:", error);
            return null;
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            setUser(null);
            setUserData(null);
            setRole('student');
            localStorage.removeItem('arc_role');
            router.push('/login');
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    const mockLogin = async (targetRole: UserRole) => {
        setLoading(true);
        isMockLoginRef.current = true;
        const account = DEFAULT_ACCOUNTS[targetRole];
        let uid = "";

        try {
            // Try signing in first, create account if it doesn't exist
            try {
                const cred = await signInWithEmailAndPassword(auth, account.email, account.password);
                uid = cred.user.uid;
            } catch (e: any) {
                if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential') {
                    const cred = await createUserWithEmailAndPassword(auth, account.email, account.password);
                    uid = cred.user.uid;
                } else {
                    throw e;
                }
            }

            // Check if profile already exists — reuse it instead of overwriting
            const existingProfile = await getUserProfile(uid);

            if (existingProfile && existingProfile.role === targetRole) {
                // Profile exists with correct role — just use it as-is
                // Ensure it has a collegeId if needed
                if (!existingProfile.collegeId && targetRole !== 'admin') {
                    const cid = await getFirstCollegeId();
                    if (cid) {
                        await updateUserProfile(uid, { collegeId: cid });
                        existingProfile.collegeId = cid;
                    }
                }
                setUser(auth.currentUser as any);
                setUserData(existingProfile);
                setRole(targetRole);
            } else {
                // Profile missing or has wrong role — create/update it
                let collegeId: string | undefined;
                if (targetRole !== 'admin') {
                    const cid = await getFirstCollegeId();
                    if (cid) collegeId = cid;
                }

                const profile: UserData = {
                    uid,
                    name: account.name,
                    email: account.email,
                    role: targetRole,
                    ...(collegeId ? { collegeId } : {}),
                };
                await createUserProfile(profile);
                setUser(auth.currentUser as any);
                setUserData(profile);
                setRole(targetRole);
            }

            localStorage.setItem('arc_role', targetRole);

            // Clean up any old anonymous duplicate profiles with the same email
            await cleanupDuplicateProfiles(account.email, uid);
        } catch (error) {
            console.error("Mock login failed:", error);
        }

        setLoading(false);

        // Release lock after onAuthStateChanged settles
        setTimeout(() => {
            isMockLoginRef.current = false;
        }, 1500);

        // Redirect to correct dashboard
        if (targetRole === 'admin') router.push('/dashboard/admin');
        else if (targetRole === 'teacher') router.push('/dashboard/teacher');
        else router.push('/dashboard');
    };

    const toggleRole = () => {
        const nextRole = role === 'student' ? 'teacher' : role === 'teacher' ? 'admin' : 'student';
        setRole(nextRole);
        if (nextRole === 'admin') router.push('/dashboard/admin');
        else if (nextRole === 'teacher') router.push('/dashboard/teacher');
        else router.push('/dashboard');
    };

    // Google Sign-In — accepts a role chosen by the user
    const googleLogin = async (selectedRole?: UserRole): Promise<UserRole | null> => {
        try {
            const provider = new GoogleAuthProvider();
            const cred = await signInWithPopup(auth, provider);
            const uid = cred.user.uid;
            let profile = await getUserProfile(uid);
            if (!profile) {
                const assignedRole = selectedRole || 'student';
                profile = {
                    uid,
                    name: cred.user.displayName || "Google User",
                    email: cred.user.email || "",
                    role: assignedRole,
                    // collegeId intentionally omitted — OrganizationSelector will handle it
                };
                await createUserProfile(profile);
            }
            return profile.role || 'student';
        } catch (error) {
            console.error("Google login failed:", error);
            return null;
        }
    };

    // Email/Password Registration
    const register = async (email: string, password: string, name: string, targetRole: UserRole): Promise<UserRole | null> => {
        try {
            const cred = await createUserWithEmailAndPassword(auth, email, password);
            const uid = cred.user.uid;
            const profile: UserData = {
                uid,
                name,
                email,
                role: targetRole,
                // collegeId intentionally omitted — OrganizationSelector will handle it
            };
            await createUserProfile(profile);
            return targetRole;
        } catch (error) {
            console.error("Registration failed:", error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{ user, userData, loading, role, login, logout, mockLogin, googleLogin, register, toggleRole }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

export function useStudent() {
    const { userData, loading, role, toggleRole, logout, mockLogin } = useAuth();
    return {
        studentData: userData,
        loading,
        role,
        toggleRole,
        mockLogin,
        logout,
        refreshData: () => { }
    };
}

export const StudentProvider = AuthProvider;
