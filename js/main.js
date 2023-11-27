let listaFinal = [];
let peticionEnCurso = false;
let temporizador;
let pag = 1;
let popup = document.createElement("article");
popup.id = "popup";

window.onload = () => {
    let input = document.getElementById("miinput");
    let indicadorBusqueda = document.getElementById("indicador-busqueda");
    let selectTipo = document.getElementById("tipo");
    let btn = document.getElementById("btn-informe");
    btn.addEventListener("click", () => {
        let aux = [];
        listaFinal.forEach((e) => {
            aux.push(e.Title);
        });
        console.log(aux);
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
        }
        popup.style.display = "none";
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
            `http://www.omdbapi.com/?s=${valorSinEspacios}&page=${pag}&type=${tipo}&apikey=1b67a274`,
            true,
        );
        xhttp.send();
    } else if (pag === 1) {
        // Solo borra los resultados si no hay texto en el input
        document.getElementById("container-peliculas").innerHTML = "";
        document.getElementById("btn-informe").style.display = "none";
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
            listaFinal = crearInforme(respuesta);
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
    };
    xhttp.open("GET", `http://www.omdbapi.com/?i=${id}&plot=full&apikey=1b67a274`, true);
    xhttp.send();
}

let peliculasArray = [];
function crearInforme(datos) {
    peliculasArray = peliculasArray.concat(datos);
    let unicaLista = [...new Set(peliculasArray)];
    unicaLista.sort();
    return unicaLista;
}
