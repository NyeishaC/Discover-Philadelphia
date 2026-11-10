import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

app.use((error: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  const parserError = error as { type?: string; status?: number };
  if (parserError.type === "entity.too.large") {
    res.status(413).json({ error: "Image payload must be 3 MB or smaller." });
    return;
  }
  if (parserError.status === 400) {
    res.status(400).json({ error: "Request body must contain valid JSON." });
    return;
  }
  next(error);
});

export default app;
