const admin = require("firebase-admin");
const path = require("path");

// Leemos el archivo de credenciales que descargaste de Firebase
const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");
const serviceAccount = require(serviceAccountPath);

// Inicializamos la app administrativa de Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // Asegúrate de cambiar esto si tu bucket se llama distinto en Firebase Storage
  storageBucket: "gigaedusystem.firebasestorage.app" 
});

// Exportamos los dos servicios que necesitamos: Firestore y Storage
const dbFirebase = admin.firestore();
const bucket = admin.storage().bucket();

console.log('☁️ Conexión con Firebase Firestore y Storage inicializada.');

module.exports = { dbFirebase, bucket };