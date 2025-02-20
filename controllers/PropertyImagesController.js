import connection from "../connection.js";
import CustomError from "../classes/customError.js";
import upload from "../utils/imageUpload.js"
import path from "path";

export const searchSecondaryImageBySlug = async (req, res, next) => {
    try {
        const { slug } = req.params;
        const { img_name } = req.query;

        const querySlug = `
        SELECT id FROM properties WHERE slug = ?
        `
        const [property] = await connection.query(querySlug, [slug]);
        if (property.length === 0) {
            return next(new CustomError(404, "Proprietà non trovata"));
        }
        const propertyId = property[0].id;
        const queryImage = `
        SELECT img_name FROM property_images WHERE property_id = ?
        `
        const [images] = await connection.query(queryImage, [propertyId]);
        res.json(images);
    } catch (error) {
        console.error("Errore nella ricerca delle foto secondarie:", error);
        next(new CustomError(500, "Errore del server"));
    }
}

export const addSecondaryImages = async (req, res, next) => {
    upload(req, res, async (err) => {
        if (err) return next(new CustomError(400, "Accesso negato"));
        const { slug } = req.params;

        try {
            const queryProperty = `SELECT id FROM properties WHERE slug = ?`;
            const [property] = await connection.query(queryProperty, [slug]);

            if (property.length === 0) return next(CustomError(404, "Proprietà non trovata"));

            const propertyId = property[0].id;

            //Controllo immagini in upload
            if (!req.files?.images || req.files.images.length === 0) {
                return next(new CustomError(400, "Nessuna immagine caricata"));
            }

            const imageUrls = req.files.images.map((file) => `/${file.filename}`);
            const values = imageUrls.map((url) => [propertyId, url]);

            const queryAddImages = `INSERT INTO property_images (property_id, img_name) VALUES ?`;
            await connection.query(queryAddImages, [values]);

            res.status(201).json({ message: "Immagini aggiunte con successo", images: imageUrls });
        }
        catch (error) {
            console.error("Errore nell'aggiunta delle immagini secondarie:", error);
            next(new CustomError(500, "Errore del server"));
        }
    });
};
