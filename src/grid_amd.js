define(
	['dojo/on','dojo/Evented',"dojo/dom-class","dojo/_base/array"],
	function(on,Evented,domClass,array)
	{
		return function(div, properties)
		{
			var self = this;
			this.evented = new Evented();
			this.dom_table = null;
			this.dom_header = null;
			this.dom_body = null;
			this.dom_footer = null;
			this._container = null;
			this._container_paging = null
		
			this.data = null;
			this.columns = null;

			this.emit = function(eventName,params)
			{
				this.evented.emit(eventName,params);
			}

			this.on = function(eventName,callback)
			{
				this.evented.on(eventName,callback);
			}
			
			// =============================
			// INITIALIZE
			// =============================
			this.initialize = function(data)
			{
				try
				{
					this.data = data;
					
					// if the columns are not defined, we consider that the FIRST row is the template for all other rows
					if( this.columns == null )
					{
						this.columns = [];
						
						if( data && data.length > 0 )
							for( var name in data[0] )
								this.columns.push({'field': name, 'label': name, 'isEditable': false, 'isVisible': true});
					}
					
					this.dom_table = document.createElement('TABLE');
					this.dom_table.className = 'grid';
					
					this.initialize_header();
					this.initialize_footer();
					this.initialize_body();
					this.initialize_pager();
					
					this._container.appendChild(this.dom_table);
					this.dom_table.appendChild(this.dom_header);
					this.dom_table.appendChild(this.dom_body);
					
					this.refresh();
				} catch(e) { console.error(e); }	
			}
			
			this.initialize_header = function()
			{
				var tr = document.createElement('TR');
				
				// first column = select checkbox
				var th;
				if( this.isSelectable )
				{
					th = document.createElement('TH');
					th.className = 'rowselect';
					var checkbox = document.createElement('INPUT');
					checkbox.type = 'checkbox';
					th.appendChild(checkbox);
					th.id = 'selectionOnly';
					th.title = 'Show only selected items';
					on(checkbox, 'click', function() { self.toggleSelectionOnly(); });
					tr.appendChild(th);
				}
				
				for( var i = 0; i < this.columns.length; i++ )
				{
					if( !this.columns[i].isVisible )
							continue;
							
					th = document.createElement('TH');
					th.innerHTML = this.columns[i].label;
					tr.appendChild(th);
					
					if( this.columns[i].isSortable )
						this._allow_sort(th);
				}
				
				// last column = filler
				th = document.createElement('TH');
				th.className = 'filler';
				th.innerHTML = '&nbsp;';
				tr.appendChild(th);
				
				this.dom_header = document.createElement('THEAD');
				this.dom_header.appendChild(tr);
			}
			
			this.initialize_body = function(data)
			{
				this.dom_body = document.createElement("TBODY");
				for( var i = 0; i < this.rowsPerPage; i++ )
					this._append_row(i);
			}
			
			this.initialize_footer = function()
			{
				if( !this.isAppendable )
					return;
		
				var tr = document.createElement('TR');
				tr.className = 'footer';
				
				// first column = add row
				var td = document.createElement('TD');
				td.className = 'rowappend';
				td.innerHTML = '*';
				td.style.cursor = 'pointer';
				td.title = 'Add new row';
				on(td, 'click', function() { self.add(); });
				tr.appendChild(td);
				
				// the rest
				var td = document.createElement('TD');
				td.className = 'filler';
				td.innerHTML = '&nbsp;';
				td.colSpan = this.dom_header.childNodes[0].childNodes.length - 1;
				tr.appendChild(td);
				
				this.dom_footer = document.createElement('TFOOT');
				this.dom_footer.appendChild(tr);
			}
			
			this.initialize_pager = function()
			{
				if( this._container_paging == null )
					return;
				
				while(this._container_paging.firstChild)
					this._container_paging.removeChild(this._container_paging.firstChild);
				
				var container = document.createElement("DIV");
				container.className = "pager";
				
				var previous = document.createElement("SPAN");
				previous.className = "button";
				previous.innerHTML = "&#xE225;";
				
				var number = document.createElement("SPAN");
				number.className = "number";
				number.innerHTML = (this.__current_page + 1) + " / " + (this.getMaxPages() + 1);
				
				var next = document.createElement("SPAN");
				next.className = "button";
				next.innerHTML = "&#xE224;";
				
				on(previous, 'mousedown', function() { self._progressiveScrollPageTimeout(500, -1); });
				on(previous, 'mouseup', function() { if( self.__handler_pspt ) { clearTimeout(self.__handler_pspt); self.__handler_pspt = null; } });
				on(previous, 'click', function() { if( self.__current_page > 0 ) self.paging(self.__current_page -1); });
				
				on(next, 'mousedown', function() { self._progressiveScrollPageTimeout(500, 1); });
				on(next, 'mouseup', function() { if( self.__handler_pspt ) { clearTimeout(self.__handler_pspt); self.__handler_pspt = null; } });
				on(next, 'click', function() { if( self.__current_page < self.getMaxPages() ) self.paging(self.__current_page +1); });
				
				on(this, 'onPaging', function(page)
				{
					var max = self.getMaxPages();
					number.innerHTML = (page+1) + " / " + (max+1);
					if( page <= 0 )
						domClass.add(previous, 'disabled');
					else
						domClass.remove(previous, 'disabled');
					
					if( page >= max )
						domClass.add(next, 'disabled');
					else
						domClass.remove(next, 'disabled');
				});
				
				container.appendChild(previous);
				container.appendChild(number);
				container.appendChild(next);
				this._container_paging.appendChild(container);
			}
			
			this._append_row = function(index)
			{
				var tr = document.createElement('TR');
				var td;
				
				// first column = select checkbox
				if( this.isSelectable )
				{
					td = document.createElement('TD');
					td.className = 'rowselect';
					var checkbox = document.createElement('INPUT');
					checkbox.type = 'checkbox';
					td.appendChild(checkbox);
					
					// special case
					var zoom = document.createElement('SPAN');
					zoom.className = "rowicon";
					zoom.innerHTML = "&#xf002;"; 
					zoom.alt = "View on map";
					zoom.title = "View on map";
					on(zoom, 'click', function() { self.onZoom(self.getRow(tr)); });
					td.appendChild(zoom);
					
					if( this.isEditable )
						this._append_edit_icon(tr, td);
					
					tr.appendChild(td);
					this._allow_select(checkbox);
				}
			
				for( var j = 0; j < this.columns.length; j++ )
				{
					if( !this.columns[j].isVisible )
						continue;
						
					td = document.createElement('TD');
					if( this.columns[j].isEditable && this.isEditable )
					{
						td.className = 'readwrite';
						this._allow_editing(td);
					}
					else
						td.className = 'readonly';
					td.innerHTML = '';
					tr.appendChild(td);
				}
				
				// last column = filler
				td = document.createElement('TD');
				td.className = 'filler';
				td.innerHTML = '&nbsp;';
				tr.appendChild(td);
				
				if( this.isRemovable )
					this._allow_remove(td);
				
				this.dom_body.appendChild(tr);
			}
			
			this._append_edit_icon = function(tr, td)
			{
				var edit = document.createElement('SPAN');
				edit.className = "rowicon";
				edit.innerHTML = "&#xf040;"; 
				edit.alt = "Modify values";
				edit.title = "Modify values";
				edit.dataset.type = "edit";
				on(edit, 'click', function() { self.onEditRow(self.getRow(tr), tr); });
				td.appendChild(edit);
			}
			
			this._fill_row = function(tr, row)
			{
				for( var j = 0, k = (this.isSelectable ? 1 : 0); j < this.columns.length; j++ )
				{
					if( !this.columns[j].isVisible )
						continue;
					
					td = tr.children[k++];
					
					var value = '';
					if( typeof row[this.columns[j].field] != 'undefined' )
						value = row[this.columns[j].field];
					if( value == null || value == 'null' )
						value = '';
					else if(this.columns[j].domain && this.columns[j].domain.codedValues)
					{
						for(var s=0;s<this.columns[j].domain.codedValues.length;s++)
						{
							if(value == this.columns[j].domain.codedValues[s].code)
							{
								value = this.columns[j].domain.codedValues[s].name;
								break;
							}
						}
					}	
					else if( this.columns[j].type == 'esriFieldTypeDate' )
						value = new Date(parseInt(value)).toNormalString();
					else if(this.columns[j].round)
						value = Math.round(value*1000)/1000;
					td.innerHTML = value;
				}
			}
			
			this._allow_editing = function(td)
			{
				/*dojo.connectOnce(td, 'ondblclick', function()
				{
					var value = self.getValue(td);
					if( value == null || value == undefined )
						value = '';
					
					var input = document.createElement('INPUT');
					input.type = 'text';
					input.value = value;
					input.style.width = (td.clientWidth - 10 ) + 'px';
					
					while( td.childNodes.length > 0 ) td.removeChild(td.firstChild);
					
					td.appendChild(input);
					input.focus();
					
					var escape = document.onEscape(function()
					{
						dojo.disconnect(blur);
						dojo.disconnect(enter);
						self._allow_editing(td);
						
						td.innerHTML = value;
					}, input);
					var enter = document.onEnter(function()
					{
						dojo.disconnect(escape);
						dojo.disconnect(blur);
						self._allow_editing(td);
						
						if( input.value != value )
						{
							td.innerHTML = input.value;
							var r = self.getRow(td);
							var f = self.getField(td).field;
							r[f] = input.value;
							self.onEdit(r, f, value, input.value);
						}
						else
							td.innerHTML = value;
					}, input);
					var blur = dojo.connectOnce(input, 'onblur', function()
					{
						dojo.disconnect(escape);
						dojo.disconnect(enter);
						self._allow_editing(td);
						
						if( input.value != value )
						{
							td.innerHTML = input.value;
							var r = self.getRow(td);
							var f = self.getField(td).field;
							r[f] = input.value;
							self.onEdit(r, f, value, input.value);
						}
						else
							td.innerHTML = value;
					});
				});*/
			}
			
			this._allow_select = function(checkbox)
			{
				checkbox.style.cursor = 'pointer';
				on(checkbox, 'click', function()
				{
					self.toggle(self.getRow(checkbox.parentNode));
				});
				checkbox.title = 'Select row';
			}
			
			this._allow_remove = function(td)
			{
				while( td.childNodes.length > 0 ) td.removeChild(td.firstChild);
				
				var span = document.createElement('SPAN');
				span.className = 'remove';
				span.title = 'Remove row';
				td.appendChild(span);
				
				on(span, 'click', function()
				{
					self.remove(self.getRow(td));
				});
			}
			
			this._allow_sort = function(th)
			{
				th.style.cursor = 'pointer';
				th.title = 'Sort rows';
				on(th, 'click', function()
				{
					self.sort(self.getField(th).field);
				});
			}
			
			// =============================
			// PAGING
			// =============================
			this.rowsPerPage = 250;
			this.__current_page = 0;
			this.paging = function(page)
			{
				page = Math.max(0, Math.min(page, this.getMaxPages()));
		
				for( var i = 0; i < this.rowsPerPage; i++ )
				{
					if(this.isSelectable)
					{
						domClass.remove(this.dom_body.rows[i], 'selected');
						this.dom_body.rows[i].firstChild.firstChild.checked = false;
					}
					
					if( (page * this.rowsPerPage + i) >= this.getCurrentData().length )
					{
						if( this.dom_body.rows[i].style.display != 'none' )
							this.dom_body.rows[i].style.display = 'none';
						this._fill_row(this.dom_body.rows[i], {});
					}
					else
					{
						if( this.dom_body.rows[i].style.display == 'none' )
							this.dom_body.rows[i].style.display = 'table-row';
						this._fill_row(this.dom_body.rows[i], this.getCurrentData()[page * this.rowsPerPage + i]);
					}
				}
				
				this.__current_page = page;
				
				for( var j = 0; j < this.selection.length; j++ )
				{
					for( var i = 0; i < this.data.length; i++ )
					{
						if( this.data[i] === this.selection[j] )
						{
							var k = this.getPagedIndex(i);
							if( k >= 0 )
							{
								if(this.dom_body.rows.length>k)
								{
									domClass.add(this.dom_body.rows[k], 'selected');
									this.dom_body.rows[k].firstChild.firstChild.checked = true;
								}
							}
							break;
						}
					}
				}
				
				this.onPaging(page);
			}
			
			this.__handler_pspt = null;
			this._progressiveScrollPageTimeout = function(timeout, step)
			{
				if( this.__handler_pspt != null )
					clearTimeout(this.__handler_pspt);
				this.__handler_pspt = setTimeout( function() { self._progressiveScrollPageTimeoutRecurse(timeout, step); }, timeout );
			}
			
			this._progressiveScrollPageTimeoutRecurse = function(timeout, step)
			{
				if( step == 0 )
					return;
				if( this.__current_page <= 0 && step < 0 )
					return;
				if( this.__current_page >= this.getMaxPages() && step > 0 )
					return;
				if( timeout <= 100 )
					timeout = 100;
		
				this.paging(this.__current_page + step);
				this.__handler_pspt = setTimeout(function() { self._progressiveScrollPageTimeoutRecurse(timeout * 0.75, step); }, timeout * 0.75);
			}
			
			// =============================
			// SORT
			// =============================
			this._sortField = null;
			this._sortOrder = true;
			this.sort = function(field)
			{
				if( this._sortField == field )
					this._sortOrder = !this._sortOrder;
				else
					this._sortOrder = true;
				this._sortField = field;
				
				var column = null;
				for( var i = 0; i < this.columns.length; i++ )
				{
					if( this.columns[i].field == field )
					{
						column = this.columns[i];
						break;
					}
				}
				
				// style
				var th = this.dom_header.children[0].children;
				for( var i = 0; i < th.length; i++ )
				{
					domClass.remove(th[i], 'asc');
					domClass.remove(th[i], 'desc');
					if( th[i].innerHTML == column.label )
						domClass.add(th[i], (this._sortOrder ? 'asc' : 'desc'));
				}
				
				var sorting = function(a, b)
				{
					var _a, _b;
					
					switch( column.type )
					{
						case 'esriFieldTypeOID':
						case 'esriFieldTypeDouble':
						case 'esriFieldTypeInteger':
						case 'esriFieldTypeSmallInteger':
						case 'esriFieldTypeSingle':
						case 'esriFieldTypeDate':
							_a = parseFloat(a[field]);
							_b = parseFloat(b[field]);
							if( isNaN(_a) || !isFinite(_a) ) _a = -Number.MAX_VALUE;
							if( isNaN(_b) || !isFinite(_b) ) _b = -Number.MAX_VALUE;
							break;
						default:
							_a = (a[field] + '').toUpperCase();
							_b = (b[field] + '').toUpperCase();
							if( _a == _b ) return 0;
							if( _a == 'NULL' ) _a = '';
							if( _b == 'NULL' ) _b = '';
					}
					
					if( self._sortOrder )
						return (_a > _b ? 1 : -1);
					else
						return (_a > _b ? -1 : 1);
				};
				
				this.data.sort(sorting);
				this.selection.sort(sorting);
				
				this.refresh();
			}
			
			// =============================
			// UTILS
			// =============================
			this.getDataIndexFromRow = function(element)
			{
				if( element.tagName.toUpperCase() == 'TD' )
					element = element.parentNode;
		
				return this.getUnpagedIndex(element.rowIndex - 1);
			}
			
			this.getColumnIndex = function(element)
			{
				if(this.isSelectable)
					return element.cellIndex - 1;
				else
					return element.cellIndex;
			}
			
			this.getRow = function(element)
			{
				try { return this.data[this.getDataIndexFromRow(element)]; }
				catch(e) { return null; }
			}
			
			this.getField = function(element)
			{
				try
				{
					var index = this.getColumnIndex(element);
					for( var i = 0; i < this.columns.length; i++ )
					{
						if( this.columns[i].isVisible )
						{
							if( index == 0 )
								return this.columns[i];
							index--;
						}
					}
					
					return null;
				}
				catch(e) { return null; }
			}
			
			this.getValue = function(element)
			{
				try { return this.getRow(element)[this.getField(element).field]; }
				catch(e) { return null; }
			}
		
			this.getPagedIndex = function(i)
			{
				// i = index in data
				// -> return row number
				// CAUTION : returns -1 if the row is not displayed due to paging
				
				if( this.__selectionOnly )
				{
					for( var j = 0; j < this.selection.length; j++ )
						if( this.selection[j] === this.data[i] )
							return j - this.__current_page * this.rowsPerPage;
					return -1;
				}
				else
				{
					if( i < this.__current_page * this.rowsPerPage || i >= (this.__current_page + 1) * this.rowsPerPage )
						return -1;
					return i - this.__current_page * this.rowsPerPage;
				}
			}
			
			this.getUnpagedIndex = function(i)
			{
				// i = row number
				// -> return index in data
				// CAUTION : returns -1 if the data does not exist
				
				i += this.__current_page * this.rowsPerPage;
				if( this.__selectionOnly )
				{
					for( var j = 0; j < this.data.length; j++ )
						if( this.selection[i] === this.data[j] )
							return j;
					return -1;
				}
				else
				{
					if( i < this.data.length )
						return i;
					return -1;
				}
			}
			
			this.getMaxPages = function()
			{
				return Math.ceil(this.getCurrentData().length / this.rowsPerPage) - 1;
			}
			
			this.getCurrentData = function()
			{
				if( this.__selectionOnly )
					return this.selection;
				else
					return this.data;
			}
			
			// =============================
			// REFRESH/DESTROY
			// =============================
			this.refresh = function()
			{
				this.paging(this.__current_page);
			}
			
			this.destroy = function()
			{
				this.selection = null;
				this.columns = null;
				this.data = null;
				
				if( this.dom_table.parentNode )
					this.dom_table.parentNode.removeChild(this.dom_table);
				
				if( this._container_paging )
					while(this._container_paging.firstChild)
						this._container_paging.removeChild(this._container_paging.firstChild);
				
				this.onDestroy();
			}
			
			// =============================
			// SELECT
			// =============================
			this.isSelectable = true;
			this.selection = [];
			
			this.select = function(row)
			{
				try
				{
					if( !this.isSelectable || array.indexOf(this.selection, row)!=-1 )
						return;
					this.selection.push(row);
					
					for( var i = 0; i < this.data.length; i++ )
					{
						if( this.data[i] === row )
						{
							var k = this.getPagedIndex(i);
							if( k >= 0 )
							{
								if(this.dom_body.childNodes.length>k)
								{
									domClass.add(this.dom_body.childNodes[k], 'selected');
									this.dom_body.childNodes[k].firstChild.firstChild.checked = true;
								}
							}
							this.onSelect(row);
							break;
						}
					}
					
					if( this.__selectionOnly )
						this.refresh();
				}
				catch(e)
				{
					console.log("GRID SELECT", "WARNING");
					console.error(e); 
				}
			}
			
			this.deselect = function(row)
			{
				if( !this.isSelectable || array.indexOf(this.selection, row)==-1 )
					return;
					
				for(var i = 0; i < this.selection.length; i++)
				{
					if(this.selection[i] === row)
					{
						this.selection.splice(i, 1);
						break;
					}
				}
				
				for( var i = 0; i < this.data.length; i++ )
				{
					if( this.data[i] === row )
					{
						var k = this.getPagedIndex(i);
						if( k >= 0 )
						{
							if(this.dom_body.childNodes.length>k)
							{
								domClass.remove(this.dom_body.childNodes[k], 'selected');
								this.dom_body.childNodes[k].firstChild.firstChild.checked = false;
							}
						}
						this.onDeselect(row);
						break;
					}
				}
				
				if( this.__selectionOnly )
					this.refresh();
			}
			
			this.toggle = function(row)
			{
				if( array.indexOf(this.selection, row)!=-1)
					this.deselect(row);
				else
					this.select(row);
			}
			
			this.__selectionOnly = false;
			this.toggleSelectionOnly = function()
			{
				this.showSelectionOnly(!this.__selectionOnly);
			}
			
			this.showSelectionOnly = function(value)
			{
				this.__selectionOnly = value;
				
				if( value )
					domClass.add(this.dom_table, 'selectionOnly');
				else
					domClass.remove(this.dom_table, 'selectionOnly');
				
				// sync the checkbox checked state
				if( this.isSelectable )
				{
					var e = this.dom_table.rows[0].cells[0].firstChild;
					if( e.nodeName == 'INPUT' && e.type == 'checkbox' )
						e.checked = value;
				}
				
				this.refresh();
			}
			
			// =============================
			// ADD
			// =============================
			this.addAll = function(rows)
			{
				if( !rows || rows.length == 0 )
					return;
					
				this.stopEvents = true;
				for( var i = 0; i < rows.length; i++ )
					this.add(rows[i]);
				this.stopEvents = false;
				
				this.onAdd(rows);
				this.refresh();
			}
			
			this.isAppendable = false;
			this.add = function(row)
			{
				if( !this.isAppendable && !row )
					return;
				// allow to add rows (non-empty) programatically even if it is not appendable !
		
				// NOTE : row is optional. If not set, we create a new row based on this.columns
				// if row is provided, then we suppose it has the proper columns
				if( !row )
				{
					row = {};
					for( var i = 0; i < this.columns.length; i++ )
						row[this.columns[i].field] = null;
				}
				
				this.data.push(row);
				
				if( !this.stopEvents )
				{
					this.onAdd(row);
					this.refresh();
				}
			}
			
			// =============================
			// REMOVE
			// =============================
			
			this.removeAll = function(rows)
			{
				if( !rows || rows.length == 0 )
					return;
					
				this.stopEvents = true;
				for( var i = 0; i < rows.length; i++ )
					this.remove(rows[i]);
				this.stopEvents = false;
				
				this.onRemove(rows);
				this.refresh();
			}
			
			this.isRemovable = false;
			this.remove = function(row)
			{
				if( !this.isRemovable || array.indexOf(this.data, row)==-1  )
					return;
		
				// deselect first
				this.deselect(row);
				
				// remove data and TR
				var i = 0;
				for( ; i < this.data.length; i++)
				{
					if(this.data[i] === row)
					{
						this.data.splice(i, 1);
						break;
					}
				}
				
				if( !this.stopEvents )
				{
					this.onRemove(row);
					this.refresh();
				}
			}
			
			
			// =============================
			// UPDATE
			// =============================
			this.isEditable = false;
			this.editable = function(value)
			{
				if( typeof value == 'undefined' )
					return this.isEditable;
				if( value === this.isEditable )
					return this.isEditable;
					
				if( value )
				{
					for( var i = 0; i < this.dom_body.rows.length; i++ )
						this._append_edit_icon(this.dom_body.rows[i], this.dom_body.rows[i].cells[0]);
				}
				else
				{
					for( var i = 0; i < this.dom_body.rows.length; i++ )
					{
						var td = this.dom_body.rows[i].cells[0];
						for( var j = 0; j < td.childNodes.length; j++ )
						{
							if( td.childNodes[j].dataset.type == 'edit' )
							{
								td.removeChild(td.childNodes[j]);
								break;
							}
						}
					}
				}
				
				this.isEditable = value;
				return this.isEditable;
			}
			
			// =============================
			// EVENTS
			// =============================
			this.stopEvents = false;
			this.onEdit = function(row, field, oldValue, newValue){}
			this.onEditRow = function(row, tr){}
			this.onDeselect = function(row){self.emit("onDeselect",row);}
			this.onSelect = function(row){self.emit("onSelect",row);}
			this.onZoom = function(row){self.emit("onZoom",row);}
			this.onAdd = function(row){}
			this.onRemove = function(row){}
			this.onPaging = function(page){}
			this.onDestroy = function(){}
			this.onScroll = function(){}
			
			// =============================
			// CONSTRUCTOR
			// =============================
			this.constructor = function(div, properties)
			{
				if( typeof div == 'string' )
					div = document.getElementById(div);
				if( !div )
					throw 'Invalid DOM Element';
				else
					this._container = div;
		
				if( !properties )
					throw 'Missing data';
				
				if( properties.hasOwnProperty('columns') )
					this.columns = properties.columns;
				if( properties.hasOwnProperty('isSelectable') )
					this.isSelectable = properties.isSelectable;
				if( properties.hasOwnProperty('isAppendable') )
					this.isAppendable = properties.isAppendable;
				if( properties.hasOwnProperty('isEditable') )
					this.isEditable = properties.isEditable;
				if( properties.hasOwnProperty('isRemovable') )
					this.isRemovable = properties.isRemovable;
				if( properties.hasOwnProperty('rowsPerPage') )
					this.rowsPerPage = properties.rowsPerPage;
				if( properties.hasOwnProperty('page') )
					this.__current_page = properties.page;
				if( properties.hasOwnProperty('pagingDiv') )
				{
					if( typeof properties.pagingDiv == "string" )
						this._container_paging = document.getElementById(properties.pagingDiv);
					else
						this._container_paging = properties.pagingDiv;
				}
				this.initialize(properties.data);
			}
			this.constructor(div, properties);
		}
		
    }
);