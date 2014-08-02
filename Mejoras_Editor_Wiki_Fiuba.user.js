// ==UserScript==
// @name        Mejoras Editor Wiki Fiuba
// @namespace   http://localhost
// @description Importación automatica de templates, asistente de links a páginas nuevas
// @include     http://wiki.foros-fiuba.com.ar/*
// @version     1.1
// @grant       GM_addStyle
// @grant       GM_openInTab
// @require     nombres_materias.js
// @require     addCSS.js
// @require     templateWiz.js
// @require     linkWiz.js
// ==/UserScript==

// Modo de depuración
DEBUGMODE = true;
//////////

var addLog = function(str){
	return DEBUGMODE?console.log(str):0;
}

var parseDate = function(str){
	myRegex = /(\d+)\/(\d+)\/(\d+)/ig;
	matches = myRegex.exec(str);
	
	if (matches)
		return new Date(matches[3], matches[2]-1, matches[1]);
	else
		return new Date();
}

var getUrlData = function(){
	// Veo si estoy en una página de parcial / final
	var data = document.URL;
	var urlRegEx = /(?:http:\/\/wiki\.foros\-fiuba\.com\.ar\/materias):(\d+):(\d+):(final|parcial|parcialito)_([0-9]{4})([0-9]{2})([0-9]{2})_?(\d)?/ig;
	var match = urlRegEx.exec(data);
	

	
	if (match){
		return {
			"codigoMateria": ""+match[1]+"."+match[2],
			"tipoExamen": match[3].toLowerCase(),
			"fecha": new Date(match[4],+match[5]-1,match[6]),
			"nombreMateria": getNombreMateria(""+match[1]+"."+match[2]),
			"tema": match[7],
			"nroOportunidad": 1
		};
	}else{
		// Pruebo si estoy en una página de materia
		urlRegEx = /(?:http:\/\/wiki\.foros\-fiuba\.com\.ar\/materias):(\d+):(\d+)/ig;
		match = urlRegEx.exec(data);
		
		if (match){
			return {
				"codigoMateria": ""+match[1]+"."+match[2],
				"tipoExamen": "",
				"fecha": null,
				"nombreMateria": getNombreMateria(""+match[1]+"."+match[2]),
				"tema": "",
				"nroOportunidad": 1 //Ver el tema de esto. Mejorar
			};
		}else{
			// Ni idea de nada			
			return {
				"codigoMateria": "XX.XX",
				"tipoExamen": "final",
				"fecha": new Date(),
				"nombreMateria": "*Nombre de la materia*",
				"tema": "",
				"nroOportunidad": 1
			};
		}
	}	
}

var printFecha = function(date){
	// Devuelve un string con la fecha como la escribimos nosotros: dd/mm/aaaa
	
	var str = (date.getDate()<10?"0":"") + date.getDate() + '/' + ((date.getMonth()+1)<10?"0":"")+String(date.getMonth()+1) + '/' + date.getFullYear();
	return str;
}

var printCardinal = function(x){
addLog("printCardinal: "+x);
	// Devuelve un string con "primera", "segunda", etc en lugar de 1, 2, etc.
	x=parseInt(x);
	
	x=Math.round(x);
	
	var cardinales = ["Primera","Segunda","Tercer","Cuarta","Quinta", "Sexta", "Séptima"];
	if (x > 0 && x <= 7){
		return cardinales[x-1];
	}else
		return x+"º";
}

var getPeriodo = function(data){
	// Devuelve [1º Cuatrimestre|2º Cuatrimestre|Verano|Invierno] segun corresponda
	if (!data) return;
	
	switch(data.tipoExamen){
		case "final":
			if (data.fecha.getMonth()<3 || data.fecha.getMonth()>10){
				//De noviembre a diciembre y de enero a marzo es verano
				return "Verano";
			}else{
				return "Invierno";
			}
			break;
		case "parcial":
			if (data.fecha.getMonth()<6)
				return "1º Cuatrimestre";
			else
				return "2º Cuatrimestre";
			break;
		
	}
	// Algo raro, no digo nada
	return "[1º Cuatrimestre|2º Cuatrimestre|Verano|Invierno]";
}


var printTemplate = function(data){
addLog("printTemplate");
	//Reemplaza los campos del template con la información de data
	var template = "====== Examen TIPO_EXAMEN - CODIGO_MATERIA. NOMBRE_MATERIA - FECHA ======\n\n**Cátedra:** CATEDRA\\\\ \n**Fecha:** NRO_OPORTUNIDAD Oportunidad - PERIODO AÑO\\\\ \n**Día:** FECHA\n\n<note important>\nEsta página está incompleta; podés ayudar completando el material.\n</note>\n\n===== Enunciado =====\n\n<!-- ==== Punto I ==== ... -->\n\n===== Resolución =====\n\n<!-- ==== Punto I ==== ... -->\n\n===== Discusión =====\n\n<note warning>\nSi ves algo que te parece incorrecto en la resolución y no te animás a cambiarlo, dejá tu comentario acá.\n</note>"
	
	var reemplazos=new Array();
	reemplazos["TIPO_EXAMEN"]=data.tipoExamen;
	reemplazos["CODIGO_MATERIA"]=data.codigoMateria;
	reemplazos["NOMBRE_MATERIA"]=data.nombreMateria;
	reemplazos["FECHA"]=printFecha(data.fecha);
	reemplazos["CATEDRA"]=data.catedra;
	reemplazos["NRO_OPORTUNIDAD"]=printCardinal(data.nroOportunidad);
	
	reemplazos["PERIODO"]=getPeriodo(data);
	reemplazos["AÑO"]=data.fecha.getFullYear();
	reemplazos["TEMA"]=data.tema; //El tema no está contemplado en el template.
	
	for (var i in reemplazos){
		template = template.replace(eval("/"+i+"/g"),reemplazos[i]);
	}

	return template;
}


// Inyección de HTML y eso

var isEditPage = function(){
	//Verifica si estoy en modo de edición, y por ende, si hay que correr este script.
    return Boolean(document.getElementById("tool__bar"));
}

var isNewPage = function(){
	// Verifica si es una pagina que no existe aún
	return Boolean(document.getElementById("este_tema_no_existe_todavia"));
}

/////////////////////////////////////////////////////
main = function(){
	addLog("main() Mejoras_Editor_Wiki_Fiuba");
	
	if(!isEditPage()){
		if (isNewPage()){
			//Veamos si tengo que auto-crearla
			if(document.URL.indexOf("autocreate=1")==-1)
				return; //:(
			
			//Sí, tengo que crear la página
			if(document.getElementsByClassName("button btn_create")[0])
				document.getElementsByClassName("button btn_create")[0].submit();
		}
	}
	
	addLog("Es una página de edición");
	//Agrego estilos CSS
	addCSS();
	
    //Agrego el botón para el asistente de links a páginas nuevas
    var my_btn = document.createElement("input"); //usar button, clase toolbutton y una imagen en lugar de texto
	my_btn.type="button";
	my_btn.className="button";
    my_btn.onclick = linkWiz.start;//newPageWiz.open;
    my_btn.value="Link a página nueva";
    document.getElementById("tool__bar").appendChild(my_btn);
	
	//Agrego los links al editor de templates
	var my_btn = document.createElement("input"); //usar button, clase toolbutton y una imagen en lugar de texto
	my_btn.type="button";
	my_btn.className="button";
    my_btn.onclick = templateWiz.start;
    my_btn.value="Asistente de Plantillas para exámenes";
    document.getElementById("tool__bar").appendChild(my_btn);
}

window.addEventListener('load', main);
addLog("Script Wiki corriendo");