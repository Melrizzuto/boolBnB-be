class CustomError extends Error {
    constructor(message, statusCode) {
        super(message);  // Chiamata al costruttore della classe Error per inizializzare il messaggio
        this.statusCode = statusCode;  // Imposta il codice di stato HTTP
        this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";  // Determina lo stato (fail per errori client, error per server)
        this.isOperational = true;  // Segna come errore operativo
        Error.captureStackTrace(this, this.constructor);  // Aggiunge lo stack trace personalizzato
    }
}

export default CustomError;