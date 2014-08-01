// ==UserScript==
// @name        Mejoras Editor Wiki Fiuba
// @namespace   http://localhost
// @description Importación automatica de templates, asistente de links a páginas nuevas
// @include     http://wiki.foros-fiuba.com.ar/*
// @version     0.2
// @grant       GM_addStyle
// @require     nombres_materias.js
// ==/UserScript==

var parseDate = function(str){
	myRegex = /(\d+)\/(\d+)\/(\d+)/ig;
	matches = myRegex.exec(str);
	
	return new Date(matches[3], matches[2]-1, matches[1]);
}

var getUrlData = function(){
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
		// Valores por default
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

var printFecha = function(date){
	// Devuelve un string con la fecha como la escribimos nosotros: dd/mm/aaaa
	
	var str = (date.getDate()<10?"0":"") + date.getDate() + '/' + ((date.getMonth()+1)<10?"0":"")+String(date.getMonth()+1) + '/' + date.getFullYear();
	return str;
}

var printCardinal = function(x){
console.log("printCardinal: "+x);
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
console.log("printTemplate");
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

var addCSS = function() {
	console.log("Entrando a función addCSS()");
	
	GM_addStyle('\
.myWindow label{\
	width: 100px;\
	display: block;\
	float:left;\
	padding:2px;\
	margin:2px;\
	cursor:pointer;\
	text-align: left;\
}\
\
.myWindow form{\
	display:block;\
	padding:2px;\
}\
\
.myWindow fieldset{\
	display: block;\
}\
\
.formPair{\
	overflow:auto;\
}\
\
.myWindow input[type=text], select{\
	width:180px;\
	display:block;\
	float: none;\
}\
\
.myWindow{\
	z-index: 100001;\
	position:absolute;\
	display:block;\
	z-index:99;\
	width:300px;\
	height:250px;\
	padding:0;\
	margin:0;\
	border:1px solid #8cacbb;\
	background-color:#f5f5f5;\
	text-align:center;\
}\
\
.myWindow_content{\
	display:block;\
	background-color:#f5f5f5;\
	text-align:center;\
}\
\
.myWindow_header{\
	background-color:#dee7ec;\
	height:16px;\
	margin-bottom:5px;\
}\
\
.myWindow_close{\
	cursor:pointer;\
	margin:0;\
}\
\
\
.myWindow_fondo{\
	display:block;\
	z-index: 100000;\
	position: absolute;\
	height: 300%;\
	width: 100%;\
	top: 0px;\
	left: 0px;\
	background-color:#101010;\
	opacity: 0.7;\
}\
	');
	
	console.log("Saliendo de función addCSS()");
}

var templateWiz = {
	data: null
};

templateWiz.injectTemplateForm = function(){
	console.log("Entrando a función injectTemplateForm()");

	var my_div = document.createElement('div');
	my_div.innerHTML = '\
<div id="templateWiz_fondo">\
   <div class="myWindow_fondo"></div>\
   <div id="templateWiz" class="dokuwiki picker myWindow" style="top: 113px; left: 275px; margin-left: 0px; margin-top: 0px; position: absolute; width: auto; height:auto; z-index:9999999">\
      <div class="myWindow_header" id="templateWiz_header">\
        <img src="/lib/images/close.png" alt="" class="myWindow_close" id="templateWiz_close" height="16" align="right" width="16"/>\
		Insertar plantilla de examen\
	  </div>\
      <div id="templateWiz_addTemplateDiv" class="myWindow_content">\
        <form id="templateWiz_addTemplateForm" method="post" action="">\
        <fieldset>\
          <legend>Datos del Examen</legend>\
          <div class="formPair">\
          <label for="templateWiz_examen">Tipo</label> \
          <select name="templateWiz_examen" id="templateWiz_examen" value="1">\
            <option value="1">Final</option>\
            <option value="2">Parcial</option>\
            <option value="3">Parcialito</option>\
            <option value="0">Otro (especificar)</option>\
          </select></div>\
          <div id="templateWiz_examen2Container" class="formPair" style="display:none">\
          <label for="templateWiz_examen2">Especifique</label> \
          <input name="templateWiz_examen2" type="text" id="templateWiz_examen2" value="Especifique tipo de examen" /></div>\
          <div class="formPair">\
          <label for="templateWiz_fecha">Fecha</label> \
          <input name="templateWiz_fecha" type="text" id="templateWiz_fecha" value="dd/mm/aaaa" /></div>\
          <div class="formPair">\
          <label for="templateWiz_oportunidad">Oportunidad</label> \
          <input type="text" name="templateWiz_oportunidad" id="templateWiz_oportunidad" value="1" /></div>\
		  <div class="formPair">\
          <label for="templateWiz_tema">Tema</label> \
          <input type="text" name="templateWiz_tema" id="templateWiz_tema" value="1" /></div>\
        </fieldset>\
        <fieldset>\
          <legend>Datos de la Materia</legend>\
          <div class="formPair">\
          <label for="templateWiz_codigo">Código</label> \
          <input type="text" name="templateWiz_codigo" id="templateWiz_codigo" value="XX.XX" /></div>\
          <div class="formPair">\
          <label for="templateWiz_nombreMateria">Nombre</label> \
          <input type="text" name="templateWiz_nombreMateria" id="templateWiz_nombreMateria" /></div>\
          <div class="formPair">\
          <label for="templateWiz_catedra">Cátedra</label> \
          <input type="text" name="templateWiz_catedra" id="templateWiz_catedra" value="Todas" /></div>\
        </fieldset>\
        <input type="button" class="button" value="Insertar Plantilla" id="templateWiz_submit" /> \
		<input type="button" class="button" value="Cancelar" id="templateWiz_cancel" /> \
      </div>\
    </div>\
</div>\
	';
	document.body.appendChild(my_div);
	
	//Campo "Especifique" que aparece solo cuando se selecciona "Otros" en la lista desplegable
	document.getElementById('templateWiz_examen').addEventListener('change',templateWiz.refreshDisplay, false);
	templateWiz.refreshDisplay(); //Ejecuto esto para que se configure
	
	//Funcionalidad del botón X para cerrar
	document.getElementById('templateWiz_close').addEventListener('click', templateWiz.close, false);
	
	//Funcionalidad de los botones
	document.getElementById('templateWiz_submit').addEventListener('click', templateWiz.submit, false);
	document.getElementById('templateWiz_cancel').addEventListener('click', templateWiz.close, false);
	
	console.log("Saliendo de función injectTemplateForm()");
	return my_div;
}

templateWiz.refreshDisplay = function(){
	document.getElementById('templateWiz_examen2Container').style.display=(document.getElementById("templateWiz_examen").value==0)?'block':'none';
}

templateWiz.close = function(){
	document.getElementById("templateWiz_fondo").style.display="none";
	console.log("cerrado");
}

templateWiz.open = function(){
	document.getElementById("templateWiz_fondo").style.display="block";
}

templateWiz.start = function(){
	if (!document.getElementById("templateWiz"))
		// Si no se inyectó el HTML, lo hago ahora
		templateWiz.injectTemplateForm();
	
	if(!templateWiz.data){
		templateWiz.data = getUrlData();
	}
	
	//Defino este coso
	var $ = function(str){ //Ay, soy re cabeza :P
		return document.getElementById(str);
	}
	
	// Configuro cada campo
	var indice = ["final","parcial","parcialito"].indexOf(templateWiz.data.tipoExamen)+1; //salvo el tema del -1
	$("templateWiz_examen").value = indice;
	$("templateWiz_examen2").value = templateWiz.data.tipoExamen;
	

	var noUndefined = function(x){
		return (x)?x:"";
	}
	
	
	$("templateWiz_fecha").value = printFecha(templateWiz.data.fecha);
	$("templateWiz_oportunidad").value = templateWiz.data.nroOportunidad;
	$("templateWiz_tema").value = noUndefined(templateWiz.data.tema);
	$("templateWiz_codigo").value = noUndefined(templateWiz.data.codigoMateria);
	$("templateWiz_nombreMateria").value = noUndefined(templateWiz.data.nombreMateria);
	$("templateWiz_catedra").value = noUndefined(templateWiz.data.catedra);
	
	templateWiz.refreshDisplay();
	templateWiz.open();	
}

templateWiz.submit = function(){
	console.log("submit");
	//Acá pasa todo
	
	var $ = function(str){
		return document.getElementById(str);
	}
	
	//Recuperamos los valores que el usuario ingresó
	if( $("templateWiz_examen").value === 0){
		templateWiz.data.tipoExamen=$("templateWiz_examen2").value;
	}else{
		var tipos_examen = ["final","parcial","parcialito"];
		templateWiz.data.tipoExamen=tipos_examen[$("templateWiz_examen").value-1];
	}
	
	templateWiz.data.fecha = parseDate($("templateWiz_fecha").value);
	templateWiz.data.nroOportunidad=parseInt($("templateWiz_oportunidad").value);
	templateWiz.data.tema=$("templateWiz_tema").value;
	templateWiz.data.codigoMateria=$("templateWiz_codigo").value;
	templateWiz.data.nombreMateria=$("templateWiz_nombreMateria").value;
	templateWiz.data.catedra=$("templateWiz_catedra").value;
	
	console.log(printTemplate(templateWiz.data));
	
	//Imprimimos
	$("wiki__text").value = printTemplate(templateWiz.data) + "\n" + $("wiki__text").value;
	console.log("Teminamos de imprimir");
	
	//Salimos
	templateWiz.close();
}

/////////////////////////////////////////////////////
main = function(){
	alert('hola');
	console.log("main() Mejoras_Editor_Wiki_Fiuba");
	
	if(!isEditPage())
		return; // :(
	
	console.log("Es una página de edición");
	//Agrego estilos CSS
	addCSS();
	
    //Agrego el botón para el asistente de links a páginas nuevas
    var my_btn = document.createElement("input"); //usar button, clase toolbutton y una imagen en lugar de texto
	my_btn.type="button";
	my_btn.className="button";
    my_btn.onclick = function (){alert ('Soon, my dear :)')};//newPageWiz.open;
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
console.log("Script Wiki corriendo");