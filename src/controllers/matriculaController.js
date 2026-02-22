const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const matriculaController = {
    getPanel: (req, res) => {
        // Obtenemos los grupos disponibles para mostrar en el formulario
        const grupos = db.prepare(`
            SELECT g.id, g.nomenclatura, g.jornada, gr.nombre as grado
            FROM grupos g
            JOIN grados gr ON g.id_grado = gr.id
            ORDER BY gr.nombre, g.nomenclatura
        `).all();

        // Obtenemos los últimos 10 matriculados para la tabla visual
        const matriculados = db.prepare(`
            SELECT e.documento, e.nombres, e.apellidos, gr.nombre as grado, g.nomenclatura
            FROM matriculas m
            JOIN estudiantes e ON m.id_estudiante = e.id
            JOIN grupos g ON m.id_grupo = g.id
            JOIN grados gr ON g.id_grado = gr.id
            ORDER BY m.updated_at DESC LIMIT 10
        `).all();

        res.render('admin/matriculas', { grupos, matriculados });
    },

    postMatricula: (req, res) => {
        const { tipo_documento, documento, nombres, apellidos, id_grupo } = req.body;
        
        try {
            // Empaquetamos la lógica en una Transacción Segura
            const ejecutarMatricula = db.transaction(() => {
                let id_estudiante;
                
                // 1. Verificar si el estudiante ya existe (Regla: Cero Redundancia)
                const estudianteExistente = db.prepare('SELECT id FROM estudiantes WHERE documento = ?').get(documento);
                
                if (estudianteExistente) {
                    id_estudiante = estudianteExistente.id;
                    // Opcional: Podríamos actualizar los nombres aquí si hubo un error ortográfico previo
                } else {
                    id_estudiante = uuidv4();
                    const stmtEstudiante = db.prepare('INSERT INTO estudiantes (id, tipo_documento, documento, nombres, apellidos) VALUES (?, ?, ?, ?, ?)');
                    stmtEstudiante.run(id_estudiante, tipo_documento, documento, nombres, apellidos);
                }

                // 2. Crear la Matrícula Oficial vinculándolo al Grupo
                const stmtMatricula = db.prepare('INSERT INTO matriculas (id, id_estudiante, id_grupo) VALUES (?, ?, ?)');
                stmtMatricula.run(uuidv4(), id_estudiante, id_grupo);
            });

            // Ejecutamos la transacción
            ejecutarMatricula();
            res.redirect('/admin/matriculas?msg=mat_ok');

        } catch (error) {
            console.error(error);
            // Capturar error si intenta matricular al mismo estudiante dos veces en el mismo grupo exactamente al mismo tiempo
            res.redirect('/admin/matriculas?msg=error');
        }
    }
};

module.exports = matriculaController;