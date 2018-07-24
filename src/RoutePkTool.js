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

            //Search PK
			on(this.widget.searchPkButton,"click",lang.hitch(this,function(){
                this.widget.splash.wait();
				this.widget.searchPkWithRouteNameAndPk(this.widget.routeName1Select.value,this.widget.pkInput.value).then(
                    lang.hitch(this,function(graphics){
                        if(!graphics || graphics.length==0){
                            this.widget.info("No feature found !");
                            return;
                        }
                        this.current = graphics[0];
                        this.widget.splash.success();
                    }),
                    lang.hitch(this,function(error){this.widget.error(error);})
                );
            }));
            
            on(this.widget.zoomPkButton,"click",lang.hitch(this,function(){
                this.zoom();
            }));

            on(this.widget.labelPkButton,"click",lang.hitch(this,function(){
                this.addLabel();
            }));

            on(this.widget.clearPkButton,"click",lang.hitch(this,function(){
                this.clear();
            }));
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
            this.map.addLayer(this.graphics);
        },

        deactivate: function()
        {
            this.map.removeLayer(this.graphics);
        }
    });
});