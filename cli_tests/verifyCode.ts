import 'dotenv/config';
import Input from '@inquirer/input'
import axios from 'axios';

const PORT = process.env.PORT

export default async function VerifyOTP({email}:{email:string}){

    const { OTP } = {
        OTP: await Input({
            message: 'Enter verification code',
        }),
    }

   

    const {data,headers} = await axios.put<{email:string;phone:string;password:string,responseCode:number}>(`http://127.0.0.1:${PORT}/api/user/verify`,{
        email: email,
        OTP: OTP
    },
    {
        headers: {
            'Content-Type': 'application/json'
        }
    })
    console.log(data);
    return data
    
}