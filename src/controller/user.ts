import { Request, Response, response } from "express";
import { userModel,User } from "../models/user";
import { VerificationRecordModel } from "../models/verification";
import fs from 'fs';
import {newToken,Token,verifyToken} from "../utils/tokenGenerator"
import bcryptjs from "bcryptjs";
import { sendMail } from "../utils/email";
import { getVerificationCode, getVerificationCode2 } from "../utils/index";
import { emailTemplate } from "../utils/emailTemplate";
import {
  clearScheduledEvent,
  getAwaitingEventData,
  scheduleEvent,
  scheduledEventExists,
  setAwaitingEventData,
} from "../utils/eventScheduler";
import { customResponseCodes } from "../response";
import { JwtPayload } from "jsonwebtoken";
import { startSession } from "mongoose";

export const createUser = async (req: Request, res: Response) => {
  const { email, phone, password } = req.body as {email: string, password: string, phone: string};
  const verificationCodeExpires = 5 * 60 * 1000;
  try {
    // Check if user exists in database
    const existingUser: User | null = await userModel.findOne({ _id: email });
    if (existingUser) {
      // User already exists
      
      return res.status(404).json({
        responseCode: customResponseCodes.UNSUCCESSFUL,
      });
    }

    // ==> Verify if user is the actual owner of this email by sendind a verification code to confirm

    // get verification code
    const emailVerificationCode = await getVerificationCode2({
      email: email,
      expires: verificationCodeExpires,
    });
    // Send verification code to verify email
    try{
      await sendMail({
        from: "Versess Musics<nyonyohenry3@gmail.com>",
        to: email,
        subject: "OTP VERIFICATION",
        html: emailTemplate(emailVerificationCode),
      });
    }catch(error){
      return res.status(404).json({
        responseCode: customResponseCodes.UNSUCCESSFUL
      })
    }

    const hashedPassword = await bcryptjs.hash(password, 12);
    // Set data to await user email verification
    // The process of registration shall be continued after user confirm email
    // Else, the data is set to be cleared 1 minute after the verification code expires
    setAwaitingEventData({
      eventName: `user:registration:${email}`,
      data: {
        phone: phone,
        password: hashedPassword,
        isVerified: true,
      },
      clearAfter: verificationCodeExpires + 1 * 60 * 1000, // Clear this data 1 minute after user's verification code expires
    });

    // Send a success respose to promt client that a verification code has be sent for verification
    return res.status(200).json({
      responseCode: customResponseCodes.SUCCESSFUL,
    });
  } catch (err: any) {
    // Right here, admins can be alerted about a fault on the server. LATER.
    return res.status(503).json({
      responseCode: customResponseCodes.SERVER_ERR,
    });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    // check if user exists with email and password
    const existingUser: User | null = await userModel.findOne({ _id: email });
    if (!existingUser) {
      return res.status(404).json({
        responseCode: customResponseCodes.UNSUCCESSFUL,
      });
    }

    // check if mail is verified
    if (!existingUser.isVerified) {
      return res.status(404).json({
        responseCode: customResponseCodes.UNSUCCESSFUL,
      });
    }

    const auth = await bcryptjs.compare(password, existingUser.password);
    // console.log("AUTH:", auth);
    if (!auth) {
      return res.status(404).json({
        responseCode: customResponseCodes.UNSUCCESSFUL,
      });
    }
    let token: string = await  newToken(existingUser)
    // return
    res.cookie("token",token)
    return res.status(200).json({
      responseCode: customResponseCodes.SUCCESSFUL,
    });
  } catch (err) {
    return res.status(503).json({
      responseCode: customResponseCodes.SERVER_ERR,
    });
  }
};

// Not necessary for now
// For dev purpose
export const deleteUser = async (req: Request, res: Response) => {
  // Get the email
  const { email } = req.body;
  try {
    // check if user exists
    const existingUser = await userModel.findOne({ _id: email });
    if (!existingUser) {
      return res.status(404).json({
        responseCode: customResponseCodes.UNSUCCESSFUL,
      });
    }
    // check if there is a profile url
    if (existingUser.profileUrl){
      await fs.promises.unlink(existingUser.profileUrl)
    }
    // delete the user
    await userModel.findOneAndDelete({ _id: email });
    return res.status(200).json({
      responseCode: customResponseCodes.SUCCESSFUL,
    });
  } catch (err) {
    console.log(err)
    return res.status(503).json({
      responseCode: customResponseCodes.SERVER_ERR,
    });
  }
};

export const verify = async (req: Request, res: Response) => {
  /**
   * todo ===>
   * implementing verification within 3 attempts
   */
  try {
    // We get get the otp from client
    // and check if fields are empty
    const { email, OTP } = req.body;
    // First, check if we are expecting a verification code from this user
    const scheduledEventProp = { eventName: `email:verification:${email}` };
    scheduledEventExists(scheduledEventProp);
    
    // First clear our scheduled verification record deletion
    clearScheduledEvent(scheduledEventProp);
    // Find the matching verification record
    let existingVerificationRecord: any = await VerificationRecordModel.findOne(
      { _id: email, code: OTP }
    );
    // console.log(existingVerificationRecord)
    if (!existingVerificationRecord) {
      // Wrong verification code
      const currentRecord:any = await VerificationRecordModel.findByIdAndUpdate(email,
      {$inc: {"attempts": -1}}
        )
      return res.status(404).json({
        responseCode: customResponseCodes.UNSUCCESSFUL,
        attemps: currentRecord.attempts
      });
    }
    // Check if user's data was awaiting this event to be registered
    const userAwaitingEventProp = { eventName: `user:registration:${email}` };
    const userAccountCreationData = getAwaitingEventData<{
      phone: number;
      paswword: string;
      isVerified: boolean;
    }>(userAwaitingEventProp);
    if (!userAccountCreationData) { //error
      // Go ahead and respond verification success
      res.status(200).json({
        responseCode: customResponseCodes.SUCCESSFUL,
      });
      // User is verified. Clear the verification record
      return await VerificationRecordModel.deleteOne({ _id: email });
    }
    // User is verified. Clear the verification record and add user to users' database
    await VerificationRecordModel.deleteOne({ _id: email });

    // Add user to the users collection in database
    const newUser = await userModel.create({
      _id: email,
      ...userAccountCreationData,
    });
    let token = await newToken(newUser);
    res.cookie("token",token)
    return res.status(200).json({
      responseCode: customResponseCodes.SUCCESSFUL,
      accountCreated: true,
    });
  } catch (error) {
    // Server error
    console.log(error)
    return res.status(503).json({
      responseCode: customResponseCodes.SERVER_ERR,
    });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const token = req.cookies.token;
  if(!token){
    return res.status(401).json({
      responseCode: customResponseCodes.UNAUTHORIZED
    })
  }
  const decodedToken: Token = await verifyToken(token)
  if (!decodedToken.isValid) {
    return res.status(401).json({
      responseCode: customResponseCodes.UNAUTHORIZED
    })
  }
  const { email, pass_new, pass_old } = req.body;
  if (pass_old) {
    // Trying to reset password => user has not forgotten pasword
    // At the moment, we have not reached this point yet

    // let's respond with server error if for any reason control has pass here. It won't though😁
    return res.status(503).json({
      responseCode: customResponseCodes.SERVER_ERR,
    });
  } else {
    // User has forgotten password => email verification must have been done earlier
    // TODO: what shows the user has verified email already?

    // check if user exists
    const existingUser = await userModel.findById(email)
    if(!existingUser){
      return res.status(404).json({
        responseCode: customResponseCodes.UNSUCCESSFUL
      })
    }
    let hashedPassword: string;
    try {
      hashedPassword = await bcryptjs.hash(pass_new, 12);
    } catch (error) {
      return res.status(503).json({
        responseCode: customResponseCodes.SERVER_ERR,
      });
    }
    try {
      await userModel.findOneAndUpdate(
        { _id: email },
        {
          password: hashedPassword,
          isVerified: true,
        }
      );
    } catch (error) {
      return res.status(403).json({
        responseCode: customResponseCodes.UNAUTHORIZED,
      });
    }
    return res.status(200).json({
      responseCode: customResponseCodes.SUCCESSFUL,
    });
  }
};

// Bismark please check this code for me ==>
// TypeError: Cannot read properties of undefined (reading 'email')

export const sendVerificationCodeViaEmail = async (
  req: Request,
  res: Response
) => {
  const { email } = req.body;
  try {
    // check if user exists
    const existingUser = await userModel.findOne({ _id: email });
    if (!existingUser) {
      return res.status(401).json({
        responseCode: customResponseCodes.UNAUTHORIZED,
      });
    }
    // now let get our verification otp
    const OTP = await getVerificationCode2({ email });
    // Send otp To Verify email
    sendMail({
      from: "Versess Musics<nyonyohenry3@gmail.com>",
      to: email,
      subject: "OTP VERIFICATION",
      html: emailTemplate(OTP),
    });
    return res.status(200).json({
      responseCode: customResponseCodes.SUCCESSFUL,
    });
  } catch (error) {
    return res.status(503).json({
      responseCode: customResponseCodes.SERVER_ERR,
    });
  }
};

export const update = async (req:Request,res:Response) => {
  const {name,link,email}:User = req.body;
  const file = req.file;
  const token = req.cookies.token;
  try {
    // let check for user
    if(!token){
      return res.status(401).json({
        responseCode: customResponseCodes.UNAUTHORIZED
      })
    }
    const user:User | null = await userModel.findOne({_id:email});
    if(!user){
      return res.status(404).json({
        responseCode: customResponseCodes.UNSUCCESSFUL
      })
    }
    if(file && user.profileUrl !== ""){
      // delete old profile first
      await fs.promises.unlink(user.profileUrl);
      const fileExists: boolean = await fs.promises.access(file.path,fs.constants.F_OK)  // check if file exists
            .then(()=>true)
            .catch(()=>false)
      if(fileExists){ 
        await userModel.findOneAndUpdate({_id:email},
          {
            _id: email,
            name: name,
            link: link,
            profileUrl: file.path,
            profile:{
              size:file.size,
              fileType:file.mimetype,
              fileName: file.originalname
            }
          })
      }else{
        console.log(2)
        return res.status(404).json({
          responseCode: customResponseCodes.UNSUCCESSFUL
        })
      }

    }else{
      await userModel.findOneAndUpdate({_id:email}, 
      {
        _id: email,
        name: name,
        link: link
      });
    }
    return res.status(200).json({
      responseCode: customResponseCodes.SUCCESSFUL,
      message: "User updated successfully"
    });
  } catch (error) {
    return res.status(503).json({
      responseCode: customResponseCodes.SERVER_ERR
    })
  }
}

export const followActivities = async (req:Request, res: Response) => {
  const {followee} = req.params
  // const token = req.cookies.token;
  const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImhueW9ueW8wMDFAc3QudWcuZWR1LmdoIiwiaWF0IjoxNzE0NzU3MDY5LCJleHAiOjE3MjMzOTcwNjl9.zlvGyfcnT5DmMgGa2oFaYAXHMI8lEFwEzke-3Qu8yI0"
  let follower: string;
  if(!token){
      return res.status(401).json({
          success: false,
          message: "Unauthorized access"
      })
  }
  try {
    const decodedToken: Token = await verifyToken(token);
        if(!decodedToken.isValid){
            return res.status(401).json({
                success: false,
                message: "Unautorized access"
            })
        }
        const userDetail= decodedToken.user as JwtPayload;
        follower = userDetail.id;
        const existingUser: User | null = await userModel.findOne({_id: followee});
        if (!existingUser) {
          return res.status(404).json({
            success: false,
            message: "User not found"
          })
        }
        if (follower === followee){
          return res.status(409).json({
              success:false,
              message:"You cannot follow yourself."
          })
        }
        const session = await startSession();
        const followingUser: boolean = existingUser.followers.some(obj => obj.follower === follower)
        if(followingUser){
          const unfollowUser: User | null = await userModel.findOneAndUpdate({_id: followee},
            {
              $pull:{
                followers:{
                  follower: follower
                }
              }
            },
            {new: true}
          )
          if(!unfollowUser){
            return res.status(400).json({
              success:false,
              message:`Failed to UnFollow  ${followee}.`
            })
          }
          await userModel.findOneAndUpdate({_id:follower},
            {
              $pull:{
                following:{
                  following: followee
                }
              }
            },
            {new: true}
          )
          return res.status(200).json({
            success:true,
            message: `Success unfollowing ${followee}`,
            followers: unfollowUser.followers.length
          })
        }
        const followUser: User | null = await userModel.findOneAndUpdate({_id:followee},
          {
            $push:{
              followers:{
                follower: follower
              }
            }
          },
          {new: true}
        )
        if(!followUser){
          return res.status(400).json({
            success: false,
            message: `Failed to follow the ${followee}.`
          })
        }
        await userModel.findOneAndUpdate({_id: follower},
          {
            $push: {
              following:{
                following: followee
              }
            }
          }
        )
        return res.status(200).json({
          success: true,
          message: `You are now following ${followee}`,
          followers: followUser.followers.length,
        })
  } catch (error) {
    return res.status(503).json({
      responseCode: customResponseCodes.SERVER_ERR
    })
  }
}