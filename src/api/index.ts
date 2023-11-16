import { Express } from "express-serve-static-core";
import UserApi from "./User";
import CompanyRouter from "./Company";
import InvestmentRouter from "./Investment";
import InvitationRouter from "./Invitation";
import FundingPoolRouter from "./FundingPool";
import WebhookRouter from "./Webhook";

export const apiV1 = (app: Express): void => {
  app.use("/v1/users", UserApi.UserApiV1);
  app.use("/v1/companies", CompanyRouter);
  app.use("/v1/investments", InvestmentRouter);
  app.use("/v1/invitations", InvitationRouter);
  app.use("/v1/fundingPools", FundingPoolRouter);
  app.use("/v1/ondato_webhook", WebhookRouter);
};

export const apiV2 = (app: Express): void => {
  app.use("/v2/users", UserApi.UserApiV2);
  app.use("/v2/companies", CompanyRouter);
  app.use("/v2/investments", InvestmentRouter);
  app.use("/v2/invitations", InvitationRouter);
  app.use("/v2/fundingPools", FundingPoolRouter);
  app.use("/v2/ondato_webhook", WebhookRouter);
};
