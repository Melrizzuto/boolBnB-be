import express from "express";
const app = express();
const port = 3000;

import errorsHandler from "./middlewares/errorsHandler.js";
import notFound from "./middlewares/notFound.js";
import corsPolicy from "./middlewares/corsPolicy.js";
import router from "./routers/properties.js";

app.use(express.static("public"));

app.use(corsPolicy);

app.use(express.json());

app.use("/properties", router);

app.use(notFound);

app.use(errorsHandler);

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
})