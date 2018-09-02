define([
	"dojo/Evented",
    "dojo/_base/declare",
	"dojo/on",
	"dojo/_base/lang",
    "dojo/dom-class",
    "esri/urlUtils",
    "esri/config",
    "./grid_amd",
    "esri/layers/GraphicsLayer"
], function(
	Evented,
	declare,
	on,
	lang,
    domClass,
    urlUtils,
    esriConfig,
    Grid,
    GraphicsLayer
	)
{
    return declare([Evented], {
		constructor: function(widget){
            this.zoomFactor = widget.config.zoomFactor;
            this.widget = widget;
            this.map = widget.map;
            this.graphics = new GraphicsLayer();
            this.isActivate=false;

            //Search PK
			on(this.widget.searchPkButton,"click",lang.hitch(this,function(){
                this.search(false);
            }));
            
            on(this.widget.zoomPkButton,"click",lang.hitch(this,function(){
                this.search(true);
            }));

            on(this.widget.labelPkButton,"click",lang.hitch(this,function(){
                this.addLabel();
            }));

            on(this.widget.clearPkButton,"click",lang.hitch(this,function(){
                this.clear();
            }));
        },

        search:function(zoom){
            this.widget.splash.wait();
				this.widget.searchPkWithRouteNameAndPk(this.widget.routeName1Select.value,this.widget.pkInput.value).then(
                    lang.hitch(this,function(graphics){
                        if(!graphics || graphics.length==0){
                            this.widget.info("No feature found !");
                            return;
                        }
                        this.current = graphics[0];
                        var title = this.widget.routeName1Select.value+" "+this.widget.pkInput.value+" "+(Math.round(this.current.geometry.x*1000)/1000) + ", " + (Math.round(this.current.geometry.y*1000)/1000);
                        
                        this.map.infoWindow.setTitle(title);
                        /*this.map.infoWindow.setContent(
                        "PK : " + this.widget.pkInput.value + 
                        "<br>x/y : " + this.current.geometry.x + ", " + this.current.geometry.y
                        );*/
                        this.map.infoWindow.show(this.current.geometry);

                        this.map.centerAt(this.current.geometry);
                        if(zoom)
                            this.zoom();
                        this.widget.splash.success();
                    }),
                    lang.hitch(this,function(error){this.widget.error(error);})
                );
        },

        addLabel:function(){
            if(this.current)
            {
                this.graphics.add(this.current);
            }
        },

        zoom:function(){
            if(this.current){
                this.map.centerAndZoom(this.current.geometry, this.zoomFactor);
            }
        },

        clear:function()
        {
            this.graphics.clear();
        },

        activate: function()
        {
            if(this.isActivate)return;
            this.isActivate=true;
            this.map.addLayer(this.graphics);
        },

        deactivate: function()
        {
            if(!this.isActivate)return;
            this.isActivate=false;
            this.map.removeLayer(this.graphics);
        }
    });
});