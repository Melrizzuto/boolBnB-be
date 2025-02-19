import multer from 'multer';
import path from 'path';

// Configurazione dello storage per multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/'); // Cartella dove salvare le immagini
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExt = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + fileExt);
    }
});

// Filtro per consentire solo file immagine
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo di file non consentito. Carica solo immagini.'), false);
    }
};

// Middleware multer
const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limite di 5MB per immagine
  }).array("images", 4); // Accetta fino a 4 immagini
  
  export default upload;