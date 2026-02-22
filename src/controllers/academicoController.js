const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const ExcelJS = require('exceljs');
const fs = require('fs');

const academicoController = {
    getGestion: (req, res) => {
        const areas = db.prepare('SELECT * FROM areas ORDER BY nombre ASC').all();
        const areasConAsignaturas = areas.map(area => {
            const asignaturas = db.prepare('SELECT * FROM asignaturas WHERE id_area = ? ORDER BY nombre ASC').all(area.id);
            return { ...area, asignaturas };
        });
        res.render('admin/gestion_academica', { areas: areasConAsignaturas });
    },

    postArea: (req, res) => {
        try {
            db.prepare('INSERT INTO areas (id, nombre) VALUES (?, ?)').run(uuidv4(), req.body.nombre_area.toUpperCase());
            res.redirect('/admin/academico?msg=ok');
        } catch (error) { res.redirect('/admin/academico?msg=error'); }
    },

    postAsignatura: (req, res) => {
        try {
            const { id_area, nombre_asignatura, peso_porcentual } = req.body;
            db.prepare('INSERT INTO asignaturas (id, id_area, nombre, peso_porcentual) VALUES (?, ?, ?, ?)').run(uuidv4(), id_area, nombre_asignatura.toUpperCase(), peso_porcentual);
            res.redirect('/admin/academico?msg=ok');
        } catch (error) { res.redirect('/admin/academico?msg=error'); }
    },

    // --- NUEVOS PODERES: EDITAR Y ELIMINAR ---
    editarArea: (req, res) => {
        try {
            db.prepare('UPDATE areas SET nombre = ? WHERE id = ?').run(req.body.nombre_area.toUpperCase(), req.body.id_area);
            res.redirect('/admin/academico?msg=ok');
        } catch (error) { res.redirect('/admin/academico?msg=error'); }
    },

    eliminarArea: (req, res) => {
        try {
            db.prepare('DELETE FROM areas WHERE id = ?').run(req.body.id_area);
            res.redirect('/admin/academico?msg=eliminado');
        } catch (error) { res.redirect('/admin/academico?msg=error'); }
    },

    editarAsignatura: (req, res) => {
        try {
            db.prepare('UPDATE asignaturas SET nombre = ?, peso_porcentual = ? WHERE id = ?').run(req.body.nombre_asignatura.toUpperCase(), req.body.peso_porcentual, req.body.id_asignatura);
            res.redirect('/admin/academico?msg=ok');
        } catch (error) { res.redirect('/admin/academico?msg=error'); }
    },

    eliminarAsignatura: (req, res) => {
        try {
            db.prepare('DELETE FROM asignaturas WHERE id = ?').run(req.body.id_asignatura);
            res.redirect('/admin/academico?msg=eliminado');
        } catch (error) { res.redirect('/admin/academico?msg=error'); }
    },

    // --- MOTOR DE EXCEL ---
    descargarPlantilla: async (req, res) => {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Plan_de_Estudios');
        sheet.columns = [
            { header: 'NOMBRE_DEL_AREA', key: 'area', width: 40 },
            { header: 'NOMBRE_DE_LA_ASIGNATURA', key: 'asig', width: 40 },
            { header: 'PESO_PORCENTUAL (Ej: 100)', key: 'peso', width: 30 }
        ];
        sheet.addRow(['CIENCIAS NATURALES', 'BIOLOGIA', 70]);
        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF28A745' } };
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=Plantilla_Plan_Estudios.xlsx');
        await workbook.xlsx.write(res);
        res.end();
    },

    cargarMasivo: async (req, res) => {
        if (!req.file) return res.redirect('/admin/academico?msg=error');
        try {
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.readFile(req.file.path);
            const sheet = workbook.getWorksheet(1);
            db.transaction(() => {
                sheet.eachRow((row, rowNumber) => {
                    if (rowNumber === 1) return; 
                    const areaNom = row.values[1]?.toString().trim().toUpperCase();
                    const asigNom = row.values[2]?.toString().trim().toUpperCase();
                    const peso = parseFloat(row.values[3]) || 100;
                    if (!areaNom || !asigNom) return;

                    let areaId;
                    const areaDB = db.prepare('SELECT id FROM areas WHERE nombre = ?').get(areaNom);
                    if (areaDB) { areaId = areaDB.id; } else {
                        areaId = uuidv4();
                        db.prepare('INSERT INTO areas (id, nombre) VALUES (?, ?)').run(areaId, areaNom);
                    }
                    const asigDB = db.prepare('SELECT id FROM asignaturas WHERE id_area = ? AND nombre = ?').get(areaId, asigNom);
                    if (!asigDB) db.prepare('INSERT INTO asignaturas (id, id_area, nombre, peso_porcentual) VALUES (?, ?, ?, ?)').run(uuidv4(), areaId, asigNom, peso);
                });
            })();
            fs.unlinkSync(req.file.path);
            res.redirect('/admin/academico?msg=masivo_ok');
        } catch (error) { res.redirect('/admin/academico?msg=error'); }
    }
};

module.exports = academicoController;