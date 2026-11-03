const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");

// Configure test environment variables
process.env.AWS_REGION = "us-east-2";
process.env.PROFILE_TABLE_NAME = "beta_user_profile";
process.env.PRODUCT_TABLE_NAME = "beta_product";
process.env.PAYMENT_TABLE_NAME = "beta_payment";
process.env.CASHOUT_TABLE_NAME = "beta_cashout";
process.env.RAZORPAY_KEY_ID = "rzp_test_key123";
process.env.RAZORPAY_SECRET_KEY = "rzp_test_secret_key_12345";

// Mock Razorpay SDK via require.cache
const rzpPath = require.resolve("razorpay");
let mockRazorpayPayments = new Map();
let mockRazorpaySubscriptions = new Map();

class MockRazorpayInstance {
  constructor(options = {}) {
    this.key_id = options.key_id;
    this.key_secret = options.key_secret;
    this.payments = {
      fetch: async (paymentId) => {
        if (mockRazorpayPayments.has(paymentId)) {
          return mockRazorpayPayments.get(paymentId);
        }
        return {
          id: paymentId,
          order_id: "order_default",
          status: "captured",
          amount: 50000,
          currency: "INR",
        };
      },
    };
    this.subscriptions = {
      fetch: async (subscriptionId) => {
        if (mockRazorpaySubscriptions.has(subscriptionId)) {
          return mockRazorpaySubscriptions.get(subscriptionId);
        }
        return {
          id: subscriptionId,
          status: "active",
          paid_count: 1,
          charge_at: Math.floor(Date.now() / 1000) + 30 * 86400,
        };
      },
    };
  }
}

require.cache[rzpPath] = {
  id: rzpPath,
  filename: rzpPath,
  loaded: true,
  exports: MockRazorpayInstance,
};

// Mock DynamoDB Document Client
class MockDynamoDb {
  constructor() {
    this.tables = {
      beta_user_profile: new Map(),
      beta_product: new Map(),
      beta_payment: new Map(),
      beta_cashout: new Map(),
    };
    this.batchGetUnprocessedCounter = 0;
  }

  clear() {
    for (const table of Object.values(this.tables)) {
      table.clear();
    }
    this.batchGetUnprocessedCounter = 0;
  }

  getKey(tableName, keyObj) {
    if (tableName === "beta_user_profile") {
      return `${keyObj.institution}#${keyObj.cognitoId}`;
    }
    if (tableName === "beta_product") {
      return `${keyObj.institution}#${keyObj.productId}`;
    }
    if (tableName === "beta_payment") {
      return `${keyObj.cognitoId}#${keyObj.paymentId}`;
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
      let item = table.get(key) || { ...input.Key };

      if (input.ExpressionAttributeValues) {
        if (input.ExpressionAttributeValues[":val2"] !== undefined) {
          if (input.UpdateExpression && input.UpdateExpression.includes("paymentMode = :val2")) {
            item.paymentMode = input.ExpressionAttributeValues[":val2"];
          } else {
            item.status = input.ExpressionAttributeValues[":val2"];
          }
        }
        if (input.ExpressionAttributeValues[":paymentData"] !== undefined) {
          item.paymentData = input.ExpressionAttributeValues[":paymentData"];
        }
        if (input.ExpressionAttributeValues[":paymentType"] !== undefined) {
          item.paymentType = input.ExpressionAttributeValues[":paymentType"];
        }
        if (input.ExpressionAttributeValues[":paymentId"] !== undefined) {
          item.paymentId = input.ExpressionAttributeValues[":paymentId"];
        }
        if (input.ExpressionAttributeValues[":subscriptionId"] !== undefined) {
          item.subscriptionId = input.ExpressionAttributeValues[":subscriptionId"];
        }
        if (input.ExpressionAttributeValues[":subId"] !== undefined) {
          item.subscriptionId = input.ExpressionAttributeValues[":subId"];
        }
        if (input.ExpressionAttributeValues[":renewDate"] !== undefined) {
          item.renewDate = input.ExpressionAttributeValues[":renewDate"];
        }
        if (input.ExpressionAttributeValues[":val1"] !== undefined) {
          item.isVerified = input.ExpressionAttributeValues[":val1"];
        }
        if (input.ExpressionAttributeValues[":status"] !== undefined) {
          item.status = input.ExpressionAttributeValues[":status"];
        }
        if (input.ExpressionAttributeValues[":active"] !== undefined) {
          item.active = input.ExpressionAttributeValues[":active"];
        }
        if (input.ExpressionAttributeValues[":provider"] !== undefined) {
          item.provider = input.ExpressionAttributeValues[":provider"];
        }
        if (input.ExpressionAttributeValues[":paidCount"] !== undefined) {
          item.paid_count = input.ExpressionAttributeValues[":paidCount"];
        }
      }

      table.set(key, item);
      return { Attributes: JSON.parse(JSON.stringify(item)) };
    }

    if (cmd === "ScanCommand") {
      const table = this.tables[tableName];
      if (!table) return { Items: [] };
      let items = Array.from(table.values());

      if (input.FilterExpression) {
        const inst = input.ExpressionAttributeValues?.[":institution"];
        if (inst) {
          items = items.filter((p) => p.institution === inst);
        }
        if (input.FilterExpression.includes("isVerified")) {
          items = items.filter((p) => p.isVerified === true || p.isVerified === "true");
        }
      }

      // Support multi-page scan pagination testing
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

    if (cmd === "QueryCommand") {
      return { Items: [] };
    }

    if (cmd === "BatchGetCommand") {
      const responses = {};
      const unprocessed = {};

      for (const [tName, req] of Object.entries(input.RequestItems)) {
        const table = this.tables[tName];
        responses[tName] = [];

        // Simulate UnprocessedKeys on the first try if counter is set
        if (this.batchGetUnprocessedCounter > 0 && req.Keys.length > 1) {
          this.batchGetUnprocessedCounter--;
          const processedKeys = req.Keys.slice(0, 1);
          const unprocKeys = req.Keys.slice(1);

          for (const k of processedKeys) {
            const keyStr = this.getKey(tName, k);
            if (table && table.has(keyStr)) {
              responses[tName].push(JSON.parse(JSON.stringify(table.get(keyStr))));
            }
          }
          unprocessed[tName] = { Keys: unprocKeys };
        } else {
          for (const k of req.Keys) {
            const keyStr = this.getKey(tName, k);
            if (table && table.has(keyStr)) {
              responses[tName].push(JSON.parse(JSON.stringify(table.get(keyStr))));
            }
          }
        }
      }

      return {
        Responses: responses,
        UnprocessedKeys: Object.keys(unprocessed).length > 0 ? unprocessed : undefined,
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

// Handlers
const regularVerifyHandler = require("../functions_beta/user/billing/regular/verify");
const subscriptionVerifyHandler = require("../functions_beta/user/billing/subscription/verify");
const cashOutAmountHandler = require("../functions_beta/payment/cashOutAmount");
const paymentHistoryHandler = require("../functions_beta/payment/payment-history");

function generateSignature(orderId, paymentId, secret) {
  return crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
}

describe("HP289: Revenue Online Collections Defect Fixes & Mandatory Refinements", () => {
  const institution = "happyprancer";
  const cognitoId = "user_inr_123";
  const secretKey = process.env.RAZORPAY_SECRET_KEY;

  beforeEach(() => {
    mockDb.clear();
    mockRazorpayPayments.clear();
    mockRazorpaySubscriptions.clear();
  });

  // =========================================================================
  // 1. Regular Billing Verify: Capturing, Matching & Subunit Integrity
  // =========================================================================
  describe("Regular Billing Verify", () => {
    test("Persists verified payment to PAYMENT_TABLE_NAME with amount in paise upon matching order, amount, and currency", async () => {
      const orderId = "order_rzp_001";
      const paymentId = "pay_rzp_001";
      const signature = generateSignature(orderId, paymentId, secretKey);

      // Pre-seed product with amount 50000 paise (Rs 500)
      mockDb.tables.beta_product.set(`${institution}#prod_dance_1`, {
        institution,
        productId: "prod_dance_1",
        amount: 50000, // paise
        duration: "2592000000",
        subscriptionType: "regular",
        currency: "INR",
      });

      // Pre-seed profile with pending order
      mockDb.tables.beta_user_profile.set(`${institution}#${cognitoId}`, {
        institution,
        cognitoId,
        emailId: "user@happyprancer.com",
        status: "Inactive",
        paymentData: [
          {
            orderId,
            productId: "prod_dance_1",
            amount: 50000,
            currency: "INR",
          },
        ],
      });

      // Authoritative Razorpay payment fetch: status captured, matching order_id, amount, and currency
      mockRazorpayPayments.set(paymentId, {
        id: paymentId,
        order_id: orderId,
        status: "captured",
        amount: 50000,
        currency: "INR",
      });

      const event = {
        pathParameters: { institution },
        requestContext: { identity: { cognitoIdentityId: cognitoId } },
        body: JSON.stringify({
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          razorpaySignature: signature,
        }),
      };

      const res = await regularVerifyHandler.main(event);
      assert.equal(res.statusCode, 200);
      const body = JSON.parse(res.body);
      assert.equal(body.signatureIsValid, true);
      assert.equal(body.isVerified, true);

      // Verify payment record in PAYMENT_TABLE_NAME
      const paymentRecord = mockDb.tables.beta_payment.get(`${cognitoId}#${paymentId}`);
      assert.ok(paymentRecord, "Payment record must be created in PAYMENT_TABLE_NAME");
      assert.equal(paymentRecord.amount, 50000, "Amount must remain in paise (not multiplied or divided)");
      assert.equal(paymentRecord.currency, "INR");
      assert.equal(paymentRecord.paymentMode, "online");
      assert.equal(paymentRecord.status, "completed");
      assert.equal(paymentRecord.isVerified, true);

      // Verify profile is updated with paymentId reference and Active status
      const updatedProfile = mockDb.tables.beta_user_profile.get(`${institution}#${cognitoId}`);
      assert.equal(updatedProfile.status, "Active");
      assert.ok(updatedProfile.paymentId.includes(paymentId));
    });

    test("Gap 3: Mismatched payment amount fails (400) and does NOT create revenue record", async () => {
      const orderId = "order_rzp_amt_mismatch";
      const paymentId = "pay_rzp_amt_mismatch";
      const signature = generateSignature(orderId, paymentId, secretKey);

      mockDb.tables.beta_product.set(`${institution}#prod_1`, {
        institution,
        productId: "prod_1",
        amount: 50000, // Expected 500 INR in paise
        currency: "INR",
      });

      mockDb.tables.beta_user_profile.set(`${institution}#${cognitoId}`, {
        institution,
        cognitoId,
        status: "Inactive",
        paymentData: [{ orderId, productId: "prod_1", amount: 50000, currency: "INR" }],
      });

      // Gateway returns payment with mismatched amount (e.g. 1000 instead of 50000)
      mockRazorpayPayments.set(paymentId, {
        id: paymentId,
        order_id: orderId,
        status: "captured",
        amount: 1000, // Mismatched!
        currency: "INR",
      });

      const event = {
        pathParameters: { institution },
        requestContext: { identity: { cognitoIdentityId: cognitoId } },
        body: JSON.stringify({
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          razorpaySignature: signature,
        }),
      };

      const res = await regularVerifyHandler.main(event);
      assert.equal(res.statusCode, 400);
      const body = JSON.parse(res.body);
      assert.equal(body.isVerified, false);
      assert.match(body.error, /amount mismatch/i);

      assert.equal(mockDb.tables.beta_payment.get(`${cognitoId}#${paymentId}`), undefined);
    });

    test("Gap 3: Mismatched payment currency or unknown currency fails (400) and does NOT create revenue record", async () => {
      const orderId = "order_rzp_curr_mismatch";
      const paymentId = "pay_rzp_curr_mismatch";
      const signature = generateSignature(orderId, paymentId, secretKey);

      mockDb.tables.beta_product.set(`${institution}#prod_1`, {
        institution,
        productId: "prod_1",
        amount: 50000,
        currency: "INR",
      });

      mockDb.tables.beta_user_profile.set(`${institution}#${cognitoId}`, {
        institution,
        cognitoId,
        status: "Inactive",
        paymentData: [{ orderId, productId: "prod_1", amount: 50000, currency: "INR" }],
      });

      // Gateway returns payment with USD instead of INR
      mockRazorpayPayments.set(paymentId, {
        id: paymentId,
        order_id: orderId,
        status: "captured",
        amount: 50000,
        currency: "USD", // Mismatched!
      });

      const event = {
        pathParameters: { institution },
        requestContext: { identity: { cognitoIdentityId: cognitoId } },
        body: JSON.stringify({
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          razorpaySignature: signature,
        }),
      };

      const res = await regularVerifyHandler.main(event);
      assert.equal(res.statusCode, 400);
      const body = JSON.parse(res.body);
      assert.equal(body.isVerified, false);
      assert.match(body.error, /currency mismatch/i);

      assert.equal(mockDb.tables.beta_payment.get(`${cognitoId}#${paymentId}`), undefined);
    });

    test("Gap 3: Mismatched order association fails (400) and does NOT create revenue record", async () => {
      const orderId = "order_rzp_expected";
      const paymentId = "pay_rzp_foreign_order";
      const signature = generateSignature(orderId, paymentId, secretKey);

      mockDb.tables.beta_product.set(`${institution}#prod_1`, {
        institution,
        productId: "prod_1",
        amount: 50000,
        currency: "INR",
      });

      mockDb.tables.beta_user_profile.set(`${institution}#${cognitoId}`, {
        institution,
        cognitoId,
        status: "Inactive",
        paymentData: [{ orderId, productId: "prod_1", amount: 50000, currency: "INR" }],
      });

      // Gateway payment is associated with an unrelated order ID
      mockRazorpayPayments.set(paymentId, {
        id: paymentId,
        order_id: "order_rzp_UNRELATED_999", // Mismatched order!
        status: "captured",
        amount: 50000,
        currency: "INR",
      });

      const event = {
        pathParameters: { institution },
        requestContext: { identity: { cognitoIdentityId: cognitoId } },
        body: JSON.stringify({
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          razorpaySignature: signature,
        }),
      };

      const res = await regularVerifyHandler.main(event);
      assert.equal(res.statusCode, 400);
      const body = JSON.parse(res.body);
      assert.equal(body.isVerified, false);
      assert.match(body.error, /order ID mismatch/i);

      assert.equal(mockDb.tables.beta_payment.get(`${cognitoId}#${paymentId}`), undefined);
    });

    test("Refinement 1: Valid signature with uncaptured payment fails (400) and does NOT create revenue record", async () => {
      const orderId = "order_rzp_002";
      const paymentId = "pay_rzp_002";
      const signature = generateSignature(orderId, paymentId, secretKey);

      mockDb.tables.beta_product.set(`${institution}#prod_1`, {
        institution,
        productId: "prod_1",
        amount: 50000,
        duration: "2592000000",
        currency: "INR",
      });

      mockDb.tables.beta_user_profile.set(`${institution}#${cognitoId}`, {
        institution,
        cognitoId,
        status: "Inactive",
        paymentData: [{ orderId, productId: "prod_1", amount: 50000, currency: "INR" }],
      });

      // Razorpay payment is authorized but not captured
      mockRazorpayPayments.set(paymentId, {
        id: paymentId,
        order_id: orderId,
        status: "authorized",
        amount: 50000,
        currency: "INR",
      });

      const event = {
        pathParameters: { institution },
        requestContext: { identity: { cognitoIdentityId: cognitoId } },
        body: JSON.stringify({
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          razorpaySignature: signature,
        }),
      };

      const res = await regularVerifyHandler.main(event);
      assert.equal(res.statusCode, 400);
      const body = JSON.parse(res.body);
      assert.equal(body.isVerified, false);
      assert.match(body.error, /not captured/i);

      assert.equal(mockDb.tables.beta_payment.get(`${cognitoId}#${paymentId}`), undefined);
    });

    test("Refinement 4: Repeated or concurrent verification is idempotent and does not create duplicate revenue", async () => {
      const orderId = "order_rzp_003";
      const paymentId = "pay_rzp_003";
      const signature = generateSignature(orderId, paymentId, secretKey);

      mockDb.tables.beta_product.set(`${institution}#prod_1`, {
        institution,
        productId: "prod_1",
        amount: 50000,
        duration: "2592000000",
        currency: "INR",
      });

      mockDb.tables.beta_user_profile.set(`${institution}#${cognitoId}`, {
        institution,
        cognitoId,
        status: "Inactive",
        paymentData: [{ orderId, productId: "prod_1", amount: 50000, currency: "INR" }],
      });

      mockRazorpayPayments.set(paymentId, {
        id: paymentId,
        order_id: orderId,
        status: "captured",
        amount: 50000,
        currency: "INR",
      });

      const event = {
        pathParameters: { institution },
        requestContext: { identity: { cognitoIdentityId: cognitoId } },
        body: JSON.stringify({
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          razorpaySignature: signature,
        }),
      };

      // First verification: success
      const res1 = await regularVerifyHandler.main(event);
      assert.equal(res1.statusCode, 200);

      // Repeated verification of same payment
      const res2 = await regularVerifyHandler.main(event);
      assert.equal(res2.statusCode, 200);
      const body2 = JSON.parse(res2.body);
      assert.equal(body2.isVerified, true);
      assert.equal(body2.isDuplicate, true);

      // Check profile paymentId array length has not duplicated
      const profile = mockDb.tables.beta_user_profile.get(`${institution}#${cognitoId}`);
      const count = profile.paymentId.filter((id) => id === paymentId).length;
      assert.equal(count, 1, "Payment ID must not be appended more than once");
    });
  });

  // =========================================================================
  // 2. Subscription Billing Verify: Lifecycle vs. Payment Collection
  // =========================================================================
  describe("Subscription Billing Verify", () => {
    test("Gap 2: Active subscription with paid_count === 0 activates profile but does NOT mark payment verified for revenue", async () => {
      const subId = "sub_rzp_zero_collection_123";

      mockDb.tables.beta_payment.set(`${cognitoId}#${subId}`, {
        cognitoId,
        paymentId: subId,
        institution,
        amount: 60000,
        currency: "INR",
        isVerified: false,
      });

      mockDb.tables.beta_user_profile.set(`${institution}#${cognitoId}`, {
        institution,
        cognitoId,
        status: "Inactive",
      });

      // Razorpay subscription is active, but NO payment collected yet (paid_count: 0)
      mockRazorpaySubscriptions.set(subId, {
        id: subId,
        status: "active",
        paid_count: 0, // Mandate active, zero payments collected
        charge_at: 1735689600,
      });

      const event = {
        pathParameters: { institution },
        requestContext: { identity: { cognitoIdentityId: cognitoId } },
        body: JSON.stringify({ subscriptionId: subId }),
      };

      const res = await subscriptionVerifyHandler.main(event);
      assert.equal(res.statusCode, 200);
      const body = JSON.parse(res.body);
      // Signature and subscription mandate valid, but no captured payment
      assert.equal(body.subscriptionActive, true);
      assert.equal(body.isVerified, false, "Payment must NOT be marked verified when paid_count is 0");

      // Verify payment record in DB remains unverified with status 'pending_collection'
      const paymentItem = mockDb.tables.beta_payment.get(`${cognitoId}#${subId}`);
      assert.equal(paymentItem.isVerified, false);
      assert.equal(paymentItem.status, "pending_collection");

      // Profile is activated for member access
      const profileItem = mockDb.tables.beta_user_profile.get(`${institution}#${cognitoId}`);
      assert.equal(profileItem.status, "Active");
      assert.equal(profileItem.subscriptionId, subId);
    });

    test("Active subscription with confirmed payment (paid_count > 0) marks payment verified for revenue", async () => {
      const subId = "sub_rzp_confirmed_456";

      mockDb.tables.beta_payment.set(`${cognitoId}#${subId}`, {
        cognitoId,
        paymentId: subId,
        institution,
        amount: 60000,
        currency: "INR",
        isVerified: false,
      });

      mockDb.tables.beta_user_profile.set(`${institution}#${cognitoId}`, {
        institution,
        cognitoId,
        status: "Inactive",
      });

      // Subscription with 1 paid invoice
      mockRazorpaySubscriptions.set(subId, {
        id: subId,
        status: "active",
        paid_count: 1,
        charge_at: 1735689600,
      });

      const event = {
        pathParameters: { institution },
        requestContext: { identity: { cognitoIdentityId: cognitoId } },
        body: JSON.stringify({ subscriptionId: subId }),
      };

      const res = await subscriptionVerifyHandler.main(event);
      assert.equal(res.statusCode, 200);
      const body = JSON.parse(res.body);
      assert.equal(body.isVerified, true);

      const paymentItem = mockDb.tables.beta_payment.get(`${cognitoId}#${subId}`);
      assert.equal(paymentItem.isVerified, true);
      assert.equal(paymentItem.status, "completed");
      assert.equal(paymentItem.paymentMode, "online");
    });
  });

  // =========================================================================
  // 3. cashOutAmount.js: Strict Currency, Refund Exclusion & Deduplication
  // =========================================================================
  describe("cashOutAmount Revenue Aggregation", () => {
    test("Multi-page scan pagination sums all pages and converts paise to major units", async () => {
      mockDb.tables.beta_payment.set("u1#pay_1", {
        cognitoId: "u1",
        paymentId: "pay_1",
        institution,
        amount: 10000, // 100 INR
        currency: "INR",
        isVerified: true,
      });
      mockDb.tables.beta_payment.set("u2#pay_2", {
        cognitoId: "u2",
        paymentId: "pay_2",
        institution,
        amount: 20000, // 200 INR
        currency: "INR",
        isVerified: true,
      });
      mockDb.tables.beta_payment.set("u3#pay_3", {
        cognitoId: "u3",
        paymentId: "pay_3",
        institution,
        amount: 30000, // 300 INR
        currency: "INR",
        isVerified: true,
      });
      mockDb.tables.beta_payment.set("u4#pay_4", {
        cognitoId: "u4",
        paymentId: "pay_4",
        institution,
        amount: 40000, // 400 INR
        currency: "INR",
        isVerified: true,
      });

      const event = { pathParameters: { institution } };
      const res = await cashOutAmountHandler.main(event);
      assert.equal(res.statusCode, 200);

      const body = JSON.parse(res.body);
      assert.equal(body.payments.count, 4);
      assert.equal(body.payments.currencyTotals.INR, 1000);
      assert.equal(body.payments.grossCurrencyTotals.INR, 1000);
    });

    test("Gap 1: Does NOT infer INR solely from provider === razorpay; classifies missing currency as UNKNOWN and NEVER adds to INR", async () => {
      mockDb.tables.beta_payment.set("u1#pay_inr", {
        cognitoId: "u1",
        paymentId: "pay_inr",
        institution,
        amount: 50000, // 500 INR
        currency: "INR",
        isVerified: true,
      });
      mockDb.tables.beta_payment.set("u2#pay_rzp_no_currency", {
        cognitoId: "u2",
        paymentId: "pay_rzp_no_currency",
        institution,
        amount: 30000, // 300 units
        provider: "razorpay", // Even though provider is razorpay, currency is missing!
        paymentMode: "online",
        // currency is undefined/missing
        isVerified: true,
      });

      const event = { pathParameters: { institution } };
      const res = await cashOutAmountHandler.main(event);
      assert.equal(res.statusCode, 200);

      const body = JSON.parse(res.body);
      // INR total must strictly remain 500, never 800!
      assert.equal(body.payments.currencyTotals.INR, 500);
      assert.equal(body.payments.currencyTotals.UNKNOWN, 300);
    });

    test("Gap 2: Prevents double counting between subscription record and individual payment record", async () => {
      // 1. Subscription container record sub_999 exists
      mockDb.tables.beta_payment.set("u1#sub_999", {
        cognitoId: "u1",
        paymentId: "sub_999",
        institution,
        amount: 50000, // 500 INR
        currency: "INR",
        isVerified: true,
      });
      // 2. Individual payment record pay_invoice_1 for subscription sub_999 exists
      mockDb.tables.beta_payment.set("u1#pay_invoice_1", {
        cognitoId: "u1",
        paymentId: "pay_invoice_1",
        subscriptionId: "sub_999",
        institution,
        amount: 50000, // 500 INR
        currency: "INR",
        isVerified: true,
      });

      const event = { pathParameters: { institution } };
      const res = await cashOutAmountHandler.main(event);
      assert.equal(res.statusCode, 200);

      const body = JSON.parse(res.body);
      // Must count the collection ONCE (500 INR), NOT twice (1000 INR)
      assert.equal(body.payments.currencyTotals.INR, 500);
      assert.equal(body.payments.count, 1);
    });

    test("Refinement 6: Excludes confirmed full refunds from net currencyTotals but keeps in grossCurrencyTotals", async () => {
      mockDb.tables.beta_payment.set("u1#pay_active", {
        cognitoId: "u1",
        paymentId: "pay_active",
        institution,
        amount: 50000, // 500 INR
        currency: "INR",
        isVerified: true,
        status: "completed",
      });
      mockDb.tables.beta_payment.set("u2#pay_refunded", {
        cognitoId: "u2",
        paymentId: "pay_refunded",
        institution,
        amount: 25000, // 250 INR
        currency: "INR",
        isVerified: true,
        status: "refunded",
        refundId: "rfnd_123",
      });

      const event = { pathParameters: { institution } };
      const res = await cashOutAmountHandler.main(event);
      assert.equal(res.statusCode, 200);

      const body = JSON.parse(res.body);
      assert.equal(body.payments.currencyTotals.INR, 500);
      assert.equal(body.payments.grossCurrencyTotals.INR, 750);
      assert.equal(body.payments.count, 1);
      assert.equal(body.payments.grossCount, 2);
    });
  });

  // =========================================================================
  // 4. payment-history.js: Scan Pagination, BatchGet Retry & Mode Normalization
  // =========================================================================
  describe("payment-history", () => {
    test("Normalizes historical payment modes, filters invalid keys, and retries BatchGet UnprocessedKeys", async () => {
      mockDb.tables.beta_payment.set("user_a#pay_rzp", {
        cognitoId: "user_a",
        paymentId: "pay_rzp_99",
        institution,
        amount: 10000,
        currency: "INR",
        paymentMode: "Razorpay",
        paymentDate: 1700000000000,
        isVerified: true,
      });
      mockDb.tables.beta_payment.set("user_b#pay_off", {
        cognitoId: "user_b",
        paymentId: "pay_off_1",
        institution,
        amount: 20000,
        currency: "INR",
        paymentMode: "offline",
        paymentDate: 1700000010000,
        isVerified: true,
      });
      mockDb.tables.beta_payment.set("blank#pay_ghost", {
        cognitoId: "   ",
        paymentId: "pay_ghost",
        institution,
        amount: 5000,
        currency: "INR",
        paymentMode: "online",
        paymentDate: 1700000020000,
        isVerified: true,
      });

      mockDb.tables.beta_user_profile.set(`${institution}#user_a`, {
        institution,
        cognitoId: "user_a",
        userName: "Alice",
      });
      mockDb.tables.beta_user_profile.set(`${institution}#user_b`, {
        institution,
        cognitoId: "user_b",
        userName: "Bob",
      });

      mockDb.batchGetUnprocessedCounter = 1;

      const event = { pathParameters: { institution } };
      const res = await paymentHistoryHandler.main(event);
      assert.equal(res.statusCode, 200);

      const body = JSON.parse(res.body);
      const payments = body.payments;

      const rzpPayment = payments.find((p) => p.paymentId === "pay_rzp_99");
      assert.ok(rzpPayment);
      assert.equal(rzpPayment.paymentMode, "online");
      assert.equal(rzpPayment.userDetails?.userName, "Alice");

      const offPayment = payments.find((p) => p.paymentId === "pay_off_1");
      assert.ok(offPayment);
      assert.equal(offPayment.paymentMode, "offline");
      assert.equal(offPayment.userDetails?.userName, "Bob");
    });
  });
});
