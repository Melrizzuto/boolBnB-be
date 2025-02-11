import connection from "../connection.js";
import customError from "../classes/customError.js";

export const getUsers = async (req, res, next) => {
    try{
        const [users] = await connection.query("SELECT * FROM `user`");
        res.status(200).json(users);
    } catch (error) {
        console.error("Error getting users:", error);
        next(new customError(500, "Internal server error"));
    }
};

export const getUserById = async (req, res, next) => {
    try{
        const { id } = req.params;
        const [users] = await connection.query("SELECT * FROM `user` WHERE id = ?", [id]);

        if (users.length === 0) {
            return next(new customError(404, "User not found"));
        }
        res.status(200).json(users[0]);
    }
    catch (error) {
        console.error("Error getting user:", error);
        next(new customError(500, "Internal server error"));
    }

};

export const createUser = async (req, res, next) => {
    try{
        const { name, email, password_hash, user_type } = req.body;
        if(!name || !email || !password_hash || !user_type){
            return next(new customError(400, "All fields are required"));
        }
        const [users] = await connection.query("INSERT INTO `user` (name, email, password_hash, user_type) VALUES (?, ?, ?, ?)", [name, email, password_hash, user_type]);
        res.status(201).json({ message: "Utente creato con successo", id: users.insertId });
    }
    catch (error) {
        console.error("Error creating user:", error);
        next(new customError(500, "Internal server error"));
    }
};

export const updateUser = async (req, res, next) => {
    try{
        const { id } = req.params;
        const { name, email, password_hash, user_type } = req.body;
        const [users] = await connection.query("UPDATE `user` SET name = ?, email = ?, password_hash = ?, user_type = ? WHERE id = ?", [name, email, password_hash, user_type, id]);

        if(users.affectedRows === 0) return next(new customError(404, "User not found"));

        res.status(200).json({ message: "Utente aggiornato con successo" });
    }
    catch (error) {
        console.error("Error updating user:", error);
        next(new customError(500, "Internal server error"));
    }
};

export const deleteUser = async (req, res, next) => {
    try{
        const { id } = req.params;
        const [users] = await connection.query("DELETE FROM `user` WHERE id = ?", [id]);
        if(users.affectedRows === 0) return next(new customError(404, "User not found"));
        res.status(200).json({ message: "Utente eliminato con successo" });
    }
    catch (error) {
        console.error("Error deleting user:", error);
        next(new customError(500, "Internal server error"));
    }
};
