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
