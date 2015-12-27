// ==UserScript==
// @name        Mejoras Editor Wiki Fiuba
// @namespace   http://localhost
// @description Importación automatica de templates, asistente de links a páginas nuevas
// @include     http://wiki.foros-fiuba.com.ar/*
// @version     1.101
// @grant       GM_addStyle
// @grant       GM_openInTab
// ==/UserScript==

// Modo de depuración
DEBUGMODE = false;
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



/****** Otras funciones ******/
var addCSS = function() {
	addLog("Entrando a función addCSS()");
	
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
	
	addLog("Saliendo de función addCSS()");
}


// Linkwiz
var linkWiz = {
	data: null
};

linkWiz.injectLinkForm = function(){
	addLog("Entrando a función injectLinkForm()");

	var my_div = document.createElement('div');
	my_div.innerHTML = '\
<div id="linkWiz_fondo">\
   <div class="myWindow_fondo"></div>\
   <div id="linkWiz" class="dokuwiki picker myWindow" style="top: 113px; left: 275px; margin-left: 0px; margin-top: 0px; position: absolute; width: auto; height:auto; z-index:9999999">\
      <div class="myWindow_header" id="linkWiz_header">\
        <img src="/lib/images/close.png" alt="" class="myWindow_close" id="linkWiz_close" height="16" align="right" width="16"/>\
		Insertar link a nuevo Exámen\
	  </div>\
      <div id="linkWiz_addTemplateDiv" class="myWindow_content">\
        <form id="linkWiz_addTemplateForm" method="post" action="">\
        <fieldset>\
          <legend>Datos del Examen</legend>\
          <div class="formPair">\
          <label for="linkWiz_examen">Tipo</label> \
          <select name="linkWiz_examen" id="linkWiz_examen" value="1">\
            <option value="1">Final</option>\
            <option value="2">Parcial</option>\
            <option value="3">Parcialito</option>\
            <option value="0">Otro (especificar)</option>\
          </select></div>\
          <div id="linkWiz_examen2Container" class="formPair" style="display:none">\
          <label for="linkWiz_examen2">Especifique</label> \
          <input name="linkWiz_examen2" type="text" id="linkWiz_examen2" value="Especifique tipo de examen" /></div>\
          <div class="formPair">\
          <label for="linkWiz_fecha">Fecha</label> \
          <input name="linkWiz_fecha" type="text" id="linkWiz_fecha" value="dd/mm/aaaa" /></div>\
		  <div class="formPair">\
          <label for="linkWiz_tema">Tema</label> \
          <input type="text" name="linkWiz_tema" id="linkWiz_tema" value="1" /></div>\
        </fieldset>\
        <fieldset>\
          <legend>Datos de la Materia</legend>\
          <div class="formPair">\
          <label for="linkWiz_codigo">Código</label> \
          <input type="text" name="linkWiz_codigo" id="linkWiz_codigo" value="XX.XX" /></div>\
        </fieldset>\
		<div class="formPair">\
          <label for="linkWiz_open">Abrir link</label> \
          <input type="checkbox" name="linkWiz_open" id="linkWiz_open" checked/></div>\
        <input type="button" class="button" value="Insertar Link" id="linkWiz_submit" /> \
		<input type="button" class="button" value="Cancelar" id="linkWiz_cancel" /> \
      </div>\
    </div>\
</div>\
	';
	document.body.appendChild(my_div);
	
	//Campo "Especifique" que aparece solo cuando se selecciona "Otros" en la lista desplegable
	document.getElementById('linkWiz_examen').addEventListener('change',linkWiz.refreshDisplay, false);
	linkWiz.refreshDisplay(); //Ejecuto esto para que se configure
	
	//Funcionalidad del botón X para cerrar
	document.getElementById('linkWiz_close').addEventListener('click', linkWiz.close, false);
	
	//Funcionalidad de los botones
	document.getElementById('linkWiz_submit').addEventListener('click', linkWiz.submit, false);
	document.getElementById('linkWiz_cancel').addEventListener('click', linkWiz.close, false);
	
	addLog("Saliendo de función injectLinkForm()");
	return my_div;
}

linkWiz.refreshDisplay = function(){
	document.getElementById('linkWiz_examen2Container').style.display=(+document.getElementById("linkWiz_examen").value==0)?'block':'none';
	document.getElementById('linkWiz_examen2').value="**Especifique**";
}

linkWiz.close = function(){
	document.getElementById("linkWiz_fondo").style.display="none";
	addLog("cerrado");
}

linkWiz.open = function(){
	document.getElementById("linkWiz_fecha").value="dd/mm/aaaa";
	document.getElementById("linkWiz_fondo").style.display="block";
	document.getElementById("linkWiz_fecha").focus();
}

linkWiz.start = function(){
	if (!document.getElementById("linkWiz"))
		// Si no se inyectó el HTML, lo hago ahora
		linkWiz.injectLinkForm();
	
	if(!linkWiz.data){
		linkWiz.data = getUrlData();
	}
	
	//Defino este coso
	var $ = function(str){ //Ay, soy re cabeza :P
		return document.getElementById(str);
	}
	
	// Configuro cada campo
	
	var noUndefined = function(x){
		return (x)?x:"";
	}
	
	
	$("linkWiz_codigo").value = noUndefined(linkWiz.data.codigoMateria);
	
	linkWiz.refreshDisplay();
	linkWiz.open();	
}

linkWiz.submit = function(){
	addLog("submit lnkWiz");
	//Acá pasa todo
	
	var $ = function(str){
		return document.getElementById(str);
	}
	
	//Recuperamos los valores que el usuario ingresó
	var tipos_examen = ["Final","Parcial","Parcialito"];
	
	if( +$("linkWiz_examen").value == 0){
		linkWiz.data.tipoExamen=$("linkWiz_examen2").value;
	}else{
		linkWiz.data.tipoExamen=tipos_examen[+$("linkWiz_examen").value-1];
	}
	
	linkWiz.data.fecha = parseDate($("linkWiz_fecha").value);
	linkWiz.data.codigoMateria=$("linkWiz_codigo").value;
	
	//Parseo el tema
	linkWiz.data.tema = ($("linkWiz_tema").value==="")?"1":$("linkWiz_tema").value;
	
	var date = linkWiz.data.fecha;
	var fecha_str = ""+date.getFullYear() + "" + ((date.getMonth()+1)<10?"0":"")+String(date.getMonth()+1) + "" +(date.getDate()<10?"0":"") + date.getDate();
	
	var myRegEx_codigo = /(\d+).(\d+)/ig;
	var match = myRegEx_codigo.exec(linkWiz.data.codigoMateria);
	if(match){
		var numero_materia = match[2];
	}else{
		linkWiz.close();
		alert('Error');
		return 0;
	}
	console.log(numero_materia);
	
	var text="[[."+numero_materia+":"+linkWiz.data.tipoExamen.toLowerCase()+"_"+fecha_str+"_"+linkWiz.data.tema+"|"+linkWiz.data.tipoExamen+" del "+printFecha(linkWiz.data.fecha)+", Tema "+linkWiz.data.tema+"]]";
	console.log(text);
	//Imprimimos
	unsafeWindow.pasteText(unsafeWindow.getSelection($("wiki__text")), text, 0);
	
	addLog("Teminamos de imprimir");
	
	//Salimos
	linkWiz.close();
	if($("linkWiz_open").checked)
		GM_openInTab(document.URL+":"+linkWiz.data.tipoExamen.toLowerCase()+"_"+fecha_str+"_"+linkWiz.data.tema+"?autocreate=1");
}


//TemplateWiz
var templateWiz = {
	data: null
};

templateWiz.injectTemplateForm = function(){
	addLog("Entrando a función injectTemplateForm()");

	var my_div = document.createElement('div');
	my_div.innerHTML = '\
<div id="templateWiz_fondo">\
   <div class="myWindow_fondo"></div>\
   <div id="templateWiz" class="dokuwiki picker myWindow" style="top: 113px; left: 275px; margin-left: 0px; margin-top: 0px; position: absolute; width: auto; height:auto; z-index:9999999">\
      <div class="myWindow_header" id="templateWiz_header">\
        <img src="/lib/images/close.png" alt="" class="myWindow_close" id="templateWiz_close" height="16" align="right" width="16"/>\
		Insertar plantilla de Exámen\
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
	
	addLog("Saliendo de función injectTemplateForm()");
	return my_div;
}

templateWiz.refreshDisplay = function(){
	document.getElementById('templateWiz_examen2Container').style.display=(+document.getElementById("templateWiz_examen").value==0)?'block':'none';
	document.getElementById('templateWiz_examen2').value="**Especifique**";
}

templateWiz.close = function(){
	document.getElementById("templateWiz_fondo").style.display="none";
	addLog("cerrado");
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
	addLog("submit");
	//Acá pasa todo
	
	var $ = function(str){
		return document.getElementById(str);
	}
	
	//Recuperamos los valores que el usuario ingresó
	if( +$("templateWiz_examen").value == 0){
		templateWiz.data.tipoExamen=$("templateWiz_examen2").value;
	}else{
		var tipos_examen = ["final","parcial","parcialito"];
		templateWiz.data.tipoExamen=tipos_examen[+$("templateWiz_examen").value-1];
	}
	
	templateWiz.data.fecha = parseDate($("templateWiz_fecha").value);
	templateWiz.data.nroOportunidad=parseInt($("templateWiz_oportunidad").value);
	templateWiz.data.tema=$("templateWiz_tema").value;
	templateWiz.data.codigoMateria=$("templateWiz_codigo").value;
	templateWiz.data.nombreMateria=$("templateWiz_nombreMateria").value;
	templateWiz.data.catedra=$("templateWiz_catedra").value;
	
	addLog(printTemplate(templateWiz.data));
	
	//Imprimimos
	$("wiki__text").value = printTemplate(templateWiz.data) + "\n" + $("wiki__text").value;
	addLog("Teminamos de imprimir");
	
	//Salimos
	templateWiz.close();
}


// Nombres materias

var getNombreMateria = function(codigo){
	var materias = {
		'70.07':'Cálculo de Compensación',
		'70.18':'Catastro y Valuaciones',
		'70.31':'Información Rural',
		'75.00':'Tesis de Grado en Ingenieria Informática',
		'75.01':'Computación',
		'75.02':'Algoritmos y Programación I',
		'75.03':'Organización del Computador',
		'75.04':'Algoritmos y Programación II',
		'75.06':'Organización de Datos',
		'75.07':'Algoritmos y Programación III',
		'75.08':'Sistemas Operativos',
		'75.10':'Técnicas de Diseño',
		'75.12':'Análisis Numérico I',
		'75.15':'Base de Datos',
		'75.18':'Proyectos Informáticos',
		'75.26':'Simulación',
		'75.29':'Teoría de Algoritmos I',
		'75.33':'Redes y Teleprocesamiento I',
		'75.38':'Análisis Numérico II',
		'75.40':'Algoritmos y Programación I',
		'75.41':'Algoritmos y Programación II',
		'75.42':'Taller de Programación I',
		'75.43':'Introducción a los Sistemas Distribuidos',
		'75.44':'Administración y Control de Proyectos Informáticos',
		'75.46':'Administración y Control de Proyectos Informáticos II',
		'75.47':'Taller de Desarrollo de Proyectos II',
		'75.48':'Calidad en el Desarrollo de Sistema',
		'75.50':'Introducción a los Sistemas Inteligentes',
		'75.51':'Técnicas de Producción de Software I',
		'75.52':'Taller de Programación 2',
		'75.53':'Técnicas de Producción de Software II',
		'75.54':'Técnicas de Producción de Software III',
		'75.58':'Evaluación de Proyectos y Manejo de Riesgos',
		'75.59':'Técnicas de Programación Concurrente I',
		'75.60':'Sistemas Distribuidos I',
		'75.61':'Taller de Programación III',
		'75.62':'Técnicas de Programación Concurrente II',
		'75.63':'Sistemas Distribuidos II',
		'75.65':'Manufactura Integrada por Computador I',
		'75.66':'Manufactura Integrada Por Computador II',
		'75.67':'Sistemas Automáticos de Diagnóstico y Detección de Fallas I',
		'75.68':'Sistemas de Soporte para Celdas de Produccion Flexible',
		'75.69':'Sistemas Automáticos de Diagostico y Deteccion de Fallas II',
		'75.70':'Sistemas de Programacion no Convencional de Robots',
		'75.73':'Arquitectura de Software',
		'75.74':'Sistemas Distribuidos',
		'74.01':'Hormigón I',
		'74.03':'Arquitectura y Planificación',
		'74.04':'Construcciones',
		'74.05':'Hormigón II',
		'74.07':'Instalaciones de Edificios',
		'74.08':'Presas',
		'74.09':'Maquinarias de la Construcción',
		'74.10':'Urbanismo',
		'74.11':'Cimentaciones',
		'74.12':'Estructuras Metálicas I',
		'74.13':'Estructuras Metálicas II',
		'74.14':'Tecnología del Hormigón',
		'74.15':'Patología de la Construcción',
		'74.16':'Estructuras de Madera',
		'74.17':'Sistemas Constructivos',
		'74.18':'Sistemas Estructurales',
		'74.19':'Diseño Estructural',
		'74.21':'Inspección y Ejecución de Estructuras de Hormigón',
		'74.99':'Trabajo Profesional de Ingeniería Civil',
		'66.00':'Tesis de Ingeniería Electrónica',
		'66.01':'Técnica Digital',
		'66.02':'Laboratorio',
		'66.03':'Electrónica General',
		'66.04':'Electrónica I',
		'66.05':'Electrónica II',
		'66.06':'Análisis de Circuitos',
		'66.08':'Circuitos Electrónicos I',
		'66.09':'Laboratorio de Microcomputadoras',
		'66.10':'Circuitos Electrónicos II',
		'66.12':'Introducción a Proyectos',
		'66.17':'Sistemas Digitales',
		'66.18':'Teoría de Control I',
		'66.19':'Circuitos de Pulsos',
		'66.20':'Organización de Computadoras',
		'66.21':'Comunicación de Datos',
		'66.24':'Teoría de la Información y Codificación',
		'66.25':'Dispositivos Semiconductores',
		'66.26':'Arquitecturas Paralelas',
		'66.27':'Electrónica de Potencia',
		'66.28':'Teoría de Control II',
		'66.29':'Control Industrial Distribuído',
		'66.30':'Control no lineal',
		'66.31':'Identificación y Control Adaptativo',
		'66.32':'Robótica',
		'66.33':'Laboratorio de Sistemas Digitales',
		'66.38':'Procesamiento de Señales I',
		'66.39':'Procesamiento de Señales II',
		'66.42':'Comunicaciones Digitales II',
		'66.43':'Ingeniería Biomédica',
		'66.44':'Instrumentos Electrónicos',
		'66.45':'Laboratorio de Mediciones',
		'66.46':'Reconocimiento del Habla',
		'66.47':'Procesamiento de Imágenes',
		'66.48':'Seminario de Ing. Electrónica I',
		'66.66':'Seminario de Ing. Electrónica II',
		'66.49':'Sistemas Biológicos',
		'66.50':'Tecnología de Componentes',
		'66.51':'Teoría de Detección y Estimación',
		'66.53':'Instrumentación y Control de Procesos',
		'66.55':'Simulación de Sistemas de Control',
		'66.56':'Control Óptimo',
		'66.57':'Optoelectrónica',
		'66.61':'Tecnología de Circuitos Integrados',
		'66.62':'Redes de Computadoras',
		'66.63':'Redes Neuronales',
		'66.64':'Control Robusto',
		'66.67':'Acústica',
		'66.68':'Electroacústica',
		'66.69':'Criptografía y Seguridad Informática',
		'66.70':'Estructuras del Computador',
		'66.71':'Sistemas Gráficos',
		'66.72':'Señales e Imágenes en Biomedicina',
		'66.73':'Instalaciónes e Instrumentación Biomédica',
		'66.74':'Señales y Sistemas',
		'66.75':'Procesos Estocásticos',
		'66.76':'Transmisión y Recepción de Comunicaciones',
		'66.77':'Sistemas de Comunicaciones',
		'66.78':'Comunicaciones Digitales y Analógicas',
		'66.79':'Laboratorio de Comunicaciones',
		'66.80':'Sistemas Inalámbricos',
		'66.81':'Televisión, Video y Redes de Cable',
		'66.82':'Propagación y Sistemas Irradiantes',
		'66.83':'Infraestructura de Redes',
		'66.99':'Trabajo Profesional de Ingeniería Electrónica',
		'65.03':'Electrotécnia General "A"',
		'65.05':'Electrotécnia General "C"',
		'65.09':'Teoría de Circuitos',
		'65.10':'Teoría de Campos',
		'65.11':'Tecnología de los materiales I',
		'65.12':'Tecnología de los materiales II',
		'65.17':'Centrales Eléctricas',
		'65.25':'Construcciones Electromecánicas',
		'65.28':'Control de Procesos Industriales',
		'65.30':'Electrotécnia General "D"',
		'65.33':'Economía de la Energía Eléctrica',
		'65.37':'Energías Renovables',
		'65.45':'Regulación de Servicios Públicos',
		'65.46':'Energía Eólica, Hidráulica y Marina',
		'65.48':'Ingeniería de las Instalaciones Eléctricas',
		'64.01':'Estabilidad I A',
		'64.02':'Estabilidad II A',
		'64.08':'Mecánica de Suelos',
		'64.10':'Estabilidad IV',
		'64.13':'Estabilidad IIIB',
		'64.18':'Dinámica de las Estructuras I',
		'64.19':'Dinámica de las Estructuras II',
		'62.01':'Física I',
		'62.03':'Física II',
		'62.05':'Física III "A"',
		'62.08':'Electromagnetismo "A"',
		'62.09':'Electromagnetismo "B"',
		'62.10':'Física del Estado Sólido',
		'62.11':'Mecanica Racional',
		'62.13':'Fisica III "C"',
		'62.15':'Física III "D"',
		'71.03':'Estadística Técnica',
		'71.05':'Organización Industrial II',
		'71.06':'Estructura Económica Argentina',
		'71.08':'Organización Industrial III',
		'71.14':'Modelos y Optimización I',
		'71.17':'Derecho Informático',
		'71.18':'Estructura Económica Argentina',
		'71.22':'Legislación y Ejercicio Profesional de la Ingeniería Industrial',
		'71.27':'Legislación y Ejercicio Profesional de la Ingeniería Electrónica',
		'71.31':'Organización de la Producción',
		'71.32':'Investigación Operativa Superior',
		'71.35':'Estadística Técnica Superior',
		'71.36':'Gestión de la Calidad',
		'71.40':'Legislación y Ejercicio Profesional de la Ingeniería Informática',
		'71.41':'Análisis y Resolución de Problemas',
		'71.50':'Ingeniería Económica I',
		'71.51':'Ingeniería Económica II',
		'71.53':'Evaluación de Proyectos de Plantas Quimicas',
		'71.58':'Análisis y Resolución de Problemas de Sistemas',
		'71.59':'Emprendimientos en Ingeniería',
		'69.02':'Ingenieria Sanitaria',
		'69.03':'Mecánica de los Fluidos "A"',
		'69.05':'Centrales Hidráulicas',
		'69.11':'Gestión Ambiental de los Recursos Hídricos',
		'78.01':'Idioma Inglés',
		'78.02':'Idioma Alemán',
		'78.03':'Idioma Francés',
		'78.04':'Idioma Italiano',
		'78.05':'Idioma Portugués',
		'67.03':'Medios de Representación',
		'67.11':'Mecanismos "A"',
		'67.12':'Mecanismos "B"',
		'67.13':'Conocimiento de Materiales I',
		'67.15':'Tecnología Mecánica I',
		'67.16':'Ensayos Industriales',
		'67.17':'Taller',
		'67.18':'Mecánica de Fluídos "B"',
		'67.19':'Máquinas Alternativas',
		'67.20':'Turbomáquinas',
		'67.21':'Mediciones Físicas y Mecánicas',
		'67.22':'Sistemas de Control',
		'67.23':'Conversión de Energía',
		'67.27':'Tecnología Mecánica II',
		'67.29':'Proyecto de Maquinas',
		'67.30':'Combustión',
		'67.31':'Transferencia de Calor y Masa',
		'67.32':'Tecnología del Frío',
		'67.37':'Máquinas Energéticas',
		'67.49':'Metalúrgica Física',
		'67.50':'Materiales Ferrosos y sus Aplicaciones',
		'67.51':'Máquinas Térmicas',
		'67.52':'Termodinamica "B"',
		'67.56':'Técnicas Energéticas',
		'67.58':'Introducción al Método de los Elementos Finitos',
		'67.59':'Introducción a la Mecánica del Continuo',
		'67.60':'Introducción al Análisis Tensorial',
		'73.01':'Arquitectura Naval I',
		'73.02':'Construcción Naval I',
		'73.03':'Arquitectura Naval II',
		'73.04':'Estructura de Buques',
		'73.05':'Introducción a Máquinas Marinas',
		'73.40':'Prácticas en Astilleros I',
		'73.06':'Vibraciones de Estructuras',
		'73.07':'Construcción Naval II',
		'73.09':'Proyecto de Buques I',
		'73.10':'Proyecto de Buques II',
		'73.11':'Máquinas Marinas I',
		'73.12':'Máquinas Marinas II',
		'73.41':'Prácticas en Astilleros II',
		'73.00':'Tesis de Ingeniería Naval',
		'73.99':'Trabajo Profesional de Ing. Naval y Mec',
		'73.14':'Navegación',
		'73.15':'Máquinas Marinas III',
		'73.16':'Construcción Naval III',
		'76.45':'Termodinámica de los Procesos',
		'76.46':'Introducción a la Ingeniería Química',
		'76.47':'Fenómenos de Transporte',
		'76.48':'Evaluación de Propiedades Físicas',
		'76.49':'Operaciones Unitarias de Transferencia de Cantidad de Movimiento y Energía',
		'76.52':'Operaciones Unitarias de Transferencia de Materia',
		'76.53':'Diseño de Reactores',
		'76.54':'Instalaciones de Plantas de Procesos',
		'76.55':'Microbiología Industrial',
		'76.56':'Instrumentación y Control de Plantas Químicas',
		'76.57':'Diseño de Procesos',
		'76.58':'Emisiones de Contaminantes Químicos y Biológicos',
		'76.59':'Trabajo Profesional de la Ing. Química I',
		'76.60':'Laboratorio de Operaciones y Procesos',
		'76.61':'Bioingeniería',
		'76.62':'Trabajo Profesional de la Ing. Química II',
		'76.16':'Electroquímica',
		'76.17':'Procesos Electroquímicos',
		'76.18':'Fisicoquímica Especial',
		'76.22':'Fundamentos de la Ing. de Reservorios',
		'76.23':'Recuperación Asistida de Petróleo',
		'76.24':'Fundamentos de la Simulación Numérica de Reservorios',
		'76.25':'Explotación de Yacimientos',
		'76.27':'Control Estadístico de Procesos',
		'76.28':'Gestión de Recursos en la Industria de Procesos',
		'76.29':'Industria de Procesos',
		'76.30':'Industrias Alimenticias',
		'76.51':'Introducción a la Planificación Interactiva',
		'76.63':'Diseño Avanzado de Reactores',
		'76.03':'Operaciones I',
		'76.04':'Operaciones Unitarias II',
		'76.05':'Operaciones Unitarias III',
		'76.08':'Ingeniería de las Reacciones Químicas',
		'76.12':'Microbiología Industrial',
		'76.40':'Introducción a la Bioquímica',
		'76.41':'Biotegnología',
		'76.42':'Ingeniería de las Instalaciones II B',
		'76.43':'Instrumentación y Control',
		'76.44':'Practica Profesional',
		'76.90':'Tesis de Grado de Ingeniería en Alimentos',
		'61.03':'Análisis Matemático II "A"',
		'61.04':'Análisis Matemático II "B"',
		'61.06':'Probabilidad y Estadistica "A"',
		'61.07':'Matemática Discreta',
		'61.08':'Algebra II "A"',
		'61.09':'Probabilidad y Estadistica "B"',
		'61.10':'Análisis Matemático III',
		'61.11':'Algebra II "B"',
		'61.12':'Análisis Matemático III "B"',
		'61.13':'Análisis Matemático III "C"',
		'61.14':'Matemática especial para Ingeniería Química',
		'61.15':'Matemática aplicada a la agrimensura',
		'61.16':'Matemática para Ingenieros',
		'61.17':'Teoría de Grafos',
		'61.18':'Ecuaciones Diferenciales Ordinarias',
		'61.19':'Análisis funcional',
		'63.01':'Química B',
		'63.02':'Química I',
		'63.04':'Química III',
		'63.05':'Química Analítica',
		'63.06':'Química Física I',
		'63.07':'Química Física II',
		'63.08':'Análisis Instrumental',
		'63.09':'Química Orgánica Especial',
		'63.10':'Termodinámica Estadística',
		'63.11':'Química Aplicada A',
		'63.13':'Química Inorgánica',
		'77.01':'Higiene y Seguridad en el Trabajo',
		'72.01':'Materiales Industriales I',
		'72.02':'Industrias I',
		'72.04':'Industrias de Procesos de Conformación',
		'72.06':'Automatización Industrial',
		'72.11':'Industrias Petroquímicas',
		'72.12':'Industrias Textiles',
		'72.13':'Materiales Industriales II',
		'72.14':'Diseño de Productos',
		'72.18':'Industrias II',
		'72.99':'Trabajo Profesional de Ingenieria Industrial',
		'68.01':'Construcción de Carreteras',
		'68.02':'Diseño y Operación de Caminos',
		'68.03':'Puertos y Vías Navegables',
		'68.04':'Ferrocarriles',
		'68.05':'Aeropuertos',
		'68.07':'Ingeniería del Transporte',
		'68.08':'Planeamiento del Transporte',
		'68.99':'Trabajo Profesional de Ingeniería Civil'
		};
		nombre = materias[codigo];
		
		return nombre?nombre:"*Nombre de la materia*";
}


