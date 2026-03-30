import { AXIOS_TIMEOUT_MS, COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import axios, { type AxiosInstance } from "axios";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";
import type {
  ExchangeTokenRequest,
  ExchangeTokenResponse,
  GetUserInfoResponse,
  GetUserInfoWithJwtRequest,
  GetUserInfoWithJwtResponse,
} from "./types/manusTypes";
// Utility function
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

export type SessionPayload = {
  openId: string;
  appId: string;
  name: string;
};

const EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
const GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
const GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;

class OAuthService {
  constructor(private client: ReturnType<typeof axios.create>) {
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }

  private decodeState(state: string): string {
    const redirectUri = atob(state);
    return redirectUri;
  }

  async getTokenByCode(
    code: string,
    state: string
  ): Promise<ExchangeTokenResponse> {
    const payload: ExchangeTokenRequest = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state),
    };

    const { data } = await this.client.post<ExchangeTokenResponse>(
      EXCHANGE_TOKEN_PATH,
      payload
    );

    return data;
  }

  async getUserInfoByToken(
    token: ExchangeTokenResponse
  ): Promise<GetUserInfoResponse> {
    const { data } = await this.client.post<GetUserInfoResponse>(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken,
      }
    );

    return data;
  }
}

const createOAuthHttpClient = (): AxiosInstance =>
  axios.create({
    baseURL: ENV.oAuthServerUrl,
    timeout: AXIOS_TIMEOUT_MS,
  });

class SDKServer {
  private readonly client: AxiosInstance;
  private readonly oauthService: OAuthService;

  constructor(client: AxiosInstance = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }

  private deriveLoginMethod(
    platforms: unknown,
    fallback: string | null | undefined
  ): string | null {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set<string>(
      platforms.filter((p): p is string => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (
      set.has("REGISTERED_PLATFORM_MICROSOFT") ||
      set.has("REGISTERED_PLATFORM_AZURE")
    )
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }

  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(
    code: string,
    state: string
  ): Promise<ExchangeTokenResponse> {
    return this.oauthService.getTokenByCode(code, state);
  }

  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken: string): Promise<GetUserInfoResponse> {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken,
    } as ExchangeTokenResponse);
    const loginMethod = this.deriveLoginMethod(
      (data as any)?.platforms,
      (data as any)?.platform ?? data.platform ?? null
    );
    return {
      ...(data as any),
      platform: loginMethod,
      loginMethod,
    } as GetUserInfoResponse;
  }

  private parseCookies(cookieHeader: string | undefined) {
    if (!cookieHeader) {
      return new Map<string, string>();
    }

    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }

  private getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }

  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(
    openId: string,
    options: { expiresInMs?: number; name?: string } = {}
  ): Promise<string> {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || "",
      },
      options
    );
  }

  async signSession(
    payload: SessionPayload,
    options: { expiresInMs?: number } = {}
  ): Promise<string> {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);
    const secretKey = this.getSessionSecret();

    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name,
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(secretKey);
  }

  async verifySession(
    cookieValue: string | undefined | null
  ): Promise<{ openId: string; appId: string; name: string } | null> {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }

    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"],
      });
      const { openId, appId, name } = payload as Record<string, unknown>;

      if (
        !isNonEmptyString(openId) ||
        !isNonEmptyString(appId) ||
        !isNonEmptyString(name)
      ) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }

      return {
        openId,
        appId,
        name,
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }

  async getUserInfoWithJwt(
    jwtToken: string
  ): Promise<GetUserInfoWithJwtResponse> {
    const payload: GetUserInfoWithJwtRequest = {
      jwtToken,
      projectId: ENV.appId,
    };

    const { data } = await this.client.post<GetUserInfoWithJwtResponse>(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );

    const loginMethod = this.deriveLoginMethod(
      (data as any)?.platforms,
      (data as any)?.platform ?? data.platform ?? null
    );
    return {
      ...(data as any),
      platform: loginMethod,
      loginMethod,
    } as GetUserInfoWithJwtResponse;
  }

  async authenticateRequest(req: Request): Promise<User> {
    // Seed all demo data
    await this.seedDemoData();

    // Session-based authentication
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);

    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }

    const sessionUserId = session.openId;
    const signedInAt = new Date().toISOString();
    let user = await db.getUserByOpenId(sessionUserId);

    if (!user) {
      throw ForbiddenError("User not found");
    }

    await db.upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt,
    });

    return user;
  }

  private async seedDemoData() {
    // Seed Users
    const seedUsers = [
      {
        email: "admin@university.edu",
        name: "Admin User",
        role: "admin",
        password: "admin123",
      },
      {
        email: "willy@uoeld.ac.ke",
        name: "Willy Admin",
        role: "admin",
        password: "bingo1234",
      },
      {
        email: "lecturer@uoeld.ac.ke",
        name: "Dr. Sarah Johnson",
        role: "lecturer",
        password: "lect123",
        employeeId: "EMP/SC/001",
        department: "Computer Science",
      },
      {
        email: "prof.mukiibi@uoeld.ac.ke",
        name: "Prof. J. Mukiibi",
        role: "lecturer",
        password: "prof123",
        employeeId: "EMP/SC/002",
        department: "Computer Science",
      },
      {
        email: "dr.otieno@uoeld.ac.ke",
        name: "Dr. P. Otieno",
        role: "lecturer",
        password: "dr123",
        employeeId: "EMP/MA/001",
        department: "Mathematics",
      },
      {
        email: "dr.kimani@uoeld.ac.ke",
        name: "Dr. W. Kimani",
        role: "lecturer",
        password: "kim123",
        employeeId: "EMP/PHY/001",
        department: "Physics",
      },
      {
        email: "student@uoeld.ac.ke",
        name: "John Doe",
        role: "student",
        password: "stu123",
        studentId: "SCIT/2024/001",
        department: "Computer Science",
      },
      {
        email: "alice@uoeld.ac.ke",
        name: "Alice Akello",
        role: "student",
        password: "alice123",
        studentId: "SCIT/2024/002",
        department: "Computer Science",
      },
      {
        email: "bob@uoeld.ac.ke",
        name: "Bob Odhiambo",
        role: "student",
        password: "bob123",
        studentId: "SCMA/2024/001",
        department: "Mathematics",
      },
      {
        email: "carol@uoeld.ac.ke",
        name: "Carol Atieno",
        role: "student",
        password: "carol123",
        studentId: "SCIT/2024/003",
        department: "Computer Science",
      },
    ];

    const userIds: Record<string, number> = {};
    for (const seed of seedUsers) {
      const existing = await db.getUserByEmail(seed.email);
      if (!existing) {
        await db.upsertUser({
          openId: `local-${seed.email}`,
          name: seed.name,
          email: seed.email,
          password: seed.password,
          loginMethod: "local",
          role: seed.role as "student" | "lecturer" | "admin",
          studentId: seed.studentId,
          employeeId: seed.employeeId,
          department: seed.department,
          lastSignedIn: new Date().toISOString(),
        });
      }
      const user = await db.getUserByEmail(seed.email);
      if (user) userIds[seed.email] = user.id;
    }

    // Seed Semesters
    const existingSemesters = await db.getAllSemesters();
    if (existingSemesters.length === 0) {
      await db.createSemester({
        name: "Semester I 2025-2026",
        academicYear: "2025-2026",
        term: "Fall",
        startDate: "2025-09-02",
        endDate: "2025-12-12",
        enrollmentDeadline: "2025-09-20",
        dropDeadline: "2025-10-20",
        isActive: false,
      });
      await db.createSemester({
        name: "Semester II 2025-2026",
        academicYear: "2025-2026",
        term: "Spring",
        startDate: "2026-01-12",
        endDate: "2026-05-08",
        enrollmentDeadline: "2026-01-25",
        dropDeadline: "2026-02-25",
        isActive: true,
      });
    }

    const semesters = await db.getAllSemesters();
    const activeSemester = semesters.find(s => s.isActive);
    const sem1 = semesters.find(s => s.name.includes("Semester I"));

    // Seed Programs (Kenyan University Structure)
    const existingPrograms = await db.getAllPrograms();
    if (existingPrograms.length === 0) {
      const programs = [
        {
          code: "SCIT",
          name: "Bachelor of Science in Information Technology",
          faculty: "Faculty of Science",
          department: "Computer Science",
          durationYears: 4,
        },
        {
          code: "SCMA",
          name: "Bachelor of Science in Mathematics",
          faculty: "Faculty of Science",
          department: "Mathematics",
          durationYears: 4,
        },
        {
          code: "SCPH",
          name: "Bachelor of Science in Physics",
          faculty: "Faculty of Science",
          department: "Physics",
          durationYears: 4,
        },
        {
          code: "SBIT",
          name: "Bachelor of Business Information Technology",
          faculty: "Faculty of Business",
          department: "Business IT",
          durationYears: 4,
        },
      ];

      const programIds: Record<string, number> = {};
      for (const prog of programs) {
        await db.createProgram({ ...prog, isActive: true });
        const created = await db.getAllPrograms();
        const found = created.find(p => p.code === prog.code);
        if (found) programIds[prog.code] = found.id;
      }

      // Seed Courses for each program (Kenyan structure: Year 1-4, Sem 1-2)
      if (activeSemester && sem1) {
        // Computer Science Courses - SCIT
        const csCourses = [
          {
            code: "SCIT101",
            name: "Introduction to IT",
            year: 1,
            sem: 1,
            day: "Monday",
            time: "08:00-10:00",
            room: "Lab 1",
          },
          {
            code: "SCIT102",
            name: "Computer Programming I",
            year: 1,
            sem: 1,
            day: "Tuesday",
            time: "10:00-12:00",
            room: "Lab 1",
          },
          {
            code: "SCIT103",
            name: "Discrete Mathematics",
            year: 1,
            sem: 1,
            day: "Wednesday",
            time: "08:00-10:00",
            room: "Room 101",
          },
          {
            code: "SCIT104",
            name: "Communication Skills",
            year: 1,
            sem: 1,
            day: "Thursday",
            time: "10:00-12:00",
            room: "Room 102",
          },
          {
            code: "SCIT105",
            name: "Physics for IT",
            year: 1,
            sem: 1,
            day: "Friday",
            time: "08:00-10:00",
            room: "Lab 2",
          },

          {
            code: "SCIT201",
            name: "Data Structures",
            year: 2,
            sem: 1,
            day: "Monday",
            time: "10:00-12:00",
            room: "Lab 1",
          },
          {
            code: "SCIT202",
            name: "Computer Programming II",
            year: 2,
            sem: 1,
            day: "Tuesday",
            time: "08:00-10:00",
            room: "Lab 1",
          },
          {
            code: "SCIT203",
            name: "Database Systems",
            year: 2,
            sem: 1,
            day: "Wednesday",
            time: "10:00-12:00",
            room: "Lab 2",
          },
          {
            code: "SCIT204",
            name: "Computer Networks I",
            year: 2,
            sem: 1,
            day: "Thursday",
            time: "08:00-10:00",
            room: "Lab 3",
          },

          {
            code: "SCIT301",
            name: "Software Engineering",
            year: 3,
            sem: 1,
            day: "Monday",
            time: "14:00-16:00",
            room: "Lab 1",
          },
          {
            code: "SCIT302",
            name: "Web Development",
            year: 3,
            sem: 1,
            day: "Tuesday",
            time: "14:00-16:00",
            room: "Lab 1",
          },
          {
            code: "SCIT303",
            name: "Operating Systems",
            year: 3,
            sem: 1,
            day: "Wednesday",
            time: "14:00-16:00",
            room: "Lab 2",
          },

          {
            code: "SCIT401",
            name: "Project",
            year: 4,
            sem: 1,
            day: "Friday",
            time: "14:00-16:00",
            room: "Lab 1",
          },
          {
            code: "SCIT402",
            name: "ICT Project Management",
            year: 4,
            sem: 1,
            day: "Monday",
            time: "16:00-18:00",
            room: "Room 301",
          },
        ];

        // Math Courses - SCMA
        const mathCourses = [
          {
            code: "SCMA101",
            name: "Calculus I",
            year: 1,
            sem: 1,
            day: "Monday",
            time: "08:00-10:00",
            room: "Room 201",
          },
          {
            code: "SCMA102",
            name: "Linear Algebra I",
            year: 1,
            sem: 1,
            day: "Tuesday",
            time: "08:00-10:00",
            room: "Room 201",
          },
          {
            code: "SCMA103",
            name: "Physics I",
            year: 1,
            sem: 1,
            day: "Wednesday",
            time: "10:00-12:00",
            room: "Lab 3",
          },
          {
            code: "SCMA104",
            name: "Discrete Mathematics",
            year: 1,
            sem: 1,
            day: "Thursday",
            time: "08:00-10:00",
            room: "Room 202",
          },

          {
            code: "SCMA201",
            name: "Calculus II",
            year: 2,
            sem: 1,
            day: "Monday",
            time: "10:00-12:00",
            room: "Room 201",
          },
          {
            code: "SCMA202",
            name: "Linear Algebra II",
            year: 2,
            sem: 1,
            day: "Tuesday",
            time: "10:00-12:00",
            room: "Room 201",
          },
        ];

        // Physics Courses - SCPH
        const phyCourses = [
          {
            code: "SCPH101",
            name: "Physics I (Mechanics)",
            year: 1,
            sem: 1,
            day: "Monday",
            time: "10:00-12:00",
            room: "Lab 3",
          },
          {
            code: "SCPH102",
            name: "Physics II (Waves)",
            year: 1,
            sem: 1,
            day: "Tuesday",
            time: "10:00-12:00",
            room: "Lab 3",
          },
          {
            code: "SCPH103",
            name: "Calculus for Physics",
            year: 1,
            sem: 1,
            day: "Wednesday",
            time: "08:00-10:00",
            room: "Room 203",
          },
        ];

        const allCourses = [...csCourses, ...mathCourses, ...phyCourses];
        const courseIds: Record<string, number> = {};

        // Create courses
        for (const c of allCourses) {
          const dept = c.code.startsWith("SCIT")
            ? "Computer Science"
            : c.code.startsWith("SCMA")
              ? "Mathematics"
              : "Physics";
          await db.createCourse({
            code: c.code,
            name: c.name,
            description: `${c.name} - Year ${c.year}`,
            credits: 3,
            capacity: 40,
            department: dept,
            level: (c.year * 100 + "") as any,
            semesterId: activeSemester.id,
            scheduleDay: c.day,
            scheduleTime: c.time,
            room: c.room,
            isActive: true,
          });
          const created = await db.getAllCourses();
          const found = created.find(crs => crs.code === c.code);
          if (found) courseIds[c.code] = found.id;
        }

        // Link courses to programs
        for (const c of csCourses) {
          if (courseIds[c.code]) {
            await db.addProgramCourse({
              programId: programIds["SCIT"],
              courseId: courseIds[c.code],
              year: c.year,
              semester: c.sem,
              isCore: true,
            });
          }
        }
        for (const c of mathCourses) {
          if (courseIds[c.code]) {
            await db.addProgramCourse({
              programId: programIds["SCMA"],
              courseId: courseIds[c.code],
              year: c.year,
              semester: c.sem,
              isCore: true,
            });
          }
        }
        for (const c of phyCourses) {
          if (courseIds[c.code]) {
            await db.addProgramCourse({
              programId: programIds["SCPH"],
              courseId: courseIds[c.code],
              year: c.year,
              semester: c.sem,
              isCore: true,
            });
          }
        }

        // Assign lecturers to courses
        const lecturer1Id = userIds["lecturer@uoeld.ac.ke"];
        const lecturer2Id = userIds["prof.mukiibi@uoeld.ac.ke"];
        const lecturer3Id = userIds["dr.otieno@uoeld.ac.ke"];
        const lecturer4Id = userIds["dr.kimani@uoeld.ac.ke"];

        const assignLecturer = async (
          codePattern: string,
          lecturerId: number | undefined
        ) => {
          if (!lecturerId) return;
          const codes = Object.keys(courseIds).filter(c =>
            c.startsWith(codePattern)
          );
          for (const code of codes.slice(0, 4)) {
            await db.assignLecturerToCourse({
              courseId: courseIds[code],
              lecturerId,
            });
          }
        };

        await assignLecturer("SCIT1", lecturer1Id);
        await assignLecturer("SCIT2", lecturer2Id);
        await assignLecturer("SCIT3", lecturer2Id);
        await assignLecturer("SCIT4", lecturer1Id);
        await assignLecturer("SCMA", lecturer3Id);
        await assignLecturer("SCPH", lecturer4Id);

        // Enroll students in programs (they get all courses for their year)
        const enrollStudent = async (email: string, programCode: string) => {
          const studentId = userIds[email];
          if (!studentId) return;

          await db.enrollStudentInProgram({
            studentId,
            programId: programIds[programCode],
            yearOfStudy: 1,
            isActive: true,
          });

          // Get program courses for year 1, semester 1
          const progCourses = await db.getProgramCourses(
            programIds[programCode]
          );
          const year1Sem1 = progCourses.filter(
            pc => pc.programCourse.year === 1 && pc.programCourse.semester === 1
          );

          // Enroll in those courses
          for (const pc of year1Sem1) {
            await db.enrollStudent({
              studentId,
              courseId: pc.course.id,
              semesterId: activeSemester.id,
              status: "enrolled",
            });
          }
        };

        await enrollStudent("student@uoeld.ac.ke", "SCIT");
        await enrollStudent("alice@uoeld.ac.ke", "SCIT");
        await enrollStudent("carol@uoeld.ac.ke", "SCIT");
        await enrollStudent("bob@uoeld.ac.ke", "SCMA");
      }

      console.log(
        "[Seed] Demo data seeded successfully with Kenyan university structure"
      );
    }
  }
}

export const sdk = new SDKServer();
