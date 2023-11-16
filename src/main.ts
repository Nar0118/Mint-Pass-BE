import express from "express";
import mongoose from "mongoose";
import * as bodyParser from "body-parser";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import swaggerUi from "swagger-ui-express";
import env from "./util/constants/env";
import swaggerDocument from "../src/swagger.json";
import { apiV1, apiV2 } from "./api";
import { rateLimitMiddleware } from "./middleware/rateLimit.middleware";
// import {
//   startInvestmentsVerificationCronJob,
//   startSaftsVerification,
//   testCron,
// } from "./cron-job";

declare module "express-session" {
  interface SessionData {
    oauthRequestToken?: string;
    socketId?: unknown;
    oauthRequestTokenSecret?: string;
    oauthAccessToken?: string;
    signUp?: string;
  }
}

const app = express();
const port = env.port;

app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(bodyParser.json());
app.use(express.json());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "DELETE", "UPDATE", "PUT", "PATCH"],
  })
);
app.use(cookieParser());
app.use(
  session({
    secret: env.sessionSecret,
    resave: false,
    saveUninitialized: true,
  })
);
app.use(rateLimitMiddleware);

const http = require("http").Server(app);

const io = require("socket.io")(http, {
  cors: {
    origin: env.deployedFrontendUrl,
    methods: ["GET", "POST"],
  },
});
app.set("socketio", io);

mongoose.connect(env.databaseConnectionUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
  autoIndex: true,
});

app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    explorer: true,
  })
);

apiV1(app);
apiV2(app);

// startInvestmentsVerificationCronJob();
// startSaftsVerification();

http.listen(port, (): void => {
  console.log(`Server running on port ${port}`);
});
