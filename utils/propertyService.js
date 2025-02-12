import connection from "../connection.js";

const incrementLikes = async (slug) => {
    try {
        // Recuperiamo prima la proprietà con lo slug
        const [property] = await connection.execute(
            "SELECT * FROM properties WHERE slug = ?",
            [slug]
        );

        if (property.length === 0) {
            return null; // Se la proprietà non esiste, ritorniamo null
        }

        const propertyData = property[0];

        // Incrementiamo i like della proprietà
        const [result] = await connection.execute(
            "UPDATE properties SET likes = likes + 1 WHERE slug = ?",
            [slug]
        );

        if (result.affectedRows === 0) {
            return null; // Se non è stato aggiornato nulla, ritorniamo null
        }

        // Recuperiamo la proprietà aggiornata
        const [updatedProperty] = await connection.execute(
            "SELECT * FROM properties WHERE slug = ?",
            [slug]
        );

        return updatedProperty[0]; // Restituiamo la proprietà aggiornata
    } catch (error) {
        throw error;
    }
};

export default { incrementLikes };