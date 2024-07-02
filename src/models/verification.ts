import mongoose,{Schema,Document} from "mongoose";

interface Verification extends Document{
    _id:string;
    requestTime:number;
    code:string;
    attempts:number;
}
const VerificationRecordSchema = new Schema({
    _id:{
        type:String, 
    },
    requestTime:{type:Number,required:true},
    code:{type:String,require:true},
    attempts:{type:Number,default:3}
}) 
export const VerificationRecordModel = mongoose.model<Verification>("verification",VerificationRecordSchema);