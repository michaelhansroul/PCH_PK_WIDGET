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
    "esri/geometry/Point"
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
    Point
	)
{
    return declare([Evented], {
		constructor: function(widget){
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
            this.grid.on("onDeselect",lang.hitch(this,function(row){
                var graphic = this.getGraphicByAttributes(row);
                this.graphicsLayer.remove(graphic);
            }));
            this.graphicsLayer = new GraphicsLayer();
            this.graphics = [];

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
            //ENABLE  CLICK ON MAP
			this.clickHandler = on(this.map,"click",lang.hitch(this,function(event){
                this.searchPosition(event.mapPoint);
            }));
            
            this.map.addLayer(this.graphicsLayer);
        },

        deactivate: function()
        {
            if(this.clickHandler)
                this.clickHandler.remove();

            this.map.removeLayer(this.graphicsLayer);
        }
    });
});