/**
 * userDeduplication.js
 * 
 * Shared frontend utility for system-wide duplicate user and account resolution by email.
 * Adheres to strict frontend-only data integrity constraints:
 * - Normalized email address (trimmed, lowercase) as deduplication key.
 * - Display names are NEVER used as identity keys.
 * - Records with missing/malformed emails are NEVER combined or guessed.
 * - Private data (emails, cognitoIds) is protected from exposure in public UI.
 * 
 * Canonical Account Selection Rules:
 * 1. If exactly one account is active, select that active account.
 * 2. If all accounts are inactive, select the account that was active most recently, using reliable existing activity data.
 * 3. If multiple accounts are active, select the account whose verified plan end date is latest.
 * 4. Handle missing, invalid or tied values explicitly. Never fabricate dates or assume missing information means active indefinitely.
 * 5. If available data cannot determine the correct account, report ambiguity rather than guessing.
 */

/**
 * Normalizes an email address.
 * Trims whitespace, converts to lowercase.
 * Returns null if missing, empty, not a string, or not a valid email format.
 */
export const normalizeEmail = (email) => {
  if (typeof email !== "string") return null;
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return null;
  // Standard email format validation (local-part@domain.tld)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) return null;
  return trimmed;
};

/**
 * Extracts a normalized email from an account or user object.
 * Checks known email fields in priority order without guessing.
 */
export const getUserEmail = (user) => {
  if (!user || typeof user !== "object") return null;
  const rawEmail =
    user.emailId ||
    user.email ||
    user.email_id ||
    user.userEmail ||
    (typeof user.username === "string" && user.username.includes("@") ? user.username : null);
  return normalizeEmail(rawEmail);
};

/**
 * Safely parses any date/timestamp representation into epoch milliseconds.
 * Returns null if missing, invalid, non-positive, or NaN. Never fabricates a date.
 */
export const resolveTimestamp = (value) => {
  if (value === null || value === undefined || value === "") return null;

  if (typeof value === "number") {
    if (!Number.isFinite(value) || value <= 0) return null;
    // Seconds vs milliseconds heuristic
    return value < 1e12 ? value * 1000 : value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;

    // Check if numeric string
    const num = Number(trimmed);
    if (Number.isFinite(num) && num > 0) {
      return num < 1e12 ? num * 1000 : num;
    }

    // Try parsing date string
    const parsed = Date.parse(trimmed);
    return Number.isNaN(parsed) || parsed <= 0 ? null : parsed;
  }

  if (value instanceof Date) {
    const time = value.getTime();
    return Number.isNaN(time) || time <= 0 ? null : time;
  }

  return null;
};

/**
 * Determines whether an account is currently active.
 * Strict interpretation:
 * - isArchived === true is NEVER active.
 * - Explicit active statuses: 'active', 'trial', 'graceperiod', or isGracePeriod === true.
 * - Inactive/paused/cancelled/expired or missing status is NOT active.
 * - Never assumes missing information implies active.
 */
export const isAccountActive = (account) => {
  if (!account || typeof account !== "object") return false;
  if (account.isArchived === true) return false;

  const rawStatus = (account.status || account.userStatus || "").toString().trim().toLowerCase();

  if (["inactive", "paused", "cancelled", "expired", "archived"].includes(rawStatus)) {
    return false;
  }

  if (["active", "trial", "graceperiod"].includes(rawStatus) || account.isGracePeriod === true) {
    return true;
  }

  // Missing or unknown status defaults to not active (Rule 4)
  return false;
};

/**
 * Retrieves the latest verified plan end date (epoch ms) from an account.
 * Checks known plan end date fields: renewDate, planEndDate, current_end, etc.
 * Returns null if missing or invalid. Never fabricates a date.
 */
export const getVerifiedPlanEndDate = (account) => {
  if (!account || typeof account !== "object") return null;
  const candidates = [
    account.renewDate,
    account.planEndDate,
    account.current_end,
    account.membershipExpiresAt,
    account.expiryDate,
    account.subscriptionEndDate,
  ];

  for (const candidate of candidates) {
    const ts = resolveTimestamp(candidate);
    if (ts !== null) return ts;
  }
  return null;
};

/**
 * Retrieves the latest activity timestamp (epoch ms) from an account.
 * Checks reliable activity fields: lastLogin, updatedAt, paymentDate, renewDate, joiningDate, createdAt.
 * Returns null if no reliable activity timestamp exists.
 */
export const getLatestActivityDate = (account) => {
  if (!account || typeof account !== "object") return null;

  const candidates = [
    account.lastLogin,
    account.updatedAt,
    account.lastActive,
    account.lastActivityDate,
    account.paymentDate,
    account.renewDate,
    account.joiningDate,
    account.createdAt,
    account.creationDate,
  ];

  let latest = null;
  for (const candidate of candidates) {
    const ts = resolveTimestamp(candidate);
    if (ts !== null) {
      if (latest === null || ts > latest) {
        latest = ts;
      }
    }
  }
  return latest;
};

/**
 * Canonical Account Selection:
 * Given an array of 2 or more accounts that share the same normalized email,
 * selects exactly one canonical account according to the 5 rules.
 * 
 * Returns an object:
 * {
 *   canonical: accountObject,
 *   isAmbiguous: boolean,
 *   reason: string,
 *   activeCount: number,
 *   totalCount: number
 * }
 */
export const selectCanonicalAccountWithReport = (accounts) => {
  if (!Array.isArray(accounts) || accounts.length === 0) {
    return { canonical: null, isAmbiguous: false, reason: "No accounts provided", activeCount: 0, totalCount: 0 };
  }

  if (accounts.length === 1) {
    return {
      canonical: accounts[0],
      isAmbiguous: false,
      reason: "Single account",
      activeCount: isAccountActive(accounts[0]) ? 1 : 0,
      totalCount: 1,
    };
  }

  const activeAccounts = accounts.filter(isAccountActive);
  const inactiveAccounts = accounts.filter((acc) => !isAccountActive(acc));

  // Rule 1: If exactly one account is active, select that active account.
  if (activeAccounts.length === 1) {
    return {
      canonical: activeAccounts[0],
      isAmbiguous: false,
      reason: "Rule 1: Exactly one active account selected",
      activeCount: 1,
      totalCount: accounts.length,
    };
  }

  // Rule 2: If all accounts are inactive, select the account that was active most recently.
  if (activeAccounts.length === 0) {
    const withActivity = inactiveAccounts.map((acc, index) => ({
      account: acc,
      index,
      activityTs: getLatestActivityDate(acc),
    }));

    // Filter those with valid activity timestamps
    const validActivity = withActivity.filter((item) => item.activityTs !== null);

    if (validActivity.length > 0) {
      validActivity.sort((a, b) => b.activityTs - a.activityTs);

      // Check if there is a tie for the top activity timestamp
      const topTs = validActivity[0].activityTs;
      const tiedTops = validActivity.filter((item) => item.activityTs === topTs);

      if (tiedTops.length === 1) {
        return {
          canonical: tiedTops[0].account,
          isAmbiguous: false,
          reason: `Rule 2: Most recently active inactive account selected (ts: ${topTs})`,
          activeCount: 0,
          totalCount: accounts.length,
        };
      } else {
        // Tied values handled explicitly: use joiningDate or stable identifier
        const tiedWithJoining = tiedTops.map((item) => ({
          ...item,
          joiningTs: resolveTimestamp(item.account.joiningDate),
        }));

        const validJoining = tiedWithJoining.filter((item) => item.joiningTs !== null);
        if (validJoining.length > 0) {
          validJoining.sort((a, b) => b.joiningTs - a.joiningTs);
          const topJoining = validJoining[0].joiningTs;
          const tiedJoining = validJoining.filter((item) => item.joiningTs === topJoining);
          if (tiedJoining.length === 1) {
            return {
              canonical: tiedJoining[0].account,
              isAmbiguous: false,
              reason: "Rule 2: Tie-breaker on joining date selected",
              activeCount: 0,
              totalCount: accounts.length,
            };
          }
        }

        // Unresolved tie reported explicitly
        return {
          canonical: tiedTops[0].account,
          isAmbiguous: true,
          reason: "Rule 2 (Ambiguous): Multiple inactive accounts have tied latest activity timestamps",
          activeCount: 0,
          totalCount: accounts.length,
        };
      }
    }

    // No reliable activity data found on any inactive account
    return {
      canonical: inactiveAccounts[0],
      isAmbiguous: true,
      reason: "Rule 2 & 5 (Ambiguous): All accounts inactive but reliable activity data is unavailable",
      activeCount: 0,
      totalCount: accounts.length,
    };
  }

  // Rule 3: If multiple accounts are active, select the account whose verified plan end date is latest.
  if (activeAccounts.length > 1) {
    const withPlanEnd = activeAccounts.map((acc, index) => ({
      account: acc,
      index,
      planEndTs: getVerifiedPlanEndDate(acc),
      activityTs: getLatestActivityDate(acc),
    }));

    const validPlanEnd = withPlanEnd.filter((item) => item.planEndTs !== null);

    if (validPlanEnd.length > 0) {
      validPlanEnd.sort((a, b) => b.planEndTs - a.planEndTs);
      const topPlanEnd = validPlanEnd[0].planEndTs;
      const tiedTops = validPlanEnd.filter((item) => item.planEndTs === topPlanEnd);

      if (tiedTops.length === 1) {
        return {
          canonical: tiedTops[0].account,
          isAmbiguous: false,
          reason: `Rule 3: Multiple active accounts; latest verified plan end date selected (ts: ${topPlanEnd})`,
          activeCount: activeAccounts.length,
          totalCount: accounts.length,
        };
      } else {
        // Tied verified plan end dates: fall back to latest activity date among tied active accounts
        const tiedWithActivity = tiedTops.filter((item) => item.activityTs !== null);
        if (tiedWithActivity.length > 0) {
          tiedWithActivity.sort((a, b) => b.activityTs - a.activityTs);
          const topAct = tiedWithActivity[0].activityTs;
          const tiedAct = tiedWithActivity.filter((item) => item.activityTs === topAct);
          if (tiedAct.length === 1) {
            return {
              canonical: tiedAct[0].account,
              isAmbiguous: false,
              reason: "Rule 3: Tie-breaker on activity date among tied active accounts selected",
              activeCount: activeAccounts.length,
              totalCount: accounts.length,
            };
          }
        }

        return {
          canonical: tiedTops[0].account,
          isAmbiguous: true,
          reason: "Rule 3 & 5 (Ambiguous): Multiple active accounts with tied verified plan end dates",
          activeCount: activeAccounts.length,
          totalCount: accounts.length,
        };
      }
    }

    // None of the active accounts have a verified plan end date (handle without fabricating dates)
    const withValidActivity = withPlanEnd.filter((item) => item.activityTs !== null);
    if (withValidActivity.length > 0) {
      withValidActivity.sort((a, b) => b.activityTs - a.activityTs);
      const topAct = withValidActivity[0].activityTs;
      const tiedAct = withValidActivity.filter((item) => item.activityTs === topAct);
      if (tiedAct.length === 1) {
        return {
          canonical: tiedAct[0].account,
          isAmbiguous: false,
          reason: "Rule 3 Fallback: Active accounts missing plan end dates; most recent activity selected",
          activeCount: activeAccounts.length,
          totalCount: accounts.length,
        };
      }
    }

    return {
      canonical: activeAccounts[0],
      isAmbiguous: true,
      reason: "Rule 3 & 5 (Ambiguous): Multiple active accounts but plan end dates and activity data are missing or tied",
      activeCount: activeAccounts.length,
      totalCount: accounts.length,
    };
  }

  // Safety fallback
  return {
    canonical: accounts[0],
    isAmbiguous: true,
    reason: "Fallback safe selection",
    activeCount: activeAccounts.length,
    totalCount: accounts.length,
  };
};

/**
 * Returns the canonical account object directly for an array of duplicate accounts sharing an email.
 */
export const selectCanonicalAccount = (accounts) => {
  const result = selectCanonicalAccountWithReport(accounts);
  return result?.canonical || null;
};

/**
 * Deduplicates a list of user/account records by normalized email address.
 * 
 * Rules:
 * - Only records with valid normalized email addresses are grouped.
 * - Records with missing or malformed email addresses are preserved intact without guessing.
 * - Display names are NEVER used to group accounts.
 * - Two records with identical names but different emails are preserved as distinct users.
 * - Multiple accounts for the same email are resolved to a single canonical account.
 * - Associated cognitoIds of duplicate accounts are attached to the canonical account
 *   under `_mergedCognitoIds` (a Set or Array) for safe lookup across historical records.
 * 
 * Returns: Array of deduplicated user/account records.
 */
export const deduplicateUserList = (users) => {
  if (!Array.isArray(users)) return [];
  if (users.length <= 1) return users;

  const validEmailGroups = new Map();
  const unidentifiableRecords = [];

  // Group by normalized email
  for (const user of users) {
    const email = getUserEmail(user);
    if (!email) {
      // Missing or malformed email: preserve intact without guessing
      unidentifiableRecords.push(user);
      continue;
    }

    if (!validEmailGroups.has(email)) {
      validEmailGroups.set(email, []);
    }
    validEmailGroups.get(email).push(user);
  }

  const canonicalResults = [];

  for (const [email, group] of validEmailGroups.entries()) {
    if (group.length === 1) {
      canonicalResults.push(group[0]);
    } else {
      const report = selectCanonicalAccountWithReport(group);
      const canonical = report.canonical;

      if (canonical) {
        // Collect all cognitoIds and IDs associated with this normalized email
        const allCognitoIds = new Set();
        group.forEach((acc) => {
          if (acc.cognitoId) allCognitoIds.add(acc.cognitoId);
          if (acc.memberId) allCognitoIds.add(acc.memberId);
          if (acc.userId) allCognitoIds.add(acc.userId);
        });

        // Enrich the canonical user with non-breaking metadata
        const enriched = {
          ...canonical,
          _allAssociatedCognitoIds: Array.from(allCognitoIds),
          _duplicateAccountCount: group.length,
          _dedupAmbiguous: report.isAmbiguous,
        };
        canonicalResults.push(enriched);
      }
    }
  }

  // Combine canonical results and unidentifiable records
  return [...canonicalResults, ...unidentifiableRecords];
};

/**
 * Builds a fast lookup map from an array of users, mapping every known
 * normalized email, cognitoId, and memberId to the corresponding canonical user.
 */
export const createCanonicalUserLookup = (users) => {
  const deduplicated = deduplicateUserList(users || []);
  const byEmail = new Map();
  const byId = new Map();

  for (const user of deduplicated) {
    const email = getUserEmail(user);
    if (email) {
      byEmail.set(email, user);
    }

    // Direct IDs
    if (user.cognitoId) byId.set(user.cognitoId, user);
    if (user.memberId) byId.set(user.memberId, user);
    if (user.userId) byId.set(user.userId, user);

    // Associated IDs from merged duplicates
    if (Array.isArray(user._allAssociatedCognitoIds)) {
      user._allAssociatedCognitoIds.forEach((id) => {
        if (id) byId.set(id, user);
      });
    }
  }

  return {
    deduplicatedUsers: deduplicated,
    findCanonicalUser: ({ cognitoId, email, userId, memberId }) => {
      const normEmail = normalizeEmail(email);
      if (normEmail && byEmail.has(normEmail)) {
        return byEmail.get(normEmail);
      }
      if (cognitoId && byId.has(cognitoId)) {
        return byId.get(cognitoId);
      }
      if (memberId && byId.has(memberId)) {
        return byId.get(memberId);
      }
      if (userId && byId.has(userId)) {
        return byId.get(userId);
      }
      return null;
    },
  };
};

/**
 * Resolves a given account / payment / attendance / reward identifier to the canonical user.
 * Preserves the original record intact while linking to canonical identity.
 */
export const getCanonicalUser = (userList, { cognitoId, email, userId, memberId } = {}) => {
  if (!userList || !Array.isArray(userList)) return null;
  const lookup = createCanonicalUserLookup(userList);
  return lookup.findCanonicalUser({ cognitoId, email, userId, memberId });
};

/**
 * Deduplicates leaderboard entries by normalized email identity.
 * 
 * Rules:
 * - Uses email from entry directly or maps cognitoId to userList if available.
 * - If multiple entries share a normalized email, selects the canonical entry based on
 *   account status / verified plan / activity rules.
 * - Does NOT combine different users with different emails who have the same display name.
 * - Does NOT modify individual point balances or fabricate ranks.
 * - Recalculates sequential displayed ranks (1, 2, 3...) so no duplicate ranks or gaps appear.
 */
export const deduplicateLeaderboardEntries = (entries, userList = []) => {
  if (!Array.isArray(entries)) return [];
  if (entries.length <= 1) return entries;

  // Build lookup from userList to enrich leaderboard entries with account status / plan / activity
  const userListLookup = createCanonicalUserLookup(userList || []);

  // Map of specific raw accounts by cognitoId for individual account status/activity inspection
  const rawAccountsByCognitoId = new Map();
  (userList || []).forEach((u) => {
    if (u.cognitoId) rawAccountsByCognitoId.set(u.cognitoId, u);
  });

  // Map each entry to its normalized email (if identifiable)
  const entriesWithIdentity = entries.map((entry, originalIndex) => {
    const rawAccount = entry.cognitoId ? rawAccountsByCognitoId.get(entry.cognitoId) : null;
    let email = getUserEmail(entry) || (rawAccount ? getUserEmail(rawAccount) : null);

    if (!email && entry.cognitoId) {
      const canonicalUser = userListLookup.findCanonicalUser({ cognitoId: entry.cognitoId });
      if (canonicalUser) {
        email = getUserEmail(canonicalUser);
      }
    }

    return {
      entry,
      originalIndex,
      email,
      rawAccount,
    };
  });

  const validEmailGroups = new Map();
  const unidentifiable = [];

  for (const item of entriesWithIdentity) {
    if (!item.email) {
      // Missing or unidentifiable email: preserve intact without guessing
      unidentifiable.push(item);
      continue;
    }

    if (!validEmailGroups.has(item.email)) {
      validEmailGroups.set(item.email, []);
    }
    validEmailGroups.get(item.email).push(item);
  }

  const selectedEntries = [];

  for (const [email, group] of validEmailGroups.entries()) {
    if (group.length === 1) {
      // Single entry for this email: ensure it maps to canonical identity if available
      const canonicalUser = userListLookup.findCanonicalUser({
        cognitoId: group[0].entry.cognitoId,
        email,
      });
      if (canonicalUser && canonicalUser.cognitoId !== group[0].entry.cognitoId) {
        selectedEntries.push({
          ...group[0],
          entry: {
            ...group[0].entry,
            cognitoId: canonicalUser.cognitoId,
            applicantName: canonicalUser.userName || canonicalUser.name || group[0].entry.applicantName,
            name: canonicalUser.userName || canonicalUser.name || group[0].entry.name,
            profilePicture: canonicalUser.imgUrl || canonicalUser.profilePicture || group[0].entry.profilePicture,
          },
        });
      } else {
        selectedEntries.push(group[0]);
      }
    } else {
      // Multiple leaderboard entries share the same normalized email
      // Prepare composite accounts for canonical selection
      const compositeAccounts = group.map((item) => {
        const acc = item.rawAccount || {};
        return {
          ...acc,
          ...item.entry,
          cognitoId: item.entry.cognitoId || acc.cognitoId,
          status: item.entry.status || acc.status,
          userStatus: item.entry.userStatus || acc.userStatus,
          isArchived: item.entry.isArchived ?? acc.isArchived,
          renewDate: item.entry.renewDate || acc.renewDate,
          planEndDate: item.entry.planEndDate || acc.planEndDate,
          lastLogin: item.entry.lastLogin || acc.lastLogin,
          updatedAt: item.entry.updatedAt || acc.updatedAt,
          joiningDate: item.entry.joiningDate || acc.joiningDate,
          _leaderboardItem: item,
        };
      });

      const canonicalComposite = selectCanonicalAccount(compositeAccounts);
      let chosenItem = canonicalComposite?._leaderboardItem || group[0];

      // Ensure canonical user ID and display name are used
      const canonicalUser = userListLookup.findCanonicalUser({
        cognitoId: chosenItem.entry.cognitoId,
        email,
      });

      if (canonicalUser) {
        chosenItem = {
          ...chosenItem,
          entry: {
            ...chosenItem.entry,
            cognitoId: canonicalUser.cognitoId || chosenItem.entry.cognitoId,
            applicantName: canonicalUser.userName || canonicalUser.name || chosenItem.entry.applicantName,
            name: canonicalUser.userName || canonicalUser.name || chosenItem.entry.name,
            profilePicture: canonicalUser.imgUrl || canonicalUser.profilePicture || chosenItem.entry.profilePicture,
          },
        };
      }

      selectedEntries.push(chosenItem);
    }
  }

  // Combine and sort back into original points/rank ordering
  const allFinal = [...selectedEntries, ...unidentifiable];

  // Stable sort by points descending (or preserve original order if points are tied)
  allFinal.sort((a, b) => {
    const aPoints = Number(a.entry.points ?? a.entry.totalPoints ?? a.entry.zPoints ?? 0);
    const bPoints = Number(b.entry.points ?? b.entry.totalPoints ?? b.entry.zPoints ?? 0);
    if (bPoints !== aPoints) {
      return bPoints - aPoints;
    }
    return a.originalIndex - b.originalIndex;
  });

  // Re-assign sequential ranks
  return allFinal.map((item, idx) => ({
    ...item.entry,
    rank: idx + 1,
  }));
};
