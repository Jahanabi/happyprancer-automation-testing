const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");

process.env.AWS_REGION = "us-east-2";
process.env.PROFILE_TABLE_NAME = "beta_user_profile";
process.env.RATING_TABLE_NAME = "beta_rating";
process.env.INSTRUCTOR_TABLE_NAME = "beta_instructors";
process.env.ATTENDANCE_TABLE_NAME = "beta_attendance";

class MockDynamoDb {
  constructor() {
    this.tables = {
      beta_user_profile: new Map(),
      beta_rating: new Map(),
      beta_instructors: new Map(),
      beta_attendance: new Map(),
    };
    this.throwOnProfileGet = false;
  }

  clear() {
    for (const table of Object.values(this.tables)) {
      table.clear();
    }
    this.throwOnProfileGet = false;
  }

  getKey(tableName, keyObj) {
    if (tableName === "beta_user_profile") {
      return `${keyObj.institution}#${keyObj.cognitoId}`;
    }
    if (tableName === "beta_rating") {
      return `${keyObj.instructorId}#${keyObj.timestamp}`;
    }
    if (tableName === "beta_instructors") {
      return `${keyObj.institution}#${keyObj.instructorId || keyObj.cognitoId}`;
    }
    if (tableName === "beta_attendance") {
      return `${keyObj.institutionClassId}#${keyObj.cognitoId || keyObj["emailId&StartTime"]}`;
    }
    return JSON.stringify(keyObj);
  }

  async send(command) {
    const cmd = command.constructor.name;
    const input = command.input;
    const tableName = input.TableName;

    if (cmd === "TransactWriteCommand") {
      for (const tItem of input.TransactItems || []) {
        if (tItem.Put) {
          await this.send({ constructor: { name: "PutCommand" }, input: tItem.Put });
        }
        if (tItem.Update) {
          await this.send({ constructor: { name: "UpdateCommand" }, input: tItem.Update });
        }
        if (tItem.Delete) {
          await this.send({ constructor: { name: "DeleteCommand" }, input: tItem.Delete });
        }
      }
      return {};
    }

    if (cmd === "GetCommand") {
      if (this.throwOnProfileGet && tableName === "beta_user_profile") {
        throw new Error("Simulated DynamoDB network error");
      }
      const table = this.tables[tableName];
      if (!table) return { Item: undefined };
      const key = this.getKey(tableName, input.Key);
      const item = table.get(key);
      return { Item: item ? JSON.parse(JSON.stringify(item)) : undefined };
    }

    if (cmd === "PutCommand") {
      const table = this.tables[tableName];
      if (!table) throw new Error(`Unknown table ${tableName}`);
      const key = this.getKey(tableName, input.Item);
      table.set(key, JSON.parse(JSON.stringify(input.Item)));
      return {};
    }

    if (cmd === "UpdateCommand") {
      const table = this.tables[tableName];
      if (!table) throw new Error(`Unknown table ${tableName}`);
      const key = this.getKey(tableName, input.Key);
      let item = table.get(key) || { ...input.Key };

      if (input.ExpressionAttributeValues) {
        if (input.UpdateExpression && input.UpdateExpression.includes("rating_points = if_not_exists(rating_points, :zero) + :inc")) {
          const inc = input.ExpressionAttributeValues[":inc"] !== undefined ? input.ExpressionAttributeValues[":inc"] : 1;
          item.rating_points = (item.rating_points || 0) + inc;
          if (input.ExpressionAttributeValues[":ratingKeyList"]) {
            item.rated_classes = [...(item.rated_classes || []), ...input.ExpressionAttributeValues[":ratingKeyList"]];
          }
        }
        if (input.ExpressionAttributeValues[":r"] !== undefined) {
          item.rating = input.ExpressionAttributeValues[":r"];
        }
        if (input.ExpressionAttributeValues[":rev"] !== undefined) {
          item.review = input.ExpressionAttributeValues[":rev"];
        }
        if (input.ExpressionAttributeValues[":ed"] !== undefined) {
          item.edited = input.ExpressionAttributeValues[":ed"];
        }
        if (input.ExpressionAttributeValues[":now"] !== undefined) {
          item.updatedAt = input.ExpressionAttributeValues[":now"];
        }
      }

      table.set(key, item);
      return { Attributes: JSON.parse(JSON.stringify(item)) };
    }

    if (cmd === "QueryCommand") {
      const table = this.tables[tableName];
      if (!table) return { Items: [] };
      let items = Array.from(table.values());

      if (input.KeyConditionExpression) {
        if (input.KeyConditionExpression.includes("institution = :inst")) {
          const instVal = input.ExpressionAttributeValues[":inst"];
          items = items.filter((it) => it.institution === instVal);
        }
        if (input.KeyConditionExpression.includes("institutionClassId = :icId")) {
          const icVal = input.ExpressionAttributeValues[":icId"];
          items = items.filter((it) => it.institutionClassId === icVal);
        }
        if (input.KeyConditionExpression.includes("instructorId = :instId")) {
          const instIdVal = input.ExpressionAttributeValues[":instId"];
          items = items.filter((it) => it.instructorId === instIdVal);
        }
      }

      if (input.FilterExpression) {
        if (input.FilterExpression.includes("userId = :uid AND classId = :cid")) {
          const uid = input.ExpressionAttributeValues[":uid"];
          const cid = input.ExpressionAttributeValues[":cid"];
          items = items.filter((it) => it.userId === uid && it.classId === cid);
        }
      }

      return {
        Items: items.map((it) => JSON.parse(JSON.stringify(it))),
      };
    }

    if (cmd === "ScanCommand") {
      const table = this.tables[tableName];
      if (!table) return { Items: [] };
      let items = Array.from(table.values());

      // Multi-page pagination support
      const pageSize = input.Limit || 2;
      const startIndex = input.ExclusiveStartKey ? Number(input.ExclusiveStartKey.index) : 0;
      const pageItems = items.slice(startIndex, startIndex + pageSize);
      const nextIndex = startIndex + pageSize;
      const lastEvaluatedKey = nextIndex < items.length ? { index: nextIndex } : undefined;

      return {
        Items: pageItems.map((it) => JSON.parse(JSON.stringify(it))),
        LastEvaluatedKey: lastEvaluatedKey,
      };
    }

    return {};
  }
}

const mockDb = new MockDynamoDb();
const libDynamo = require("@aws-sdk/lib-dynamodb");
libDynamo.DynamoDBDocumentClient.prototype.send = function (command) {
  return mockDb.send(command);
};

const ratingFetchHandler = require("../functions_beta/admin/rating-fetch");
const ratingSubmitHandler = require("../functions_beta/user/rating-submit");

describe("HP150: Ratings Display After Class Completion", () => {
  const institution = "happyprancer";
  const callerCognitoId = "admin_caller_1";

  beforeEach(() => {
    mockDb.clear();
  });

  // =========================================================================
  // 1. Authorization & Profile Handling (Refinement 3)
  // =========================================================================
  describe("Authorization & Profile Handling", () => {
    test("Missing caller profile returns 401 Not Authorized without throwing TypeError", async () => {
      const event = {
        pathParameters: { institution },
        requestContext: { identity: { cognitoIdentityId: "ghost_caller" } },
      };

      const res = await ratingFetchHandler.main(event);
      assert.equal(res.statusCode, 401);
      const body = JSON.parse(res.body);
      assert.match(body.error, /Not Authorized/i);
    });

    test("DynamoDB error during profile lookup returns 500 without crashing", async () => {
      mockDb.throwOnProfileGet = true;
      const event = {
        pathParameters: { institution },
        requestContext: { identity: { cognitoIdentityId: callerCognitoId } },
      };

      const res = await ratingFetchHandler.main(event);
      assert.equal(res.statusCode, 500);
      const body = JSON.parse(res.body);
      assert.equal(body.error, "Internal Server Error");
    });

    test("Caller with unauthorized userType returns 401 Not Authorized", async () => {
      mockDb.tables.beta_user_profile.set(`${institution}#${callerCognitoId}`, {
        institution,
        cognitoId: callerCognitoId,
        userType: "anonymous",
      });

      const event = {
        pathParameters: { institution },
        requestContext: { identity: { cognitoIdentityId: callerCognitoId } },
      };

      const res = await ratingFetchHandler.main(event);
      assert.equal(res.statusCode, 401);
      const body = JSON.parse(res.body);
      assert.match(body.error, /Not Authorized/i);
    });
  });

  // =========================================================================
  // 2. Scan Pagination & Cross-Institution Isolation (Refinement 1 & 7)
  // =========================================================================
  describe("Scan Pagination & Cross-Institution Isolation", () => {
    test("Multi-page scan retrieves ratings and isolates ratings by institution", async () => {
      mockDb.tables.beta_user_profile.set(`${institution}#${callerCognitoId}`, {
        institution,
        cognitoId: callerCognitoId,
        userType: "admin",
      });

      // Ratings across multiple institutions
      mockDb.tables.beta_rating.set("inst1#1000", {
        instructorId: "inst1",
        timestamp: "1700000010000",
        institution: "happyprancer",
        rating: 5,
        review: "Excellent class!",
      });
      mockDb.tables.beta_rating.set("inst2#1001", {
        instructorId: "inst2",
        timestamp: "1700000020000",
        institution: "other_studio",
        rating: 4,
        review: "Great",
      });
      mockDb.tables.beta_rating.set("inst1#1002", {
        instructorId: "inst1",
        timestamp: "1700000030000",
        institution: "happyprancer",
        rating: 5,
        review: "Awesome energy!",
      });

      const event = {
        pathParameters: { institution },
        requestContext: { identity: { cognitoIdentityId: callerCognitoId } },
      };

      const res = await ratingFetchHandler.main(event);
      assert.equal(res.statusCode, 200);

      const ratings = JSON.parse(res.body);
      assert.equal(ratings.length, 2, "Only ratings belonging to happyprancer should be returned");
      assert.ok(ratings.every((r) => r.institution === "happyprancer"));
    });

    test("Gap 5 / Refinement 1: Legacy ratings with unproven instructor ownership remain strictly excluded", async () => {
      mockDb.tables.beta_user_profile.set(`${institution}#${callerCognitoId}`, {
        institution,
        cognitoId: callerCognitoId,
        userType: "admin",
      });

      // Seed verified instructor ONLY for verified_teacher
      mockDb.tables.beta_instructors.set(`${institution}#verified_teacher`, {
        institution: "happyprancer",
        instructorId: "verified_teacher",
      });

      // Legacy rating 1: instructor verified in happyprancer
      mockDb.tables.beta_rating.set("verified_teacher#2001", {
        instructorId: "verified_teacher",
        timestamp: "1700000010000-user1",
        // No institution field!
        rating: 5,
        review: "Legacy rating with verified teacher",
      });

      // Legacy rating 2: instructor belongs to external studio or unverified ownership
      mockDb.tables.beta_rating.set("unproven_teacher#2002", {
        instructorId: "unproven_teacher",
        timestamp: "1700000020000-user2",
        // No institution field!
        rating: 4,
        review: "Legacy rating with unproven teacher",
      });

      const event = {
        pathParameters: { institution },
        requestContext: { identity: { cognitoIdentityId: callerCognitoId } },
      };

      const res = await ratingFetchHandler.main(event);
      assert.equal(res.statusCode, 200);

      const ratings = JSON.parse(res.body);
      assert.equal(ratings.length, 1, "Only legacy rating with proven instructor ownership is returned");
      assert.equal(ratings[0].instructorId, "verified_teacher");
      // Confirm unproven teacher was strictly excluded
      assert.ok(!ratings.some((r) => r.instructorId === "unproven_teacher"));
    });
  });

  // =========================================================================
  // 3. Deterministic Sorting & Timestamp Handling (Refinement 2)
  // =========================================================================
  describe("Deterministic Sorting & Timestamp Handling", () => {
    test("Safely extracts epoch from composite timestamps and sorts in descending chronological order", async () => {
      mockDb.tables.beta_user_profile.set(`${institution}#${callerCognitoId}`, {
        institution,
        cognitoId: callerCognitoId,
        userType: "instructor",
      });

      const now = 1700000000000;
      mockDb.tables.beta_rating.set("inst1#ts_old", {
        instructorId: "inst1",
        timestamp: `${now - 2000}-cognito_user_1`,
        institution,
        rating: 3,
      });
      mockDb.tables.beta_rating.set("inst1#ts_new", {
        instructorId: "inst1",
        timestamp: `${now}-cognito_user_2`,
        institution,
        rating: 5,
      });
      mockDb.tables.beta_rating.set("inst1#ts_mid", {
        instructorId: "inst1",
        timestamp: String(now - 1000),
        institution,
        rating: 4,
      });

      const event = {
        pathParameters: { institution },
        requestContext: { identity: { cognitoIdentityId: callerCognitoId } },
      };

      const res = await ratingFetchHandler.main(event);
      assert.equal(res.statusCode, 200);

      const ratings = JSON.parse(res.body);
      assert.equal(ratings.length, 3);
      assert.equal(ratings[0].timestampMs, now);
      assert.equal(ratings[1].timestampMs, now - 1000);
      assert.equal(ratings[2].timestampMs, now - 2000);

      assert.equal(ratings[0].timestamp, `${now}-cognito_user_2`);
      assert.equal(ratings[2].timestamp, `${now - 2000}-cognito_user_1`);
    });


    test("HP150: Member identity matching and isolation across userId, composite timestamp, and verified email", async () => {
      const aliceCognitoId = "member_alice_id";
      const bobCognitoId = "member_bob_id";

      mockDb.tables.beta_user_profile.set(`${institution}#${aliceCognitoId}`, {
        institution,
        cognitoId: aliceCognitoId,
        emailId: "alice@test.com",
        userType: "member",
      });
      mockDb.tables.beta_user_profile.set(`${institution}#${bobCognitoId}`, {
        institution,
        cognitoId: bobCognitoId,
        emailId: "bob@test.com",
        userType: "member",
      });

      // Alice's rating with userId (modern rating-submit format)
      mockDb.tables.beta_rating.set("inst1#alice_modern", {
        instructorId: "inst1",
        userId: aliceCognitoId,
        timestamp: "1700000001000",
        institution,
        rating: 5,
        review: "Alice modern rating",
      });

      // Alice's rating with composite timestamp
      mockDb.tables.beta_rating.set("inst1#alice_composite", {
        instructorId: "inst1",
        timestamp: `1700000002000-${aliceCognitoId}`,
        institution,
        rating: 4,
        review: "Alice composite rating",
      });

      // Alice's legacy rating with userEmailId
      mockDb.tables.beta_rating.set("inst1#alice_legacy", {
        instructorId: "inst1",
        userEmailId: "alice@test.com",
        timestamp: "1700000000500",
        institution,
        rating: 5,
        review: "Alice legacy rating",
      });

      // Bob's rating
      mockDb.tables.beta_rating.set("inst1#bob_rating", {
        instructorId: "inst1",
        userId: bobCognitoId,
        timestamp: "1700000003000",
        institution,
        rating: 3,
        review: "Bob rating",
      });

      // When Alice calls rating-fetch:
      const aliceEvent = {
        pathParameters: { institution },
        requestContext: { identity: { cognitoIdentityId: aliceCognitoId } },
      };
      const aliceRes = await ratingFetchHandler.main(aliceEvent);
      assert.equal(aliceRes.statusCode, 200);
      const aliceRatings = JSON.parse(aliceRes.body);
      assert.equal(aliceRatings.length, 3, "Alice receives all 3 of her ratings across formats");
      assert.ok(aliceRatings.every((r) => r.review.startsWith("Alice")), "Alice only sees her own ratings");

      // When Bob calls rating-fetch:
      const bobEvent = {
        pathParameters: { institution },
        requestContext: { identity: { cognitoIdentityId: bobCognitoId } },
      };
      const bobRes = await ratingFetchHandler.main(bobEvent);
      assert.equal(bobRes.statusCode, 200);
      const bobRatings = JSON.parse(bobRes.body);
      assert.equal(bobRatings.length, 1, "Bob receives only his 1 rating");
      assert.equal(bobRatings[0].review, "Bob rating");
    });

    test("Deterministic tie-breaking when timestamps are identical", async () => {
      mockDb.tables.beta_user_profile.set(`${institution}#${callerCognitoId}`, {
        institution,
        cognitoId: callerCognitoId,
        userType: "admin",
      });

      const fixedEpoch = 1700000050000;
      mockDb.tables.beta_rating.set("instA#fixed_a", {
        instructorId: "instA",
        timestamp: `${fixedEpoch}-user_alpha`,
        institution,
        rating: 4,
      });
      mockDb.tables.beta_rating.set("instB#fixed_z", {
        instructorId: "instB",
        timestamp: `${fixedEpoch}-user_zeta`,
        institution,
        rating: 5,
      });

      const event = {
        pathParameters: { institution },
        requestContext: { identity: { cognitoIdentityId: callerCognitoId } },
      };

      const res1 = await ratingFetchHandler.main(event);
      const res2 = await ratingFetchHandler.main(event);

      const list1 = JSON.parse(res1.body);
      const list2 = JSON.parse(res2.body);

      assert.deepEqual(list1, list2, "Repeated queries must yield identical deterministic ordering");
      assert.equal(list1[0].timestamp, `${fixedEpoch}-user_zeta`);
      assert.equal(list1[1].timestamp, `${fixedEpoch}-user_alpha`);
    });
  });

  // =========================================================================
  // 4. HP151/HP153 Preservation and End-to-End Rating Lifecycle
  // =========================================================================
  describe("HP151/HP153 Preservation and End-to-End Lifecycle", () => {
    test("HP151: Non-attendee cannot submit rating (fails closed with 403)", async () => {
      const studentCognitoId = "student_non_attendee";
      mockDb.tables.beta_user_profile.set(`${institution}#${studentCognitoId}`, {
        institution,
        cognitoId: studentCognitoId,
        emailId: "absent@student.com",
        userType: "member",
      });

      const submitEvent = {
        pathParameters: { institution },
        requestContext: { identity: { cognitoIdentityId: studentCognitoId } },
        body: JSON.stringify({
          instructorId: "teacher_1",
          classId: "class_hiphop_101",
          rating: 5,
          review: "Was not even there",
        }),
      };

      const submitRes = await ratingSubmitHandler.main(submitEvent);
      assert.equal(submitRes.statusCode, 403, "Must reject rating submission for non-attendees");
      const body = JSON.parse(submitRes.body);
      assert.match(body.error, /not attended/i);
    });

    test("Gap 5 (HP153): Identical rating submission does not award points twice", async () => {
      const studentCognitoId = "student_attendee_repeat";
      const teacherId = "teacher_jazz";
      const classId = "class_jazz_101";

      mockDb.tables.beta_user_profile.set(`${institution}#${studentCognitoId}`, {
        institution,
        cognitoId: studentCognitoId,
        emailId: "jazz_fan@student.com",
        userName: "Jazz Fan",
        userType: "member",
        rating_points: 0,
      });

      mockDb.tables.beta_attendance.set(`${institution}${classId}#${studentCognitoId}`, {
        institutionClassId: `${institution}${classId}`,
        cognitoId: studentCognitoId,
        emailId: "jazz_fan@student.com",
        status: "attended",
      });

      const submitEvent = {
        pathParameters: { institution },
        requestContext: { identity: { cognitoIdentityId: studentCognitoId } },
        body: JSON.stringify({
          instructorId: teacherId,
          classId: classId,
          rating: 5,
          review: "Fantastic jazz session",
        }),
      };

      // 1. Initial submission: awards 10 rating points
      const res1 = await ratingSubmitHandler.main(submitEvent);
      assert.equal(res1.statusCode, 200);

      const profileAfterFirst = mockDb.tables.beta_user_profile.get(`${institution}#${studentCognitoId}`);
      assert.equal(profileAfterFirst.rating_points, 1, "First submission awards 1 point");

      // 2. Identical submission of same rating and review: must NOT award points twice
      const res2 = await ratingSubmitHandler.main(submitEvent);
      assert.equal(res2.statusCode, 200);
      const body2 = JSON.parse(res2.body);
      assert.match(body2.message, /Rating already submitted/i);

      const profileAfterRepeat = mockDb.tables.beta_user_profile.get(`${institution}#${studentCognitoId}`);
      assert.equal(profileAfterRepeat.rating_points, 1, "Points must strictly remain 1 (no double award)");
    });

    test("Gap 5 (HP153): Editing an existing rating does NOT award points again", async () => {
      const studentCognitoId = "student_attendee_editor";
      const teacherId = "teacher_ballet";
      const classId = "class_ballet_201";

      mockDb.tables.beta_user_profile.set(`${institution}#${studentCognitoId}`, {
        institution,
        cognitoId: studentCognitoId,
        emailId: "ballet_fan@student.com",
        userName: "Ballet Fan",
        userType: "member",
        rating_points: 0,
      });

      mockDb.tables.beta_attendance.set(`${institution}${classId}#${studentCognitoId}`, {
        institutionClassId: `${institution}${classId}`,
        cognitoId: studentCognitoId,
        emailId: "ballet_fan@student.com",
        status: "attended",
      });

      // 1. Initial submission: 4 stars
      const res1 = await ratingSubmitHandler.main({
        pathParameters: { institution },
        requestContext: { identity: { cognitoIdentityId: studentCognitoId } },
        body: JSON.stringify({
          instructorId: teacherId,
          classId: classId,
          rating: 4,
          review: "Good class",
        }),
      });
      assert.equal(res1.statusCode, 200);

      const profileAfterInitial = mockDb.tables.beta_user_profile.get(`${institution}#${studentCognitoId}`);
      assert.equal(profileAfterInitial.rating_points, 1);

      // 2. Edited submission: change to 5 stars with new review
      const resEdit = await ratingSubmitHandler.main({
        pathParameters: { institution },
        requestContext: { identity: { cognitoIdentityId: studentCognitoId } },
        body: JSON.stringify({
          instructorId: teacherId,
          classId: classId,
          rating: 5,
          review: "Upgrading to 5 stars - amazing teacher!",
        }),
      });
      assert.equal(resEdit.statusCode, 200);
      const editBody = JSON.parse(resEdit.body);
      assert.match(editBody.message, /Rating updated successfully/i);
      assert.equal(editBody.rating.rating, 5);

      // Verify points did NOT increase
      const profileAfterEdit = mockDb.tables.beta_user_profile.get(`${institution}#${studentCognitoId}`);
      assert.equal(profileAfterEdit.rating_points, 1, "Points must strictly remain 1 upon editing");
    });

    test("End-to-End: Valid class attendee submits rating -> fetched in rating-fetch with proper institution isolation", async () => {
      const studentCognitoId = "student_attendee_1";
      const teacherId = "teacher_hiphop";
      const classId = "class_hiphop_101";

      mockDb.tables.beta_user_profile.set(`${institution}#${studentCognitoId}`, {
        institution,
        cognitoId: studentCognitoId,
        emailId: "dance_lover@student.com",
        userName: "Dance Lover",
        userType: "member",
      });

      mockDb.tables.beta_user_profile.set(`${institution}#${callerCognitoId}`, {
        institution,
        cognitoId: callerCognitoId,
        userType: "admin",
      });

      mockDb.tables.beta_attendance.set(`${institution}${classId}#${studentCognitoId}`, {
        institutionClassId: `${institution}${classId}`,
        cognitoId: studentCognitoId,
        emailId: "dance_lover@student.com",
        status: "attended",
      });

      const submitEvent = {
        pathParameters: { institution },
        requestContext: { identity: { cognitoIdentityId: studentCognitoId } },
        body: JSON.stringify({
          instructorId: teacherId,
          classId: classId,
          rating: 5,
          review: "Incredible class experience!",
        }),
      };

      const submitRes = await ratingSubmitHandler.main(submitEvent);
      assert.equal(submitRes.statusCode, 200);

      const fetchEvent = {
        pathParameters: { institution },
        requestContext: { identity: { cognitoIdentityId: callerCognitoId } },
      };

      const fetchRes = await ratingFetchHandler.main(fetchEvent);
      assert.equal(fetchRes.statusCode, 200);

      const ratings = JSON.parse(fetchRes.body);
      assert.equal(ratings.length, 1);
      assert.equal(ratings[0].instructorId, teacherId);
      assert.equal(ratings[0].rating, 5);
      assert.equal(ratings[0].institution, institution);
      assert.ok(ratings[0].timestampMs > 0);
    });
  });
});
