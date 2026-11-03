import {
  getGalleryImageAlt,
  getFilenameFromUrl,
  GALLERY_IMAGE_DESCRIPTIONS,
} from "./galleryAltText";

describe("HP-031 Gallery Image Alt Text", () => {
  const reportedImages = [
    "WhatsApp Image 2024-03-10 at 11.38.54_f1c8a262.jpg",
    "WhatsApp Image 2024-04-19 at 20.57.20_5596620b.jpg",
    "bapuji.jpeg",
    "WhatsApp Image 2024-06-23 at 13.07.56.jpeg",
    "zumba pic 2.jpg",
    "WhatsApp Image 2024-03-10 at 11.38.56_a6c79a30.jpg",
    "WhatsApp Image 2024-03-10 at 11.38.54_e3fba30f.jpg",
    "WhatsApp Image 2024-04-19 at 20.57.20_a307ab07.jpg",
    "WhatsApp Image 2024-04-19 at 20.57.21_306fe128.jpg",
    "WhatsApp Image 2024-04-19 at 20.57.21_a208e065.jpg",
  ];

  test("all 10 reported images have specific visual descriptions defined", () => {
    expect(reportedImages.length).toBe(10);
    reportedImages.forEach((imgName) => {
      const desc = GALLERY_IMAGE_DESCRIPTIONS[imgName];
      expect(desc).toBeDefined();
      expect(typeof desc).toBe("string");
      expect(desc.trim().length).toBeGreaterThan(15);
      expect(desc.toLowerCase()).not.toBe("gallery");
      expect(desc.toLowerCase()).not.toBe("fitness");
      expect(desc.toLowerCase()).not.toBe("happyprancer class community moment");
    });
  });

  test("each description is unique and meaningful", () => {
    const descriptions = reportedImages.map((name) => GALLERY_IMAGE_DESCRIPTIONS[name]);
    const uniqueDescriptions = new Set(descriptions);
    expect(uniqueDescriptions.size).toBe(reportedImages.length);
  });

  test("getFilenameFromUrl parses URLs with query parameters and encoding", () => {
    const url = "https://s3.amazonaws.com/public/happyprancer/WhatsApp%20Image%202024-03-10%20at%2011.38.54_f1c8a262.jpg?versionId=123";
    expect(getFilenameFromUrl(url)).toBe("WhatsApp Image 2024-03-10 at 11.38.54_f1c8a262.jpg");
  });

  test("getGalleryImageAlt resolves exact visual description for full S3 URLs", () => {
    const fullUrl = "https://team-dev-testing.s3.us-east-2.amazonaws.com/public/happyprancer/bapuji.jpeg";
    const alt = getGalleryImageAlt(fullUrl);
    expect(alt).toBe("Instructor Bapuji in black athletic wear holding a low runner's lunge stretch outdoors");
  });

  test("getGalleryImageAlt prioritizes custom CMS metadata over boilerplate", () => {
    const fullUrl = "https://team-dev-testing.s3.us-east-2.amazonaws.com/public/happyprancer/custom_image.jpg";
    const customMeta = {
      title: "Weekend Workshop",
      description: "Members participating in our special weekend wellness workshop",
    };
    const alt = getGalleryImageAlt(fullUrl, customMeta);
    expect(alt).toBe("Weekend Workshop: Members participating in our special weekend wellness workshop");
  });

  test("getGalleryImageAlt ignores canned boilerplate CMS descriptions and uses curated descriptions", () => {
    const fullUrl = "https://team-dev-testing.s3.us-east-2.amazonaws.com/public/happyprancer/bapuji.jpeg";
    const boilerplateMeta = {
      title: "Bapuji",
      description: "Get ready to ditch the boring old workouts and join the dance party! We've taken the work out...",
    };
    const alt = getGalleryImageAlt(fullUrl, boilerplateMeta);
    // Should use the curated visual description rather than the canned boilerplate
    expect(alt).toBe("Instructor Bapuji in black athletic wear holding a low runner's lunge stretch outdoors");
  });

  test("fallback for uncatalogued photos is graceful and non-generic", () => {
    const alt = getGalleryImageAlt("https://example.com/unknown.jpg", null, 4);
    expect(alt).toBe("HappyPrancer community fitness photo 5");
    expect(alt.toLowerCase()).not.toBe("gallery");
  });
});
