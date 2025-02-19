import connection from "../connection.js";
import customError from "../classes/customError.js";
import { slugify } from "../utils/slugify.js";
import { sendEmail } from "../utils/emailService.js";
import propertyService from "../utils/propertyService.js";

//FUNZIONANTE!
export const addProperty = async (req, res, next) => {
  try {
    // Verifica presenza dati
    const { title, cover_img, description, num_rooms, num_beds, num_bathrooms, square_meters, address, city, user_name, user_email, likes, type_id } = req.body;

    if (!user_name || !user_email || !title || !num_rooms || !num_beds || !num_bathrooms || !square_meters || !address || !city) {
      return next(new customError(400, "Tutti i campi sono obbligatori."));
    }

    // Verifica validità dati:
    if (typeof title !== 'string' || title.trim() === '' || title.length < 3) {
      return next(new customError(400, "Il titolo deve essere una stringa non vuota e deve avere almeno una lunghezza di 3 caratteri"));
    }

    if (typeof address !== 'string' || address.trim() === '' || address.length < 3) {
      return next(new customError(400, "L'indirizzo deve essere una stringa non vuota e deve avere almeno una lunghezza di 3 caratteri"));
    }

    if (typeof city !== 'string' || city.trim() === '' || city.length < 2) {
      return next(new customError(400, "La città deve essere una stringa non vuota e deve avere almeno una lunghezza di 2 caratteri"));
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
      cover_img || null,
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
        INSERT INTO properties (slug, title, cover_img, description, num_rooms, num_beds, num_bathrooms, square_meters, address, city, user_name, user_email, likes, type_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    await connection.execute(query, safeValues);


    res.status(201).json({
      message: "Immobile aggiunto con successo!",
      slug: slug
    });

  }
  catch (error) {
    console.error("Errore nel controller addProperty:", error);
    next(new customError(500, "Errore del server"));
  }
};


//FUNZIONANTE!
export const searchProperties = async (req, res, next) => {
  try {
    const { searchTerm, minRooms, minBeds, minBathrooms, propertyType, page = 1, limit = 3 } = req.query;

    let whereClauses = [];
    let queryParams = [];

    // Gestione del searchTerm solo se presente
    if (searchTerm) {
      const searchQuery = `%${searchTerm}%`;
      whereClauses.push('(p.address LIKE ? OR p.city LIKE ?)');
      queryParams.push(searchQuery, searchQuery);
    }

    // Aggiungi i filtri numerici se presenti
    if (minRooms) {
      whereClauses.push('p.num_rooms >= ?');
      queryParams.push(minRooms);
    }

    if (minBeds) {
      whereClauses.push('p.num_beds >= ?');
      queryParams.push(minBeds);
    }

    if (minBathrooms) {
      whereClauses.push('p.num_bathrooms >= ?');
      queryParams.push(minBathrooms);
    }

    // Filtro per tipo di proprietà
    if (propertyType) {
      whereClauses.push('pt.type_name = ?');
      queryParams.push(propertyType);
    }

    // Costruzione della clausola WHERE
    let whereClause = whereClauses.length > 0 ? ' WHERE ' + whereClauses.join(' AND ') : '';

    // Query per il conteggio totale delle proprietà (senza paginazione)
    const countQuery = `
      SELECT COUNT(DISTINCT p.id) AS total
      FROM properties p
      LEFT JOIN properties_type pt ON p.type_id = pt.id
      LEFT JOIN reviews r ON p.id = r.property_id
      ${whereClause}
    `;

    const [[{ total }]] = await connection.execute(countQuery, queryParams);

    // Paginazione
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Query per ottenere le proprietà con i filtri e paginazione
    let query = `
        SELECT 
          p.id, p.slug, p.title, p.num_rooms, p.num_beds, p.num_bathrooms, p.square_meters, 
          p.address, p.city, p.cover_img, p.likes, pt.type_name AS property_type,
          COUNT(r.id) AS num_reviews, SUM(r.rating) AS total_votes 
        FROM properties p
        LEFT JOIN reviews r ON p.id = r.property_id
        LEFT JOIN properties_type pt ON p.type_id = pt.id 
        ${whereClause}
        GROUP BY p.id
        ORDER BY total_votes DESC
        LIMIT ${parseInt(limit)} OFFSET ${offset}
    `;

    const [rows] = await connection.execute(query, queryParams);

    res.status(200).json({
      message: "Ricerca completata con successo",
      results: rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalResults: total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error("Errore nella ricerca delle proprietà:", error);
    next(new customError(500, "Errore del server"));
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
          p.cover_img,
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
  const { sender_email, message_text } = req.body;
  const { slug } = req.params; // ✅ Otteniamo lo slug dalla rotta

  try {
    console.log("📥 Incoming request:", { sender_email, message_text, slug });

    // ✅ 1. Trova il property_id usando lo slug
    const [property] = await connection.execute(
      "SELECT id, user_email FROM properties WHERE slug = ?",
      [slug]
    );

    if (property.length === 0) {
      console.error("❌ Proprietà non trovata per slug:", slug);
      return res.status(404).json({ message: "Proprietà non trovata" });
    }

    const propertyId = property[0].id;
    const ownerEmail = property[0].user_email;

    console.log("🏠 Property found:", { propertyId, ownerEmail });

    // ✅ 2. Salva il messaggio nel database
    await connection.execute(
      "INSERT INTO messages (property_id, sender_email, message_text) VALUES (?, ?, ?)",
      [propertyId, sender_email, message_text]
    );

    console.log("📩 Message saved successfully in DB");

    // ✅ 3. Invia email al proprietario (se attivo)
    if (sendEmail) {
      await sendEmail(
        ownerEmail,
        "Nuovo messaggio per la tua proprietà",
        `Hai ricevuto un nuovo messaggio da ${sender_email}:\n\n"${message_text}"`
      );
      console.log("✅ Email inviata con successo!");
    }

    res.status(201).json({ message: "Messaggio inviato e salvato con successo!" });

  } catch (error) {
    console.error("❌ Errore nell'invio del messaggio:", error);
    res.status(500).json({ message: "Errore del server", error: error.message });
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
