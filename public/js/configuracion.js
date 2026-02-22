document.addEventListener('DOMContentLoaded', () => {
    // Manejo de Alertas
    const params = new URLSearchParams(window.location.search);
    if (params.get('msg') === 'ok') Swal.fire({ title: '¡Guardado!', text: 'La configuración se actualizó correctamente.', icon: 'success', timer: 2500, showConfirmButton: false });
    if (params.get('msg') === 'error') Swal.fire('Error', 'Hubo un problema guardando los datos.', 'error');

    // Lógica en Vivo para la Jornada
    const mapaJornadas = {
        '1': 'Completa', '2': 'Mañana', '3': 'Tarde',
        '4': 'Nocturna', '5': 'Fin de semana', '6': 'Única'
    };
    const selectJornada = document.getElementById('jornada_numero');
    const spanJornada = document.getElementById('jornada_span');

    if (selectJornada && spanJornada) {
        selectJornada.addEventListener('change', (e) => {
            const num = e.target.value;
            spanJornada.textContent = mapaJornadas[num] || 'Seleccione...';
        });
    }
});