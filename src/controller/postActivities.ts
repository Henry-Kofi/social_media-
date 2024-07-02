import { Request, Response } from "express";
import { Post, postModel, Comment, Reply, Likes } from "../models/post";
import { Token, verifyToken } from "../utils/tokenGenerator";
import { JwtPayload } from "jsonwebtoken";
import { User, userModel } from "../models/user";
import "dotenv/config"

const token = process.env.TEST_TOKEN
export const createComment = async (req: Request, res: Response) => {
    const { postId } = req.params; // request post id as params
    const { content }: Comment = req.body; //get user and comment content
    // const token = req.cookies.token;
    let user: string;
    try {
        if(!token){
            return res.status(401).json({
                success: false,
                message: "Unauthorized access"
            })
        }
        const decodedToken: Token = await verifyToken(token);
        if(!decodedToken.isValid){
            return res.status(401).json({
                success: false,
                message: "Unautorized access"
            })
        }

        const decryptedUserDetail = decodedToken.user  as JwtPayload;
        user = decryptedUserDetail.id;

        // find post using post id
        const updatePost: Post | null = await postModel.findByIdAndUpdate(
            postId,
            {
                $push:
                {
                    comments: {
                        user: user,
                        content: content
                    }
                }
            },
            { new: true }
        )
        if (!updatePost) {
            return res.status(404).json({
                success: false,
                message: "Post not found"
            });
        }
        await updateMetrics(updatePost)
        return res.status(201).json({
            success: true,
            message: "Comment created successfully",
            updatePost
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}

export const createReply = async (req: Request, res: Response) => {
    const { commentId, postId } = req.params;
    const { content }: Comment = req.body;
     // const token = req.cookies.token;
     let user: string;
     try {
         if(!token){
             return res.status(401).json({
                 success: false,
                 message: "Unauthorized access"
             })
         }
         const decodedToken: Token = await verifyToken(token);
         if(!decodedToken.isValid){
             return res.status(401).json({
                 success: false,
                 message: "Unautorized access"
             })
         }
 
         const decryptedUserDetail = decodedToken.user  as JwtPayload;
         user = decryptedUserDetail.id;
        
         const existingComment: Comment | null = await postModel.findOne({ _id: postId, 'comments._id': commentId })
        if (!existingComment) {
            return res.status(404).json({
                success: false,
                message: "Comment not found"
            })
        }
        const updatePost: Post | null = await postModel.findByIdAndUpdate(
            postId,
            {
                $push: {
                    "comments.$[c].replies": {
                        user: user,
                        content: content,
                    }
                }
            },
            { new: true, arrayFilters: [{ 'c._id': commentId }] },
        );
        if (!updatePost) {
            return res.status(404).json({
                success: false,
                message: "Post not found"
            })
        }
        return res.status(201).json({
            success: true,
            message: "Reply created successfully",
            updatePost
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}

export const createLike = async (req: Request, res: Response) => {
    const { postId } = req.params;
     // const token = req.cookies.token;
     let user: string;
     try {
         if(!token){
             return res.status(401).json({
                 success: false,
                 message: "Unauthorized access"
             })
         }
         const decodedToken: Token = await verifyToken(token);
         if(!decodedToken.isValid){
             return res.status(401).json({
                 success: false,
                 message: "Unautorized access"
             })
         }
 
         const decryptedUserDetail = decodedToken.user  as JwtPayload;
         user = decryptedUserDetail.id;
        // first check if the exist this post
        const existingPost: Post | null = await postModel.findById(postId);
        if(!existingPost){  //post does not exist
            return res.status(404).json({
                success: false,
                message: "Post not found"
            })
        }
        // post exists so let check if user liked it
        const userLiked: boolean = existingPost.likes.some((obj:Likes) => obj.user === user);
        if(userLiked){ // user has liked so let remove detail from likes array
            const unlikedPost: Post | null = await postModel.findByIdAndUpdate(postId,
                {
                    $pull: { //remove 
                        likes: { //field
                            user: user //value
                        }
                    }
                },
                {new: true}
            )
            if(!unlikedPost){
                return res.status(404).json({
                    success:false,
                    message:"Could not unlike"
                });
            }
            await updateMetrics(unlikedPost)
            return res.status(200).json({
                success: true,
                message: "Post unliked succesfully",
                likes: unlikedPost.likes.length
            })
        }
        // user has not liked yet so let go ahead to like it
        const updatedPost: Post | null = await postModel.findByIdAndUpdate(postId,
            {
                $push: { // adds to the end of array
                    likes: { // field
                        user: user // value
                    }
                }
            },
            { new: true }
        )
        if(!updatedPost){
            return res.status(404).json({
                success:false,
                message:"Could not like"
            });
        }
        await updateMetrics(updatedPost)
        return res.status(200).json({
            success: true,
            message: "Post liked successfully",
            likes : updatedPost.likes.length
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}

export const createFireEmoji = async(req:Request,res:Response) => {
    const {postId} = req.params;
     // const token = req.cookies.token;
     let user: string;
     try {
         if(!token){
             return res.status(401).json({
                 success: false,
                 message: "Unauthorized access"
             })
         }
         const decodedToken: Token = await verifyToken(token);
         if(!decodedToken.isValid){
             return res.status(401).json({
                 success: false,
                 message: "Unautorized access"
             })
         }
 
         const decryptedUserDetail = decodedToken.user  as JwtPayload;
         user = decryptedUserDetail.id;

        //  find post and add fire emoji
        const updatedPost: Post | null = await postModel.findByIdAndUpdate(postId,
            {
                $push:{
                    fireEmoji:{
                        user: user
                    }
                }
            },
            {new: true}
        ) 

        if(!updatedPost){
            return res.status(404).json({
                success:false,
                message:"Post not found!"
            });
        }
        await updateMetrics(updatedPost)
        return res.status(200).json({
            success: true,
            message: "Emoji added",
            fireEmoji: updatedPost.fireEmoji.length
        })
        
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server errror"
        })
    }
}

export const savePost = async(req:Request, res: Response) => {
    const {postId} = req.params;
     // const token = req.cookies.token;
     let user: string;
     try {
         if(!token){
             return res.status(401).json({
                 success: false,
                 message: "Unauthorized access"
             })
         }
         const decodedToken: Token = await verifyToken(token);
         if(!decodedToken.isValid){
             return res.status(401).json({
                 success: false,
                 message: "Unautorized access"
             })
         }
 
         const decryptedUserDetail = decodedToken.user  as JwtPayload;
         user = decryptedUserDetail.id;

         const updatedPost: Post | null = await postModel.findByIdAndUpdate(postId,
            {
                $push:{
                    saves:{
                        user: user
                    }
                }
            },
            {new: true}
         )

         if(!updatedPost){
            return res.status(404).json({
                success:false,
                message:"Post not found!"
            });
         }
         await updateMetrics(updatedPost)
         return res.status(200).json({
            success: true,
            saves: updatedPost.saves.length
         })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server errror"
        })
    }
}

export const repost = async (req:Request, res: Response) => {
    const {postId} = req.params;
     // const token = req.cookies.token;
     let user: string;
     try {
         if(!token){
             return res.status(401).json({
                 success: false,
                 message: "Unauthorized access"
             })
         }
         const decodedToken: Token = await verifyToken(token);
         if(!decodedToken.isValid){
             return res.status(401).json({
                 success: false,
                 message: "Unautorized access"
             })
         }
         const decryptedUserDetail = decodedToken.user  as JwtPayload;
         user = decryptedUserDetail.id;

         const updatedPost: Post | null = await postModel.findByIdAndUpdate(postId,
            {
                $push:{
                    reposts:{
                        user: user
                    }
                }
            },
            {new: true}
         )
         if(!updatedPost){
            return res.status(404).json({
                success:false,
                message:"Failed to repost."
            });
         }
         await updateMetrics(updatedPost)
         return res.status(201).json({
             success:true,
             message: "Success reposting"
         })
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal server errror"
        })
    }
}

export const sharePost = async (req:Request, res: Response) => {
    const {postId,shareTo} = req.params;
     // const token = req.cookies.token;
     let shareFrom: string;
     try {
         if(!token){
             return res.status(401).json({
                 success: false,
                 message: "Unauthorized access"
             })
         }
         const decodedToken: Token = await verifyToken(token);
         if(!decodedToken.isValid){
             return res.status(401).json({
                 success: false,
                 message: "Unautorized access"
             })
         }
         const decryptedUserDetail = decodedToken.user  as JwtPayload;
         shareFrom = decryptedUserDetail.id;
        //  check if the user exists
         const user: User | null = await userModel.findOne({_id:shareTo,isVerified: true});
         if(!user){
            return res.status(404).json({
                success: false,
                message: "Reciever record not found"
            })
         }
         const updatedPost: Post | null = await postModel.findByIdAndUpdate(postId,
            {
                $push:{
                    shares:{
                        shareFrom: shareFrom,
                        shareTo: shareTo
                    }
                }
            },
            {new:true}
         )
         if(!updatedPost){
            return res.status(404).json({
                success:false,
                message:"Failed to Share the post"
            });
         }
         
        await updateMetrics(updatedPost)
         return res.status(200).json({
            success: true,
            message: "Success sharing post"
         })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: "Internal server errror"
        })
    }
}
export const getPostMetrics = async (req:Request,res: Response) => {
    const {postId} = req.params;
     // const token = req.cookies.token;
     let user: string;
     try {
         if(!token){
             return res.status(401).json({
                 success: false,
                 message: "Unauthorized access"
             })
         }
         const decodedToken: Token = await verifyToken(token);
         if(!decodedToken.isValid){
             return res.status(401).json({
                 success: false,
                 message: "Unautorized access"
             })
         }
         const decryptedUserDetail = decodedToken.user  as JwtPayload;
         user = decryptedUserDetail.id;
        //  let get all data with their timestamps
        const post:Post | null = await postModel.findById(postId);

        return res.status(200).json({
            success:true,
            metrics: post.metrics
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: "Internal server errror"
        })
    }
}
const updateMetrics = async (updatedPost: Post) => {
    try {
        const userDetail: User = await userModel.findOne({_id:updatedPost.author})
        let following: number;
        let followers: number;
        if(!userDetail) {
            followers =0
            following=0
        }else{
            followers = userDetail.followers.length;
            following = userDetail.following.length;
        }
        const metrics = {
            following: following,
            followers: followers,
            fireEmoji: updatedPost.fireEmoji.length,
            comments: updatedPost.comments.length,
            saves: updatedPost.saves.length,
            likes: updatedPost.likes.length,
            views: updatedPost.views.length,
            shares: updatedPost.shares.length,
            reposts: updatedPost.reposts.length,
            hashtags: updatedPost.hashtags.length
        }
        // return
        await postModel.findByIdAndUpdate(updatedPost._id,
            {
                $push:{
                    metrics:metrics
                }
            }
        )
    } catch (error) {
        throw new Error("Metrics Error: "+error)
    }
}

export const searchByHashTag = async (req: Request, res: Response) => {
    const key = req.params.key
    // const token = req.cookies.token;
    try {
        if(!token){
            return res.status(401).json({
                success: false,
                message: "Unauthorized access"
            })
        }
        const decodedToken: Token = await verifyToken(token);
        if(!decodedToken.isValid){
            return res.status(401).json({
                success: false,
                message: "Unautorized access"
            })
        }

        // now search by hashtag
        const searchResult: Post[] | null = await postModel.find({'hashtags.user': {$regex:key, $options: "i"}})
        if(!searchResult || searchResult.length === 0){
            return res.status(404).json({
                success: false,
                message: "no posts found"
            })
        }

        await getSortPostWithMatchingScore(searchResult,key,res)
    } catch (error) {
        console.log(error)
        throw error
    }
}

const getSortPostWithMatchingScore = async(searchResults: Post[], keyword: string,res:Response) =>  {
    try {
        const keyLength = keyword.length;
        const postsWithMatchingScore = await Promise.all( searchResults.map(async post => {
            const matchingTags = post.hashtags.filter(tag => tag.user.match(keyword))
            const matchingScore = matchingTags.map(tag => {
                const matchingPost = tag.user.match(keyword)
                return matchingPost.input.length -keyLength
            });
                if (post.text) return {
                    matchingLength: parseInt(matchingScore.toString()),
                  post:{_id: post._id,
                  author: post.author,
                  text: {
                    text: post.text.text,
                    color: post.text.color,
                    style: post.text.style
                  },
                  location: post.location,
                  hashtags: post.hashtags,
                  comments: post.comments,
                  likes: post.likes.length,
                  views: post.views.length,
                  shares: post.shares.length,
                  saves: post.saves.length,
                  reposts: post.reposts.length,
                  fireEmoji: post.fireEmoji.length,
                  createdAt: post.createdAt}
                }
          
                const fileDetails = await post.files.map(file => ({
                  name: file.name,
                  type: file.type
                }))
                return {
                    matchingLength: parseInt(matchingScore.toString()),
                  post:{_id: post._id,
                  author: post.author,
                  caption: post.caption,
                  title: post.title,
                  description: post.description,
                  files: fileDetails,
                  location: post.location,
                  hashtags: post.hashtags,
                  comments: post.comments,
                  likes: post.likes.length,
                  views: post.views.length,
                  shares: post.shares.length,
                  saves: post.saves.length,
                  reposts: post.reposts.length,
                  fireEmoji: post.fireEmoji.length,
                  createdAt: post.createdAt}
                }
        }));
        postsWithMatchingScore.sort((a,b) => a.matchingLength - b.matchingLength)
        
        return res.status(200).json({
            success: true,
            result: postsWithMatchingScore.map(post => post.post)
        })
        
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error
        })
    }
}

