const db = require('../config/database');

const boletinController = {
    // 1. Mostrar el panel para elegir de qué grupo imprimir boletines
    getPanel: (req, res) => {
        const grupos = db.prepare(`
            SELECT g.id, g.nomenclatura, g.jornada, gr.nombre as grado
            FROM grupos g
            JOIN grados gr ON g.id_grado = gr.id
            ORDER BY gr.nombre, g.nomenclatura
        `).all();
        res.render('admin/generar_boletines', { grupos });
    },

    // 2. API que el navegador consultará para obtener los datos crudos y armar el PDF
    getDatosBoletin: (req, res) => {
        try {
            const { id_grupo } = req.params;

            // A. Datos de la Institución
            const institucion = db.prepare('SELECT * FROM institucion LIMIT 1').get() || {};

            // B. Datos del Grupo y su Director
            const grupo = db.prepare(`
                SELECT g.*, gr.nombre as grado, d.nombres as dir_nombres, d.apellidos as dir_apellidos, d.url_firma as dir_firma
                FROM grupos g
                JOIN grados gr ON g.id_grado = gr.id
                LEFT JOIN usuarios d ON g.id_docente_director = d.id
                WHERE g.id = ?
            `).get(id_grupo);

            // C. Estudiantes matriculados en ese grupo
            const estudiantes = db.prepare(`
                SELECT e.id, e.documento, e.nombres, e.apellidos
                FROM matriculas m
                JOIN estudiantes e ON m.id_estudiante = e.id
                WHERE m.id_grupo = ? AND m.estado = 'Activo'
                ORDER BY e.apellidos ASC
            `).all(id_grupo);

            // D. Calificaciones de esos estudiantes
            const calificaciones = db.prepare(`
                SELECT c.id_matricula, c.nota_definitiva, asig.nombre as asignatura, ar.nombre as area
                FROM calificaciones_finales c
                JOIN matriculas m ON c.id_matricula = m.id
                JOIN asignaturas asig ON c.id_asignatura = asig.id
                JOIN areas ar ON asig.id_area = ar.id
                WHERE m.id_grupo = ?
            `).all(id_grupo);

            // Estructuramos un JSON limpio para el frontend
            res.json({
                exito: true,
                institucion,
                grupo,
                estudiantes,
                calificaciones
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ exito: false, mensaje: 'Error obteniendo datos' });
        }
    }
};

module.exports = boletinController;