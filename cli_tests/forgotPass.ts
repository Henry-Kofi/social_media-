import 'dotenv/config'
import Input from '@inquirer/input'
import Prompt from "@inquirer/prompts"
import Password from '@inquirer/password'
import axios from 'axios';
import {customResponseCodes} from '../src/response'

import VerifyOTP from './verifyCode';
import getOTP from './getOTP';

const PORT = process.env.PORT

export default async function forgotPassword() {
    let { email } = {
        email: await Input({
            message: 'Enter email address',
        })
    }
    
    // let data: {responseCode:number} = {responseCode: customResponseCodes.UNSUCCESSFUL}
    const data = await getOTP({email})
    
    if(data.responseCode !== customResponseCodes.SUCCESSFUL){
        console.log("something went wrong")
    }
    const result = await VerifyOTP({email})
    if(result.responseCode !== customResponseCodes.SUCCESSFUL){
        console.log("something went wrong")
    }
    let {password,confirmPassword} = {
        password : await Input({
            message:'Enter new password'
        }),
        confirmPassword: await Password({
            message: "Confirm password",
        })
    }
    while(password!==confirmPassword){
        confirmPassword = await Password({
            message: "Confirm password",
        })
    }
    let data1: {responseCode:number} = {responseCode: customResponseCodes.UNSUCCESSFUL}
    while (data1.responseCode !== customResponseCodes.SUCCESSFUL) {
        const result = await axios.put<{responseCode:number}>(`http://localhost:${PORT}/api/user/resetPassword`,{
            email:email,
            pass_new:password, 
            pass_old: null
        },{
            headers:{
                "Content-Type":"application/json"
            }
        })
        data1 = result.data;

        console.log(data)
        if(data1.responseCode === customResponseCodes.SUCCESSFUL){
            console.log("Password reset successful")
            return
        }
        console.log("OOps! Something went wrong. Try again later.")
        
    }
}