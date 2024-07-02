import express, { NextFunction, Request, Response } from 'express';
import passport from "passport";
import session from "express-session";
import 'dotenv/config';
import {createServer} from 'http'
import { Server, Socket } from 'socket.io';
import cookieParser from "cookie-parser"
import cors from 'cors'

// Routes
import authRoute from './route/user';
import postRoute from './route/post';

import { createExternalSourceConnections } from './utils';
import headers from './utils/headersMiddleware';
import viralRouter from './route/viral';
import { liveStreamSocketEvents } from './utils/liveStreamSocket';
import path from 'path';
const PORT = process.env.PORT;

const app = express();
const server = createServer(app)

const io  = new Server(server,{
    cors:{
        origin: "*",
        methods: ["GET", "POST"],
        credentials:true
    }
});

app.use(headers);
app.use(express.json());
app.use(cookieParser());
app.use(cors());
app.use(session({
    secret:"my secret",
    resave:false,
    saveUninitialized:true
}));

app.use(passport.initialize());
app.use(passport.session());
app.use("/media",express.static(path.join(__dirname,"data","files")))
app.use('/api/user', authRoute);
app.use('/api/post',postRoute);
app.use('/api/viral',viralRouter);

liveStreamSocketEvents(io);

type PossibleRequestObject = Request<{}, any, any, any, Record<string, any>>;
type PossibleResponseObject = Response<any, Record<string, any>>;
// Handle all possible errors in our routes
app.use((err: Error, req: PossibleRequestObject, res: PossibleResponseObject, next: NextFunction) => {

    console.error(err.stack)
    // Server Error. Handle gracefully. 
    // User must not know server encountered error. Just an unsuccessful feedback would do.
    res.status(500).send('Something broke!')
})

// Connect to all external sources before server starts
createExternalSourceConnections().then(() => {
    // All external connections are made and successfull. App can start confidently
    startApp;
})
    .catch((err) => {
        // Connections could not be made successfully. Handle gracefully
        throw err;

    })

// export
const startApp =  server.listen(PORT, () => {
    // Do neccessities when app starts
    console.log(`Server running on port ${PORT}`)
});

export {startApp,app}