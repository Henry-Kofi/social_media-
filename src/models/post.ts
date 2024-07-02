import mongoose,{ Document,Schema,Types,model} from "mongoose";

// comment
export interface Reply extends Document{
    user: string;
    content:string;
    createdAt: Date
}

const replySchema: Schema = new Schema<Reply>({
    user: {
        type:String
    },
    content:{
        type:String
    }
},{timestamps:true})
export interface Comment extends Document{
    user:string;
    content:string;
    replies?:Reply[];
    createdAt: Date
}

const commentSchema: Schema = new Schema<Comment>({
    user: {
        type: String,
        ref: 'users'
    },
    content:{
        type: String,
    },
    replies:{
        type: [replySchema]
    }
},{timestamps:true})

// Likes
export interface Likes extends Document{
    user:string,
    createdAt: Date
}
const likeSchema:Schema = new Schema<Likes>({
    user:{
        type:String,
        ref: 'users'
    }
},{timestamps:true})

// fireemoji
interface FireEmoji extends Document{
    user:string,
    createdAt: Date
}
const fireEmojiSchema: Schema = new Schema<FireEmoji>({
    user:{
        type:String,
        ref:'users'
    }
},{timestamps:true})

interface Views extends Document {
    user: string,
    createdAt: Date
}

const viewsSchema: Schema = new Schema<Views>({
    user: {
        type: String, 
        ref: "users"
    }
},{timestamps: true})

// file details
interface File extends Document{
    path: string;
    size:number;
    type:string;
    name:string;
    url:string;
}

const fileSchema: Schema = new Schema<File>({
    path:{
        type: String
    },
    size:{
        type:Number
    },
    type:{
        type:String
    },
    name:{
        type:String
    }
})

interface Text extends Document{
    text: string,
    style: string,
    color: string,
}

const textSchema: Schema = new Schema<Text>({
    text: {
        type: String
    },
    style: {
        type: String
    },
    color: {
        type: String
    }
})

interface Saves extends Document{
    user: string,
    createdAt: Date
}

const savesSchema: Schema = new Schema<Saves>({
    user: {
        type: String,
        ref: "users"
    }
},{timestamps: true})

interface Repost extends Document {
    user: string,
    createdAt: Date
}

const repostSchema: Schema = new Schema<Repost>({
    user:{
        type: String,
        ref: "users"
    }
},{timestamps: true})

export interface HashTag extends Document {
    user: string
};

const hashTagSchema: Schema = new Schema<HashTag>({
    user:{
        type: String
    }
})

interface Share extends Document{
    shareFrom: string;
    shareTo: string;
    createdAt: Date
}

const shareSchema: Schema = new Schema<Share>({
    shareFrom:{
        type: String,
        ref: "users"
    },
    shareTo:{
        type: String,
        ref: "users"
    }
},{timestamps: true})

interface Metric extends Document {
    following:number,
    followers: number,
    fireEmoji: number,
    comments: number,
    saves: number,
    likes: number,
    views: number,
    shares: number,
    reposts: number,
    hashtags: number,
}
const metricSchema: Schema = new Schema<Metric>({
    followers:{
        type: Number
    },
    following:{
        type: Number
    },
    fireEmoji:{
        type: Number
    },
    comments: {
        type: Number
    },
    saves:{
        type: Number
    },
    likes: {
        type: Number
    },
    views:{
        type: Number
    },
    shares:{
        type: Number
    },
    reposts: {
        type: Number
    },
    hashtags:{
        type: Number
    }
},{timestamps: true})
export interface Post extends Document{
    author:string,
    caption:string,
    title:string,
    description: string,
    files: File[],
    text: Text,
    location: string,
    comments:Comment[],
    hashtags: HashTag[],
    likes:Likes[],
    views: Views[],
    saves: Saves[],
    shares: Share[],
    reposts: Repost[],
    fireEmoji:FireEmoji[],
    metrics: Metric[],
    createdAt: Date
};



const PostSchema: Schema = new Schema<Post>({
    author:{
        type:String,
        ref:'users'
    },
    title: {
        type: String
    },
    caption:{
        type:String,
    },
    description:{
        type: String
    },
    location:{
        type: String
    },
    files:[fileSchema],
    text: textSchema,
    comments: [commentSchema],
    hashtags: [hashTagSchema],
    likes: [likeSchema],
    views:[viewsSchema],
    saves:[savesSchema],
    shares:[shareSchema],
    reposts:[repostSchema],
    fireEmoji: [fireEmojiSchema],
    metrics: [metricSchema]
},{timestamps:true});

export const postModel = model<Post>("posts",PostSchema)