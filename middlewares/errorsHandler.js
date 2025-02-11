function errorsHandler(err, req, res, next) {
    console.error("Errore completo:", err); // <-- Stampa l'intero oggetto errore
    res.status(err.statusCode || 500).json({
      status: err.statusCode || 500,
      error: err.message,
    });
  }
export default errorsHandler;