const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcryptjs');

// Enviar nombre y ubicación a la pantalla de Login
router.get('/', (req, res) => {
    if (req.session.usuario) return res.redirect('/dashboard');
    
    const inst = db.prepare('SELECT nombre, ubicacion FROM institucion LIMIT 1').get();
    const instNombre = inst && inst.nombre ? inst.nombre : 'SISTEMA GIGA-EDU';
    const instUbicacion = inst && inst.ubicacion ? inst.ubicacion : 'Configuración Pendiente';
    
    res.render('login', { error: null, instNombre, instUbicacion });
});

router.post('/login', (req, res) => {
    const { documento, password } = req.body;
    const inst = db.prepare('SELECT nombre, ubicacion FROM institucion LIMIT 1').get();
    const instNombre = inst ? inst.nombre : 'SISTEMA GIGA-EDU';
    const instUbicacion = inst ? inst.ubicacion : 'Configuración Pendiente';

    try {
        const usuario = db.prepare('SELECT * FROM usuarios WHERE documento = ? AND estado = 1').get(documento);
        if (!usuario) {
            const estudiante = db.prepare('SELECT * FROM estudiantes WHERE documento = ?').get(documento);
            if (estudiante && password === documento) {
                req.session.usuario = { id: estudiante.id, primer_nombre: estudiante.primer_nombre, primer_apellido: estudiante.primer_apellido, rol: 'ESTUDIANTE' };
                return res.redirect('/dashboard');
            }
            return res.render('login', { error: 'Usuario no encontrado o inactivo.', instNombre, instUbicacion });
        }
        if (bcrypt.compareSync(password, usuario.password_hash)) {
            req.session.usuario = { id: usuario.id, primer_nombre: usuario.primer_nombre, primer_apellido: usuario.primer_apellido, rol: usuario.rol };
            return res.redirect('/dashboard');
        } else {
            return res.render('login', { error: 'Contraseña incorrecta.', instNombre, instUbicacion });
        }
    } catch (error) {
        return res.render('login', { error: 'Error interno del servidor.', instNombre, instUbicacion });
    }
});

router.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/'); });
router.get('/shutdown', (req, res) => {
    req.session.destroy(() => { console.log("🛑 Sistema apagado."); process.exit(0); });
});

module.exports = router;