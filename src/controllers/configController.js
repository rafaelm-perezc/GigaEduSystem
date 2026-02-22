const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const configController = {
    getConfiguracion: (req, res) => {
        let config = db.prepare('SELECT * FROM institucion LIMIT 1').get();
        if (!config) {
            config = { id: '', nit: '', dane: '', nombre: '', rector_nombre: '', resolucion: '', url_logo: '', url_firma_rector: '', escala_minima: 1.0, escala_maxima: 5.0 };
        }
        res.render('admin/configuracion_colegio', { config, usuario: req.session.usuario });
    },

    guardarConfiguracion: (req, res) => {
        try {
            const { nit, dane, nombre, rector_nombre, resolucion, escala_minima, escala_maxima } = req.body;
            
            let config = db.prepare('SELECT id, url_logo, url_firma_rector FROM institucion LIMIT 1').get();
            let url_logo = config ? config.url_logo : '';
            let url_firma = config ? config.url_firma_rector : '';

            // 100% OFFLINE: Guardar imágenes en la carpeta local public/uploads
            const uploadsDir = path.join(__dirname, '../../public/uploads');
            
            // Si la carpeta no existe, el sistema la crea automáticamente
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }

            // Procesar Logo
            if (req.files && req.files['logo']) {
                const logoFile = req.files['logo'][0];
                const logoFileName = 'logo_' + Date.now() + path.extname(logoFile.originalname);
                const logoPath = path.join(uploadsDir, logoFileName);
                fs.copyFileSync(logoFile.path, logoPath);
                url_logo = '/uploads/' + logoFileName; // Guardamos la ruta local en la BD
            }

            // Procesar Firma
            if (req.files && req.files['firma_rector']) {
                const firmaFile = req.files['firma_rector'][0];
                const firmaFileName = 'firma_' + Date.now() + path.extname(firmaFile.originalname);
                const firmaPath = path.join(uploadsDir, firmaFileName);
                fs.copyFileSync(firmaFile.path, firmaPath);
                url_firma = '/uploads/' + firmaFileName; // Guardamos la ruta local en la BD
            }

            // Guardar en la Base de Datos SQLite (Mayúsculas forzadas)
            if (config) {
                db.prepare('UPDATE institucion SET nit=?, dane=?, nombre=?, rector_nombre=?, resolucion=?, url_logo=?, url_firma_rector=?, escala_minima=?, escala_maxima=? WHERE id=?')
                  .run(nit, dane, nombre.toUpperCase(), rector_nombre.toUpperCase(), resolucion, url_logo, url_firma, escala_minima, escala_maxima, config.id);
            } else {
                db.prepare('INSERT INTO institucion (id, nit, dane, nombre, rector_nombre, resolucion, url_logo, url_firma_rector, escala_minima, escala_maxima) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
                  .run(uuidv4(), nit, dane, nombre.toUpperCase(), rector_nombre.toUpperCase(), resolucion, url_logo, url_firma, escala_minima, escala_maxima);
            }

            res.redirect('/admin/configuracion?msg=ok');
        } catch (error) {
            console.error("Error guardando configuración offline:", error);
            res.redirect('/admin/configuracion?msg=error');
        }
    }
};

module.exports = configController;