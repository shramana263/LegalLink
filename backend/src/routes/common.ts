import { Router } from "express";
import prisma from "../../prisma/PrismaClient";
import { getUser } from "../middlewares/getUser";
import { getAdvocate } from "../middlewares/isAdvocate";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Common
 *   description: Operations related to advocates and their ratings
 */

/**
 * @swagger
 * /api/get-advocate/{advocate_id}:
 *   get:
 *     tags: [Common]
 *     summary: Retrieve a specific advocate by ID
 *     description: Get details of a particular advocate, including their profile photo.
 *     parameters:
 *       - in: path
 *         name: advocate_id
 *         required: true
 *         description: The ID of the advocate you want to retrieve.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Advocate details retrieved successfully.
 */

router.get("/get-advocate/:advocate_id", async (req, res) => {
  try {
    const advocate_id = req.params.advocate_id;

    if (!advocate_id) {
      return res.status(400).json({ error: "Advocate ID is required" });
    }

    const _advocate = await prisma.advocates.findUnique({
      where: { advocate_id },
      include: {
        user: {
          omit: {
            userType: true,
            updatedAt: true,
            createdAt: true,
          },
        },
      },
    });

    const advocate = {
      ..._advocate,
      name: _advocate.user.name,
    };

    if (!advocate) {
      return res.status(404).json({ error: "Advocate not found" });
    }

    return res.status(200).json(advocate);
  } catch (err) {
    console.error("Error fetching advocate:", err);
    return res
      .status(500)
      .json({ error: "An error occurred while fetching the advocate" });
  }
});

/**
 * @swagger
 * /api/advocate/location-search:
 *   post:
 *     summary: Search advocates by location city or jurisdiction state
 *     tags:
 *       - Advocate
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - location_city
 *               - state_name
 *             properties:
 *               location_city:
 *                 type: string
 *               state_name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Advocates matching location criteria
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       400:
 *         description: location_city and state_name are required
 *       500:
 *         description: Internal Server Error
 */

// TODO: Can be imporved with better search logic
// like take user's geo location and get their city and surrounding states
router.post("/advocate/location-search", async (req, res) => {
  const { location_city, state_name } = req.body;

  if (!location_city || !state_name) {
    return res
      .status(400)
      .json({ error: "location_city and state_name are required" });
  }

  try {
    const advocates = await prisma.advocates.findMany({
      where: {
        is_verified: true,
        OR: [
          { location_city: location_city },
          { jurisdiction_states: { has: state_name } },
        ],
      },
      select: {
        user: { select: { name: true, image: true } },
        advocate_id: true,
        registration_number: true,
        location_city: true,
        jurisdiction_states: true,
        experience_years: true,
        language_preferences: true,
      },
    });

    // Optional: Prioritize sorting (city match first, then state)
    const sorted = advocates.sort((a, b) => {
      const aScore =
        a.location_city === location_city
          ? 2
          : a.jurisdiction_states.includes(state_name)
          ? 1
          : 0;

      const bScore =
        b.location_city === location_city
          ? 2
          : b.jurisdiction_states.includes(state_name)
          ? 1
          : 0;

      return bScore - aScore;
    });

    res.status(200).json(sorted);
  } catch (error) {
    console.error("Location search error:", error);
    res
      .status(500)
      .json({ error: "Server Error", details: (error as Error).message });
  }
});

const reportCategories = [
  "FRAUD",
  "MISCONDUCT",
  "FAKE_PROFILE",
  "ABUSE",
  "OTHER",
];

/**
 * @swagger
 * /api/advocate/report:
 *   post:
 *     summary: Report an advocate for a violation
 *     tags:
 *       - Advocate
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - advocate_id
 *               - reason
 *               - category
 *             properties:
 *               advocate_id:
 *                 type: string
 *               reason:
 *                 type: string
 *               details:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [FRAUD, MISCONDUCT, FAKE_PROFILE, ABUSE, OTHER]
 *     responses:
 *       201:
 *         description: Report submitted successfully
 *       400:
 *         description: Missing required fields or already reported
 *       404:
 *         description: Advocate not found
 *       500:
 *         description: Internal Server Error
 */
router.post("/advocate/report", getUser, async (req, res) => {
  const { advocate_id, reason, details, category: _c } = req.body;
  const reporter_user_id = res.locals.user?.id;

  if (!reporter_user_id || !advocate_id || !reason || !_c) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const category = _c.toUpperCase();

  if (!reportCategories.includes(category)) {
    return res.status(400).json({ error: "Invalid report category" });
  }

  try {
    const isAdvocate = await prisma.advocates.findUnique({
      where: { advocate_id },
    });

    if (!isAdvocate) {
      return res.status(404).json({ error: "Advocate not found" });
    }

    // Check if the user has already reported this advocate
    const existingReport = await prisma.advocate_reports.findFirst({
      where: {
        advocate_id,
        reporter_user_id,
      },
    });

    if (existingReport) {
      return res
        .status(400)
        .json({ error: "You have already reported this advocate" });
    }

    // 1. Create the report
    await prisma.advocate_reports.create({
      data: {
        advocate_id,
        reporter_user_id,
        reason,
        details,
        category,
      },
    });

    // 2. Count total reports for this advocate
    const totalReports = await prisma.advocate_reports.count({
      where: {
        advocate_id,
      },
    });

    // 3. If 15 or more reports, mark as unverified (until admin review)
    if (totalReports >= 15) {
      await prisma.advocates.update({
        where: { advocate_id },
        data: {
          is_verified: false,
          verification_status: "suspended_by_reports",
        },
      });
    }

    return res.status(201).json({
      status: true,
      message: "Report submitted for review.",
    });
  } catch (error) {
    console.error("Report Error:", error);
    return res
      .status(500)
      .json({ error: "Server Error", details: (error as Error).message });
  }
});

/**
 * @swagger
 * /api/advocate/cases/{advocate_id}:
 *   get:
 *     summary: Get all cases for a specific advocate
 *     tags:
 *       - Advocate Cases
 *     parameters:
 *       - in: path
 *         name: advocate_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the advocate whose cases to fetch
 *     responses:
 *       200:
 *         description: List of cases
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       500:
 *         description: Server error
 */
router.get("/advocate/cases/:advocate_id", async (req, res) => {
  const advocate_id = req.params.advocate_id;

  try {
    const cases = await prisma.advocate_cases.findMany({
      where: { advocate_id },
      orderBy: { year: "desc" },
    });

    return res.json(cases);
  } catch (error) {
    console.error("Error fetching cases:", error);
    return res
      .status(500)
      .json({ error: "Server Error", details: (error as Error).message });
  }
});

/**
 * @swagger
 * /api/advocate/case/{case_id}:
 *   get:
 *     summary: Get a specific case for an advocate
 *     tags:
 *       - Advocate Cases
 *     parameters:
 *       - in: path
 *         name: case_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the case to fetch
 *     responses:
 *       200:
 *         description: Details of the case
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       500:
 *         description: Server error
 */
router.get("/advocate/case/:case_id", async (req, res) => {
  const case_id = req.params.case_id;

  try {
    const advocateCase = await prisma.advocate_cases.findUnique({
      where: { case_id },
    });

    return res.json(advocateCase);
  } catch (error) {
    console.error("Error fetching cases:", error);
    return res
      .status(500)
      .json({ error: "Server Error", details: (error as Error).message });
  }
});

/**
 * @swagger
 * /api/advocate/case:
 *   delete:
 *     summary: Delete a case by ID
 *     tags:
 *       - Advocate Cases
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: body
 *         name: case_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Case deleted
 *       500:
 *         description: Delete failed
 */
router.delete("/advocate/case", getAdvocate, async (req, res) => {
  const case_id = req.body.case_id;
  const advocate_id = res.locals.advocate.advocate_id;

  try {
    await prisma.advocate_cases.delete({
      where: { advocate_id, case_id },
    });

    return res.json({ status: true, message: "Case deleted successfully" });
  } catch (error) {
    console.error("Error fetching cases:", error);
    return res
      .status(500)
      .json({ error: "Server Error", details: (error as Error).message });
  }
});

export default router;
