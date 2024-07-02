import mongoose from "mongoose";
import 'dotenv/config';
import { clearScheduledEvent, scheduleEvent } from "./eventScheduler";
import { VerificationRecordModel } from "../models/verification";


// Connect to all external sources before app starts
export const createExternalSourceConnections = async () => {
    try {
        await mongoose.connect(String(process.env.MONGO_URL));
        // more connections could go here..

    } catch (err) {
        throw err;
    }
}



/**
 * Generate 6-digit verification code. This assumes `email` is checked and associated 
 * with an account in our database.  
 * 
 */

export const getVerificationCode = async ({ email }: { email: string }) => {
    if (!email) {
        throw new Error("Email is reqiured")
    }
    // Get time info
    const requestTime = Date.now();
    const verificationCode = `${Math.random()}`.slice(2, 8);
    // Create a temporal record in database if not exists
    const record = new VerificationRecordModel({
        _id: email, // string. This would be used to identify record to retrieve and delete later
        requestTime: requestTime, // number
        code: verificationCode // string
    });
    try {
        await record.validate()
        await record.save();
    } catch (err) {
        throw err
    }
    // complete code with below...
    // if the user requested for verification code some few seconds ago,
    // the record might have not been deleted. If exists, update the `code` and
    // `requestTime` fields of the data with the newly generated's. 

    const fiveMinutes = 5 * 60 * 1000;

    // Let check if record exists
    let existingRecord = await VerificationRecordModel.findById({ _id: email });
    if (existingRecord && (requestTime - existingRecord.requestTime) < fiveMinutes) {
        // user exists,so we update
        // existingRecord.code = verificationCode;
        // existingRecord.requestTime = requestTime
        await VerificationRecordModel.findByIdAndUpdate({ _id: email },
            {
                requestTime: requestTime,
                code: verificationCode
            })
    } else {
        // existingRecord = new VerificationRecordModel({
        //     // user does not exist  yet, so we create create one
        //     email,
        //     requestTime,
        //     code:verificationCode
        // })
        await VerificationRecordModel.create({
            _id: email,
            requestTime: requestTime,
            code: verificationCode
        })
    }
    // await existingRecord.save();
    // saved new record

    // Schedule an event to trigger delete after 5 minutes
    scheduleEvent<{ email: string }>({
        eventName: `email:verification:${email}`,
        runAfter: fiveMinutes,
        task: async ({ email }) => {
            // Delete the record from database. Verification code has expired
            // I delete all occurances of the records with the same email 
            const result = await VerificationRecordModel.deleteMany({ id_email: email })

            // Right after deletion, clear scheduled event info
            clearScheduledEvent({ eventName: `email:verification:${email}` })
        },
        props: { email } // Sends this props to our task when time's up to run
    })

    return verificationCode;
}

/**
 * Generates 6-digit verification code and also creates an event to expire verification code after 
 * specified time `expires` in seconds. Default `5 minutes`.     
 * This assumes `email` is checked and associated with an account in our database.     
 * 
 */
export const getVerificationCode2 = async ({ email, expires }: { email: string, expires?: number }) => {
    // User might have not received previously sent verification code
    // Clear scheduled event for deletion of this verification instance from db
    clearScheduledEvent({ eventName: `email:verification:${email}` });
    expires = expires? expires: (5 * 60 * 1000);
    // Get time info
    const requestTime = Date.now();
    const verificationCode = `${Math.random()}`.slice(2, 8);

    try {
        // If exists, updates with new info else creates new
        await VerificationRecordModel.findByIdAndUpdate(
            email,
            {requestTime: requestTime, code: verificationCode}, // we will update with these values
            { upsert: true}  // upsert when set to true inserts if not found
        );
    } catch (error) {
        throw error;
    }
    // Schedule an event to trigger delete after 5 minutes
    scheduleEvent<{ email: string }>({
        eventName: `email:verification:${email}`,
        runAfter: expires,
        task: async ({ email }) => {
            // Delete the record from database. Verification code has expired
            const result = await VerificationRecordModel.deleteOne({ _id: email })

            // Right after deletion, clear scheduled event info
            clearScheduledEvent({ eventName: `email:verification:${email}` })
        },
        props: { email } // Sends this props to our task when time's up to run
    })

    return verificationCode;
}