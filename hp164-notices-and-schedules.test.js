const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");

process.env.AWS_REGION = "us-east-2";
process.env.CLASS_NOTICE_TABLE = "beta_class_notice";
process.env.PROFILE_TABLE_NAME = "beta_user_profile";
process.env.SCHEDULE_TABLE_NAME = "beta_schedules";
process.env.PAYMENT_TABLE_NAME = "beta_payments";
process.env.PRODUCT_TABLE_NAME = "beta_products";
process.env.BUSINESS_TIMEZONE = "Asia/Kolkata";

class MockDynamoDb {
  constructor() {
    this.tables = {
      beta_class_notice: new Map(),
      beta_user_profile: new Map(),
      beta_schedules: new Map(),
      beta_payments: new Map(),
      beta_products: new Map(),
    };
  }

  clear() {
    for (const table of Object.values(this.tables)) {
      table.clear();
    }
  }

  getKey(tableName, keyObj) {
    if (tableName === "beta_class_notice") {
      return `${keyObj.institutionId}#${keyObj.date}`;
    }
    if (tableName === "beta_user_profile") {
      return `${keyObj.institution}#${keyObj.cognitoId}`;
    }
    if (tableName === "beta_schedules") {
      return `${keyObj.institution}#${keyObj.scheduleId || keyObj.id || keyObj.date}`;
    }
    if (tableName === "beta_payments") {
      return `${keyObj.cognitoId}#${keyObj.paymentId}`;
    }
    if (tableName === "beta_products") {
      return `${keyObj.institution}#${keyObj.productId}`;
    }
    return JSON.stringify(keyObj);
  }

  async send(command) {
    const cmd = command.constructor.name;
    const input = command.input;
    const tableName = input.TableName;

    if (cmd === "GetCommand") {
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

      // ConditionExpression check (e.g. attribute_not_exists)
      if (input.ConditionExpression && input.ConditionExpression.includes("attribute_not_exists")) {
        if (table.has(key)) {
          const err = new Error("The conditional request failed");
          err.name = "ConditionalCheckFailedException";
          throw err;
        }
      }

      table.set(key, JSON.parse(JSON.stringify(input.Item)));
      return {};
    }

    if (cmd === "UpdateCommand") {
      const table = this.tables[tableName];
      if (!table) throw new Error(`Unknown table ${tableName}`);
      const key = this.getKey(tableName, input.Key);

      if (input.ConditionExpression && input.ConditionExpression.includes("attribute_exists")) {
        if (!table.has(key)) {
          const err = new Error("The conditional request failed");
          err.name = "ConditionalCheckFailedException";
          throw err;
        }
      }

      let item = table.get(key) || { ...input.Key };

      if (input.ExpressionAttributeValues) {
        if (input.ExpressionAttributeValues[":noticeType"] !== undefined) {
          item.noticeType = input.ExpressionAttributeValues[":noticeType"];
        }
        if (input.ExpressionAttributeValues[":data"] !== undefined) {
          item.data = input.ExpressionAttributeValues[":data"];
        }
        if (input.ExpressionAttributeValues[":updatedAt"] !== undefined) {
          item.updatedAt = input.ExpressionAttributeValues[":updatedAt"];
        }
      }

      table.set(key, item);
      return { Attributes: JSON.parse(JSON.stringify(item)) };
    }

    if (cmd === "DeleteCommand") {
      const table = this.tables[tableName];
      if (!table) throw new Error(`Unknown table ${tableName}`);
      const key = this.getKey(tableName, input.Key);

      if (input.ConditionExpression && input.ConditionExpression.includes("attribute_exists")) {
        if (!table.has(key)) {
          const err = new Error("The conditional request failed");
          err.name = "ConditionalCheckFailedException";
          throw err;
        }
      }

      const existing = table.get(key);
      table.delete(key);
      return { Attributes: existing ? JSON.parse(JSON.stringify(existing)) : undefined };
    }

    if (cmd === "QueryCommand") {
      const table = this.tables[tableName];
      if (!table) return { Items: [] };
      let items = Array.from(table.values());

      if (tableName === "beta_class_notice") {
        if (input.ExpressionAttributeValues && input.ExpressionAttributeValues[":institutionId"]) {
          const inst = input.ExpressionAttributeValues[":institutionId"];
          const start = input.ExpressionAttributeValues[":start"];
          const end = input.ExpressionAttributeValues[":end"];

          items = items.filter(
            (it) => it.institutionId === inst && it.date >= start && it.date <= end,
          );
        }
      } else if (tableName === "beta_schedules") {
        if (input.ExpressionAttributeValues && input.ExpressionAttributeValues[":institution"]) {
          const inst = input.ExpressionAttributeValues[":institution"];
          items = items.filter((it) => it.institution === inst);
        }
      }

      // Handle pagination mock
      if (input.ExclusiveStartKey && input.ExclusiveStartKey.pageIndex !== undefined) {
        const idx = input.ExclusiveStartKey.pageIndex;
        items = items.slice(idx);
      }

      if (input.Limit && items.length > input.Limit) {
        const pageItems = items.slice(0, input.Limit);
        return {
          Items: pageItems.map((it) => JSON.parse(JSON.stringify(it))),
          LastEvaluatedKey: { pageIndex: input.Limit },
        };
      }

      return {
        Items: items.map((it) => JSON.parse(JSON.stringify(it))),
      };
    }

    if (cmd === "ScanCommand") {
      const table = this.tables[tableName];
      if (!table) return { Items: [] };
      let items = Array.from(table.values());

      if (input.ExpressionAttributeValues && input.ExpressionAttributeValues[":institution"]) {
        const inst = input.ExpressionAttributeValues[":institution"];
        items = items.filter((it) => it.institution === inst);
      }

      return {
        Items: items.map((it) => JSON.parse(JSON.stringify(it))),
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

// Handlers under test
const createNoticeHandler = require("../functions_beta/admin/create-notice");
const updateNoticeHandler = require("../functions_beta/admin/update-notice");
const deleteNoticeHandler = require("../functions_beta/admin/delete-notice");
const listNoticesHandler = require("../functions_beta/user/list-notices");
const upcomingScheduleHandler = require("../functions_beta/user/upcoming-schedule-list");

describe("HP164: Notices Functionality and Upcoming Schedules", () => {
  const institution = "happyprancer";
  const otherInstitution = "competitor_studio";

  beforeEach(() => {
    mockDb.clear();
  });

  // =========================================================================
  // 1. Notice Creation
  // =========================================================================
  describe("create-notice.js", () => {
    const validDate = Date.UTC(2026, 9, 25, 10, 0, 0); // Oct 25, 2026

    test("Successfully creates notice and returns HTTP 201 with created item", async () => {
      const event = {
        pathParameters: { institution },
        body: JSON.stringify({
          date: validDate,
          noticeType: "class",
          data: "Special guest choreography workshop this Sunday!",
        }),
      };

      const res = await createNoticeHandler.main(event);
      assert.equal(res.statusCode, 201);
      const body = JSON.parse(res.body);
      assert.equal(body.message, "Notice created");
      assert.equal(body.notice.institutionId, institution);
      assert.equal(body.notice.date, validDate);
      assert.equal(body.notice.noticeType, "class");
      assert.equal(body.notice.data, "Special guest choreography workshop this Sunday!");
      assert.ok(body.notice.createdAt > 0);

      const saved = mockDb.tables.beta_class_notice.get(`${institution}#${validDate}`);
      assert.ok(saved);
      assert.equal(saved.noticeType, "class");
    });

    test("Duplicate prevention: fails with HTTP 409 when notice already exists for same institution and date", async () => {
      mockDb.tables.beta_class_notice.set(`${institution}#${validDate}`, {
        institutionId: institution,
        date: validDate,
        noticeType: "schedule",
        data: "Existing notice",
      });

      const event = {
        pathParameters: { institution },
        body: JSON.stringify({
          date: validDate,
          noticeType: "canceled",
          data: "Duplicate attempt",
        }),
      };

      const res = await createNoticeHandler.main(event);
      assert.equal(res.statusCode, 409);
      const body = JSON.parse(res.body);
      assert.match(body.message, /already exists/i);
    });

    test("Validation: rejects missing institution with HTTP 400", async () => {
      const event = {
        pathParameters: {},
        body: JSON.stringify({
          date: validDate,
          noticeType: "class",
          data: "Notice content",
        }),
      };

      const res = await createNoticeHandler.main(event);
      assert.equal(res.statusCode, 400);
      assert.match(JSON.parse(res.body).message, /institution is required/i);
    });

    test("Validation: rejects invalid date with HTTP 400", async () => {
      const event = {
        pathParameters: { institution },
        body: JSON.stringify({
          date: "not-a-number",
          noticeType: "class",
          data: "Notice content",
        }),
      };

      const res = await createNoticeHandler.main(event);
      assert.equal(res.statusCode, 400);
      assert.match(JSON.parse(res.body).message, /epoch-millisecond/i);
    });

    test("Validation: rejects invalid noticeType with HTTP 400", async () => {
      const event = {
        pathParameters: { institution },
        body: JSON.stringify({
          date: validDate,
          noticeType: "invalid_type",
          data: "Notice content",
        }),
      };

      const res = await createNoticeHandler.main(event);
      assert.equal(res.statusCode, 400);
      assert.match(JSON.parse(res.body).message, /noticeType must be one of/i);
    });

    test("Validation: rejects malformed JSON with HTTP 400", async () => {
      const event = {
        pathParameters: { institution },
        body: "{ malformed json",
      };

      const res = await createNoticeHandler.main(event);
      assert.equal(res.statusCode, 400);
      assert.match(JSON.parse(res.body).message, /valid JSON/i);
    });
  });

  // =========================================================================
  // 2. Notice Update
  // =========================================================================
  describe("update-notice.js", () => {
    const validDate = Date.UTC(2026, 9, 25, 10, 0, 0);

    beforeEach(() => {
      mockDb.tables.beta_class_notice.set(`${institution}#${validDate}`, {
        institutionId: institution,
        date: validDate,
        noticeType: "class",
        data: "Original message",
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      });
    });

    test("Successfully updates noticeType and data and returns HTTP 200", async () => {
      const event = {
        pathParameters: { institution },
        body: JSON.stringify({
          date: validDate,
          noticeType: "canceled",
          data: "Class canceled due to rain",
        }),
      };

      const res = await updateNoticeHandler.main(event);
      assert.equal(res.statusCode, 200);
      const body = JSON.parse(res.body);
      assert.equal(body.message, "Notice updated");

      const saved = mockDb.tables.beta_class_notice.get(`${institution}#${validDate}`);
      assert.equal(saved.noticeType, "canceled");
      assert.equal(saved.data, "Class canceled due to rain");
      assert.ok(saved.updatedAt > 1700000000000);
    });

    test("Returns HTTP 404 when updating non-existent notice or mismatched institution", async () => {
      const event = {
        pathParameters: { institution: otherInstitution },
        body: JSON.stringify({
          date: validDate,
          noticeType: "schedule",
        }),
      };

      const res = await updateNoticeHandler.main(event);
      assert.equal(res.statusCode, 404);
      assert.match(JSON.parse(res.body).message, /no notice found/i);
    });

    test("Validation: rejects update when neither noticeType nor data is provided", async () => {
      const event = {
        pathParameters: { institution },
        body: JSON.stringify({
          date: validDate,
        }),
      };

      const res = await updateNoticeHandler.main(event);
      assert.equal(res.statusCode, 400);
      assert.match(JSON.parse(res.body).message, /provide noticeType or data/i);
    });
  });

  // =========================================================================
  // 3. Notice Deletion
  // =========================================================================
  describe("delete-notice.js", () => {
    const validDate = Date.UTC(2026, 9, 25, 10, 0, 0);

    beforeEach(() => {
      mockDb.tables.beta_class_notice.set(`${institution}#${validDate}`, {
        institutionId: institution,
        date: validDate,
        noticeType: "class",
        data: "Notice to delete",
      });
    });

    test("Successfully deletes notice and returns HTTP 200", async () => {
      const event = {
        pathParameters: {
          institution,
          date: String(validDate),
        },
      };

      const res = await deleteNoticeHandler.main(event);
      assert.equal(res.statusCode, 200);
      assert.match(JSON.parse(res.body).message, /deleted/i);

      const exists = mockDb.tables.beta_class_notice.has(`${institution}#${validDate}`);
      assert.equal(exists, false);
    });

    test("Returns HTTP 404 when deleting notice that does not exist", async () => {
      const event = {
        pathParameters: {
          institution,
          date: "9999999999999",
        },
      };

      const res = await deleteNoticeHandler.main(event);
      assert.equal(res.statusCode, 404);
      assert.match(JSON.parse(res.body).message, /no notice found/i);
    });

    test("Validation: rejects invalid date parameter with HTTP 400", async () => {
      const event = {
        pathParameters: {
          institution,
          date: "not-a-number",
        },
      };

      const res = await deleteNoticeHandler.main(event);
      assert.equal(res.statusCode, 400);
      assert.match(JSON.parse(res.body).message, /epoch-millisecond/i);
    });
  });

  // =========================================================================
  // 4. Notice Listing & Tenant Isolation
  // =========================================================================
  describe("list-notices.js", () => {
    beforeEach(() => {
      // Oct 2026 notices for happyprancer
      mockDb.tables.beta_class_notice.set(`${institution}#${Date.UTC(2026, 9, 5)}`, {
        institutionId: institution,
        date: Date.UTC(2026, 9, 5),
        noticeType: "class",
        data: "Notice 1",
      });
      mockDb.tables.beta_class_notice.set(`${institution}#${Date.UTC(2026, 9, 15)}`, {
        institutionId: institution,
        date: Date.UTC(2026, 9, 15),
        noticeType: "schedule",
        data: "Notice 2",
      });
      // Nov 2026 notice for happyprancer (outside Oct 2026 range)
      mockDb.tables.beta_class_notice.set(`${institution}#${Date.UTC(2026, 10, 2)}`, {
        institutionId: institution,
        date: Date.UTC(2026, 10, 2),
        noticeType: "class",
        data: "Nov Notice",
      });
      // Oct 2026 notice for competitor institution (must be isolated)
      mockDb.tables.beta_class_notice.set(`${otherInstitution}#${Date.UTC(2026, 9, 10)}`, {
        institutionId: otherInstitution,
        date: Date.UTC(2026, 9, 10),
        noticeType: "class",
        data: "Competitor Notice",
      });
    });

    test("Lists notices for specified month with strict tenant isolation", async () => {
      const event = {
        pathParameters: { institution },
        queryStringParameters: { month: "2026-10" },
      };

      const res = await listNoticesHandler.main(event);
      assert.equal(res.statusCode, 200);
      const body = JSON.parse(res.body);
      assert.equal(body.institution, institution);
      assert.equal(body.month, "2026-10");
      assert.equal(body.count, 2);

      const texts = body.notices.map((n) => n.data);
      assert.ok(texts.includes("Notice 1"));
      assert.ok(texts.includes("Notice 2"));
      assert.ok(!texts.includes("Competitor Notice"), "Must never leak notices from other institutions");
      assert.ok(!texts.includes("Nov Notice"), "Must strictly exclude notices from outside requested month");
    });

    test("Validation: rejects invalid month format with HTTP 400", async () => {
      const event = {
        pathParameters: { institution },
        queryStringParameters: { month: "2026-13" },
      };

      const res = await listNoticesHandler.main(event);
      assert.equal(res.statusCode, 400);
      assert.match(JSON.parse(res.body).message, /YYYY-MM/i);
    });
  });

  // =========================================================================
  // 5. Upcoming Schedule List (Authorization & Filtering)
  // =========================================================================
  describe("upcoming-schedule-list.js", () => {
    const futureDate = Date.now() + 86400000; // Tomorrow
    const pastDate = Date.now() - 86400000 * 2; // 2 days ago

    beforeEach(() => {
      // Future schedule for happyprancer - Salsa
      mockDb.tables.beta_schedules.set(`${institution}#sch_1`, {
        institution,
        scheduleId: "sch_1",
        date: futureDate,
        classType: "salsa",
        instructorId: "inst_salsa",
        instructorEmailId: "salsa_teacher@studio.com",
      });

      // Future schedule for happyprancer - HipHop
      mockDb.tables.beta_schedules.set(`${institution}#sch_2`, {
        institution,
        scheduleId: "sch_2",
        date: futureDate + 3600000,
        classType: "hiphop",
        instructorId: "inst_hiphop",
        instructorEmailId: "hiphop_teacher@studio.com",
      });

      // Past schedule for happyprancer (must be filtered out)
      mockDb.tables.beta_schedules.set(`${institution}#sch_past`, {
        institution,
        scheduleId: "sch_past",
        date: pastDate,
        classType: "salsa",
        instructorId: "inst_salsa",
      });

      // Future schedule for competitor institution (must be isolated)
      mockDb.tables.beta_schedules.set(`${otherInstitution}#sch_other`, {
        institution: otherInstitution,
        scheduleId: "sch_other",
        date: futureDate,
        classType: "salsa",
        instructorId: "inst_other",
      });
    });

    test("Admin receives all upcoming classes for institution and excludes past / other institutions", async () => {
      const adminId = "admin_cognito_id";
      mockDb.tables.beta_user_profile.set(`${institution}#${adminId}`, {
        institution,
        cognitoId: adminId,
        userType: "admin",
        status: "Active",
      });

      const event = {
        pathParameters: { institution },
        requestContext: { identity: { cognitoIdentityId: adminId } },
      };

      const res = await upcomingScheduleHandler.main(event);
      assert.equal(res.statusCode, 200);
      const classes = JSON.parse(res.body);
      assert.equal(classes.length, 2);
      assert.ok(classes.every((c) => c.institution === institution));
      assert.ok(classes.every((c) => c.date >= futureDate));
    });

    test("Instructor receives only schedules assigned to them", async () => {
      const instructorId = "inst_salsa";
      mockDb.tables.beta_user_profile.set(`${institution}#${instructorId}`, {
        institution,
        cognitoId: instructorId,
        userType: "instructor",
        instructorId: instructorId,
        emailId: "salsa_teacher@studio.com",
        status: "Active",
      });

      const event = {
        pathParameters: { institution },
        requestContext: { identity: { cognitoIdentityId: instructorId } },
      };

      const res = await upcomingScheduleHandler.main(event);
      assert.equal(res.statusCode, 200);
      const classes = JSON.parse(res.body);
      assert.equal(classes.length, 1);
      assert.equal(classes[0].classType, "salsa");
      assert.equal(classes[0].instructorId, instructorId);
    });

    test("Active Hybrid member receives all upcoming classes", async () => {
      const hybridMemberId = "member_hybrid_id";
      mockDb.tables.beta_user_profile.set(`${institution}#${hybridMemberId}`, {
        institution,
        cognitoId: hybridMemberId,
        userType: "member",
        status: "Active",
        isHybrid: true,
      });

      const event = {
        pathParameters: { institution },
        requestContext: { identity: { cognitoIdentityId: hybridMemberId } },
      };

      const res = await upcomingScheduleHandler.main(event);
      assert.equal(res.statusCode, 200);
      const classes = JSON.parse(res.body);
      assert.equal(classes.length, 2);
    });

    test("Active member with specific product subscription only receives classes matching classType", async () => {
      const regularMemberId = "member_regular_id";
      const paymentId = "pay_salsa_100";
      const productId = "prod_salsa_only";

      mockDb.tables.beta_user_profile.set(`${institution}#${regularMemberId}`, {
        institution,
        cognitoId: regularMemberId,
        userType: "member",
        status: "Active",
        isHybrid: false,
        paymentId: paymentId,
      });

      mockDb.tables.beta_payments.set(`${regularMemberId}#${paymentId}`, {
        cognitoId: regularMemberId,
        paymentId: paymentId,
        productId: productId,
        subscriptionType: "regular",
      });

      mockDb.tables.beta_products.set(`${institution}#${productId}`, {
        institution,
        productId: productId,
        classType: ["salsa"],
      });

      const event = {
        pathParameters: { institution },
        requestContext: { identity: { cognitoIdentityId: regularMemberId } },
      };

      const res = await upcomingScheduleHandler.main(event);
      assert.equal(res.statusCode, 200);
      const classes = JSON.parse(res.body);
      assert.equal(classes.length, 1);
      assert.equal(classes[0].classType, "salsa");
    });

    test("Inactive member is rejected with HTTP 401 Not Authorized", async () => {
      const inactiveMemberId = "member_inactive_id";
      mockDb.tables.beta_user_profile.set(`${institution}#${inactiveMemberId}`, {
        institution,
        cognitoId: inactiveMemberId,
        userType: "member",
        status: "Inactive",
      });

      const event = {
        pathParameters: { institution },
        requestContext: { identity: { cognitoIdentityId: inactiveMemberId } },
      };

      const res = await upcomingScheduleHandler.main(event);
      assert.equal(res.statusCode, 401);
      assert.match(JSON.parse(res.body).error, /not authorized/i);
    });
  });
});
