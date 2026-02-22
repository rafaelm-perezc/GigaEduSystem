const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const ExcelJS = require('exceljs');
const fs = require('fs');

// Mapa Estandarizado de Grados
const MAPA_GRADOS = {
    '0': { nombre: 'TRANSICIÓN', nivel: 'Preescolar' },
    '1': { nombre: 'PRIMERO', nivel: 'Básica Primaria' },
    '2': { nombre: 'SEGUNDO', nivel: 'Básica Primaria' },
    '3': { nombre: 'TERCERO', nivel: 'Básica Primaria' },
    '4': { nombre: 'CUARTO', nivel: 'Básica Primaria' },
    '5': { nombre: 'QUINTO', nivel: 'Básica Primaria' },
    '6': { nombre: 'SEXTO', nivel: 'Básica Secundaria y Media' },
    '7': { nombre: 'SÉPTIMO', nivel: 'Básica Secundaria y Media' },
    '8': { nombre: 'OCTAVO', nivel: 'Básica Secundaria y Media' },
    '9': { nombre: 'NOVENO', nivel: 'Básica Secundaria y Media' },
    '10': { nombre: 'DÉCIMO', nivel: 'Básica Secundaria y Media' },
    '11': { nombre: 'UNDÉCIMO', nivel: 'Básica Secundaria y Media' },
    '21': { nombre: 'CLEI 1 (GRADOS 1°, 2° y 3°)', nivel: 'Validación Adultos' },
    '22': { nombre: 'CLEI 2 (GRADOS 4° Y 5°)', nivel: 'Validación Adultos' },
    '23': { nombre: 'CLEI 3 (GRADOS 6° Y 7°)', nivel: 'Validación Adultos' },
    '24': { nombre: 'CLEI 4 (GRADOS 8° Y 9°)', nivel: 'Validación Adultos' },
    '25': { nombre: 'CLEI 5 (GRADO 10°)', nivel: 'Validación Adultos' },
    '26': { nombre: 'CLEI 6 (GRADO 11°)', nivel: 'Validación Adultos' }
};

const matriculaController = {
    getPanel: (req, res) => {
        const grados = db.prepare('SELECT * FROM grados WHERE activo = 1 ORDER BY nombre').all();
        const grupos = db.prepare('SELECT g.id, g.nomenclatura, g.jornada, gr.nombre as grado FROM grupos g JOIN grados gr ON g.id_grado = gr.id ORDER BY gr.nombre, g.nomenclatura').all();
        
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

    buscarAPI: (req, res) => {
        const q = req.query.q;
        if (!q) return res.json([]);
        const p = `%${q.toUpperCase()}%`;
        
        const resultados = db.prepare(`
            SELECT e.id, e.documento, e.primer_nombre, e.segundo_nombre, e.primer_apellido, e.segundo_apellido, e.fecha_nacimiento, e.direccion, e.telefono, e.email, e.acudiente_nombre, e.acudiente_telefono, e.tipo_documento, g.nomenclatura, gr.nombre as grado, g.id as id_grupo
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
        
        const p_nom = (req.body.primer_nombre || '').trim().toUpperCase();
        const s_nom = (req.body.segundo_nombre || '').trim().toUpperCase();
        const p_ape = (req.body.primer_apellido || '').trim().toUpperCase();
        const s_ape = (req.body.segundo_apellido || '').trim().toUpperCase();
        
        try {
            db.transaction(() => {
                let current_id = id_estudiante;
                if (current_id && current_id.trim() !== "") {
                    db.prepare('UPDATE estudiantes SET tipo_documento=?, documento=?, primer_nombre=?, segundo_nombre=?, primer_apellido=?, segundo_apellido=?, fecha_nacimiento=?, direccion=?, telefono=?, email=?, acudiente_nombre=?, acudiente_telefono=? WHERE id=?')
                      .run(tipo_documento, documento, p_nom, s_nom, p_ape, s_ape, fecha_nacimiento || null, (direccion||'').toUpperCase(), telefono, email, (acudiente_nombre||'').toUpperCase(), acudiente_telefono, current_id);
                } else {
                    current_id = uuidv4();
                    db.prepare('INSERT INTO estudiantes (id, tipo_documento, documento, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, fecha_nacimiento, direccion, telefono, email, acudiente_nombre, acudiente_telefono) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
                      .run(current_id, tipo_documento, documento, p_nom, s_nom, p_ape, s_ape, fecha_nacimiento || null, (direccion||'').toUpperCase(), telefono, email, (acudiente_nombre||'').toUpperCase(), acudiente_telefono);
                }

                if (id_grupo) {
                    const matriExiste = db.prepare("SELECT id FROM matriculas WHERE id_estudiante = ? AND estado = 'Activo'").get(current_id);
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
            { header: 'FECHA_NACIMIENTO (DD/MM/YYYY)', key: 'fnac', width: 25 },
            { header: 'DIRECCION', key: 'dir', width: 25 },
            { header: 'TELEFONO', key: 'tel', width: 15 },
            { header: 'CORREO_ELECTRONICO', key: 'email', width: 30 },
            { header: 'NOMBRE_ACUDIENTE', key: 'acu_nom', width: 25 },
            { header: 'TEL_ACUDIENTE', key: 'acu_tel', width: 15 },
            { header: 'GRADO_DESTINO', key: 'grado', width: 20 },
            { header: 'GRUPO_DESTINO', key: 'grupo', width: 20 }
        ];

        sheet.addRow(['TI', '1079000111', 'CARLOS', 'ANDRES', 'LOPEZ', 'PEREZ', '25/12/2010', 'CALLE 12 # 3-4', '3110000', 'carlos@mail.com', 'MARIA PEREZ', '3120000', '6', '601']);
        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF007BFF' } };

        const configSheet = workbook.addWorksheet('DatosConfig', { state: 'hidden' });
        
        const tiposDoc = db.prepare('SELECT sigla FROM tipos_documento').all();
        tiposDoc.forEach((t, i) => configSheet.getCell(`A${i+1}`).value = t.sigla);
        
        const opcionesGrado = Object.keys(MAPA_GRADOS);
        opcionesGrado.forEach((num, i) => configSheet.getCell(`B${i+1}`).value = num);

        const textoComentarioGrado = "Opciones disponibles:\n" +
            "0 -> TRANSICIÓN\n1 -> PRIMERO\n2 -> SEGUNDO\n3 -> TERCERO\n4 -> CUARTO\n5 -> QUINTO\n" +
            "6 -> SEXTO\n7 -> SÉPTIMO\n8 -> OCTAVO\n9 -> NOVENO\n10 -> DÉCIMO\n11 -> UNDÉCIMO\n" +
            "21 -> CLEI 1 (1°, 2° y 3°)\n22 -> CLEI 2 (4° Y 5°)\n23 -> CLEI 3 (6° Y 7°)\n" +
            "24 -> CLEI 4 (8° Y 9°)\n25 -> CLEI 5 (10°)\n26 -> CLEI 6 (11°)";

        const textoComentarioGrupo = "Sugerencias de Nomenclatura:\n" +
            "• Si eligió 1, puede usar: 101, 102, 103.\n" +
            "• Si eligió 6, puede usar: 601, 602, 603.\n" +
            "• Si eligió 23, puede usar: 301, 302.";

        for (let i = 2; i <= 1000; i++) {
            sheet.getCell(`A${i}`).dataValidation = { type: 'list', allowBlank: false, formulae: [`DatosConfig!$A$1:$A$${tiposDoc.length || 1}`] };
            sheet.getCell(`M${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: [`DatosConfig!$B$1:$B$${opcionesGrado.length}`] };
            
            sheet.getCell(`M${i}`).note = textoComentarioGrado;
            sheet.getCell(`N${i}`).note = textoComentarioGrupo;
        }

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=Plantilla_Estudiantes.xlsx');
        await workbook.xlsx.write(res);
        res.end();
    },

    cargarMasivo: async (req, res) => {
        if (!req.file) return res.redirect('/admin/matriculas?msg=error');
        try {
            // 1. OBTENER LA JORNADA GLOBAL DEL COLEGIO ANTES DE PROCESAR
            const config = db.prepare('SELECT jornada FROM institucion LIMIT 1').get();
            const jornadaGlobal = (config && config.jornada && config.jornada !== '') ? config.jornada : 'Sin Asignar';

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
                    
                    let fechaDB = null;
                    const fechaRaw = row.values[7];
                    if (fechaRaw) {
                        if (fechaRaw instanceof Date) {
                            const mes = String(fechaRaw.getMonth() + 1).padStart(2, '0');
                            const dia = String(fechaRaw.getDate()).padStart(2, '0');
                            fechaDB = `${fechaRaw.getFullYear()}-${mes}-${dia}`;
                        } else if (typeof fechaRaw === 'string') {
                            const partes = fechaRaw.trim().split('/'); 
                            if (partes.length === 3) fechaDB = `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
                        }
                    }

                    const dir = (row.values[8] || '').toString().trim().toUpperCase();
                    const tel = row.values[9]?.toString();
                    
                    const emailRaw = row.values[10];
                    const email = (typeof emailRaw === 'object' && emailRaw !== null) ? emailRaw.text : emailRaw?.toString().trim();
                    
                    const acu_nom = (row.values[11] || '').toString().trim().toUpperCase();
                    const acu_tel = row.values[12]?.toString();
                    
                    const gradoRaw = row.values[13]?.toString().trim();
                    const grupoNomenclatura = row.values[14]?.toString().trim().toUpperCase();

                    if (!doc || !p_nom || !p_ape) return; 

                    let id_estudiante;
                    const existe = db.prepare('SELECT id FROM estudiantes WHERE documento = ?').get(doc);
                    if (existe) { 
                        id_estudiante = existe.id;
                        db.prepare('UPDATE estudiantes SET tipo_documento=?, primer_nombre=?, segundo_nombre=?, primer_apellido=?, segundo_apellido=?, fecha_nacimiento=?, direccion=?, telefono=?, email=?, acudiente_nombre=?, acudiente_telefono=? WHERE id=?')
                          .run(tipo || 'TI', p_nom, s_nom, p_ape, s_ape, fechaDB, dir, tel, email, acu_nom, acu_tel, id_estudiante);
                    } else {
                        id_estudiante = uuidv4();
                        db.prepare('INSERT INTO estudiantes (id, tipo_documento, documento, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, fecha_nacimiento, direccion, telefono, email, acudiente_nombre, acudiente_telefono) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
                          .run(id_estudiante, tipo || 'TI', doc, p_nom, s_nom, p_ape, s_ape, fechaDB, dir, tel, email, acu_nom, acu_tel);
                    }

                    if (gradoRaw && grupoNomenclatura) {
                        const infoGrado = MAPA_GRADOS[gradoRaw];

                        if (infoGrado) {
                            const nombreOficial = infoGrado.nombre;
                            const nivelOficial = infoGrado.nivel;

                            let gradoDB = db.prepare('SELECT id FROM grados WHERE nombre = ?').get(nombreOficial);
                            if (!gradoDB) {
                                const nId = uuidv4();
                                db.prepare('INSERT INTO grados (id, nombre, nivel, activo) VALUES (?, ?, ?, 1)').run(nId, nombreOficial, nivelOficial);
                                gradoDB = { id: nId };
                            }
                            
                            let grupoDB = db.prepare('SELECT id FROM grupos WHERE id_grado = ? AND nomenclatura = ?').get(gradoDB.id, grupoNomenclatura);
                            if (!grupoDB) {
                                const nGId = uuidv4();
                                // 2. APLICAR LA JORNADA GLOBAL AL CREAR EL GRUPO
                                db.prepare('INSERT INTO grupos (id, id_grado, nomenclatura, jornada, año_lectivo) VALUES (?, ?, ?, ?, ?)').run(nGId, gradoDB.id, grupoNomenclatura, jornadaGlobal, new Date().getFullYear().toString());
                                grupoDB = { id: nGId };
                            }

                            const matriExiste = db.prepare("SELECT id FROM matriculas WHERE id_estudiante = ? AND estado = 'Activo'").get(id_estudiante);
                            if (matriExiste) {
                                db.prepare('UPDATE matriculas SET id_grupo = ? WHERE id = ?').run(grupoDB.id, matriExiste.id);
                            } else {
                                db.prepare('INSERT INTO matriculas (id, id_estudiante, id_grupo) VALUES (?, ?, ?)').run(uuidv4(), id_estudiante, grupoDB.id);
                            }
                        }
                    }
                });
            })();
            fs.unlinkSync(req.file.path);
            res.redirect('/admin/matriculas?msg=masivo_ok');
        } catch (error) {
            console.error(error);
            res.redirect('/admin/matriculas?msg=error');
        }
    }
};

module.exports = matriculaController;