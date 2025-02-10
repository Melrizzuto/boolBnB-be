import cors from "cors";

export const corsPolicy = {
    origin: (origin, callback) => {
        //Da modificare quando il sito sarà finito, per ora localhost3000
        const allowedOrigins = ['http://localhost:3000'];
        if(!origin || allowedOrigins.indexOf(origin) !== -1){
            callback(null, true);
        }
        else{
            callback(new Error("Non autorizzato da CORS"))
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
};
