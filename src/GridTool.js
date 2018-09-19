define([
	"dojo/Evented",
    "dojo/_base/declare",
	"dojo/on",
	"dojo/_base/lang",
    "dojo/dom-class",
    "esri/urlUtils",
    "esri/config",
    "./grid_amd",
    "esri/layers/GraphicsLayer",
    "esri/geometry/Point",
    "esri/symbols/SimpleLineSymbol",
	"esri/symbols/TextSymbol",
    "esri/Color",
    'esri/graphic',
	'esri/geometry/Point'
], function(
	Evented,
	declare,
	on,
	lang,
    domClass,
    urlUtils,
    esriConfig,
    Grid,
    GraphicsLayer,
    Point,
    SimpleLineSymbol,
	TextSymbol,
    Color,
    Graphic,
    Point
	)
{
    return declare([Evented], {
		constructor: function(widget){
            this.isActivate=false;
            this.widget = widget;
            this.map = widget.map;
            this.zoomFactor = widget.config.zoomFactor;
            var itemProp = {
                'data': [
                ],
                'columns':[
                    {'field':'routeId', 	'label':'Route', 	'isEditable': false, 	'isVisible': true, 	'isSortable': false, 	'type':'esri...'},
                    {'field':'x', 		'label':'X', 		'round':true,'isEditable': false, 	'isVisible': true, 		'isSortable': false, 	'type':'esri...'},
                    {'field':'y', 		'label':'Y', 		'round':true,'isEditable': false, 	'isVisible': true, 		'isSortable': false, 	'type':'esri...'},
                    {'field':'measure', 			'round':true,'label':'PK', 	'isEditable': false, 	'isVisible': true, 		'isSortable': false, 	'type':'esri...'}
                ],
                'isSelectable': true,
                'isAppendable': false,
                'isRemovable': true,
                'pagingDiv': null
            };
            this.grid = new Grid(this.widget.grid,itemProp);
            this.grid.on("onZoom",lang.hitch(this,function(row){
                var graphic = this.getGraphicByAttributes(row);
                this.map.centerAndZoom(graphic.geometry, this.zoomFactor);
            }));

            this.grid.on("onSelect",lang.hitch(this,function(row){
                var graphic = this.getGraphicByAttributes(row);
                this.graphicsLayer.add(graphic);
            }));

            this.grid.on("onAddLabel",lang.hitch(this,function(row){
                var graphic = this.getLabelGraphicByAttributes(row);
                this.graphicsLayer.add(graphic);
            }));

            this.grid.on("onRemoveLabel",lang.hitch(this,function(row){
                var graphic = this.getLabelGraphicByAttributes(row);
                this.graphicsLayer.remove(graphic);
            }));

            this.grid.on("onDeselect",lang.hitch(this,function(row){
                var graphic = this.getGraphicByAttributes(row);
                this.graphicsLayer.remove(graphic);
            }));
            this.graphicsLayer = new GraphicsLayer();
            this.overGraphics = new GraphicsLayer();
            this.graphics = [];
            this.labelGraphics = [];

            on(this.widget.deleteLabelsButton,"click",lang.hitch(this,function(){
                this.clear();
            }));

            on(this.widget.searchXYButton,"click",lang.hitch(this,function(){
                this.search();
            }));
        },

        getGraphicByAttributes:function(attributes){
            for(var i=0;i<this.graphics.length;i++){
                if(this.graphics[i].attributes===attributes)
                    return this.graphics[i];
            }
            return null;
        },
        getLabelGraphicByAttributes:function(attributes){
            for(var i=0;i<this.labelGraphics.length;i++){
                if(this.labelGraphics[i].attributes===attributes)
                    return this.labelGraphics[i];
            }
            return null;
        },

        search:function(){
            var x = this.widget.xInput.value;
            var y = this.widget.yInput.value;
            this.searchPosition(new Point(x,y,this.map.spatialReference));
        },

        searchPosition:function(mapPoint){
            this.widget.splash.wait()
            this.widget.searchPkWithPosition(mapPoint).then(
                lang.hitch(this,function(graphics){
                    if(graphics && graphics.length>0){
                        this.grid.add(graphics[0].attributes);
                        this.graphics.push(graphics[0]);
                        this.grid.select(graphics[0].attributes);

                        var graphicLabel = new Graphic(new Point(graphics[0].geometry),graphics[0].symbol,graphics[0].attributes);
						graphicLabel.setSymbol(new TextSymbol(
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
							"text":graphics[0].attributes["routeId"]+": "+Math.floor(graphics[0].attributes["measure"])
                            }
					    ));
                        this.labelGraphics.push(graphicLabel);
                        
                        this.widget.splash.success();
                    }
                    else
                        this.widget.splash.hide();
                }),
                lang.hitch(this,function(error){this.widget.error(error);})
            );
        },

        clear:function()
        {
            if(!this.grid.data)return;
            this.graphicsLayer.clear();
            var rows = [];
            for(var i=0;i<this.grid.data.length;i++){
                rows.push(this.grid.data[i]);
            }
            this.grid.removeAll(rows);
        },

        activate: function()
        {
            if(this.isActivate)return;
            this.isActivate=true;
            //ENABLE  CLICK ON MAP
			this.clickHandler = on(this.map,"click",lang.hitch(this,function(event){
                this.searchPosition(event.mapPoint);
            }));
            
            this.map.addLayer(this.graphicsLayer);

            /// PK OVER MAP
			this.overHandler = on(this.map,"mouse-move",lang.hitch(this,function(event){
				this.searchOverMapPoint = event.mapPoint;
				if(this.isOverSearch)return;
				this.isOverSearch = true;
				setTimeout(lang.hitch(this,function(){
					this.searchOver(this.searchOverMapPoint);
				}) , 25);
			}));

			this.map.addLayer(this.overGraphics);	
        },

        deactivate: function()
        {
            if(!this.isActivate)return;
            this.isActivate=false;
            if(this.clickHandler)
                this.clickHandler.remove();

            this.map.removeLayer(this.graphicsLayer);

            ///REMOVE OVER MAP
			if(this.overHandler)
                this.overHandler.remove();

            this.overGraphics.clear();
            this.map.removeLayer(this.overGraphics);
        },

        searchOver: function(overMapPoint){
			this.widget.searchPkWithPosition(overMapPoint).then(
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
							"text":graphics[0].attributes["routeId"]+": "+Math.floor(graphics[0].attributes["measure"])
					   }
					   ));
					   //this.overGraphics.add(graphicPoint);
					   this.overGraphics.add(graphics[0]);
					}

					if(overMapPoint.x==this.searchOverMapPoint.x && overMapPoint.y==this.searchOverMapPoint.y){
						this.isOverSearch = false;
					}else{
						this.searchOver(this.searchOverMapPoint);
					}
				}),
				lang.hitch(this,function(error){this.isOverSearch = false;this.error(error);})
			);
		}
    });
});