const db = require('../config/database');
const bcrypt = require('bcryptjs');

const authController = {
    // 1. Mostrar la pantalla de Login
    getLogin: (req, res) => {
        // Si ya inició sesión, mandarlo directo al menú principal
        if (req.session && req.session.usuario) {
            return res.redirect('/dashboard');
        }
        res.render('login', { error: null });
    },

    // 2. Procesar el intento de ingreso
    postLogin: async (req, res) => {
        const { documento, password } = req.body;

        try {
            // INTENTO 1: Buscar en el personal del colegio (Admin, Secretaria, Docente)
            const usuario = db.prepare('SELECT * FROM usuarios WHERE documento = ?').get(documento);
            
            if (usuario) {
                // Verificar contraseña encriptada
                const coinciden = await bcrypt.compare(password, usuario.password_hash);
                if (coinciden) {
                    // Guardar los datos en la "memoria" de la sesión
                    req.session.usuario = {
                        id: usuario.id,
                        nombres: usuario.nombres,
                        apellidos: usuario.apellidos,
                        rol: usuario.rol
                    };
                    return res.redirect('/dashboard');
                }
            }

            // INTENTO 2: Si no es profesor/admin, buscar en estudiantes
            const estudiante = db.prepare('SELECT * FROM estudiantes WHERE documento = ?').get(documento);
            
            if (estudiante) {
                // Para el MVP, la contraseña de los estudiantes será su mismo documento
                if (documento === password) {
                    req.session.usuario = {
                        id: estudiante.id,
                        nombres: estudiante.nombres,
                        apellidos: estudiante.apellidos,
                        rol: 'ESTUDIANTE'
                    };
                    return res.redirect('/dashboard');
                }
            }

            // Si llega aquí, es porque nada coincidió
            return res.render('login', { error: 'Documento o contraseña incorrectos.' });

        } catch (error) {
            console.error("Error en login:", error);
            return res.render('login', { error: 'Error interno del sistema.' });
        }
    },

    // 3. Cerrar sesión
    logout: (req, res) => {
        req.session.destroy();
        res.redirect('/');
    }
};

module.exports = authController;