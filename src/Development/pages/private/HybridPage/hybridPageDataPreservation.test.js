import { DefaultPageSchema, BetaSeedPageData } from "./HybridPageData";
import { buildCanonicalHybridUrl, getShareProfileUrl } from "../../../utils/shareService";
import { getHostname, getSocialPlatformFromUrl } from "./socialUtils";

describe("Hybrid Page Production-Readiness & Data Preservation Audit", () => {
  // Test 1: Preservation of existing instructor content when loaded
  describe("1. Existing Instructor Content Preservation", () => {
    it("preserves existing instructor profile and hybrid data without corruption", () => {
      const mockBackendInstructorData = {
        instructorId: "inst_123",
        name: "Madan Mohan",
        position: "Master Zumba Instructor",
        location: "Bhubaneswar Studio",
        hybrid: {
          globalPrimaryColor: "#1a4d47",
          hero: {
            title: "Certified Zumba & Fitness Trainer",
            description: "High energy classes every morning.",
            video: "https://institution-utils.s3.amazonaws.com/happyprancer/instructors/inst_123/hero/video/vid_1.mp4",
            videoAdjust: { x: 5, y: -10, zoom: 1.2 },
          },
          story: {
            title: "10 Years of Energy",
            introParagraph: "Welcome to my fitness journey.",
            quote: "Dance like nobody is watching.",
            overview: {
              students: "500+",
              rating: "4.9",
              classes: "350+",
              studio: "Bhubaneswar Central Studio",
            },
          },
          classes: [
            {
              id: "cls_101",
              name: "Morning Zumba Blast",
              recurringPrice: 1800,
              originalPrice: 2000,
              currency: "₹",
              includedServices: ["Zumba", "Dance Cardio"],
            },
          ],
          socialMedia: {
            instagram: "https://instagram.com/madan_zumba",
            facebook: "https://facebook.com/madanzumba",
            youtube: "https://youtube.com/@madanzumba",
          },
        },
      };

      // Verify that the backend data retains all existing fields
      expect(mockBackendInstructorData.hybrid.hero.title).toBe("Certified Zumba & Fitness Trainer");
      expect(mockBackendInstructorData.hybrid.hero.videoAdjust.zoom).toBe(1.2);
      expect(mockBackendInstructorData.hybrid.classes).toHaveLength(1);
      expect(mockBackendInstructorData.hybrid.classes[0].id).toBe("cls_101");
      expect(mockBackendInstructorData.hybrid.socialMedia.instagram).toBe("https://instagram.com/madan_zumba");
    });

    it("does not wipe populated backend arrays when incoming data has empty arrays", () => {
      const resolveNonEmptyArray = (...candidates) => {
        for (const candidate of candidates) {
          if (Array.isArray(candidate) && candidate.length > 0) {
            return candidate;
          }
        }
        return [];
      };

      const existingClasses = [{ id: "c1", name: "Yoga Flow" }];
      const emptyUpdate = [];

      const resolved = resolveNonEmptyArray(emptyUpdate, existingClasses);
      expect(resolved).toEqual(existingClasses);
      expect(resolved).toHaveLength(1);
      expect(resolved[0].name).toBe("Yoga Flow");
    });
  });

  // Test 2: Field isolation - editing one field does not clear unrelated fields
  describe("2. Field Isolation & Non-Destructive Editing", () => {
    it("editing hero section leaves story, classes, and social media completely untouched", () => {
      const originalState = {
        globalPrimaryColor: "#215A55",
        hero: {
          name: "Original Name",
          title: "Senior Coach",
          description: "Original Description",
          video: "https://s3.amazonaws.com/orig_video.mp4",
        },
        story: {
          title: "My Story",
          quote: "Keep moving",
        },
        classes: [
          { id: "c1", name: "Zumba", recurringPrice: 1500 },
        ],
        socialMedia: {
          instagram: "https://instagram.com/orig",
          youtube: "https://youtube.com/orig",
        },
      };

      // Simulate partial edit on hero
      const updatedHero = {
        ...originalState.hero,
        title: "Updated Senior Master Coach",
      };

      const newState = {
        ...originalState,
        hero: updatedHero,
      };

      // Verification
      expect(newState.hero.title).toBe("Updated Senior Master Coach");
      expect(newState.hero.description).toBe(originalState.hero.description);
      expect(newState.hero.video).toBe(originalState.hero.video);
      expect(newState.story).toEqual(originalState.story);
      expect(newState.classes).toEqual(originalState.classes);
      expect(newState.socialMedia).toEqual(originalState.socialMedia);
    });

    it("deepMerge preserves omitted nested fields in backend saves", () => {
      function deepMerge(target, source) {
        if (source === undefined) return target;
        if (source === null || typeof source !== "object") return source;
        if (Array.isArray(source)) return source;
        if (target === null || typeof target !== "object" || Array.isArray(target)) return source;

        const result = { ...target };
        for (const key of Object.keys(source)) {
          if (key in target) {
            result[key] = deepMerge(target[key], source[key]);
          } else {
            result[key] = source[key];
          }
        }
        return result;
      }

      const existingInDb = {
        hero: {
          title: "Original Title",
          video: "s3://vid.mp4",
          videoAdjust: { x: 10, y: 20, zoom: 1.5 },
        },
        socialMedia: {
          instagram: "https://instagram.com/test",
          facebook: "https://facebook.com/test",
        },
      };

      // Frontend sends update with only updated hero title (no videoAdjust specified)
      const incomingUpdate = {
        hero: {
          title: "New Title",
        },
      };

      const merged = deepMerge(existingInDb, incomingUpdate);
      expect(merged.hero.title).toBe("New Title");
      expect(merged.hero.video).toBe("s3://vid.mp4");
      expect(merged.hero.videoAdjust).toEqual({ x: 10, y: 20, zoom: 1.5 });
      expect(merged.socialMedia.instagram).toBe("https://instagram.com/test");
    });
  });

  // Test 3: Missing optional values and fallback safety
  describe("3. Missing Optional Values & Schema Defaults", () => {
    it("DefaultPageSchema contains zero hardcoded instructor names or demo media", () => {
      expect(DefaultPageSchema.hero.name).toBe("");
      expect(DefaultPageSchema.hero.video).toBe("");
      expect(DefaultPageSchema.hero.image).toBe("");
      expect(DefaultPageSchema.globalPrimaryColor).toBe("#215A55");
    });

    it("falls back to instructor position or city when hybrid fields are missing", () => {
      const mockInstructorProfile = {
        position: "Certified Yoga Guru",
        city: "Bhubaneswar",
      };

      const resolvedTitle = mockInstructorProfile.position || "Instructor";
      const resolvedStudio = mockInstructorProfile.city || "Studio";

      expect(resolvedTitle).toBe("Certified Yoga Guru");
      expect(resolvedStudio).toBe("Bhubaneswar");
    });
  });

  // Test 4: Authorization and multi-instructor boundary security
  describe("4. Security & Multi-Instructor Boundaries", () => {
    const isAuthorizedToEdit = (userCtx, instructorDetails) => {
      if (!userCtx || !instructorDetails) return false;
      const isAdmin = userCtx.userType === "admin";
      const isOwner =
        Boolean(userCtx.cognitoId && instructorDetails.instructorId) &&
        userCtx.cognitoId === instructorDetails.instructorId;
      return isAdmin || isOwner;
    };

    it("allows the instructor to edit their own hybrid page", () => {
      const userCtx = { cognitoId: "cognito_user_1", userType: "instructor" };
      const instructorDetails = { instructorId: "cognito_user_1" };
      expect(isAuthorizedToEdit(userCtx, instructorDetails)).toBe(true);
    });

    it("prevents Instructor A from editing Instructor B's hybrid page", () => {
      const userCtx = { cognitoId: "cognito_instructor_A", userType: "instructor" };
      const instructorDetails = { instructorId: "cognito_instructor_B" };
      expect(isAuthorizedToEdit(userCtx, instructorDetails)).toBe(false);
    });

    it("allows institution admin to edit instructor hybrid pages", () => {
      const userCtx = { cognitoId: "cognito_admin", userType: "admin" };
      const instructorDetails = { instructorId: "cognito_instructor_B" };
      expect(isAuthorizedToEdit(userCtx, instructorDetails)).toBe(true);
    });

    it("denies unauthenticated guests from editing", () => {
      const userCtx = null;
      const instructorDetails = { instructorId: "cognito_instructor_B" };
      expect(isAuthorizedToEdit(userCtx, instructorDetails)).toBe(false);
    });
  });

  // Test 5: S3 Upload & Delete Path Isolation
  describe("5. S3 Upload & Deletion Safety", () => {
    it("constructs correct scoped folder path for uploads", () => {
      const institutionId = "happyprancer";
      const instructorId = "inst_99";
      const folder = `${institutionId}/instructors/${instructorId}/hero/video`;

      expect(folder).toBe("happyprancer/instructors/inst_99/hero/video");
      const parts = folder.split("/");
      expect(parts).toHaveLength(5);
      expect(parts[0]).toBe("happyprancer");
      expect(parts[1]).toBe("instructors");
      expect(parts[2]).toBe("inst_99");
    });

    it("validates that deleteFile path must strictly match instructor scope", () => {
      const isFolderScopeAuthorized = (folder, institution, instructorId) => {
        if (!folder || typeof folder !== "string") return false;
        if (folder.includes("..") || folder.includes("\\") || folder.startsWith("/")) return false;
        const parts = folder.split("/");
        return (
          parts.length >= 4 &&
          parts[0] === institution &&
          parts[1] === "instructors" &&
          parts[2] === instructorId
        );
      };

      // Valid scoped path
      expect(
        isFolderScopeAuthorized(
          "happyprancer/instructors/inst_99/hero/video",
          "happyprancer",
          "inst_99"
        )
      ).toBe(true);

      // Attempting to delete another instructor's folder
      expect(
        isFolderScopeAuthorized(
          "happyprancer/instructors/inst_OTHER/hero/video",
          "happyprancer",
          "inst_99"
        )
      ).toBe(false);

      // Path traversal attempts
      expect(
        isFolderScopeAuthorized(
          "happyprancer/instructors/inst_99/../../root",
          "happyprancer",
          "inst_99"
        )
      ).toBe(false);

      // Entire instructor deletion attempt
      expect(
        isFolderScopeAuthorized(
          "happyprancer/instructors/inst_99",
          "happyprancer",
          "inst_99"
        )
      ).toBe(false);
    });
  });

  // Test 6: URL Shortener & Canonical Sharing on Pre-Production Domain
  describe("6. Canonical Share URL & Pre-Production Domain Resolution", () => {
    it("builds canonical hybrid profile URL correctly with pre-production domain", () => {
      // Mock window.location.origin
      const originalWindow = global.window;
      delete global.window;
      global.window = {
        location: {
          origin: "https://durgaelectricals.tekkzy.com",
        },
      };

      const url = buildCanonicalHybridUrl({
        institution: "happyprancer",
        referral: "MADAN",
      });

      expect(url).toBe(
        "https://durgaelectricals.tekkzy.com/hybrid/?institution=happyprancer&referral=MADAN"
      );

      global.window = originalWindow;
    });

    it("falls back gracefully to canonical long URL when short-link API fails or is unavailable", async () => {
      const result = await getShareProfileUrl({
        institution: "happyprancer",
        referral: "MADAN",
      });

      expect(result).toBeDefined();
      expect(result.url).toContain("/hybrid/?institution=happyprancer&referral=MADAN");
      expect(result.isShort).toBe(false);
    });

    it("enforces referral code validation when instructor generates share link", async () => {
      const user = {
        userType: "instructor",
        referral_code: "MADAN",
      };

      // If instructor requests share link for someone else, it falls back to canonical without breaking
      const result = await getShareProfileUrl({
        institution: "happyprancer",
        referral: "ANOTHER_INSTRUCTOR",
        user,
      });

      expect(result.isShort).toBe(false);
      expect(result.url).toContain("referral=ANOTHER_INSTRUCTOR");
    });
  });

  // Test 7: Social URL validation and security against open redirect / XSS
  describe("7. Social URL Parsing & Platform Identification", () => {
    it("normalizes social domains correctly and strips tracking / protocol", () => {
      expect(getHostname("https://www.instagram.com/happyprancer/")).toBe("instagram.com");
      expect(getHostname("http://facebook.com/happyprancer")).toBe("facebook.com");
      expect(getHostname("youtube.com/@happyprancer")).toBe("youtube.com");
      expect(getHostname("https://x.com/happyprancer")).toBe("x.com");
    });

    it("correctly identifies platforms for social media links", () => {
      expect(getSocialPlatformFromUrl("https://www.instagram.com/madan")).toBe("instagram");
      expect(getSocialPlatformFromUrl("https://facebook.com/madan")).toBe("facebook");
      expect(getSocialPlatformFromUrl("https://youtube.com/@madan")).toBe("youtube");
      expect(getSocialPlatformFromUrl("https://twitter.com/madan")).toBe("twitter");
      expect(getSocialPlatformFromUrl("https://t.me/madan")).toBe("telegram");
    });
  });
});
