import type { Course, UpcomingEvent, Announcement, Quiz, ForumPost, ForumReply, Question, MemoryItem } from './types';

export const mockUser = {
  name: 'Tony Stark',
  avatarId: 'user-avatar-1',
};

export const mockCourses: Course[] = [
  { id: 'cj', name: 'Core Java', instructor: 'Dr. Shriniwas Acharya', attendance: 92, grade: 85, credits: 4 },
  { id: 'dsa', name: 'Data Structure Algorithm with Python', instructor: 'Dr. Suchita Mandhare', attendance: 88, grade: 90, credits: 4 },
  { id: 'se', name: 'Software Engineering', instructor: 'Dr. Monali Deshpande', attendance: 95, grade: 88, credits: 3 },
  { id: 'pcs', name: 'Professional Communication Skills', instructor: 'Prof. Komal Kharat', attendance: 98, grade: 94, credits: 2 },
  { id: 'os', name: 'Operating System and Linux', instructor: 'Dr. Ananya Rao', attendance: 85, grade: 82, credits: 4 },
];

export const mockUpcomingEvents: UpcomingEvent[] = [
  { id: 'evt1', type: 'Quiz', title: 'Quiz 3: Collections Framework', course: 'Core Java', date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) },
  { id: 'evt2', type: 'Assignment', title: 'Essay: SDLC Models', course: 'Software Engineering', date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000) },
  { id: 'evt3', type: 'Exam', title: 'Midterm Exam', course: 'Operating System and Linux', date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
];

export const mockAnnouncements: Announcement[] = [
  { id: 'ann1', title: 'Campus Library Hours Extended', content: 'The main campus library will now be open until 2 AM during finals week.', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
  { id: 'ann2', title: 'Spring Semester Registration', content: 'Registration for the upcoming Spring semester begins next Monday. Please check your portal for your assigned registration time.', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
];

const osQuestions: Question[] = [
  { id: 'q1', text: 'What is the primary purpose of an Operating System?', options: ['To provide a user interface', 'To manage hardware and software resources', 'To run applications', 'To connect to the internet'], correctAnswer: 'To manage hardware and software resources' },
  { id: 'q2', text: 'Which of the following is not a type of OS?', options: ['Real-time', 'Distributed', 'Network', 'Virtual'], correctAnswer: 'Virtual' },
  { id: 'q3', text: 'What is a "shell" in the context of an OS?', options: ['A hardware component', 'The core of the operating system', 'A command-line interpreter', 'A graphical user interface'], correctAnswer: 'A command-line interpreter' },
];

const dsaQuestions: Question[] = [
  { id: 'q1', text: 'What is the time complexity of a binary search algorithm?', options: ['O(n)', 'O(log n)', 'O(n^2)', 'O(1)'], correctAnswer: 'O(log n)' },
  { id: 'q2', text: 'Which data structure operates on a "First-In, First-Out" (FIFO) basis?', options: ['Stack', 'Array', 'Queue', 'Tree'], correctAnswer: 'Queue' },
];

const cjQuestions: Question[] = [
  { id: 'q1', text: 'What does "JVM" stand for?', options: ['Java Virtual Machine', 'Java Visual Machine', 'JSON Virtual Machine', 'Java Verified Module'], correctAnswer: 'Java Virtual Machine' },
  { id: 'q2', text: 'Which of these is NOT a primitive data type in Java?', options: ['int', 'float', 'string', 'char'], correctAnswer: 'string' },
  { id: 'q3', text: 'What is the parent class of all classes in Java?', options: ['Object', 'Class', 'Main', 'System'], correctAnswer: 'Object' },
  { id: 'q4', text: 'What is method overloading?', options: ['Two or more methods having the same name but different parameters', 'A method that calls itself', 'Changing the behavior of a parent class method', 'A method that cannot be overridden'], correctAnswer: 'Two or more methods having the same name but different parameters' },
];


export const mockQuizzes: Quiz[] = [
  { id: 'quiz1', title: 'Fundamentals of Operating Systems', course: 'OS', questions: osQuestions, coverImageId: 'quiz-cover-1' },
  { id: 'quiz2', title: 'Data Structures Basics', course: 'DSA', questions: dsaQuestions, coverImageId: 'quiz-cover-2' },
  { id: 'quiz3', title: 'Core Java Fundamentals', course: 'CJ', questions: cjQuestions, coverImageId: 'quiz-cover-3' },
];

export const mockForumPosts: ForumPost[] = [
  { id: 'post1', title: 'Having trouble with Python list comprehensions', author: 'Alex', authorAvatarId: 'user-avatar-1', date: new Date(Date.now() - 2 * 60 * 60 * 1000), content: 'I\'m really struggling with the concept of list comprehensions for the upcoming assignment in DSA.', replies: 3, course: 'DSA' },
  { id: 'post2', title: 'Discussion: Agile vs Waterfall', author: 'Maria', authorAvatarId: 'user-avatar-2', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), content: 'What are the main pros and cons of Agile vs Waterfall for a large-scale project?', replies: 5, course: 'SE' },
  { id: 'post3', title: 'Help with multithreading in Java', author: 'David', authorAvatarId: 'user-avatar-3', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), content: 'Confused about extending Thread vs implementing Runnable. When to use each?', replies: 2, course: 'CJ' },
  { id: 'post4', title: 'Sending some good vibes for midterms!', author: 'Anonymous', authorAvatarId: 'user-avatar-4', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), content: 'Midterms can be tough, but we\'ve all got this. Remember to take breaks and stay hydrated!', replies: 1, course: 'General' },
  { id: 'post5', title: 'Small win today', author: 'Anonymous', authorAvatarId: 'user-avatar-1', date: new Date(Date.now() - 12 * 60 * 60 * 1000), content: 'Finally understood a concept I was stuck on for days. It feels so good!', replies: 4, course: 'General' },
  { id: 'post6', title: 'A word of encouragement', author: 'Anonymous', authorAvatarId: 'user-avatar-2', date: new Date(Date.now() - 5 * 60 * 60 * 1000), content: 'Your hard work will pay off. Don\'t give up, you are closer than you think.', replies: 2, course: 'General' },
];


export const mockForumReplies: { [key: string]: ForumReply[] } = {
  'post1': [
    { id: 'reply1-1', author: 'Dr. Suchita Mandhare', authorAvatarId: 'user-avatar-4', date: new Date(Date.now() - 1.5 * 60 * 60 * 1000), content: 'Great question, Alex. Think of the nested loop as the inner part of the comprehension. The outer loop variable comes first. For example: `[i+j for i in "abc" for j in "123"]`.' },
    { id: 'reply1-2', author: 'Maria', authorAvatarId: 'user-avatar-2', date: new Date(Date.now() - 1 * 60 * 60 * 1000), content: 'That makes sense! So it processes the inner loop completely for each item in the outer loop. Thanks Dr. Mandhare!' },
    { id: 'reply1-3', author: 'Alex', authorAvatarId: 'user-avatar-1', date: new Date(Date.now() - 0.5 * 60 * 60 * 1000), content: 'Wow, that clears it up completely. Thank you so much!' },
  ],
  'post2': [],
  'post3': [],
  'post4': [],
  'post5': [],
  'post6': [],
};

export const mockMemoryItems: MemoryItem[] = [
  {
    id: "mem1",
    date: "2024-03-15T10:00:00.000Z",
    content: "Set a goal to finish the DSA assignment two days early.",
    type: "goal"
  },
  {
    id: "mem2",
    date: "2024-03-18T14:30:00.000Z",
    content: "Completed the DSA assignment ahead of schedule! Feeling productive.",
    type: "achievement"
  },
  {
    id: "mem3",
    date: "2024-03-22T09:00:00.000Z",
    content: "Weekly Reflection: Felt overwhelmed by the SE reading material. Need to break it down into smaller chunks next week.",
    type: "reflection"
  },
  {
    id: "mem4",
    date: "2024-03-25T11:00:00.000Z",
    content: "Goal: Read and summarize one chapter of the SE textbook each day.",
    type: "goal"
  },
  {
    id: "mem5",
    date: "2024-04-01T16:00:00.000Z",
    content: "Aced the Core Java quiz on OOP concepts!",
    type: "achievement"
  },
  {
    id: "mem6",
    date: "2024-04-05T09:30:00.000Z",
    content: "Weekly Reflection: The new reading strategy for SE is working well. I feel much more in control of the material.",
    type: "reflection"
  }
];
