import nodemailer from 'nodemailer'
import {google} from "googleapis"

const OAuth2 = google.auth.OAuth2;

// Generate a refresh token by visit
const oauth2Client = new  OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    "https://developers.google.com/oauthplayground" //redirect url
)
oauth2Client.setCredentials({
    refresh_token:process.env.REFRESH_TOKEN
})
const accessToken = async() =>{ 
    try {
        const token =  await oauth2Client.getAccessToken()
        return token
    } catch (error) {
        throw error
    }
}

 //get New access token


        let transporter = nodemailer.createTransport({
            service:"gmail",
            port:2525,
            auth:{
                type:"OAuth2",
                clientId:process.env.CLIENT_ID,
                clientSecret:process.env.CLIENT_SECRET,
                refreshToken:process.env.REFRESH_TOKEN,
                accessToken:accessToken,
                user:process.env.USER_EMAIL,
            },
        } as nodemailer.TransportOptions)
export const sendMail = async (mailOtions:any) =>{
    try{
        await transporter.sendMail(mailOtions);
    }catch(err){
        // console.log(err)
        throw err
    }
}
    



