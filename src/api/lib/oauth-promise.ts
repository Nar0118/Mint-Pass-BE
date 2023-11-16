import env from "../../util/constants/env";
import { OAuth } from "oauth";

var oauthCallback = env.oauthTwitterCallback;
const consumerKey = env.twitterConsumerKey;
const consumerSecret = env.twitterConsumerSecret;
const oauthConsumer = new OAuth(
  "https://twitter.com/oauth/request_token",
  "https://twitter.com/oauth/access_token",
  consumerKey,
  consumerSecret,
  "1.0A",
  oauthCallback,
  "HMAC-SHA1"
);

export const getOAuthRequestToken = () => {
  return new Promise<{
    oauthRequestToken: string;
    oauthRequestTokenSecret: string;
    results;
  }>((resolve, reject) => {
    oauthConsumer.getOAuthRequestToken(
      (error, oauthRequestToken, oauthRequestTokenSecret, results) => {
        if (error) {
          reject(error);
        } else {
          resolve({ oauthRequestToken, oauthRequestTokenSecret, results });
        }
      }
    );
  });
};

export const getOAuthAccessToken = ({
  oauthRequestToken,
  oauthRequestTokenSecret,
  oauthVerifier,
}) => {
  return new Promise<{
    oauthAccessToken: string;
    oauthAccessTokenSecret: string;
    results;
  }>((resolve, reject) => {
    oauthConsumer.getOAuthAccessToken(
      oauthRequestToken,
      oauthRequestTokenSecret,
      oauthVerifier,
      (error, oauthAccessToken, oauthAccessTokenSecret, results) => {
        if (error) {
          reject(error);
        } else {
          resolve({ oauthAccessToken, oauthAccessTokenSecret, results });
        }
      }
    );
  });
};

export const getProtectedResource = (
  url,
  method,
  oauthAccessToken,
  oauthAccessTokenSecret
) => {
  return new Promise<{ data; response }>((resolve, reject) => {
    oauthConsumer.getProtectedResource(
      url,
      method,
      oauthAccessToken,
      oauthAccessTokenSecret,
      (error, data, response) => {
        if (error) {
          reject(error);
        } else {
          resolve({ data, response });
        }
      }
    );
  });
};
