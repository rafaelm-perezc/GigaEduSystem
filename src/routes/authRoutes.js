const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/', authController.getLogin);
router.post('/login', authController.postLogin);
router.get('/logout', authController.logout);
// NUEVA RUTA: Cerrar Sesión y Apagar el Programa
router.get('/shutdown', (req, res) => {
    req.session.destroy((err) => {
        // Le enviamos un mensaje a la consola y luego matamos el proceso "0" (Cierre limpio)
        console.log("🛑 Sistema apagado por el usuario.");
        process.exit(0); 
    });
});

module.exports = router;