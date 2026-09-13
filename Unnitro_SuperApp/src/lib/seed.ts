/**
 * Seed script: Populates RTDB with realistic dummy data for demo purposes.
 * Run from the browser console or via a page button.
 * This script seeds: college, events, courses, announcements,
 * and ensures the default users are linked properly.
 */
import { getRtdb } from "./firebase";
import { ref, set, get, serverTimestamp } from "firebase/database";

const COLLEGE_ID = "COLLEGE-001";
const COLLEGE_NAME = "Stark Institute of Technology";

export async function seedDemoData() {
    const db = getRtdb();
    const today = new Date();

    console.log("[Seed] Starting comprehensive data seed...");

    try {
        // ──────────────────────────────────────
        // 1. Ensure College exists
        // ──────────────────────────────────────
        const collegeSnap = await get(ref(db, `colleges/${COLLEGE_ID}`));
        if (!collegeSnap.exists()) {
            await set(ref(db, `colleges/${COLLEGE_ID}`), {
                id: COLLEGE_ID,
                name: COLLEGE_NAME,
                adminId: "admin",
                location: "New York, NY",
                type: "college",
                createdAt: serverTimestamp()
            });
            console.log("[Seed] College created");
        }

        // ──────────────────────────────────────
        // 2. Find real UIDs for default users
        // ──────────────────────────────────────
        let teacherUid = "";
        let studentUid = "";
        const usersSnap = await get(ref(db, "users"));
        if (usersSnap.exists()) {
            usersSnap.forEach((child) => {
                const val = child.val();
                if (val.email === "strange@stark.edu") teacherUid = child.key!;
                if (val.email === "peter@stark.edu") studentUid = child.key!;
            });
        }

        // Ensure default users have collegeId set
        if (teacherUid) {
            const teacherSnap = await get(ref(db, `users/${teacherUid}`));
            if (teacherSnap.exists()) {
                const td = teacherSnap.val();
                if (!td.collegeId) {
                    await set(ref(db, `users/${teacherUid}`), { ...td, collegeId: COLLEGE_ID });
                }
            }
        }
        if (studentUid) {
            const studentSnap = await get(ref(db, `users/${studentUid}`));
            if (studentSnap.exists()) {
                const sd = studentSnap.val();
                if (!sd.collegeId) {
                    await set(ref(db, `users/${studentUid}`), { ...sd, collegeId: COLLEGE_ID });
                }
            }
        }

        // Also seed secondary students
        const secondaryStudents = [
            { id: "STUDENT-MILES", name: "Miles Morales", email: "miles@stark.edu" },
            { id: "STUDENT-GWEN", name: "Gwen Stacy", email: "gwen@stark.edu" },
            { id: "STUDENT-KAMALA", name: "Kamala Khan", email: "kamala@stark.edu" },
        ];
        for (const s of secondaryStudents) {
            const snap = await get(ref(db, `users/${s.id}`));
            if (!snap.exists()) {
                await set(ref(db, `users/${s.id}`), {
                    uid: s.id, name: s.name, email: s.email,
                    role: "student", collegeId: COLLEGE_ID,
                    academic: { year: "1st Year", branch: "Science", cgpa: (8 + Math.random() * 2).toFixed(1), attendance: 80 + Math.floor(Math.random() * 15) },
                    createdAt: serverTimestamp()
                });
            }
        }
        console.log("[Seed] Users verified & secondary students seeded");

        // ──────────────────────────────────────
        // 3. Seed Courses (linked to real teacher UID)
        // ──────────────────────────────────────
        const allStudentIds = [studentUid, ...secondaryStudents.map(s => s.id)].filter(Boolean);
        const coursesData = [
            { id: "COURSE-001", name: "Mystic Arts 101", credits: 4, attendance: 92, grade: 88 },
            { id: "COURSE-002", name: "Advanced Web Sorcery", credits: 3, attendance: 87, grade: 91 },
            { id: "COURSE-003", name: "Quantum Physics", credits: 4, attendance: 78, grade: 75 },
            { id: "COURSE-004", name: "Data Structures & Algorithms", credits: 3, attendance: 95, grade: 82 },
        ];
        for (const c of coursesData) {
            await set(ref(db, `courses/${c.id}`), {
                id: c.id,
                name: c.name,
                instructor: "Dr. Strange",
                collegeId: COLLEGE_ID,
                teacherId: teacherUid || "TEACHER-001",
                studentIds: allStudentIds.slice(0, Math.floor(Math.random() * 2) + 2),
                attendance: c.attendance,
                grade: c.grade,
                credits: c.credits,
                createdAt: serverTimestamp()
            });
        }
        console.log("[Seed] Courses seeded");

        // ──────────────────────────────────────
        // 4. Seed Events (for Events Pulse)
        // ──────────────────────────────────────
        const eventsData = [
            { title: "Guest Lecture: Quantum Computing", desc: "An introductory lecture on quantum computing concepts by Dr. Smith.", cat: "Academic", time: "10:00 AM", loc: "Lecture Hall A", offset: 2 },
            { title: "Mid-Term Exam Prep Session", desc: "A collaborative review session for the upcoming mid-terms.", cat: "Academic", time: "02:00 PM", loc: "Library Study Room", offset: 5 },
            { title: "Tech Innovation Summit 2026", desc: "Join leading minds in AI, quantum computing, and space tech.", cat: "Tech", time: "09:00 AM", loc: "Main Auditorium", offset: 7 },
            { title: "Hackathon: Code for Good", desc: "A 48-hour coding marathon focused on building solutions for social impact.", cat: "Tech", time: "06:00 PM", loc: "Innovation Hub", offset: 14 },
            { title: "Annual Cultural Festival", desc: "Experience music, art, and culinary delights from around the world.", cat: "Cultural", time: "05:00 PM", loc: "Campus Quad", offset: 1 },
            { title: "Theatre Club Play: The Crucible", desc: "A dramatic performance by the university's theatre club.", cat: "Cultural", time: "07:30 PM", loc: "Arts Theater", offset: 3 },
            { title: "Inter-College Basketball Finals", desc: "Cheer for our team in the highly anticipated championship match.", cat: "Sports", time: "04:00 PM", loc: "Sports Complex", offset: 4 },
            { title: "Morning Yoga Session", desc: "Start your week with a relaxing and rejuvenating yoga session.", cat: "Sports", time: "07:00 AM", loc: "Main Lawn", offset: 6 },
            { title: "Resume Building Workshop", desc: "Learn how to craft a compelling resume from industry experts.", cat: "Workshop", time: "11:00 AM", loc: "Career Center", offset: 2 },
            { title: "Workshop: Intro to Docker", desc: "Hands-on workshop covering the basics of containerization with Docker.", cat: "Workshop", time: "01:00 PM", loc: "Lab 3", offset: 8 },
            { title: "Plantation Drive by Neelvardhan Club", desc: "Join the Neelvardhan Club to plant trees and promote environmental sustainability.", cat: "Social", time: "08:00 AM", loc: "Campus Green Zone", offset: 10 },
            { title: "Beach Cleanup Drive by Neelvardhan Club", desc: "Volunteer with the Neelvardhan Club for a morning of beach cleaning.", cat: "Social", time: "07:30 AM", loc: "City Beach", offset: 0 },
            { title: "Career Fair & Networking", desc: "Meet top employers and secure your summer internships.", cat: "Career", time: "11:00 AM", loc: "Innovation Hub", offset: 0 },
            { title: "Alumni Panel: Tech Careers", desc: "Hear from recent graduates about their experiences in the tech industry.", cat: "Career", time: "05:00 PM", loc: "Virtual (Zoom)", offset: 12 }
        ];

        for (let i = 0; i < eventsData.length; i++) {
            const ev = eventsData[i];
            const evDate = new Date(today);
            evDate.setDate(evDate.getDate() + ev.offset);
            const evId = `EVENT-${(i + 1).toString().padStart(3, '0')}`;
            await set(ref(db, `events/${evId}`), {
                id: evId,
                title: ev.title,
                description: ev.desc,
                date: evDate.toISOString().split("T")[0],
                time: ev.time,
                location: ev.loc,
                category: ev.cat,
                attendees: Math.floor(Math.random() * 200) + 20,
                collegeId: COLLEGE_ID,
                createdAt: serverTimestamp()
            });
        }
        console.log("[Seed] Events seeded");

        // ──────────────────────────────────────
        // 5. Seed Announcements
        // ──────────────────────────────────────
        const announcements = [
            { title: "Mid-Term Exams Start March 15", content: "All students must register for their exams by March 10. Late registrations will not be accepted.", date: new Date(today.getTime() - 1 * 86400000).toISOString() },
            { title: "New Library Hours", content: "The central library will now be open until 11 PM on weekdays to support your exam preparation.", date: new Date(today.getTime() - 2 * 86400000).toISOString() },
            { title: "Campus Wi-Fi Upgrade", content: "We are upgrading the campus Wi-Fi network this weekend. Expect brief outages between 2-4 AM on Saturday.", date: new Date(today.getTime() - 3 * 86400000).toISOString() },
            { title: "Internship Fair Registration Open", content: "Top companies including Stark Industries, Oscorp, and Wayne Tech will be at the fair on March 20.", date: new Date(today.getTime() - 5 * 86400000).toISOString() },
            { title: "Student Wellbeing Survey", content: "Please complete the anonymous wellbeing survey by end of this week. Your feedback helps us improve campus life.", date: new Date(today.getTime() - 7 * 86400000).toISOString() },
        ];

        for (let i = 0; i < announcements.length; i++) {
            const annId = `ANN-${(i + 1).toString().padStart(3, '0')}`;
            await set(ref(db, `announcements/${annId}`), {
                id: annId,
                title: announcements[i].title,
                content: announcements[i].content,
                date: announcements[i].date,
                collegeId: COLLEGE_ID,
                createdAt: serverTimestamp()
            });
        }
        console.log("[Seed] Announcements seeded");

        console.log("[Seed] ✅ All demo data seeded successfully!");
        return true;
    } catch (error) {
        console.error("[Seed] ❌ Error seeding data:", error);
        return false;
    }
}
