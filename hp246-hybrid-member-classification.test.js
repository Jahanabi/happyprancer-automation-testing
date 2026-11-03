const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");

// Environment configuration for beta test execution
process.env.AWS_REGION = "us-east-2";
process.env.SCHEDULE_TABLE_NAME = "beta_class_schedule";
process.env.PROFILE_TABLE_NAME = "beta_user_profile";
process.env.PRODUCT_TABLE_NAME = "beta_product";
process.env.PAYMENT_TABLE_NAME = "beta_payment";
process.env.ATTENDANCE_TABLE_NAME = "beta_attendance";
process.env.INSTRUCTOR_ATTENDANCE_TABLE = "beta_instructor_attendance";
process.env.RATING_TABLE_NAME = "beta_rating";
process.env.CLASS_NOTICE_TABLE = "beta_class_notice";
process.env.INSTRUCTOR_TABLE_NAME = "beta_instructors";
process.env.REFERRAL_CODE_TABLE_NAME = "referral_codes";
process.env.DANCE_STUDIO = "beta_dance_studio";

const profileCreateHandler = require("../functions_beta/user/profile-create");
const profileUpdateHandler = require("../functions_beta/user/profile-update");
const updateGoogleSignInHandler = require("../functions_beta/user/update-google-signin");
const referredMembersHandler = require("../functions_beta/instructor/referred-members");
const adminCreateUserHandler = require("../functions_beta/admin/create-user");

/**
 * In-memory Mock DynamoDB client for isolated testing
 */
class MockDynamoDb {
  constructor() {
    this.tables = {
      beta_class_schedule: new Map(),
      beta_user_profile: new Map(),
      beta_product: new Map(),
      beta_payment: new Map(),
      beta_attendance: new Map(),
      beta_instructor_attendance: new Map(),
      beta_rating: new Map(),
      beta_class_notice: new Map(),
      beta_instructors: new Map(),
      referral_codes: new Map(),
      beta_dance_studio: new Map(),
    };
  }

  clear() {
    for (const table of Object.values(this.tables)) {
      table.clear();
    }
  }

  getKey(tableName, itemOrKey) {
    if (tableName === "beta_user_profile") {
      return `${itemOrKey.institution}#${itemOrKey.cognitoId}`;
    }
    if (tableName === "beta_class_schedule") {
      return `${itemOrKey.institution}#${itemOrKey.classId}`;
    }
    if (tableName === "beta_instructors") {
      return `${itemOrKey.institution}#${itemOrKey.instructorId}`;
    }
    if (tableName === "referral_codes") {
      return itemOrKey.referralCode || "default_ref";
    }
    return JSON.stringify(itemOrKey);
  }

  async send(command) {
    const cmd = command.constructor.name;
    const input = command.input;

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

    const tableName = input.TableName;
    const table = this.tables[tableName];

    if (!table) {
      throw new Error(`Table ${tableName} not registered in MockDynamoDb`);
    }

    if (cmd === "GetCommand") {
      const key = this.getKey(tableName, input.Key);
      const item = table.get(key);
      return { Item: item ? JSON.parse(JSON.stringify(item)) : undefined };
    }

    if (cmd === "PutCommand") {
      const item = JSON.parse(JSON.stringify(input.Item));
      const key = this.getKey(tableName, item);
      table.set(key, item);
      return {};
    }

    if (cmd === "QueryCommand") {
      const items = Array.from(table.values());
      const filtered = items.filter((item) => {
        if (input.KeyConditionExpression) {
          if (input.KeyConditionExpression.includes("emailId = :emailId")) {
            if (item.emailId !== input.ExpressionAttributeValues[":emailId"]) return false;
          }
          if (input.KeyConditionExpression.includes("institutionid = :institution")) {
            if (item.institutionid !== input.ExpressionAttributeValues[":institution"]) return false;
          }
          if (input.KeyConditionExpression.includes("institution = :institution")) {
            if (item.institution !== input.ExpressionAttributeValues[":institution"]) return false;
          }
        }
        if (input.FilterExpression) {
          if (input.FilterExpression.includes("institution = :institution")) {
            if (item.institution !== input.ExpressionAttributeValues[":institution"]) return false;
          }
        }
        return true;
      });
      return { Items: filtered, Count: filtered.length };
    }

    if (cmd === "ScanCommand") {
      let items = Array.from(table.values());
      if (input.FilterExpression) {
        if (input.FilterExpression.includes("referral_code = :referral_code")) {
          items = items.filter(
            (item) => item.referral_code === input.ExpressionAttributeValues[":referral_code"]
          );
        }
      }
      return { Items: items, Count: items.length };
    }

    if (cmd === "UpdateCommand") {
      const key = this.getKey(tableName, input.Key);
      const item = table.get(key) || { ...input.Key };

      if (input.ExpressionAttributeValues) {
        if (input.ExpressionAttributeValues[":hybridPageUser"] !== undefined) {
          item.hybridPageUser = input.ExpressionAttributeValues[":hybridPageUser"];
        }
        if (input.ExpressionAttributeValues[":isHybrid"] !== undefined) {
          item.isHybrid = input.ExpressionAttributeValues[":isHybrid"];
        }
        if (input.ExpressionAttributeValues[":referred_code"] !== undefined) {
          item.referred_code = input.ExpressionAttributeValues[":referred_code"];
        }
        if (input.ExpressionAttributeValues[":registrationSource"] !== undefined) {
          item.registrationSource = input.ExpressionAttributeValues[":registrationSource"];
        }
        if (input.ExpressionAttributeValues[":subscriptionType"] !== undefined) {
          item.subscriptionType = input.ExpressionAttributeValues[":subscriptionType"];
        }
        if (input.ExpressionAttributeValues[":userName"] !== undefined) {
          item.userName = input.ExpressionAttributeValues[":userName"];
        }
        if (input.ExpressionAttributeValues[":emailId"] !== undefined) {
          item.emailId = input.ExpressionAttributeValues[":emailId"];
        }
        if (input.ExpressionAttributeValues[":status"] !== undefined) {
          item.status = input.ExpressionAttributeValues[":status"];
        }
      }

      table.set(key, item);
      return { Attributes: JSON.parse(JSON.stringify(item)) };
    }

    return {};
  }
}

const mockDb = new MockDynamoDb();

// Patch aws sdk lib-dynamodb send calls in handlers
const libDynamo = require("@aws-sdk/lib-dynamodb");
libDynamo.DynamoDBDocumentClient.prototype.send = function (command) {
  return mockDb.send(command);
};

// Patch SES & Cognito clients
const clientSes = require("@aws-sdk/client-ses");
clientSes.SESClient.prototype.send = async () => ({ MessageId: "mock-ses-123" });

const clientCognitoIdp = require("@aws-sdk/client-cognito-identity-provider");
clientCognitoIdp.CognitoIdentityProviderClient.prototype.send = async () => ({
  AuthenticationResult: { IdToken: "mock-id-token" },
});
const clientCognitoIdentity = require("@aws-sdk/client-cognito-identity");
clientCognitoIdentity.CognitoIdentityClient.prototype.send = async () => ({
  IdentityId: "cognito-new-transferred-id",
});

describe("HP246: Hybrid Member Classification Source-Level Tests", () => {
  const institution = "happyprancer";

  beforeEach(() => {
    mockDb.clear();
  });

  // =========================================================================
  // Scenario A — Hybrid Registration
  // =========================================================================
  describe("Scenario A: Hybrid Registration", () => {
    test("profile-create classifies member as Hybrid when isHybrid is in body", async () => {
      const cognitoId = "hyb-user-body-1";
      const referralCode = "COACH_A";

      const event = {
        pathParameters: { institution },
        requestContext: { identity: { cognitoIdentityId: cognitoId } },
        body: JSON.stringify({
          emailId: "hyb1@test.com",
          userName: "Hybrid Body Dancer",
          referred_code: referralCode,
          isHybrid: true,
          productId: "prod-hyb-plan-1",
        }),
      };

      const res = await profileCreateHandler.main(event);
      assert.equal(res.statusCode, 200);

      const profile = await mockDb.send({
        constructor: { name: "GetCommand" },
        input: {
          TableName: "beta_user_profile",
          Key: { institution, cognitoId },
        },
      });

      assert.ok(profile.Item);
      assert.equal(profile.Item.isHybrid, true);
      assert.equal(profile.Item.hybridPageUser, true);
      assert.equal(profile.Item.registrationSource, "hybrid");
      assert.equal(profile.Item.subscriptionType, "hybrid");
      assert.equal(profile.Item.productId, "prod-hyb-plan-1");
      assert.equal(profile.Item.referred_code, referralCode);
    });

    test("profile-create classifies member as Hybrid when hybridPageUser is in query parameters", async () => {
      const cognitoId = "hyb-user-query-1";
      const referralCode = "COACH_B";

      const event = {
        pathParameters: { institution },
        queryStringParameters: { hybridPageUser: "true" },
        requestContext: { identity: { cognitoIdentityId: cognitoId } },
        body: JSON.stringify({
          emailId: "hyb2@test.com",
          userName: "Hybrid Query Dancer",
          referred_code: referralCode,
        }),
      };

      const res = await profileCreateHandler.main(event);
      assert.equal(res.statusCode, 200);

      const profile = await mockDb.send({
        constructor: { name: "GetCommand" },
        input: {
          TableName: "beta_user_profile",
          Key: { institution, cognitoId },
        },
      });

      assert.ok(profile.Item);
      assert.equal(profile.Item.isHybrid, true);
      assert.equal(profile.Item.hybridPageUser, true);
      assert.equal(profile.Item.registrationSource, "hybrid");
      assert.equal(profile.Item.subscriptionType, "hybrid");
    });

    test("update-google-signin creates hybrid profile during Google Sign-In", async () => {
      const googleId = "google-hybrid-signup";
      const referralCode = "COACH_C";

      // Initial user record exists from Google login
      await mockDb.send({
        constructor: { name: "PutCommand" },
        input: {
          TableName: "beta_user_profile",
          Item: {
            institution,
            cognitoId: googleId,
            emailId: "googlehyb@test.com",
            userName: "Google Hybrid",
          },
        },
      });

      const res = await updateGoogleSignInHandler.main({
        pathParameters: { institution },
        body: JSON.stringify({
          cognitoId: googleId,
          isHybrid: true,
          referred_code: referralCode,
        }),
      });

      assert.equal(res.statusCode, 200);

      const updated = await mockDb.send({
        constructor: { name: "GetCommand" },
        input: {
          TableName: "beta_user_profile",
          Key: { institution, cognitoId: googleId },
        },
      });

      assert.equal(updated.Item.isHybrid, true);
      assert.equal(updated.Item.hybridPageUser, true);
      assert.equal(updated.Item.registrationSource, "hybrid");
      assert.equal(updated.Item.referred_code, referralCode);
    });
  });

  // =========================================================================
  // Scenario B — Normal Registration
  // =========================================================================
  describe("Scenario B: Normal Registration", () => {
    test("Normal direct registration does not acquire any Hybrid flags", async () => {
      const normalId = "norm-direct-1";

      const event = {
        pathParameters: { institution },
        requestContext: { identity: { cognitoIdentityId: normalId } },
        body: JSON.stringify({
          emailId: "norm-direct@test.com",
          userName: "Normal Direct User",
        }),
      };

      const res = await profileCreateHandler.main(event);
      assert.equal(res.statusCode, 200);

      const profile = await mockDb.send({
        constructor: { name: "GetCommand" },
        input: {
          TableName: "beta_user_profile",
          Key: { institution, cognitoId: normalId },
        },
      });

      assert.ok(profile.Item);
      assert.equal(profile.Item.isHybrid, false);
      assert.equal(profile.Item.hybridPageUser, false);
      assert.equal(profile.Item.registrationSource, "direct");
      assert.equal(profile.Item.subscriptionType, "");
      assert.equal(profile.Item.referred_code, null);
    });
  });

  // =========================================================================
  // Scenario C — Hybrid Member Profile Update
  // =========================================================================
  describe("Scenario C: Hybrid Member Profile Update", () => {
    test("Changing email in profile-update preserves existing Hybrid classification", async () => {
      const oldId = "hyb-member-transfer-old";

      // Seed existing hybrid member
      await mockDb.send({
        constructor: { name: "PutCommand" },
        input: {
          TableName: "beta_user_profile",
          Item: {
            institution,
            cognitoId: oldId,
            emailId: "hyb-transfer-old@test.com",
            userName: "Hybrid Member",
            isHybrid: true,
            hybridPageUser: true,
            registrationSource: "hybrid",
            subscriptionType: "hybrid",
            referred_code: "COACH_X",
          },
        },
      });

      // Update email
      const res = await profileUpdateHandler.main({
        pathParameters: { institution },
        requestContext: { identity: { cognitoIdentityId: oldId } },
        body: JSON.stringify({
          emailId: "hyb-transfer-new@test.com",
          password: "NewPassword123!",
          userName: "Hybrid Member Renamed",
          isHybrid: false, // Frontend might inadvertently omit or send false
          hybridPageUser: false,
        }),
      });

      assert.equal(res.statusCode, 200);

      // Verify the transferred profile in DynamoDB retained Hybrid status
      const allProfiles = await mockDb.send({
        constructor: { name: "ScanCommand" },
        input: { TableName: "beta_user_profile" },
      });

      const newProfile = allProfiles.Items.find(
        (p) => p.emailId === "hyb-transfer-new@test.com"
      );

      assert.ok(newProfile, "Transferred profile must exist");
      assert.equal(newProfile.isHybrid, true, "isHybrid must be preserved as true");
      assert.equal(newProfile.hybridPageUser, true, "hybridPageUser must be preserved as true");
      assert.equal(newProfile.registrationSource, "hybrid", "registrationSource must be preserved as hybrid");
      assert.equal(newProfile.subscriptionType, "hybrid", "subscriptionType must be preserved as hybrid");
    });

    test("update-google-signin for existing Hybrid member preserves classification even if flag is false", async () => {
      const googleId = "google-existing-hyb-member";

      // Seed existing hybrid profile
      await mockDb.send({
        constructor: { name: "PutCommand" },
        input: {
          TableName: "beta_user_profile",
          Item: {
            institution,
            cognitoId: googleId,
            emailId: "googleexisting@test.com",
            userName: "Google Existing Hybrid",
            isHybrid: true,
            hybridPageUser: true,
            registrationSource: "hybrid",
            subscriptionType: "hybrid",
            referred_code: "COACH_Y",
          },
        },
      });

      // Subsequent login via Google Sign-In with hybridPageUser: false
      const res = await updateGoogleSignInHandler.main({
        pathParameters: { institution },
        body: JSON.stringify({
          cognitoId: googleId,
          hybridPageUser: false,
          referred_code: "COACH_Y",
        }),
      });

      assert.equal(res.statusCode, 200);

      const profile = await mockDb.send({
        constructor: { name: "GetCommand" },
        input: {
          TableName: "beta_user_profile",
          Key: { institution, cognitoId: googleId },
        },
      });

      assert.equal(profile.Item.isHybrid, true, "Must strictly preserve isHybrid: true");
      assert.equal(profile.Item.hybridPageUser, true, "Must strictly preserve hybridPageUser: true");
      assert.equal(profile.Item.registrationSource, "hybrid", "Must strictly preserve registrationSource: hybrid");
    });
  });

  // =========================================================================
  // Scenario D — Referral Registration Alone
  // =========================================================================
  describe("Scenario D: Referral Registration Alone", () => {
    test("Member registering with referral code alone is Normal, NOT Hybrid", async () => {
      const referralOnlyId = "ref-only-user-1";
      const referralCode = "COACH_NORMAL_REF";

      const event = {
        pathParameters: { institution },
        requestContext: { identity: { cognitoIdentityId: referralOnlyId } },
        body: JSON.stringify({
          emailId: "refonly@test.com",
          userName: "Referral Only Dancer",
          referred_code: referralCode,
        }),
      };

      const res = await profileCreateHandler.main(event);
      assert.equal(res.statusCode, 200);

      const profile = await mockDb.send({
        constructor: { name: "GetCommand" },
        input: {
          TableName: "beta_user_profile",
          Key: { institution, cognitoId: referralOnlyId },
        },
      });

      assert.ok(profile.Item);
      assert.equal(profile.Item.isHybrid, false);
      assert.equal(profile.Item.hybridPageUser, false);
      assert.equal(profile.Item.registrationSource, "referral");
      assert.equal(profile.Item.referred_code, referralCode);

      // Verify in referred-members endpoint
      const listRes = await referredMembersHandler.main({
        pathParameters: { referralCode },
      });
      assert.equal(listRes.statusCode, 200);
      const listData = JSON.parse(listRes.body);

      assert.equal(listData.hybridMembers.length, 0, "hybridMembers must be empty");
      assert.equal(listData.normalMembers.length, 1, "normalMembers must contain this member");
      assert.equal(listData.normalMembers[0].cognitoId, referralOnlyId);
      assert.equal(listData.normalMembers[0].memberType, "normal");
    });
  });

  // =========================================================================
  // Scenario E — Missing or Inconsistent Flags
  // =========================================================================
  describe("Scenario E: Missing or Inconsistent Flags (Legacy Members)", () => {
    test("Authoritative identification correctly categorizes legacy members", async () => {
      const referralCode = "LEGACY_COACH_Z";

      // 1. Member with only registrationSource: "hybrid"
      await mockDb.send({
        constructor: { name: "PutCommand" },
        input: {
          TableName: "beta_user_profile",
          Item: {
            institution,
            cognitoId: "leg-source",
            referred_code: referralCode,
            registrationSource: "hybrid",
          },
        },
      });

      // 2. Member with only subscriptionType: "hybrid"
      await mockDb.send({
        constructor: { name: "PutCommand" },
        input: {
          TableName: "beta_user_profile",
          Item: {
            institution,
            cognitoId: "leg-subtype",
            referred_code: referralCode,
            subscriptionType: "hybrid",
          },
        },
      });

      // 3. Member with only userType: "hybrid"
      await mockDb.send({
        constructor: { name: "PutCommand" },
        input: {
          TableName: "beta_user_profile",
          Item: {
            institution,
            cognitoId: "leg-usertype",
            referred_code: referralCode,
            userType: "hybrid",
          },
        },
      });

      // 4. Member with NO hybrid flags
      await mockDb.send({
        constructor: { name: "PutCommand" },
        input: {
          TableName: "beta_user_profile",
          Item: {
            institution,
            cognitoId: "leg-plain",
            referred_code: referralCode,
          },
        },
      });

      const res = await referredMembersHandler.main({
        pathParameters: { referralCode },
      });

      assert.equal(res.statusCode, 200);
      const data = JSON.parse(res.body);

      assert.equal(data.hybridMembers.length, 3, "All 3 legacy members with hybrid flags must be identified as Hybrid");
      assert.equal(data.normalMembers.length, 1, "Plain member must be Normal");
      assert.equal(data.counts.hybrid, 3);
      assert.equal(data.counts.normal, 1);
      assert.equal(data.counts.total, 4);
    });
  });

  // =========================================================================
  // Scenario F — Product Association
  // =========================================================================
  describe("Scenario F: Product Association", () => {
    test("Member with instructor productId but normal registration is NOT classified as Hybrid", async () => {
      const referralCode = "PRODUCT_COACH_P";

      await mockDb.send({
        constructor: { name: "PutCommand" },
        input: {
          TableName: "beta_user_profile",
          Item: {
            institution,
            cognitoId: "prod-only-member",
            referred_code: referralCode,
            productId: "shared-plan-456", // Instructor's product ID
            isHybrid: false,
            hybridPageUser: false,
            registrationSource: "referral",
          },
        },
      });

      const res = await referredMembersHandler.main({
        pathParameters: { referralCode },
      });

      assert.equal(res.statusCode, 200);
      const data = JSON.parse(res.body);

      assert.equal(data.hybridMembers.length, 0, "Must not classify as Hybrid based on productId alone");
      assert.equal(data.normalMembers.length, 1, "Must classify as Normal");
      assert.equal(data.normalMembers[0].cognitoId, "prod-only-member");
      assert.equal(data.normalMembers[0].memberType, "normal");
    });
  });
});
