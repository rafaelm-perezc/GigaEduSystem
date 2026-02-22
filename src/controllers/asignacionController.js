const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const asignacionController = {
    getPanel: (req, res) => {
        // 1. Autogenerar Grados si la tabla está vacía (Ahorra horas de digitación)
        const countGrados = db.prepare("SELECT COUNT(*) as count FROM grados").get();
        if (countGrados.count === 0) {
            const gradosSeed = ['Transición', 'Primero', 'Segundo', 'Tercero', 'Cuarto', 'Quinto', 'Sexto', 'Séptimo', 'Octavo', 'Noveno', 'Décimo', 'Undécimo'];
            const insertGrado = db.prepare("INSERT INTO grados (id, nombre, nivel) VALUES (?, ?, ?)");
            db.transaction(() => {
                gradosSeed.forEach(g => insertGrado.run(uuidv4(), g, 'Básica/Media'));
            })();
        }

        // 2. Extraer los datos para las listas desplegables
        const grados = db.prepare("SELECT * FROM grados").all();
        const docentes = db.prepare("SELECT * FROM usuarios WHERE rol = 'DOCENTE'").all();
        const asignaturas = db.prepare("SELECT * FROM asignaturas ORDER BY nombre").all();
        const grupos = db.prepare(`
            SELECT g.*, gr.nombre as grado, d.nombres as dir_nombres, d.apellidos as dir_apellidos 
            FROM grupos g 
            JOIN grados gr ON g.id_grado = gr.id 
            LEFT JOIN usuarios d ON g.id_docente_director = d.id
        `).all();

        res.render('admin/asignacion', { grados, docentes, asignaturas, grupos });
    },

    postDocente: async (req, res) => {
        try {
            const { documento, nombres, apellidos, email } = req.body;
            // La contraseña por defecto será el mismo número de documento
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(documento, salt);

            const stmt = db.prepare('INSERT INTO usuarios (id, documento, nombres, apellidos, rol, email, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?)');
            stmt.run(uuidv4(), documento, nombres, apellidos, 'DOCENTE', email, password_hash);
            
            res.redirect('/admin/asignacion?msg=docente_ok');
        } catch (error) {
            console.error(error);
            res.redirect('/admin/asignacion?msg=error');
        }
    },

    postGrupo: (req, res) => {
        try {
            const { id_grado, nomenclatura, jornada, id_docente_director } = req.body;
            const stmt = db.prepare('INSERT INTO grupos (id, id_grado, nomenclatura, jornada, id_docente_director, año_lectivo) VALUES (?, ?, ?, ?, ?, ?)');
            stmt.run(uuidv4(), id_grado, nomenclatura, jornada, id_docente_director || null, new Date().getFullYear().toString());
            
            res.redirect('/admin/asignacion?msg=grupo_ok');
        } catch (error) {
            console.error(error);
            res.redirect('/admin/asignacion?msg=error');
        }
    },

    postAsignacion: (req, res) => {
        try {
            const { id_docente, id_asignatura, id_grupo } = req.body;
            const stmt = db.prepare('INSERT INTO asignacion_academica (id, id_docente, id_asignatura, id_grupo) VALUES (?, ?, ?, ?)');
            stmt.run(uuidv4(), id_docente, id_asignatura, id_grupo);
            
            res.redirect('/admin/asignacion?msg=asig_ok');
        } catch (error) {
            console.error(error);
            res.redirect('/admin/asignacion?msg=error');
        }
    }
};

module.exports = asignacionController;