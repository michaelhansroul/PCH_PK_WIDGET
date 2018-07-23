///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////

define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/_base/html',
    'dojo/_base/query',
    'dojo/on',
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidgetSetting',
    "dojo/dom-class"
  ],
  function(
  declare, 
  lang, 
  array, 
  html, 
  query, 
  on, 
  _WidgetsInTemplateMixin, 
  BaseWidgetSetting,
  domClass) {
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
      baseClass: 'jimu-widget-catalog-setting',

      startup: function() {
        this.inherited(arguments);
        this.setConfig(this.config);
        this.selecTab(this.configContainer);
        on(this.configTab,'click',lang.hitch(this,function(){this.selecTab(this.configContainer)}))
        on(this.helpTab,'click',lang.hitch(this,function(){this.selecTab(this.helpContainer)}));
      },

      setConfig:function(config)
      {
        console.log("Set config3");
        this.textArea.value = JSON.stringify(config,undefined, 4);
      },

      getConfig: function() {
        console.log("Get config");
        this.config = JSON.parse(this.textArea.value);
        return this.config;
      },
      
      selecTab:function(container)
      {
        if(this.currentTab)
        {
          this.currentTab.style.display='none';
        }
        this.currentTab = container;
        this.currentTab.style.display='block';

      }

    });
  });