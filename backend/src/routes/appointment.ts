import express from "express";
import {
  getAuthUrl,
  getToken,
  getNextAvailableSlots,
  createAppointmentEvent,
} from "../lib/google-calendar";
import prisma from "../../prisma/PrismaClient";
import {
  getAdvocate,
  isAdvocate as isAdvocateVerified,
} from "../middlewares/isAdvocate";
import { getUser } from "../middlewares/getUser";

const router = express.Router();

/**
 * @swagger
 * /api/appointment/advocate/calendar/connect:
 *   get:
 *     summary: Api to get auth URL for Google Calendar
 *     tags:
 *       - Appointment
 *     parameters: []
 *     responses:
 *       301:
 *        description: Redirects to Google OAuth URL
 */

// GET /advocate/calendar/connect → Redirect to Google OAuth
router.get(
  "/advocate/calendar/connect",
  getUser,
  getAdvocate,
  isAdvocateVerified,
  async (req, res) => {
    const url = await getAuthUrl();
    res.redirect(url);
  },
);

// GET /advocate/calendar/feed → Google OAuth callback
router.get(
  "/advocate/calendar/feed",
  getUser,
  getAdvocate,
  isAdvocateVerified,
  async (req, res) => {
    const { code } = req.query;

    try {
      const tokens = await getToken(code as string);

      // Simulate advocate session
      const advocate_id = res.locals.advocate.advocate_id;

      await prisma.calendar_tokens.upsert({
        where: { advocate_id },
        update: { token: tokens as object },
        create: {
          advocate_id,
          token: tokens as string,
        },
      });

      res.json({ success: true, message: "Calendar connected." });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "OAuth failed" });
    }
  },
);

/**
 * @swagger
 * /api/appointment/advocate/availability/{advocate_id}:
 *   get:
 *     summary: Get next available slots for an advocate
 *     tags:
 *       - Appointment
 *     parameters:
 *       - in: path
 *         name: advocate_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Returns available slots for the advocate
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 slots:
 *                   type: array
 *                   items:
 *                     type: string
 */
router.get("/advocate/availability/:advocate_id", async (req, res) => {
  const { advocate_id } = req.params;

  try {
    const tokenData = await prisma.calendar_tokens.findUnique({
      where: { advocate_id },
    });

    if (!tokenData) {
      return res.status(404).json({ error: "Calendar not connected." });
    }

    const advocate = await prisma.advocates.findUnique({
      where: { advocate_id },
    });

    if (!advocate) {
      return res.status(404).json({ error: "Advocate not found" });
    }

    const workingHours = {
      startHour: 10,
      endHour: 17,
      ...(advocate.working_hours || {}),
    };

    const workingDays = advocate.working_days || [
      "MON",
      "TUE",
      "WED",
      "THU",
      "FRI",
    ];

    const token = tokenData.token as { access_token: string };
    const slots = await getNextAvailableSlots(
      token.access_token,
      workingHours,
      workingDays,
    );

    res.json({ slots });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get availability" });
  }
});

// POST /book → Client books a slot
router.post("/book", getUser, async (req, res) => {
  const { advocate_id, startTime, endTime, reason } = req.body;
  const client_id = res.locals.user.id;

  try {
    const advocate = await prisma.advocates.findUnique({
      where: { advocate_id },
    });

    if (!advocate) {
      return res.status(404).json({ error: "Advocate not found" });
    }

    const tokenData = await prisma.calendar_tokens.findUnique({
      where: { advocate_id },
    });

    const token = tokenData.token as { access_token: string };

    const event = await createAppointmentEvent(token.access_token, {
      summary: `Consultation with ${res.locals.user.name}`,
      description: reason,
      startTime,
      endTime,
      attendeeEmail: res.locals.user.email,
    });

    const appointment = await prisma.appointments.create({
      data: {
        advocate_id,
        client_id,
        appointment_time: new Date(startTime),
        duration_mins: 30,
        reason,
        calendar_event_id: event.id,
        meeting_link: event.hangoutLink || event.htmlLink,
        is_confirmed: false,
        status: "pending",
      },
    });

    res.status(201).json({ success: true, appointment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Booking failed" });
  }
});

// POST /cancel → Cancel appointment (by client or advocate)
router.post("/cancel", getUser, async (req, res) => {
  const { appointment_id } = req.body;
  const user_id = res.locals.user.id;

  try {
    const appointment = await prisma.appointments.findUnique({
      where: { id: appointment_id },
    });

    if (
      !appointment ||
      (appointment.client_id !== user_id && appointment.advocate_id !== user_id)
    ) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await prisma.appointments.update({
      where: { id: appointment_id },
      data: { status: "cancelled" },
    });

    res.json({ success: true, message: "Appointment cancelled" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Cancel failed" });
  }
});

// POST /advocate/confirm → Advocate confirms a pending appointment
router.post(
  "/advocate/confirm",
  getUser,
  getAdvocate,
  isAdvocateVerified,
  async (req, res) => {
    const { appointment_id } = req.body;
    const advocate_id = res.locals.advocate.advocate_id;

    try {
      const appointment = await prisma.appointments.findUnique({
        where: { id: appointment_id },
      });

      if (!appointment || appointment.advocate_id !== advocate_id) {
        return res.status(403).json({ error: "Not authorized" });
      }

      await prisma.appointments.update({
        where: { id: appointment_id },
        data: { is_confirmed: true, status: "confirmed" },
      });

      res.json({ success: true, message: "Appointment confirmed" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Confirmation failed" });
    }
  },
);

export default router;
