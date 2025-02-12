import connection from "../connection.js";
import customError from "../classes/customError.js";

export const addReview = async (req, res, next) => {
  try {
    const { review_text, rating, start_date, end_date, user_email, user_name } = req.body;
    const { slug } = req.params;

    if (!review_text || !rating || !start_date || !end_date || !user_email || !user_name) {
      return next(new customError(400, "Tutti i campi sono obbligatori."));
    }

    if (rating < 1 || rating > 5) {
      return next(new customError(400, "La valutazione deve essere compresa tra 1 e 5."));
    }

    // Trova il property_id dallo slug
    const propertyQuery = "SELECT id FROM properties WHERE slug = ?";
    const [propertyRows] = await connection.execute(propertyQuery, [slug]);

    if (propertyRows.length === 0) {
      return next(new customError(404, "Proprietà non trovata"));
    }

    const propertyId = propertyRows[0].id;

    // Inserimento della recensione con user_name e user_email
    const reviewQuery = `
      INSERT INTO reviews (property_id, user_name, user_email, review_text, rating, start_date, end_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await connection.execute(reviewQuery, [
      propertyId,
      user_name,
      user_email,
      review_text,
      rating,
      start_date,
      end_date,
    ]);

    res.status(201).json({ message: "Recensione inviata con successo!" });
  } catch (error) {
    console.error("Errore nell'aggiungere la recensione:", error);
    next(new customError(500, "Errore del server"));
  }
};
export const getReviews = async (req, res, next) => {
  try {
    const { slug } = req.params;

    // Recupera il property_id dallo slug
    const propertyQuery = "SELECT id FROM properties WHERE slug = ?";
    const [propertyRows] = await connection.execute(propertyQuery, [slug]);

    if (propertyRows.length === 0) {
      return next(new customError(404, "Proprietà non trovata"));
    }

    const propertyId = propertyRows[0].id;

    // Recupera le recensioni della proprietà
    const query = `
      SELECT r.review_text, r.rating, r.start_date, r.end_date, r.user_email, r.user_name, r.created_at
      FROM reviews r 
      WHERE r.property_id = ?
    `;

    const [reviews] = await connection.execute(query, [propertyId]);

    res.status(200).json({ reviews });
  } catch (error) {
    console.error("Errore nel recupero delle recensioni:", error);
    next(new customError(500, "Errore del server"));
  }
};