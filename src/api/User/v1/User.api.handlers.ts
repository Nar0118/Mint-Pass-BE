import { Request, Response } from "express";
import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import * as googleAuth from "google-auth-library";
import { User, UserRoles } from "../../../models/User";
import { Invitation } from "../../../models/Invitation";
import { Investment } from "../../../models/Investment";
import {
  MailOptions,
  sendEmail,
} from "../../../util/email/email.util.nodemailer";
import env from "../../../util/constants/env";
import { axiosInstance } from "../../../util/yousign/saft.util.yousign";
import { createJWTToken } from "../../../util/token/token.util";
import { HttpStatusCodes } from "../../../util/enums/httpStatusCode";
import {
  dateParser,
  fifteenMinutesInMilliseconds,
  timeDifference,
} from "../../../util/helpers";
import {
  getOAuthAccessToken,
  getOAuthRequestToken,
  getProtectedResource,
} from "../../lib/oauth-promise";

const googleClient = new googleAuth.OAuth2Client(env.clientId);
const SECRET_JWT_CODE = env.secretJwtCode;

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { startIndex, limit } = req.pagination;

    const usersCount = await User.collection.countDocuments();
    const data = await User.find().skip(startIndex).limit(limit);

    return res.status(HttpStatusCodes.OK).json({ data, count: usersCount });
  } catch (err) {
    return res
      .status(HttpStatusCodes.NOT_FOUND)
      .json({ success: false, error: err });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, surname, email, password, role } = req.body;

    const isUserExist = await User.findOne({
      email,
    });

    if (isUserExist) {
      return res
        .status(HttpStatusCodes.CONFLICT)
        .json({ success: false, message: `${email} already exist` });
    }

    const user = await User.create({
      name,
      surname,
      email,
      password: bcrypt.hashSync(password, 10),
      role,
    });

    return res.status(HttpStatusCodes.CREATED).json({
      success: true,
      message: `${email} successfully created`,
      data: user,
    });
  } catch (err) {
    return res
      .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: err.message });
  }
};

export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const user = req["user"];

    if (!user) {
      return res
        .status(HttpStatusCodes.NOT_FOUND)
        .json({ success: false, error: "User does not exist!" });
    }

    return res.status(HttpStatusCodes.OK).json({ success: true, data: user });
  } catch (err) {
    return res
      .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, error: err });
  }
};

export const updateCurrentUser = async (req: Request, res: Response) => {
  try {
    const user = req["user"];

    user.name = req.body.firstName || user.name;
    user.surname = req.body.lastName || user.surname;
    user.bio = req.body.bio;
    user.twitterLink = req.body.twitterLink;
    user.instagramLink = req.body.instagramLink;
    user.discordLink = req.body.discordLink;
    user.imageUrl = req.body.imageUrl || user.imageUrl;

    await user.save();
    return res.status(HttpStatusCodes.OK).json({ success: true, user: user });
  } catch (err) {
    return res
      .status(HttpStatusCodes.NOT_FOUND)
      .json({ success: false, error: err });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await User.deleteOne({ _id: id });

    return res.status(HttpStatusCodes.NO_CONTENT).json({ success: true });
  } catch (err) {
    return res
      .status(HttpStatusCodes.NOT_FOUND)
      .json({ success: false, error: err });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const user = req["user"];

    if (!user) {
      return res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ success: false, message: "Invalid Token" });
    }

    req["user"] = null;

    return res
      .status(HttpStatusCodes.NO_CONTENT)
      .json({ success: true, message: "user logout successfully" });
  } catch (err) {
    return res
      .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, error: err });
  }
};

export const signup = async (req: Request, res: Response) => {
  const { email, password, firtsName, lastName, referralCode } = req.body;

  if (!email || !password) {
    return res.status(HttpStatusCodes.BAD_REQUEST).json({
      success: false,
      error: "Submit all required parameters",
    });
  }

  try {
    const registeredUser = await User.findOne({ email }).select("+password");
    if (registeredUser) {
      return res
        .status(HttpStatusCodes.CONFLICT)
        .json({ success: false, error: "You already have account" });
    }

    const user = await User.create({
      email,
      name: firtsName,
      surname: lastName,
      password: bcrypt.hashSync(password, 10),
    });

    const token = jwt.sign({ id: user._id, email: email }, SECRET_JWT_CODE);

    const mailOptions: MailOptions = {
      to: email,
      subject: "You have successfully registered",
      text: "Welcome to Passphrase",
    };

    await sendEmail(mailOptions);

    if (user && referralCode) {
      const invitingUser = await User.findOne({
        referralCode,
      });

      if (invitingUser) {
        await Invitation.create({
          sender: invitingUser._id,
          recipient: email,
          referralCode,
        });
      }
    }

    return res
      .status(HttpStatusCodes.CREATED)
      .json({ success: true, token, user });
  } catch (err) {
    return res
      .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, error: err });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(HttpStatusCodes.BAD_REQUEST).json({
      success: false,
      error: "Submit all required parameters",
    });
  }

  try {
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(HttpStatusCodes.NOT_FOUND).json({
        success: false,
        error: `Account with ${email} doesn't exist`,
      });
    }

    if (!bcrypt.compareSync(password, user.password)) {
      return res
        .status(HttpStatusCodes.UNAUTHORIZED)
        .json({ success: false, error: "Wrong password" });
    }

    // if (!!user.enable2fa) {
    //   const result = await send2FACode(user);

    //   if (!result.success) {
    //     return res.json(result);
    //   }

    //   const userData = {
    //     user: {
    //       enable2FA: user.enable2fa,
    //       phoneNumber: user.phoneNumber,
    //     },
    //   };

    //   return res.json({
    //     success: true,
    //     userData,
    //   });
    // }
    user.password = undefined;
    const token = await createJWTToken(user);

    return res
      .status(HttpStatusCodes.OK)
      .json({ success: true, userData: { token, user } });
  } catch (err) {
    return res
      .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, error: err });
  }
};

// const send2FACode = async (user: any) => {
//   try {
//     const twoFACode = Math.floor(1000 + Math.random() * 9000);

//     user.twoFaCode = { code: twoFACode, sendedAt: new Date(), isUsed: false };
//     await user.save();

//     await sendSMS({
//       message: `Your 2FA code is: ${twoFACode}`,
//       phoneNumber: user.phoneNumber,
//     });

//     return { success: true, message: "Successfully Sent!" };
//   } catch (err) {
//     return { success: false, error: err };
//   }
// };

// export const resend2FA = async (req: Request, res: Response) => {
//   try {
//     const { phoneNumber } = req.body;

//     const user = await User.findOne({ phoneNumber });

//     const result = await send2FACode(user);

//     return res.json(result);
//   } catch (err) {
//     return res.json({ success: false, error: err });
//   }
// };

// export const pass2FA = async (req: Request, res: Response) => {
//   try {
//     const { phoneNumber, code } = req.body;

//     if (!phoneNumber || !code) {
//       return res.json({
//         success: false,
//         error: "Submit all required parameters",
//       });
//     }

//     const user = await User.findOne({ phoneNumber });

//     if (!user) {
//       return res.json({
//         success: false,
//         error: "User doesn't exist",
//       });
//     }

//     if (user?.twoFaCode?.code == code) {
//       if (!!user?.twoFaCode?.isUsed) {
//         return res.json({ success: false, error: "Code already used!" });
//       }

//       if (
//         timeDifference(new Date(), new Date(user?.twoFaCode?.sendedAt)) >=
//         fifteenMinutesInMilliseconds
//       ) {
//         return res.json({
//           success: false,
//           error: "Time limit exceeded. Please try again!",
//         });
//       }

//       user.twoFaCode = {
//         code: user.twoFaCode.code,
//         senedAt: user.twoFaCode.sendedAt,
//         isUsed: true,
//       };

//       await user.save();

//       const token = await createJWTToken(user);
//       return res.json({ success: true, userData: { token, user } });
//     } else {
//       return res.json({ success: false, error: "Incorrect Code" });
//     }
//   } catch (err) {
//     res.json({ success: false, error: err });
//   }
// };

export const loginForAdmin = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(HttpStatusCodes.BAD_REQUEST).json({
      success: false,
      error: "Submit all required parameters",
    });
  }

  try {
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(HttpStatusCodes.NOT_FOUND).json({
        success: false,
        error: `Account with ${email} doesn't exist`,
      });
    }

    if (user.role !== UserRoles.ADMIN) {
      return res.status(HttpStatusCodes.FORBIDDEN).json({
        success: false,
        error: `Only admin can log in to the Admin dashboard`,
      });
    }

    if (!bcrypt.compareSync(password, user.password)) {
      return res
        .status(HttpStatusCodes.UNAUTHORIZED)
        .json({ success: false, error: "Wrong password" });
    }

    user.password = undefined;

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      SECRET_JWT_CODE
    );

    return res
      .status(HttpStatusCodes.OK)
      .json({ success: true, userData: { token, user } });
  } catch (err) {
    return res
      .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, error: err });
  }
};

export const signupByGoogle = async (req: Request, res: Response) => {
  try {
    const { googleToken } = req.body;

    if (!googleToken) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        success: false,
        error: "Token is empty",
      });
    }

    const googleResponse = await googleClient.verifyIdToken({
      idToken: googleToken,
      audience: env.clientId,
    });

    const { name, email, picture } = googleResponse.getPayload();

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(HttpStatusCodes.CONFLICT).json({
        success: false,
        error: `${email} has already been registered`,
      });
    }

    const newUser = await User.create({
      email,
      authenticatedByGoogle: true,
    });

    const token = jwt.sign({ id: newUser._id, email }, SECRET_JWT_CODE);

    return res
      .status(HttpStatusCodes.CREATED)
      .json({ success: true, token, user: newUser });
  } catch (err) {
    return res
      .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, error: err });
  }
};

export const loginByGoogle = async (req: Request, res: Response) => {
  try {
    const { googleToken } = req.body;

    if (!googleToken) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        success: false,
        error: "Token is empty",
      });
    }

    const googleResponse = await googleClient.verifyIdToken({
      idToken: googleToken,
      audience: env.clientId,
    });

    const { email } = googleResponse.getPayload();

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      const token = jwt.sign({ id: existingUser._id, email }, SECRET_JWT_CODE);

      return res.status(HttpStatusCodes.OK).json({
        email,
        success: true,
        existingUser,
        token,
      });
    }

    return res.status(HttpStatusCodes.NOT_FOUND).json({
      success: false,
      error: `There is no account for ${email}`,
    });
  } catch (err) {
    return res
      .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, error: err });
  }
};

const hashPassword = (
  password: string,
  saltRounds = 10
): Promise<{
  isUpdated: boolean;
  hashedPassword: string;
}> => {
  if (!password) {
    throw new Error("No password available in the instance");
  }

  return bcrypt.hash(password, saltRounds).then((hashedPassword) => {
    return {
      isUpdated: true,
      hashedPassword,
    };
  });
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const currentUser = req["user"];
    const { oldPassword, newPassword } = req.body;

    const dbUser = await User.findById(currentUser.id).select("+password");

    const isSame = await bcrypt.compare(oldPassword, dbUser.password);

    if (!isSame) {
      return res
        .status(HttpStatusCodes.UNAUTHORIZED)
        .json({ success: false, error: "Wrong password" });
    }

    const newHash = await hashPassword(newPassword);
    dbUser.password = newHash.hashedPassword;
    await dbUser.save();

    dbUser.password = undefined;

    const mailOptions: MailOptions = {
      to: currentUser.email,
      subject: "You have successfully changed your password!",
      text: "Change Password Alert",
    };

    await sendEmail(mailOptions);

    return res.status(HttpStatusCodes.NO_CONTENT).json({ success: true });
  } catch (err) {
    return res
      .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, error: err });
  }
};

export const updateUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, surname, email, role, primaryWalletAddress } = req.body;

    const user = await User.findById(id);

    if (!user) {
      return res
        .status(HttpStatusCodes.NOT_FOUND)
        .json({ success: false, error: "User does not exist!" });
    }

    user.name = name;
    user.surname = surname;
    user.email = email;
    user.role = role;
    user.primaryWalletAddress = primaryWalletAddress;

    await user.save();
    return res.status(HttpStatusCodes.OK).json({ success: true, data: user });
  } catch (err) {
    return res
      .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, error: err });
  }
};

export const inviteFriends = async (req: Request, res: Response) => {
  try {
    const user = req["user"];
    const { toEmail } = req.body;

    if (!toEmail) {
      return res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ success: false, error: "Send email" });
    }

    if (user.email === toEmail) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        success: false,
        error: "You can't send invitation to your email",
      });
    }

    const isExistUser = await User.findOne({
      email: toEmail,
    });

    if (isExistUser) {
      return res.status(HttpStatusCodes.CONFLICT).json({
        success: false,
        error: `${toEmail} is already registered`,
      });
    }

    const mailOptions: MailOptions = {
      from: user.email,
      to: toEmail,
      subject: "Please join to PassPad",
      html: `<div>
                <div>It will be very interesting</div>
                  <div>
                    <a href=${env.deployedFrontendUrl}signup?referralCode=${user.referralCode} target="_blank">
                    ${user.email} invited you to join PassPad
                    </a>
                  </div>
               </div>`,
    };

    await sendEmail(mailOptions);

    return res.status(HttpStatusCodes.OK).json({
      success: true,
      message: `It was successfully sent to ${toEmail}`,
    });
  } catch (err) {
    return res
      .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, error: err });
  }
};

export const getUserReferrals = async (req: Request, res: Response) => {
  try {
    const user = req["user"];
    const { startIndex, limit } = req.pagination;

    const currentUserInvitationsCount = await Invitation.collection.countDocuments(
      { sender: user._id }
    );

    const invitations = await Invitation.find({
      sender: user._id,
    })
      .skip(startIndex)
      .limit(limit);

    return res.status(HttpStatusCodes.OK).json({
      success: true,
      data: invitations,
      countForUser: currentUserInvitationsCount,
    });
  } catch (err) {
    return res
      .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, error: err });
  }
};

export const getReferredUserWallet = async (req: Request, res: Response) => {
  try {
    const user = req["user"];

    const invitation = await Invitation.findOne({
      recipient: user.email,
    })
      .populate("sender")
      .exec();

    if (invitation?.sender.walletAddresses)
      return res.status(HttpStatusCodes.OK).json({
        success: true,
        data:
          invitation.sender.walletAddresses[
            invitation.sender.walletAddresses.length - 1
          ],
      });
    else
      return res.status(HttpStatusCodes.NO_CONTENT).json({
        success: true,
        data: null,
      });
  } catch (err) {
    return res
      .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, error: err.message });
  }
};

export const getUserInvestments = async (req: Request, res: Response) => {
  try {
    const user = req["user"];

    const { startIndex, limit } = req.pagination;

    const filter = {
      userId: user._id,
    };

    const usersInvestmentsCount = await Investment.collection.countDocuments(
      filter
    );

    // This logic should be changed in the future
    let totalInvestment = 0;
    await Investment.find(filter, (err, investments) => {
      if (err) {
        return res
          .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
          .json({ success: false, error: err });
      }

      investments.forEach((investment: any) => {
        totalInvestment += investment.amountInvested;
      });
    });

    const userInvestments = await Investment.find(filter)
      .sort({ investmentDate: -1 })
      .skip(startIndex)
      .limit(limit)
      .populate("fundingPoolId")
      .exec();

    return res.status(HttpStatusCodes.OK).json({
      success: true,
      data: userInvestments,
      count: usersInvestmentsCount,
      totalInvestment,
    });
  } catch (err) {
    return res
      .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, error: err });
  }
};

export const sendRecoverPasswordEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        success: false,
        error: "Please send email",
      });
    }

    const user = await User.findOne({
      email,
    });

    if (!user) {
      return res.status(HttpStatusCodes.NOT_FOUND).json({
        success: false,
        error: `There is no user with ${email} email`,
      });
    }

    const emailVerificationToken = jwt.sign(
      { id: user._id, email },
      SECRET_JWT_CODE
    );

    const mailOptions: MailOptions = {
      to: email,
      subject: "Recover Password",
      html: `<div>
              <div>Visit this link to recover your password</div>
              <div>
                <a href=${env.deployedFrontendUrl}/newPassword?emailVerificationToken=${emailVerificationToken} target="_blank">
                  Recover Password
                </a>
              </div>
             </div>`,
    };

    await sendEmail(mailOptions);

    user.emailVerificationToken = emailVerificationToken;
    await user.save();

    return res.status(HttpStatusCodes.OK).json({
      success: true,
      emailVerificationToken: user.emailVerificationToken,
      message: `It was successfully sent to ${email}`,
    });
  } catch (err) {
    return res
      .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, error: err });
  }
};

export const twitter = async (req: Request, res: Response) => {
  const io = req.app.get("socketio");
  try {
    const {
      oauthRequestToken,
      oauthRequestTokenSecret,
    } = await getOAuthRequestToken();
    req.session.oauthRequestToken = oauthRequestToken;
    req.session.oauthRequestTokenSecret = oauthRequestTokenSecret;
    req.session.socketId = req.query.socketId;
    req.session.signUp = req.query.signUp.toString();
    const authorizationUrl = `https://api.twitter.com/oauth/authenticate?oauth_token=${oauthRequestToken}`;
    res.redirect(authorizationUrl);
  } catch (err) {
    const response = { success: false, error: err };
    io.in(req.session.socketId).emit("user", response);
    res.end();
  }
};

export const twitterCallback = async (req: Request, res: Response) => {
  const io = req.app.get("socketio");
  let response;
  try {
    const { oauthRequestToken, oauthRequestTokenSecret } = req.session;
    const { oauth_verifier: oauthVerifier } = req.query;
    const {
      oauthAccessToken,
      oauthAccessTokenSecret,
    } = await getOAuthAccessToken({
      oauthRequestToken,
      oauthRequestTokenSecret,
      oauthVerifier,
    });
    req.session.oauthAccessToken = oauthAccessToken;
    const { data } = await getProtectedResource(
      "https://api.twitter.com/1.1/account/verify_credentials.json?include_email=true",
      "GET",
      oauthAccessToken,
      oauthAccessTokenSecret
    );
    const userData = JSON.parse(data);
    const userEmail = userData.email;
    const twitterId = userData.id_str;
    if (userEmail == "") {
      response = {
        success: false,
        error: "User do not have email linked with Twitter",
      };
      io.in(req.session.socketId).emit("user", response);
      return res.end();
    }

    const twitterConnectedUser = await User.findOne({ twitterId });
    const emailRegisteredUser = await User.findOne({ email: userEmail });
    if (emailRegisteredUser == null) {
      const user = await User.create({
        email: userEmail,
        twitterId: twitterId,
        authenticatedByTwitter: true,
      });
      const token = jwt.sign(
        { id: user._id, email: userEmail },
        SECRET_JWT_CODE
      );
      response = { success: true, token: token, userData: user };
      io.in(req.session.socketId).emit("user", response);
      return res.end();
    } else if (twitterConnectedUser == null) {
      emailRegisteredUser.twitterId = twitterId;
      await emailRegisteredUser.save();
    } else if (req.session.signUp == "true" && twitterConnectedUser) {
      response = { success: false, error: "user already registered" };
      io.in(req.session.socketId).emit("user", response);
    }
    const token = jwt.sign(
      {
        id: emailRegisteredUser._id,
        email: emailRegisteredUser.email,
        role: emailRegisteredUser.role,
      },
      SECRET_JWT_CODE
    );
    response = { success: true, token: token, userData: emailRegisteredUser };
    io.in(req.session.socketId).emit("user", response);
    return res.end();
  } catch (err) {
    response = { success: false, error: err.message };
    io.in(req.session.socketId).emit("user", response);
    return res.end();
  }
};

export const updateForgottenPassword = async (req: Request, res: Response) => {
  try {
    const { newPassword, emailVerificationToken } = req.body;

    if (!newPassword || !emailVerificationToken) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        success: false,
        error: "Send password and emailVerificationToken",
      });
    }

    const user = await User.findOne({
      emailVerificationToken,
    }).select("+password");

    if (!user) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        success: false,
        error: "Wrong token",
      });
    }

    const newHash = await hashPassword(newPassword);
    user.password = newHash.hashedPassword;

    await user.save();
    user.password = undefined;

    return res.status(HttpStatusCodes.OK).json({
      success: true,
      message: "Password successfully updated",
    });
  } catch (err) {
    return res
      .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, error: err.message });
  }
};

export const downloadSaft = async (req: Request, res: Response) => {
  const { fileId } = req.body;

  try {
    const response = await axiosInstance.get(`${fileId}/download`);
    if (!response.data) {
      return res.status(HttpStatusCodes.NOT_FOUND).json({
        success: false,
        message: "No Saft pdf found for these investment",
      });
    }
    const base64Pdf = response.data;

    return res.status(HttpStatusCodes.OK).json({
      success: true,
      data: base64Pdf,
      message: "Saft pdf downloaded successfully",
    });
  } catch (err) {
    return res
      .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, error: err, message: err.message });
  }
};

export const updateWallet = async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.body;
    const user = req["user"];
    const isWalletExist = user.walletAddresses.includes(walletAddress);
    if (!isWalletExist) {
      if (!user.primaryWalletAddress) {
        user.primaryWalletAddress = walletAddress;
      }
      await user.walletAddresses.push(walletAddress);
      await user.save();
    }

    return res.status(HttpStatusCodes.OK).send(user);
  } catch (err) {
    return res
      .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, error: err });
  }
};

export const deleteWallet = async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.body;
    const user = req["user"];
    const isWalletExist = user.walletAddresses.includes(walletAddress);

    if (!isWalletExist) {
      return res
        .status(HttpStatusCodes.NOT_FOUND)
        .json({ success: false, error: "Wallet does not exist!" });
    }

    const wallets = [...user.walletAddresses];

    wallets.splice([...user.walletAddresses].indexOf(walletAddress), 1);

    user.walletAddresses = wallets;

    if (
      !!user.primaryWalletAddress &&
      user.primaryWalletAddress == walletAddress
    ) {
      user.primaryWalletAddress = wallets[wallets.length - 1] ?? null;
    }

    await user.save();

    return res.status(HttpStatusCodes.OK).json({ success: true, user });
  } catch (err) {
    return res
      .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, error: err });
  }
};

export const userValidationCheckingByEmail = async (
  req: Request,
  res: Response
) => {
  try {
    const { email } = req.params;
    const user = req["user"];

    const emailChecking = user.email === email;

    return res.status(HttpStatusCodes.OK).json({
      success: emailChecking,
      message: emailChecking ? "Success" : "Wrong Email",
    });
  } catch (err) {
    return res
      .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, error: err });
  }
};

export const getUserWallet = async (req: Request, res: Response) => {
  try {
    const user = req["user"];

    return res.status(HttpStatusCodes.OK).json({
      success: true,
      walletAddresses: user.walletAddresses,
    });
  } catch (err) {
    return res
      .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, error: err });
  }
};

export const startKYC = async (req: Request, res: Response) => {
  try {
    const user = req["user"];

    const kycResult = await axiosInstance.post(
      env.kycStartUrl,
      {
        requestData: {
          emailAddress: user.email,
        },
        flowData: {
          language: "en",
        },
      },
      {
        headers: {
          "content-type": "application/json",
          "x-api-key": env.sandboxTokenKyc,
        },
      }
    );

    const kycIdentificationId = kycResult.data.identificationId;

    if (!kycIdentificationId) {
      return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "identificationId was not generated",
      });
    }

    user.identificationId = kycIdentificationId;
    await user.save();

    return res
      .status(HttpStatusCodes.OK)
      .json({ success: true, data: kycResult.data });
  } catch (err) {
    return res
      .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, error: err });
  }
};

export const searchUsers = async (req: Request, res: Response) => {
  try {
    let filterOfBooleans = {};
    let filteredObj;
    Object.keys(req.query).forEach((elem) => {
      if (
        (req.query[elem].length &&
          elem !== "limit" &&
          elem !== "offset" &&
          req.query[elem] !== "undefined") ||
        elem === "email"
      )
        filteredObj = { ...filteredObj, [elem]: req.query[elem] };
    });

    for (const i in filteredObj) {
      if (filteredObj[i] === "false" || filteredObj[i] === "true") {
        filterOfBooleans = {
          $or: [{ kycPassed: filteredObj[i] }],
        };
      } else {
        filteredObj[i] = { $regex: filteredObj[i] };
      }
    }

    const { startIndex, limit } = req.pagination;

    const filter = {
      ...filterOfBooleans,
      ...filteredObj,
    };

    const data = await User.find(filter).skip(startIndex).limit(limit);

    const count = await User.find(filter).count();

    return res.status(HttpStatusCodes.OK).json({ data, count, success: true });
  } catch (err) {
    return res
      .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, error: err.message });
  }
};

export const getKycMedia = async (req: Request, res: Response) => {
  try {
    const { identificationId } = req.params;
    const user = await User.findOne({ identificationId });

    if (!user) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        success: false,
        message: `${user.email} user identificationId is not valid`,
      });
    }

    if (!user.kycPassed) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        success: false,
        message: `${user.email} user not passed KYC`,
      });
    }

    const media = await axiosInstance.get(
      `https://sandbox-kycapi.ondato.com/identifications/${identificationId}/media`,
      {
        headers: {
          "content-type": "application/json",
          "x-api-key": env.sandboxTokenKyc,
        },
      }
    );

    return res
      .status(HttpStatusCodes.OK)
      .json({ success: true, data: media.data });
  } catch (err) {
    return res
      .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: err.message });
  }
};

export const getKycDocument = async (req: Request, res: Response) => {
  try {
    const user = req["user"];

    if (!user.kycPassed) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        success: false,
        message: `${user.email} user not passed KYC`,
      });
    }

    const document = await axiosInstance.post(
      "https://sandbox-kycapi.ondato.com/get-data",
      {
        apikey: env.sandboxTokenKyc,
        token: user.identificationId,
      }
    );

    const {
      firstName,
      lastName,
      country,
      nationality,
    } = document.data.documentData;

    const data = await User.findOneAndUpdate(
      {
        identificationId: user.identificationId,
      },
      {
        name: firstName,
        surname: lastName,
        country,
        nationality,
      }
    );

    return res.status(HttpStatusCodes.OK).json({ success: true, data });
  } catch (err) {
    return res
      .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: err.message });
  }
};
