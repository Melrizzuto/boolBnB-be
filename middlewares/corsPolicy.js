import cors from "cors";

const corsPolicy = {
    origin: (origin, callback) => {
        //Da modificare quando il sito sarà finito, per ora localhost3000
        const allowedOrigins = ['*'];
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        }
        else {
            callback(new Error("Non autorizzato da CORS"))
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
};

export default cors(corsPolicy);