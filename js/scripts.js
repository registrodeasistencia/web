import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js';
import { getDatabase, ref, get } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-database.js';

const firebaseConfig = {
    apiKey: "AIzaSyD_hlzoqHTCpnmCzIui6bdAvm7j8Xn9buQ",
    authDomain: "asistencia-titulados.firebaseapp.com",
    databaseURL: "https://asistencia-titulados-default-rtdb.firebaseio.com",
    projectId: "asistencia-titulados",
    storageBucket: "asistencia-titulados.appspot.com",
    messagingSenderId: "438743800689",
    appId: "1:438743800689:web:444e1026aee91856b1f4d0"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

document.addEventListener('DOMContentLoaded', function() {
    const tableBody = document.querySelector('#asistenciaTable tbody');
    const filterEstado = document.getElementById('filterEstado');
    const filterCarrera = document.getElementById('filterCarrera');
    const filterInstitucion = document.getElementById('filterInstitucion');
    const searchInput = document.getElementById('searchInput');
    const downloadButton = document.getElementById('downloadButton');
    const refreshButton = document.getElementById('refreshButton');

    let allData = [];
    let filteredData = [];

    get(ref(database, 'asistenciaAlumnos')).then((snapshot) => {
        if (snapshot.exists()) {
            const carrerasSet = new Set();
            const institucionesSet = new Set();
            const alumnos = [];
            snapshot.forEach((childSnapshot) => {
                const userData = childSnapshot.val();
                alumnos.push(userData);
                carrerasSet.add(userData.carrera);
                institucionesSet.add(userData.institucion);
            });

            // Llenar el dropdown de carreras
            carrerasSet.forEach(carrera => {
                const option = document.createElement('option');
                option.value = carrera;
                option.textContent = carrera;
                filterCarrera.appendChild(option);
            });

            // Llenar el dropdown de instituciones
            institucionesSet.forEach(institucion => {
                const option = document.createElement('option');
                option.value = institucion;
                option.textContent = institucion;
                filterInstitucion.appendChild(option);
            });

            allData = alumnos;

            const filterAndDisplay = () => {
                tableBody.innerHTML = '';
                const searchText = searchInput.value.toLowerCase();
                const estadoFilter = filterEstado.value;
                const carreraFilter = filterCarrera.value;
                const institucionFilter = filterInstitucion.value;

                filteredData = alumnos.filter(alumno => {
                    const matchName = alumno.nombre.toLowerCase().includes(searchText);
                    const matchEstado = estadoFilter === 'Todos' || alumno.estado === estadoFilter;
                    const matchCarrera = carreraFilter === 'Todas' || alumno.carrera === carreraFilter;
                    const matchInstitucion = institucionFilter === 'Todas' || alumno.institucion === institucionFilter;
                    return matchName && matchEstado && matchCarrera && matchInstitucion;
                });

                if (filteredData.length === 0) {
                    const row = document.createElement('tr');
                    row.innerHTML = `<td colspan="5" class="text-center">No hay datos importados.</td>`;
                    tableBody.appendChild(row);
                    downloadButton.disabled = true; // Deshabilitar el botón si no hay datos
                } else {
                    filteredData.forEach((alumno) => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${alumno.nombre}</td>
                            <td>${alumno.carrera}</td>
                            <td>${alumno.institucion}</td>
                            <td class="${alumno.estado === 'Presente' ? 'estado-presente' : alumno.estado === 'Ausente' ? 'estado-ausente' : ''}">
                                ${alumno.estado}
                            </td>
                        `;
                        tableBody.appendChild(row);
                    });
                    downloadButton.disabled = false; // Habilitar el botón si hay datos
                }
            };

            filterEstado.addEventListener('change', filterAndDisplay);
            filterCarrera.addEventListener('change', filterAndDisplay);
            filterInstitucion.addEventListener('change', filterAndDisplay);
            searchInput.addEventListener('input', filterAndDisplay);

            filterAndDisplay();
        } else {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="5" class="text-center">No hay datos importados.</td>`;
            tableBody.appendChild(row);
            downloadButton.disabled = true; // Deshabilitar el botón si no hay datos
        }
    }).catch((error) => {
        console.error(error);
    });

    refreshButton.addEventListener('click', () => {
        location.reload();
    });

    downloadButton.addEventListener('click', async () => {
        const wb = XLSX.utils.book_new();

        // Crear una hoja de trabajo con los datos de la tabla
        const wsData = [
            ["RUT", "Nombre", "Carrera", "Institución", "Estado"]
        ];

        filteredData.forEach(alumno => {
            wsData.push([alumno.rut, alumno.nombre, alumno.carrera, alumno.institucion, alumno.estado]);
        });

        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Ajustar celdas al texto
        const cols = [
            { wch: 15 },
            { wch: 40 },
            { wch: 50 },
            { wch: 10 },
            { wch: 10 }
        ];
        ws['!cols'] = cols;

        XLSX.utils.book_append_sheet(wb, ws, "Asistencia");

        // Obtener los valores de los filtros
        const estadoFilter = filterEstado.value;
        const carreraFilter = filterCarrera.value;

        // Crear el nombre del archivo basado en los filtros seleccionados
        const fileName = `RegistroAsistencia_${estadoFilter}_Carrera${carreraFilter}.xlsx`.replace(/ /g, '_');

        // Pedir al usuario seleccionar la ubicación para guardar el archivo
        const opts = {
            types: [{
                description: 'Excel Files',
                accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
            }],
            suggestedName: fileName,
        };

        try {
            const handle = await window.showSaveFilePicker(opts);
            const writableStream = await handle.createWritable();
            const workbookBlob = new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

            await writableStream.write(workbookBlob);
            await writableStream.close();
        } catch (err) {
            console.error('Error saving file:', err);
        }
    });
});
