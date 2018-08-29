define([
	'dojo/_base/declare', 
	'dojo/_base/lang',
	'dojo/on',
	"dojo/dom-class",
	'jimu/BaseWidget',
	'./Splash',
	"esri/layers/ArcGISDynamicMapServiceLayer",
	'esri/tasks/QueryTask',
	'esri/tasks/query',
	'esri/request',
	'esri/symbols/SimpleMarkerSymbol',
	'esri/graphic',
	'esri/geometry/Point',
	'./ProxyManager',
	"esri/layers/GraphicsLayer",
	"./src/GridTool",
	"./src/RoutePkTool",
	"./src/RoutePkFromToTool",
	"./src/Promise",
	"esri/geometry/Polyline",
	"esri/symbols/SimpleLineSymbol",
	"esri/symbols/TextSymbol",
	"esri/Color"
	],
  function(
	declare,
	lang,
	on,
	domClass,
	BaseWidget,
	Splash,
	ArcGISDynamicMapServiceLayer,
	QueryTask,
	Query,
	esriRequest,
	SimpleMarkerSymbol,
	Graphic,
	Point,
	Proxy,
	GraphicsLayer,
	GridTool,
	RoutePkTool,
	RoutePkFromToTool,
	Promise,
	Polyline,
	SimpleLineSymbol,
	TextSymbol,
	Color
	) 
	{
    //To create a widget, you need to derive from BaseWidget.
    return declare([BaseWidget], {
      // Custom widget code goes here

	  baseClass: 'jimu-widget-pkwidget',

      //this property is set by the framework when widget is loaded.
      //name: 'CustomWidget',


      //methods to communication with app container:

      // postCreate: function() {
      //   this.inherited(arguments);
      //   console.log('postCreate');
      // },
	  
		startup: function() {
			this.inherited(arguments);

			//PROXY
			window.catalogProxy = new Proxy(this.config.proxy,this.config.prefixes);

			//SPLASH
			this.splash = new Splash(this.splashContainer,this.overlay);

			//TABS
			this.currentTab = this.tabGrid;
			this.currentPanel = this.panelGrid;
			on(this.tabGrid,"click",lang.hitch(this,function(event){
				this.switchPanel(this.tabGrid,this.panelGrid);
				this.activateDeactivate(this.gridTool);
			}));
			on(this.tabPoint,"click",lang.hitch(this,function(event){
				this.switchPanel(this.tabPoint,this.panelPoint);
				this.activateDeactivate(this.routePkTool);
			}));
			on(this.tabLine,"click",lang.hitch(this,function(event){
				this.switchPanel(this.tabLine,this.panelLine);
				this.activateDeactivate(this.routePkFromToTool);
			}));
			
			//Tools
			this.gridTool = new GridTool(this);
			this.routePkTool = new RoutePkTool(this);
			this.routePkFromToTool = new RoutePkFromToTool(this);
			this.activateDeactivate(this.gridTool);

			//Initialize Route
			this.initializeRouteName();

			//Graphics
			this.overGraphics = new GraphicsLayer();
		},

		switchPanel:function(tab,panel){
			if(this.currentTab===tab)return;

			domClass.remove(this.currentTab,"lighter");
			domClass.remove(this.currentTab,"darkest");
			domClass.add(this.currentTab,"darker");
			domClass.add(this.currentTab,"lightest");
			domClass.remove(this.currentPanel,"active");

			this.currentTab = tab;
			this.currentPanel = panel;

			domClass.add(this.currentTab,"lighter");
			domClass.add(this.currentTab,"darkest");
			domClass.remove(this.currentTab,"darker");
			domClass.remove(this.currentTab,"lightest");

			domClass.add(this.currentPanel,"active");
		},

		initializeRouteName:function()
		{
			this.splash.wait();
			var query = new Query();
			var queryTask = new QueryTask(this.config.mapServer.url+"/"+this.config.mapServer.routeId);
			query.where = "1 = 1";
			//query.outSpatialReference = {wkid:102100}; 
			query.returnGeometry = false;
			query.outFields = [this.config.mapServer.routeFieldName,this.config.mapServer.routeIdFieldName];
			queryTask.execute(
				query, 
				lang.hitch(this,function(response){
					if(!response || !response.features || response.features.length == 0)
					{
						this.error("Routes not found !");
						return;
					}
					
					response.features.sort(lang.hitch(this,function(a, b){
						if(a.attributes[this.config.mapServer.routeFieldName] < b.attributes[this.config.mapServer.routeFieldName]) return -1;
						if(a.attributes[this.config.mapServer.routeFieldName] > b.attributes[this.config.mapServer.routeFieldName]) return 1;
						return 0;
					}));

					for (var i = 0; i<response.features.length; i++){
						var opt = document.createElement('option');
						opt.value = response.features[i].attributes[this.config.mapServer.routeIdFieldName];
						opt.innerHTML = response.features[i].attributes[this.config.mapServer.routeFieldName];
						this.routeName1Select.appendChild(opt);
						var opt2 = document.createElement('option');
						opt2.value = response.features[i].attributes[this.config.mapServer.routeIdFieldName];
						opt2.innerHTML = response.features[i].attributes[this.config.mapServer.routeFieldName];
						this.routeName2Select.appendChild(opt2);
					}
					this.splash.hide();
					}
				),
				lang.hitch(this,function(error){
					this.error(error);
				})
			);
		},

		activateDeactivate:function(tool)
		{
			if(tool===this.currentTool) return;

			if(this.currentTool)
				this.currentTool.deactivate();
			
			this.currentTool = tool;

			if(this.currentTool)
				this.currentTool.activate();
		},

		searchPkWithPosition:function(mapPoint,tolerance)
		{
			var location = { 
				"geometry" : { "x" : mapPoint.x, "y" : mapPoint.y }
            };

            var params = {
				locations: JSON.stringify([location]),
				inSR:JSON.stringify(this.map.spatialReference.toJson()),
				outSR: JSON.stringify(this.map.spatialReference.toJson()),
				tolerance:tolerance ? tolerance:10,
				f:'json'
			};
			var self = this;

			return new Promise(function(resolve, reject) {
				esriRequest({
					url: self.config.lrsServer+"/geometryToMeasure",
					content: params
					},{usePost:true}).then(
						lang.hitch(self,function(response){
							var graphics = [];
							if (response && response.locations && response.locations.length > 0) {
								
								for(var i=0;i<response.locations.length;i++){
									if(response.locations[i].status=="esriLocatingCannotFindLocation")continue;

									for(var g=0;g<response.locations[i].results.length;g++){
										if(response.locations[i].results[g].geometryType!='esriGeometryPoint')continue;
										var markerSymbol = new SimpleMarkerSymbol({
											"color": [255,0,0,255],
											"size": 8,
											"angle": 0,
											"xoffset": 0,
											"yoffset": 0,
											"type": "esriSMS",
											"style": "esriSMSCircle",
											"outline": {"color":[255,0,0,255],"width":1,"type":"esriSLS","style":"esriSLSSolid"}
										});
										response.locations[i].results[g].geometry.spatialReference = this.map.spatialReference;
										var attributes = {
											'routeId' : response.locations[i].results[g].routeId,
											'measure' : response.locations[i].results[g].measure,
											'x' : response.locations[i].results[g].geometry.x,
											'y' : response.locations[i].results[g].geometry.y
										};
										var graphic = new Graphic(new Point(response.locations[i].results[g].geometry),markerSymbol,attributes);
										graphics.push(graphic);
									}
								}
							}
							resolve(graphics);
						}),
						lang.hitch(this,function(error){reject(error);})
					);
			});
		},

		searchPkWithRouteNameAndPk:function(routeId,pk)
		{
			var location = { 
                routeId: routeId,
                measure: pk
            };

            var params = {
                locations: JSON.stringify([location]),
				outSR: JSON.stringify(this.map.spatialReference.toJson()),
				f:'json'
			};
			var self = this;

			return new Promise(function(resolve, reject) {
				esriRequest({
					url: self.config.lrsServer+"/measureToGeometry",
					content: params
					},{usePost:true}).then(
						lang.hitch(self,function(response){
							var graphics = [];
							if (response && response.locations && response.locations.length > 0) {
								for(var i=0;i<response.locations.length;i++){
									var loc = response.locations[i];
									if(loc.status == "esriLocatingOK")
									{
										var markerSymbol = new SimpleMarkerSymbol({
											"color": [255,0,0,255],
											"size": 8,
											"angle": 0,
											"xoffset": 0,
											"yoffset": 0,
											"type": "esriSMS",
											"style": "esriSMSCircle",
											"outline": {"color":[255,0,0,255],"width":1,"type":"esriSLS","style":"esriSLSSolid"}
										});
										response.locations[i].geometry.spatialReference = this.map.spatialReference;
										var graphic = new Graphic(new Point(response.locations[i].geometry),markerSymbol);
										graphics.push(graphic);
									}
								}
							}
							resolve(graphics);
						}),
						lang.hitch(this,function(error){reject(error);})
					);
			});
		},

		searchPkWithRouteNameAndPkFromAndPkTo:function(routeId,pkFrom,pkTo)
		{
			var location = { 
                routeId: routeId,
                fromMeasure: pkFrom,
                toMeasure: pkTo
            };

            var params = {
                locations: JSON.stringify([location]),
				outSR: JSON.stringify(this.map.spatialReference.toJson()),
				f:'json'
			};
			var self = this;
			return new Promise(function(resolve, reject) {
				esriRequest({
					url: self.config.lrsServer+"/measureToGeometry",
					content: params
					},{usePost:true}).then(
						lang.hitch(self,function(response){
							var graphics = [];
							if (response && response.locations && response.locations.length > 0) {
								for(var i=0;i<response.locations.length;i++){
									var loc = response.locations[i];
									if(loc.status == "esriLocatingOK")
									{
										var lineSymbol = new SimpleLineSymbol({
											"type": "esriSLS",
											"style": "esriSLSDot",
											"color": [255,0,0,255],
											"width": 6
											});
										response.locations[i].geometry.spatialReference = self.map.spatialReference;
										var graphic = new Graphic(new Polyline(response.locations[i].geometry),lineSymbol);
										graphics.push(graphic);
									}
								}
							}
							resolve(graphics);
						}),
						lang.hitch(this,function(error){reject(error);})
					);
			});
		},
		
		error:function(error)
	   {
		   var message = error;
		   if(error === Object(error))
		   {
			   if(error.message && error.details)
				   message = error.message +"<br>"+ JSON.stringify(error.details);
			   else if(error.message)
				   message = error.message;
			   else
				   message = "Error not yet defined";
		   }
		   
		   this.info("ERREUR: "+message+" !!!");
	   },
	   
	   info:function(message)
	   {
		   this.splash.info({
					"text":message,
					"button":
						{
							"text":"OK",
							"callback":lang.hitch(this,function(){
								this.splash.hide();
							})
						}
					
					});
	   },
	
		onOpen: function(){
			
			///ADD MAPSERVICE
			if(this.layer)return;
			this.layer = new ArcGISDynamicMapServiceLayer(this.config.mapServer.url,{"opacity": 1});
			this.layer.label = this.config.mapServer.label;
			this.map.addLayer(this.layer);	

			/// PK OVER MAP
			this.overHandler = on(this.map,"mouse-move",lang.hitch(this,function(event){
				this.searchOverMapPoint = event.mapPoint;
				if(this.isOverSearch)return;
				this.isOverSearch = true;
				this.searchOver(this.searchOverMapPoint);
			}));

			this.map.addLayer(this.overGraphics);	
		},

		searchOver: function(overMapPoint){
			this.searchPkWithPosition(overMapPoint,2).then(
				lang.hitch(this,function(graphics){
					if(graphics && graphics.length>0){
						this.overGraphics.clear();
						
						graphics[0].symbol.setColor(new Color([255,185,15,255]));
						var graphicPoint = new Graphic(new Point(graphics[0].geometry),graphics[0].symbol);
									
						graphics[0].setSymbol(new TextSymbol(
							{
							"type": "esriTS",
							"color": [255,255,255,255],
							"backgroundColor": [0,0,0,255],
							"borderLineSize": 2,
							"borderLineColor": [0,0,0,255],
							"haloSize": 2,
							"haloColor": [0,0,0,255],
							"verticalAlignment": "bottom",
							"horizontalAlignment": "left",
							"rightToLeft": false,
							"angle": 0,
							"xoffset": 0,
							"yoffset": 0,
							"kerning": true,
							"font": {
							 "family": "Arial",
							 "size": 10,
							 "style": "normal",
							 "weight": "bold",
							 "decoration": "none"
							},
							"text":graphics[0].attributes["routeId"]+": "+graphics[0].attributes["measure"]
					   }
					   ));
					   this.overGraphics.add(graphicPoint);
					   this.overGraphics.add(graphics[0]);
					}

					if(this.overMapPoint===this.searchOverMapPoint){
						this.isOverSearch = false;
					}else{
						this.searchOver(this.searchOverMapPoint);
					}
				}),
				lang.hitch(this,function(error){this.isOverSearch = false;this.error(error);})
			);
		},
	   
		onClose: function(){
			///REMOVE OVER MAP
			if(this.overHandler)
				this.overHandler.remove();

			this.overGraphics.clear();
			this.map.removeLayer(this.overGraphics);
		},
		
		toggle: function(elem){
			if(elem.style.display == "none")
				elem.style.display = "block";
			else
				elem.style.display = "none";
		},
		
		show: function(elem){
			elem.style.display = "block";
		},
		
		hide: function(elem){
			elem.style.display = "none";
		}
	  
      // onMinimize: function(){
      //   console.log('onMinimize');
      // },

      // onMaximize: function(){
      //   console.log('onMaximize');
      // },

      // onSignIn: function(credential){
      //   /* jshint unused:false*/
      //   console.log('onSignIn');
      // },

      // onSignOut: function(){
      //   console.log('onSignOut');
      // }

      // onPositionChange: function(){
      //   console.log('onPositionChange');
      // },

      // resize: function(){
      //   console.log('resize');
      // }


    });
  });