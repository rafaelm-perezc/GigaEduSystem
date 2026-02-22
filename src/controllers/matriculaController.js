const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const ExcelJS = require('exceljs');
const fs = require('fs');

const matriculaController = {
    getPanel: (req, res) => {
        const grados = db.prepare('SELECT * FROM grados WHERE activo = 1 ORDER BY nombre').all();
        const grupos = db.prepare('SELECT g.id, g.nomenclatura, g.jornada, gr.nombre as grado FROM grupos g JOIN grados gr ON g.id_grado = gr.id ORDER BY gr.nombre, g.nomenclatura').all();
        
        // FIX BUG VISIBILIDAD: LEFT JOIN garantiza que se vean aunque el grupo falle en el Excel
        const matriculados = db.prepare(`
            SELECT e.*, gr.nombre as grado, g.nomenclatura, m.id as id_matricula, g.id as id_grupo
            FROM estudiantes e
            LEFT JOIN matriculas m ON e.id = m.id_estudiante AND m.estado = 'Activo'
            LEFT JOIN grupos g ON m.id_grupo = g.id
            LEFT JOIN grados gr ON g.id_grado = gr.id
            ORDER BY e.primer_apellido ASC, e.primer_nombre ASC LIMIT 100
        `).all();
        
        res.render('admin/matriculas', { grados, grupos, matriculados });
    },

    // LIVE SEARCH API (Autocompletado)
    buscarAPI: (req, res) => {
        const q = req.query.q;
        if (!q) return res.json([]);
        const p = `%${q.toUpperCase()}%`;
        
        const resultados = db.prepare(`
            SELECT e.id, e.documento, e.primer_nombre, e.segundo_nombre, e.primer_apellido, e.segundo_apellido, g.nomenclatura, gr.nombre as grado
            FROM estudiantes e
            LEFT JOIN matriculas m ON e.id = m.id_estudiante AND m.estado = 'Activo'
            LEFT JOIN grupos g ON m.id_grupo = g.id
            LEFT JOIN grados gr ON g.id_grado = gr.id
            WHERE e.documento LIKE ? OR e.primer_apellido LIKE ? OR e.primer_nombre LIKE ?
            ORDER BY e.primer_apellido ASC LIMIT 10
        `).all(p, p, p);
        
        res.json(resultados);
    },

    postMatricula: (req, res) => {
        const { id_estudiante, tipo_documento, documento, fecha_nacimiento, direccion, telefono, email, acudiente_nombre, acudiente_telefono, id_grupo } = req.body;
        
        // FORZAR MAYÚSCULAS Y DIVISIÓN DE NOMBRES
        const p_nom = (req.body.primer_nombre || '').trim().toUpperCase();
        const s_nom = (req.body.segundo_nombre || '').trim().toUpperCase();
        const p_ape = (req.body.primer_apellido || '').trim().toUpperCase();
        const s_ape = (req.body.segundo_apellido || '').trim().toUpperCase();
        
        try {
            db.transaction(() => {
                let current_id = id_estudiante;
                if (current_id && current_id.trim() !== "") {
                    db.prepare('UPDATE estudiantes SET tipo_documento=?, documento=?, primer_nombre=?, segundo_nombre=?, primer_apellido=?, segundo_apellido=?, fecha_nacimiento=?, direccion=?, telefono=?, email=?, acudiente_nombre=?, acudiente_telefono=? WHERE id=?')
                      .run(tipo_documento, documento, p_nom, s_nom, p_ape, s_ape, fecha_nacimiento || null, direccion, telefono, email, acudiente_nombre.toUpperCase(), acudiente_telefono, current_id);
                } else {
                    current_id = uuidv4();
                    db.prepare('INSERT INTO estudiantes (id, tipo_documento, documento, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, fecha_nacimiento, direccion, telefono, email, acudiente_nombre, acudiente_telefono) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
                      .run(current_id, tipo_documento, documento, p_nom, s_nom, p_ape, s_ape, fecha_nacimiento || null, direccion, telefono, email, acudiente_nombre.toUpperCase(), acudiente_telefono);
                }

                if (id_grupo) {
                    const matriExiste = db.prepare('SELECT id FROM matriculas WHERE id_estudiante = ? AND estado = "Activo"').get(current_id);
                    if (matriExiste) {
                        db.prepare('UPDATE matriculas SET id_grupo = ? WHERE id = ?').run(id_grupo, matriExiste.id);
                    } else {
                        db.prepare('INSERT INTO matriculas (id, id_estudiante, id_grupo) VALUES (?, ?, ?)').run(uuidv4(), current_id, id_grupo);
                    }
                }
            })();
            res.redirect('/admin/matriculas?msg=ok');
        } catch (error) {
            res.redirect('/admin/matriculas?msg=error');
        }
    },

    descargarPlantilla: async (req, res) => {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Carga_Masiva');
        
        sheet.columns = [
            { header: 'TIPO_DOC', key: 'tipo', width: 12 },
            { header: 'DOCUMENTO', key: 'doc', width: 18 },
            { header: '1ER_NOMBRE', key: 'p_nom', width: 20 },
            { header: '2DO_NOMBRE', key: 's_nom', width: 20 },
            { header: '1ER_APELLIDO', key: 'p_ape', width: 20 },
            { header: '2DO_APELLIDO', key: 's_ape', width: 20 },
            { header: 'TELEFONO', key: 'tel', width: 15 },
            { header: 'NOMBRE_ACUDIENTE', key: 'acu_nom', width: 25 },
            { header: 'TEL_ACUDIENTE', key: 'acu_tel', width: 15 },
            { header: 'GRADO_DESTINO', key: 'grado', width: 25 }, // EXACTAMENTE COLUMNA J
            { header: 'GRUPO_DESTINO', key: 'grupo', width: 15 }
        ];

        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF007BFF' } };

        // MAGIA: Lista desplegable dinámica para la Columna J
        const gradosList = db.prepare('SELECT nombre FROM grados WHERE activo = 1').all();
        const configSheet = workbook.addWorksheet('DatosConfig', { state: 'hidden' });
        gradosList.forEach((g, i) => configSheet.getCell(`A${i+1}`).value = g.nombre);

        for (let i = 2; i <= 1000; i++) {
            sheet.getCell(`J${i}`).dataValidation = {
                type: 'list',
                allowBlank: true,
                formulae: [`DatosConfig!$A$1:$A$${gradosList.length || 1}`]
            };
        }

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=Plantilla_Estudiantes.xlsx');
        await workbook.xlsx.write(res);
        res.end();
    },

    cargarMasivo: async (req, res) => {
        if (!req.file) return res.redirect('/admin/matriculas?msg=error');
        try {
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.readFile(req.file.path);
            const sheet = workbook.getWorksheet(1);

            db.transaction(() => {
                sheet.eachRow((row, rowNumber) => {
                    if (rowNumber === 1) return; 
                    
                    const tipo = row.values[1];
                    const doc = row.values[2]?.toString();
                    const p_nom = (row.values[3] || '').toString().trim().toUpperCase();
                    const s_nom = (row.values[4] || '').toString().trim().toUpperCase();
                    const p_ape = (row.values[5] || '').toString().trim().toUpperCase();
                    const s_ape = (row.values[6] || '').toString().trim().toUpperCase();
                    const tel = row.values[7]?.toString();
                    const acu_nom = (row.values[8] || '').toString().trim().toUpperCase();
                    const acu_tel = row.values[9]?.toString();
                    const gradoNombre = row.values[10]?.toString(); // COLUMNA J
                    const grupoNomenclatura = row.values[11]?.toString();

                    if (!doc || !p_nom || !p_ape) return; 

                    let id_estudiante;
                    const existe = db.prepare('SELECT id FROM estudiantes WHERE documento = ?').get(doc);
                    
                    if (existe) {
                        id_estudiante = existe.id;
                    } else {
                        id_estudiante = uuidv4();
                        db.prepare('INSERT INTO estudiantes (id, tipo_documento, documento, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, telefono, acudiente_nombre, acudiente_telefono) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
                          .run(id_estudiante, tipo || 'TI', doc, p_nom, s_nom, p_ape, s_ape, tel, acu_nom, acu_tel);
                    }

                    if (gradoNombre && grupoNomenclatura) {
                        const grupoDB = db.prepare('SELECT g.id FROM grupos g JOIN grados gr ON g.id_grado = gr.id WHERE gr.nombre = ? AND g.nomenclatura = ?').get(gradoNombre, grupoNomenclatura);
                        if (grupoDB) {
                            const matriExiste = db.prepare('SELECT id FROM matriculas WHERE id_estudiante = ? AND estado="Activo"').get(id_estudiante);
                            if (!matriExiste) db.prepare('INSERT INTO matriculas (id, id_estudiante, id_grupo) VALUES (?, ?, ?)').run(uuidv4(), id_estudiante, grupoDB.id);
                        }
                    }
                });
            })();
            fs.unlinkSync(req.file.path);
            res.redirect('/admin/matriculas?msg=masivo_ok');
        } catch (error) {
            res.redirect('/admin/matriculas?msg=error');
        }
    }
};

module.exports = matriculaController;