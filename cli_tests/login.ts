import 'dotenv/config';
import Input from "@inquirer/input"
import Password from '@inquirer/password'
import axios from 'axios';
import {customResponseCodes} from '../src/response'

const port = process.env.PORT

export default async  function login() {
    let {email,password} = {
        email: await Input({
            message:"Enter email address"
        }),
        password: await Password({
            message:"Enter your password"
        })
    }

    let data: {responseCode:number} = {responseCode: customResponseCodes.UNSUCCESSFUL}
    while (data.responseCode !== customResponseCodes.SUCCESSFUL) {
        const result = await axios.post<{responseCode:number}>(`http://localhost:${port}/api/user/login`,{
            email:email,
            password:password
        },{
            headers:{
                "Content-Type":"application/json"
            }
        })
        data = result.data;

        console.log(data)
        if(data.responseCode === customResponseCodes.SUCCESSFUL){
            console.log("Login successful")
            return
        }
        console.log('Incorrect password!');
        password = await Password({
            message:"Re-enter your password"
        });
        
    }
}