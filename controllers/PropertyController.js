import connection from "../connection.js";
import nodemailer from "nodemailer"
import customError from "../classes/customError.js";

export const addProperty = async (req, res, next) => {
    try {
        // Verifica presenza dati
        const { user_name, user_email, title, num_rooms, num_beds, num_bathrooms, square_meters, address, image, property_type } = req.body;

        if (!user_name || !user_email || !title || !num_rooms || !num_beds || !num_bathrooms || !square_meters || !address || !property_type) {
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
        const userQuery = "SELECT user_type FROM `user` WHERE id = ?";
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
            p.user_id, 
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
            IFNULL(SUM(r.rating), 0) AS total_votes,
            GROUP_CONCAT(CONCAT(u.name, ': ', r.review_text) ORDER BY r.created_at DESC SEPARATOR ' || ') AS reviews
        FROM 
            properties p
        LEFT JOIN 
            reviews r ON p.id = r.property_id
        LEFT JOIN 
            user u ON r.user_id = u.id
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
      const { email, message } = req.body;

      // Verifica che la proprietà esista e ottieni l'email del proprietario
      const propertyQuery = `
          SELECT p.id, u.email AS ownerEmail 
          FROM properties p
          JOIN user u ON p.user_id = u.id
          WHERE p.id = ? AND u.user_type = 'proprietario'`;
      const [propertyRows] = await connection.execute(propertyQuery, [propertyId]);

      if (propertyRows.length === 0) {
          return next(new customError(404, 'Proprietà non trovata o proprietario non valido'));
      }

      const ownerEmail = propertyRows[0].ownerEmail;

      // Inserisci il messaggio nel database
      const insertMessageQuery = `
          INSERT INTO messages (property_id, sender_email, message_text) 
          VALUES (?, ?, ?)`;
      await connection.execute(insertMessageQuery, [propertyId, email, message]);

      // Configura il trasportatore per inviare l'email
      const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASSWORD,
          },
      });
      // Configura l'email
      const mailOptions = {
          from: process.env.EMAIL_USER,
          to: ownerEmail,
          subject: 'Nuovo messaggio su BoolBnB',
          text: `Hai ricevuto un nuovo messaggio da ${email}:\n\n"${message}"`,
      };

      // Invia l'email
      await transporter.sendMail(mailOptions);

      res.status(200).json({ message: 'Messaggio inviato con successo' });

  } catch (error) {
      next(error);
  }
};