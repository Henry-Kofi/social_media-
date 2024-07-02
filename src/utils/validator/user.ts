import { body, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";
import { customResponseCodes } from "../../response";
import multer from "multer";
import path from "path";
import {v4 as uuidv4} from 'uuid'

interface ValidationError {
  status:number;
  message: number;
}

export const loginValidator = [
  // for email
  body("email")
    .not()
    .isEmpty()
    .withMessage({status: 401,message:customResponseCodes.UNAUTHORIZED})
    .isEmail()
    .withMessage({status: 401,message:customResponseCodes.UNAUTHORIZED}),
  // for password
  body("password")
    .not()
    .isEmpty()
    .withMessage({status: 401,message:customResponseCodes.UNAUTHORIZED})
    .isLength({ min: 8, max: 16 })
    .withMessage({status: 401,message:customResponseCodes.UNAUTHORIZED})
    .matches(/[A-Z]/)
    .withMessage({status:404,message: customResponseCodes.UNSUCCESSFUL})
    .matches(/[^a-zA-Z0-9]/)
    .withMessage({status:404,message: customResponseCodes.UNSUCCESSFUL}),
  verificationFunc,
];

export const registerValidator = [
  // for email
  body("email")
    .not()
    .isEmpty()
    .withMessage({status: 401,message:customResponseCodes.UNAUTHORIZED})
    .isEmail()
    .withMessage({status: 401,message:customResponseCodes.UNAUTHORIZED}),
  // for phone number
  body("phone")
    .not()
    .isEmpty()
    .withMessage({status: 401,message:customResponseCodes.UNAUTHORIZED})
    .isMobilePhone("any", { strictMode: true })
    .withMessage({status: 401,message:customResponseCodes.UNAUTHORIZED}),
  // for password
  body("password")
    .not()
    .isEmpty()
    .withMessage({status: 401,message:customResponseCodes.UNAUTHORIZED})
    .isLength({ min: 8, max: 16 })
    .withMessage({status:404,message: customResponseCodes.UNSUCCESSFUL})
    .matches(/[A-Z]/)
    .withMessage({status:404,message: customResponseCodes.UNSUCCESSFUL})
    .matches(/[0-9]/)
    .withMessage({status:404,message: customResponseCodes.UNSUCCESSFUL})
    .matches(/[^a-zA-Z0-9]/)
    .withMessage({status:404,message: customResponseCodes.UNSUCCESSFUL}),

  verificationFunc,
];

export const verificationValidator = [
  // this could be a fault from the front end
  //  so we just return the error as it is.
  // would change it one everything works fine
  // body("email").not().isEmpty().withMessage(customResponseCodes.UNSUCCESSFUL),
  body("OTP").not().isEmpty().withMessage({status: 401,message:customResponseCodes.UNAUTHORIZED}),
  verificationFunc,
];

export const resetPassValidator = [
  // for password
    body("pass_new")
      .not()
      .isEmpty()
      .withMessage({status: 401,message:customResponseCodes.UNAUTHORIZED})
      .isLength({ min: 8, max: 16 })
      .withMessage({status:404,message: customResponseCodes.UNSUCCESSFUL})
      .matches(/[A-Z]/)
      .withMessage({status:404,message: customResponseCodes.UNSUCCESSFUL})
      .matches(/[0-9]/)
      .withMessage({status:404,message: customResponseCodes.UNSUCCESSFUL})
      .matches(/[^a-zA-Z0-9]/)
      .withMessage({status:404,message: customResponseCodes.UNSUCCESSFUL}),
  body("email")
    .not()
    .isEmpty()
    .withMessage({status: 401,message:customResponseCodes.UNAUTHORIZED})
    .isEmail()
    .withMessage({status: 401,message:customResponseCodes.UNAUTHORIZED}),

  verificationFunc,
];

export const optVerificationValidator = [
  body("email")
    .not()
    .isEmpty()
    .withMessage({status:401,message: customResponseCodes.UNAUTHORIZED})
    .isEmail()
    .withMessage({status: 401,message:customResponseCodes.UNAUTHORIZED}),
  verificationFunc,
];

function verificationFunc(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    let statusCode: number;
    const errorMessage: ValidationError = errors.array()[0].msg;
    return res.status(errorMessage.status).json({
      responseCode: errorMessage.message,
    });
  }
  next();
}

const storage = multer.diskStorage({
  destination: function(req:Request,file:Express.Multer.File,cb:CallableFunction){
    cb(null,path.join(__dirname,'..','..','data','profile'))
  },
  filename: (req:Request, file:Express.Multer.File, cb:CallableFunction) => {
    const extension: string = path.extname(file.originalname);  
    const tempFileName: string = "profile_"+Date.now().toString()+"_"+uuidv4()+extension;
      cb(null,tempFileName);
  },
})
const upload = multer({
  storage:storage,
  limits:{
    fileSize: 3 * 1024 * 1024  
  }
})
export default upload;