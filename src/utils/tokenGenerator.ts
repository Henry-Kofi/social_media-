import jwt from 'jsonwebtoken'
import { User } from '../models/user'

const JWT = {
    secretKey: "secret",
    jwtExp: "100d"
}

const newToken = (user: User) => {
    return jwt.sign({id: user._id}, JWT.secretKey,{
        expiresIn: JWT.jwtExp
    })
}

export interface Token{
    isValid: boolean;
    user?: string | jwt.JwtPayload
}
const verifyToken = (token:string): Promise<Token>=> { 
    return new Promise((resolve,reject) => {
        jwt.verify(token,JWT.secretKey,(err,payload) => {
            if(err) return resolve({isValid: false});
            resolve({isValid:true,user:payload});
        })
    })
}

export {newToken,verifyToken}