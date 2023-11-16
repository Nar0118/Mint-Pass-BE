import { NextFunction, Request, Response } from "express";
import { User, UserRoles } from "../models/User";
import { decodeJwtToken, TokenTypes } from "../util/token/token.util";
import { HttpStatusCodes } from "../util/enums/httpStatusCode";

/**
 * Higher order function that can take a TokenType and returns
 * the middleware function
 */
export const requireAuthHOF = (tokenType: TokenTypes) => async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  let token: string;

  if (
    req.headers.authorization &&
    req.headers.authorization.split(" ")[0] === "Bearer"
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.query && req.query.token) {
    token = req.query.token as string;
  } else {
    return res
      .status(HttpStatusCodes.BAD_REQUEST)
      .json({ error: "Missing or invalid token" });
  }

  try {
    const decodedToken = await decodeJwtToken(token, tokenType);

    req["decodedToken"] = decodedToken;
    req["user"] = await User.findById(decodedToken.id);

    if (!req["user"]) {
      // token considered invalid if no user can be found
      // in the database that is associated to it
      return res
        .status(HttpStatusCodes.NOT_FOUND)
        .json({ error: "User does not exist!" });
    }

    return next();
  } catch (decodeError) {
    return res
      .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: decodeError });
  }
};

/**
 * Higher order function that can take a TokenType and returns
 * the middleware function for Admin
 */
export const requireAuthHOFAdmin = (tokenType: TokenTypes) => async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  let token: string;

  if (
    req.headers.authorization &&
    req.headers.authorization.split(" ")[0] === "Bearer"
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.query && req.query.token) {
    token = req.query.token as string;
  } else {
    return res
      .status(HttpStatusCodes.BAD_REQUEST)
      .json({ success: false, error: "Missing or invalid token" });
  }

  try {
    const decodedToken = await decodeJwtToken(token, tokenType);

    req["decodedToken"] = decodedToken;
    req["user"] = await User.findById(decodedToken.id);

    if (!req["user"]) {
      // token considered invalid if no user can be found
      // in the database that is associated to it
      return res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ success: false, error: "User does not exist!" });
    }

    if (req["user"].role !== UserRoles.ADMIN) {
      return res.status(HttpStatusCodes.FORBIDDEN).json({
        success: false,
        error:
          "Access Denied: You do not have correct privilege to perform this operation",
      });
    }

    return next();
  } catch (decodeError) {
    return res
      .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, error: decodeError });
  }
};

/**
 * This method replicates what is being done using 'express-jwt' package
 * in the method above (authMiddleware) but using only the 'jsonwebtoken'
 * package. It is intended to replace the method above.
 *
 * It also does more than the method above since it will also attach
 * the full user object from the DB.
 */
export const requireAuth = requireAuthHOF(TokenTypes.AUTH);
export const requireAuthAdmin = requireAuthHOFAdmin(TokenTypes.AUTH);
