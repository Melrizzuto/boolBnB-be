import connection from "../connection.js";
import nodemailer from "nodemailer"

export const addProperty = async (req, res) => {
    try {
        // Verifica presenza dati
        const { user_id, title, num_rooms, num_beds, num_bathrooms, square_meters, address, image, property_type } = req.body;
        if (!user_id || !title || !num_rooms || !num_beds || !num_bathrooms || !square_meters || !address || !property_type) {
            return res.status(400).json({ message: "Tutti i campi obbligatori sono richiesti" });
        }
        // Verifica validità dati:
        if (typeof title !== 'string' || title.trim() === '') {
            return res.status(400).json({ message: "Il titolo deve essere una stringa non vuota" });
        }

        if (typeof address !== 'string' || address.trim() === '') {
            return res.status(400).json({ message: "L'indirizzo deve essere una stringa non vuota" });
        }

        // Verifica che i numeri siano positivi
        if (num_rooms <= 0 || num_beds <= 0 || num_bathrooms <= 0 || square_meters <= 0) {
            return res.status(400).json({ message: "Numero di stanze, letti, bagni e metri quadrati devono essere valori positivi" });
        }

        if (typeof property_type !== 'string' || property_type.trim() === '') {
            return res.status(400).json({ message: "Il tipo di immobile deve essere una stringa non vuota" });
        }

        // Verifica che utente sia proprietario:
        const userQuery = "SELECT user_type FROM users WHERE id = ?";
        const [userRows] = await connection.execute(userQuery, [user_id]);
        
        if (userRows.length === 0 || userRows[0].user_type !== 'owner') {
            return res.status(403).json({ message: "Solo i proprietari possono aggiungere immobili." });
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
        res.status(500).json({ message: "Errore del server" });
    }
};

export const searchProperties = async (req, res) => {
    try{
        // Estrai i parametri dalla query string
        const {
            searchTerm,      
            minRooms,        
            minBeds,       
            propertyType,   
          } = req.query;
          // Validazione dei parametri
        if (searchTerm && typeof searchTerm !== 'string') {
            return res.status(400).json({ message: "Il termine di ricerca deve essere una stringa" });
        }
          // Impostazioni predefinite per i filtri
          const searchQuery = `%${searchTerm || ''}%`;
          const minRoomsFilter = minRooms || 0;
          const minBedsFilter = minBeds || 0;
          const propertyTypeFilter = `%${propertyType || ''}%`;
           // Verifica che minRooms e minBeds siano numeri positivi
        if (minRoomsFilter < 0 || minBedsFilter < 0) {
            return res.status(400).json({ message: "Il numero minimo di stanze e letti deve essere un numero positivo" });
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
            SUM(r.vote) AS total_votes 
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

export const getProperitesDetails = async (req, res) => {
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
            SUM(r.vote) AS total_votes,
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
        const [rows] = (await connection).execute(query, [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: "Immobile non trovato" });
        }

        // Restituire i dettagli dell'immobile
        res.status(200).json({
            message: "Dettagli immobile recuperati con successo",
            property: rows[0],
        });
    }
    catch (error) {
        console.error("Errore nel recupero dei dettagli dell'immobile:", error);
        res.status(500).json({ message: "Errore del server" });
    };
};

export const contactOwner = async (req, res) => {
    try {
      const { propertyId } = req.params;
      const { email, message, ownerEmail } = req.body;
  
      // Verifica che la proprietà esista
      const propertyQuery = 'SELECT * FROM properties WHERE id = ?';
      const [propertyRows] = await connection.execute(propertyQuery, [propertyId]);
  
      if (propertyRows.length === 0) {
        return res.status(404).json({ message: 'Proprietà non trovata' });
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
      res.status(500).json({ message: 'Errore del server' });
    }
  };