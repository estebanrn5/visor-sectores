
// URL de la API
const apiUrl = "https://ags.esri.co/arcgis/rest/services/DatosAbiertos/SUBREGIONES_PROVINCIAS_2012/MapServer/0/query?where=1%3D1&outFields=COD_SUBREGION,NOM_SUBREGION,COD_DEPTO&outSR=4326&f=json";

// Inicializar el mapa
var map = L.map('map', {
    center: [4.5709, -74.2973],
    zoom: 6,
});

// Añadir una capa de tiles (OpenStreetMap)
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png?{foo}', {
    foo: 'bar',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    minZoom: 3,
    maxZoom: 16,
    opacity: 0.5,
}).addTo(map);

// Variables globales para almacenar los datos y los polígonos
let allFeatures = []; // Almacena todos los features del JSON
let currentPolygons = []; // Almacena los polígonos actuales en el mapa

// Función para cargar los datos de la API
async function loadData() {
    const loadingElement = document.getElementById('cargando'); // Obtener el elemento de carga

    try {
        // Mostrar el indicador de carga
        loadingElement.style.display = 'block';

        // Hacer la solicitud a la API
        const response = await fetch(apiUrl);
        const data = await response.json();

        // Guardar todos los features
        allFeatures = data.features;

        // Extraer valores únicos para los dropdowns
        const departamentos = [...new Set(allFeatures.map(feature => feature.attributes.COD_DEPTO))];
        const subregiones = [...new Set(allFeatures.map(feature => feature.attributes.NOM_SUBREGION))];

        // Llenar los dropdowns
        const departamentoSelect = document.getElementById('departamento');
        const subregionSelect = document.getElementById('subregion');

        departamentos.forEach(depto => {
            const option = document.createElement('option');
            option.value = depto;
            option.textContent = depto;
            departamentoSelect.appendChild(option);
        });

        subregiones.forEach(subregion => {
            const option = document.createElement('option');
            option.value = subregion;
            option.textContent = subregion;
            subregionSelect.appendChild(option);
        });

        // Escuchar cambios en los dropdowns
        departamentoSelect.addEventListener('change', filterData);
        subregionSelect.addEventListener('change', filterData);

        // Mostrar todos los datos inicialmente
        filterData();
    } catch (error) {
        console.error("Error al cargar los datos:", error);
    } finally {
        // Ocultar el indicador de carga
        loadingElement.style.display = 'none';
    }
}

// Función para filtrar los datos según las selecciones del usuario
function filterData() {
    const departamentoSelect = document.getElementById('departamento');
    const subregionSelect = document.getElementById('subregion');

    const selectedDepto = departamentoSelect.value;
    const selectedSubregion = subregionSelect.value;

    // Filtrar los features
    const filteredFeatures = allFeatures.filter(feature => {
        const deptoMatch = selectedDepto ? feature.attributes.COD_DEPTO === selectedDepto : true;
        const subregionMatch = selectedSubregion ? feature.attributes.NOM_SUBREGION === selectedSubregion : true;
        return deptoMatch && subregionMatch;
    });

    // Limpiar los polígonos actuales del mapa
    currentPolygons.forEach(polygon => map.removeLayer(polygon));
    currentPolygons = [];

    // Añadir los nuevos polígonos filtrados
    filteredFeatures.forEach(feature => {
        const geometry = feature.geometry;
        const properties = feature.attributes;

        if (geometry && geometry.rings) {
            const polygon = L.polygon(geometry.rings.map(ring => ring.map(coord => [coord[1], coord[0]])), {
                color: 'blue',
                fillColor: 'lightblue',
                fillOpacity: 0.5
            }).addTo(map);

            // Añadir un popup con la información
            polygon.bindPopup(`
                <b>Subregión:</b> ${properties.NOM_SUBREGION}<br>
                <b>Código Subregión:</b> ${properties.COD_SUBREGION}<br>
                <b>Código Departamento:</b> ${properties.COD_DEPTO}
            `);

            // Guardar el polígono para poder eliminarlo después
            currentPolygons.push(polygon);
        }
    });
}

// Llamar a la función para cargar los datos
loadData();


