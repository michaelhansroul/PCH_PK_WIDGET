define([
	"dojo/Evented",
    "dojo/_base/declare",
	"dojo/on",
	"dojo/_base/lang"
], function(Evented,declare,on,lang){
    return declare([Evented], {
		constructor: function(container,overlay){
			this.container = container;
			this.overlay = overlay;
			this.hide();
		},
		
		reset:function()
		{
			while (this.container.firstChild) {
			  this.container.removeChild(this.container.firstChild);
			}
			this.container.className = "splash";
		},
		
		__show:function(type)
		{
			this.container.style.display = "block";
			this.overlay.style.display = "block";
		},
		
		hide:function()
		{
			this.container.style.display = "none";
			this.overlay.style.display = "none";
		},
		
		info:function(options)
		{
			this.reset();
			
			var infoContainer = this.container;
			infoContainer.className = "splash infoContainer";
			
			var textContainer = document.createElement("div");
			textContainer.className = "textContainer";
			var buttonContainer = document.createElement("div");
			buttonContainer.className = "buttonContainer";
			
			infoContainer.appendChild(textContainer);
			infoContainer.appendChild(buttonContainer);
			
			if(options)
			{
				textContainer.innerHTML = options.text;
				if(options.button)
				{
					var button = document.createElement("div");
					button.className = "button"
					button.innerHTML = options.button.text;
					on(button,"click",options.button.callback);
					buttonContainer.appendChild(button);
				}
				else if(options.buttons)
				{
					var button1 = document.createElement("div");
					button1.className = "demi button"
					button1.innerHTML = options.buttons[0].text;
					on(button1,"click",options.buttons[0].callback);
					var button2 = document.createElement("div");
					button2.className = "demi button border";
					button2.innerHTML = options.buttons[1].text;
					on(button2,"click",options.buttons[1].callback);
					
					buttonContainer.appendChild(button1);
					buttonContainer.appendChild(button2);
					var clear = document.createElement("div");
					clear.className="clear";
					buttonContainer.appendChild(clear);
				}
			}
			
			///this.container.appendChild(infoContainer);
			
			this.__show("info");
		},
		
		wait:function()
		{
			this.reset();
			
			var waitContainer = document.createElement("div");
			waitContainer.className = "waitContainer";
			waitContainer.innerHTML = '<div class="sk-circle"><div class="sk-circle1 sk-child"></div><div class="sk-circle2 sk-child"></div><div class="sk-circle3 sk-child"></div><div class="sk-circle4 sk-child"></div><div class="sk-circle5 sk-child"></div><div class="sk-circle6 sk-child"></div><div class="sk-circle7 sk-child"></div><div class="sk-circle8 sk-child"></div><div class="sk-circle9 sk-child"></div><div class="sk-circle10 sk-child"></div><div class="sk-circle11 sk-child"></div><div class="sk-circle12 sk-child"></div></div>';
			
			this.container.appendChild(waitContainer);
			
			this.__show("wait");
		},
		
		success:function()
		{
			this.reset();
			
			var successContainer = document.createElement("div");
			successContainer.className = "successContainer";
			successContainer.innerHTML = '<div><span class="icon success"></span></div>';
			
			this.container.appendChild(successContainer);
			
			this.__show("success");
			
			setTimeout(lang.hitch(this,function(){
				this.hide();
			}),1000);
		}
    });
});