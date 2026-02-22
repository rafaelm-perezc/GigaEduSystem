const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const ExcelJS = require('exceljs');
const fs = require('fs');

const asignacionController = {
    getPanel: (req, res) => {
        const docentes = db.prepare(`SELECT * FROM usuarios WHERE rol = 'DOCENTE' ORDER BY primer_apellido ASC`).all();
        const grados = db.prepare('SELECT * FROM grados WHERE activo = 1 ORDER BY nombre ASC').all();
        const grupos = db.prepare('SELECT g.id, g.nomenclatura, g.jornada, gr.nombre as grado, d.primer_nombre as dir_nom, d.primer_apellido as dir_ape FROM grupos g JOIN grados gr ON g.id_grado = gr.id LEFT JOIN usuarios d ON g.id_docente_director = d.id ORDER BY gr.nombre, g.nomenclatura').all();
        const asignaturas = db.prepare('SELECT a.id, a.nombre, ar.nombre as area FROM asignaturas a JOIN areas ar ON a.id_area = ar.id ORDER BY ar.nombre, a.nombre').all();
        
        const jornadasLegales = ['Jornada Única', 'Mañana', 'Tarde', 'Nocturna', 'Sabatina / Fin de semana'];

        res.render('admin/asignacion', { docentes, grados, grupos, asignaturas, jornadasLegales });
    },

    buscarDocenteAPI: (req, res) => {
        const q = req.query.q;
        if (!q) return res.json([]);
        const p = `%${q.toUpperCase()}%`;
        
        const resultados = db.prepare(`
            SELECT id, documento, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, email, telefono, contacto_emergencia_nombre, contacto_emergencia_telefono
            FROM usuarios 
            WHERE rol = 'DOCENTE' AND (documento LIKE ? OR primer_apellido LIKE ? OR primer_nombre LIKE ?)
            ORDER BY primer_apellido ASC LIMIT 10
        `).all(p, p, p);
        
        res.json(resultados);
    },

    postDocente: (req, res) => {
        try {
            const { id_docente, documento, email, telefono, contacto_emergencia_nombre, contacto_emergencia_telefono } = req.body;
            const p_nom = (req.body.primer_nombre || '').trim().toUpperCase();
            const s_nom = (req.body.segundo_nombre || '').trim().toUpperCase();
            const p_ape = (req.body.primer_apellido || '').trim().toUpperCase();
            const s_ape = (req.body.segundo_apellido || '').trim().toUpperCase();
            const c_emerg_nom = (contacto_emergencia_nombre || '').trim().toUpperCase();

            if (id_docente && id_docente.trim() !== '') {
                db.prepare('UPDATE usuarios SET documento=?, primer_nombre=?, segundo_nombre=?, primer_apellido=?, segundo_apellido=?, email=?, telefono=?, contacto_emergencia_nombre=?, contacto_emergencia_telefono=? WHERE id=? AND rol="DOCENTE"')
                  .run(documento, p_nom, s_nom, p_ape, s_ape, email, telefono, c_emerg_nom, contacto_emergencia_telefono, id_docente);
            } else {
                const salt = bcrypt.genSaltSync(10);
                const hash = bcrypt.hashSync(documento, salt);
                db.prepare('INSERT INTO usuarios (id, documento, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, rol, email, telefono, password_hash, contacto_emergencia_nombre, contacto_emergencia_telefono) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
                  .run(uuidv4(), documento, p_nom, s_nom, p_ape, s_ape, 'DOCENTE', email, telefono, hash, c_emerg_nom, contacto_emergencia_telefono);
            }
            res.redirect('/admin/asignacion?msg=ok');
        } catch (error) { res.redirect('/admin/asignacion?msg=error'); }
    },

    postGrupo: (req, res) => {
        try {
            const { nombre_grado, nomenclatura, jornada, id_docente_director } = req.body;
            const grado = db.prepare('SELECT id FROM grados WHERE nombre = ?').get(nombre_grado);
            db.prepare('INSERT INTO grupos (id, id_grado, id_docente_director, nomenclatura, jornada, año_lectivo) VALUES (?, ?, ?, ?, ?, ?)').run(uuidv4(), grado.id, id_docente_director || null, nomenclatura.toUpperCase(), jornada, new Date().getFullYear().toString());
            res.redirect('/admin/asignacion?msg=ok');
        } catch (error) { res.redirect('/admin/asignacion?msg=error'); }
    },

    postAsignacion: (req, res) => {
        try {
            const { id_docente, id_asignatura, id_grupo } = req.body;
            const existe = db.prepare('SELECT id FROM asignacion_academica WHERE id_asignatura = ? AND id_grupo = ?').get(id_asignatura, id_grupo);
            if (existe) {
                db.prepare('UPDATE asignacion_academica SET id_docente = ? WHERE id = ?').run(id_docente, existe.id);
            } else {
                db.prepare('INSERT INTO asignacion_academica (id, id_docente, id_asignatura, id_grupo) VALUES (?, ?, ?, ?)').run(uuidv4(), id_docente, id_asignatura, id_grupo);
            }
            res.redirect('/admin/asignacion?msg=ok');
        } catch (error) { res.redirect('/admin/asignacion?msg=error'); }
    },

    descargarPlantillaDocentes: async (req, res) => {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Carga_Docentes');
        sheet.columns = [
            { header: 'DOCUMENTO_IDENTIDAD', key: 'doc', width: 22 },
            { header: '1ER_NOMBRE', key: 'p_nom', width: 20 },
            { header: '2DO_NOMBRE', key: 's_nom', width: 20 },
            { header: '1ER_APELLIDO', key: 'p_ape', width: 20 },
            { header: '2DO_APELLIDO', key: 's_ape', width: 20 },
            { header: 'CORREO_ELECTRONICO', key: 'email', width: 35 },
            { header: 'TELEFONO', key: 'tel', width: 15 },
            { header: 'CONTACTO_EMERGENCIA', key: 'c_nom', width: 25 },
            { header: 'TEL_EMERGENCIA', key: 'c_tel', width: 15 }
        ];
        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF343A40' } };
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=Plantilla_Docentes.xlsx');
        await workbook.xlsx.write(res);
        res.end();
    },

    cargarMasivoDocentes: async (req, res) => {
        if (!req.file) return res.redirect('/admin/asignacion?msg=error');
        try {
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.readFile(req.file.path);
            const sheet = workbook.getWorksheet(1);
            db.transaction(() => {
                sheet.eachRow((row, rowNumber) => {
                    if (rowNumber === 1) return;
                    
                    const doc = row.values[1]?.toString().trim();
                    const p_nom = (row.values[2] || '').toString().trim().toUpperCase();
                    const s_nom = (row.values[3] || '').toString().trim().toUpperCase();
                    const p_ape = (row.values[4] || '').toString().trim().toUpperCase();
                    const s_ape = (row.values[5] || '').toString().trim().toUpperCase();
                    const emailRaw = row.values[6];
                    const email = (typeof emailRaw === 'object' && emailRaw !== null) ? emailRaw.text : emailRaw?.toString().trim();
                    const tel = row.values[7]?.toString().trim();
                    const c_nom = (row.values[8] || '').toString().trim().toUpperCase();
                    const c_tel = row.values[9]?.toString().trim();

                    if (!doc || !p_nom || !p_ape) return;

                    const existe = db.prepare('SELECT id FROM usuarios WHERE documento = ?').get(doc);
                    if (!existe) {
                        const hash = bcrypt.hashSync(doc, bcrypt.genSaltSync(10)); 
                        db.prepare('INSERT INTO usuarios (id, documento, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, rol, email, telefono, password_hash, contacto_emergencia_nombre, contacto_emergencia_telefono) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
                          .run(uuidv4(), doc, p_nom, s_nom, p_ape, s_ape, 'DOCENTE', email || null, tel || '', hash, c_nom, c_tel);
                    }
                });
            })();
            fs.unlinkSync(req.file.path);
            res.redirect('/admin/asignacion?msg=masivo_ok');
        } catch (error) { res.redirect('/admin/asignacion?msg=error'); }
    }
};

module.exports = asignacionController;