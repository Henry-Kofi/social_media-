import 'dotenv/config';
import Input from '@inquirer/input'
import axios from 'axios';

const PORT = process.env.PORT

export default async function getOTP({email}:{email:string}) {
    // const {email} = {
    //     email: await Input({
    //         message:"Enter email"
    //     })
    // }
    const {data} = await axios.post<{responseCode:number}>(`http://127.0.0.1:${PORT}/api/user/otp`,{
        email:email
    },
    {
        headers: {
            'Content-Type': 'application/json'
        }
    })
    return data
}