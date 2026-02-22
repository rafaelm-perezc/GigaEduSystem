const db = require('../config/database');

const estudianteController = {
    getMisNotas: (req, res) => {
        const id_estudiante = req.session.usuario.id;

        try {
            // 1. Obtener la matrícula actual y el grupo del estudiante
            const matricula = db.prepare(`
                SELECT m.id as id_matricula, g.nomenclatura, gr.nombre as grado, g.id as id_grupo
                FROM matriculas m
                JOIN grupos g ON m.id_grupo = g.id
                JOIN grados gr ON g.id_grado = gr.id
                WHERE m.id_estudiante = ? AND m.estado = 'Activo'
                LIMIT 1
            `).get(id_estudiante);

            if (!matricula) {
                return res.render('estudiante/mis_notas', { error: 'No tienes una matrícula activa.', notas: [], ranking: null });
            }

            // 2. Obtener el detalle de sus calificaciones
            const notas = db.prepare(`
                SELECT asig.nombre as asignatura, ar.nombre as area, c.nota_definitiva
                FROM calificaciones_finales c
                JOIN asignaturas asig ON c.id_asignatura = asig.id
                JOIN areas ar ON asig.id_area = ar.id
                WHERE c.id_matricula = ?
            `).all(matricula.id_matricula);

            // 3. MOTOR DE RANKING (El cálculo matemático)
            // Calculamos el promedio de todos los estudiantes del colegio y los ordenamos.
            const ranking = db.prepare(`
                WITH Promedios AS (
                    SELECT 
                        m.id_estudiante,
                        m.id_grupo,
                        IFNULL(AVG(c.nota_definitiva), 0) as promedio_general
                    FROM matriculas m
                    LEFT JOIN calificaciones_finales c ON m.id = c.id_matricula
                    WHERE m.estado = 'Activo'
                    GROUP BY m.id_estudiante
                ),
                RankingsCalculados AS (
                    SELECT 
                        id_estudiante,
                        promedio_general,
                        RANK() OVER (PARTITION BY id_grupo ORDER BY promedio_general DESC) as puesto_grupo,
                        RANK() OVER (ORDER BY promedio_general DESC) as puesto_institucion,
                        (SELECT COUNT(*) FROM matriculas WHERE id_grupo = Promedios.id_grupo AND estado = 'Activo') as total_grupo,
                        (SELECT COUNT(*) FROM matriculas WHERE estado = 'Activo') as total_institucion
                    FROM Promedios
                )
                SELECT * FROM RankingsCalculados WHERE id_estudiante = ?
            `).get(id_estudiante);

            res.render('estudiante/mis_notas', { 
                usuario: req.session.usuario,
                matricula, 
                notas, 
                ranking,
                error: null 
            });

        } catch (error) {
            console.error("Error cargando portal del estudiante:", error);
            res.render('estudiante/mis_notas', { error: 'Error al calcular las calificaciones.', notas: [], ranking: null });
        }
    }
};

module.exports = estudianteController;