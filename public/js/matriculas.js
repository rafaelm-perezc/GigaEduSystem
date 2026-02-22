// public/js/matriculas.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. Manejo de Alertas del Servidor
    const params = new URLSearchParams(window.location.search);
    if (params.get('msg') === 'ok') Swal.fire({ title: '¡Éxito!', text: 'El registro se guardó/actualizó correctamente.', icon: 'success', timer: 2000, showConfirmButton: false });
    if (params.get('msg') === 'masivo_ok') Swal.fire({ title: '¡Carga Exitosa!', text: 'La lista de estudiantes fue procesada.', icon: 'success' });
    if (params.get('msg') === 'error') Swal.fire('Error', 'Hubo un problema procesando la solicitud.', 'error');

    // 2. Buscador en Vivo (Live Search)
    const inputBusqueda = document.getElementById('busqueda');
    const tablaEstudiantes = document.getElementById('tabla-estudiantes');

    if (inputBusqueda) {
        inputBusqueda.addEventListener('input', async (e) => {
            const q = e.target.value;
            
            // Si el input está vacío, recargamos la página para ver los 100 por defecto
            if (q.trim() === '') {
                window.location.href = '/admin/matriculas';
                return;
            }

            // Consultamos a nuestra nueva API
            try {
                const res = await fetch(`/admin/matriculas/buscar?q=${q}`);
                const data = await res.json();

                tablaEstudiantes.innerHTML = ''; // Limpiamos la tabla

                if (data.length === 0) {
                    tablaEstudiantes.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">No se encontraron estudiantes con esos datos.</td></tr>';
                    return;
                }

                // Dibujamos los resultados en tiempo real
                data.forEach(est => {
                    const grupoTexto = est.grado ? `${est.grado} - ${est.nomenclatura}` : '<span class="text-danger">Sin Grupo</span>';
                    const fila = `
                        <tr>
                            <td class="align-middle"><span class="badge bg-secondary">${est.documento}</span></td>
                            <td class="align-middle fw-bold">${est.primer_apellido} ${est.segundo_apellido} ${est.primer_nombre} ${est.segundo_nombre}</td>
                            <td class="align-middle text-primary">${grupoTexto}</td>
                            <td class="align-middle text-center">
                                <button class="btn btn-sm btn-outline-primary" onclick="editarEstudiante(this)" 
                                    data-id="${est.id}" data-doc="${est.documento}" 
                                    data-pnom="${est.primer_nombre}" data-snom="${est.segundo_nombre}" 
                                    data-pape="${est.primer_apellido}" data-sape="${est.segundo_apellido}">
                                    ✏️ Editar
                                </button>
                            </td>
                        </tr>
                    `;
                    tablaEstudiantes.insertAdjacentHTML('beforeend', fila);
                });
            } catch (error) {
                console.error("Error en búsqueda:", error);
            }
        });
    }
});

function mostrarCarga() {
    if(document.getElementById('formMasivo').checkValidity()) {
        Swal.fire({ title: 'Procesando Excel...', html: 'Verificando datos y matriculando estudiantes.', allowOutsideClick: false, didOpen: () => { Swal.showLoading() } });
    }
}

// Llenar el formulario con Nombres Divididos
function editarEstudiante(btn) {
    document.getElementById('id_estudiante').value = btn.getAttribute('data-id');
    document.getElementById('documento').value = btn.getAttribute('data-doc');
    document.getElementById('primer_nombre').value = btn.getAttribute('data-pnom') !== 'null' ? btn.getAttribute('data-pnom') : '';
    document.getElementById('segundo_nombre').value = btn.getAttribute('data-snom') !== 'null' ? btn.getAttribute('data-snom') : '';
    document.getElementById('primer_apellido').value = btn.getAttribute('data-pape') !== 'null' ? btn.getAttribute('data-pape') : '';
    document.getElementById('segundo_apellido').value = btn.getAttribute('data-sape') !== 'null' ? btn.getAttribute('data-sape') : '';
    
    document.getElementById('btnGuardar').textContent = 'Guardar Cambios';
    document.getElementById('btnGuardar').classList.replace('btn-primary', 'btn-warning');

    var tab = new bootstrap.Tab(document.querySelector('#individual-tab'));
    tab.show();
}

function limpiarFormulario() {
    document.getElementById('formIndividual').reset();
    document.getElementById('id_estudiante').value = '';
    document.getElementById('btnGuardar').textContent = 'Matricular / Actualizar';
    document.getElementById('btnGuardar').classList.replace('btn-warning', 'btn-primary');
}