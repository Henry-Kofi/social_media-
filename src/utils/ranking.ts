import { Post } from "../models/post"
import { userModel } from "../models/user"

class Ranking{
    private getTotalUsers = async () => {
        try {
            const numberOfUsers = await (await userModel.find()).length
            return numberOfUsers
        } catch (error) {
            throw error
        }
    }

    private getEngagementScore = async (post:Post) => {
        try {
            const factors = {
                sharePoints: .5,
                commentPoints: .5,
                likePoint: 30,
                savesPoint: .5,
                repostPoints: .5,
                viewsPoint: .5,
                fireEmojiPoint: 50
            }
            const numberOfUsers = await this.getTotalUsers()
            const possibleMaximumEngagementScore = numberOfUsers * (factors.commentPoints + factors.fireEmojiPoint + factors.likePoint + factors.repostPoints + factors.savesPoint + factors.sharePoints + factors.viewsPoint)
            const totalEngagementScore = (post.shares.length * factors.sharePoints) + (post.comments.length * factors.commentPoints)
                + (post.likes.length * factors.likePoint) + (post.saves.length * factors.savesPoint)
                + (post.reposts.length * factors.repostPoints) + (post.views.length * factors.viewsPoint)
                + (post.fireEmoji.length * factors.fireEmojiPoint);
            return (totalEngagementScore/possibleMaximumEngagementScore) * 100
        } catch (error) {
            throw error
        }
    }

    private shuffleArray<T>(array: T[]){
        for(let i= array.length - 1; i > 0; i--){
            const j = Math.floor(Math.random() * (i +1));
            [array[i],array[j]] = [array[j], array[i]]
        }
        return array;
    }

    async  getAllPosts(posts: Post[]) {
        try {
            if (posts.length === 0) return { code: 404, resData: { success: false, message: "no post records found" } }
            const modifiedResponse = await Promise.all(posts.map(async post => {

            if (post.text) return {
                _id: post._id,
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
                createdAt: post.createdAt
              }
        
              const fileDetails = await post.files.map(file => ({
                name: file.name,
                type: file.type
              }))
              return {
                _id: post._id,
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
                createdAt: post.createdAt
              }
        }))

        const randomResponse = this.shuffleArray(modifiedResponse)
        return {code: 200, resData:{success: true, data: randomResponse}};
        } catch (error) {
            throw error
        }
    }
    async  getWeeklyTop10(posts: Post[]) {
        try {
            if (posts.length === 0) return { code: 404, resData: { success: false, message: "no post records found" } }
            const modifiedResponse = await Promise.all(posts.map(async post => {
            const engagementScore = await (await this.getEngagementScore(post)).toFixed(3)

            if (post.text) return {
                _id: post._id,
                engagementScore: `${engagementScore}%`,
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
                createdAt: post.createdAt
              }
        
              const fileDetails = await post.files.map(file => ({
                name: file.name,
                type: file.type
              }))
              return {
                _id: post._id,
                engagementScore: `${engagementScore}%`,
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
                createdAt: post.createdAt
              }
        }))
        modifiedResponse.sort((a,b) => Number(b.engagementScore.split("%")[0]) - Number(a.engagementScore.split("%")[0]));
        return {code: 200, resData:{success: true, data: modifiedResponse.slice(0,10)}};
        } catch (error) {
            throw error
        }
    }

    async  getTrendingToday(posts: Post[]) {
        try {
            if (posts.length === 0) return { code: 404, resData: { success: false, message: "no post records found" } }
            const modifiedResponse = await Promise.all(posts.map(async post => {
            const engagementScore = await (await this.getEngagementScore(post)).toFixed(3)

            if (post.text) return {
                _id: post._id,
                engagementScore: `${engagementScore}%`,
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
                createdAt: post.createdAt
              }
        
              const fileDetails = await post.files.map(file => ({
                name: file.name,
                type: file.type
              }))
              return {
                _id: post._id,
                engagementScore: `${engagementScore}%`,
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
                createdAt: post.createdAt
              }
        }))
        modifiedResponse.sort((a,b) => Number(b.engagementScore.split("%")[0]) - Number(a.engagementScore.split("%")[0]));
        return {code: 200, resData:{success: true, data: modifiedResponse}};
        } catch (error) {
            throw error
        }
    }

    async  getTrends(posts: Post[]) {
        try {
            if (posts.length === 0) return { code: 404, resData: { success: false, message: "no post records found" } }
            const modifiedResponse = await Promise.all(posts.map(async post => {
            const engagementScore = await (await this.getEngagementScore(post)).toFixed(3)

            if (post.text) return {
                _id: post._id,
                engagementScore: `${engagementScore}%`,
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
                createdAt: post.createdAt
              }
        
              const fileDetails = await post.files.map(file => ({
                name: file.name,
                type: file.type
              }))
              return {
                _id: post._id,
                engagementScore: `${engagementScore}%`,
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
                createdAt: post.createdAt
              }
        }))
        modifiedResponse.sort((a,b) => Number(b.engagementScore.split("%")[0]) - Number(a.engagementScore.split("%")[0]));
        return {code: 200, resData:{success: true, data: modifiedResponse}};
        } catch (error) {
            throw error
        }
    }
}

export default Ranking