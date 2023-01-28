/** External Library */
import express from "express";
import cors from "cors";

/** Router Files */
import documentRouter from "./document.js";

const app = express();
const PORT = 5001;

app.use(express.json({ limit: "50mb", extended: true }));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));

//  Cors
app.use(
  cors({
    origin: "*",
    methods: ["PATCH"],
  })
);

// Routers
app.use("/api/v1/document", documentRouter);

app.use((err, req, res, next) => {
  res.status(500).json({
    success: false,
    message: err.message || "Server Error",
  });
});

//  Listening port
app.listen(PORT, () => {
  console.log(`Server running on PORT ${PORT}`);
});
