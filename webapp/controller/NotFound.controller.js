sap.ui.define([
	"plaut/controller/BaseController"
], function(BaseController) {
	"use strict";

	return BaseController.extend("plaut.controller.NotFound", {

		/**
		 * Navigates to the worklist when the link is pressed
		 * @public
		 */
		onLinkPressed: function() {
			this.getRouter().navTo("worklist");
		}

	});

});