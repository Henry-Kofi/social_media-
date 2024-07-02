import { Document,Schema,model } from "mongoose";

// Likes
interface Like extends Document{
    user:string
}
const likeSchema: Schema = new Schema({
    user:{
        type:String,
        ref:'users'
    }
},{timestamps:true})

// Comments
interface Comment extends Document{
    user:string;
    content:string;
}
const commentSchema: Schema = new Schema({
    user:{
        type:String,
        ref:'users'
    },
    content:{
        type:String
    }
},{timestamps:true})

interface Share extends Document{
    from:string;
    to:string;
}

const shareSchema: Schema = new Schema({
    from: {
        type:String,
        ref:'users'
    },
    to:{
        type:String,
        ref:'users'
    }
},{timestamps:true})

export interface View extends Document{
    participant: string;
    present:boolean;
}
const viewSchema: Schema = new Schema({
    participant:{
        type:String,
        ref:'users'
    },
    present:{
        type: Boolean,
        default: false
    }
},{timestamps:true})
export default interface Room extends Document{
    roomId: string;
    author:string;
    isLive: boolean;
    views:View[];
    shares:Share[];
    likes:Like[];
    comments:Comment[];
}

const roomSchema: Schema = new Schema({
    roomId:{
        type:String
    },
    author:{
        type:String,
        ref:'users'
    },
    isLive:{
        type:Boolean,
        default:false
    },
    views:{
        type:[viewSchema]
    },
    shares:{
        type:[shareSchema]
    },
    likes:{
        type:[likeSchema]
    },
    comments:{
        type:[commentSchema]
    }
},{timestamps:true})

export const roomModel = model<Room>('rooms',roomSchema)
