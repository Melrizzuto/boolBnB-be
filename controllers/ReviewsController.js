import connection from "../connection.js";
import customError from "../classes/customError.js";

export const addReview = async (req, res, next) => {
  try {
    const { review_text, rating, start_date, end_date } = req.body;
    const { propertyId } = req.params;

    // Verifica che tutti i campi obbligatori siano presenti
    if (!review_text || !rating || !start_date || !end_date) {
      return next(new customError(400, "Tutti i campi sono obbligatori."));
    }

    if (rating < 1 || rating > 5) {
      return next(new customError(400, "La valutazione deve essere compresa tra 1 e 5."));
    }

    // Verifica che la proprietà esista
    const propertyQuery = 'SELECT * FROM properties WHERE id = ?';
    const [propertyRows] = await connection.execute(propertyQuery, [propertyId]);

    if (propertyRows.length === 0) {
      return next(new customError(404, 'Proprietà non trovata'));
    }

    // Inserimento recensione nel database
    const reviewQuery = `
          INSERT INTO reviews (property_id, review_text, rating, start_date, end_date)
          VALUES (?, ?, ?, ?, ?, ?)
        `;

    await connection.execute(reviewQuery, [
      propertyId,
      review_text,
      rating,
      start_date,
      end_date,
    ]);

    res.status(201).json({ message: 'Recensione inviata con successo!' });
  } catch (error) {
    console.error("Errore nell'aggiungere la recensione:", error);
    next(new customError(500, "Errore del server"));
  }
};

export const getReviews = async (req, res, next) => {
  try {
    const { propertyId } = req.params; // Estrai propertyId dai parametri

    const query = `
            SELECT r.*, u.name 
            FROM reviews r 
            JOIN \`user\` u ON r.user_id = u.id 
            WHERE r.property_id = ?
        `;

    const [reviews] = await connection.execute(query, [propertyId]);

    res.status(200).json({ reviews });
  } catch (error) {
    console.error("Errore nel recupero delle recensioni:", error);
    next(new customError(500, "Errore del server"));
  }
};