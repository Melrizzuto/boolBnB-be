import mysql from "mysql2/promise";

const connection = await mysql.createConnection({
    host: 'ballast.proxy.rlwy.net',
    user: 'root',
    password: 'mFzTyHYoByKgpuEIFikaGgkRlthGhDLC',
    database: 'boolbnb_db',
    port: 30109,
});

try {
    await connection.connect();
    console.log("Connesso al database!");
}
catch (err) {
    console.error("Errore di connessione al database:", err);
}

export default connection;