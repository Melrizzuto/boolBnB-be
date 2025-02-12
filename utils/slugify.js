export const slugify = (text) => {
    return text
        .toString()
        .normalize('NFD') // Decompone caratteri accentati
        .replace(/[\u0300-\u036f]/g, '') // Rimuove accenti
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "") // Rimuove caratteri speciali eccetto spazi e trattini
        .replace(/\s+/g, "-") // Sostituisce spazi con trattini
        .replace(/-+/g, "-"); // Evita trattini multipli consecutivi
};
