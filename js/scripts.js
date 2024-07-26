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
    const printButton = document.getElementById('printButton');

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

                filteredAlumnos.forEach(userData => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${userData.nombre}</td>
                        <td>${userData.carrera}</td>
                        <td>${userData.institucion}</td>
                        <td class="estado ${userData.estado.toLowerCase()}">${userData.estado}</td>
                    `;

                    // Agregar clases para color de estado
                    const estadoCell = row.querySelector('.estado');
                    if (userData.estado === 'Presente') {
                        estadoCell.classList.add('table-success');
                    } else if (userData.estado === 'Ausente') {
                        estadoCell.classList.add('table-danger');
                    }

                    tableBody.appendChild(row);
                });
            };

            // Filtrar y mostrar datos al cambiar el filtro o al buscar
            filterEstado.addEventListener('change', filterAndDisplay);
            filterCarrera.addEventListener('change', filterAndDisplay);
            searchInput.addEventListener('input', filterAndDisplay);

            // Inicialmente mostrar todos los datos
            filterAndDisplay();
        } else {
            console.log("No data available");
        }
    }).catch((error) => {
        console.error("Error fetching data: ", error);
    });

    document.addEventListener('DOMContentLoaded', function() {
        const printButton = document.getElementById('printButton');
        const table = document.getElementById('asistenciaTable');
        
        printButton.addEventListener('click', () => {
            const { jsPDF } = window.jspdf;
            
            // Usa html2canvas para convertir la tabla a una imagen
            html2canvas(table).then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF();
                const imgWidth = 210; // Ancho de la página en mm
                const pageHeight = 295; // Alto de la página en mm
                const imgHeight = canvas.height * imgWidth / canvas.width;
                let heightLeft = imgHeight;
                
                pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
                heightLeft -= pageHeight;
                
                while (heightLeft >= 0) {
                    pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 0, -heightLeft, imgWidth, imgHeight);
                    heightLeft -= pageHeight;
                }
                
                pdf.save('asistencia.pdf');
            }).catch(error => {
                console.error('Error al generar el PDF:', error);
            });
        });
    });
    
});
