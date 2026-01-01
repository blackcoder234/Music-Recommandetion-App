import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import User from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import sendEmail from "../utils/sendMail.js";
import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong when generate access and refresh token"
    );
  }
};

// Helper to generate a unique username from email when username is not provided
const generateUniqueUsernameFromEmail = async (email) => {
  const basePart =
    email
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "") || "user";
  let candidate = basePart;
  let suffix = 0;

  while (await User.exists({ username: candidate })) {
    suffix += 1;
    candidate = `${basePart}${suffix}`;
  }
  return candidate;
};

const registerUser = asyncHandler(async (req, res) => {
  const { email, password, fullName, username } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, "User already exists with this email");
  }

  let finalUsername = username?.trim().toLowerCase();
  if (!finalUsername) {
    finalUsername = await generateUniqueUsernameFromEmail(email);
  } else {
    const usernameTaken = await User.exists({ username: finalUsername });
    if (usernameTaken) {
      throw new ApiError(409, "Username is already taken");
    }
  }
  // Debugging logs
  // console.log("FILES:", req.files)
  // console.log("BODY:", req.body)

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  let avatarUrl = "";

  if (avatarLocalPath) {
    const avatarUpload = await uploadOnCloudinary(
      avatarLocalPath,
      "music_app/User_avatar"
    );
    avatarUrl = avatarUpload?.secure_url || avatarUpload?.url || "";
  }

  const user = await User.create({
    username: finalUsername,
    email,
    fullName,
    password,
    avatar: avatarUrl,
    authProvider: "email",
    isEmailVerified: false,
  });

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "Internal server error: registering the user");
  }

  // console.log(createdUser)

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .status(201)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        201,
        {
          user: createdUser,
          accessToken,
        },
        "User successfully registered and logged in!"
      )
    );
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.authProvider === "google") {
    throw new ApiError(
      400,
      "This account uses Google login. Please sign in with Google."
    );
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});


const googleAuth = asyncHandler(async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    throw new ApiError(400, "Google ID token is required");
  }

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  const email = payload?.email;
  const fullName = payload?.name;
  const avatarUrl = payload?.picture;

  if (!email) {
    throw new ApiError(400, "Google account does not have a valid email");
  }

  let user = await User.findOne({ email });

  if (!user) {
    const username = await generateUniqueUsernameFromEmail(email);

    user = await User.create({
      username,
      email,
      fullName,
      avatar: avatarUrl || "",
      authProvider: "google",
      isEmailVerified: true,
    });
  } else if (user.authProvider === "email") {
    // Email-based account: allow Google login but keep authProvider as "email"
    if (!user.avatar && avatarUrl) {
      user.avatar = avatarUrl;
    }
    user.isEmailVerified = true;
    await user.save({ validateBeforeSave: false });
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
        },
        "User authenticated with Google successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
  };

  return res
    .status(200)
    .clearCookie("accessToken", { ...options, maxAge: 0 })
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "Logged out successfully!"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorize request ");
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired");
    }

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    };
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, {
        ...options,
        maxAge: 2 * 24 * 60 * 60 * 1000,
      })
      .cookie("refreshToken", refreshToken, {
        ...options,
        maxAge: 10 * 24 * 60 * 60 * 1000,
      })
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken,
            expiresAt: Date.now() + 2 * 24 * 60 * 60 * 1000,
          },
          "Token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message, "Invalid Refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user?._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.authProvider !== "email") {
    throw new ApiError(
      400,
      "Password change is not available for Google login accounts"
    );
  }

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid Password");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password change successfully"));
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  // Check if the user exists
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(400, "User not found");
  }

  if (user.authProvider !== "email") {
    throw new ApiError(
      400,
      "This account uses Google login. Password reset is not available."
    );
  }

  const resetToken = jwt.sign(
    { userId: user._id },
    process.env.RESET_PASSWORD_SECRET,
    { expiresIn: "5m" }
  );
  const resetURL = `${process.env.FRONTEND_URL}/reset.password.html?token=${resetToken}`;
  await sendEmail(
    user.email,
    "Password Reset Request",
    `Click the link to reset your password: ${resetURL}`
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        "Password reset link sent to your email!! Please check your email"
      )
    );
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  const decode = jwt.verify(token, process.env.RESET_PASSWORD_SECRET);
  const user = await User.findById(decode.userId);

  if (!user) {
    throw new ApiError(400, "Invalid or expired token");
  }

  if (user.authProvider !== "email") {
    throw new ApiError(
      400,
      "This account uses Google login. Password reset is not available."
    );
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        "Password reset successful!! Please login with your new password"
      )
    );
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, username } = req.body;

  if (!fullName && !username) {
    throw new ApiError(
      400,
      "At least one field (fullName or username) is required"
    );
  }

  const updates = {};

  if (fullName) {
    updates.fullName = fullName;
  }

  if (username) {
    const normalizedUsername = username.toLowerCase();
    // Check uniqueness only if username is being changed
    const existingWithUsername = await User.findOne({
      username: normalizedUsername,
      _id: { $ne: req.user?._id },
    });
    if (existingWithUsername) {
      throw new ApiError(409, "Username is already taken");
    }
    updates.username = normalizedUsername;
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: updates,
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }
  const avatar = await uploadOnCloudinary(
    avatarLocalPath,
    "music_app/User_avatar"
  );
  if (!avatar?.secure_url && !avatar?.url) {
    throw new ApiError(400, "Error while uploading the avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.secure_url || avatar.url,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar is Updated Successfully"));
});

const deleteAccount = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }
  await User.findByIdAndDelete(userId);
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
  };
  return res
    .status(200)
    .clearCookie("accessToken", { ...options, maxAge: 0 })
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "Account deleted successfully"));
});

export {
  registerUser,
  loginUser,
  googleAuth,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  updateAccountDetails,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  updateUserAvatar,
  deleteAccount,
};
