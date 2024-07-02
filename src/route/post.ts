import { Router } from "express";

import {
    createPost,
    getAllPosts,
    trendingToday,
    trends,
    weeeklyTop10
} from "../controller/post"
import  upload from "../utils/validator/post";
import { 
    createComment, 
    createFireEmoji, 
    createLike, 
    createReply, 
    getPostMetrics, 
    repost, 
    savePost,
    searchByHashTag,
    sharePost
} from "../controller/postActivities";

const postRoute = Router()

postRoute.post("/createPost",upload.any(),createPost);
postRoute.get("/getAll",getAllPosts);
postRoute.get("/weeklyTop10",weeeklyTop10);
postRoute.get("/trendingToday",trendingToday);
postRoute.get("/trends",trends);

// post activities
postRoute.post("/comment/:postId",createComment);
postRoute.post("/comment/:postId/reply/:commentId",createReply)
postRoute.post("/likeAndDislike/:postId",createLike);
postRoute.post("/fireEmoji/:postId",createFireEmoji);
postRoute.post("/savePost/:postId",savePost);
postRoute.post("/repost/:postId",repost);
postRoute.post("/share/:postId/to/:shareTo",sharePost)

postRoute.get("/metrics/:postId",getPostMetrics);

// search
postRoute.get("/search/:key",searchByHashTag);

export default postRoute;