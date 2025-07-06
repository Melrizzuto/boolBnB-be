import express from "express";
import errorsHandler from "./middlewares/errorsHandler.js";
import notFound from "./middlewares/notFound.js";
import router from "./routers/properties.js";
import reviewsRouter from "./routers/reviews.js";
import property_type_Router from "./routers/property_types.js";
import cors from "cors";
import multer from "multer";
import path from "path";

const app = express();

// Legge la porta da Render o usa 3000 in locale
const port = process.env.PORT || 3000;

// Abilita CORS per tutte le richieste
app.use(cors());

// Serve file statici dalla cartella "public"
app.use("/public", express.static(path.join(process.cwd(), "public")));

// Parsing JSON
app.use(express.json());

// Rotte
app.use("/api", property_type_Router);
app.use("/properties", router);
app.use("/properties/:slug/reviews", reviewsRouter);

// Error handling
app.use(errorsHandler);
app.use(notFound);

// Start del server sulla porta corretta
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
