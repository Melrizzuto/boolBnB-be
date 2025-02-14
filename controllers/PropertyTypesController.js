import connection from "../connection.js";
import customError from "../classes/customError.js";

export const getPropertyTypes = async (req, res, next) => {
    try {
        const [rows] = await connection.query("SELECT id, type_name AS name FROM properties_type");
        console.log("📌 Tipi di proprietà trovati nel database:", rows);
        res.status(200).json(rows);
    } catch (error) {
        console.error("❌ Errore nel recupero dei tipi di proprietà:", error);
        next(new customError(500, "Errore del server"));
    }
};