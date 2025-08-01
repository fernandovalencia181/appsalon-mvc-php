const TOTAL_PASOS = 3;
let paso=1;
const pasoInicial=1;

const cita={
    id:"",
    nombre:"",
    fecha:"",
    hora:"",
    servicios:[]
}

document.addEventListener("DOMContentLoaded",function(){
    iniciarApp();
});

function iniciarApp(){
    mostrarSeccion(paso); // Muestra la seccion 1 la primera vez
    tabs(); // Cambia la sección cuando se presionen los tabs
    botonesPaginador(paso); // Agrega o quita los botones del paginador
    actualizarTabActual(paso);
    paginaSiguiente();
    paginaAnterior();
    consultarAPI(); // Consultar la API en el backend de PHP

    idCliente();
    nombreCliente(); // Añade el nombre del cliente al objeto de cita
    seleccionarFecha(); // Añade la fecha de la cita en el objeto
    seleccionarHora(); // Añade la hora de la cita en el objeto
    mostrarResumen(); // Muestra el resumen de la cita
}

function mostrarSeccion(paso){
    // Ocultar la sección que tenga la clase de mostrar
    const seccionAnterior=document.querySelector(".mostrar");
    if(seccionAnterior){
        seccionAnterior.classList.remove("mostrar");
    }

    // Seleccionar la sección con el paso
    const pasoSelector=`#paso-${paso}`;
    const seccion=document.querySelector(pasoSelector);
    seccion.classList.add("mostrar");
}

function actualizarTabActual(paso) {
    const tabAnterior = document.querySelector(".tabs .actual");
    if (tabAnterior) {
        tabAnterior.classList.remove("actual");
    }

    const tabActual = document.querySelector(`[data-paso="${paso}"]`);
    if (tabActual) {
        tabActual.classList.add("actual");
    }
}


function tabs(){
    const botones=document.querySelectorAll(".tabs button");

    botones.forEach( boton=>{
        boton.addEventListener("click", function(e){
            const paso=parseInt(e.target.dataset.paso);
            mostrarSeccion(paso);
            botonesPaginador(paso);
            actualizarTabActual(paso);
        })
    })
}

function botonesPaginador(paso){
    const paginaAnterior=document.querySelector("#anterior");
    const paginaSiguiente=document.querySelector("#siguiente");
    // Mostrar ambos por defecto
    paginaAnterior.classList.remove("ocultar");
    paginaSiguiente.classList.remove("ocultar");

    paginaAnterior.classList.toggle("ocultar", paso === 1);
    paginaSiguiente.classList.toggle("ocultar", paso === TOTAL_PASOS);
    if(paso===TOTAL_PASOS){
        mostrarResumen();
    }
}

function paginaAnterior(){
    const btnAnterior = document.querySelector("#anterior");

    btnAnterior.addEventListener("click", function(){
        if (paso <= pasoInicial) return;

        paso--;
        mostrarSeccion(paso);
        botonesPaginador(paso);
        actualizarTabActual(paso);
    });
}

function paginaSiguiente(){
    const btnSiguiente = document.querySelector("#siguiente");

    btnSiguiente.addEventListener("click", function(){
        if (paso >= TOTAL_PASOS) return;

        paso++;
        mostrarSeccion(paso);
        botonesPaginador(paso);
        actualizarTabActual(paso);
    });
}

async function consultarAPI(){
    try {
        const url="/api/servicios";
        const resultado=await fetch(url);
        const servicios=await resultado.json();
        mostrarServicios(servicios);
    } catch (error) {
        console.log(error);
    }
}

function mostrarServicios(servicios){
    servicios.forEach(servicio=>{
        const {id,nombre,precio}=servicio;

        const nombreServicio=document.createElement("P");
        nombreServicio.classList.add("nombre-servicio");
        nombreServicio.textContent=nombre;

        const precioServicio=document.createElement("P");
        precioServicio.classList.add("precio-servicio");
        precioServicio.textContent=`$${precio}`;

        const servicioDiv=document.createElement("DIV");
        servicioDiv.classList.add("servicio");
        servicioDiv.dataset.idServicio=id;
        servicioDiv.onclick=function(){
            selecionarServicio(servicio);
        }

        servicioDiv.appendChild(nombreServicio);
        servicioDiv.appendChild(precioServicio);

        document.querySelector("#servicios").appendChild(servicioDiv);
    });
}

function selecionarServicio(servicio){
    const {id}=servicio;
    const {servicios}=cita;
    // Identificar al elemento al que se le da click
    const divServicio=document.querySelector(`[data-id-servicio="${id}"]`);
    // Comprobar si un servicio ya fue agregado
    if(servicios.some(agregado=>agregado.id===id)){
        // Eliminarlo
        cita.servicios=servicios.filter(agregado=>agregado.id!==id);
        divServicio.classList.remove("seleccionado");
    }else{
        // Agregarlo
        cita.servicios=[...servicios,servicio];
        divServicio.classList.add("seleccionado");
    }
}

function idCliente(){
    cita.id=document.querySelector("#id").value;
}

function nombreCliente(){
    cita.nombre=document.querySelector("#nombre").value;
}

function seleccionarFecha(){
    const inputFecha = document.querySelector("#fecha");
    inputFecha.addEventListener("input",function(e){
        const dia=new Date(e.target.value).getUTCDay();
        if([6,0].includes(dia)){
            e.target.value="";
            mostrarAlerta("Fines de semana no permitidos","error",".formulario");
        }else{
            cita.fecha=e.target.value;
        }
    });
}

function seleccionarHora(){
    const inputHora=document.querySelector("#hora");
    inputHora.addEventListener("input",function(e){
        const horaCita=e.target.value;
        const hora=horaCita.split(":")[0];
        if(hora<10 || hora>18){
            e.target.value="";
            mostrarAlerta("Hora no Válida","error",".formulario");
        }else{
            cita.hora=e.target.value;
        }
    });
}

function mostrarAlerta(mensaje,tipo,elemento,desaparece=true){
    //Previene que se genere mas de una alerta
    const alertaPrevia=document.querySelector(".alerta");
    if(alertaPrevia){
        alertaPrevia.remove();
    }
    // Scripting para generar la alerta
    const alerta=document.createElement("DIV");
    alerta.textContent=mensaje;
    alerta.classList.add("alerta");
    alerta.classList.add(tipo);

    const referencia=document.querySelector(elemento);
    referencia.appendChild(alerta);
    if(desaparece){
        // Eliminar la alerta
        setTimeout(() => {
            alerta.remove();
        }, 3000);
    }

}

function mostrarResumen(){
    const resumen=document.querySelector(".contenido-resumen");

    // Limpiar el Contenido de Resumen
    while(resumen.firstChild){
        resumen.removeChild(resumen.firstChild);
    }

    if(Object.values(cita).includes("") || cita.servicios.length===0){
        mostrarAlerta("Faltan datos de Servicios, Fecha u Hora", "error", ".contenido-resumen",false);
        return;
    }

    // Formatear el div de resumen
    const {nombre,fecha,hora,servicios}=cita;

    // Heading para Servicios en Resumen
    const headingServicios=document.createElement("H3");
    headingServicios.textContent="Resumen de Servicios";
    resumen.appendChild(headingServicios);

    // Iterando y mostrando los servicios
    servicios.forEach(servicio=>{
        const {id,precio,nombre}=servicio;
        const contenedorServicio=document.createElement("DIV");
        contenedorServicio.classList.add("contenedor-servicio");

        const textoServicio=document.createElement("P");
        textoServicio.textContent=nombre;

        const precioServicio=document.createElement("P");
        precioServicio.innerHTML=`<span>Precio:</span>$${precio}`;

        contenedorServicio.appendChild(textoServicio);
        contenedorServicio.appendChild(precioServicio);

        resumen.appendChild(contenedorServicio);
    });

    // Heading para Cita en Resumen
    const headingCita=document.createElement("H3");
    headingCita.textContent="Resumen de Cita";
    resumen.appendChild(headingCita);

    const nombreCliente=document.createElement("P");
    nombreCliente.innerHTML=`<span>Nombre:</span>${nombre}`;

    // Formatear la fecha en español
    const fechaObj=new Date(fecha);
    const mes=fechaObj.getMonth();
    const dia=fechaObj.getDate()+2;
    const year=fechaObj.getFullYear();

    const fechaUTC=new Date(Date.UTC(year,mes,dia));

    const opciones={weekday:"long",year:"numeric",month:"long",day:"numeric"};
    const fechaFormateada=fechaUTC.toLocaleDateString("es-ES",opciones);

    const fechaCita=document.createElement("P");
    fechaCita.innerHTML=`<span>Fecha:</span>${fechaFormateada}`;

    const horaCita=document.createElement("P");
    horaCita.innerHTML=`<span>Hora:</span>${hora} Horas`;

    // Boton pra Crear una cita
    const botonReservar=document.createElement("BUTTON");
    botonReservar.classList.add("boton");
    botonReservar.textContent="Reservar Cita";
    botonReservar.onclick=reservarCita;

    resumen.appendChild(nombreCliente);
    resumen.appendChild(fechaCita);
    resumen.appendChild(horaCita);

    resumen.appendChild(botonReservar);
}

async function reservarCita(){
    const {nombre,fecha,hora,servicios,id}=cita;
    const idServicios=servicios.map(servicio=>servicio.id);
    const datos=new FormData();
    
    datos.append("fecha",fecha);
    datos.append("hora",hora);
    datos.append("usuarioID",id);
    datos.append("servicios",idServicios);

    try {
        // Petición hacia la api
        const url="/api/citas";

        const respuesta=await fetch(url,{
            method:"POST",
            body: datos
        });
        const respuestaJson=await respuesta.json();

        if(respuestaJson.resultado){
            Swal.fire({
                icon: "success",
                title: "Cita Creada",
                text: "Tu cita fue creada correctamente",
                button: "OK"
            }).then(()=>{
                setTimeout(() => {
                    window.location.reload();
                }, 3000);
            });
    }
    } catch (error) {
        Swal.fire({
            icon: "error",
            title: "Error",
            text: "Hubo un error al guardar la cita"
        });
    }


}


