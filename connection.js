import mysql from "mysql2";

const pool = mysql.createPool({
    host: 'yamanote.proxy.rlwy.net',
    user: 'root',
    password: 'qFPecktzMTmerQhCVRWgIUPHJtxbulMP',
    database: 'boolbnb_db',
    port: '31620'
});

const connection = pool.promise();

export default connection;
