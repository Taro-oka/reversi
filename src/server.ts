import express from "express";
import morgan from "morgan";
import "express-async-errors";
import { gameRouter } from "./presentation/gameRouter";
import { turnRouter } from "./presentation/turnRouter";

const PORT = 3000;
const app = express();
app.use(morgan("dev"));
app.use(express.static("static", { extensions: ["html"] }));
app.use(express.json()); // req.body内に受け取ったjsonを格納できるように

app.use(gameRouter);
app.use(turnRouter);

app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("error!", err);
    res.status(500).send({
      message: err instanceof Error ? err.message : "Unexpected error occurred",
    });
  }
);

export const startServer = () => {
  app.listen(PORT, () => {
    console.log("started!!");
  });
};
