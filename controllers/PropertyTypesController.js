import connection from "../connection.js";
import customError from "../classes/customError.js";

export const getPropertyTypes = async (req, res, next) => {
    try {
        const [rows] = await connection.query("SELECT * FROM properties_type");
        res.status(200).json({ types: rows }); // Modifica qui
    } catch (error) {
        console.error("Errore nel recupero dei tipi di proprietà:", error);
        next(new customError(500, "Errore del server"));
    }
};
