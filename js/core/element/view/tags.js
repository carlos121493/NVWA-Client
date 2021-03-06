define([
	'backbone', 'underscore', 'js/core/element/view/text',
	'tags_input',
	'css!bower_components/bootstrap-tagsinput/build/bootstrap-tagsinput'
], function(Backbone, _, TextView) {
	var TagsView = TextView.extend({
		events: {},
		initialize: function(options, eleBean, attributes, eves, editAble) {
			var t = this;
			TextView.prototype.initialize.apply(t, arguments);
			t.$el.find("input").tagsinput();
		},
		supportAttribute: function() {
			return ['helpLabel', 'placeholder', 'feedback', 'validateConfig'];
		}
	});
	return TagsView;
});