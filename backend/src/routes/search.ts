import { Router } from "express";
import prisma from "../../prisma/PrismaClient";

const router = Router();

/**
 * @swagger
 * /api/search/advocate:
 *   post:
 *     summary: Search verified advocates based on multiple filters
 *     tags:
 *       - Advocate
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               location_city:
 *                 type: string
 *               jurisdiction_states:
 *                 type: array
 *                 items:
 *                   type: string
 *               specialization:
 *                 type: string
 *               availability_status:
 *                 type: boolean
 *               language_preferences:
 *                 type: array
 *                 items:
 *                   type: string
 *               experience_level:
 *                 type: string
 *                 enum: [Junior, MidLevel, Senior]
 *               name:
 *                 type: string
 *               fee_type:
 *                 type: string
 *                 default: Consultation
 *                 enum: [Consultation, PreAppearance, FixedCase]
 *               max_fee:
 *                 type: number
 *               min_rating:
 *                 type: number
 *               sort_by:
 *                 type: string
 *                 enum: [rating, experience]
 *               sort_order:
 *                 type: string
 *                 enum: [asc, desc]
 *     responses:
 *       200:
 *         description: List of advocates
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.post("/advocate", async (req, res) => {
  const {
    location_city,
    jurisdiction_states,
    specialization,
    availability_status,
    language_preferences,
    experience_level,
    fee_type = "Consultation",
    max_fee,
    min_rating,
    name,
    sort_by,
    sort_order = "asc",
  } = req.body;

  try {
    const where: any = {
      is_verified: true,
    };

    if (location_city) {
      where.location_city = location_city;
    }

    if (availability_status !== undefined) {
      where.availability_status = availability_status;
    }

    if (experience_level) {
      where.experience_years = experience_level;
    }

    if (language_preferences?.length) {
      where.language_preferences = {
        hasSome: language_preferences,
      };
    }

    if (jurisdiction_states?.length) {
      where.jurisdiction_states = {
        hasSome: jurisdiction_states,
      };
    }

    if (specialization) {
      where.specializations = {
        some: {
          specialization: specialization,
        },
      };
    }

    if (name) {
      where.user = {
        name: {
          contains: name,
          mode: "insensitive",
        },
      };
    }

    if (max_fee !== undefined && fee_type) {
      where.fee_structure = {
        path: [fee_type],
        lt: max_fee,
      };
    }

    where.is_verified = true;

    const advocates = await prisma.advocates.findMany({
      where,
      select: {
        contact_email: true,
        user: { select: { name: true, image: true } },
        registration_number: true,
        location_city: true,
        jurisdiction_states: true,
        experience_years: true,
        language_preferences: true,
        availability_status: true,
        fee_structure: true,
        advocate_id: true,
        phone_number: true,
        qualification: true,
        reference_number: true,
        userId: true,

        specializations: { select: { specialization: true } },
        ratings: { select: { stars: true } },
      },
    });

    const advocatesFormated = advocates
      .map(adv => {
        const total = adv.ratings.reduce((sum, r) => sum + r.stars, 0);
        const average_rating = adv.ratings.length
          ? total / adv.ratings.length
          : 0;

        const total_ratings = adv.ratings.length;

        delete adv.ratings;

        const user = { ...adv.user };

        delete adv.user;

        //@ts-ignore
        adv.specializations = adv.specializations.map(s => s.specialization);

        return {
          ...adv,
          total_ratings,
          ...user,
          average_rating: parseFloat(average_rating.toFixed(1)),
        };
      })
      .filter(adv =>
        min_rating !== undefined ? adv.average_rating >= min_rating : true,
      );

    const sorted = [...advocatesFormated].sort((a, b) => {
      if (!sort_by) return 0;

      let aVal: number = 0;
      let bVal: number = 0;

      switch (sort_by) {
        // case "fee":
        //   aVal = a.fee_structure?.[fee_type] ?? Infinity;
        //   bVal = b.fee_structure?.[fee_type] ?? Infinity;
        //   break;
        case "rating":
          aVal = a.average_rating;
          bVal = b.average_rating;
          break;
        case "experience":
          const levelMap = { Junior: 1, MidLevel: 2, Senior: 3 };
          aVal = levelMap[a.experience_years as keyof typeof levelMap] || 0;
          bVal = levelMap[b.experience_years as keyof typeof levelMap] || 0;
          break;
      }

      return sort_order === "asc" ? aVal - bVal : bVal - aVal;
    });

    return res.status(200).json(sorted);
  } catch (error) {
    console.error("Search error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      details: (error as Error).message,
    });
  }
});

export default router;
