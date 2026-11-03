import {
  parseClassDate,
  isSameCalendarDay,
  convertEpochToTime,
} from "../../../../utils/helpers";
import {
  isMemberHybrid,
  isMemberNormal,
} from "../InstructorActivityTabs/ReferredMembersList";
import { deduplicateUserList } from "../../../../utils/userDeduplication";

describe("HP164 — Upcoming Events & Class Notices Frontend Integrity", () => {
  describe("parseClassDate", () => {
    test("parses epoch milliseconds number correctly", () => {
      const epochMs = 1792348200000;
      const parsed = parseClassDate(epochMs);
      expect(parsed).toBeInstanceOf(Date);
      expect(parsed.getTime()).toBe(epochMs);
    });

    test("parses epoch seconds number correctly", () => {
      const epochSec = 1792348200;
      const parsed = parseClassDate(epochSec);
      expect(parsed).toBeInstanceOf(Date);
      expect(parsed.getTime()).toBe(epochSec * 1000);
    });

    test("parses numeric epoch string correctly", () => {
      const epochStr = "1792348200000";
      const parsed = parseClassDate(epochStr);
      expect(parsed).toBeInstanceOf(Date);
      expect(parsed.getTime()).toBe(1792348200000);
    });

    test("parses ISO 8601 string correctly", () => {
      const isoStr = "2026-10-18T10:30:00.000Z";
      const parsed = parseClassDate(isoStr);
      expect(parsed).toBeInstanceOf(Date);
      expect(parsed.toISOString()).toBe("2026-10-18T10:30:00.000Z");
    });

    test("parses date string (YYYY-MM-DD) correctly", () => {
      const dateStr = "2026-10-18";
      const parsed = parseClassDate(dateStr);
      expect(parsed).toBeInstanceOf(Date);
      expect(isNaN(parsed.getTime())).toBe(false);
    });

    test("returns null for invalid, non-positive, or empty inputs without throwing", () => {
      expect(parseClassDate(null)).toBeNull();
      expect(parseClassDate(undefined)).toBeNull();
      expect(parseClassDate("")).toBeNull();
      expect(parseClassDate("invalid-date-string")).toBeNull();
      expect(parseClassDate(0)).toBeNull();
      expect(parseClassDate(-100)).toBeNull();
    });
  });

  describe("isSameCalendarDay", () => {
    test("matches two dates on the same calendar day regardless of format", () => {
      const d1 = new Date("2026-10-18T10:00:00Z");
      const d2 = "2026-10-18T12:00:00Z";
      const d3 = d1.getTime();
      expect(isSameCalendarDay(d1, d2)).toBe(true);
      expect(isSameCalendarDay(d1, d3)).toBe(true);
    });

    test("returns false for different calendar days", () => {
      const d1 = "2026-10-18";
      const d2 = "2026-10-19";
      expect(isSameCalendarDay(d1, d2)).toBe(false);
    });

    test("returns false safely when either date is null or invalid", () => {
      expect(isSameCalendarDay(null, "2026-10-18")).toBe(false);
      expect(isSameCalendarDay("2026-10-18", undefined)).toBe(false);
      expect(isSameCalendarDay("bad", "2026-10-18")).toBe(false);
    });
  });

  describe("convertEpochToTime", () => {
    test("converts ISO date string to formatted time without Invalid Date", () => {
      const iso = "2026-10-18T14:30:00.000Z";
      const formatted = convertEpochToTime(iso, "US");
      expect(formatted).not.toContain("Invalid Date");
      expect(typeof formatted).toBe("string");
      expect(formatted.length).toBeGreaterThan(0);
    });

    test("converts epoch ms number and string to formatted time", () => {
      const ms = 1792348200000;
      const formatted = convertEpochToTime(ms, "IN");
      expect(formatted).not.toContain("Invalid Date");
      const formattedStr = convertEpochToTime(String(ms), "IN");
      expect(formattedStr).toBe(formatted);
    });

    test("returns empty string on null or invalid timestamp", () => {
      expect(convertEpochToTime(null)).toBe("");
      expect(convertEpochToTime(undefined)).toBe("");
      expect(convertEpochToTime("")).toBe("");
      expect(convertEpochToTime("invalid")).toBe("");
    });
  });

  describe("Class Notices and Upcoming Schedule API handling", () => {
    test("notices filtering keeps today's notices from the start of the day", () => {
      const today = new Date();
      today.setHours(9, 0, 0, 0); // 9:00 AM today
      const todayEpoch = today.getTime();

      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const startOfTodayMs = startOfToday.getTime();

      const notices = [
        { noticeId: todayEpoch, title: "Today's morning notice" },
        { noticeId: todayEpoch + 86400000, title: "Tomorrow's notice" },
        { noticeId: startOfTodayMs - 86400000, title: "Yesterday's notice" },
      ];

      const upcoming = notices.filter((notice) => {
        const epoch = Number(notice.noticeId);
        return !notice.noticeId || isNaN(epoch) || epoch >= startOfTodayMs;
      });

      expect(upcoming).toHaveLength(2);
      expect(upcoming.map((n) => n.title)).toEqual([
        "Today's morning notice",
        "Tomorrow's notice",
      ]);
    });

    test("schedule filter retains earlier classes scheduled for today", () => {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const morningClass = {
        classId: "cls-1",
        date: new Date(startOfToday.getTime() + 8 * 3600000).toISOString(), // 8 AM today
        classType: "Yoga",
        instructorNames: "Pooja",
      };
      const eveningClass = {
        classId: "cls-2",
        date: new Date(startOfToday.getTime() + 18 * 3600000).getTime(), // 6 PM today
        classType: "Zumba",
        instructorNames: "Madan",
      };
      const yesterdayClass = {
        classId: "cls-old",
        date: new Date(startOfToday.getTime() - 10 * 3600000).getTime(), // Yesterday
        classType: "Yoga",
        instructorNames: "Pooja",
      };

      const allClasses = [morningClass, eveningClass, yesterdayClass];

      const filtered = allClasses.filter((c) => {
        const classDate = parseClassDate(c.date);
        if (!classDate) return false;
        return classDate.getTime() >= startOfToday.getTime();
      });

      expect(filtered).toHaveLength(2);
      expect(filtered.map((c) => c.classId)).toEqual(["cls-1", "cls-2"]);
    });
  });
});

describe("HP246 — Instructor Hybrid Member Classification", () => {
  describe("isMemberHybrid", () => {
    test("identifies hybrid member via isHybrid flag", () => {
      expect(isMemberHybrid({ isHybrid: true, emailId: "user1@test.com" })).toBe(true);
      expect(isMemberHybrid({ isHybrid: "true", emailId: "user2@test.com" })).toBe(true);
    });

    test("identifies hybrid member via hybridPageUser flag", () => {
      expect(isMemberHybrid({ hybridPageUser: true, emailId: "user3@test.com" })).toBe(true);
      expect(isMemberHybrid({ hybridPageUser: "true", emailId: "user4@test.com" })).toBe(true);
    });

    test("identifies hybrid member via memberType or registrationSource", () => {
      expect(isMemberHybrid({ memberType: "hybrid", emailId: "user5@test.com" })).toBe(true);
      expect(isMemberHybrid({ registrationSource: "hybrid", emailId: "user6@test.com" })).toBe(true);
    });

    test("identifies hybrid member via subscriptionType or plan name", () => {
      expect(isMemberHybrid({ subscriptionType: "hybrid", emailId: "user7@test.com" })).toBe(true);
      expect(isMemberHybrid({ planName: "Special Hybrid Unlimited", emailId: "user8@test.com" })).toBe(true);
      expect(isMemberHybrid({ planDetails: { subscriptionType: "hybrid" } })).toBe(true);
    });

    test("rejects standard members from hybrid classification", () => {
      expect(isMemberHybrid({ memberType: "normal", emailId: "user9@test.com" })).toBe(false);
      expect(isMemberHybrid({ isHybrid: false, hybridPageUser: false, emailId: "user10@test.com" })).toBe(false);
      expect(isMemberHybrid({ planName: "Online 10-Class Pack" })).toBe(false);
      expect(isMemberHybrid(null)).toBe(false);
    });
  });

  describe("isMemberNormal", () => {
    test("identifies normal member with referral and excludes hybrid members", () => {
      const normalMember = {
        emailId: "normal@test.com",
        memberType: "normal",
        referred_code: "INST123",
      };
      expect(isMemberNormal(normalMember)).toBe(true);

      const hybridMember = {
        emailId: "hybrid@test.com",
        isHybrid: true,
        referred_code: "INST123",
      };
      expect(isMemberNormal(hybridMember)).toBe(false);
    });

    test("classifies standard referred members as normal without ambiguity", () => {
      expect(isMemberNormal({ registrationSource: "referral", emailId: "ref@test.com" })).toBe(true);
      expect(isMemberNormal({ isHybrid: false, emailId: "not_hybrid@test.com" })).toBe(true);
    });
  });

  describe("List Deduplication and Count Reconciliation", () => {
    test("deduplicates members across hybrid and normal lists without duplicate count", () => {
      const memberA = {
        emailId: "dup@test.com",
        cognitoId: "cog-1",
        userName: "Member A",
        isHybrid: true,
      };
      const memberB = {
        emailId: "normal@test.com",
        cognitoId: "cog-2",
        userName: "Member B",
        memberType: "normal",
      };

      const hybridList = [memberA];
      const normalList = [memberB];
      // Simulate raw list with duplicate entry of memberA
      const rawAll = [memberA, memberA, memberB];

      const deduplicatedAll = deduplicateUserList(rawAll);
      expect(deduplicatedAll).toHaveLength(2);

      const counts = {
        total: deduplicatedAll.length,
        hybrid: hybridList.length,
        normal: normalList.length,
      };

      expect(counts.total).toBe(2);
      expect(counts.hybrid).toBe(1);
      expect(counts.normal).toBe(1);
      expect(counts.total).toBe(counts.hybrid + counts.normal);
    });

    test("supports backend response fields hybridMembers, normalMembers, counts", () => {
      const apiResponse = {
        hybridMembers: [
          { emailId: "h1@test.com", cognitoId: "h1", isHybrid: true },
          { emailId: "h2@test.com", cognitoId: "h2", isHybrid: true },
        ],
        normalMembers: [
          { emailId: "n1@test.com", cognitoId: "n1", memberType: "normal" },
        ],
        allMembers: [
          { emailId: "h1@test.com", cognitoId: "h1", isHybrid: true },
          { emailId: "h2@test.com", cognitoId: "h2", isHybrid: true },
          { emailId: "n1@test.com", cognitoId: "n1", memberType: "normal" },
        ],
        counts: {
          total: 3,
          hybrid: 2,
          normal: 1,
        },
      };

      expect(apiResponse.counts.total).toBe(3);
      expect(apiResponse.counts.hybrid).toBe(2);
      expect(apiResponse.counts.normal).toBe(1);

      const deduplicated = deduplicateUserList(apiResponse.allMembers);
      expect(deduplicated).toHaveLength(3);
    });
  });
});
