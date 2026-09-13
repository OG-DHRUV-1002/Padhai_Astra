
import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    setDoc,
    addDoc,
    Timestamp,
    updateDoc,
    deleteDoc,
    serverTimestamp
} from "firebase/firestore";
import {
    ref,
    set,
    push,
    get,
    child,
    update,
    query as rtdbQuery,
    orderByChild,
    equalTo,
    serverTimestamp as rtdbTimestamp
} from "firebase/database";
import { getFirestoreDb, getRtdb } from "@/lib/firebase";
import {
    UserData,
    UserRole,
    Course,
    UpcomingEvent,
    Announcement,
    Quiz,
    ForumPost,
    ForumReply,
    MemoryItem,
    College,
    AppEvent,
    Timetable,
    Grade,
    AuditLog,
    Resource,
    QuizSubmission,
} from "@/lib/types";

// ────────────────────────────────────────────────────────────────
// USERS
// ────────────────────────────────────────────────────────────────

export async function getUserProfile(uid: string): Promise<UserData | null> {
    const db = getRtdb();
    const docRef = ref(db, `users/${uid}`);
    const docSnap = await get(docRef);
    if (docSnap.exists()) return docSnap.val() as UserData;
    return null;
}

export async function createUserProfile(userData: UserData): Promise<void> {
    const db = getRtdb();
    await set(ref(db, `users/${userData.uid}`), userData);
}

// ── Deterministic Role-ID Generator ─────────────────────────────

function slugify(str: string): string {
    return str
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

export async function generateRoleId(
    firstName: string,
    orgName: string,
    orgType: 'college' | 'organization' = 'college'
): Promise<string> {
    const db = getRtdb();
    const base = slugify(firstName);
    const org = slugify(orgName);
    const domain = orgType === 'organization' ? 'org' : 'edu';
    let candidate = `${base}@${org}.${domain}`;

    // Check for duplicates
    const snap = await get(ref(db, `users/${candidate}`));
    if (!snap.exists()) return candidate;

    // Append numeric suffix
    let counter = 2;
    while (true) {
        candidate = `${base}${counter}@${org}.${domain}`;
        const check = await get(ref(db, `users/${candidate}`));
        if (!check.exists()) return candidate;
        counter++;
        if (counter > 100) break; // safety
    }
    return `${base}-${Date.now()}@${org}.${domain}`;
}

export async function createUser(data: Partial<UserData> & { orgName?: string; orgType?: 'college' | 'organization' }): Promise<string> {
    const db = getRtdb();
    try {
        let uid = data.uid;
        if (!uid && data.name && data.orgName) {
            const firstName = data.name.split(' ')[0];
            uid = await generateRoleId(firstName, data.orgName, data.orgType || 'college');
        }
        if (!uid) {
            uid = `USER-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        }
        const { orgName: _on, orgType: _ot, ...rest } = data;
        const userData = {
            ...rest,
            uid,
            createdAt: rtdbTimestamp()
        };
        await set(ref(db, `users/${uid}`), userData);
        console.log(`[db-service] User created in RTDB: ${uid}`);
        return uid;
    } catch (error) {
        console.error("[db-service] Failed to create user in RTDB:", error);
        throw error;
    }
}

export async function updateUserProfile(uid: string, data: Partial<UserData>): Promise<void> {
    const db = getRtdb();
    await update(ref(db, `users/${uid}`), data);
}

export async function getFirstCollegeId(): Promise<string | null> {
    const db = getRtdb();
    try {
        const snapshot = await get(ref(db, "colleges"));
        if (snapshot.exists()) {
            let firstId: string | null = null;
            snapshot.forEach((child) => {
                if (!firstId) firstId = child.key!;
            });
            return firstId;
        }
    } catch (e) {
        console.error("[db-service] Failed to get first college:", e);
    }
    return null;
}

export async function cleanupDuplicateProfiles(email: string, keepUid: string): Promise<void> {
    const db = getRtdb();
    try {
        const snapshot = await get(ref(db, "users"));
        if (snapshot.exists()) {
            const deletePromises: Promise<void>[] = [];
            snapshot.forEach((child) => {
                const val = child.val();
                if (val.email === email && child.key !== keepUid) {
                    deletePromises.push(set(ref(db, `users/${child.key}`), null));
                }
            });
            if (deletePromises.length > 0) {
                await Promise.all(deletePromises);
                console.log(`[db-service] Cleaned up ${deletePromises.length} duplicate(s) for ${email}`);
            }
        }
    } catch (e) {
        console.error("[db-service] Failed to clean up duplicates:", e);
    }
}

export async function getAllUsers(): Promise<UserData[]> {
    const db = getRtdb();
    try {
        const usersRef = ref(db, "users");
        const snapshot = await get(usersRef);

        if (snapshot.exists()) {
            const users: UserData[] = [];
            snapshot.forEach((child) => {
                users.push({ uid: child.key!, ...child.val() });
            });
            return users;
        }
        return [];
    } catch (error) {
        console.error("[db-service] Failed to get all users from RTDB:", error);
        return [];
    }
}

export async function deleteUser(uid: string): Promise<void> {
    const db = getRtdb();
    await set(ref(db, `users/${uid}`), null);
}


export async function getUsersByRole(role: UserRole): Promise<UserData[]> {
    const db = getFirestoreDb();
    const q = query(collection(db, "users"), where("role", "==", role));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as UserData);
}

// ────────────────────────────────────────────────────────────────
// COLLEGES
// ────────────────────────────────────────────────────────────────

export async function getColleges(adminId: string): Promise<College[]> {
    const db = getRtdb();
    try {
        const collegesRef = ref(db, "colleges");
        const snapshot = await get(collegesRef);

        if (snapshot.exists()) {
            const colleges: College[] = [];
            snapshot.forEach((child) => {
                const val = child.val();
                if (val.adminId === adminId) {
                    colleges.push({ id: child.key!, ...val });
                }
            });
            return colleges;
        }
        return [];
    } catch (error) {
        console.error("[db-service] Failed to get colleges from RTDB:", error);
        return [];
    }
}

export async function getCollege(id: string): Promise<College | null> {
    const db = getRtdb();
    try {
        const collegeRef = ref(db, `colleges/${id}`);
        const snapshot = await get(collegeRef);
        if (snapshot.exists()) return { id: snapshot.key!, ...snapshot.val() } as College;
    } catch (error) {
        console.error("[db-service] Failed to get college from RTDB:", error);
    }
    return null;
}

export async function createCollege(data: Partial<College>): Promise<string> {
    const db = getRtdb();
    try {
        const collegesRef = ref(db, "colleges");
        const newCollegeRef = push(collegesRef);
        const collegeId = newCollegeRef.key!;

        const collegeData = {
            ...data,
            id: collegeId,
            type: data.type || 'college',
            createdAt: rtdbTimestamp()
        };

        await set(newCollegeRef, collegeData);
        console.log(`[db-service] College created in RTDB: ${collegeId}`);
        return collegeId;
    } catch (error) {
        console.error("[db-service] Failed to create college in RTDB:", error);
        throw error;
    }
}

export async function updateCollege(id: string, data: Partial<College>): Promise<void> {
    const db = getRtdb();
    await set(ref(db, `colleges/${id}`), { ...data, id });
}

export async function deleteCollege(id: string): Promise<void> {
    const db = getRtdb();
    await set(ref(db, `colleges/${id}`), null);
}

// ────────────────────────────────────────────────────────────────
// TEACHERS & STUDENTS (filtered from users)
// ────────────────────────────────────────────────────────────────

export async function getTeachers(collegeId: string): Promise<UserData[]> {
    const db = getRtdb();
    try {
        const usersRef = ref(db, "users");
        const snapshot = await get(usersRef);
        if (snapshot.exists()) {
            const teachers: UserData[] = [];
            snapshot.forEach((child) => {
                const val = child.val();
                if (val.role === "teacher" && val.collegeId === collegeId) {
                    teachers.push({ uid: child.key!, ...val });
                }
            });
            return teachers;
        }
    } catch (error) {
        console.error("[db-service] Failed to get teachers from RTDB:", error);
    }
    return [];
}

export async function createTeacher(data: UserData): Promise<void> {
    await createUser(data);
}

export async function getStudents(collegeId: string): Promise<UserData[]> {
    const db = getRtdb();
    try {
        const usersRef = ref(db, "users");
        const snapshot = await get(usersRef);
        if (snapshot.exists()) {
            const students: UserData[] = [];
            snapshot.forEach((child) => {
                const val = child.val();
                if (val.role === "student" && val.collegeId === collegeId) {
                    students.push({ uid: child.key!, ...val });
                }
            });
            return students;
        }
    } catch (error) {
        console.error("[db-service] Failed to get students from RTDB:", error);
    }
    return [];
}

export async function getAllCollegeStudents(collegeId: string) {
    return getStudents(collegeId);
}

// ────────────────────────────────────────────────────────────────
// COURSES
// ────────────────────────────────────────────────────────────────

export async function getCourses(studentId?: string): Promise<Course[]> {
    const db = getRtdb();
    try {
        const coursesRef = ref(db, "courses");
        const snapshot = await get(coursesRef);
        if (snapshot.exists()) {
            const courses: Course[] = [];
            snapshot.forEach((child) => {
                courses.push({ id: child.key!, ...child.val() });
            });
            if (studentId) {
                return courses.filter(c => c.studentIds?.includes(studentId));
            }
            return courses;
        }
    } catch (error) {
        console.error("[db-service] Failed to get courses from RTDB:", error);
    }
    return [];
}

export async function getCoursesByCollege(collegeId: string): Promise<Course[]> {
    const db = getRtdb();
    try {
        const coursesRef = ref(db, "courses");
        const snapshot = await get(coursesRef);
        if (snapshot.exists()) {
            const courses: Course[] = [];
            snapshot.forEach((child) => {
                const val = child.val();
                if (val.collegeId === collegeId) {
                    courses.push({ id: child.key!, ...val });
                }
            });
            return courses;
        }
    } catch (error) {
        console.error("[db-service] Failed to get courses by college from RTDB:", error);
    }
    return [];
}

export async function getTeacherCourses(teacherId: string): Promise<Course[]> {
    const db = getRtdb();
    try {
        const coursesRef = ref(db, "courses");
        const snapshot = await get(coursesRef);
        if (snapshot.exists()) {
            const courses: Course[] = [];
            snapshot.forEach((child) => {
                const val = child.val();
                if (val.teacherId === teacherId) {
                    courses.push({ id: child.key!, ...val });
                }
            });
            return courses;
        }
    } catch (error) {
        console.error("[db-service] Failed to get teacher courses from RTDB:", error);
    }
    return [];
}

export async function createCourse(courseData: Partial<Course>): Promise<string> {
    const db = getRtdb();
    const coursesRef = ref(db, "courses");
    const newCourseRef = push(coursesRef);
    const courseId = newCourseRef.key!;
    await set(newCourseRef, { ...courseData, id: courseId, createdAt: rtdbTimestamp() });
    return courseId;
}

export async function updateCourse(id: string, data: Partial<Course>): Promise<void> {
    const db = getRtdb();
    await set(ref(db, `courses/${id}`), { ...data, id });
}

export async function deleteCourse(id: string): Promise<void> {
    const db = getRtdb();
    await set(ref(db, `courses/${id}`), null);
}

export async function assignStudentToCourse(courseId: string, studentId: string): Promise<void> {
    const db = getRtdb();
    const courseRef = ref(db, `courses/${courseId}`);
    const snap = await get(courseRef);
    if (snap.exists()) {
        const course = snap.val() as Course;
        const students = course.studentIds || [];
        if (!students.includes(studentId)) {
            await set(child(courseRef, "studentIds"), [...students, studentId]);
        }
    }
}

// ────────────────────────────────────────────────────────────────
// EVENTS (Events Pulse page)
// ────────────────────────────────────────────────────────────────

export async function getEvents(collegeId?: string): Promise<AppEvent[]> {
    const db = getRtdb();
    try {
        // Fetch all events, sort and filter in memory to bypass missing index rules
        const eventsRef = ref(db, "events");
        const snapshot = await get(eventsRef);
        if (snapshot.exists()) {
            let events: AppEvent[] = [];
            snapshot.forEach((child) => {
                const val = child.val();
                if (!collegeId || val.collegeId === collegeId) {
                    events.push({ id: child.key!, ...val });
                }
            });
            // Sort by date descending
            events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            return events;
        }
    } catch (error) {
        console.error("[db-service] Failed to get events from RTDB:", error);
    }
    return [];
}

export async function createEvent(event: Omit<AppEvent, "id">): Promise<string> {
    const db = getRtdb();
    const eventsRef = ref(db, "events");
    const newEventRef = push(eventsRef);
    const eventId = newEventRef.key!;
    await set(newEventRef, { ...event, id: eventId, createdAt: rtdbTimestamp() });
    return eventId;
}

export async function updateEvent(id: string, data: Partial<AppEvent>): Promise<void> {
    const db = getRtdb();
    await set(ref(db, `events/${id}`), { ...data, id });
}

export async function deleteEvent(id: string): Promise<void> {
    const db = getRtdb();
    await set(ref(db, `events/${id}`), null);
}

// ────────────────────────────────────────────────────────────────
// ANNOUNCEMENTS
// ────────────────────────────────────────────────────────────────

export async function getAnnouncements(collegeId?: string): Promise<Announcement[]> {
    const db = getRtdb();
    try {
        // Fetch all announcements and sort in memory to avoid missing index rules
        const snapshot = await get(ref(db, "announcements"));
        if (snapshot.exists()) {
            const announcements: Announcement[] = [];
            snapshot.forEach((child) => {
                const val = child.val();
                if (!collegeId || val.collegeId === collegeId) {
                    announcements.push({ id: child.key!, ...val });
                }
            });
            // Sort by date descending (newest first)
            announcements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            return announcements.slice(0, 10);
        }
    } catch (error) {
        console.error("[db-service] Failed to get announcements from RTDB:", error);
    }
    return [];
}

export async function createAnnouncement(ann: Omit<Announcement, "id">): Promise<string> {
    const db = getRtdb();
    const refAnn = ref(db, "announcements");
    const newAnnRef = push(refAnn);
    const annId = newAnnRef.key!;
    await set(newAnnRef, { ...ann, id: annId, createdAt: rtdbTimestamp() });
    return annId;
}

export async function deleteAnnouncement(id: string): Promise<void> {
    const db = getRtdb();
    await set(ref(db, `announcements/${id}`), null);
}

// ────────────────────────────────────────────────────────────────
// QUIZZES
// ────────────────────────────────────────────────────────────────

export async function getQuizzes(courseId?: string): Promise<Quiz[]> {
    const db = getFirestoreDb();
    let q;
    if (courseId) {
        q = query(collection(db, "quizzes"), where("courseId", "==", courseId));
    } else {
        q = query(collection(db, "quizzes"));
    }
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Quiz));
}

export async function getQuizzesByTeacher(teacherId: string): Promise<Quiz[]> {
    const db = getFirestoreDb();
    const q = query(collection(db, "quizzes"), where("teacherId", "==", teacherId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Quiz));
}

export async function getQuizzesByCollege(collegeId: string): Promise<Quiz[]> {
    const db = getFirestoreDb();
    const q = query(collection(db, "quizzes"), where("collegeId", "==", collegeId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Quiz));
}

export async function createQuiz(quiz: Omit<Quiz, "id">): Promise<string> {
    const db = getFirestoreDb();
    const ref = doc(collection(db, "quizzes"));
    await setDoc(ref, { ...quiz, id: ref.id });
    return ref.id;
}

export async function updateQuiz(id: string, data: Partial<Quiz>): Promise<void> {
    const db = getFirestoreDb();
    await updateDoc(doc(db, "quizzes", id), data as any);
}

export async function deleteQuiz(id: string): Promise<void> {
    const db = getFirestoreDb();
    await deleteDoc(doc(db, "quizzes", id));
}

export async function submitQuizAnswer(submission: Omit<QuizSubmission, "id">): Promise<string> {
    const db = getFirestoreDb();
    const ref = doc(collection(db, "quiz_submissions"));
    await setDoc(ref, { ...submission, id: ref.id });
    return ref.id;
}

export async function getQuizSubmissions(quizId: string, studentId?: string): Promise<QuizSubmission[]> {
    const db = getFirestoreDb();
    let q;
    if (studentId) {
        q = query(collection(db, "quiz_submissions"), where("quizId", "==", quizId), where("studentId", "==", studentId));
    } else {
        q = query(collection(db, "quiz_submissions"), where("quizId", "==", quizId));
    }
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as QuizSubmission));
}

// ────────────────────────────────────────────────────────────────
// FORUM POSTS (Peer Oracle)
// ────────────────────────────────────────────────────────────────

export async function getForumPosts(collegeId?: string): Promise<ForumPost[]> {
    const db = getFirestoreDb();
    let q;
    if (collegeId) {
        q = query(collection(db, "forum_posts"), where("collegeId", "==", collegeId), orderBy("date", "desc"));
    } else {
        q = query(collection(db, "forum_posts"), orderBy("date", "desc"));
    }
    const snap = await getDocs(q);
    return snap.docs.map(d => {
        const data = d.data();
        return {
            id: d.id,
            ...data,
            date: data.date instanceof Timestamp ? data.date.toDate() : data.date
        } as ForumPost;
    });
}

export async function createForumPost(post: Omit<ForumPost, "id">): Promise<string> {
    const db = getFirestoreDb();
    const ref = doc(collection(db, "forum_posts"));
    await setDoc(ref, { ...post, id: ref.id });
    return ref.id;
}

export async function deleteForumPost(id: string): Promise<void> {
    const db = getFirestoreDb();
    await deleteDoc(doc(db, "forum_posts", id));
}

export async function getForumReplies(postId: string): Promise<ForumReply[]> {
    const db = getFirestoreDb();
    const q = query(collection(db, "forum_posts", postId, "replies"), orderBy("date", "asc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => {
        const data = d.data();
        return {
            id: d.id,
            ...data,
            date: data.date instanceof Timestamp ? data.date.toDate() : data.date
        } as ForumReply;
    });
}

export async function addForumReply(postId: string, reply: Omit<ForumReply, "id">): Promise<string> {
    const db = getFirestoreDb();
    const ref = doc(collection(db, "forum_posts", postId, "replies"));
    await setDoc(ref, { ...reply, id: ref.id });
    // Increment reply count on the post
    const postRef = doc(db, "forum_posts", postId);
    const postSnap = await getDoc(postRef);
    if (postSnap.exists()) {
        const current = (postSnap.data() as ForumPost).replies || 0;
        await updateDoc(postRef, { replies: current + 1 });
    }
    return ref.id;
}

// ────────────────────────────────────────────────────────────────
// TIMETABLE
// ────────────────────────────────────────────────────────────────

export async function getTimetable(collegeId: string): Promise<Timetable | null> {
    const db = getRtdb();
    try {
        const snapshot = await get(ref(db, `timetables/${collegeId}`));
        if (snapshot.exists()) {
            return { id: collegeId, collegeId, schedule: snapshot.val().schedule } as Timetable;
        }
    } catch (e) {
        console.error("Error fetching timetable:", e);
    }
    return null;
}

export async function updateTimetable(collegeId: string, schedule: Timetable["schedule"]): Promise<void> {
    const db = getRtdb();
    await set(ref(db, `timetables/${collegeId}`), {
        collegeId,
        schedule
    });
}

export async function getStudentTimetable(studentId: string): Promise<Timetable | null> {
    const db = getRtdb();
    try {
        const snapshot = await get(ref(db, `users/${studentId}/timetable`));
        if (snapshot.exists()) {
            return { id: studentId, studentId, schedule: snapshot.val().schedule } as Timetable;
        }
    } catch (e) {
        console.error("Error fetching student timetable:", e);
    }
    return null;
}

export async function updateStudentTimetable(studentId: string, schedule: Timetable["schedule"]): Promise<void> {
    const db = getRtdb();
    await set(ref(db, `users/${studentId}/timetable`), {
        studentId,
        schedule
    });
}

// ────────────────────────────────────────────────────────────────
// GRADES
// ────────────────────────────────────────────────────────────────

export async function getGrades(studentId: string): Promise<Grade[]> {
    const db = getRtdb();
    try {
        const snapshot = await get(ref(db, "grades"));
        if (snapshot.exists()) {
            const grades: Grade[] = [];
            snapshot.forEach((child) => {
                const val = child.val();
                if (val.studentId === studentId) {
                    grades.push({ id: child.key!, ...val });
                }
            });
            return grades;
        }
    } catch (e) {
        console.error("Failed to get grades:", e);
    }
    return [];
}

export async function getGradesByCourse(courseId: string): Promise<Grade[]> {
    const db = getRtdb();
    try {
        const snapshot = await get(ref(db, "grades"));
        if (snapshot.exists()) {
            const grades: Grade[] = [];
            snapshot.forEach((child) => {
                const val = child.val();
                if (val.courseId === courseId) {
                    grades.push({ id: child.key!, ...val });
                }
            });
            return grades;
        }
    } catch (e) {
        console.error("Failed to get grades by course:", e);
    }
    return [];
}

export async function addGrade(grade: Omit<Grade, "id">): Promise<string> {
    const db = getRtdb();
    const gradesRef = ref(db, "grades");
    const newRef = push(gradesRef);
    const id = newRef.key!;
    await set(newRef, { ...grade, id, createdAt: rtdbTimestamp() });
    return id;
}

export async function updateGrade(id: string, data: Partial<Grade>): Promise<void> {
    const db = getRtdb();
    await set(ref(db, `grades/${id}`), { ...data, id });
}

export async function deleteGrade(id: string): Promise<void> {
    const db = getRtdb();
    await set(ref(db, `grades/${id}`), null);
}

// ────────────────────────────────────────────────────────────────
// RESOURCES (Teacher)
// ────────────────────────────────────────────────────────────────

export async function getResources(teacherId?: string, courseId?: string): Promise<Resource[]> {
    const db = getRtdb();
    try {
        const snapshot = await get(ref(db, "resources"));
        if (snapshot.exists()) {
            const resources: Resource[] = [];
            snapshot.forEach((child) => {
                const val = child.val();
                if (teacherId && val.teacherId === teacherId) {
                    resources.push({ id: child.key!, ...val });
                } else if (!teacherId && courseId && val.courseId === courseId) {
                    resources.push({ id: child.key!, ...val });
                } else if (!teacherId && !courseId) {
                    resources.push({ id: child.key!, ...val });
                }
            });
            return resources;
        }
    } catch (e) {
        console.error("Failed to get resources:", e);
    }
    return [];
}

export async function getResourcesByCollege(collegeId: string): Promise<Resource[]> {
    const db = getRtdb();
    try {
        const snapshot = await get(ref(db, "resources"));
        if (snapshot.exists()) {
            const resources: Resource[] = [];
            snapshot.forEach((child) => {
                const val = child.val();
                if (val.collegeId === collegeId) {
                    resources.push({ id: child.key!, ...val });
                }
            });
            return resources;
        }
    } catch (e) {
        console.error("Failed to get resources by college:", e);
    }
    return [];
}

export async function createResource(resource: Omit<Resource, "id">): Promise<string> {
    const db = getRtdb();
    const resourcesRef = ref(db, "resources");
    const newRef = push(resourcesRef);
    const id = newRef.key!;
    await set(newRef, { ...resource, id, createdAt: rtdbTimestamp() });
    return id;
}

export async function updateResource(id: string, data: Partial<Resource>): Promise<void> {
    const db = getRtdb();
    await set(ref(db, `resources/${id}`), { ...data, id });
}

export async function deleteResource(id: string): Promise<void> {
    const db = getRtdb();
    await set(ref(db, `resources/${id}`), null);
}

// ────────────────────────────────────────────────────────────────
// AUDIT LOGS (Admin)
// ────────────────────────────────────────────────────────────────

export async function getAuditLogs(limitCount: number = 50): Promise<AuditLog[]> {
    const db = getFirestoreDb();
    const q = query(collection(db, "audit_logs"), orderBy("timestamp", "desc"), limit(limitCount));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as AuditLog));
}

export async function logAuditEvent(log: Omit<AuditLog, "id">): Promise<string> {
    const db = getFirestoreDb();
    const ref = doc(collection(db, "audit_logs"));
    await setDoc(ref, { ...log, id: ref.id });
    return ref.id;
}

// ────────────────────────────────────────────────────────────────
// SYSTEM STATS (Admin)
// ────────────────────────────────────────────────────────────────

export async function getSystemStats() {
    const db = getRtdb();
    try {
        const usersSnap = await get(ref(db, "users"));
        const collegesSnap = await get(ref(db, "colleges"));
        const coursesSnap = await get(ref(db, "courses"));

        let totalUsers = 0, totalStudents = 0, totalTeachers = 0, totalAdmins = 0;

        if (usersSnap.exists()) {
            usersSnap.forEach(child => {
                totalUsers++;
                const role = child.val().role;
                if (role === 'student') totalStudents++;
                else if (role === 'teacher') totalTeachers++;
                else if (role === 'admin') totalAdmins++;
            });
        }

        let totalColleges = 0;
        if (collegesSnap.exists()) {
            collegesSnap.forEach(() => { totalColleges++; });
        }

        let totalCourses = 0;
        if (coursesSnap.exists()) {
            coursesSnap.forEach(() => { totalCourses++; });
        }

        return {
            totalUsers,
            totalColleges,
            totalCourses,
            totalStudents,
            totalTeachers,
            totalAdmins,
        };
    } catch (e) {
        console.error("Failed to fetch system stats from RTDB", e);
        return { totalUsers: 0, totalColleges: 0, totalCourses: 0, totalStudents: 0, totalTeachers: 0, totalAdmins: 0 };
    }
}

// ────────────────────────────────────────────────────────────────
// TEACHER STATS
// ────────────────────────────────────────────────────────────────

export async function getTeacherStats(teacherId: string) {
    const courses = await getTeacherCourses(teacherId);
    const totalStudents = new Set(courses.flatMap(c => c.studentIds || [])).size;
    const avgAttendance = courses.length > 0
        ? Math.round(courses.reduce((sum, c) => sum + (c.attendance || 0), 0) / courses.length)
        : 0;

    return {
        totalCourses: courses.length,
        totalStudents,
        avgAttendance,
        avgGrade: courses.length > 0
            ? Math.round(courses.reduce((sum, c) => sum + (c.grade || 0), 0) / courses.length)
            : 0
    };
}

// Legacy / compat
export async function getUpcomingEvents(userId: string, role: string): Promise<UpcomingEvent[]> {
    const db = getFirestoreDb();
    const q = query(collection(db, "events"), orderBy("date", "asc"));
    const snap = await getDocs(q);
    const events = snap.docs.map(d => {
        const data = d.data();
        return {
            id: d.id,
            ...data,
            date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date)
        } as UpcomingEvent;
    });
    return events.filter(e => e.date > new Date());
}
