// public/js/academico.js
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('msg') === 'ok') Swal.fire({ title: '¡Éxito!', text: 'Cambios guardados correctamente.', icon: 'success', timer: 2000, showConfirmButton: false });
    if (params.get('msg') === 'eliminado') Swal.fire({ title: 'Eliminado', text: 'El registro fue borrado.', icon: 'info', timer: 2000, showConfirmButton: false });
    if (params.get('msg') === 'masivo_ok') Swal.fire({ title: '¡Carga Exitosa!', text: 'El plan de estudios fue estructurado.', icon: 'success' });
    if (params.get('msg') === 'error') Swal.fire('Error', 'Hubo un problema procesando la solicitud.', 'error');
});

// Función "Invisíble" para enviar datos por POST desde JS
function submitFormPost(url, data) {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = url;
    for (const key in data) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = data[key];
        form.appendChild(input);
    }
    document.body.appendChild(form);
    form.submit();
}

function mostrarCarga() {
    if(document.getElementById('formMasivo').checkValidity()) {
        Swal.fire({ title: 'Procesando...', html: 'Estructurando áreas y asignaturas.', allowOutsideClick: false, didOpen: () => { Swal.showLoading() } });
    }
}

// Ventanas Modales (CRUD)
function editarArea(id, nombreActual) {
    Swal.fire({
        title: 'Editar Nombre del Área',
        input: 'text',
        inputValue: nombreActual,
        showCancelButton: true,
        confirmButtonText: 'Guardar Cambios',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed && result.value) {
            submitFormPost('/admin/academico/area/editar', { id_area: id, nombre_area: result.value });
        }
    });
}

function eliminarArea(id, nombre) {
    Swal.fire({
        title: '¿Eliminar Área?',
        text: `Se borrará "${nombre}" y TODAS sus asignaturas. Esto no se puede deshacer.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) submitFormPost('/admin/academico/area/eliminar', { id_area: id });
    });
}

function editarAsignatura(id, nombreActual, pesoActual) {
    Swal.fire({
        title: 'Editar Asignatura',
        html: `
            <label class="small fw-bold">Nombre:</label>
            <input id="swal-input1" class="swal2-input mt-0 mb-3" value="${nombreActual}" style="text-transform: uppercase;">
            <label class="small fw-bold">Peso Porcentual (%):</label>
            <input id="swal-input2" type="number" class="swal2-input mt-0" value="${pesoActual}">
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Guardar',
        preConfirm: () => {
            return {
                nombre: document.getElementById('swal-input1').value,
                peso: document.getElementById('swal-input2').value
            }
        }
    }).then((result) => {
        if (result.isConfirmed) {
            submitFormPost('/admin/academico/asignatura/editar', { id_asignatura: id, nombre_asignatura: result.value.nombre, peso_porcentual: result.value.peso });
        }
    });
}

function eliminarAsignatura(id, nombre) {
    Swal.fire({
        title: '¿Eliminar Asignatura?',
        text: `Se borrará "${nombre}".`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Eliminar'
    }).then((result) => {
        if (result.isConfirmed) submitFormPost('/admin/academico/asignatura/eliminar', { id_asignatura: id });
    });
}