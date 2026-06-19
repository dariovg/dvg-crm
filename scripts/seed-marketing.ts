// scripts/seed-marketing.ts
import { prisma } from "@/lib/prisma";

async function seedMarketingData() {
  console.log("🌱 Seeding marketing data...");

  try {
    // Create a campaign
    const campaign = await prisma.campaign.create({
      data: {
        name: "Summer 2024 Campaign",
        description: "Q3 social media marketing campaign",
        startDate: new Date("2024-06-01"),
        endDate: new Date("2024-08-31"),
        status: "ACTIVE",
      },
    });
    console.log("✓ Created campaign:", campaign.name);

    // Create sample posts
    const platforms = ["TWITTER", "INSTAGRAM", "TIKTOK", "LINKEDIN", "FACEBOOK"];
    const sampleContents = [
      "🚀 Excited to announce our new feature! #innovation #startup",
      "Check out how our customers are using our product 💡 #success #customer",
      "Behind the scenes of our product development 🛠️ #buildinginpublic",
      "Join us for a live demo tomorrow at 3 PM! #webinar #demo",
      "Team spotlight: Meet Sarah, our amazing designer 🎨 #teamwork",
    ];

    for (let i = 0; i < 12; i++) {
      const platform = platforms[i % platforms.length];
      const content =
        sampleContents[i % sampleContents.length] +
        ` (Post ${i + 1})`;

      const post = await prisma.socialPost.create({
        data: {
          platform: platform as any,
          content,
          campaignId: campaign.id,
          status: i % 3 === 0 ? "DRAFT" : i % 3 === 1 ? "PENDING_APPROVAL" : "PUBLISHED",
          likes: Math.floor(Math.random() * 1000),
          comments: Math.floor(Math.random() * 100),
          shares: Math.floor(Math.random() * 50),
          impressions: Math.floor(Math.random() * 10000),
          publishedAt: i % 3 === 2 ? new Date() : null,
        },
      });

      console.log(`✓ Created post on ${platform}: "${content.substring(0, 50)}..."`);
    }

    console.log("\n✅ Marketing data seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding data:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedMarketingData();
