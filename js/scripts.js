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

                const filteredAlumnos = alumnos.filter(alumno => {
                    const matchName = alumno.nombre.toLowerCase().includes(searchText);
                    const matchEstado = estadoFilter === 'Todos' || alumno.estado === estadoFilter;
                    const matchCarrera = carreraFilter === 'Todas' || alumno.carrera === carreraFilter;
                    const matchInstitucion = institucionFilter === 'Todas' || alumno.institucion === institucionFilter;
                    return matchName && matchEstado && matchCarrera && matchInstitucion;
                });

                filteredAlumnos.forEach((alumno) => {
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
            };

            filterEstado.addEventListener('change', filterAndDisplay);
            filterCarrera.addEventListener('change', filterAndDisplay);
            filterInstitucion.addEventListener('change', filterAndDisplay);
            searchInput.addEventListener('input', filterAndDisplay);

            filterAndDisplay();
        } else {
            console.log("No data available");
        }
    }).catch((error) => {
        console.error(error);
    });

    refreshButton.addEventListener('click', () => {
        location.reload();
    });

    downloadButton.addEventListener('click', () => {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'pt', 'a4');
        const table = document.getElementById("asistenciaTable");

        pdf.html(table, {
            callback: function (pdf) {
                pdf.save("tabla_asistencia.pdf");
            },
            margin: [10, 10, 10, 10],
            autoPaging: 'text',
            width: 500,
            windowWidth: 650
        });
    });
});
