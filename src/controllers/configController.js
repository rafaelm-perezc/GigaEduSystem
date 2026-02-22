const db = require('../config/database');
const { dbFirebase, bucket } = require('../config/firebase-config');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

// Función interna para subir archivos a Firebase Storage y obtener la URL
async function uploadToFirebase(localFilePath, destinationFileName) {
    try {
        const [file] = await bucket.upload(localFilePath, {
            destination: `institucion/${destinationFileName}`,
            metadata: { cacheControl: 'public, max-age=31536000' }
        });
        // Hacemos el archivo público para que jsPDF pueda leerlo sin bloqueos
        await file.makePublic();
        return `https://storage.googleapis.com/${bucket.name}/institucion/${destinationFileName}`;
    } catch (error) {
        console.error("Error subiendo a Firebase Storage:", error);
        return null;
    }
}

const configController = {
    // Renderizar la pantalla con los datos actuales
    getConfiguracion: (req, res) => {
        const row = db.prepare('SELECT * FROM institucion LIMIT 1').get();
        res.render('admin/configuracion_colegio', { institucion: row || {} });
    },

    // Guardar o actualizar la configuración
    guardarConfiguracion: async (req, res) => {
        try {
            const { nit, dane, nombre, rector_nombre, resolucion } = req.body;
            
            // Buscar si ya existe una configuración
            let institucion = db.prepare('SELECT * FROM institucion LIMIT 1').get();
            const id = institucion ? institucion.id : uuidv4();

            let url_logo = institucion ? institucion.url_logo : null;
            let url_firma_rector = institucion ? institucion.url_firma_rector : null;

            // Procesar Logo si se subió uno nuevo
            if (req.files && req.files['logo']) {
                const logoFile = req.files['logo'][0];
                url_logo = await uploadToFirebase(logoFile.path, `logo_${id}${path.extname(logoFile.originalname)}`);
                fs.unlinkSync(logoFile.path); // Borrar temporal local
            }

            // Procesar Firma si se subió una nueva
            if (req.files && req.files['firma_rector']) {
                const firmaFile = req.files['firma_rector'][0];
                url_firma_rector = await uploadToFirebase(firmaFile.path, `firma_rector_${id}${path.extname(firmaFile.originalname)}`);
                fs.unlinkSync(firmaFile.path); // Borrar temporal local
            }

            // UPSERT en SQLite local
            const stmt = db.prepare(`
                INSERT INTO institucion (id, nit, dane, nombre, rector_nombre, resolucion, url_logo, url_firma_rector) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET 
                nit=excluded.nit, dane=excluded.dane, nombre=excluded.nombre, 
                rector_nombre=excluded.rector_nombre, resolucion=excluded.resolucion, 
                url_logo=excluded.url_logo, url_firma_rector=excluded.url_firma_rector,
                updated_at=CURRENT_TIMESTAMP
            `);
            stmt.run(id, nit, dane, nombre, rector_nombre, resolucion, url_logo, url_firma_rector);

            // Sincronizar hacia Firebase Firestore (El SSOT)
            await dbFirebase.collection('institucion').doc(id).set({
                nit, dane, nombre, rector_nombre, resolucion, url_logo, url_firma_rector,
                updated_at: new Date()
            }, { merge: true });

            res.send("<script>alert('Configuración guardada y sincronizada con éxito'); window.location.href='/admin/configuracion';</script>");

        } catch (error) {
            console.error("Error al guardar configuración:", error);
            res.status(500).send("Error interno al procesar la configuración.");
        }
    }
};

module.exports = configController;