const { PrismaClient } = require('../../generated/prisma');
const prisma = new PrismaClient();

// Advocate IDs to use for the posts
const advocateIds = [
  '0564a65f-b1d3-41c9-88c4-f3c445815600',
  '0e6dadf7-2bc3-4b22-8cf7-6a8df272da82',
  '14f3d691-62f0-4a0f-85c7-c952b161fbc3',
  '4549ac4b-f09f-4d7d-a850-5d1b79b39deb',
  '7402f0d7-7a83-453e-9120-12ded9d4311d'
];

// Map custom categories to schema Specialization enum values
function mapCategory(category) {
  const categoryMap = {
    'PROPERTY_LAW': 'CIVIL',
    'CRIMINAL_LAW': 'CRIMINAL',
    'FAMILY_LAW': 'FAMILY',
    'CORPORATE_LAW': 'CORPORATE',
    'LABOUR_LAW': 'LABOR',
    'IP_LAW': 'INTELLECTUAL_PROPERTY',
    'CIVIL_LAW': 'CIVIL',
    'CONSUMER_LAW': 'CIVIL',
    'WOMEN_RIGHTS': 'HUMAN_RIGHTS'
  };
  
  return categoryMap[category] || 'OTHER';
}

async function seedPosts() {
  try {
    console.log('Starting to seed advocate posts...');
    
    // Prepare post data
    const posts = [
      {
        post_id: "6a4e0512-34b1-4c6f-9a1b-2c5d89e3f001",
        advocate_id: advocateIds[0],
        text: "Understanding the difference between 'ownership' and 'possession' in Property Law is crucial for clients facing eviction cases.",
        image_url: null,
        category: "CIVIL",
        created_at: new Date("2025-06-20T10:00:00Z"),
      },
      {
        post_id: "6a4e0512-34b1-4c6f-9a1b-2c5d89e3f002",
        advocate_id: advocateIds[1],
        text: "📌 Supreme Court's latest judgment on Section 138 of the Negotiable Instruments Act changes how cheque bounce cases will be handled.",
        image_url: "https://example.com/images/sc_cheque_ruling.jpg",
        category: "CRIMINAL",
        created_at: new Date("2025-06-19T08:30:00Z"),
      },
      {
        post_id: "6a4e0512-34b1-4c6f-9a1b-2c5d89e3f003",
        advocate_id: advocateIds[2],
        text: "Here's a visual explainer of how to file for divorce under mutual consent in India. #FamilyLaw #StepByStep",
        image_url: "https://example.com/images/divorce_guide.png",
        category: "FAMILY",
        created_at: new Date("2025-06-21T13:15:00Z"),
      },
      {
        post_id: "6a4e0512-34b1-4c6f-9a1b-2c5d89e3f004",
        advocate_id: advocateIds[3],
        text: "🧠 A deep dive into data protection clauses in tech startup contracts. Are Indian laws keeping up?",
        image_url: null,
        category: "CORPORATE",
        created_at: new Date("2025-06-18T17:45:00Z"),
      },
      {
        post_id: "6a4e0512-34b1-4c6f-9a1b-2c5d89e3f005",
        advocate_id: advocateIds[4],
        text: "Labour courts now have stricter timelines to handle wage delay petitions. Great news for factory workers!",
        image_url: null,
        category: "LABOR",
        created_at: new Date("2025-06-20T09:00:00Z"),
      },
      {
        post_id: "6a4e0512-34b1-4c6f-9a1b-2c5d89e3f006",
        advocate_id: advocateIds[0],
        text: "Should live-in relationships have legal protection under Indian family law? Here's a quick poll and perspective.",
        image_url: null,
        category: "FAMILY",
        created_at: new Date("2025-06-19T11:10:00Z"),
      },
      {
        post_id: "6a4e0512-34b1-4c6f-9a1b-2c5d89e3f007",
        advocate_id: advocateIds[1],
        text: "⚖️ IP Law Update: Supreme Court upholds stricter patent filing timelines. Here's what startups need to know.",
        image_url: "https://example.com/images/patent_case_chart.jpg",
        category: "INTELLECTUAL_PROPERTY",
        created_at: new Date("2025-06-17T14:25:00Z"),
      },
      {
        post_id: "6a4e0512-34b1-4c6f-9a1b-2c5d89e3f008",
        advocate_id: advocateIds[2],
        text: "Are district court delays a violation of Article 21's right to speedy trial? My take on recent High Court commentary.",
        image_url: null,
        category: "CIVIL",
        created_at: new Date("2025-06-22T10:05:00Z"),
      },
      {
        post_id: "6a4e0512-34b1-4c6f-9a1b-2c5d89e3f009",
        advocate_id: advocateIds[3],
        text: "📄 Sample format for filing a consumer complaint under the Consumer Protection Act. Use this as a reference!",
        image_url: "https://example.com/images/consumer_format.pdf",
        category: "CIVIL",
        created_at: new Date("2025-06-20T12:40:00Z"),
      },
      {
        post_id: "6a4e0512-34b1-4c6f-9a1b-2c5d89e3f010",
        advocate_id: advocateIds[4],
        text: "Big win for gender rights: High Court rules in favor of workplace maternity benefits in unorganized sectors.",
        image_url: null,
        category: "HUMAN_RIGHTS",
        created_at: new Date("2025-06-19T16:30:00Z"),
      },
      {
        post_id: "6a4e0512-34b1-4c6f-9a1b-2c5d89e3f011",
        advocate_id: advocateIds[0],
        text: "🏛️ Weekly Court Wrap: Key decisions from Supreme Court and High Courts that every litigator should track.",
        image_url: "https://example.com/images/court_updates.jpg",
        category: "OTHER",
        created_at: new Date("2025-06-21T18:20:00Z"),
      },
      {
        post_id: "6a4e0512-34b1-4c6f-9a1b-2c5d89e3f012",
        advocate_id: advocateIds[1],
        text: "Legal Tip 💡: Never sign a property sale deed without verifying the encumbrance certificate. Here's why:",
        image_url: null,
        category: "CIVIL",
        created_at: new Date("2025-06-20T07:00:00Z"),
      }
    ];

    // Delete existing data first
    await prisma.advocate_posts.deleteMany({});
    
    // Insert posts one by one to handle potential errors better
    for (const post of posts) {
      await prisma.advocate_posts.create({
        data: post
      });
    }
    
    console.log(`Successfully seeded ${posts.length} advocate posts`);
  } catch (error) {
    console.error('Error seeding advocate posts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute if this script is run directly
if (require.main === module) {
  seedPosts()
    .then(() => console.log('Seeding completed'))
    .catch(e => console.error('Seeding failed:', e));
}

module.exports = { seedPosts };