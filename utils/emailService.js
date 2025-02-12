import nodemailer from "nodemailer";

export const sendEmail = async (to, subject, text) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        text,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email inviata a ${to}`);
    } catch (error) {
        console.error("Errore nell'invio dell'email:", error);
        throw new Error("Impossibile inviare l'email.");
    }
};