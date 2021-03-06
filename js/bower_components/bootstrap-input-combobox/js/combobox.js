/* =============================================================
 * bootstrap-real-combobox.js v1.0.0
 * =============================================================
 * Copyright 2014 Peter PayteR Gašparík
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ============================================================ */

!function( $ ) {

    "use strict";

    /* COMBOBOX PUBLIC CLASS DEFINITION
     * ================================ */

    var Combobox = function ( element, options ) {
        this.options = $.extend({}, $.fn.inputCombobox.defaults, options);
        this.$element = $(element);
        this.$container = this.setup();
        this.$button = this.$container.find('.dropdown-toggle');
        this.$menu = $(this.options.menu).appendTo('body');
        this.template = this.options.template || this.template
        this.matcher = this.options.matcher || this.matcher;
        this.sorter = this.options.sorter || this.sorter;
        this.highlighter = this.options.highlighter || this.highlighter;
        this.shown = false;
        this.selected = false;
        this.ajax = null;
        this.cache = [];
        this.ajaxTimeout = null;
        this.refresh();
        this.transferAttributes();
        this.listen();
    };

    Combobox.prototype = {

        constructor: Combobox

        , setup: function () {
            var $input = this.$element
            var $tmp = $("<span></span>")
            $input.after($tmp)

            var $container = $(this.template())
            $container.find(".input-group").prepend($input)
            $tmp.after($container)
            $tmp.remove()

            return $container
        }

        , disable: function() {
            this.$element.prop('disabled', true);
            this.$button.attr('disabled', true);
            this.disabled = true;
            this.$container.addClass('combobox-disabled');
        }

        , enable: function() {
            this.$element.prop('disabled', false);
            this.$button.attr('disabled', false);
            this.disabled = false;
            this.$container.removeClass('combobox-disabled');
        }
        , parse: function () {
            var that = this
                , map = {}
                , source = []
                , selected = false
                , selectedValue = '';

            var values = this.$element.data('values')
            if(values) {
                var valuesArray = values.split(",")
                for(var i in valuesArray) {
                    var value = valuesArray[i]
                    map[value] = value;
                    source.push(value);
                }
            }

            this.map = map;
            return source;
        }

        , transferAttributes: function() {
            this.options.placeholder = this.$element.attr('data-placeholder') || this.options.placeholder
            this.options.autocompleteUrl = this.$element.attr('data-autocomplete-url') || this.options.autocompleteUrl
            this.$element.attr('autocomplete', "off")
            if (this.$element.attr('disabled')!==undefined)
                this.disable();
        }

        , select: function () {
            var val = this.$menu.find('.active').attr('data-value');
            this.$element.val(this.updater(val)).trigger('change');
            this.$container.addClass('combobox-selected');
            this.selected = true;
            return this.hide();
        }

        , updater: function (item) {
            return item;
        }

        , show: function () {
            var pos = $.extend({}, this.$element.position(), {
                height: this.$element[0].offsetHeight
            });

            this.$menu
                .insertAfter(this.$element)
                .css({
                    top: pos.top + pos.height
                    , left: pos.left
                })
                .show();

            $('.dropdown-menu').on('mousedown', $.proxy(this.scrollSafety, this));

            this.shown = true;
            return this;
        }

        , hide: function () {
            this.$menu.hide();
            $('.dropdown-menu').off('mousedown', $.proxy(this.scrollSafety, this));
            this.$element.on('blur', $.proxy(this.blur, this));
            this.shown = false;
            return this;
        }

        , lookup: function (event) {
            var term = this.query = this.$element.val();
            var that = this
            var url = this.options.autocompleteUrl
            if(url){
                if ( term in this.cache ) {
                    this.process(this.cache[ term ]);
                    clearTimeout(this.ajaxTimeout);
                    return;
                }

                if(this.ajax){
                    this.ajax.abort()
                    this.ajax = null
                }
                clearTimeout(this.ajaxTimeout);
                this.ajaxTimeout = setTimeout(function(){
                    that.ajax = $.ajax({
                        url: url,
                        data: {term: term}
                    }).done(function(result){
                        that.cache[term] = result.terms
                        that.process(result.terms);
                    })
                }, 300)
            }else {
                this.process(this.source);
            }
        }

        , process: function (items) {
            var that = this;

            items = $.grep(items, function (item) {
                return that.matcher(item);
            })

            items = this.sorter(items);


            if (!items.length) {
                return this.shown ? this.hide() : this;
            }


            return this.render(items).show();
        }

        , template: function() {
            return '<div class="combobox-container"> <input type="hidden" /> <div class="input-group"> <span class="input-group-addon dropdown-toggle" data-dropdown="dropdown"> <span class="caret" /> <span class="glyphicon glyphicon-remove" /> </span> </div> </div>'
        }

        , matcher: function (item) {
            return ~item.toLowerCase().indexOf(this.query.toLowerCase());
        }

        , sorter: function (items) {
            var beginswith = []
                , caseSensitive = []
                , caseInsensitive = []
                , item;

            while (item = items.shift()) {
                if (!item.toLowerCase().indexOf(this.query.toLowerCase())) {beginswith.push(item);}
                else if (~item.indexOf(this.query)) {caseSensitive.push(item);}
                else {caseInsensitive.push(item);}
            }

            return beginswith.concat(caseSensitive, caseInsensitive);
        }

        , highlighter: function (item) {
            var query = this.query.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&');
            return item.replace(new RegExp('(' + query + ')', 'ig'), function ($1, match) {
                return '<strong>' + match + '</strong>';
            })
        }

        , render: function (items) {
            var that = this;

            items = $(items).map(function (i, item) {
                i = $(that.options.item).attr('data-value', item);
                i.find('a').html(that.highlighter(item));
                return i[0];
            })

            items.first().addClass('active');
            this.$menu.html(items);
            return this;
        }

        , next: function (event) {
            var active = this.$menu.find('.active').removeClass('active')
                , next = active.next();

            if (!next.length) {
                next = $(this.$menu.find('li')[0]);
            }

            next.addClass('active');
        }

        , prev: function (event) {
            var active = this.$menu.find('.active').removeClass('active')
                , prev = active.prev();

            if (!prev.length) {
                prev = this.$menu.find('li').last();
            }

            prev.addClass('active');
        }

        , toggle: function () {
            if (!this.disabled) {
                if (this.$container.hasClass('combobox-selected')) {
                    this.clearTarget();
                    this.triggerChange();
                    this.clearElement();
                } else {
                    if (this.shown) {
                        this.hide();
                    } else {
                        this.clearElement();
                        this.lookup();
                    }
                }
            }
        }

        , scrollSafety: function(e) {
            if (e.target.tagName == 'UL') {
                this.$element.off('blur');
            }
        }
        , clearElement: function () {
            this.$element.val('').focus();
            this.lookup()
        }

        , clearTarget: function () {
            this.$container.removeClass('combobox-selected');
            this.selected = false;
        }

        , selectTarget: function () {
            this.$container.addClass('combobox-selected');
            this.selected = true;
        }

        , triggerChange: function () {
            this.$element.trigger('change');
        }

        , refresh: function () {
            this.source = this.parse();
            this.options.items = this.source.length;
            if($.trim(this.$element.val())){
                this.selectTarget();
            }else {
                this.clearTarget();
            }
        }

        , listen: function () {
            this.$element
                .on('focus',    $.proxy(this.focus, this))
                .on('blur',     $.proxy(this.blur, this))
                .on('keypress', $.proxy(this.keypress, this))
                .on('keyup',    $.proxy(this.keyup, this));

            if (this.eventSupported('keydown')) {
                this.$element.on('keydown', $.proxy(this.keydown, this));
            }

            this.$menu
                .on('click', $.proxy(this.click, this))
                .on('mouseenter', 'li', $.proxy(this.mouseenter, this))
                .on('mouseleave', 'li', $.proxy(this.mouseleave, this));

            this.$button
                .on('click', $.proxy(this.toggle, this));
        }

        , eventSupported: function(eventName) {
            var isSupported = eventName in this.$element;
            if (!isSupported) {
                this.$element.setAttribute(eventName, 'return;');
                isSupported = typeof this.$element[eventName] === 'function';
            }
            return isSupported;
        }

        , move: function (e) {
            if (!this.shown) {return;}

            switch(e.keyCode) {
                case 9: // tab
                case 13: // enter
                case 27: // escape
                    e.preventDefault();
                    break;

                case 38: // up arrow
                    e.preventDefault();
                    this.prev();
                    break;

                case 40: // down arrow
                    e.preventDefault();
                    this.next();
                    break;
            }

            e.stopPropagation();
        }

        , keydown: function (e) {
            this.suppressKeyPressRepeat = ~$.inArray(e.keyCode, [40,38,9,13,27]);
            this.move(e);
        }

        , keypress: function (e) {
            if (this.suppressKeyPressRepeat) {return;}
            this.move(e);
        }

        , keyup: function (e) {
            switch(e.keyCode) {
                case 39: // right arrow
                case 38: // up arrow
                case 37: // left arrow
                case 36: // home
                case 35: // end
                case 16: // shift
                case 17: // ctrl
                case 18: // alt
                    break;

                case 9: // tab
                case 13: // enter
                    if (!this.shown) {return;}
                    this.select();
                    break;

                case 27: // escape
                    if (!this.shown) {return;}
                    this.hide();
                    break;

                default:
                    if($.trim(this.$element.val())){
                        this.selectTarget();
                    }else {
                        this.clearTarget();
                    }
                    this.lookup();
            }

            e.stopPropagation();
            e.preventDefault();
        }

        , focus: function (e) {
            this.focused = true;
            if(!$.trim(this.$element.val())) this.lookup()
        }

        , blur: function (e) {
            var that = this;
            this.focused = false;
            if (!this.mousedover && this.shown) {setTimeout(function () { that.hide(); }, 200);}
        }

        , click: function (e) {
            e.stopPropagation();
            e.preventDefault();
            this.select();
            this.$element.focus();
        }

        , mouseenter: function (e) {
            this.mousedover = true;
            this.$menu.find('.active').removeClass('active');
            $(e.currentTarget).addClass('active');
        }

        , mouseleave: function (e) {
            this.mousedover = false;
        }
    };

    /* COMBOBOX PLUGIN DEFINITION
     * =========================== */
    $.fn.inputCombobox = function ( option ) {
        return this.each(function () {
            var $this = $(this)
                , data = $this.data('combobox')
                , options = typeof option == 'object' && option;
            if(!data) {$this.data('combobox', (data = new Combobox(this, options)));}
            if (typeof option == 'string') {data[option]();}
        });
    };

    $.fn.inputCombobox.defaults = {
        menu: '<ul class="typeahead typeahead-long dropdown-menu"></ul>'
        , item: '<li><a href="#"></a></li>'
    };

    $.fn.inputCombobox.Constructor = Combobox;

}( window.jQuery );
