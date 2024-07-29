// scripts.js

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
    const searchInput = document.getElementById('searchInput');
    const downloadButton = document.getElementById('downloadButton');

    let allData = [];

    get(ref(database, 'asistenciaAlumnos')).then((snapshot) => {
        if (snapshot.exists()) {
            const carrerasSet = new Set();
            const alumnos = [];
            snapshot.forEach((childSnapshot) => {
                const userData = childSnapshot.val();
                alumnos.push(userData);
                carrerasSet.add(userData.carrera);
            });

            // Llenar el dropdown de carreras
            carrerasSet.forEach(carrera => {
                const option = document.createElement('option');
                option.value = carrera;
                option.textContent = carrera;
                filterCarrera.appendChild(option);
            });

            allData = alumnos;

            const filterAndDisplay = () => {
                tableBody.innerHTML = '';
                const searchText = searchInput.value.toLowerCase();
                const estadoFilter = filterEstado.value;
                const carreraFilter = filterCarrera.value;

                const filteredAlumnos = alumnos.filter(alumno => {
                    const matchName = alumno.nombre.toLowerCase().includes(searchText);
                    const matchEstado = estadoFilter === 'Todos' || alumno.estado === estadoFilter;
                    const matchCarrera = carreraFilter === 'Todas' || alumno.carrera === carreraFilter;
                    return matchName && matchEstado && matchCarrera;
                });

                filteredAlumnos.forEach((alumno) => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${alumno.nombre}</td>
                        <td>${alumno.carrera}</td>
                        <td>${alumno.institucion}</td>
                        <td>${alumno.estado}</td>
                    `;
                    tableBody.appendChild(row);
                });
            };

            filterEstado.addEventListener('change', filterAndDisplay);
            filterCarrera.addEventListener('change', filterAndDisplay);
            searchInput.addEventListener('input', filterAndDisplay);

            filterAndDisplay();
        } else {
            console.log("No data available");
        }
    }).catch((error) => {
        console.error(error);
    });

    downloadButton.addEventListener('click', () => {
        const { jsPDF } = window.jspdf;

        html2canvas(document.querySelector("#asistenciaTable")).then(canvas => {
            const pdf = new jsPDF('p', 'pt', 'a4');
            const imgData = canvas.toDataURL('image/png');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save("tabla_asistencia.pdf");
        });
    });
});
