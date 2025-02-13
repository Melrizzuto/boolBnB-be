import connection from "../connection.js";
import customError from "../classes/customError.js";
import { slugify } from "../utils/slugify.js";
import { sendEmail } from "../utils/emailService.js";
import propertyService from "../utils/propertyService.js";

//FUNZIONANTE!
export const addProperty = async (req, res, next) => {
  try {
    // Verifica presenza dati
    const { title, image, description, num_rooms, num_beds, num_bathrooms, square_meters, address, city, user_name, user_email, likes, type_id } = req.body;

    if (!user_name || !user_email || !title || !num_rooms || !num_beds || !num_bathrooms || !square_meters || !address || !city) {
      return next(new customError(400, "Tutti i campi sono obbligatori."));
    }

    // Verifica validità dati:
    if (typeof title !== 'string' || title.trim() === '') {
      return next(new customError(400, "Il titolo deve essere una stringa non vuota"));
    }

    if (typeof address !== 'string' || address.trim() === '') {
      return next(new customError(400, "L'indirizzo deve essere una stringa non vuota"));
    }

    if (typeof city !== 'string' || city.trim() === '') {
      return next(new customError(400, "La città deve essere una stringa non vuota"));
    }

    // Verifica che i numeri siano positivi
    if (num_rooms <= 0 || num_beds <= 0 || num_bathrooms <= 0 || square_meters <= 0) {
      return next(new customError(400, "Numero di stanze, letti, bagni e metri quadrati devono essere valori positivi"));
    }
    const [validType] = await connection.execute('SELECT id FROM properties_type WHERE id = ?', [type_id]);

    if (validType.length === 0) {
      return next(new customError(400, "Tipo di proprietà non valido."));
    }

    const slug = slugify(title);

    // Verifica se type_id esiste nella tabella properties_type, se non è null
    if (type_id) {
      const [rows] = await connection.execute('SELECT 1 FROM properties_type WHERE id = ?', [type_id]);
      if (rows.length === 0) {
        return next(new customError(400, "Il tipo di proprietà non esiste."));
      }
    }

    // Impostazione dei valori
    const safeValues = [
      slug,
      title,
      image || null,
      description || null,
      num_rooms,
      num_beds,
      num_bathrooms,
      square_meters,
      address,
      city,
      user_name,
      user_email,
      likes || 0,
      type_id || null
    ];

    // Controllo se c'è undefined nei parametri
    for (const value of safeValues) {
      if (value === undefined) {
        return next(new customError(400, "Alcuni dati sono mancanti."));
      }
    }

    const query = `
        INSERT INTO properties (slug, title, image, description, num_rooms, num_beds, num_bathrooms, square_meters, address, city, user_name, user_email, likes, type_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    await connection.execute(query, safeValues);

    res.status(201).json({ message: "Immobile aggiunto con successo!" });

  }
  catch (error) {
    console.error("Errore nel controller addProperty:", error);
    next(new customError(500, "Errore del server"));
  }
};


//FUNZIONANTE!
export const searchProperties = async (req, res, next) => {
  try {
    // Estrai i parametri dalla query string
    const { searchTerm, minRooms, minBeds, minBathrooms, propertyType } = req.query;

    // Validazione dei parametri
    if (searchTerm && typeof searchTerm !== 'string') {
      return next(new customError(400, "Il termine di ricerca deve essere una stringa"));
    }

    // Impostazioni predefinite per i filtri
    const searchQuery = `%${searchTerm || ''}%`;
    const minRoomsFilter = parseInt(minRooms, 10) || 0;
    const minBedsFilter = parseInt(minBeds, 10) || 0;
    const minBathroomsFilter = parseInt(minBathrooms, 10) || 0;
    const propertyTypeFilter = propertyType || null;

    // Verifica che minRooms e minBeds siano numeri positivi
    if (minRoomsFilter < 0 || minBedsFilter < 0 || minBathroomsFilter < 0) {
      return next(new customError(400, "I filtri minRooms,  minBeds e minBathrooms devono essere numeri positivi"));
    }

    // Query dinamica per la ricerca
    const query = `
         SELECT 
          p.id, p.slug, p.title, p.num_rooms, p.num_beds, p.num_bathrooms, p.square_meters, 
          p.address, p.city, p.image, p.likes, pt.type_name AS property_type, 
          COUNT(r.id) AS num_reviews, SUM(r.rating) AS total_votes 
        FROM properties p
        LEFT JOIN reviews r ON p.id = r.property_id
        LEFT JOIN properties_type pt ON p.type_id = pt.id  
        WHERE (p.address LIKE ? OR p.city LIKE ?) 
          AND p.num_rooms >= ? 
          AND p.num_beds >= ? 
          AND p.num_bathrooms >= ? 
          AND (? IS NULL OR pt.type_name = ?)  
        GROUP BY p.id
        ORDER BY total_votes DESC;
      `;

    // Esecuzione query
    const [rows] = await connection.execute(query, [
      searchQuery,
      searchQuery,
      minRoomsFilter,
      minBedsFilter,
      minBathroomsFilter,
      propertyTypeFilter,
      propertyTypeFilter
    ]);

    // Risultati
    res.status(200).json({
      message: "Ricerca completata con successo",
      results: rows,
    });
  } catch (error) {
    console.error("Errore nella ricerca delle proprietà:", error);
    next(error);
  }
};

//FUNZIONANTE!
export const getPropertyBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    // Query per ottenere la proprietà in base allo slug
    const query = `
        SELECT 
          p.id, 
          p.title, 
          p.num_rooms, 
          p.num_beds, 
          p.num_bathrooms, 
          p.square_meters, 
          p.address,
          p.city,
          p.image, 
          p.description,
          p.likes,
          pt.type_name AS property_type,  
          COUNT(r.id) AS num_reviews, 
          SUM(r.rating) AS total_votes  
        FROM 
          properties p
        LEFT JOIN 
          reviews r ON p.id = r.property_id
        LEFT JOIN 
          properties_type pt ON p.type_id = pt.id  
        WHERE 
          p.slug = ?  -- Cerca per slug invece che per id
        GROUP BY 
          p.id
      `;

    const [rows] = await connection.execute(query, [slug]);

    if (rows.length === 0) {
      return next(new customError(404, "Proprietà non trovata"));
    }

    // Risultati
    res.status(200).json({
      message: "Proprietà trovata con successo",
      property: rows[0],  // restituisce la proprietà trovata
    });
  } catch (error) {
    console.error("Errore nella ricerca della proprietà:", error);
    next(error);
  }
};


//FUNZIONANTE!
export const contactOwner = async (req, res) => {
  const { property_id, sender_name, sender_email, message_text } = req.body;

  try {
    // 1. Controlla se la proprietà esiste e ottieni l'email del proprietario
    const [property] = await connection.query(
      "SELECT user_email FROM properties WHERE id = ?",
      [property_id]
    );

    if (property.length === 0) {
      return res.status(404).json({ message: "Proprietà non trovata" });
    }

    const ownerEmail = property[0].user_email;

    // 2. Salva il messaggio nel database
    await connection.query(
      "INSERT INTO messages (property_id,sender_name, sender_email, message_text) VALUES (?, ?, ?, ?)",
      [property_id, sender_name, sender_email, message_text]
    );

    // 3. Invia l'email usando la funzione riutilizzabile
    await sendEmail(
      ownerEmail,
      "Nuovo messaggio per la tua proprietà",
      `Hai ricevuto un nuovo messaggio da ${sender_name} (${sender_email}):\n\n"${message_text}"`
    );

    res.status(200).json({ message: "Messaggio inviato e salvato con successo!" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Errore nell'invio del messaggio" });
  }
};
export const likeProperty = async (req, res) => {
  try {
    const { slug } = req.params; // Otteniamo lo slug dalla rotta
    const updatedProperty = await propertyService.incrementLikes(slug); // Passiamo lo slug alla funzione
    if (!updatedProperty) {
      return res.status(404).json({ message: "Proprietà non trovata" });
    }
    res.json({ message: "Like aggiunto", property: updatedProperty });
  } catch (error) {
    console.error("Errore durante l'aggiornamento dei like:", error);
    res.status(500).json({ message: "Errore del server" });
  }
};
