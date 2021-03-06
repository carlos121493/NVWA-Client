define([
	'underscore',
	'text!js/producer/template/editorPageAttribute.html',
	'js/util/string',
	'js/util/ui/view/modal',
	'achy/widget/ui/message',
	'js/util/api/mc',
	'js/producer/view/editorContainerAttribute',
	'js/core/element/view/multipleContainerSelect',
], function(_, EditorPageAttributeTpl, StringUtil, Modal, Message, MC, EditorContainerAttribute, MultipleContainerSelectView) {
	var PageAttributeView = EditorContainerAttribute.extend({
		events: $.extend(EditorContainerAttribute.prototype.events, {
			'click .btn-remove': '_delete',
			'click [debug="setValue"]': '_debugSet',
			'click [debug="getValue"]': '_debugGet',
		}),
		initialize: function(options, config, events) {
			EditorContainerAttribute.prototype.initialize.apply(this, arguments);
		},
		render: function() {
			var t = this;
			t.$el.html(_.template(EditorPageAttributeTpl, {
				options: t.options
			}));
			t.initControl();
			t.showControl();
			t.setFormEvent();
		},
		loadForm: function() {
			var t = this;
			var serverAttribute = t.config.serverAttribute;
			var __setFormValue = function(attr) {
				if (attr) {
					$.each(attr, function(k, item) {
						t.setForm(k, item);
					});
				}
			};
			//set form server attribute
			__setFormValue(serverAttribute);
		},
		//设置表单事件
		setFormEvent: function() {
			var t = this;
			var __updateServerAttribute = function(name, value, success, error) {
				var saveData = {
					pageId: t.config.pageBean.id
				}
				if ($nvwa.string.isVerify(name)) {
					saveData[name] = value;
					MC.updatePageServerAttribute(saveData, function(data) {
						if (data && data.ok) {
							if (success) {
								success(data.dataMap);
							}
						} else {
							if (error) {
								error();
							}
						}
					});
				} else {
					_log('no save server attribute name');
				}
			};
			var t = this;
			t.$el.find('.containerAliasListContainer').on('containerSelectedChange', function(e, data) {
				var value = t.containerAliasList.getValue();
				__updateServerAttribute('containerAliasList', value, function() {
					//success
					new Message({
						type: 'info',
						msg: '更新容器列表成功',
						timeout: 1500
					});
				}, function() {
					//error
					new Message({
						type: 'info',
						msg: '更新容器列表失败',
						timeout: 1500
					});
				});
			});
		},
		initControl: function() {
			var t = this;
			t.containerAliasList = new MultipleContainerSelectView({
				el: t.$el.find('.containerAliasListContainer')
			}, {}, {});
		},
		setForm: function(fieldName, value) {
			var t = this;
			switch (fieldName) {
				case 'containerAliasList':
					t.containerAliasList.setValue(value);
					break;
				default:
					t.$el.find('[fieldName="' + fieldName + '"]').val(value);
					break;
			}
		}
	});
	return PageAttributeView;
});