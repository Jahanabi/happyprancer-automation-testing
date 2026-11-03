/**
 * galleryAltText.js
 *
 * Implements HP-031: Accurate, image-specific gallery alt text.
 * Replaces generic repeated alt text ("Gallery", "fitness", "HappyPrancer class community moment")
 * with concise, unique, and verified descriptions of meaningful visual content.
 *
 * Supports CMS/admin metadata prioritization when custom descriptions are edited.
 */

export const GALLERY_IMAGE_DESCRIPTIONS = {
  // Photo 1: Male dance performer on stage
  "WhatsApp Image 2024-03-10 at 11.38.54_f1c8a262.jpg":
    "Dance instructor Anupam standing on stage during a performance in a black vest and jeans",

  // Photo 2: Three participants doing synchronized dab/dance pose outdoors
  "WhatsApp Image 2024-04-19 at 20.57.20_5596620b.jpg":
    "Three participants performing an energetic synchronized Zumba dance fitness move outdoors",

  // Photo 3: Instructor Bapuji low runner's lunge stretch outdoors
  "bapuji.jpeg":
    "Instructor Bapuji in black athletic wear holding a low runner's lunge stretch outdoors",

  // Photo 4: Group celebrating outdoors with arms raised
  "WhatsApp Image 2024-06-23 at 13.07.56.jpeg":
    "Four participants celebrating with arms raised outdoors during a Bollywood dance fitness session",

  // Photo 5: Three participants arms crossed in front of garden foliage
  "zumba pic 2.jpg":
    "Three fitness participants smiling with arms crossed outdoors in front of garden greenery",

  // Photo 6: Close-up portrait of instructor Anupam with BWORKZ wristbands
  "WhatsApp Image 2024-03-10 at 11.38.56_a6c79a30.jpg":
    "Portrait of fitness instructor Anupam wearing BWORKZ wristbands and looking thoughtfully to the side",

  // Photo 7: Group studio dance fitness flex pose with kneeling instructor
  "WhatsApp Image 2024-03-10 at 11.38.54_e3fba30f.jpg":
    "Dance fitness instructor and participants striking a group flexing pose inside a studio",

  // Photo 8: Synchronized outdoor routine pose variation
  "WhatsApp Image 2024-04-19 at 20.57.20_a307ab07.jpg":
    "Three participants demonstrating an energetic diagonal dance routine outdoors",

  // Photo 9: Side-angle outdoors arms-crossed pose
  "WhatsApp Image 2024-04-19 at 20.57.21_306fe128.jpg":
    "Three fitness participants standing side by side with arms crossed outdoors",

  // Photo 10: Front-facing outdoors smiling group pose
  "WhatsApp Image 2024-04-19 at 20.57.21_a208e065.jpg":
    "Three smiling fitness participants posing together outdoors in athletic attire",

  // Additional gallery and legacy assets in S3
  "Gal-2.e525a94c013c48448a69.jpg":
    "Taekwondo team members holding the team championship trophy at a tournament",
  "Gal-5.c767bda14a8363c8bfe4.jpg":
    "Martial arts team and coaches celebrating on stage around a championship trophy",
  "3984.jpg":
    "Dance team of six in matching white tops and black caps lined up in formation",
  "Instructor.jpg":
    "Fitness instructor smiling in activewear portrait"
};

/**
 * Extracts a clean filename from a media URL.
 * Handles URL encoding, query strings, and path separators.
 */
export const getFilenameFromUrl = (url) => {
  if (!url || typeof url !== "string") return "";
  try {
    const withoutQuery = url.split("?")[0];
    const rawFilename = withoutQuery.split("/").pop();
    return decodeURIComponent(rawFilename);
  } catch {
    return url.split("/").pop() || "";
  }
};

/**
 * Resolves the accurate alt text for a gallery image.
 *
 * @param {string} url - The image URL
 * @param {object} [metadata] - Optional CMS metadata ({ title, description })
 * @param {number} [index] - Optional item index for fallback disambiguation
 * @returns {string} Image-specific descriptive alt text
 */
export const getGalleryImageAlt = (url, metadata = null, index = 0) => {
  if (!url) return "HappyPrancer gallery photo";

  const filename = getFilenameFromUrl(url);

  // 1. Check exact filename match in verified visual descriptions
  if (filename && GALLERY_IMAGE_DESCRIPTIONS[filename]) {
    return GALLERY_IMAGE_DESCRIPTIONS[filename];
  }

  // 2. Check partial/encoded key match
  for (const [key, desc] of Object.entries(GALLERY_IMAGE_DESCRIPTIONS)) {
    if (filename && (filename.includes(key) || key.includes(filename))) {
      return desc;
    }
  }

  // 3. If CMS title and custom description are provided
  if (metadata) {
    const title = metadata.title?.trim();
    const desc = metadata.description?.trim();
    // Verify description is not the generic canned boilerplate
    const isBoilerplate = desc && (
      desc.includes("mission to make fitness fun") ||
      desc.includes("ditch the boring old workouts")
    );

    if (desc && !isBoilerplate) {
      return title ? `${title}: ${desc}` : desc;
    }
    if (title) {
      return `${title} fitness session photo`;
    }
  }

  // 4. Safe fallback for newly uploaded or uncatalogued photos
  return `HappyPrancer community fitness photo ${index + 1}`;
};

export default getGalleryImageAlt;
