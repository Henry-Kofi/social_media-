

import 'dotenv/config';
import Input from '@inquirer/input'
import Password from '@inquirer/password'
import axios from 'axios';
import {customResponseCodes} from '../src/response'
import VerifyOTP from './verifyCode';

const PORT = process.env.PORT

export default async function SignUp(){

    let { email, phone, password, confirmPassword } = {
        email: await Input({
            message: 'Enter email address',
        }),
        phone: await Input({
            message: 'Enter phone number',
        }),
        password: await Input({
            message: 'Enter your password',
        }),
        confirmPassword: await Password({
            message: 'Please confirm password',
        }),
    }

    while(password!==confirmPassword){
        confirmPassword = await Password({
            message: 'Please confirm password',
        })
    }

    const {data,headers} = await axios.post<{responseCode:number}>(`http://127.0.0.1:${PORT}/api/user/createUser`,{
        email: email,
        password: password,
        phone: phone
    },
    {
        headers: {
            'Content-Type': 'application/json'
        }
    })
    console.log(data,customResponseCodes);
    if(data.responseCode === customResponseCodes.SUCCESSFUL){
        await VerifyOTP({email})
    }else{
        console.log('Sorry, something went wrong. Please try again later.');
        
    }
    
}