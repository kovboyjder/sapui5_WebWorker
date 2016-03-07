/*global location*/
sap.ui.define([
	"plaut/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"plaut/model/formatter"
], function(BaseController, JSONModel, History, formatter) {
	"use strict";

	return BaseController.extend("plaut.controller.Object", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit: function() {
			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			var iOriginalBusyDelay,
				oViewModel = new JSONModel({
					busy: true,
					delay: 0
				});

			/*var jsonModel = new sap.ui.model.json.JSONModel();
			var oData = JSON.parse(sap.ui.getCore().getModel("OrderDetails").getJSON());
			jsonModel.setData(oData);

			oList.setModel(jsonModel);*/
			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);
			// Store original busy indicator delay, so it can be restored later on
			iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();
			this.setModel(oViewModel, "objectView");
			this.getOwnerComponent().oWhenMetadataIsLoaded.then(function() {
				// Restore original busy indicator delay for the object view
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			});
		},

		onBeforeRendering: function() {

		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Event handler when the share in JAM button has been clicked
		 * @public
		 */
		onShareInJamPress: function() {
			var oViewModel = this.getModel("objectView"),
				oShareDialog = sap.ui.getCore().createComponent({
					name: "sap.collaboration.components.fiori.sharing.dialog",
					settings: {
						object: {
							id: location.href,
							share: oViewModel.getProperty("/shareOnJamTitle")
						}
					}
				});
			oShareDialog.open();
		},

		/**
		 * Event handler  for navigating back.
		 * It checks if there is a history entry. If yes, history.go(-1) will happen.
		 * If not, it will replace the current entry of the browser history with the worklist route.
		 * @public
		 */
		onNavBack: function() {
			var oHistory = History.getInstance();
			var sPreviousHash = oHistory.getPreviousHash();
			
			sap.ui.getCore().byId("list").destroy();

			if (sPreviousHash !== undefined) {
				// The history contains a previous entry
				history.go(-1);
			} else {
				// Otherwise we go backwards with a forward history
				var bReplace = true;
				this.getRouter().navTo("worklist", {}, bReplace);
			}
		},

		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */

		/**
		 * Binds the view to the object path.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onObjectMatched: function(oEvent) {
			var sObjectId = oEvent.getParameter("arguments").objectId;
			this.getOwnerComponent().oWhenMetadataIsLoaded.then(function() {
				var sObjectPath = this.getModel().createKey("SalesOrderSet", {
					SoId: sObjectId
				});
				this._bindView("/" + sObjectPath, sObjectId);
			}.bind(this));

		},

		/**
		 * Binds the view to the object path.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound
		 * @private
		 */
		_bindView: function(sObjectPath, sObjectId) {
			var oViewModel = this.getModel("objectView");

			this.getView().bindElement({
				path: sObjectPath,
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function() {
						this.getOwnerComponent().oWhenMetadataIsLoaded.then(function() {
							// Busy indicator on view should only be set if metadata is loaded,
							// otherwise there may be two busy indications next to each other on the
							// screen. This happens because route matched handler already calls '_bindView'
							// while metadata is loaded.
							oViewModel.setProperty("/busy", true);
						});
					}.bind(this),
					dataReceived: function() {
						oViewModel.setProperty("/busy", false);
					}
				}
			});
			var count = 0;
			// Add update the list binding
			var jsonModel = new sap.ui.model.json.JSONModel();
			try {
				// First see if we have any cached entries
				var oData = JSON.parse(sap.ui.getCore().getModel("OrderDetails").getJSON());
				var found = "false";
				for (var i = 0; i < oData.modelData.length; i++) {
					var obj = oData.modelData[i];
					if (obj.results[0].SoId === sObjectId) {
						// The entry we are looking for is cached already
						found = "true";
						break;

					} else {
						count++;
					}
				}
				if (found === "true") {
					var itemTemplate = new sap.m.StandardListItem({
						title: "{SoItemPos}",
						iconInset: false
					});
					jsonModel.setData(oData);
					var oList = new sap.m.List("list");
					oList.setModel(jsonModel);
					oList.bindAggregation("items", "/modelData/" + count + "/results", itemTemplate);
					jsonModel.updateBindings(true);
					this.getView().byId("page").addContent(oList);
				} else {
					// We couldn't find the cached entry, load from backend instead
					this.loadBackup(sObjectPath);
				}
			} catch (e) {
				// No entries were cached, load from backend.
				this.loadBackup(sObjectPath);
			}
		},

		loadBackup: function(sObjectPath) {
			var itemTemplate = new sap.m.StandardListItem({
				title: "{SoItemPos}",
				iconInset: false
			});
			var oList = new sap.m.List("list");
			oList.setModel(this.getView().getModel());
			oList.bindAggregation("items", sObjectPath + "/SalesOrderItemSet", itemTemplate);
			this.getView().byId("page").addContent(oList);
		},

		_onBindingChange: function() {
			var oView = this.getView(),
				oViewModel = this.getModel("objectView"),
				oElementBinding = oView.getElementBinding();

			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("objectNotFound");
				return;
			}

			var oResourceBundle = this.getResourceBundle(),
				oObject = oView.getBindingContext().getObject(),
				sObjectId = oObject.SoId,
				sObjectName = oObject.SoId;

			// Everything went fine.
			oViewModel.setProperty("/busy", false);
			oViewModel.setProperty("/saveAsTileTitle", oResourceBundle.getText("saveAsTileTitle", [sObjectName]));
			oViewModel.setProperty("/shareOnJamTitle", sObjectName);
			oViewModel.setProperty("/shareSendEmailSubject",
				oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
			oViewModel.setProperty("/shareSendEmailMessage",
				oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));
		}

	});

});