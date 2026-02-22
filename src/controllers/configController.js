const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const MAPA_JORNADAS = {
    '1': 'Completa', '2': 'Mañana', '3': 'Tarde',
    '4': 'Nocturna', '5': 'Fin de semana', '6': 'Única'
};

const configController = {
    getConfiguracion: (req, res) => {
        let config = db.prepare('SELECT * FROM institucion LIMIT 1').get();
        if (!config) config = { id: '', nit: '', dane: '', nombre: '', ubicacion: '', rector_nombre: '', resolucion: '', coordinador_academico: '', coordinador_disciplinario: '', jornada: '', url_logo: '', url_logo_departamento: '', url_firma_rector: '', escala_minima: 1.0, escala_maxima: 5.0 };
        res.render('admin/configuracion_colegio', { config, usuario: req.session.usuario });
    },

    guardarConfiguracion: (req, res) => {
        try {
            const { nit, dane, nombre, ubicacion, rector_nombre, resolucion, coordinador_academico, coordinador_disciplinario, jornada_numero, escala_minima, escala_maxima } = req.body;
            let config = db.prepare('SELECT id, url_logo, url_logo_departamento, url_firma_rector FROM institucion LIMIT 1').get();
            
            let url_logo = config ? config.url_logo : '';
            let url_logo_dep = config ? config.url_logo_departamento : '';
            let url_firma = config ? config.url_firma_rector : '';

            // DETECCIÓN INTELIGENTE DE CARPETA UPLOADS
            const isPackaged = __dirname.includes('app.asar');
            let uploadsDir;
            if (isPackaged) {
                // Producción
                const userDataPath = path.join(process.env.APPDATA || process.env.HOME + '/.local/share', 'GigaEduSystem');
                uploadsDir = path.join(userDataPath, 'uploads');
            } else {
                // Desarrollo
                uploadsDir = path.join(__dirname, '../../public/uploads');
            }

            if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

            const procesarImagen = (campoNombre, prefijo) => {
                if (req.files && req.files[campoNombre]) {
                    const file = req.files[campoNombre][0];
                    const fileName = `${prefijo}_${Date.now()}${path.extname(file.originalname)}`;
                    fs.copyFileSync(file.path, path.join(uploadsDir, fileName));
                    return `/uploads/${fileName}`; // La ruta web siempre es la misma
                }
                return null;
            };

            const nuevoLogo = procesarImagen('logo', 'logo');
            if(nuevoLogo) url_logo = nuevoLogo;
            const nuevoLogoDep = procesarImagen('logo_departamento', 'logodep');
            if(nuevoLogoDep) url_logo_dep = nuevoLogoDep;
            const nuevaFirma = procesarImagen('firma_rector', 'firma');
            if(nuevaFirma) url_firma = nuevaFirma;

            const jornada_nombre = MAPA_JORNADAS[jornada_numero] || '';

            if (config) {
                db.prepare('UPDATE institucion SET nit=?, dane=?, nombre=?, ubicacion=?, rector_nombre=?, resolucion=?, coordinador_academico=?, coordinador_disciplinario=?, jornada=?, url_logo=?, url_logo_departamento=?, url_firma_rector=?, escala_minima=?, escala_maxima=? WHERE id=?')
                  .run(nit, dane, nombre.toUpperCase(), (ubicacion||'').toUpperCase(), rector_nombre.toUpperCase(), (resolucion||'').toUpperCase(), (coordinador_academico||'').toUpperCase(), (coordinador_disciplinario||'').toUpperCase(), jornada_nombre, url_logo, url_logo_dep, url_firma, escala_minima, escala_maxima, config.id);
            } else {
                db.prepare('INSERT INTO institucion (id, nit, dane, nombre, ubicacion, rector_nombre, resolucion, coordinador_academico, coordinador_disciplinario, jornada, url_logo, url_logo_departamento, url_firma_rector, escala_minima, escala_maxima) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
                  .run(uuidv4(), nit, dane, nombre.toUpperCase(), (ubicacion||'').toUpperCase(), rector_nombre.toUpperCase(), (resolucion||'').toUpperCase(), (coordinador_academico||'').toUpperCase(), (coordinador_disciplinario||'').toUpperCase(), jornada_nombre, url_logo, url_logo_dep, url_firma, escala_minima, escala_maxima);
            }
            res.redirect('/admin/configuracion?msg=ok');
        } catch (error) { 
            console.error(error);
            res.redirect('/admin/configuracion?msg=error'); 
        }
    }
};

module.exports = configController;