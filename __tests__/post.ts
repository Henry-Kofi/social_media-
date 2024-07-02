import request from "supertest"
import {app,startApp} from "../src"
import { test, expect, describe, afterAll,jest} from "@jest/globals"
import mongoose from "mongoose"
import path from "path"
import { postModel } from "../src/models/post"

afterAll(async () => {
  await mongoose.connection.close();

  startApp.close()
})
describe("Post activities",() => {
    test("create post", async () => {
            const file = path.join(__dirname,'test_assets','audio.mp3')
            const post = {
                title: "title",
                description: "description"
            };
            const res = await request(app)
                .post("/api/post/createPost")
                .attach('files', file)
                .field(post)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
    });

    test("retrieves all post", async () => {
            const res = await request(app)
                .get("/api/post/getAll")
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
            // expect(res.body.message).toBe("success fetching post data")
    });

    test("retrieves weekly top 10", async () => {
            const res = await request(app)
                .get("/api/post/weeklyTop10")
                expect(res.status).toBe(200)
                expect(res.body.success).toBe(true)
                // expect(res.body.message).toBe("success fetching post data")
    });

    test("retrieves trending today", async () => {
            const res = await request(app)
                .get("/api/post/trendingToday")
                expect(res.status).toBe(200)
                expect(res.body.success).toBe(true)
                // expect(res.body.message).toBe("success fetching post data")
    }); 
    
    test("retrieves all trends", async () => {
            const res = await request(app)
                .get("/api/post/trends")
                expect(res.status).toBe(200)
                expect(res.body.success).toBe(true)
                // expect(res.body.message).toBe("success fetching post data")
    });
})

describe("Interacting with posts",() => {
    test("Comment on a post",async() => {
        const user = {
            user: "hnyonyo001@st.ug.edu.gh",
            content: "This is a comment"
        }
        const postId = "6623e60343aef564ef7bc131"
        const response = await request(app)
            .post(`/api/post/comment/${postId}`)
            // .send(user)
        expect(response.status).toBe(404) // post id is wrong
        expect(response.body.success).toBe(false)
        expect(response.body.message).toBe("Post not found")
    })

    test("Reply to a comment",async() => {
        const user = {
            user: "hnyonyo001@st.ug.edu.gh",
            content: "This is a comment"
        }
        const postId = "6623e60343aef564ef7bc131"
        const commentId = "6623e60343aef564ef7bc131"
        const response = await request(app)
            .post(`/api/post/comment/${postId}/reply/${commentId}`)
            // .send(user)
        expect(response.status).toBe(404) // post id is wrong
        expect(response.body.success).toBe(false)
        expect(response.body.message).toBe("Comment not found")
    })

    test("Like or unlike a post",async() => {
       
         const  user = "hnyonyo001@st.ug.edu.gh"
        const postId = "6623e60343aef564ef7bc131"
        const response = await request(app)
            .post(`/api/post/likeAndDislike/${postId}`)
            // .send({user})
        expect(response.status).toBe(404) // post id is wrong
        expect(response.body.success).toBe(false)
        expect(response.body.message).toBe("Post not found")
    })

    test("Creates a fire emoji", async () => {
        const  user = "hnyonyo001@st.ug.edu.gh"
        const postId = "6623e60343aef564ef7bc131"
        const response = await request(app)
            .post(`/fireEmoji/${postId}`)
            // .send({user})
        expect(response.status).toBe(404) // post id is wrong
    })

    test("saves a post", async () => {
        const  user = "hnyonyo001@st.ug.edu.gh"
        const postId = "6623e60343aef564ef7bc131"
        const response = await request(app)
            .post(`/savePost/${postId}`)
            // .send({user})
        expect(response.status).toBe(404) // post id is wrong
    })

    test("Repost a post", async () => {
        const  user = "hnyonyo001@st.ug.edu.gh"
        const postId = "6623e60343aef564ef7bc131"
        const response = await request(app)
            .post(`/repost/${postId}`)
            // .send({user})
        expect(response.status).toBe(404) // post id is wrong
    })

    test("Share a post", async () => {
        const  user = "hnyonyo001@st.ug.edu.gh"
        const postId = "6623e60343aef564ef7bc131"
        const to ="nyonyohenry3@gmail.com"
        const response = await request(app)
            .post(`/share/${postId}/to/${to}`)
            .send({user})
        expect(response.status).toBe(404) // post id is wrong
    })

    test("Share a post", async () => {
        const  user = "hnyonyo001@st.ug.edu.gh"
        const postId = "6623e60343aef564ef7bc131"
        const to ="nyonyohenry3@gmail.com"
        const response = await request(app)
            .get(`/metrics/${postId}`)
            // .send({user})
        expect(response.status).toBe(404) // post id is wrong
    })

    test("Searches for a post using hashtags", async () => {
        const key = "searchkey"
        const response = await request(app)
            .get(`/search/${key}`)
        expect(response.status).toBe(404)
    })
})