import connection from "../connection.js";
import customError from "../classes/customError.js";

//fun.1 verifico se l utente ha già messo like a una proprietà 
export function checkLike(req, res, next) {
    const { user_id, property_id } = req.query;

    // se mancano user_id o property_id restituisco errore 400
    if (!user_id || !property_id) {
        return next(new customError(400, "user_id and property_id are required"));
    }

    // eseguo la query per verificare se l utente ha già messo like alla proprietà
    const query = "SELECT * FROM likes WHERE user_id = ? AND property_id = ?";

    connection.query(query, [user_id, property_id], (error, rows) => {
        // se c'è un errore nella query lo gestisco e restituisco errore 500
        if (error) {
            console.error("error checking like:", error);
            return next(new customError(500, "internal server error"));
        }

        // se l utente ha già messo like  restituisco liked true altrimenti false
        res.json({ liked: rows.length > 0 });
    });
}

// fun.2 l utente può aggiungere o rimuovere un like
export function toggleLike(req, res, next) {
    const { user_id, property_id } = req.body;

    // se mancano user_id o property_id restituisco errore 400
    if (!user_id || !property_id) {
        return next(new customError(400, "user_id and property_id are required"));
    }

    // verifico se l utente ha già messo like alla proprietà
    const checkQuery = "SELECT * FROM likes WHERE user_id = ? AND property_id = ?";
    connection.query(checkQuery, [user_id, property_id], (error, existing) => {
        // se c'è un errore nella query, lo gestisco e restituisco errore 500
        if (error) {
            console.error("error checking like:", error);
            return next(new customError(500, "internal server error"));
        }

        if (existing.length > 0) {
            // se il like esiste lo rimuovo
            const deleteQuery = "DELETE FROM likes WHERE user_id = ? AND property_id = ?";
            connection.query(deleteQuery, [user_id, property_id], (delError) => {
                // se c'è un errore nella query lo gestisco e restituisco errore 500
                if (delError) {
                    console.error("error removing like:", delError);
                    return next(new customError(500, "internal server error"));
                }

                // restituisco una risposta indicando che il like è stato rimosso
                res.json({ message: "like removed!", liked: false });
            });
        } else {
            // se non esiste aggiungo il like
            const insertQuery = "INSERT INTO likes (user_id, property_id) VALUES (?, ?)";
            connection.query(insertQuery, [user_id, property_id], (insError) => {
                // se c'è un errore nella query lo gestisco e restituisco errore 500
                if (insError) {
                    console.error("error adding like:", insError);
                    return next(new customError(500, "internal server error"));
                }

                // restituisco una risposta indicando che il like è stato aggiunto
                res.status(201).json({ message: "like added!", liked: true });
            });
        }
    });
}

//fn.3 conteggio di quanti like ha una proprietà
export function getLikesCount(req, res, next) {
    const { property_id } = req.params;

    // se manca property_id restituisco errore 400
    if (!property_id) {
        return next(new customError(400, "property_id is required"));
    }

    // eseguo la query per contare quanti like ha una proprietà
    const query = "SELECT COUNT(*) AS likesCount FROM likes WHERE property_id = ?";

    connection.query(query, [property_id], (error, rows) => {
        // se c'è un errore nella query, lo gestisco e restituisco errore 500
        if (error) {
            console.error("error counting likes:", error);
            return next(new customError(500, "internal server error"));
        }

        // restituisco il numero di like della proprietà
        res.json({ likesCount: rows[0].likesCount });
    });
}

