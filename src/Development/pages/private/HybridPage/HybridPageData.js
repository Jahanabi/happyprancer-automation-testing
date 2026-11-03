import fitnessVideo from "../../../../assets/video.mp4";
import romaImg from "../../../../assets/roma.png";
import oneImg from "../../../../assets/one.png";
import twoImg from "../../../../assets/two.png";
import threeImg from "../../../../assets/three.png";
import fourImg from "../../../../assets/four.png";
import mailIcon from "../../../../assets/maail.png";
import rightIcon from "../../../../assets/right.png";
import lastIcon from "../../../../assets/last.png";
import zumbaImg from "../../../../assets/zumba.png";
import yogaImg from "../../../../assets/yoga.png";

// Neutral default schema for production multi-instructor environments.
// Contains zero instructor-specific demo data, fake names, or demo media.
export const DefaultPageSchema = {
  globalPrimaryColor: "#215A55",

  hero: {
    name: "",
    title: "",
    description: "",
    image: "",
    imageAdjust: { x: 0, y: 0, zoom: 1 },
    video: "",
    videoAdjust: { x: 0, y: 0, zoom: 1 },
    actionChips: [
      { id: "chip_1", label: "Learn Zumba", link: "#services-section" },
      { id: "chip_2", label: "Personal Training", link: "#services-section" },
    ],
  },

  story: {
    title: "Training Philosophy & Background",
    introParagraph: "",
    quote: "Every session is designed to transform your body and uplift your mind.",
    secondParagraph:
      "Through HappyPrancer's hybrid platform, you get the flexibility to fit workouts seamlessly around your schedule without sacrificing personalized guidance, accountability, or community support.",
    features: [
      {
        id: "feat_1",
        title: "Certified Instruction",
        description: "Safe progression, proper form, and tailored modifications.",
        icon: "award",
      },
      {
        id: "feat_2",
        title: "Flexible Hybrid Schedule",
        description: "Attend live in-studio or join online seamlessly.",
        icon: "clock",
      },
    ],
    overview: {
      students: "",
      rating: "",
      classes: "",
      studio: "",
      schedule: "",
      format: "In-Person Studio Classes & Live Online Stream",
      specialOffer:
        "Your first month is 100% free on all hybrid subscription tiers.",
    },
  },

  features: {
    primaryColor: "#215A55",
    stats: {
      students: "",
      rating: "",
      classes: "",
    },
    testimonial: {
      image: "",
      imageAdjust: { x: 0, y: 0, zoom: 1 },
      text: "",
      author: "",
      role: "",
    },
  },

  whyHybrid: {
    instructorName: "",
    headerTitle: "Why Go Hybrid",
    headerSubtitle: "",
    address: "",
    philosophyLabel: "01 — 04 • PHILOSOPHY & PRACTICE",
    cards: [],
    steps: [],
  },

  plans: {
    heading: "Our Fitness Plans",
    description: "Choose the perfect plan for your fitness journey.",
    cards: [],
  },

  transform: {
    heading: "Ready to Transform?",
    desc: "",
    button: "Join With Special Invitation",
    primaryColor: "#215A55",
    location: "",
    classTime: "",
  },

  testimonials: [],
  classes: [],
  hybridProducts: [],

  socialMedia: {
    instagram: "",
    facebook: "",
    youtube: "",
    twitter: "",
    telegram: "",
  },
};

// Legitimate Beta seed / demo dataset preserved strictly for Beta testing and verification.
// Must never be used as a Production fallback for real instructors.
export const BetaSeedPageData = {
  globalPrimaryColor: "#215A55",

  hero: {
    name: "Pk",
    title: "Personal Trainer & Fitness Coach",
    description:
      "Experience transformative fitness classes that adapt to your lifestyle—online or in-person.",
    video: fitnessVideo,
    videoAdjust: { x: 0, y: 0, zoom: 1 },
    actionChips: [
      { id: "chip_1", label: "Learn Zumba", link: "#services-section" },
      { id: "chip_2", label: "Personal Training", link: "#services-section" },
    ],
  },

  story: {
    title: "Training Philosophy & Background",
    introParagraph:
      "Hi, I'm Pk. My mission as a fitness coach is to make sustainable, high-energy training accessible to everyone, whether you train with me in our local studio or stream sessions from your home.",
    quote: "Every session is designed to transform your body and uplift your mind.",
    secondParagraph:
      "Through HappyPrancer's hybrid platform, you get the flexibility to fit workouts seamlessly around your schedule without sacrificing personalized guidance, accountability, or community support.",
    features: [
      {
        id: "feat_1",
        title: "Certified Instruction",
        description: "Safe progression, proper form, and tailored modifications.",
        icon: "award",
      },
      {
        id: "feat_2",
        title: "Flexible Hybrid Schedule",
        description: "Attend live in-studio or join online seamlessly.",
        icon: "clock",
      },
    ],
    overview: {
      students: "500+",
      rating: "4.9",
      classes: "50+",
      studio: "Ambassador of dance, Farmington hill, Michigan",
      schedule: "Monday - Friday: 6:00 PM - 7:00 PM",
      format: "In-Person Studio Classes & Live Online Stream",
      specialOffer:
        "Your first month is 100% free on all hybrid subscription tiers.",
    },
  },

  features: {
    primaryColor: "#215A55",
    stats: {
      students: "500+",
      rating: "4.9",
      classes: "50+",
    },
    testimonial: {
      image: romaImg,
      imageAdjust: { x: 0, y: 0, zoom: 1 },
      text:
        "Every session is designed to transform your body and uplift your mind.",
      author: "Roma Martinez",
      role: "Fitness Coach",
    },
  },

  whyHybrid: {
    instructorName: "Roma",
    headerSubtitle: "Roma has reserved a special offer for you",
    address: "Ambassador of dance, Farmington hill, Michigan",
    philosophyLabel: "01 — 04 • PHILOSOPHY & PRACTICE",
    cards: [
      {
        id: 1,
        image: oneImg,
        imageAdjust: { x: 0, y: 0, zoom: 1 },
        title: "Transform Your Body",
        description: "Join our exclusive fitness program",
        gradient: "from-gray-900/60 to-transparent",
      },
      {
        id: 2,
        image: twoImg,
        imageAdjust: { x: 0, y: 0, zoom: 1 },
        title: "Expert Guidance",
        description: "Learn from the best trainers",
        gradient: "from-purple-900/40 to-transparent",
      },
      {
        id: 3,
        image: threeImg,
        imageAdjust: { x: 0, y: 0, zoom: 1 },
        title: "You're Invited",
        description: "Roma personally selected you to join her fitness community",
        gradient: "from-green-900/50 to-transparent",
      },
      {
        id: 4,
        image: fourImg,
        imageAdjust: { x: 0, y: 0, zoom: 1 },
        title: "You're Invited",
        description: "Roma personally selected you to join her fitness community",
        gradient: "from-blue-900/50 to-transparent",
      },
    ],
    steps: [
      {
        icon: mailIcon,
        title: "You're Invited",
        desc: "Roma personally selected you to join her fitness community",
      },
      {
        icon: rightIcon,
        title: "Reserve Now",
        desc: "Reserve your place and start your journey",
      },
      {
        icon: lastIcon,
        title: "Start Training",
        desc: "Begin your transformation journey",
      },
    ],
  },

  plans: {
    heading: "Our Fitness Plans",
    description: "Choose the perfect plan for your fitness journey.",
    cards: [
      {
        id: 1,
        title: "Learn Zumba",
        baseAmount: 40,
        baseCurrency: "USD",
        price: "$40/month",
        durationText: "month",
        description: "Fun and energetic Zumba classes designed for all levels.",
        features: [
          "Unlimited online sessions",
          "Weekly live classes",
          "Community support",
        ],
        button: "Join Now",
        image: zumbaImg,
        visible: true,
      },
      {
        id: 2,
        title: "Personal Training",
        baseAmount: 400,
        baseCurrency: "USD",
        price: "$400/month",
        durationText: "month",
        description: "One-on-one training with expert instructors.",
        features: ["Custom plans", "Progress tracking", "Nutrition guidance"],
        button: "Join Now",
        image: yogaImg,
        visible: true,
      },
    ],
  },

  transform: {
    heading: "Ready to Transform?",
    desc: "Join Pk's community and unlock your potential with hybrid fitness.",
    button: "Claim Your Free Session",
    primaryColor: "#215A55",
    location: "Ambassador of dance, Farmington hill, Michigan",
    classTime: "Monday - Friday: 6:00 PM - 7:00 PM",
  },

  testimonials: [
    {
      id: 1,
      description:
        "Online training provides a great alternative to traditional gyms, especially for beginners. Dance makes workouts fun and expressive, and HappyPrancers delivers an outstanding experience with skilled, motivating trainers. Suitable for all levels, it's been a fantastic journey—thank you, HappyPrancers!",
      image:
        "https://institution-utils.s3.amazonaws.com/happyprancer/images/Testimonial/2.png",
      imageAdjust: { x: 0, y: 0, zoom: 1 },
      name: "Bapuji Mallik",
      rating: 4,
    },
    {
      id: 2,
      description:
        "Joining in this Live session, I have learnt to spend time with myself and relieve my stress in a fraction of minute. Delighted to be a part of this class and the community that supports growth and wellness.",
      image:
        "https://institution-utils.s3.amazonaws.com/happyprancer/images/Testimonial/3.jpg",
      imageAdjust: { x: 0, y: 0, zoom: 1 },
      name: "Priyanka Biswal",
      rating: 4.5,
    },
    {
      id: 3,
      description:
        "The personalized approach and attention to detail in every session has transformed not just my fitness routine, but my entire lifestyle. The instructors are knowledgeable, patient, and truly care about each student's progress.",
      image:
        "https://institution-utils.s3.amazonaws.com/happyprancer/images/Testimonial/1.png",
      imageAdjust: { x: 0, y: 0, zoom: 1 },
      name: "Monalisha Sahoo",
      rating: 5,
    },
    {
      id: 4,
      description:
        "HappyPrancer Community offers a very motivating online Zumba class.  I enjoyed dancing to the wonderful music.",
      image:
        "https://institution-utils.s3.us-east-1.amazonaws.com/public/Testimonials/Sanghamitra_testimonial.jpeg",
      imageAdjust: { x: 0, y: 0, zoom: 1 },
      name: "Sanghamitra",
      rating: 4.7,
    },
    {
      id: 5,
      description:
        "Joining yoga classes at HappyPrancer has been one of the best decisions I’ve made. The sessions are refreshing, the instructors are incredibly supportive, and I feel more energetic and balanced every day. It’s truly a wonderful community to grow both physically and mentally.",
      image:
        "https://institution-utils.s3.us-east-1.amazonaws.com/happyprancer/images/Testimonial/siba-testimonial.png",
      imageAdjust: { x: 0, y: 0, zoom: 1 },
      name: "Sibananda",
      rating: 5,
    },
    {
      id: 6,
      description:
        "I joined the 30 minute evening yoga sessions at HappyPrancer, and they’ve become a perfect way to unwind after work. Earlier, I used to feel mentally drained and physically tired by the end of the day, but these sessions help me relax, stretch and recharge. The trainers create a calm yet engaging atmosphere and I really appreciate the flexibility to join online or attend the hybrid classes whenever I can. It’s a simple routine that’s made a noticeable difference in how I end my day.",
      image: "",
      imageAdjust: { x: 0, y: 0, zoom: 1 },
      name: "Sai",
      rating: 4.3,
    },
    {
      id: 7,
      description:
        "One of the best platforms I've come across. HappyPrancer combines ease of use with excellent service, making the overall experience enjoyable. The attention to detail and commitment to user satisfaction really stand out. Highly recommended!",
      image: "",
      imageAdjust: { x: 0, y: 0, zoom: 1 },
      name: "Rahul Roy",
      rating: 5,
    },
  ],

  classes: [
    {
      id: "class_1",
      badge: "Premium Experience",
      name: "Premium Plan",
      description: "Hybrid session with live and on-demand access.",
      time: "Monday - Friday: 6:00 PM - 7:00 PM",
      image: zumbaImg,
      includedServices: ["Dance Classes"],
      recurringPrice: 1500,
      originalPrice: 1500,
      currency: "₹",
      billingPeriod: "monthly",
      offerBadge: "1st Month Free",
      offerSubtext: "Then ₹1,500.00/month from month 2 • Cancel anytime",
      buttonText: "Start Free Month",
      productId: "1",
    },
    {
      id: "class_2",
      badge: "Elite Experience",
      name: "Elite Plan",
      description: "Yoga • BWORKZ • Zumba • Bachata",
      time: "Monday - Friday: 6:00 PM - 7:00 PM",
      image: yogaImg,
      includedServices: ["Dance Classes", "Yoga", "BWORKZ", "Zumba", "Bachata"],
      recurringPrice: 2000,
      originalPrice: 2000,
      currency: "₹",
      billingPeriod: "monthly",
      offerBadge: "1st Month Free",
      offerSubtext: "Then ₹2,000.00/month from month 2 • Cancel anytime",
      buttonText: "Start Free Month",
      productId: "2",
    },
  ],

  socialMedia: {
    instagram: "",
    facebook: "",
    youtube: "",
    twitter: "",
    telegram: ""
  }
};

// Deprecated alias for backwards compatibility during transition
export const StaticPageData = BetaSeedPageData;
