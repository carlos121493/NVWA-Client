define([
        'backbone',
        'underscore',
        'text!js/producer/template/deleteOIConfirm.html'
    ],
    function(Backbone, _, ConfrimTpl) {
        var DeleteOIConfirm = Backbone.View.extend({
            events: {},
            /**
             * 初始化
             * @param  {[type]} options [description]
             * @param  {[type]} config  [description]
             * @return {[type]}         [description]
             */
            initialize: function(options, config) {
                var t = this;
                config = $.extend({

                }, config);
                t.config = config;
                t.options = options;
                t.render();
            },
            /**
             * 渲染页面
             * @return {[type]} [description]
             */
            render: function() {
                var t = this;
                t.$el.html(_.template(ConfrimTpl, {
                    options: t.options,
                    config: t.config
                }));
                return t;
            }
        });
        return DeleteOIConfirm;
    });