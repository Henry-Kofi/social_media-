import express from 'express'
import {
    createUser,
    login,
    verify,
    deleteUser,
    resetPassword,
    sendVerificationCodeViaEmail,
    update,
    followActivities
} from '../controller/user'

import upload, {
    loginValidator,
    registerValidator,
    verificationValidator,
    resetPassValidator,
    optVerificationValidator
} from '../utils/validator/user'

const authRoute = express.Router();

authRoute.post('/createUser', registerValidator, createUser);
authRoute.post('/login', loginValidator, login);
authRoute.put('/verify', verificationValidator, verify);
authRoute.put('/resetPassword', resetPassValidator, resetPassword);
authRoute.delete('/delete', deleteUser)
authRoute.post('/otp', optVerificationValidator, sendVerificationCodeViaEmail);
authRoute.put('/setting',upload.single('file'), update);
authRoute.put("/follow/:followee",followActivities);

export default authRoute;