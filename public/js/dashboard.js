// public/js/dashboard.js
function confirmarSalida() {
    Swal.fire({
        title: '¿Desea salir del sistema?',
        text: "Seleccione si desea cambiar de usuario o apagar el programa completamente.",
        icon: 'question',
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: '🔄 Cambiar Usuario (Cerrar Sesión)',
        denyButtonText: '🛑 Apagar Programa',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#3085d6',
        denyButtonColor: '#d33'
    }).then((result) => {
        if (result.isConfirmed) {
            window.location.href = '/logout';
        } else if (result.isDenied) {
            window.location.href = '/shutdown';
        }
    });
}