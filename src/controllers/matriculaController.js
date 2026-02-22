const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const ExcelJS = require('exceljs');
const fs = require('fs');

const matriculaController = {
    getPanel: (req, res) => {
        // Capturamos lo que el usuario haya escrito en la barra de búsqueda (si existe)
        const q = req.query.q;
        
        const grupos = db.prepare('SELECT g.id, g.nomenclatura, g.jornada, gr.nombre as grado FROM grupos g JOIN grados gr ON g.id_grado = gr.id ORDER BY gr.nombre, g.nomenclatura').all();
        
        let matriculados;

        if (q && q.trim() !== '') {
            // Si hay búsqueda: Filtramos por documento, nombres o apellidos (usamos LIKE para coincidencias parciales)
            const parametro = `%${q.trim()}%`;
            matriculados = db.prepare(`
                SELECT e.*, gr.nombre as grado, g.nomenclatura, m.id as id_matricula, g.id as id_grupo
                FROM matriculas m 
                JOIN estudiantes e ON m.id_estudiante = e.id 
                JOIN grupos g ON m.id_grupo = g.id 
                JOIN grados gr ON g.id_grado = gr.id
                WHERE e.documento LIKE ? OR e.nombres LIKE ? OR e.apellidos LIKE ?
                ORDER BY e.apellidos ASC
            `).all(parametro, parametro, parametro);
        } else {
            // Si NO hay búsqueda: Mostramos los últimos 50 actualizados por defecto
            matriculados = db.prepare(`
                SELECT e.*, gr.nombre as grado, g.nomenclatura, m.id as id_matricula, g.id as id_grupo
                FROM matriculas m 
                JOIN estudiantes e ON m.id_estudiante = e.id 
                JOIN grupos g ON m.id_grupo = g.id 
                JOIN grados gr ON g.id_grado = gr.id
                ORDER BY m.updated_at DESC LIMIT 50
            `).all();
        }
        
        res.render('admin/matriculas', { grupos, matriculados, searchQuery: q || '' });
    },

    // 1. CARGA INDIVIDUAL O ACTUALIZACIÓN (Corregido el Bug de Duplicación)
    postMatricula: (req, res) => {
        const { id_estudiante, tipo_documento, documento, nombres, apellidos, fecha_nacimiento, direccion, telefono, email, acudiente_nombre, acudiente_telefono, id_grupo } = req.body;
        
        try {
            db.transaction(() => {
                let current_id_estudiante = id_estudiante;
                
                if (current_id_estudiante && current_id_estudiante.trim() !== "") {
                    // ES UNA ACTUALIZACIÓN ESTRICTA
                    // Verificamos si el nuevo documento que digitó ya le pertenece a OTRO niño por error
                    const docExistente = db.prepare('SELECT id FROM estudiantes WHERE documento = ? AND id != ?').get(documento, current_id_estudiante);
                    if(docExistente) throw new Error("documento_duplicado");
                    
                    db.prepare('UPDATE estudiantes SET tipo_documento=?, documento=?, nombres=?, apellidos=?, fecha_nacimiento=?, direccion=?, telefono=?, email=?, acudiente_nombre=?, acudiente_telefono=? WHERE id=?')
                      .run(tipo_documento, documento, nombres, apellidos, fecha_nacimiento || null, direccion, telefono, email, acudiente_nombre, acudiente_telefono, current_id_estudiante);
                } else {
                    // ES UN REGISTRO NUEVO
                    const existe = db.prepare('SELECT id FROM estudiantes WHERE documento = ?').get(documento);
                    if (existe) {
                        throw new Error("documento_duplicado"); // Protegemos contra doble registro accidental
                    } else {
                        current_id_estudiante = uuidv4();
                        db.prepare('INSERT INTO estudiantes (id, tipo_documento, documento, nombres, apellidos, fecha_nacimiento, direccion, telefono, email, acudiente_nombre, acudiente_telefono) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
                          .run(current_id_estudiante, tipo_documento, documento, nombres, apellidos, fecha_nacimiento || null, direccion, telefono, email, acudiente_nombre, acudiente_telefono);
                    }
                }

                // Actualizar o crear la matrícula si seleccionó un grupo
                if (id_grupo) {
                    const matriExiste = db.prepare('SELECT id FROM matriculas WHERE id_estudiante = ? AND estado = "Activo"').get(current_id_estudiante);
                    if (matriExiste) {
                        db.prepare('UPDATE matriculas SET id_grupo = ? WHERE id = ?').run(id_grupo, matriExiste.id);
                    } else {
                        db.prepare('INSERT INTO matriculas (id, id_estudiante, id_grupo) VALUES (?, ?, ?)').run(uuidv4(), current_id_estudiante, id_grupo);
                    }
                }
            })();
            res.redirect('/admin/matriculas?msg=ok');
        } catch (error) {
            console.error(error);
            if(error.message === "documento_duplicado") return res.redirect('/admin/matriculas?msg=duplicado');
            res.redirect('/admin/matriculas?msg=error');
        }
    },

    // 2. DESCARGAR PLANTILLA EXCEL MEJORADA (Incluye Grado y Grupo)
    descargarPlantilla: async (req, res) => {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Carga_Masiva');
        
        sheet.columns = [
            { header: 'TIPO_DOC', key: 'tipo', width: 12 },
            { header: 'DOCUMENTO', key: 'doc', width: 18 },
            { header: 'NOMBRES', key: 'nom', width: 25 },
            { header: 'APELLIDOS', key: 'ape', width: 25 },
            { header: 'NACIMIENTO (AAAA-MM-DD)', key: 'nac', width: 25 },
            { header: 'DIRECCION', key: 'dir', width: 20 },
            { header: 'TELEFONO', key: 'tel', width: 15 },
            { header: 'NOMBRE_ACUDIENTE', key: 'acu_nom', width: 25 },
            { header: 'TEL_ACUDIENTE', key: 'acu_tel', width: 18 },
            { header: 'GRADO_DESTINO', key: 'grado', width: 25 },
            { header: 'GRUPO_DESTINO', key: 'grupo', width: 15 }
        ];

        sheet.addRow(['TI', '1079000111', 'CARLOS ANDRES', 'LOPEZ PEREZ', '2010-05-14', 'Cll 12 # 3-4', '3110000000', 'MARIA PEREZ', '3120000000', 'CLEI 3 (6º y 7º)', '301']);
        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF007BFF' } };

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=Plantilla_Estudiantes.xlsx');
        await workbook.xlsx.write(res);
        res.end();
    },

    // 3. PROCESAR EL ARCHIVO EXCEL (Sin necesidad del menú desplegable)
    cargarMasivo: async (req, res) => {
        if (!req.file) return res.redirect('/admin/matriculas?msg=error');
        
        try {
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.readFile(req.file.path);
            const sheet = workbook.getWorksheet(1);

            db.transaction(() => {
                sheet.eachRow((row, rowNumber) => {
                    if (rowNumber === 1) return; 
                    
                    const values = row.values;
                    const tipo = values[1], doc = values[2]?.toString(), nom = values[3], ape = values[4];
                    if (!doc || !nom || !ape) return; 
                    
                    const nac = values[5] ? new Date(values[5]).toISOString().split('T')[0] : null;
                    const dir = values[6], tel = values[7]?.toString(), acu_nom = values[8], acu_tel = values[9]?.toString();
                    const gradoNombre = values[10], grupoNomenclatura = values[11]?.toString();

                    let id_estudiante;
                    const existe = db.prepare('SELECT id FROM estudiantes WHERE documento = ?').get(doc);
                    
                    if (existe) {
                        id_estudiante = existe.id;
                    } else {
                        id_estudiante = uuidv4();
                        db.prepare('INSERT INTO estudiantes (id, tipo_documento, documento, nombres, apellidos, fecha_nacimiento, direccion, telefono, acudiente_nombre, acudiente_telefono) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
                          .run(id_estudiante, tipo || 'TI', doc, nom, ape, nac, dir, tel, acu_nom, acu_tel);
                    }

                    // Buscar si el grupo dictado en el Excel existe en la BD
                    if (gradoNombre && grupoNomenclatura) {
                        const grupoDB = db.prepare(`
                            SELECT g.id FROM grupos g 
                            JOIN grados gr ON g.id_grado = gr.id 
                            WHERE gr.nombre = ? AND g.nomenclatura = ?
                        `).get(gradoNombre, grupoNomenclatura);

                        if (grupoDB) {
                            const matriExiste = db.prepare('SELECT id FROM matriculas WHERE id_estudiante = ? AND estado="Activo"').get(id_estudiante);
                            if (!matriExiste) {
                                db.prepare('INSERT INTO matriculas (id, id_estudiante, id_grupo) VALUES (?, ?, ?)').run(uuidv4(), id_estudiante, grupoDB.id);
                            }
                        }
                    }
                });
            })();

            fs.unlinkSync(req.file.path);
            res.redirect('/admin/matriculas?msg=masivo_ok');

        } catch (error) {
            console.error("Error cargando Excel:", error);
            res.redirect('/admin/matriculas?msg=error');
        }
    }
};

module.exports = matriculaController;