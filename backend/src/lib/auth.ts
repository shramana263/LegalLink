import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "../../generated/prisma";
import { sendEmail } from "./resend";

const prisma = new PrismaClient();
export const auth = betterAuth({
  trustedOrigins: [process.env.CORS_ORIGIN || "http://localhost:3000"],
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url, token }, request) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your email address",
        html: `Click the link to verify your email: <a href="${url}">Verify Email</a><br/> If the link does not work, copy and paste the following URL into your browser: ${url}`,
      });
      console.log(
        "Verification email sent to:",
        user.email,
        "link: ",
        "link: ",
        url,
      );
    },
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
  },
});
