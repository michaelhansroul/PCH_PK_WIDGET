define([
	"dojo/Evented",
    "dojo/_base/declare",
	"dojo/on",
	"dojo/_base/lang",
	"dojo/dom-class",
	'dojo/Deferred'
], function(
	Evented,
	declare,
	on,
	lang,
	domClass,
	Deferred
	)
{
    return declare([Evented], {
		constructor: function(execFunction){
			this.deferred = new Deferred();
			execFunction(this.deferred.resolve,this.deferred.reject);
		},
		
		then : function(a,b){
			return this.deferred.promise.then(a,b);
		}
    });
});