const express = require('express');
const router = express.Router();
const estudianteController = require('../controllers/estudianteController');

// Middleware de seguridad: Solo deja pasar si el rol es ESTUDIANTE
const authEstudiante = (req, res, next) => {
    if (req.session.usuario && req.session.usuario.rol === 'ESTUDIANTE') {
        next();
    } else {
        res.redirect('/');
    }
};

router.get('/mis-notas', authEstudiante, estudianteController.getMisNotas);

module.exports = router;