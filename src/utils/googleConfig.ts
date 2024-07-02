import "dotenv/config"
export const googleConfig = {
    clientID:process.env.CLIENT_ID,
    clientSecret:process.env.CLIENT_SECRET,
    callbackURL:`http://localhost:${process.env.PORT}/auth/google/callback`,
    passReqToCallback:true
}