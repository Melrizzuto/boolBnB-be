import express from "express";
import errorsHandler from "./middlewares/errorsHandler.js";
import notFound from "./middlewares/notFound.js";
import router from "./routers/properties.js";
import reviewsRouter from "./routers/reviews.js";
import property_type_Router from "./routers/property_types.js";
import cors from "cors";
import multer from "multer";

const app = express(); // Creazione istanza dell'app express
const port = 3000;

// Abilita CORS per tutte le richieste
app.use(cors());

// Imposta una cartella statica "public" per servire file statici
app.use(express.static("public"));

// Usa il middleware per la gestione delle politiche CORS (se necessario)
app.use(cors()); // Se "corsPolicy" è utile, assicurati che sia definito correttamente

// Imposta il middleware per il parsing del corpo delle richieste in formato JSON
app.use(express.json());

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        return cb(null, "./public");
    },
    filename: function (req, file, cb) {
        return cb(null, file.originalname);
    }
})

const upload = multer({ storage: storage });

app.post("/upload", upload.single("image"), (req, res) => {
    console.log(req.body);
    console.log(req.file);
    res.status(200).json({ message: "File uploaded successfully", file: req.file });
})

app.use("/api", property_type_Router);

// Registra il router delle proprietà
app.use("/properties", router);

// Registra il router delle recensioni
app.use("/properties/:slug/reviews", reviewsRouter);

// Usa il middleware per la gestione degli errori globali
app.use(errorsHandler);

// Usa il middleware per gestire le richieste a rotte non definite
app.use(notFound);

// Avvia il server, ascoltando sulla porta definita
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
