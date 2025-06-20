import { Router } from "express";
import prisma from "../../prisma/PrismaClient";
import { getUser } from "../middlewares/getUser";

const router = Router();

/**
 * @swagger
 * /api/add-rating/{advocate_id}:
 *   post:
 *     tags: [Common]
 *     summary: Add a rating and feedback for an advocate
 *     description: Allows a authenticated user to rate and provide feedback for an advocate.
 *     parameters:
 *       - in: path
 *         name: advocate_id
 *         required: true
 *         description: The ID of the advocate to rate.
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       description: Rating details.
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               stars:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating score from 1 to 5
 *               feedback:
 *                 type: string
 *                 maxLength: 500
 *                 description: Optional feedback about the advocate
 *     responses:
 *       201:
 *         description: Rating added successfully.
 *     security:
 *       - bearerAuth: []
 */
router.post("/add-rating/:advocate_id", getUser, async (req, res) => {
  try {
    const { stars, feedback } = req.body;
    const advocate_id = req.params.advocate_id;
    const user_id = res.locals.user.id;

    if (!advocate_id || !user_id) {
      return res
        .status(400)
        .json({ error: "Advocate or user information missing" });
    }

    if (!stars || stars < 1 || stars > 5) {
      return res.status(400).json({ error: "Stars must be between 1 and 5" });
    }

    if (feedback && feedback.length > 500) {
      return res
        .status(400)
        .json({ error: "Feedback must be less than 500 characters" });
    }

    const isAdvocate = await prisma.advocates.findUnique({
      where: { advocate_id },
    });

    if (!isAdvocate) {
      return res.status(404).json({ error: "Advocate not found" });
    }

    await prisma.advocate_ratings.deleteMany({
      where: {
        advocate_id,
        user_id,
      },
    });

    await prisma.advocate_ratings.create({
      data: {
        advocate_id,
        user_id,
        stars,
        feedback,
      },
    });

    return res.status(201).json({ status: true });
  } catch (err) {
    console.error("Error adding rating:", err);
    return res
      .status(500)
      .json({ error: "An error occurred while adding the rating" });
  }
});

/**
 * @swagger
 * /api/get-rating/{advocate_id}:
 *   get:
 *     tags: [Common]
 *     summary: Retrieve all ratings for an advocate
 *     description: Get all the ratings and average score for a particular advocate.
 *     parameters:
 *       - in: path
 *         name: advocate_id
 *         required: true
 *         description: The ID of the advocate for whom you want to retrieve ratings.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Rating details retrieved successfully.
 */
router.get("/get-rating/:advocate_id", getUser, async (req, res) => {
  try {
    const advocate_id = req.params.advocate_id;

    if (!advocate_id) {
      return res.status(400).json({ error: "Advocate ID is required" });
    }

    const ratings = await prisma.advocate_ratings.findMany({
      where: { advocate_id },
      select: {
        stars: true,
        feedback: true,
        user_id: true,
      },
    });

    if (ratings.length === 0) {
      return res
        .status(404)
        .json({ error: "No ratings found for this advocate" });
    }

    const result = {
      ratings: ratings.map(rating => ({
        stars: rating.stars,
        feedback: rating.feedback,
        user_id: rating.user_id,
      })),
      averageRating:
        ratings.reduce((sum, rating) => sum + rating.stars, 0) / ratings.length,
      totalRatings: ratings.length,
    };

    return res.status(200).json(result);
  } catch (err) {
    console.error("Error fetching ratings:", err);
    return res
      .status(500)
      .json({ error: "An error occurred while fetching the ratings" });
  }
});

export default router;
