import mysql from "mysql2/promise";

const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

try{
    await connection.connect();
    console.log("Connesso al database!");
}
catch (err) {
    console.error("Errore di connessione al database:", err);
}

export default connection;