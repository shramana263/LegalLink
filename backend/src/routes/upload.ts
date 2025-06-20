import multer from "multer";
import express, { Request, Response, NextFunction } from "express";
import cloudinary from "../lib/cloudinary";
import stream from "stream";

const router = express.Router();

// Define file filter to allow only images and PDF
function fileFilter(
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only images and PDF files are allowed."));
  }
}

const limits = { fileSize: 5 * 1024 * 1024 }; // 5 MB

const upload = multer({
  limits,
  fileFilter,
  storage: multer.diskStorage({ destination: "temp/" }),
});

/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: Upload a file (image or PDF).
 *     description: Allows you to upload a single file (image or PDF) to Cloudinary.
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - name: file
 *         in: formData
 *         description: File to upload (jpg, png, gif, pdf).
 *         required: true
 *         type: file
 *     responses:
 *       200:
 *         description: File uploaded successfully.
 *         schema:
 *           type: object
 *           properties:
 *             url:
 *               type: string
 *               description: Cloudinary URL of the uploaded file.
 *       400:
 *         description: Bad request (invalid file or size).
 *       500:
 *         description: Internal server error.
 */

router.post("/", upload.single("file"), async (req, res) => {
  try {
    const filePath = req.file.path;
    const result = await cloudinary.uploader.upload(filePath);
    res.json({ url: result.secure_url });
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

router.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    res.status(400).json({ error: err.message });
  } else if (err) {
    res.status(400).json({ error: err.toString() });
  }
});

export default router;
