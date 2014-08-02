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
		Insertar Link a Nuevo Exámen\
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