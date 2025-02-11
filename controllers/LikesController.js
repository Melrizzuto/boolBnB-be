import connection from "../connection.js";
import customError from "../classes/customError.js";

//fun.1 per ottenere il numero di like di una proprietà
export function getLikesCount(req, res, next) {
    const { property_id } = req.params;

    // se manca property_id restituisco errore 400
    if (!property_id) {
        return next(new customError(400, "property_id is required"));
    }

    const query = "SELECT COUNT(*) AS likesCount FROM likes WHERE property_id = ?";

    connection.query(query, [property_id], (error, rows) => {
        if (error) {
            console.error("error counting likes:", error);
            return next(new customError(500, "Internal server error"));
        }
        res.json({
            likesCount: rows[0]?.likesCount || 0
        });
    });
}

//fun. 2 per aggiungere un like
export function addLike(req, res, next) {
    console.log("addLike called"); // Log per verificare la chiamata
    const { user_id, property_id } = req.body;

    if (!user_id || !property_id) {
        return next(new customError(400, "user_id and property_id are required"));
    }

    const insertQuery = "INSERT INTO likes (user_id, property_id) VALUES (?, ?)";

    connection.query(insertQuery, [user_id, property_id], (error) => {
        if (error) {
            console.error("error adding like:", error);
            return next(new customError(500, "internal server error"));
        }
        console.log("Like added successfully!"); // Log dopo l'inserimento
        res.status(201).json({
            message: "Like added!"
        });
    });
}