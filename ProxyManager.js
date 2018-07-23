define([
	"dojo/Evented",
    "dojo/_base/declare",
	"dojo/on",
	"dojo/_base/lang",
    "dojo/dom-class",
    "esri/urlUtils",
    "esri/config"
], function(
	Evented,
	declare,
	on,
	lang,
    domClass,
    urlUtils,
    esriConfig
	)
{
    return declare([Evented], {

		constructor: function(proxy,prefixes){
            console.log(prefixes);
            this.proxy = proxy;
            this.domains = [];
            if(this.proxy)
            {
                this.uri = this.getUri(window.location.href);
                this.domain = this.getDomain(this.uri);
                if(prefixes)
                {
                    for(var i=0;i<prefixes.length;i++)
                    {
                        console.log(prefixes[i]);
                        urlUtils.addProxyRule({
                            urlPrefix: prefixes[i],
                            proxyUrl: this.proxy
                        });
                    }
                }
            }
        },

        getDomain:function(uri)
        {
            console.log(uri);
            if(uri.port)
                return uri.hostname+':'+uri.port;
            else
                return uri.hostname;
        },
        
        add:function(url)
        {
            ///AUTOMATIQUE PROXY
            /*var uri = this.getUri(url);
            var domain = this.getDomain(uri);

            if(this.domains.indexOf(domain)!=-1) return;
            this.domains.push(domain);

            console.log("corsEnabledServers:"+domain);
            esriConfig.defaults.io.corsEnabledServers.push(domain);
            

            if(!this.proxy)return;

            if(domain == this.domain)return;

            urlUtils.addProxyRule({
                urlPrefix: domain,
                proxyUrl: this.proxy
            });*/
        },

        getUri:function(data) {
            var    a = document.createElement('a');
                   a.href = data;
            return {
                protocol:a.protocol,
                hostname:a.hostname,
                port:a.port,
                host:a.host
            };
        }
    });
});