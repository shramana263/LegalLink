import { google } from "googleapis";

const oauth2Client = new google.auth.OAuth2({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: "http://localhost:3000/api/appointment/advocate/calendar/feed",
});

// console.log(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);

export async function getAuthUrl() {
  const scopes = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/calendar.settings.readonly",
    "https://www.googleapis.com/auth/calendar.addons.execute",
    "https://www.googleapis.com/auth/calendar.app.created",
  ];

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
  });
}

export async function getToken(code: string) {
  const token = await oauth2Client.getToken(code);

  return token.tokens;
}

export async function getFreeBusySlots(
  access_token: string,
  timeMin: string,
  timeMax: string,
) {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const res = await calendar.freebusy.query({
    requestBody: {
      timeMin,
      timeMax,
      timeZone: "Asia/Kolkata",
      items: [{ id: "primary" }],
    },
  });

  return res.data.calendars.primary.busy;
}

export async function createAppointmentEvent(
  access_token: string,
  {
    summary,
    description,
    startTime,
    endTime,
    attendeeEmail,
  }: {
    summary: string;
    description: string;
    startTime: string;
    endTime: string;
    attendeeEmail: string;
  },
) {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token });

  const availability = await getNextAvailableSlots(
    access_token,
    { startHour: 10, endHour: 17 },
    ["MON", "TUE", "WED", "THU", "FRI"],
  );

  if (!availability || availability.length === 0) {
    throw new Error("The selected time slot is not available.");
  }

  const isSlotAvailable = availability.some(
    slot =>
      new Date(slot.start).toISOString() === startTime &&
      new Date(slot.end).toISOString() === endTime,
  );

  if (!isSlotAvailable) {
    throw new Error("The selected time slot is not available.");
  }

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const response = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary,
      description,
      start: {
        dateTime: startTime,
        timeZone: "Asia/Kolkata",
      },
      end: {
        dateTime: endTime,
        timeZone: "Asia/Kolkata",
      },
      attendees: [{ email: attendeeEmail }],
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    },
    conferenceDataVersion: 1,
  });

  return response.data;
}

export async function fetchAdvocateAvailability(access_token: string) {
  const now = new Date();
  const oneWeekLater = new Date();
  oneWeekLater.setDate(now.getDate() + 7);

  const busySlots = await getFreeBusySlots(
    access_token,
    now.toISOString(),
    oneWeekLater.toISOString(),
  );

  console.log("Busy slots:", busySlots);
}

type Slot = { start: string; end: string };

export async function getNextAvailableSlots(
  access_token: string,
  workingHours: { startHour: number; endHour: number },
  workingDays: string[] = ["MON", "TUE", "WED", "THU", "FRI"],
): Promise<Slot[]> {
  const now = new Date();
  const maxRange = new Date();
  maxRange.setDate(now.getDate() + 7);

  const busy = await getFreeBusySlots(
    access_token,
    now.toISOString(),
    maxRange.toISOString(),
  );
  const busySlots = busy.map(slot => ({
    start: new Date(slot.start),
    end: new Date(slot.end),
  }));

  const dayMap = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const availableSlots: Slot[] = [];

  let current = new Date(now);
  current.setMinutes(0, 0, 0);
  current.setHours(current.getHours() + 1);

  while (availableSlots.length < 5 && current < maxRange) {
    const currentDay = dayMap[current.getDay()];
    const hour = current.getHours();

    if (
      workingDays.includes(currentDay) &&
      hour >= workingHours.startHour &&
      hour < workingHours.endHour
    ) {
      const slotEnd = new Date(current.getTime() + 30 * 60000);

      const isBusy = busySlots.some(
        busySlot => current < busySlot.end && slotEnd > busySlot.start,
      );

      if (!isBusy) {
        availableSlots.push({
          start: current.toISOString(),
          end: slotEnd.toISOString(),
        });
      }
    }

    current.setHours(current.getHours() + 1);
  }

  return availableSlots;
}
