// public/js/asignacion.js
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('msg') === 'ok') Swal.fire({ title: '¡Éxito!', text: 'El registro se guardó correctamente.', icon: 'success', timer: 2000, showConfirmButton: false });
    if (params.get('msg') === 'masivo_ok') Swal.fire({ title: '¡Carga Exitosa!', text: 'Docentes cargados.', icon: 'success' });
    if (params.get('msg') === 'error') Swal.fire('Error', 'Hubo un problema procesando la solicitud.', 'error');

    const inputBusqueda = document.getElementById('busquedaDocente');
    const tablaDocentes = document.getElementById('tabla-docentes');

    if (inputBusqueda) {
        inputBusqueda.addEventListener('input', async (e) => {
            const q = e.target.value;
            if (q.trim() === '') {
                window.location.href = '/admin/asignacion';
                return;
            }
            try {
                const res = await fetch(`/admin/asignacion/docentes/buscar?q=${q}`);
                const data = await res.json();
                tablaDocentes.innerHTML = '';
                if (data.length === 0) {
                    tablaDocentes.innerHTML = '<tr><td colspan="3" class="text-center text-muted py-4">No se encontraron docentes.</td></tr>';
                    return;
                }
                data.forEach(d => {
                    const fila = `
                        <tr>
                            <td class="align-middle"><span class="badge bg-secondary">${d.documento}</span></td>
                            <td class="align-middle fw-bold">${d.primer_apellido} ${d.segundo_apellido} ${d.primer_nombre} ${d.segundo_nombre}</td>
                            <td class="align-middle text-muted">${d.email || 'N/A'}</td>
                        </tr>
                    `;
                    tablaDocentes.insertAdjacentHTML('beforeend', fila);
                });
            } catch (error) { console.error("Error:", error); }
        });
    }
});

function mostrarCarga() {
    if(document.getElementById('formMasivo').checkValidity()) {
        Swal.fire({ title: 'Procesando...', html: 'Registrando docentes y generando claves.', allowOutsideClick: false, didOpen: () => { Swal.showLoading() } });
    }
}