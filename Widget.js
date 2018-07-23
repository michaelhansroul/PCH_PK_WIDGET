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
	"./src/Promise"
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
	GridTool
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
			}));
			on(this.tabPoint,"click",lang.hitch(this,function(event){
				this.switchPanel(this.tabPoint,this.panelPoint);
			}));
			on(this.tabLine,"click",lang.hitch(this,function(event){
				this.switchPanel(this.tabLine,this.panelLine);
			}));
			
			//Tools
			this.gridTool = new GridTool(this);
			this.activateDeactivate(this.gridTool);

			//Seach PK
			on(this.searchPkButton,"click",lang.hitch(this,function(){
				this.searchPkWithRouteNameAndPk(this.routeName1Select.value,this.pkInput.value);
			}));

			//Seach PK From To
			on(this.searchPkFromToButton,"click",lang.hitch(this,function(){
				this.searchPkWithRouteNameAndPkFromAndPkTo(this.routeName2Select.value,this.pkFrom.value,this.pkTo.value);
			}));

			//
			this.initializeRouteName();

			this.graphics = new GraphicsLayer();
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
			var queryTask = new QueryTask("http://roadsandhighwayssample.esri.com/arcgis/rest/services/RoadsHighways/NewYork/MapServer/3");
			query.where = "1 = 1";
			//query.outSpatialReference = {wkid:102100}; 
			query.returnGeometry = false;
			query.outFields = ["OBJECTID","customroutefield","routename","milelength","milepointname"];
			queryTask.execute(query, lang.hitch(this,function(response){
				for (var i = 0; i<response.features.length; i++){
					var opt = document.createElement('option');
					opt.value = response.features[i].attributes["customroutefield"];
					opt.innerHTML = response.features[i].attributes["routename"];
					this.routeName1Select.appendChild(opt);
					var opt2 = document.createElement('option');
					opt2.value = response.features[i].attributes["customroutefield"];
					opt2.innerHTML = response.features[i].attributes["routename"];
					this.routeName2Select.appendChild(opt2);
				}
				this.splash.hide();
			}));
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

		searchPkWithPosition:function(mapPoint)
		{
			var location = { 
				"geometry" : { "x" : mapPoint.x, "y" : mapPoint.y }
            };

            var params = {
				locations: JSON.stringify([location]),
				inSR:JSON.stringify(this.map.spatialReference.toJson()),
				outSR: JSON.stringify(this.map.spatialReference.toJson()),
				tolerance:10,
				f:'json'
			};
			var self = this;

			return new Promise(function(resolve, reject) {
				esriRequest({
					url: "http://roadsandhighwayssample.esri.com/arcgis/rest/services/RoadsHighways/NewYork/MapServer/exts/LRSServer/networkLayers/3/geometryToMeasure",
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
											"color": [255,255,255,64],
											"size": 12,
											"angle": 0,
											"xoffset": 0,
											"yoffset": 0,
											"type": "esriSMS",
											"style": "esriSMSCross",
											"outline": {"color":[0,0,0,255],"width":1,"type":"esriSLS","style":"esriSLSSolid"}
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
			esriRequest({
				url: "http://roadsandhighwayssample.esri.com/arcgis/rest/services/RoadsHighways/NewYork/MapServer/exts/LRSServer/networkLayers/3/measureToGeometry",
				content: params
				},{usePost:true}).then(
					lang.hitch(self,function(response){
						if (response && response.locations && response.locations.length > 0) {
							for(var i=0;i<response.locations.length;i++){
								var loc = response.locations[i];
								if(loc.status == "esriLocatingOK")
								{
									var markerSymbol = new SimpleMarkerSymbol({
										"color": [255,255,255,64],
										"size": 12,
										"angle": 0,
										"xoffset": 0,
										"yoffset": 0,
										"type": "esriSMS",
										"style": "esriSMSCross",
										"outline": {"color":[0,0,0,255],"width":1,"type":"esriSLS","style":"esriSLSSolid"}
									  });
									  response.locations[i].geometry.spatialReference = this.map.spatialReference;
									  var graphic = new Graphic(new Point(response.locations[i].geometry),markerSymbol);
									this.graphics.add(graphic);
								}
							}
						}
					}),
					lang.hitch(this,function(error){this.error(error);})
				);
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
			esriRequest({
				url: "http://roadsandhighwayssample.esri.com/arcgis/rest/services/RoadsHighways/NewYork/MapServer/exts/LRSServer/networkLayers/3/measureToGeometry",
				content: params
				},{usePost:true}).then(
					lang.hitch(self,function(response){
						if (response && response.locations && response.locations.length > 0) {
							for(var i=0;i<response.locations.length;i++){
								var loc = response.locations[i];
								if(loc.status == "esriLocatingOK")
								{
									var markerSymbol = new SimpleMarkerSymbol({
										"color": [255,255,255,64],
										"size": 12,
										"angle": 0,
										"xoffset": 0,
										"yoffset": 0,
										"type": "esriSMS",
										"style": "esriSMSCross",
										"outline": {"color":[0,0,0,255],"width":1,"type":"esriSLS","style":"esriSLSSolid"}
									  });
									  response.locations[i].geometry.spatialReference = self.map.spatialReference;
									  var graphic = new Graphic(new Point(response.locations[i].geometry),markerSymbol);
									this.graphics.add(graphic);
								}
							}
						}
					}),
					lang.hitch(this,function(error){this.error(error);})
				);
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
			this.layer = new ArcGISDynamicMapServiceLayer(this.config.MapServer,{"opacity": 1});
			this.layer.label = "NewYork";
			this.map.addLayer(this.layer);	
			this.map.addLayer(this.graphics);
		},
	   
		onClose: function(){
			///REMOVE MAPSERVICE
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