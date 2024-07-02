import { timeStamp } from 'console';
import mongoose,{Document,Schema} from 'mongoose'

interface Profile extends Document{
    size:number;
    fileType:string;
    fileName:string;
}

const profileSchema: Schema = new Schema<Profile>({
    size:{
        type:Number
    },
    fileType:{
        type:String
    },
    fileName:{
        type:String
    }
})
interface Following extends Document {
    following: string,
    createdAt: Date
}

const followingSchema: Schema = new Schema<Following>({
    following: {
        type: String
    }
},{timestamps: true})

interface Follower extends Document{
    follower: string;
    createdAt: Date
}
const followerSchema: Schema = new Schema<Follower>({
    follower: {
        type: String
    }
},{timestamps: true})
export interface User extends Document{
    _id:string;
    name:string;
    password:string;
    phone:string;
    link:string;
    profileUrl:string;
    profile:Profile;
    isVerified:boolean;
    email:string;
    registeredWithGoogle: boolean;
    following: Following[]
    followers: Follower[]
}

const UserSchema = new Schema<User>({
    _id: {type:String},
    name:{
        type:String,
    },
    password: {
        type: String,
    },
    phone: {
        type: String
    },
    link:{
        type:String
    },
    profileUrl:{
        type:String
    },
    profile: {
        type: profileSchema
    },
    isVerified:{
        type:Boolean,
        default:false
    },
    registeredWithGoogle:{
        type:Boolean,
        default:false
    },
    following:[followingSchema],
    followers:[followerSchema]
},{timestamps:true})

export const userModel =  mongoose.model<User>("users",UserSchema);