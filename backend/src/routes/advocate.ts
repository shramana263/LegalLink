import express from "express";
import prisma from "../../prisma/PrismaClient";
import { getUser } from "../middlewares/getUser";
import {
  getAdvocate,
  isAdvocate as isAdvocateVerified,
} from "../middlewares/isAdvocate";

const router = express.Router();

router.use(getUser);

/**
 * @swagger
 * /api/advocate/register:
 *   post:
 *     summary: Register an advocate with minimum details
 *     tags:
 *       - Advocate
 *     parameters:
 *       - in: body
 *         name: body
 *         schema:
 *            type: object
 *            required:
 *              - registration_number
 *              - reference_number
 *              - verification_document_url
 *            properties:
 *              registration_number:
 *                type: string
 *              reference_number:
 *                type: string
 *              verification_document_url:
 *                type: string
 *     responses:
 *       201:
 *         description: Advocate successfully registered.
 */
router.post("/register", async (req, res) => {
  const user = res.locals.user;

  const isAdvocate_result = await prisma.user.findUnique({
    where: { id: user.id },
  });

  if (isAdvocate_result?.userType !== "advocate") {
    return res.status(401).json({
      error: "You are not registered as an advocate. Please register first.",
    });
  }

  const existingAdvocate = await prisma.advocates.findUnique({
    where: { userId: user.id },
  });

  if (existingAdvocate) {
    return res.status(400).json({
      error: "You are already registered as an advocate.",
    });
  }

  try {
    const {
      registration_number,
      reference_number,
      verification_document_url,
    }: { [key: string]: string } = req.body;

    if (
      !registration_number ||
      !reference_number ||
      !verification_document_url
    ) {
      return res.status(400).json({
        error:
          "Registration details are required (registration_number, reference_number, verification_document_url)",
      });
    }

    const details = await prisma.advocates.findMany({
      where: { OR: [{ registration_number }, { reference_number }] },
    });

    if (details.length > 0) {
      return res.status(400).json({
        error:
          "Advocate with the same registration or reference number already exists.",
      });
    }

    const advocate = await prisma.advocates.create({
      data: {
        registration_number,
        reference_number,
        verification_document_url,
        user: { connect: { id: user.id as string } },
      },
      include: { user: true },
    });

    if (!advocate) {
      return res.status(500).json({ error: "Failed to register advocate" });
    }

    res.status(201).json({ status: true });
  } catch (error) {
    console.error("Error registering advocate:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.use(getAdvocate);

/**
 * @swagger
 * /api/advocate/me:
 *   get:
 *     summary: get Advocate details
 *     description: Retrieve the details of the currently logged-in advocate.
 *     tags:
 *       - Advocate
 *     responses:
 *       200:
 *         description: current advocate details
 */
router.get("/me", async (req, res) => {
  const user = res.locals.user;

  try {
    const _advocate = await prisma.advocates.findUnique({
      where: { userId: user.id },
      select: {
        user: true,
        contact_email: true,
        phone_number: true,
        advocate_id: true,
        is_verified: true,
        registration_number: true,
        reference_number: true,
        verification_document_url: true,
        availability_status: true,
        language_preferences: true,
        location_city: true,
        jurisdiction_states: true,
        fee_structure: true,
      },
    });

    const advocate = { ..._advocate, name: _advocate.user.name };

    if (!advocate) {
      return res.status(404).json({ error: "Advocate not found" });
    }

    res.json(advocate);
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

/**
 * @swagger
 * /api/advocate/verify:
 *   post:
 *     summary: Verifies all advocates in the database
 *     tags:
 *       - Advocate
 *     responses:
 *       200:
 *         description: All advocates were verified.
 */
router.post("/verify", async (req, res) => {
  try {
    const advocates = res.locals.advocate;
    if (
      !advocates.registration_number ||
      !advocates.reference_number ||
      !advocates.verification_document_url
    ) {
      return res
        .status(400)
        .json({ error: "All fields are required for verification." });
    }

    await prisma.advocates.update({
      where: { userId: res.locals.user.id },
      data: { is_verified: true, verification_status: "verified" },
    });

    res.json({ status: true, message: "Advocate verified successfully" });
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

/**
 * @swagger
 * /api/advocate/update:
 *   put:
 *     summary: Update advocate's non-verification fields
 *     tags:
 *       - Advocate
 *     parameters:
 *       - in: body
 *         name: body
 *         schema:
 *            type: object
 *            properties:
 *              contact_email:
 *                type: string
 *              phone_number:
 *                type: string
 *              qualification:
 *                type: string
 *              experience_years:
 *                type: string
 *                enum:
 *                   - Junior
 *                   - MidLevel
 *                   - Senior
 *                description: Experience level of the advocate
 *              availability_status:
 *                type: boolean
 *              language_preferences:
 *                type: array
 *                items:
 *                   type: string
 *              location_city:
 *                type: string
 *              jurisdiction_states:
 *                type: array
 *                items:
 *                   type: string
 *              fee_structure:
 *                type: object
 *                properties:
 *                   Consultation:
 *                     type: number
 *                   PreAppearance:
 *                     type: number
 *                   FixedCase:
 *                     type: number
 *     responses:
 *       200:
 *         description: Advocate updated successfully.
 */

router.put("/update", isAdvocateVerified, async (req, res) => {
  const user = res.locals.user;

  try {
    const advocate = await prisma.advocates.findUnique({
      where: { userId: user.id },
    });

    if (!advocate) {
      return res.status(404).json({ error: "Advocate not found" });
    }
    if (!advocate.is_verified) {
      return res
        .status(400)
        .json({ error: "Not verified. Update not allowed." });
    }

    const {
      registration_number,
      reference_number,
      verification_document_url,
      is_verified,
      verification_status,
      userId: _,
      advocate_id: __,
      fee_structure,
      ...allowed
    } = req.body;

    if (typeof fee_structure !== "object")
      return res.status(400).json({ error: "Invalid fee structure format" });

    const { consultation, preappearance, fixedcase } = fee_structure;

    if (
      (consultation && typeof consultation !== "number") ||
      (preappearance && typeof preappearance !== "number") ||
      (fixedcase && typeof fixedcase !== "number")
    ) {
      return res.status(400).json({
        error: "Fee structure values must be numbers",
      });
    }

    allowed.fee_structure = fee_structure;

    const updated = await prisma.advocates.update({
      where: { userId: user.id },
      data: allowed,
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

const SPECIALIZATION_ENUM = [
  "CRIMINAL",
  "CIVIL",
  "CORPORATE",
  "FAMILY",
  "CYBER",
  "INTELLECTUAL_PROPERTY",
  "TAXATION",
  "LABOR",
  "ENVIRONMENT",
  "HUMAN_RIGHTS",
  "OTHER",
];

/**
 * @swagger
 * /api/advocate/add-specialization:
 *   post:
 *     summary: Add a specialization to a verified advocate's profile
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
 *             properties:
 *               specialization:
 *                 type: string
 *                 enum:
 *                   - CRIMINAL
 *                   - CIVIL
 *                   - CORPORATE
 *                   - FAMILY
 *                   - CYBER
 *                   - INTELLECTUAL_PROPERTY
 *                   - TAXATION
 *                   - LABOR
 *                   - ENVIRONMENT
 *                   - HUMAN_RIGHTS
 *                   - OTHER
 *             required:
 *               - specialization
 *     responses:
 *       201:
 *         description: Specialization successfully added
 */
router.post("/add-specialization", isAdvocateVerified, async (req, res) => {
  const { specialization } = req.body;

  console.log("Adding specialization:", req.body);

  if (
    !specialization ||
    SPECIALIZATION_ENUM.indexOf(specialization.toUpperCase()) === -1
  ) {
    return res.status(400).json({ error: "Invalid specialization" });
  }

  try {
    const advocate_id = res.locals.advocate.advocate_id;

    const existingSpecialization =
      await prisma.advocate_specializations.findFirst({
        where: {
          advocate_id,
          specialization: specialization.toUpperCase(),
        },
      });

    if (existingSpecialization) {
      return res.status(400).json({
        error: "Specialization already exists for this advocate",
      });
    }

    await prisma.advocate_specializations.create({
      data: { advocate_id, specialization: specialization.toUpperCase() },
    });

    res.status(201).json({
      status: true,
    });
  } catch (error) {
    res.status(500).json({ error: "Server Error", details: error?.message });
  }
});

/**
 * @swagger
 * /api/advocate/specializations:
 *   get:
 *     summary: Retrieve all specializations of a verified advocate
 *     tags:
 *       - Advocate
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of specializations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   specialization:
 *                     type: string
 */
router.get("/specializations", isAdvocateVerified, async (req, res) => {
  try {
    const advocate_id = res.locals.advocate.advocate_id;

    const specializations = await prisma.advocate_specializations.findMany({
      where: { advocate_id },
      select: { specialization: true },
    });

    res.json(specializations);
  } catch (error) {
    res.status(500).json({ error: "Server Error", details: error?.message });
  }
});

const allowedRoles = [
  "Petitioner",
  "Respondent",
  "Defendant",
  "Prosecutor",
  "Legal Advisor",
  "Other",
].map(E => E.toUpperCase());
const allowedOutcomes = ["WON", "LOST", "PENDING", "SETTLED", "DISMISSED"].map(
  E => E.toUpperCase(),
);

router.use(isAdvocateVerified);

function validateCaseData(data: any) {
  let {
    case_type,
    role,
    year,
    outcome,
  }: {
    case_type: string;
    role: string;
    year: number;
    outcome: string;
    advocate_id: string;
  } = data;

  if (!case_type || !role || !year || !outcome) {
    return { error: "Missing required fields" };
  }

  case_type = case_type.toUpperCase();
  role = role.toUpperCase();
  outcome = outcome.toUpperCase();

  if (
    !SPECIALIZATION_ENUM.includes(case_type) ||
    !allowedRoles.includes(role) ||
    !allowedOutcomes.includes(outcome)
  ) {
    return { error: "Invalid value in type/role/outcome" };
  }

  if (year > new Date().getFullYear()) {
    return { error: "Invalid year" };
  }

  return null;
}

/**
 * @swagger
 * /api/advocate/add-case:
 *   post:
 *     summary: Add a new legal case handled by the advocate
 *     tags:
 *       - Advocate Cases
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - case_type
 *               - role
 *               - year
 *               - outcome
 *             properties:
 *               case_type:
 *                 type: string
 *                 example: CRIMINAL
 *                 enum: [CRIMINAL, CIVIL, CORPORATE, FAMILY, CYBER, INTELLECTUAL_PROPERTY, TAXATION, LABOR, ENVIRONMENT, HUMAN_RIGHTS, OTHER]
 *               role:
 *                 type: string
 *                 example: DEFENSE
 *                 enum: [PETITIONER, RESPONDENT, DEFENDANT, PROSECUTOR, LEGAL_ADVISOR, OTHER]
 *               year:
 *                 type: integer
 *                 example: 2023
 *               outcome:
 *                 type: string
 *                 example: WON
 *                 enum: [WON, LOST, PENDING, SETTLED, DISMISSED]
 *               description:
 *                 type: string
 *               court_name:
 *                 type: string
 *               duration_months:
 *                 type: number
 *     responses:
 *       201:
 *         description: Case added successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */

router.post("/add-case", async (req, res) => {
  const {
    case_type,
    role,
    year,
    outcome,
    description,
    court_name,
    duration_months,
  } = req.body;

  const advocate_id = res.locals.advocate?.advocate_id;
  const hasError = validateCaseData(req.body);
  if (hasError) {
    return res.status(400).json(hasError);
  }

  try {
    await prisma.advocate_cases.create({
      data: {
        advocate_id,
        year,
        description,
        court_name,
        duration_months,

        case_type: case_type.toUpperCase(),
        role: role.toUpperCase(),
        outcome: outcome.toUpperCase(),
      },
    });

    return res.status(201).json({ status: true });
  } catch (error) {
    console.error("Error adding case:", error);
    return res
      .status(500)
      .json({ error: "Server Error", details: (error as Error).message });
  }
});

/**
 * @swagger
 * /api/advocate/update-case/{case_id}:
 *   patch:
 *     summary: Update an existing legal case (must belong to authenticated advocate)
 *     tags:
 *       - Advocate Cases
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: case_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the case to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - case_type
 *               - role
 *               - year
 *               - outcome
 *             properties:
 *               case_type:
 *                 type: string
 *                 example: CRIMINAL
 *                 enum: [CRIMINAL, CIVIL, CORPORATE, FAMILY, CYBER, INTELLECTUAL_PROPERTY, TAXATION, LABOR, ENVIRONMENT, HUMAN_RIGHTS, OTHER]
 *               role:
 *                 type: string
 *                 example: DEFENSE
 *                 enum: [PETITIONER, RESPONDENT, DEFENDANT, PROSECUTOR, LEGAL_ADVISOR, OTHER]
 *               year:
 *                 type: integer
 *                 example: 2023
 *               outcome:
 *                 type: string
 *                 example: WON
 *                 enum: [WON, LOST, PENDING, SETTLED, DISMISSED]
 *               description:
 *                 type: string
 *               court_name:
 *                 type: string
 *               duration_months:
 *                 type: number
 *     responses:
 *       200:
 *         description: Case updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Case not found or unauthorized
 *       500:
 *         description: Server error
 */

router.patch("/update-case/:case_id", async (req, res) => {
  const { case_id } = req.params;
  const advocate_id = res.locals.advocate?.advocate_id;

  try {
    const existing = await prisma.advocate_cases.findFirst({
      where: { case_id, advocate_id },
    });

    if (!existing) {
      return res.status(404).json({ error: "Case not found or unauthorized" });
    }

    const hasError = validateCaseData(req.body);
    if (hasError) {
      return res.status(400).json(hasError);
    }

    const updated = await prisma.advocate_cases.update({
      where: { case_id },
      data: {
        ...req.body,
        case_type: req.body.case_type.toUpperCase(),
        role: req.body.role.toUpperCase(),
        outcome: req.body.outcome.toUpperCase(),
      },
    });

    return res.status(200).json({ status: true });
  } catch (error) {
    console.error("Error updating case:", error);
    return res
      .status(500)
      .json({ error: "Server Error", details: (error as Error).message });
  }
});

export default router;
