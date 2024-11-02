const request = require("supertest");
const app = require("../app");
const { hash } = require("../helpers/bcrypt");
const { sequelize } = require("../models");

let access_token;

beforeAll(async () => {
  // Seeding User
  const users = [
    {
      email: "user1@mail.com",
      password: hash("user1"),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      email: "test@mail.com",
      password: hash("12345"),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  await sequelize.queryInterface.bulkInsert("Users", users, {});
});

afterAll(async () => {
  await sequelize.queryInterface.bulkDelete("Users", null, {
    truncate: true,
    cascade: true,
  });
});

describe("POST /register", () => {
  describe("POST /register - succeed", () => {
    it("should return an object with new user data", async () => {
      const body = {
        email: "newuser@mail.com",
        password: "newpassword",
        role: "user",
      };
      const response = await request(app).post("/register").send(body);

      expect(response.status).toBe(201);
      expect(response.body).toBeInstanceOf(Object);
    });
  });

  describe("POST /register - fail", () => {
    it("should return an error message when email is empty", async () => {
      const body = { email: "", password: "12345", role: "user" };
      const response = await request(app).post("/register").send(body);

      expect(response.status).toBe(400);
      expect(response.body).toBeInstanceOf(Object);
      expect(response.body).toHaveProperty("message", expect.any(String));
    });

    it("should return an error message when password is empty", async () => {
      const body = { email: "newuser2@mail.com", password: "", role: "user" };
      const response = await request(app).post("/register").send(body);

      expect(response.status).toBe(400);
      expect(response.body).toBeInstanceOf(Object);
      expect(response.body).toHaveProperty("message", expect.any(String));
    });

    it("should return an error message when email is already registered", async () => {
      const body = { email: "user1@mail.com", password: "user1", role: "user" };
      const response = await request(app).post("/register").send(body);

      expect(response.status).toBe(400);
      expect(response.body).toBeInstanceOf(Object);
      expect(response.body).toHaveProperty("message", expect.any(String));
    });
  });
});

describe("POST /login", () => {
  describe("POST /login - succeed", () => {
    it("should return an object with message and access_token", async () => {
      const body = { email: "user1@mail.com", password: "user1" };
      const response = await request(app).post("/login").send(body);

      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Object);
      expect(response.body).toHaveProperty("access_token", expect.any(String));
    });
  });

  describe("POST /login - fail", () => {
    it("should return an error message when email is empty", async () => {
      const body = { email: "", password: "12345" };
      const response = await request(app).post("/login").send(body);

      expect(response.status).toBe(400);
      expect(response.body).toBeInstanceOf(Object);
      expect(response.body).toHaveProperty("message", expect.any(String));
    });

    it("should return an error message when password is empty", async () => {
      const body = { email: "test@mail.com", password: "" };
      const response = await request(app).post("/login").send(body);

      expect(response.status).toBe(400);
      expect(response.body).toBeInstanceOf(Object);
      expect(response.body).toHaveProperty("message", expect.any(String));
    });

    it("should return an error message when email is invalid", async () => {
      const body = { email: "invalid@mail.com", password: "12345" };
      const response = await request(app).post("/login").send(body);

      expect(response.status).toBe(500);
      expect(response.body).toBeInstanceOf(Object);
      expect(response.body).toHaveProperty("message", expect.any(String));
    });

    it("should return an error message when password is invalid", async () => {
      const body = { email: "test@mail.com", password: "wrongpassword" };
      const response = await request(app).post("/login").send(body);

      expect(response.status).toBe(401);
      expect(response.body).toBeInstanceOf(Object);
      expect(response.body).toHaveProperty("message", expect.any(String));
    });
  });
});
