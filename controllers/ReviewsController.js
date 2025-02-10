import connection from "../connection.js";

export const addReview = async (req, res) => {
    try {
        const { user_id, review_text, rating, stay_date, num_days } = req.body;
        const { propertyId } = req.params;
    
        // Verifica che tutti i campi obbligatori siano presenti
        if (!user_id || !review_text || !rating || !stay_date || !num_days) {
          return res.status(400).json({ message: "Tutti i campi sono obbligatori." });
        }
    
        if (rating < 1 || rating > 5) {
          return res.status(400).json({ message: "La valutazione deve essere tra 1 e 5." });
        }
    
        // Verifica che la proprietà esista
        const propertyQuery = 'SELECT * FROM properties WHERE id = ?';
        const [propertyRows] = await connection.execute(propertyQuery, [propertyId]);
    
        if (propertyRows.length === 0) {
          return res.status(404).json({ message: 'Proprietà non trovata' });
        }
    
        // Inserimento recensione nel database
        const reviewQuery = `
          INSERT INTO reviews (property_id, user_id, review_text, rating, stay_date, num_days)
          VALUES (?, ?, ?, ?, ?, ?)
        `;
    
        await connection.execute(reviewQuery, [
          propertyId,
          user_id,
          review_text,
          rating,
          stay_date,
          num_days,
        ]);
    
        res.status(201).json({ message: 'Recensione inviata con successo!' });
      } catch (error) {
        console.error("Errore nell'aggiungere la recensione:", error);
        res.status(500).json({ message: "Errore del server" });
      }
};

export const getReviews = async (req, res) => {
    try{
        const { propertyId } = req.params;
        const query = 'SELECT * FROM reviews WHERE property_id = ? ORDER BY created_at DESC';
        const [rows] = await connection.execute(query, [propertyId]);
        res.status(200).json({ reviews: rows }); 
    }
    catch (error) {
        console.error("Errore nel recupero delle recensioni:", error);
        res.status(500).json({ message: "Errore del server" }); 
    }
};