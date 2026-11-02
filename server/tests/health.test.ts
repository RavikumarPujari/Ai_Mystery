import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";

describe("Health Check Endpoints", () => {
  it("GET /health returns 200 with standard response format", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body).toHaveProperty("requestId");
    expect(res.body.data).toHaveProperty("status", "ok");
    expect(res.body.data).toHaveProperty("timestamp");
    expect(res.body.data.services).toHaveProperty("api", "healthy");
  });

  it("GET /api/v1/health returns 200 with standard response format", async () => {
    const res = await request(app).get("/api/v1/health");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body.data).toHaveProperty("status", "ok");
  });

  it("GET /unknown-route returns 404 with standard error format", async () => {
    const res = await request(app).get("/unknown-route");

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("success", false);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error.code).toBe("NOT_FOUND");
    expect(res.body).toHaveProperty("requestId");
  });
});

