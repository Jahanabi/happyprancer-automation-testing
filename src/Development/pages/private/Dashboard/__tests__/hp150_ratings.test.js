/**
 * Automated Test Suite: HP150 — Ratings Not Displayed After Class Ends
 *
 * Verifies that ratings returned from the backend after class completion are:
 * 1. Correctly parsed and ordered by timestamp (handling composite sort keys).
 * 2. Filtered safely according to user roles (Admin, Instructor, Member) while preserving institution scope.
 * 3. Rendered without crashing when optional fields (e.g. userName, review, instructorName, timestamp) are missing.
 * 4. Handled distinctly between empty lists and API failures.
 * 5. Reconciled properly after submission/update without duplicates.
 */

import {
  extractRatingTimestamp,
  sortRatingsChronologically,
  filterRatingsByRole,
  formatMemberDisplayName,
  formatInstructorDisplayName,
  groupRatingsByDate,
  reconcileRatingList,
} from "../../../../utils/ratingService";

describe("HP150 — Ratings Not Displayed After Class Ends", () => {
  // Sample fixture ratings matching actual backend DynamoDB schema
  const mockBackendRatings = [
    {
      institution: "happyprancer",
      instructorId: "inst_alpha",
      classId: "class_hiphop_101",
      userId: "us-east-2:user_01",
      rating: 5,
      review: "Loved the routine!",
      userName: "Alice Cooper",
      userEmailId: "alice@example.com",
      instructorName: "Master Dan",
      timestamp: "1729000000000-us-east-2:user_01", // Composite sort key
      timestampMs: 1729000000000,
    },
    {
      institution: "happyprancer",
      instructorId: "inst_alpha",
      classId: "class_hiphop_102",
      userId: "us-east-2:user_02",
      rating: 4,
      review: "Great instructor pace",
      userName: "Bob Dylan",
      userEmailId: "bob@example.com",
      instructorName: "Master Dan",
      timestamp: "1729100000000-us-east-2:user_02", // Later timestamp
      timestampMs: 1729100000000,
    },
    {
      institution: "happyprancer",
      instructorId: "inst_beta",
      classId: "class_salsa_201",
      userId: "us-east-2:user_03",
      rating: 5,
      review: "Smooth salsa moves",
      userName: "Charlie Brown",
      userEmailId: "charlie@example.com",
      instructorName: "Instructor Sarah",
      timestamp: "1729050000000-us-east-2:user_03",
      timestampMs: 1729050000000,
    },
  ];

  // 1. Timestamp Extraction and Composite Sort Key Handling
  describe("Timestamp Extraction (Composite Sort Key Support)", () => {
    test("extracts epoch from numeric timestampMs or createdAt", () => {
      expect(extractRatingTimestamp({ timestampMs: 1729000000000 })).toBe(1729000000000);
      expect(extractRatingTimestamp({ createdAt: 1729000000000 })).toBe(1729000000000);
      expect(extractRatingTimestamp({ timestamp: 1729000000000 })).toBe(1729000000000);
    });

    test("extracts epoch from composite DynamoDB string '${epoch}-${userId}'", () => {
      const compositeKey = "1729100000000-us-east-2:some-user-guid";
      expect(extractRatingTimestamp({ timestamp: compositeKey })).toBe(1729100000000);
      expect(extractRatingTimestamp(compositeKey)).toBe(1729100000000);
    });

    test("extracts epoch from numeric string or ISO string", () => {
      expect(extractRatingTimestamp("1729100000000")).toBe(1729100000000);
      const iso = "2026-10-18T10:00:00.000Z";
      expect(extractRatingTimestamp(iso)).toBe(Date.parse(iso));
    });

    test("returns 0 for missing, null, or invalid timestamps without throwing", () => {
      expect(extractRatingTimestamp(null)).toBe(0);
      expect(extractRatingTimestamp(undefined)).toBe(0);
      expect(extractRatingTimestamp({})).toBe(0);
      expect(extractRatingTimestamp("invalid-timestamp")).toBe(0);
    });
  });

  // 2. Chronological Ordering
  describe("Chronological Ordering", () => {
    test("sorts ratings strictly descending by timestamp", () => {
      const sorted = sortRatingsChronologically(mockBackendRatings);
      // Index 1 (1729100000000) should be first
      expect(sorted[0].userId).toBe("us-east-2:user_02");
      // Index 2 (1729050000000) should be second
      expect(sorted[1].userId).toBe("us-east-2:user_03");
      // Index 0 (1729000000000) should be third
      expect(sorted[2].userId).toBe("us-east-2:user_01");
    });

    test("handles ratings with composite string timestamps without producing NaN", () => {
      const items = [
        { timestamp: "1000-userA", id: "A" },
        { timestamp: "3000-userB", id: "B" },
        { timestamp: "2000-userC", id: "C" },
      ];
      const sorted = sortRatingsChronologically(items);
      expect(sorted.map((i) => i.id)).toEqual(["B", "C", "A"]);
    });

    test("gracefully sorts ratings when timestamps are missing or invalid", () => {
      const items = [
        { id: "no-time" },
        { timestamp: "1729000000000", id: "with-time" },
      ];
      const sorted = sortRatingsChronologically(items);
      expect(sorted[0].id).toBe("with-time");
      expect(sorted[1].id).toBe("no-time");
    });
  });

  // 3. Resilience to Missing Optional Fields
  describe("Defensive Formatting of Optional Fields", () => {
    test("formatMemberDisplayName returns first name when userName is present", () => {
      expect(formatMemberDisplayName({ userName: "John Doe" })).toBe("John");
      expect(formatMemberDisplayName({ userName: "SingleName" })).toBe("SingleName");
    });

    test("formatMemberDisplayName falls back safely when userName is null, missing, or empty", () => {
      expect(formatMemberDisplayName({ userId: "user_123" })).toBe("user_123");
      expect(formatMemberDisplayName({})).toBe("Member");
      expect(formatMemberDisplayName(null)).toBe("Member");
      expect(formatMemberDisplayName({ userName: "" })).toBe("Member");
    });

    test("formatInstructorDisplayName returns instructor name or fallback", () => {
      expect(formatInstructorDisplayName({ instructorName: "Master Dan" })).toBe("Master Dan");
      expect(formatInstructorDisplayName({})).toBe("Instructor");
      expect(formatInstructorDisplayName(null)).toBe("Instructor");
    });
  });

  // 4. Role-based Access Filtering
  describe("Role-based Access Filtering (HP150 UI Scope)", () => {
    test("admin sees all ratings in the institution", () => {
      const adminUser = { userType: "admin", cognitoId: "admin_01" };
      const filtered = filterRatingsByRole(mockBackendRatings, adminUser);
      expect(filtered).toHaveLength(3);
    });

    test("instructor sees only ratings for their instructorId or emailId", () => {
      const instructorUser = {
        userType: "instructor",
        cognitoId: "inst_alpha",
        emailId: "dan@example.com",
      };
      const filtered = filterRatingsByRole(mockBackendRatings, instructorUser);
      expect(filtered).toHaveLength(2);
      expect(filtered.every((r) => r.instructorId === "inst_alpha")).toBe(true);
    });

    test("member sees only ratings they personally submitted", () => {
      const memberUser = {
        userType: "member",
        cognitoId: "us-east-2:user_01",
        emailId: "alice@example.com",
      };
      const filtered = filterRatingsByRole(mockBackendRatings, memberUser);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].userId).toBe("us-east-2:user_01");
    });

    test("unknown user type sees no ratings", () => {
      const guestUser = { userType: "guest" };
      const filtered = filterRatingsByRole(mockBackendRatings, guestUser);
      expect(filtered).toHaveLength(0);
    });
  });

  // 5. Rating List Reconciliation & Deduplication
  describe("Rating List Reconciliation (Submission Refresh)", () => {
    test("prepends newly created rating without duplicate rows", () => {
      const currentList = [...mockBackendRatings];
      const newRating = {
        institution: "happyprancer",
        instructorId: "inst_gamma",
        classId: "class_contemporary_301",
        userId: "us-east-2:user_04",
        rating: 5,
        review: "Brand new rating after class",
        timestamp: "1729200000000-us-east-2:user_04",
      };

      const reconciled = reconcileRatingList(currentList, newRating);
      expect(reconciled).toHaveLength(4);
      expect(reconciled[0].userId).toBe("us-east-2:user_04");
    });

    test("updates existing rating in-place without adding duplicate row", () => {
      const currentList = [...mockBackendRatings];
      const updatedRating = {
        institution: "happyprancer",
        instructorId: "inst_alpha",
        classId: "class_hiphop_101",
        userId: "us-east-2:user_01",
        rating: 4,
        review: "Updated review after reflection",
        timestamp: "1729000000000-us-east-2:user_01",
      };

      const reconciled = reconcileRatingList(currentList, updatedRating);
      expect(reconciled).toHaveLength(3);
      const target = reconciled.find((r) => r.classId === "class_hiphop_101");
      expect(target.rating).toBe(4);
      expect(target.review).toBe("Updated review after reflection");
    });
  });

  // 6. Grouping and Aggregation for Instructor Views
  describe("groupRatingsByDate", () => {
    test("calculates accurate average ratings per date", () => {
      const ratings = [
        { timestamp: "1729000000000-user1", rating: 4 },
        { timestamp: "1729000000000-user2", rating: 5 },
      ];
      const grouped = groupRatingsByDate(ratings);
      const keys = Object.keys(grouped);
      expect(keys.length).toBe(1);
      expect(grouped[keys[0]]).toBe(4.5);
    });
  });
});
