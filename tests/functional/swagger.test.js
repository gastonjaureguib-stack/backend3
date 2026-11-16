import { describe, it } from "mocha";
import { expect } from "chai";
import request from "supertest";

import app from "../../src/app.js";
import swaggerConfig from "../../src/config/swagger.config.js";

describe("Swagger - Pruebas funcionales", () => {
  it("debe redirigir /api/docs a /api/docs/", async () => {
    const response = await request(app).get("/api/docs").redirects(0);

    expect(response.status).to.equal(301);
    expect(response.headers.location).to.equal("/api/docs/");
  });

  it("debe servir la interfaz HTML con su título y recursos", async () => {
    const response = await request(app).get("/api/docs/");

    expect(response.status).to.equal(200);
    expect(response.headers["content-type"]).to.include("text/html");
    expect(response.text).to.include(
      "<title>ShipNow API Documentation</title>"
    );
    expect(response.text).to.include('id="swagger-ui"');
    expect(response.text).to.include("swagger-ui-init.js");
  });

  it("debe servir la especificación OpenAPI con los seis grupos y sus rutas", async () => {
    const response = await request(app).get("/api/docs/swagger-ui-init.js");

    expect(response.status).to.equal(200);
    expect(response.headers["content-type"]).to.include("application/javascript");

    const optionsMatch = response.text.match(
      /var options = (\{[\s\S]*?\});\s*url = options\.swaggerUrl/
    );

    expect(optionsMatch).to.not.equal(null);

    const specification = JSON.parse(optionsMatch[1]).swaggerDoc;

    expect(specification).to.deep.equal(swaggerConfig);
    expect(specification.openapi).to.equal("3.0.3");
    expect(specification.info.title).to.equal("ShipNow API");
    expect(specification.tags.map((tag) => tag.name)).to.have.members([
      "Users", "Products", "Orders", "Deliveries", "Mocks", "Logger",
    ]);

    for (const [path, method] of [
      ["/api/users", "get"],
      ["/api/products", "get"],
      ["/api/orders", "get"],
      ["/api/deliveries", "get"],
      ["/api/mocks/users", "get"],
      ["/api/mocks/seed", "post"],
      ["/api/logger/test", "get"],
    ]) {
      expect(specification.paths).to.have.property(path);
      expect(specification.paths[path]).to.have.property(method);
    }

    expect(specification.components.schemas).to.include.all.keys(
      "User", "Product", "Order", "Delivery", "Error"
    );

    const seedPayload = specification.paths["/api/mocks/seed"]
      .post.responses[201].content["application/json"].schema.properties.payload;

    for (const name of ["users", "drivers", "products", "orders", "deliveries"]) {
      expect(seedPayload.properties[name].type).to.equal("integer");
    }
  });

  it("debe rechazar package.json desde el middleware de Swagger", async () => {
    const response = await request(app).get("/api/docs/package.json");

    expect(response.status).to.equal(404);
    expect(response.headers["content-type"]).to.include("text/plain");
    expect(response.text).to.equal("Not Found");
  });
});
