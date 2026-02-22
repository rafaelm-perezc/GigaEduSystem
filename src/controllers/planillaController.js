const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const planillaController = {
    // 1. Mostrar las clases asignadas (Simulación del panel del docente)
    getMisClases: (req, res) => {
        const clases = db.prepare(`
            SELECT a.id as id_asignacion, asig.nombre as asignatura, g.nomenclatura, gr.nombre as grado, d.nombres, d.apellidos
            FROM asignacion_academica a
            JOIN asignaturas asig ON a.id_asignatura = asig.id
            JOIN grupos g ON a.id_grupo = g.id
            JOIN grados gr ON g.id_grado = gr.id
            JOIN usuarios d ON a.id_docente = d.id
        `).all();

        res.render('docente/lista_planillas', { clases });
    },

    // 2. Mostrar la planilla de notas de una clase específica
    getPlanilla: (req, res) => {
        const { id_asignacion } = req.params;

        // Obtener detalles de la clase
        const clase = db.prepare(`
            SELECT a.id, asig.nombre as asignatura, g.nomenclatura, gr.nombre as grado, g.id as id_grupo, a.id_asignatura, a.id_docente
            FROM asignacion_academica a
            JOIN asignaturas asig ON a.id_asignatura = asig.id
            JOIN grupos g ON a.id_grupo = g.id
            JOIN grados gr ON g.id_grado = gr.id
            WHERE a.id = ?
        `).get(id_asignacion);

        if (!clase) return res.redirect('/docente/planillas?msg=error');

        // Obtener estudiantes matriculados en ese grupo
        const estudiantes = db.prepare(`
            SELECT m.id as id_matricula, e.apellidos, e.nombres, e.documento
            FROM matriculas m
            JOIN estudiantes e ON m.id_estudiante = e.id
            WHERE m.id_grupo = ? AND m.estado = 'Activo'
            ORDER BY e.apellidos ASC
        `).all(clase.id_grupo);

        // Obtener notas existentes (si ya había calificado antes)
        // Por ahora, traemos todo vacío si no hay registro para el MVP
        const calificaciones = db.prepare(`
            SELECT * FROM calificaciones_finales WHERE id_asignatura = ? AND id_docente = ?
        `).all(clase.id_asignatura, clase.id_docente);

        res.render('docente/digitar_notas', { clase, estudiantes, calificaciones });
    },

    // 3. Guardar las notas digitadas
    postGuardarNotas: (req, res) => {
        const { id_asignacion, id_asignatura, id_docente, notas } = req.body;
        // 'notas' será un objeto donde la llave es el id_matricula y el valor es la nota digitada

        try {
            const guardar = db.transaction(() => {
                // Buscamos si hay un periodo abierto (MVP: Asumimos el periodo 1)
                let periodo = db.prepare('SELECT id FROM periodos WHERE estado_apertura = 1 LIMIT 1').get();
                if (!periodo) {
                    // Si no hay periodo creado, lo creamos rápidamente para la prueba
                    const id_per = uuidv4();
                    db.prepare("INSERT INTO periodos (id, numero_periodo, año_lectivo) VALUES (?, 1, '2026')").run(id_per);
                    periodo = { id: id_per };
                }

                const stmtInsert = db.prepare(`
                    INSERT INTO calificaciones_finales (id, id_matricula, id_asignatura, id_periodo, id_docente, nota_definitiva) 
                    VALUES (?, ?, ?, ?, ?, ?)
                    ON CONFLICT(id_matricula, id_asignatura, id_periodo) 
                    DO UPDATE SET nota_definitiva = excluded.nota_definitiva, updated_at = CURRENT_TIMESTAMP
                `);

                // Iteramos sobre las notas que envió el profesor
                if (notas) {
                    for (const [id_matricula, valor_nota] of Object.entries(notas)) {
                        if (valor_nota !== '') {
                            // Para el MVP simplificaremos el conflicto usando un ID único por registro de nota
                            // Si se requiere UPSERT exacto, se ajustan las llaves primarias. Por ahora insertamos directo.
                            const id_cal = uuidv4();
                            // Borramos nota anterior si existe para no duplicar en SQLite simple
                            db.prepare("DELETE FROM calificaciones_finales WHERE id_matricula = ? AND id_asignatura = ? AND id_periodo = ?").run(id_matricula, id_asignatura, periodo.id);
                            
                            stmtInsert.run(id_cal, id_matricula, id_asignatura, periodo.id, id_docente, parseFloat(valor_nota));
                        }
                    }
                }
            });

            guardar();
            res.redirect(`/docente/planillas/${id_asignacion}?msg=guardado`);

        } catch (error) {
            console.error(error);
            res.redirect(`/docente/planillas/${id_asignacion}?msg=error`);
        }
    }
};

module.exports = planillaController;