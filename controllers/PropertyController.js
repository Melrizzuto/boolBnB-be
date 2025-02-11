import connection from "../connection.js";
import nodemailer from "nodemailer"
import customError from "../classes/customError.js";

/**
 * Aggiunge un nuovo immobile al database.
 * La richiesta deve contenere i seguenti campi:
 * - user_id: l'ID dell'utente proprietario
 * - title: il titolo dell'immobile
 * - num_rooms: il numero di stanze
 * - num_beds: il numero di letti
 * - num_bathrooms: il numero di bagni
 * - square_meters: la superficie dell'immobile in metri quadrati
 * - address: l'indirizzo dell'immobile
 * - image: l'immagine dell'immobile (facoltativa)
 * - property_type: il tipo di immobile (es. flat, house, etc.)
 * 
 * La funzione verifica la validità  dei dati e restituisce un errore 400 se i dati sono invalidi.
 * Inoltre, verifica che l'utente sia proprietario e restituisce un errore 403 se non lo .
 * Se l'operazione riesce, restituisce un messaggio di successo con codice di stato 201.
 * Se si verifica un errore durante l'operazione, restituisce un messaggio di errore con codice di stato 500.
 */
export const addProperty = async (req, res, next) => {
    try {
        // Verifica presenza dati
        const { user_id, title, num_rooms, num_beds, num_bathrooms, square_meters, address, image, property_type } = req.body;

        if (!user_id || !title || !num_rooms || !num_beds || !num_bathrooms || !square_meters || !address || !property_type) {
            return next(new customError(400, "Tutti i campi sono obbligatori."));
        }
        // Verifica validità dati:
        if (typeof title !== 'string' || title.trim() === '') {
            return next(new customError(400, "Il titolo deve essere una stringa non vuota"));
        }

        if (typeof address !== 'string' || address.trim() === '') {
            return next(new customError(400, "L'indirizzo deve essere una stringa non vuota"));
        }

        // Verifica che i numeri siano positivi
        if (num_rooms <= 0 || num_beds <= 0 || num_bathrooms <= 0 || square_meters <= 0) {
            return next(new customError(400, "Numero di stanze, letti, bagni e metri quadrati devono essere valori positivi"));
        }

        if (typeof property_type !== 'string' || property_type.trim() === '') {
            return next(new customError(400, "Il tipo di immobile deve essere una stringa non vuota"));
        }

        // Verifica che utente sia proprietario:
        const userQuery = "SELECT user_type FROM user WHERE id = ?";
        const [userRows] = await connection.execute(userQuery, [user_id]);
        
        if (userRows.length === 0 || userRows[0].user_type !== 'proprietario') {
            return next(new customError(403, "Solo i proprietari possono aggiungere immobili."));
        }

        const query = `
        INSERT INTO properties (user_id, title, num_rooms, num_beds, num_bathrooms, square_meters, address, image, property_type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        await connection.execute(query, [
            user_id,
            title,
            num_rooms,
            num_beds,
            num_bathrooms,
            square_meters,
            address,
            image || null,
            property_type,
          ]);
      
          res.status(201).json({ message: "Immobile aggiunto con successo!" });

    }
    catch (error) {
        console.error("Errore nel controller addProperty:", error);
        next(new customError(500, "Errore del server"));
    }
};

export const searchProperties = async (req, res, next) => {
    try{
        // Estrai i parametri dalla query string
        const { searchTerm, minRooms, minBeds, propertyType } = req.query;

          // Validazione dei parametri
        if (searchTerm && typeof searchTerm !== 'string') {
            return next(new customError(400, "Il termine di ricerca deve essere una stringa"));
        }
          // Impostazioni predefinite per i filtri
          const searchQuery = `%${searchTerm || ''}%`;
          const minRoomsFilter = parseInt(minRooms, 10) || 0;
          const minBedsFilter = parseInt(minBeds, 10) || 0;
          const propertyTypeFilter = `%${propertyType || ''}%`;
           // Verifica che minRooms e minBeds siano numeri positivi
        if (minRoomsFilter < 0 || minBedsFilter < 0) {
            return next(new customError(400, "I filtri minRooms e minBeds devono essere numeri positivi"));
        }
          // Query dinamica per la ricerca
          const query = `
          SELECT 
            p.id, 
            p.title, 
            p.num_rooms, 
            p.num_beds, 
            p.num_bathrooms, 
            p.square_meters, 
            p.address, 
            p.image, 
            p.property_type, 
            COUNT(r.id) AS num_reviews, 
            SUM(r.rating) AS total_votes 
          FROM 
            properties p
          LEFT JOIN 
            reviews r ON p.id = r.property_id
          WHERE 
            p.address LIKE ? 
            AND p.num_rooms >= ? 
            AND p.num_beds >= ? 
            AND p.property_type LIKE ?
          GROUP BY 
            p.id
          ORDER BY 
            total_votes DESC;
        `;
        // Esecuzione query
        const [rows] = await connection.execute(query, [
            searchQuery,
            minRoomsFilter,
            minBedsFilter,
            propertyTypeFilter,
          ]);
        // Risultati:
        res.status(200).json({
            message: "Ricerca completata con successo",
            results: rows,
          });    
    }
    catch (error) {
        console.error("Errore nella ricerca delle proprietà:", error);
        res.status(500).json({ message: "Errore del server" });
    }
};

export const getProperitesDetails = async (req, res, next) => {
    try {
        const {id} = req.params;
        // Query per ottenere i dettagli dell'immobile e le recensioni
        const query = `
        SELECT 
            p.id,
            p.title,
            p.num_rooms,
            p.num_beds,
            p.num_bathrooms,
            p.square_meters,
            p.address,
            p.image,
            p.property_type,
            COUNT(r.id) AS num_reviews,
            SUM(r.rating) AS total_votes,
            GROUP_CONCAT(CONCAT(r.name, ': ', r.text) ORDER BY r.created_at DESC) AS reviews
        FROM 
            properties p
        LEFT JOIN 
            reviews r ON p.id = r.property_id
        WHERE 
            p.id = ?
        GROUP BY 
            p.id;
        `;
        // Esecuzione query
        const [rows] = await connection.execute(query, [id]);
        if (rows.length === 0) {
            return next(new customError(404, "Immobile non trovato"));
        }

        // Restituire i dettagli dell'immobile
        res.status(200).json({
            message: "Dettagli immobile recuperati con successo",
            property: rows[0],
        });
    }
    catch (error) {
        console.error("Errore nel recupero dei dettagli dell'immobile:", error);
        next(new customError(500, "Errore del server"));
    };
};

export const contactOwner = async (req, res, next) => {
    try {
      const { propertyId } = req.params;
      const { email, message, ownerEmail } = req.body;
  
      // Verifica che la proprietà esista
      const propertyQuery = 'SELECT * FROM properties WHERE id = ?';
      const [propertyRows] = await connection.execute(propertyQuery, [propertyId]);
  
      if (propertyRows.length === 0) {
        return next(new customError(404, 'Proprietà non trovata'));
      }
  
      // Crea un trasportatore per inviare l'email (configurazione di Nodemailer)
      const transporter = nodemailer.createTransport({
        service: 'gmail',  // Puoi cambiare il servizio di email se necessario
        auth: {
          user: process.env.EMAIL_USER,  // La tua email
          pass: process.env.EMAIL_PASSWORD,  // La tua password o una password per app
        },
      });
  
      // Imposta il contenuto dell'email
      const mailOptions = {
        from: email,
        to: ownerEmail,
        subject: `Nuovo messaggio riguardante l'immobile ${propertyRows[0].title}`,
        text: message,
      };
  
      // Invia l'email
      await transporter.sendMail(mailOptions);
  
      // Risposta positiva
      res.status(200).json({
        message: 'Messaggio inviato con successo al proprietario!',
      });
    } catch (error) {
      console.error('Errore nell\'invio del messaggio:', error);
      next(new customError(500, 'Errore del server'));
    }
  };