// public/js/asignacion.js
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('msg') === 'ok') Swal.fire({ title: '¡Éxito!', text: 'El registro se procesó correctamente.', icon: 'success', timer: 2000, showConfirmButton: false });
    if (params.get('msg') === 'masivo_ok') Swal.fire({ title: '¡Carga Exitosa!', text: 'La lista fue procesada.', icon: 'success' });
    if (params.get('msg') === 'error') Swal.fire('Error', 'Hubo un problema procesando la solicitud.', 'error');

    const inputBusqueda = document.getElementById('busquedaDocente');
    const tablaDocentes = document.getElementById('tabla-docentes');

    // Búsqueda en Vivo de Docentes
    if (inputBusqueda) {
        inputBusqueda.addEventListener('input', async (e) => {
            const q = e.target.value;
            if (q.trim() === '') { window.location.href = '/admin/asignacion'; return; }
            try {
                const res = await fetch(`/admin/asignacion/docentes/buscar?q=${q}`);
                const data = await res.json();
                tablaDocentes.innerHTML = '';
                if (data.length === 0) {
                    tablaDocentes.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">No se encontraron docentes.</td></tr>';
                    return;
                }
                data.forEach(d => {
                    const fila = `
                        <tr>
                            <td class="align-middle"><span class="badge bg-secondary">${d.documento}</span></td>
                            <td class="align-middle fw-bold">${d.primer_apellido} ${d.segundo_apellido} ${d.primer_nombre} ${d.segundo_nombre}</td>
                            <td class="align-middle text-muted">${d.telefono || 'Sin registrar'}</td>
                            <td class="align-middle text-center">
                                <button class="btn btn-sm btn-outline-primary" onclick="editarDocente(this)"
                                    data-id="${d.id}" data-doc="${d.documento}"
                                    data-pnom="${d.primer_nombre}" data-snom="${d.segundo_nombre}"
                                    data-pape="${d.primer_apellido}" data-sape="${d.segundo_apellido}"
                                    data-email="${d.email || ''}" data-tel="${d.telefono || ''}"
                                    data-emernom="${d.contacto_emergencia_nombre || ''}" data-emertel="${d.contacto_emergencia_telefono || ''}">
                                    ✏️ Editar
                                </button>
                            </td>
                        </tr>
                    `;
                    tablaDocentes.insertAdjacentHTML('beforeend', fila);
                });
            } catch (error) { console.error("Error en búsqueda:", error); }
        });
    }
});

// Llenar el formulario para actualizar
function editarDocente(btn) {
    document.getElementById('id_docente').value = btn.getAttribute('data-id');
    document.getElementById('documento').value = btn.getAttribute('data-doc');
    document.getElementById('primer_nombre').value = btn.getAttribute('data-pnom');
    document.getElementById('segundo_nombre').value = btn.getAttribute('data-snom') !== 'null' ? btn.getAttribute('data-snom') : '';
    document.getElementById('primer_apellido').value = btn.getAttribute('data-pape');
    document.getElementById('segundo_apellido').value = btn.getAttribute('data-sape') !== 'null' ? btn.getAttribute('data-sape') : '';
    document.getElementById('email').value = btn.getAttribute('data-email');
    document.getElementById('telefono').value = btn.getAttribute('data-tel');
    document.getElementById('contacto_emergencia_nombre').value = btn.getAttribute('data-emernom');
    document.getElementById('contacto_emergencia_telefono').value = btn.getAttribute('data-emertel');

    document.getElementById('btnGuardarDocente').textContent = 'Guardar Cambios';
    document.getElementById('btnGuardarDocente').classList.replace('btn-dark', 'btn-warning');

    var tab = new bootstrap.Tab(document.querySelector('#docentes-tab'));
    tab.show();
}

function limpiarFormularioDocente() {
    document.getElementById('formDocente').reset();
    document.getElementById('id_docente').value = '';
    document.getElementById('btnGuardarDocente').textContent = 'Guardar Docente';
    document.getElementById('btnGuardarDocente').classList.replace('btn-warning', 'btn-dark');
}

function mostrarCarga() {
    if(document.getElementById('formMasivo').checkValidity()) {
        Swal.fire({ title: 'Procesando Excel...', html: 'Registrando docentes.', allowOutsideClick: false, didOpen: () => { Swal.showLoading() } });
    }
}