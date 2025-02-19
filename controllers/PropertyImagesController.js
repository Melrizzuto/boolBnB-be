import connection from "../connection.js";
import CustomError from "../classes/customError.js";

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