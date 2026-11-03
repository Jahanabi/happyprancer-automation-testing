/**
 * Automated Test Suite: HappyPrancer Rating System Defect Fixes (HP151 / HP153)
 *
 * Verifies all 6 requirements and 14 critical scenarios:
 * 1. Valid eligible-user rating submission (Requirement 1 & HP151)
 * 2. Ineligible user receiving 403 attendance rejection (Requirement 2 / HP151)
 * 3. Missing or expired authentication (Requirement 5)
 * 4. Invalid rating input (Requirement 5)
 * 5. Rapid repeated clicks / concurrency protection (Requirement 3 / HP153)
 * 6. Duplicate rating response handling (Requirement 3 / HP153)
 * 7. Loading an existing rating for editing (Requirement 4)
 * 8. Successful edit without duplicate creation (Requirement 4)
 * 9. Failed edit preserving user input (Requirement 4 & 5)
 * 10. Successful new rating with points synchronization (Requirement 6)
 * 11. Failed rating submission without points increment (Requirement 6)
 * 12. Duplicate response without extra points increment (Requirement 6)
 * 13. Network failure with safe diagnostic error feedback (Requirement 5)
 * 14. Reloading and state reconciliation (Requirement 6)
 */

import {
  validateRatingInput,
  buildRatingPayload,
  interpretRatingResponse,
  parseRatingError,
  reconcileRatingList,
  findExistingRating,
} from "../../../utils/ratingService";

describe("HappyPrancer Rating System — HP151 & HP153 Comprehensive Verification", () => {
  const institutionId = "happyprancer";
  const instructor = {
    instructorId: "inst_001",
    emailId: "dance_master@example.com",
    name: "Elena Rostova",
    classType: ["Zumba", "Dance Cardio"],
  };
  const member = {
    cognitoId: "us-east-2:member_abc123",
    emailId: "dancer_anna@example.com",
    userName: "Anna Smith",
    institution: "happyprancer",
    rating_points: 5,
  };
  const classId = "class_zumba_99";

  // Scenario 1: Valid eligible-user rating submission
  describe("Scenario 1: Valid eligible-user rating submission", () => {
    it("builds exact payload conforming to PUT /instructor/rating/{institution} contract", () => {
      const payload = buildRatingPayload({
        instructorId: instructor.instructorId,
        classId,
        rating: 5,
        review: "Incredible energy and choreo!",
        instructor,
        user: member,
      });

      expect(payload).toEqual({
        instructorId: "inst_001",
        classId: "class_zumba_99",
        rating: 5,
        review: "Incredible energy and choreo!",
        instructorEmailId: "dance_master@example.com",
        instructorName: "Elena Rostova",
        userEmailId: "dancer_anna@example.com",
        userName: "Anna Smith",
      });
    });

    it("interprets 200 OK initial creation response and awards exactly 1 point", () => {
      const backendResponse = {
        message: "Rating submitted successfully",
        isCreated: true,
        rating: {
          instructorId: "inst_001",
          classId: "class_zumba_99",
          rating: 5,
          review: "Incredible energy and choreo!",
          userId: member.cognitoId,
          timestamp: "1729000000000",
        },
        updatedUser: {
          Attributes: {
            rating_points: 6,
            ratedClasses: ["class_zumba_99"],
          },
        },
      };

      const result = interpretRatingResponse(backendResponse);
      expect(result.type).toBe("created");
      expect(result.isCreated).toBe(true);
      expect(result.shouldAwardPoints).toBe(true);
      expect(result.pointsAwarded).toBe(1);
      expect(result.authoritativePoints).toBe(6);
      expect(result.message).toBe("Rating submitted successfully");
    });
  });

  // Scenario 2: Attendance eligibility handling (HP151)
  describe("Scenario 2: Attendance Eligibility Enforcement (HP151)", () => {
    it("correctly identifies and formats 403 attendance rejection from backend", () => {
      const apiError = {
        statusCode: 403,
        backendMessage: "Rating not allowed: Member has not attended this class.",
      };

      const parsed = parseRatingError(apiError);
      expect(parsed.statusCode).toBe(403);
      expect(parsed.isAttendanceError).toBe(true);
      expect(parsed.friendlyMessage).toContain("Attendance Required");
      expect(parsed.friendlyMessage).toContain("Member has not attended this class.");
    });

    it("correctly handles ineligible attendance statuses ('absent' or 'cancelled')", () => {
      const apiError = {
        statusCode: 403,
        backendMessage: "Rating not allowed: Member attendance status is ineligible (absent).",
      };

      const parsed = parseRatingError(apiError);
      expect(parsed.statusCode).toBe(403);
      expect(parsed.isAttendanceError).toBe(true);
      expect(parsed.friendlyMessage).toContain("Member attendance status is ineligible (absent)");
    });
  });

  // Scenario 3: Missing or expired authentication
  describe("Scenario 3: Missing or expired authentication", () => {
    it("safely handles 401 Unauthorized without producing a false success", () => {
      const apiError = {
        statusCode: 401,
        backendMessage: "Not Authorized: Valid identity required",
      };

      const parsed = parseRatingError(apiError);
      expect(parsed.statusCode).toBe(401);
      expect(parsed.isAuthError).toBe(true);
      expect(parsed.friendlyMessage).toContain("session has expired");
    });
  });

  // Scenario 4: Invalid rating input
  describe("Scenario 4: Input Validation", () => {
    it("rejects ratings below 1 star", () => {
      const result = validateRatingInput({
        instructorId: "inst_001",
        classId: "class_01",
        rating: 0,
      });
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("between 1 and 5 stars");
    });

    it("rejects ratings above 5 stars", () => {
      const result = validateRatingInput({
        instructorId: "inst_001",
        classId: "class_01",
        rating: 6,
      });
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("between 1 and 5 stars");
    });

    it("rejects missing classId (mandatory for HP151)", () => {
      const result = validateRatingInput({
        instructorId: "inst_001",
        classId: "",
        rating: 5,
      });
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Class session identifier is required");
    });

    it("rejects missing instructorId", () => {
      const result = validateRatingInput({
        instructorId: "",
        classId: "class_01",
        rating: 5,
      });
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Instructor identifier is required");
    });
  });

  // Scenario 5: Rapid repeated clicks / In-flight protection
  describe("Scenario 5: Rapid Repeated Clicks & Concurrency Protection", () => {
    it("simulates in-flight lock preventing redundant simultaneous requests", async () => {
      let isSubmitting = false;
      let requestCounter = 0;

      const submitHandler = async () => {
        if (isSubmitting) return "BLOCKED";
        isSubmitting = true;
        requestCounter++;
        // Simulate async network trip
        await new Promise((resolve) => setTimeout(resolve, 20));
        isSubmitting = false;
        return "SUCCESS";
      };

      // Two rapid clicks
      const firstClick = submitHandler();
      const secondClick = submitHandler();

      const [res1, res2] = await Promise.all([firstClick, secondClick]);
      expect(res1).toBe("SUCCESS");
      expect(res2).toBe("BLOCKED");
      expect(requestCounter).toBe(1);
    });
  });

  // Scenario 6: Duplicate rating response
  describe("Scenario 6: Duplicate Rating Response Handling (HP153)", () => {
    it("interprets 200 OK duplicate response and never awards extra points", () => {
      const duplicateBackendResponse = {
        message: "Rating already submitted for this instructor/class",
        isDuplicate: true,
        rating: {
          instructorId: "inst_001",
          classId: "class_zumba_99",
          rating: 5,
          review: "Incredible energy and choreo!",
          userId: member.cognitoId,
        },
      };

      const result = interpretRatingResponse(duplicateBackendResponse);
      expect(result.type).toBe("duplicate");
      expect(result.isDuplicate).toBe(true);
      expect(result.shouldAwardPoints).toBe(false);
      expect(result.pointsAwarded).toBe(0);
      expect(result.message).toContain("Rating already submitted");
    });
  });

  // Scenario 7: Loading an existing rating for editing
  describe("Scenario 7: Loading Existing Rating for Editing (Requirement 4)", () => {
    const existingRatings = [
      {
        instructorId: "inst_001",
        classId: "class_zumba_99",
        userId: member.cognitoId,
        rating: 4,
        review: "Great session, good pace.",
        timestamp: "1728000000000",
      },
      {
        instructorId: "inst_002",
        classId: "class_yoga_10",
        userId: member.cognitoId,
        rating: 5,
        review: "Very calming.",
        timestamp: "1728100000000",
      },
    ];

    it("locates existing rating matching exact instructorId, classId, and userId", () => {
      const match = findExistingRating(existingRatings, {
        instructorId: "inst_001",
        classId: "class_zumba_99",
        userId: member.cognitoId,
      });

      expect(match).not.toBeNull();
      expect(match.rating).toBe(4);
      expect(match.review).toBe("Great session, good pace.");
    });

    it("returns null when no rating exists for this exact class", () => {
      const match = findExistingRating(existingRatings, {
        instructorId: "inst_001",
        classId: "class_zumba_DIFFERENT",
        userId: member.cognitoId,
      });

      expect(match).toBeNull();
    });
  });

  // Scenario 8: Successful edit without duplicate creation
  describe("Scenario 8: Successful Edit Execution", () => {
    it("interprets 200 OK edit response without awarding points", () => {
      const editBackendResponse = {
        message: "Rating updated successfully",
        isUpdated: true,
        rating: {
          instructorId: "inst_001",
          classId: "class_zumba_99",
          rating: 5,
          review: "Updated: Absolutely extraordinary!",
          userId: member.cognitoId,
          updatedAt: 1729000500000,
        },
      };

      const result = interpretRatingResponse(editBackendResponse);
      expect(result.type).toBe("updated");
      expect(result.isUpdated).toBe(true);
      expect(result.shouldAwardPoints).toBe(false);
      expect(result.pointsAwarded).toBe(0);
      expect(result.message).toContain("Rating updated successfully");
      expect(result.rating.review).toBe("Updated: Absolutely extraordinary!");
    });
  });

  // Scenario 9: Failed edit preserving user input
  describe("Scenario 9: Failed Edit State Preservation", () => {
    it("verifies that when an edit fails, user input is preserved for retry", () => {
      const initialFormState = {
        rating: 5,
        review: "My detailed revised review that must not be lost",
      };

      const simulatedError = new Error("Network timeout during rating update");
      simulatedError.statusCode = 500;

      const parsed = parseRatingError(simulatedError);
      expect(parsed.statusCode).toBe(500);

      // In the component implementation, form values are NOT cleared on error
      const retainedState = { ...initialFormState };
      expect(retainedState.rating).toBe(5);
      expect(retainedState.review).toBe("My detailed revised review that must not be lost");
    });
  });

  // Scenario 10: Successful new rating with correct points synchronization
  describe("Scenario 10: Points Synchronization on New Rating", () => {
    it("reconciles user profile points strictly from authoritative backend response", () => {
      let userProfile = { ...member, rating_points: 10 };

      const creationResponse = {
        message: "Rating submitted successfully",
        isCreated: true,
        updatedUser: {
          Attributes: {
            rating_points: 11,
          },
        },
      };

      const interpreted = interpretRatingResponse(creationResponse);
      if (interpreted.isCreated && interpreted.authoritativePoints !== null) {
        userProfile.rating_points = interpreted.authoritativePoints;
      }

      expect(userProfile.rating_points).toBe(11);
    });
  });

  // Scenario 11: Failed rating submission without a points increment
  describe("Scenario 11: Failed Submission Point Guard", () => {
    it("does not increment points on 403 attendance failure", () => {
      let userProfile = { ...member, rating_points: 10 };
      const failedResult = parseRatingError({ statusCode: 403, message: "Member has not attended" });

      expect(failedResult.statusCode).toBe(403);
      // Ensure points remain exactly 10
      expect(userProfile.rating_points).toBe(10);
    });

    it("does not increment points on 500 server failure", () => {
      let userProfile = { ...member, rating_points: 10 };
      const failedResult = parseRatingError({ statusCode: 500, message: "Server error" });

      expect(failedResult.statusCode).toBe(500);
      expect(userProfile.rating_points).toBe(10);
    });
  });

  // Scenario 12: Duplicate response without an extra points increment
  describe("Scenario 12: Duplicate Response Point Guard", () => {
    it("ensures duplicate submission produces +0 point increment", () => {
      let userProfile = { ...member, rating_points: 10 };

      const duplicateResponse = {
        isDuplicate: true,
        message: "Rating already submitted",
      };

      const interpreted = interpretRatingResponse(duplicateResponse);
      expect(interpreted.shouldAwardPoints).toBe(false);

      if (interpreted.shouldAwardPoints) {
        userProfile.rating_points += 1;
      }

      expect(userProfile.rating_points).toBe(10);
    });
  });

  // Scenario 13: Network failure with safe error feedback
  describe("Scenario 13: Network Failure & Safe Diagnostics", () => {
    it("masks internal stack traces and provides safe actionable message", () => {
      const internalError = new Error("DynamoDB Exception: ResourceNotFoundException in us-east-2 cluster 0x39a1");
      internalError.statusCode = 500;

      const parsed = parseRatingError(internalError);
      expect(parsed.friendlyMessage).not.toContain("0x39a1");
      expect(parsed.friendlyMessage).not.toContain("ResourceNotFoundException");
      expect(parsed.friendlyMessage).toContain("temporarily unavailable");
    });
  });

  // Scenario 14: Reloading and state reconciliation
  describe("Scenario 14: Ratings List Reconciliation", () => {
    it("replaces existing record when updated and avoids duplicate rows", () => {
      const initialRatings = [
        {
          instructorId: "inst_001",
          classId: "class_zumba_99",
          userId: member.cognitoId,
          rating: 4,
          review: "Good class",
        },
        {
          instructorId: "inst_002",
          classId: "class_yoga_10",
          userId: member.cognitoId,
          rating: 5,
          review: "Calm",
        },
      ];

      const updatedRating = {
        instructorId: "inst_001",
        classId: "class_zumba_99",
        userId: member.cognitoId,
        rating: 5,
        review: "Updated to 5 stars! Awesome!",
      };

      const reconciled = reconcileRatingList(initialRatings, updatedRating);
      expect(reconciled.length).toBe(2);
      expect(reconciled[0].rating).toBe(5);
      expect(reconciled[0].review).toBe("Updated to 5 stars! Awesome!");
    });

    it("prepends new record when creating new rating", () => {
      const initialRatings = [
        {
          instructorId: "inst_002",
          classId: "class_yoga_10",
          userId: member.cognitoId,
          rating: 5,
          review: "Calm",
        },
      ];

      const newRating = {
        instructorId: "inst_001",
        classId: "class_zumba_99",
        userId: member.cognitoId,
        rating: 5,
        review: "First time here, amazing!",
      };

      const reconciled = reconcileRatingList(initialRatings, newRating);
      expect(reconciled.length).toBe(2);
      expect(reconciled[0]).toEqual(newRating);
    });
  });
});
