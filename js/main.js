let peticionEnCurso = false;
let temporizador;
let pag = 1;
let peliculasArray = [];
let popup = document.createElement("article");
popup.id = "popup";

window.onload = () => {
    let input = document.getElementById("miinput");
    let indicadorBusqueda = document.getElementById("indicador-busqueda");
    let selectTipo = document.getElementById("tipo");
    let btn = document.getElementById("btn-informe");
    btn.addEventListener("click", (e) => {
        e.stopPropagation();
        crearInforme();
    });
    document.body.appendChild(popup);

    selectTipo.addEventListener("change", () => {
        let valor = input.value.trim();
        if (valor.length >= 3) {
            pag = 1;
            peticion(valor, indicadorBusqueda);
        }
    });

    input.value = "";
    input.addEventListener("input", (e) => {
        let valor = e.target.value.trim();
        window.scrollTo(0, 0);
        document.getElementById("footer").style.display = "none";
        clearTimeout(temporizador);
        temporizador = setTimeout(() => {
            pag = 1;
            peticion(valor, indicadorBusqueda);
        }, 1500);
    });

    window.addEventListener("scroll", () => {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 && !peticionEnCurso) {
            let valor = input.value.trim();
            pag++;
            peticion(valor, indicadorBusqueda);
        }
    });

    window.addEventListener("click", (event) => {
        if (event.target == popup) {
            return;
        } else {
            popup.style.display = "none";
        }
    });
};

function peticion(valor, indicadorBusqueda) {
    let tipo = document.getElementById("tipo").value;
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
                    if (pag === 1) {
                        document.getElementById("container-peliculas").innerHTML = "No hay resultados para " + valor;
                        document.getElementById("btn-informe").style.display = "none";
                    } else {
                        let footer = document.getElementById("footer");
                        footer.style.display = "flex";
                        footer.innerHTML = "<h3>No hay más resultados</h3>";
                    }
                } else {
                    // Solo borra los resultados si es la primera página
                    if (pag === 1) {
                        document.getElementById("container-peliculas").innerHTML = "";
                    }

                    document.getElementById("btn-informe").style.display = "block";
                    let datos = respuesta.Search;
                    procesarDatos(datos);
                }
            }
        };
        let valorSinEspacios = valor.replace(/\s+/g, "+");
        xhttp.open(
            "GET",
            `https://www.omdbapi.com/?s=${valorSinEspacios}&page=${pag}&type=${tipo}&apikey=1b67a274`,
            true,
        );
        xhttp.send();
    } else if (pag === 1) {
        // Solo  si no hay texto en el input
        document.getElementById("container-peliculas").innerHTML = "";
        document.getElementById("btn-informe").style.display = "none";
    }
}

function procesarDatos(datos) {
    let container_peliculas = document.getElementById("container-peliculas");

    datos.forEach((dato) => {
        obtenerDetallesPelicula(dato.imdbID, (detallePeliculaSerie) => {
            peliculasArray.push(detallePeliculaSerie);
            let section = document.createElement("section");
            section.className = "pelicula";
            let h2 = document.createElement("h2");
            let img = document.createElement("img");
            h2.innerHTML = detallePeliculaSerie.Title;
            if (detallePeliculaSerie.Poster === "N/A") {
                img.src = "./img/img-no-disponible.png";
            } else {
                img.src = detallePeliculaSerie.Poster;
            }
            section.appendChild(h2);
            section.appendChild(img);
            section.addEventListener("click", (e) => {
                // sin "stopPropagation" no funciona el display flex
                e.stopPropagation();
                mostrarDetalles(detallePeliculaSerie);
            });
            container_peliculas.appendChild(section);
        });
    });
}

function obtenerDetallesPelicula(id, callback) {
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = () => {
        if (xhttp.readyState === 4 && xhttp.status === 200) {
            let respuesta = JSON.parse(xhttp.responseText);
            callback(respuesta);
        }
    };
    xhttp.open("GET", `https://www.omdbapi.com/?i=${id}&plot=full&apikey=1b67a274`, true);
    xhttp.send();
}

function mostrarDetalles(respuesta) {
    if (respuesta.Poster === "N/A") {
        respuesta.Poster = "./img/img-no-disponible.png";
    }
    let valoraciones = "";
    if (respuesta.Ratings) {
        for (let valoracion of respuesta.Ratings) {
            valoraciones += `<p>${valoracion.Source}: ${valoracion.Value}</p>`;
        }
    }
    popup.innerHTML = `
        <div id="img-pelicula">
        <img src="${respuesta.Poster}" alt="${respuesta.Title}"></div>
        <div id="detalle-pelicula">
        <h2>${respuesta.Title} (${respuesta.Year})</h2>
        <p>Director: ${respuesta.Director}</p>
        <p>Actores: ${respuesta.Actors}</p>
        <p>Tipo: ${respuesta.Type}</p>
        <p>Sinopsis: ${respuesta.Plot}</p>
        <p>Año: ${respuesta.Year}</p>
        <p>Valoraciones:</p>
        ${valoraciones}
        </div>
`;
    popup.style.display = "flex";
    popup.style.flexWrap = "wrap";
    popup.style.opacity = 0.9;
}

function obtenerPeliculasMasValoradas(peliculasArray, tipo) {
    return peliculasArray
        .filter((pelicula) => pelicula.Type === tipo && pelicula.imdbRating && pelicula.imdbRating !== "N/A")
        .sort((a, b) => b.imdbRating - a.imdbRating)
        .slice(0, 5);
}

function obtenerPeliculasMayorRecaudacion(peliculasArray, tipo) {
    return peliculasArray
        .filter((pelicula) => pelicula.Type === tipo && pelicula.BoxOffice && pelicula.BoxOffice !== "N/A")
        .sort((a, b) => b.BoxOffice - a.BoxOffice)
        .slice(0, 5);
}

function obtenerPeliculasMasVotadas(peliculasArray, tipo) {
    return peliculasArray
        .filter((pelicula) => pelicula.Type === tipo && pelicula.imdbVotes && pelicula.imdbVotes !== "N/A")
        .sort((a, b) => b.imdbVotes - a.imdbVotes)
        .slice(0, 5);
}

function eliminarDuplicados(peliculasArray) {
    return peliculasArray.filter(
        (pelicula, index, self) =>
            index === self.findIndex((p) => p.Title === pelicula.Title && p.Year === pelicula.Year),
    );
}

function crearInforme() {
    let tipo = document.getElementById("tipo").value;
    let peliculasUnicas = eliminarDuplicados(peliculasArray);

    let informeDiv = document.getElementById("informe");
    if (!informeDiv) {
        informeDiv = document.createElement("div");
        informeDiv.id = "informe";
    } else {
        informeDiv.innerHTML = "";
    }

    if (tipo === "movie") {
        let peliculasPorValoracion = obtenerPeliculasMasValoradas(peliculasUnicas, tipo);
        let peliculasPorRecaudacion = obtenerPeliculasMayorRecaudacion(peliculasUnicas, tipo);
        let peliculasPorVotos = obtenerPeliculasMasVotadas(peliculasUnicas, tipo);

        let valoracionesHTML = peliculasPorValoracion
            .map((pelicula) => `<p>${pelicula.Title}: ${pelicula.imdbRating}</p>`)
            .join("");

        let votosHTML = peliculasPorVotos.map((pelicula) => `<p>${pelicula.Title}: ${pelicula.imdbVotes}</p>`).join("");

        let recaudacionesHTML = peliculasPorRecaudacion
            .map((pelicula) => `<p>${pelicula.Title}: ${pelicula.BoxOffice}</p>`)
            .join("");

        informeDiv.innerHTML = `
                <h2>Más valoradas</h2>
                ${valoracionesHTML}
                <h2>Más votadas</h2>
                ${votosHTML}
                <h2>Mayor recaudación</h2>
                ${recaudacionesHTML}
        `;
    } else if (tipo === "series") {
        let peliculasPorValoracion = obtenerPeliculasMasValoradas(peliculasUnicas, tipo);
        let peliculasPorVotos = obtenerPeliculasMasVotadas(peliculasUnicas, tipo);

        let valoracionesHTML = peliculasPorValoracion
            .map((pelicula) => `<p>${pelicula.Title}: ${pelicula.imdbRating}</p>`)
            .join("");

        let votosHTML = peliculasPorVotos.map((pelicula) => `<p>${pelicula.Title}: ${pelicula.imdbVotes}</p>`).join("");

        informeDiv.innerHTML = `
                <h2>Más valoradas</h2>
                ${valoracionesHTML}
                <h2>Más votadas</h2>
                ${votosHTML}
        `;
    }

    popup.innerHTML = "";
    popup.appendChild(informeDiv);
    popup.style.display = "flex";
    popup.style.flexWrap = "wrap";
    popup.style.opacity = 0.9;
}
