import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

let monitors = [];

app.post("/api/monitors", (request, response) => {
  const { name, url, interval } = request.body;

  const monitor = {
    id: Date.now(),
    name,
    url,
    interval,
    status: "Pending",
  };

  monitors.push(monitor);

  response.status(201).json(monitor);
});

app.get("/api/monitors", (request, response) => {
  response.json(monitors);
});

app.get("/api/health", (request, response) => {
  response.json({
    status: "ok"
  });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});