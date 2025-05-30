import { Day, PrismaClient, UserSex } from "@prisma/client";
import { clerkClient } from "@clerk/nextjs/server";
import fs from "fs";
import path from "path";

function saveCredentials(username: string, email: string, password: string) {
  const filePath = path.join(__dirname, "credentials.txt");
  const line = `Username: ${username}, Email: ${email}, Password: ${password}\n`;
  fs.appendFileSync(filePath, line, "utf8");
}

const prisma = new PrismaClient();
const client = clerkClient();

function generateStrongPassword() {
  return "S3cureP@ssw0rd!" + Math.floor(Math.random() * 100000);
}

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Delete all Clerk users before seeding
async function deleteAllClerkUsers() {
  while (true) {
    const response = await client.users.getUserList({ limit: 100 });
    const users = response.data;
    if (users.length === 0) break;

    await Promise.all(users.map((user) => client.users.deleteUser(user.id)));
  }
  console.log("All Clerk users deleted");
}

async function createClerkUser({
  username,
  email,
  firstName,
  lastName,
  password = generateStrongPassword(), // Clerk requires password on creation
  publicMetadata = {},
}: {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password?: string;
  publicMetadata?: Record<string, any>;
}) {
  try {
    const user = await client.users.createUser({
      username,
      password,
      firstName,
      lastName,
      emailAddress: [email],
      publicMetadata,
    });
    saveCredentials(username, email, password);

    return user;
  } catch (error) {
    console.error(`Error creating Clerk user ${username}:`, error);
    throw error;
  }
}

async function main() {
  // 1. Delete all Clerk users first
  await deleteAllClerkUsers();

  // --- ADMIN ---
  const adminIds: string[] = [];
  for (let i = 1; i <= 2; i++) {
    const clerkUser = await createClerkUser({
      username: `admin${i}`,
      email: `admin${i}@example.com`,
      firstName: `Admin${i}`,
      lastName: "Seed",
      publicMetadata: { role: "admin" },
    });

    adminIds.push(clerkUser.id);

    await prisma.admin.create({
      data: {
        id: clerkUser.id,
        username: clerkUser.username || `admin${i}`,
      },
    });

    await delay(250); // Delay to avoid rate limiting
  }

  // --- GRADE ---
  for (let i = 1; i <= 6; i++) {
    await prisma.grade.create({
      data: {
        level: i,
      },
    });
  }

  // --- CLASS ---
  for (let i = 1; i <= 6; i++) {
    await prisma.class.create({
      data: {
        name: `${i}A`,
        gradeId: i,
        capacity: Math.floor(Math.random() * (20 - 15 + 1)) + 15,
      },
    });
  }

  // --- SUBJECT ---
  const subjectData = [
    { name: "Mathematics" },
    { name: "Science" },
    { name: "English" },
    { name: "History" },
    { name: "Geography" },
    { name: "Physics" },
    { name: "Chemistry" },
    { name: "Biology" },
    { name: "Computer Science" },
    { name: "Art" },
  ];
  for (const subject of subjectData) {
    await prisma.subject.create({ data: subject });
  }

  // --- TEACHER ---
  const teacherIds: string[] = [];
  for (let i = 1; i <= 15; i++) {
    const clerkUser = await createClerkUser({
      username: `teacher${i}`,
      email: `teacher${i}@example.com`,
      firstName: `TName${i}`,
      lastName: `TSurname${i}`,
      publicMetadata: { role: "teacher" },
    });

    teacherIds.push(clerkUser.id);

    await prisma.teacher.create({
      data: {
        id: clerkUser.id,
        username: clerkUser.username ?? `teacher${i}`,
        name: clerkUser.firstName ?? `TName${i}`,
        surname: clerkUser.lastName ?? `TSurname${i}`,
        email:
          clerkUser.emailAddresses[0]?.emailAddress ??
          `teacher${i}@example.com`,
        phone: `123-456-789${i}`,
        address: `Address${i}`,
        bloodType: "A+",
        sex: i % 2 === 0 ? UserSex.MALE : UserSex.FEMALE,
        subjects: { connect: [{ id: (i % 10) + 1 }] },
        classes: { connect: [{ id: (i % 6) + 1 }] },
        birthday: new Date(
          new Date().setFullYear(new Date().getFullYear() - 30)
        ),
      },
    });

    await delay(250);
  }

  // --- PARENT ---
  for (let i = 1; i <= 25; i++) {
    await prisma.parent.create({
      data: {
        id: `parentId${i}`,
        username: `parentId${i}`,
        name: `PName ${i}`,
        surname: `PSurname ${i}`,
        email: `parent${i}@example.com`,
        phone: `123-456-789${i}`,
        address: `Address${i}`,
      },
    });
  }

  // --- STUDENT ---
  const studentIds: string[] = [];
  for (let i = 1; i <= 50; i++) {
    const clerkUser = await createClerkUser({
      username: `student${i}`,
      email: `student${i}@example.com`,
      firstName: `SName${i}`,
      lastName: `SSurname${i}`,
      publicMetadata: { role: "student" },
    });

    studentIds.push(clerkUser.id);

    await prisma.student.create({
      data: {
        id: clerkUser.id,
        username: clerkUser.username ?? `student${i}`,
        name: clerkUser.firstName ?? `SName${i}`,
        surname: clerkUser.lastName ?? `SSurname${i}`,
        email:
          clerkUser.emailAddresses[0]?.emailAddress ??
          `student${i}@example.com`,
        phone: `987-654-321${i}`,
        address: `Address${i}`,
        bloodType: "O-",
        sex: i % 2 === 0 ? UserSex.MALE : UserSex.FEMALE,
        parentId: `parentId${Math.ceil(i / 2) % 25 || 25}`,
        gradeId: (i % 6) + 1,
        classId: (i % 6) + 1,
        birthday: new Date(
          new Date().setFullYear(new Date().getFullYear() - 10)
        ),
      },
    });

    await delay(250);
  }

  // --- LESSON ---
  for (let i = 1; i <= 30; i++) {
    await prisma.lesson.create({
      data: {
        name: `Lesson${i}`,
        day: Day[
          Object.keys(Day)[
            Math.floor(Math.random() * Object.keys(Day).length)
          ] as keyof typeof Day
        ],
        startTime: new Date(new Date().setHours(new Date().getHours() + 1)),
        endTime: new Date(new Date().setHours(new Date().getHours() + 3)),
        subjectId: (i % 10) + 1,
        classId: (i % 6) + 1,
        teacherId: teacherIds[(i - 1) % teacherIds.length], // real Clerk ID for teacher
      },
    });
  }

  // --- EXAM ---
  for (let i = 1; i <= 10; i++) {
    await prisma.exam.create({
      data: {
        title: `Exam ${i}`,
        startTime: new Date(new Date().setHours(new Date().getHours() + 1)),
        endTime: new Date(new Date().setHours(new Date().getHours() + 2)),
        lessonId: (i % 30) + 1,
      },
    });
  }

  // --- ASSIGNMENT ---
  for (let i = 1; i <= 10; i++) {
    await prisma.assignment.create({
      data: {
        title: `Assignment ${i}`,
        startDate: new Date(new Date().setHours(new Date().getHours() + 1)),
        dueDate: new Date(new Date().setDate(new Date().getDate() + 1)),
        lessonId: (i % 30) + 1,
      },
    });
  }

  // --- RESULT ---
  for (let i = 1; i <= 10; i++) {
    await prisma.result.create({
      data: {
        score: 90,
        studentId: studentIds[i - 1], // Use Clerk student IDs here
        ...(i <= 5 ? { examId: i } : { assignmentId: i - 5 }),
      },
    });
  }

  // --- ATTENDANCE ---
  for (let i = 1; i <= 10; i++) {
    await prisma.attendance.create({
      data: {
        date: new Date(),
        present: true,
        studentId: studentIds[i - 1], // Use Clerk student IDs
        lessonId: (i % 30) + 1,
      },
    });
  }

  // --- EVENT ---
  for (let i = 1; i <= 5; i++) {
    await prisma.event.create({
      data: {
        title: `Event ${i}`,
        description: `Description for Event ${i}`,
        startTime: new Date(new Date().setHours(new Date().getHours() + 1)),
        endTime: new Date(new Date().setHours(new Date().getHours() + 2)),
        classId: (i % 5) + 1,
      },
    });
  }

  // --- ANNOUNCEMENT ---
  for (let i = 1; i <= 5; i++) {
    await prisma.announcement.create({
      data: {
        title: `Announcement ${i}`,
        description: `Description for Announcement ${i}`,
        date: new Date(),
        classId: (i % 5) + 1,
      },
    });
  }

  console.log("Seeding completed successfully.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
