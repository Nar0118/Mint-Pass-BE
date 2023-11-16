require("dotenv").config();

export interface EnvVariables {
  tokenKey: string;
  secretJwtCode: string;
  databaseConnectionUrl: string;
  defaultEmail: string;
  defaultEmailPassword: string;
  clientId: string;
  deployedFrontendUrl: string;
  port: number | string;
  twitterConsumerKey: string;
  twitterConsumerSecret: string;
  sessionSecret: string;
  oauthTwitterCallback: string;
  youSignApiKey: string;
  youSignUrl: string;
  bucketName: string;
  projectId: string;
  anvilApiKey: string;
  sandboxTokenKyc: string;
  kycStartUrl: string;
  avalancheNativeTokenSymbol: string;
  web3Provider: string;
  cronJobPeriod: string;
  saftValidationCronJobPeriod: string;
  twilioAccountSID: string;
  twilioAouthToken: string;
  googleServicePrivateKey: string;
  googleServiceClientEmail: string;
}

const env: EnvVariables = {
  tokenKey: process.env.TOKEN_KEY ?? "",
  secretJwtCode: process.env.SECRET_JWT_CODE ?? "",
  databaseConnectionUrl: process.env.DATABASE_CONNECTION_URL ?? "",
  defaultEmail: process.env.DEFAULT_EMAIL ?? "",
  defaultEmailPassword: process.env.DEFAULT_EMAIL_PASSWORD ?? "",
  port: process.env.PORT ?? 8080,
  youSignApiKey: process.env.YOUSIGN_API_KEY ?? "",
  youSignUrl: process.env.YOUSIGN_API_URL ?? "",
  clientId: process.env.CLIENT_ID ?? "",
  deployedFrontendUrl: process.env.DEPLOYED_FE_URL ?? "",
  sessionSecret: process.env.SESSION_SECRET ?? "",
  oauthTwitterCallback: "",
  bucketName: process.env.BUCKET_NAME ?? "",
  projectId: process.env.PROJECT_ID ?? "",
  twitterConsumerKey: process.env.TWITTER_CONSUMER_KEY ?? "",
  twitterConsumerSecret: process.env.TWITTER_CONSUMER_SECRET ?? "",
  anvilApiKey: process.env.ANVIL_API_KEY ?? "",
  sandboxTokenKyc: process.env.SANDBOX_TOKEN_KYC ?? "",
  kycStartUrl: process.env.KYC_START_URL ?? "",
  avalancheNativeTokenSymbol: process.env.AVALANCHE_NATIVE_TOKEN_SYMBOL ?? "",
  web3Provider: process.env.WEB3_PROVIDER ?? "",
  cronJobPeriod: process.env.CRON_JOB_PERIOD ?? "*/5 * * * * *",
  saftValidationCronJobPeriod:
    process.env.SAFT_VALIDATION_CRON_JOB_PERIOD ?? "0 1 * * *",
  twilioAccountSID: process.env.TWILIO_ACCOUNT_SID,
  twilioAouthToken: process.env.TWILIO_AUTH_TOKEN,
  googleServicePrivateKey: process.env.GOOGLE_SERVICE_PRIVATE_KEY ?? "",
  googleServiceClientEmail: process.env.GOOGLE_SERVICE_EMAIL ?? "",
};
export default env;
