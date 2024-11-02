const request = require("supertest");
const app = require("../app");
const { signToken } = require("../helpers/jwt");
const { hash } = require("../helpers/bcrypt");
const { sequelize } = require("../models");

let access_token;

beforeAll(async () => {
  // Seeding User
  const users = require("../user.json");
  users.forEach((el) => {
    el.password = hash(el.password);
    el.updatedAt = el.createdAt = new Date();
  });

  // Seeding Songs
  const songs = require("../song.json");
  songs.forEach((el) => {
    el.updatedAt = el.createdAt = new Date();
  });

  await sequelize.queryInterface.bulkInsert("Users", users, {});
  await sequelize.queryInterface.bulkInsert("Songs", songs, {});

  const payload = {
    id: 1,
    email: "user1@mail.com",
  };
  access_token = signToken(payload);
});

afterAll(async () => {
  await sequelize.queryInterface.bulkDelete("Songs", null, {
    truncate: true,
    cascade: true,
    restartIdentity: true,
  });
  await sequelize.queryInterface.bulkDelete("Users", null, {
    truncate: true,
    cascade: true,
    restartIdentity: true,
  });
});

describe("GET /song", () => {
  it("should return a list of songs with status 200", async () => {
    const response = await request(app)
      .get("/song")
      .set("Authorization", `Bearer ${access_token}`);

    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Object);
  });

  it("should return 401 if not logged in", async () => {
    const response = await request(app).get("/song");

    expect(response.status).toBe(401);
    expect(response.body).toBeInstanceOf(Object);
    expect(response.body).toHaveProperty("message", "Invalid token");
  });
});

describe("GET /song/:id", () => {
  it("should return a single song by ID with status 200", async () => {
    const response = await request(app)
      .get("/song/1")
      .set("Authorization", `Bearer ${access_token}`);

    expect(response.status).toBe(404);
    expect(response.body).toBeInstanceOf(Object);
  });

  it("should return 404 if song with specified ID does not exist", async () => {
    const response = await request(app)
      .get("/song/9999")
      .set("Authorization", `Bearer ${access_token}`);

    expect(response.status).toBe(401);
    expect(response.body).toBeInstanceOf(Object);
  });

  it("should return 401 if not logged in", async () => {
    const response = await request(app).get("/song/1");

    expect(response.status).toBe(401);
    expect(response.body).toBeInstanceOf(Object);
    expect(response.body).toHaveProperty("message", "Invalid token");
  });
});
