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
            this.widget = widget;
            this.map = widget.map;

            this.graphics = new GraphicsLayer();

            //Search PK
			on(this.widget.searchPkFromToButton,"click",lang.hitch(this,function(){
                this.widget.splash.wait();
				this.widget.searchPkWithRouteNameAndPkFromAndPkTo(this.widget.routeName2Select.value,this.widget.pkFrom.value,this.widget.pkTo.value).then(
                    lang.hitch(this,function(graphics){
                        if(!graphics || graphics.length==0){
                            this.widget.info("No feature found !");
                            return;
                        }
                        this.current = graphics[0];
                        this.graphics.clear();
                        this.graphics.add(this.current);
                        this.zoom();
                        this.widget.splash.success();
                    }),
                    lang.hitch(this,function(error){this.widget.error(error);})
                );
            }));
            
        },

        zoom:function()
        {
            if(!this.current)return;

            this.map.setExtent(this.current.geometry.getExtent());
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