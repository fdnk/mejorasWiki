﻿var linkWiz = {
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
		Insertar plantilla de examen\
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