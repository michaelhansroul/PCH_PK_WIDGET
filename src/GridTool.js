define([
	"dojo/Evented",
    "dojo/_base/declare",
	"dojo/on",
	"dojo/_base/lang",
    "dojo/dom-class",
    "esri/urlUtils",
    "esri/config",
    "./grid_amd"
], function(
	Evented,
	declare,
	on,
	lang,
    domClass,
    urlUtils,
    esriConfig,
    Grid
	)
{
    return declare([Evented], {
		constructor: function(widget){
            this.widget = widget;
            this.map = widget.map;
            var itemProp = {
                'data': [
                ],
                'columns':[
                    {'field':'routeId', 	'label':'Route', 	'isEditable': false, 	'isVisible': true, 	'isSortable': false, 	'type':'esri...'},
                    {'field':'x', 		'label':'X', 		'isEditable': false, 	'isVisible': true, 		'isSortable': false, 	'type':'esri...'},
                    {'field':'y', 		'label':'Y', 		'isEditable': false, 	'isVisible': true, 		'isSortable': false, 	'type':'esri...'},
                    {'field':'measure', 			'label':'PK', 	'isEditable': false, 	'isVisible': true, 		'isSortable': false, 	'type':'esri...'}
                ],
                'isSelectable': false,
                'isAppendable': false,
                'isRemovable': false,
                'pagingDiv': null
            };
            this.grid = new Grid(this.widget.grid,itemProp);
        },

        activate: function()
        {
            //ENABLE  CLICK ON MAP
			this.clickHandler = on(this.map,"click",lang.hitch(this,function(event){
				this.widget.searchPkWithPosition(event.mapPoint).then(
                    lang.hitch(this,function(graphics){
                        if(graphics && graphics.length>0)
                            this.grid.add(graphics[0].attributes);
                    }),
                    lang.hitch(this,function(error){this.widget.error(error);})
                );
			}));
        },

        deactivate: function()
        {
            if(this.clickHandler)
                this.clickHandler.remove();
        }
    });
});