import mysql from "mysql2";

const connection = mysql.createConnection({
    host: 'yamanote.proxy.rlwy.net',
    user: 'root',
    password: 'qFPecktzMTmerQhCVRWgIUPHJtxbulMP',
    database: 'boolbnb_db',
    port: '31620'
});

connection.connect((err) => {
    if (err) {
        console.error('Errore di connessione al database:', err.message);
        return;
    }
    console.log('Connesso al database!');
});

export default connection;