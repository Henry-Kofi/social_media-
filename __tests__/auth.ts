import request from "supertest"
import {app,startApp} from "../src"
import { test, expect, describe, afterAll} from "@jest/globals"
import mongoose from "mongoose"
import path from "path"

afterAll(async () => {
  await mongoose.connection.close();

  startApp.close()
})
describe("User authentication",() => {
  test("create user", async () => {
      const user = {
        email: "hnyonyo001@st.ug.edu.gh", // provide email
        phone: "+233208354006", //provide  phone number
        password: "Password123?"  // provide password
      }
      const response = await request(app)
        .post("/api/user/createUser")
        .send(user)

      expect(response.status).toBe(200)
      expect(response.body.responseCode).toBe(9011)
  });
  // for verifying user
  test("Verify user", async () => {
      const user = {
        email: "hnyonyo001@st.ug.edu.gh", // provide email
        OTP: "122345"
      }
      const response =await request(app)
        .put("/api/user/verify")
        .send(user)
      
      expect(response.status).toBe(404)  
      expect(response.body.responseCode).toBe(9012)
  });
  test("Login user", async () => {
    // provive a test user info
      const user = {
        email: "hnyonyo001@st.ug.edu.gh", // provide email
        password: "Password123?"  // provide password
      }
      const response = await request(app)
        .post("/api/user/login")
        .send(user)
      
      expect(response.status).toBe(404)  // because you couldn't verify
      expect(response.body.responseCode).toBe(9012)
  });
  // for resetting user password
  test("Reset password", async () => {
      const user = {
        email: "hnyonyo001@st.ug.edu.gh",  // provide email
        pass_new: "Testpass1!",            // provide  new password
      }
      const response = await request(app)
        .put("/api/user/resetPassword")
        .send(user)

      expect(response.status).toBe(401)   //no token
      expect(response.body.responseCode).toBe(9013)
  });

  
  // for sending OTP
  test("Send otp", async () => {
    const user = {
      email: "hnyonyo001@st.ug.edu.gh" // provide email
    }
    const response = await request(app)
      .post("/api/user/otp")
      .send(user)

    expect(response.status).toBe(401)   //user does not exist
    expect(response.body.responseCode).toBe(9013)
});

  // for deleting user
  test("Delete user", async () => {
      const user = {
        email: "hnyonyo001@st.ug.edu.gh", // provide email
      }
      const response = await request(app)
        .delete("/api/user/delete")
        .send(user)
      expect(response.status).toBe(404)   //user does not exist
      expect(response.body.responseCode).toBe(9012)
  });

  //Update user
  test("Update User Info",async () => {
    const file = path.join(__dirname,'test_assets','pic.png')
    const user = {
      name: "Henry",
      link: 'link',
      email:"hnyonyo001@st.ug.edu.gh"
    }
    const response = await request(app)
        .put("/api/user/setting")
        .attach('file', file)
        .field(user)
      expect(response.status).toBe(401)   //token does not exist
      expect(response.body.responseCode).toBe(9013)
  })
}
)