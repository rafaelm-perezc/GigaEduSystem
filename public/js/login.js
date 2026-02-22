// public/js/login.js
document.addEventListener('DOMContentLoaded', () => {
    // Si hay un script que defina 'mensajeError', disparamos la alerta
    if (typeof mensajeError !== 'undefined' && mensajeError) {
        Swal.fire({
            icon: 'error',
            title: 'Acceso Denegado',
            text: mensajeError,
            confirmButtonColor: '#d33'
        });
    }
});