import express from "express";
import { getUser } from "../middlewares/getUser";
import { isAdvocate as isAdvocateVerified } from "../middlewares/isAdvocate";
import { getAdvocate } from "../middlewares/isAdvocate";
import prisma from "../../prisma/PrismaClient";

const router = express.Router();

/**
 * @swagger
 * /api/social/post/all:
 *   get:
 *     summary: Get all advocate posts
 *     tags:
 *       - Advocate Posts
 *     responses:
 *       200:
 *         description: List of posts
 *       500:
 *         description: Failed to fetch posts
 */

/**
 * @swagger
 * /api/social/post/get/{post_id}:
 *   get:
 *     summary: Get a single post by ID
 *     tags:
 *       - Advocate Posts
 *     parameters:
 *       - in: path
 *         name: post_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the post to fetch
 *     responses:
 *       200:
 *         description: Post data
 *       500:
 *         description: Failed to fetch post
 */

/**
 * @swagger
 * /api/social/post/react:
 *   post:
 *     summary: React to a post
 *     tags:
 *       - Advocate Posts
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - post_id
 *               - type
 *             properties:
 *               post_id:
 *                 type: string
 *               type:
 *                 type: string
 *                 example: like
 *                 enum: [like, love, laugh, sad, angry]
 *     responses:
 *       200:
 *         description: Reaction added or updated
 *       400:
 *         description: Missing fields
 *       500:
 *         description: React failed
 */

/**
 * @swagger
 * /api/social/post/comment:
 *   post:
 *     summary: Comment on a post
 *     tags:
 *       - Advocate Posts
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - post_id
 *               - comment
 *             properties:
 *               post_id:
 *                 type: string
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comment added
 *       400:
 *         description: Missing comment or post ID
 *       500:
 *         description: Comment failed
 */

/**
 * @swagger
 * /api/social/post/{post_id}/comments:
 *   get:
 *     summary: Get all comments for a post
 *     tags:
 *       - Advocate Posts
 *     parameters:
 *       - in: path
 *         name: post_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of comments
 *       500:
 *         description: Fetch failed
 */

/**
 * @swagger
 * /api/social/post/{post_id}/reactions:
 *   get:
 *     summary: Get all reactions for a post
 *     tags:
 *       - Advocate Posts
 *     parameters:
 *       - in: path
 *         name: post_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of reactions
 *       500:
 *         description: Fetch failed
 */

/**
 * @swagger
 * /api/social/post/create:
 *   post:
 *     summary: Create a new post as an advocate
 *     tags:
 *       - Advocate Posts
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *               image_url:
 *                 type: string
 *     responses:
 *       201:
 *         description: Post created
 *       400:
 *         description: Validation error
 *       500:
 *         description: Failed to create post
 */

/**
 * @swagger
 * /api/social/post/edit:
 *   post:
 *     summary: Edit an existing post
 *     tags:
 *       - Advocate Posts
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - post_id
 *               - text
 *             properties:
 *               post_id:
 *                 type: string
 *               text:
 *                 type: string
 *               image_url:
 *                 type: string
 *     responses:
 *       201:
 *         description: Post updated
 *       400:
 *         description: Validation error
 *       500:
 *         description: Failed to update post
 */

/**
 * @swagger
 * /api/social/post/my:
 *   get:
 *     summary: Get posts created by the authenticated advocate
 *     tags:
 *       - Advocate Posts
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of posts
 *       500:
 *         description: Fetch failed
 */

/**
 * @swagger
 * /api/social/post/{post_id}:
 *   delete:
 *     summary: Delete a post by ID
 *     tags:
 *       - Advocate Posts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: post_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post deleted
 *       500:
 *         description: Delete failed
 */

router.get("/post/all", async (req, res) => {
  try {
    const posts = await prisma.advocate_posts.findMany({
      orderBy: { created_at: "desc" },
      include: {
        advocate: { select: { user: { select: { name: true, image: true } } } },
        _count: {
          select: { reactions: true, comments: true },
        },
      },
    });
    res.json(posts);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch posts", details: err.message });
  }
});

router.get("/post/get/:post_id", async (req, res) => {
  try {
    const post = await prisma.advocate_posts.findUnique({
      where: { post_id: req.params.post_id },
      include: {
        advocate: { select: { user: { select: { name: true, image: true } } } },
        comments: {
          select: {
            comment: true,
            created_at: true,
            user: { select: { name: true, image: true } },
          },
        },
        _count: {
          select: { reactions: true, comments: true },
        },
      },
    });
    res.json(post);
  } catch (err) {
    console.error("Error fetching post:", err);
    res
      .status(500)
      .json({ error: "Failed to fetch posts", details: err.message });
  }
});

router.post("/post/react", getUser, async (req, res) => {
  const { post_id, type } = req.body;
  const user_id = res.locals.user.id;

  if (!post_id || !type)
    return res.status(400).json({ error: "Missing fields" });

  try {
    const reaction = await prisma.post_reactions.upsert({
      where: { post_id_user_id: { post_id, user_id } },
      update: { type },
      create: { post_id, user_id, type },
    });

    res.status(200).json({ status: true, data: reaction });
  } catch (err) {
    res.status(500).json({ error: "React failed", details: err.message });
  }
});

router.post("/post/comment", getUser, async (req, res) => {
  const { post_id, comment } = req.body;
  const user_id = res.locals.user.id;

  if (!post_id || !comment)
    return res.status(400).json({ error: "Missing comment or post ID" });

  try {
    const result = await prisma.post_comments.create({
      data: { post_id, user_id, comment },
    });
    res.status(201).json({ status: true, data: result });
  } catch (err) {
    console.error("Error creating comment:", err);
    res.status(500).json({ error: "Comment failed", details: err.message });
  }
});

router.get("/post/:post_id/comments", async (req, res) => {
  const { post_id } = req.params;

  try {
    const comments = await prisma.post_comments.findMany({
      where: { post_id },
      orderBy: { created_at: "desc" },
    });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: "Fetch failed", details: err.message });
  }
});

router.get("/post/:post_id/reactions", async (req, res) => {
  const { post_id } = req.params;

  try {
    const reactions = await prisma.post_reactions.groupBy({
      by: ["type"],
      where: { post_id },
      _count: { type: true },
    });
    // Format: { like: 2, love: 1, ... }
    const result: Record<string, number> = {};
    reactions.forEach(r => {
      result[r.type] = r._count.type;
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Fetch failed", details: err.message });
  }
});

router.get("/post/:advocate_id", async (req, res) => {
  const advocate_id = req.params.advocate_id;
  try {
    const posts = await prisma.advocate_posts.findMany({
      where: { advocate_id },
      orderBy: { created_at: "desc" },
    });
    res.json(posts);
  } catch (err) {
    console.log("Fetch Error:", err);
    res.status(500).json({ error: "Fetch failed", details: err.message });
  }
});

router.use(getUser);
router.use(getAdvocate);
router.use(isAdvocateVerified);

router.post("/post/create", async (req, res) => {
  const { text, image_url } = req.body;
  const advocate_id = res.locals.advocate.advocate_id;

  if (!text || text.split(" ").length > 100) {
    return res
      .status(400)
      .json({ error: "Text is required and must be under 100 words" });
  }

  try {
    const post = await prisma.advocate_posts.create({
      data: { advocate_id, text, image_url },
    });
    res.status(201).json({ status: true, data: post });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to create post", details: err.message });
  }
});

router.post("/post/edit", async (req, res) => {
  const { post_id, text, image_url } = req.body;
  const advocate_id = res.locals.advocate.advocate_id;

  if (!post_id || !text || text.split(" ").length > 100) {
    return res.status(400).json({
      error: "Post ID and text are required, and text must be under 100 words",
    });
  }

  try {
    const post = await prisma.advocate_posts.update({
      where: { post_id },
      data: { advocate_id, text, image_url },
    });
    res.status(201).json({ status: true, data: post });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to update post", details: err.message });
  }
});

router.get("/post/my", async (req, res) => {
  console.log("Fetching posts for advocate");
  const advocate_id = res.locals.advocate.advocate_id;
  try {
    const posts = await prisma.advocate_posts.findMany({
      where: { advocate_id },
      orderBy: { created_at: "desc" },
    });
    res.json(posts);
  } catch (err) {
    console.log("Fetch Error:", err);
    res.status(500).json({ error: "Fetch failed", details: err.message });
  }
});

router.delete("/post/:post_id", async (req, res) => {
  const { post_id } = req.params;
  const advocate_id = res.locals.advocate.advocate_id;

  try {
    await prisma.advocate_posts.delete({ where: { post_id, advocate_id } });
    res.status(200).json({ status: true, message: "Post deleted" });
  } catch (err) {
    console.log("Delete Error:", err);
    res.status(500).json({ error: "Delete failed", details: err.message });
  }
});

export default router;
