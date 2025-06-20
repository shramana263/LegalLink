import express, { Router } from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "../lib/auth";
import { PrismaClient } from "../../generated/prisma";
import { getUser } from "../middlewares/getUser";

const router = Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/auth/sign-in/email:
 *   post:
 *     summary: Sign in using email
 *     tags:
 *       - Auth
 *     parameters: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john2@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: StrongP@ssw0rd
 *     responses:
 *       200:
 *         description: Successful sign-up
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: object
 *                   description: Auth token object
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: 12345
 *                     name:
 *                       type: string
 *                       example: John Doe
 *                     email:
 *                       type: string
 *                       example: john@example.com
 */

/**
 * @swagger
 * /api/auth/sign-up/email:
 *   post:
 *     summary: Sign up using email
 *     tags:
 *       - Auth
 *     parameters: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - userType
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: StrongP@ssw0rd
 *               userType:
 *                 type: string
 *                 enum: [client, advocate]
 *                 example: client
 *     responses:
 *       200:
 *         description: Successful sign-up
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: object
 *                   description: Auth token object
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: 12345
 *                     name:
 *                       type: string
 *                       example: John Doe
 *                     email:
 *                       type: string
 *                       example: john@example.com
 *       400:
 *         description: Bad request or validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: VALIDATION_ERROR
 *                 message:
 *                   type: string
 *                   example: Invalid email or missing fields
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: SERVER_ERROR
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */

router.post(
  "/api/auth/sign-up/email",
  express.json({ limit: "10mb" }),
  async (req, res) => {
    const { userType, ...data } = req.body;

    if (!userType || ["client", "advocate"].includes(userType) === false) {
      return res
        .status(400)
        .json({ code: "INVALID_USER_TYPE", message: "Invalid user type" });
    }

    const result = await auth.api.signUpEmail({
      body: data,
      asResponse: true,
    });

    res.status(result.status);
    res.setHeader("set-cookie", result.headers.get("set-cookie"));

    if (result.ok) {
      const resp = await result.json();
      const { user } = resp;
      const id = user.id;
      await prisma.user.update({
        where: { id },
        data: {
          userType,
        },
      });
      return res.json(resp);
    }
    res.json(await result.json());
  },
);

/**
 * @swagger
 * /api/auth/update-user:
 *   post:
 *     summary: Update user profile
 *     tags:
 *       - Auth
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Jane Doe
 *               image:
 *                 type: string
 *                 description: URL or base64-encoded image
 *                 example: https://example.com/image.jpg
 *               district:
 *                 type: string
 *                 example: Central District
 *               state:
 *                 type: string
 *                 example: California
 *               location:
 *                 type: string
 *                 example: Los Angeles
 *     responses:
 *       200:
 *         description: Update successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 */

router.post(
  "/api/auth/update-user",
  getUser,
  express.json({ limit: "10mb" }),
  async (req, res) => {
    const { image, name, ...extra } = req.body;
    const result = await auth.api.updateUser({
      body: req.body,
      asResponse: true,
      //@ts-ignore
      headers: req.headers,
      //@ts-ignore
      method: req.method,
    });
    if (Object.keys(extra).length > 0) {
      const id = res.locals.user.id;
      const { city, district, state, location } = extra;
      const updateData: { [key: string]: string } = {};
      if (city) updateData.city = city;
      if (district) updateData.district = district;
      if (state) updateData.state = state;
      if (location) updateData.location = location;
      await prisma.user.update({
        where: { id },
        data: updateData,
      });
    }
    res.status(result.status);
    res.setHeader("set-cookie", result.headers.get("set-cookie"));
    res.json(await result.json());
  },
);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get user profile
 *     tags:
 *       - Auth
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Update successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: 123456
 *                 name:
 *                   type: string
 *                   example: Jane Doe
 *                 email:
 *                   type: string
 *                   example: jane.doe@example.com
 *                 image:
 *                   type: string
 *                   example: https://example.com/image.jpg
 *                 userType:
 *                   type: string
 *                   example: client
 *                 city:
 *                   type: string
 *                   example: Los Angeles
 *                 district:
 *                   type: string
 *                   example: Central District
 *                 state:
 *                   type: string
 *                   example: California
 *                 location:
 *                   type: string
 *                   example: Los Angeles
 */

router.get(
  "/api/auth/profile",
  getUser,
  express.json({ limit: "10mb" }),
  async (req, res) => {
    const userId = res.locals.user.id;

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          userType: true,
          city: true,
          district: true,
          state: true,
          location: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ error: "Failed to fetch user profile" });
    }
  },
);

router.all("/api/auth/*", toNodeHandler(auth));

export default router;
