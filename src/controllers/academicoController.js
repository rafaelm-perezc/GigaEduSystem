const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const academicoController = {
    // 1. Mostrar la pantalla con las áreas y asignaturas actuales
    getGestion: (req, res) => {
        // Obtenemos todas las áreas
        const areas = db.prepare('SELECT * FROM areas ORDER BY nombre ASC').all();
        
        // Obtenemos todas las asignaturas cruzadas con su área
        const asignaturas = db.prepare(`
            SELECT asig.*, ar.nombre as nombre_area 
            FROM asignaturas asig 
            JOIN areas ar ON asig.id_area = ar.id 
            ORDER BY ar.nombre, asig.nombre
        `).all();

        res.render('admin/gestion_academica', { areas, asignaturas });
    },

    // 2. Guardar una nueva Área
    postArea: (req, res) => {
        try {
            const { nombre } = req.body;
            const id = uuidv4();
            
            const stmt = db.prepare('INSERT INTO areas (id, nombre) VALUES (?, ?)');
            stmt.run(id, nombre);
            
            res.redirect("<script>alert('Área creada con éxito'); window.location.href='/admin/academico';</script>");
        } catch (error) {
            console.error(error);
            res.status(500).send("Error al crear el área.");
        }
    },

    // 3. Guardar una nueva Asignatura
    postAsignatura: (req, res) => {
        try {
            const { id_area, nombre, peso_porcentual } = req.body;
            const id = uuidv4();
            
            const stmt = db.prepare('INSERT INTO asignaturas (id, id_area, nombre, peso_porcentual) VALUES (?, ?, ?, ?)');
            stmt.run(id, id_area, nombre, parseFloat(peso_porcentual));
            
            res.redirect("<script>alert('Asignatura agregada con éxito'); window.location.href='/admin/academico';</script>");
        } catch (error) {
            console.error(error);
            res.status(500).send("Error al crear la asignatura.");
        }
    }
};

module.exports = academicoController;