document.addEventListener('DOMContentLoaded', () => {
    // Alertas
    const params = new URLSearchParams(window.location.search);
    if (params.get('msg') === 'ok') Swal.fire({ title: '¡Éxito!', text: 'El registro se guardó/actualizó correctamente.', icon: 'success', timer: 2000, showConfirmButton: false });
    if (params.get('msg') === 'masivo_ok') Swal.fire({ title: '¡Carga Exitosa!', text: 'La lista de estudiantes fue procesada.', icon: 'success' });
    if (params.get('msg') === 'error') Swal.fire('Error', 'Hubo un problema procesando la solicitud.', 'error');

    // Buscador en Vivo
    const inputBusqueda = document.getElementById('busqueda');
    const tablaEstudiantes = document.getElementById('tabla-estudiantes');
    const contador = document.getElementById('contador');

    if (inputBusqueda) {
        inputBusqueda.addEventListener('input', async (e) => {
            const q = e.target.value;
            
            if (q.trim() === '') {
                window.location.href = '/admin/matriculas';
                return;
            }

            try {
                const res = await fetch(`/admin/matriculas/buscar?q=${q}`);
                const data = await res.json();

                tablaEstudiantes.innerHTML = '';
                if(contador) contador.textContent = `${data.length} Registros`;

                if (data.length === 0) {
                    tablaEstudiantes.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">No se encontraron estudiantes con esos datos.</td></tr>';
                    return;
                }

                data.forEach(est => {
                    const grupoTexto = est.grado ? `${est.grado} - ${est.nomenclatura}` : '<span class="text-danger">Sin Grupo</span>';
                    
                    // AHORA EL BOTÓN DEL BUSCADOR TRAE ABSOLUTAMENTE TODOS LOS DATOS
                    const fila = `
                        <tr>
                            <td class="align-middle"><span class="badge bg-secondary">${est.documento}</span></td>
                            <td class="align-middle fw-bold">${est.primer_apellido} ${est.segundo_apellido} ${est.primer_nombre} ${est.segundo_nombre}</td>
                            <td class="align-middle text-primary">${grupoTexto}</td>
                            <td class="align-middle text-center">
                                <button class="btn btn-sm btn-outline-primary" onclick="editarEstudiante(this)" 
                                    data-id="${est.id}" data-tipo="${est.tipo_documento}" data-doc="${est.documento}" 
                                    data-pnom="${est.primer_nombre}" data-snom="${est.segundo_nombre}" 
                                    data-pape="${est.primer_apellido}" data-sape="${est.segundo_apellido}"
                                    data-nac="${est.fecha_nacimiento}" data-dir="${est.direccion}" data-tel="${est.telefono}"
                                    data-email="${est.email}" data-acunom="${est.acudiente_nombre}" data-acutel="${est.acudiente_telefono}"
                                    data-grupo="${est.id_grupo}">
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

// Función súper segura para llenar el formulario (Respeta el "0")
function editarEstudiante(btn) {
    // Helper para extraer datos de forma segura, respetando el número '0'
    const getVal = (attr) => {
        const val = btn.getAttribute(attr);
        return (val === 'null' || val === 'undefined' || val === null) ? '' : val;
    };

    document.getElementById('id_estudiante').value = getVal('data-id');
    document.getElementById('tipo_documento').value = getVal('data-tipo') || 'TI';
    document.getElementById('documento').value = getVal('data-doc');
    document.getElementById('primer_nombre').value = getVal('data-pnom');
    document.getElementById('segundo_nombre').value = getVal('data-snom');
    document.getElementById('primer_apellido').value = getVal('data-pape');
    document.getElementById('segundo_apellido').value = getVal('data-sape');
    document.getElementById('fecha_nacimiento').value = getVal('data-nac');
    document.getElementById('direccion').value = getVal('data-dir');
    document.getElementById('telefono').value = getVal('data-tel');
    document.getElementById('email').value = getVal('data-email');
    document.getElementById('acudiente_nombre').value = getVal('data-acunom');
    document.getElementById('acudiente_telefono').value = getVal('data-acutel');
    document.getElementById('id_grupo').value = getVal('data-grupo');
    
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