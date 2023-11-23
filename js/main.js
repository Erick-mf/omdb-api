let peticionEnCurso = false;
let temporizador;
let pag = 1;
// Crea el popup una sola vez
let popup = document.createElement("article");
popup.id = "popup";

window.onload = () => {
    let input = document.getElementById("miinput");
    input.value = "";
    let indicadorBusqueda = document.getElementById("indicador-busqueda");
    input.addEventListener("input", (e) => {
        let valor = e.target.value.trim();
        clearTimeout(temporizador);
        temporizador = setTimeout(() => {
            pag = 1;
            peticion(valor, indicadorBusqueda);
        }, 1000);
    });
    // Agrega el controlador de eventos de scroll
    window.addEventListener("scroll", () => {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight && !peticionEnCurso) {
            let valor = input.value.trim();
            pag++;
            peticion(valor, indicadorBusqueda);
        }
    });
    document.body.appendChild(popup);

    // Añade el controlador de eventos de clic al window
    window.addEventListener("click", (event) => {
        // Comprueba si el clic se hizo dentro del popup
        if (event.target == popup) {
            // Si se hizo dentro del popup, no hagas nada
            return;
        }
        // Si se hizo fuera del popup, ciérralo
        popup.style.display = "none";
    });
};

function peticion(valor, indicadorBusqueda) {
    if (valor.length >= 3 && !peticionEnCurso) {
        peticionEnCurso = true;
        indicadorBusqueda.style.display = "block";
        let xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = () => {
            if (xhttp.readyState === 4 && xhttp.status === 200) {
                peticionEnCurso = false;
                indicadorBusqueda.style.display = "none";
                let respuesta = JSON.parse(xhttp.responseText);
                if (respuesta.Response === "False" && respuesta.Search === undefined) {
                    document.getElementById("container-peliculas").innerHTML =
                        "No se encontró ninguna película con ese nombre";
                } else {
                    let datos = respuesta.Search;
                    datos.sort((a, b) => a.Year - b.Year);
                    // Solo borra los resultados si es la primera página
                    if (pag === 1) {
                        document.getElementById("container-peliculas").innerHTML = "";
                    }
                    procesarDatos(datos);
                }
            }
        };
        let valorSinESpacios = valor.replace(/ /g, "+");
        xhttp.open("GET", `http://www.omdbapi.com/?s=${valorSinESpacios}&page=${pag}&apikey=1b67a274`, true);
        xhttp.send();
    } else if (pag === 1) {
        // Solo borra los resultados si no hay texto en el input
        document.getElementById("container-peliculas").innerHTML = "";
    }
}

function procesarDatos(datos) {
    let container_peliculas = document.getElementById("container-peliculas");
    datos.forEach((dato) => {
        let section = document.createElement("section");
        section.className = "pelicula";
        let h2 = document.createElement("h2");
        let img = document.createElement("img");
        h2.innerHTML = dato.Title;
        if (dato.Poster === "N/A") {
            img.src = "./img/img-no-disponible.png";
        } else {
            img.src = dato.Poster;
        }
        section.appendChild(h2);
        section.appendChild(img);
        section.addEventListener("click", () => {
            mostrarDetalles(dato.imdbID);
        });
        container_peliculas.appendChild(section);
    });
}

function mostrarDetalles(id) {
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = () => {
        if (xhttp.readyState === 4 && xhttp.status === 200) {
            let respuesta = JSON.parse(xhttp.responseText);
            popup.innerHTML = `
<div id="img-pelicula">
    <img src="${respuesta.Poster}" alt="${respuesta.Title}"></div>
<div id="detalle-pelicula">
    <h2>${respuesta.Title} (${respuesta.Year})</h2>
    <p>Director: ${respuesta.Director}</p>
    <p>Actores: ${respuesta.Actors}</p>
    <p>Tipo: ${respuesta.Type}</p>
    <p>Sinopsis: ${respuesta.Plot}</p>
<p>Rating dado por ${respuesta.Ratings[0].Source} es: ${respuesta.Ratings[0].Value}</p>
</div>
`;
            popup.style.display = "flex"; // Muestra el popup
            popup.style.flexDirection = "wrap";
            popup.style.opacity = 0.9;
        }
    };
    xhttp.open("GET", `http://www.omdbapi.com/?i=${id}&apikey=1b67a274`, true);
    xhttp.send();
}
