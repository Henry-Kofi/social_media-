import { postModel, Post } from "../models/post";
import { Response, Request } from "express";
import fs from "fs";
import path from "path";
import { Token, verifyToken } from "../utils/tokenGenerator";
import { JwtPayload } from "jsonwebtoken";
import "dotenv/config"
import { userModel } from "../models/user";
import Ranking from "../utils/ranking";
const rankingSystem = new Ranking()

const token = process.env.TEST_TOKEN
export const createPost = async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  const { caption, title, description, text, color, style, location, hashtag }:
    { caption: string, title: string, description: string, text: string, color: string, style: string, location: string, hashtag: string[] } = req.body;
  // const token = req.cookies.token;
  let author: string;
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized access"
    })
  }
  try {
    const decodedToken: Token = await verifyToken(token);
    if (!decodedToken.isValid) {
      return res.status(401).json({
        success: false,
        message: "Unautorized access"
      })
    }
    const user = decodedToken.user as JwtPayload;
    author = user.id;
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
  try {
    if (!text && (!files || files.length === 0)) {
      return res.status(400).json({
        success: false,
        message: "No file or text uploaded"
      })
    }
    if (!files || files.length === 0) {
      const hashTag: { user: string }[] = hashtag.map(tag => ({
        user: tag
      }))
      const newPost: Post | null = await postModel.create({
        author: author,
        caption: caption,
        title: title,
        description: description,
        text: {
          text: text,
          color: color,
          style: style
        },
        location: location,
        hashtags: hashTag
      })
      if (!newPost) {
        return res.status(400).json({
          success: false,
          message: "Error creating post"
        })
      }
      return res.status(200).json({
        success: true,
        message: "Success creating post"
      })
    }

    const response = await filesValidation(files, author, caption, title, description, location, hashtag)
    return res.status(response.code).json(response?.resData)

  } catch (error) {
    return res.status(503).json({
      success: false,
      message: `Internal server error`,
    })
  }
}

export const getAllPosts = async (req: Request, res: Response) => {
  try {
    const posts: Post[] = await postModel.find();
    const modifiedResponse = await rankingSystem.getAllPosts(posts);
    return res.status(modifiedResponse.code).json(modifiedResponse.resData);
  } catch (error) {
    return res.status(503).json({
      success: false,
      message: "Error fetching post",
    });
  }
};

export const weeeklyTop10 = async (req: Request, res: Response) => {
  try {
    const currentDate: Date = new Date();
    const startingDayOfTheWeek = new Date(currentDate);
    startingDayOfTheWeek.setDate(
      currentDate.getDate() -
      currentDate.getDay() +
      (currentDate.getDay() === 0 ? -6 : 1)
    ); //monday for start of the week
    startingDayOfTheWeek.setHours(0, 0, 0);

    const endingDayOfTheWeek = new Date(startingDayOfTheWeek);
    endingDayOfTheWeek.setDate(startingDayOfTheWeek.getDate() + 6); // sunday for end of the week
    endingDayOfTheWeek.setHours(23, 59, 59);

    const top10Post: Post[] = await postModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startingDayOfTheWeek, $lte: endingDayOfTheWeek }, //filtering post for current week
        },
      }
    ]);

    const modifiedResponse = await rankingSystem.getWeeklyTop10(top10Post);
    return res.status(modifiedResponse.code).json(modifiedResponse.resData);
  } catch (error) {
    return res.status(503).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const trendingToday = async (req: Request, res: Response) => {
  try {
    const currentDate = new Date();
    const startTime = new Date(currentDate);
    startTime.setHours(0, 0, 0, 0); // Set the start time to 00:00:00
    const endTime = new Date(currentDate);
    endTime.setHours(23, 59, 59, 999); // Set the end time to 23:59:59:999

    const trendingPost: Post[] = await postModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startTime, $lte: endTime }, //we filter post
        },
      }
    ]);

    const modifiedResponse = await rankingSystem.getTrendingToday(trendingPost);
    return res.status(modifiedResponse.code).json(modifiedResponse.resData);
  } catch (error) {
    return res.status(503).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const trends = async (req: Request, res: Response) => {
  try {
    const trends: Post[] = await postModel.find();

    const modifiedResponse = await rankingSystem.getTrends(trends);
    return res.status(modifiedResponse.code).json(modifiedResponse.resData);
  } catch (error) {
    return res.status(503).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getMediaFiles = async (posts: Post[]) => {
  try {
    // check if array is empty and return in json format
    if (posts.length === 0)
      return {
        code: 404,
        resData: { success: false, message: "no post records found" },
      };
    const filesData = await Promise.all(
      posts.map(async (post) => {
        const { author, caption, files, comments, likes, fireEmoji } = post;

        // check if there are media files
        if (!post.files || post.files.length === 0) {
          // no media file
          return {
            author,
            caption,
            comments,
            likes,
            fireEmoji,
          };
        }
        // get the metadata of each image/video/audio
        const bufferData = await Promise.all(
          files.map(async (file) => {
            try {
              const data = await fs.promises.readFile(file.path);
              return {
                size: file.size,
                type: file.type,
                name: file.name,
                bufferData: data,
              };
            } catch (error) {
              throw error;
            }
          })
        );
        return {
          author,
          caption,
          files: bufferData,
          comments,
          likes,
          fireEmoji,
        };
      })
    );
    return {
      code: 200,
      resData: {
        success: true,
        message: "success fetching post data",
        data: filesData,
      },
    };
  } catch (error) {
    throw error;
  }
};

const filesValidation = async (files: Express.Multer.File[], author: string, caption: string, title: string, description: string, location: string, hashtag: string[]) => {
  const allowedFileTypes = ["image", "audio", "video"]
  let videoCount: number = 0;
  let audioImageCount: number = 0;
  let totalsize: number = 0;
  let maxfilesize: number = 5 * 1024 * 1024; // 5mb

  for (const file of files) {
    totalsize += file.size;
    const fileType = file.mimetype.split("/")[0];
    if (!allowedFileTypes.includes(fileType)) {
      await deleteMediaFromFileSystem(files)
      return { code: 400, resData: { success: false, message: `Invalid file format` } };
    }
    if (fileType === "video") {
      videoCount += videoCount;
    } else {
      audioImageCount += audioImageCount;
    }
  }
  if (videoCount > 1) {
    await deleteMediaFromFileSystem(files)
    return { code: 400, resData: { success: false, message: `Number of videos must not exceed 1` } };
  }
  if (audioImageCount > 6) {
    await deleteMediaFromFileSystem(files)
    return { code: 400, resData: { success: false, message: `Number of audio or image must not exceed 6` } };
  }
  if (totalsize > maxfilesize) {
    await deleteMediaFromFileSystem(files)
    return { code: 400, resData: { success: false, message: `Total file size must not exceed ${maxfilesize / (1024 * 1024)} mb` } };
  }
  await saveToDataBase(files, author, caption, title, description, location, hashtag);
  return { code: 200, resData: { success: true, message: `Success creating post` } };
}
const deleteMediaFromFileSystem = async (files: Express.Multer.File[]) => {
  try {
    const filePaths = [];
    for (const file of files) {
      filePaths.push(file.path);
    }
    await Promise.all(
      filePaths.map((filePath) => fs.promises.unlink(filePath))
    );
  } catch (error) {
    throw error;
  }
};

const saveToDataBase = async (files: Express.Multer.File[], author: string, caption?: string, title?: string, description?: string, location?: string, hashtag?: string[]) => {
  try {
    const fileFields = files.map(file => ({
      path: file.path,
      size: file.size,
      type: file.mimetype.split("/")[0],
      name: file.filename
    }))
    let hashTag: { user: string }[]
    if(hashtag){
      hashTag = hashtag.map(tag => ({
        user: tag
      }))
    }
    await postModel.create({
      author: author,
      caption: caption,
      title: title,
      description: description,
      files: fileFields,
      location: location,
      hashtags: hashTag
    });
  } catch (error) {
    throw error
  }
}
