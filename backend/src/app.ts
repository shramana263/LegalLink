import express from "express";
import logger from "morgan";
import cookieParser from "cookie-parser";
import cors from "cors";
import swaggerJsDoc from "swagger-jsdoc";
import swaggerUI from "swagger-ui-express";

import { index } from "./routes/index";
import authRouter from "./routes/auth";
import uploadRouter from "./routes/upload";
import advocateRouter from "./routes/advocate";
import ratingRouter from "./routes/rating";
import commonRouter from "./routes/common";
import searchRouter from "./routes/search";
import socialRouter from "./routes/social";

export const app = express();

app.use(cookieParser());

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  }),
);

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "LegalLink API",
      version: "1.0.0",
    },
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "better-auth.session_token",
        },
      },
    },
  },
  apis: ["./src/routes/*.ts"],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerDocs));

app.set("port", process.env.PORT || 3000);

app.use(logger("dev"));

app.use(authRouter);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false }));

app.use("/api", commonRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/advocate", advocateRouter);
app.use("/api", ratingRouter);
app.use("/api/search", searchRouter);
app.use("/api/social", socialRouter);

app.use("/", index);
