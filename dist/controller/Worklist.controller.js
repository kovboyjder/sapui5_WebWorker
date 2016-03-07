var w; 
var jsonArray1 = [];
sap.ui.define([
	"plaut/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"plaut/model/formatter"
], function(BaseController, JSONModel, formatter) {
	"use strict";

	return BaseController.extend("plaut.controller.Worklist", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit: function() {
			var oViewModel,
				iOriginalBusyDelay,
				oTable = this.byId("table");

			// Put down worklist table's original value for busy indicator delay,
			// so it can be restored later on. Busy handling on the table is
			// taken care of by the table itself.
			iOriginalBusyDelay = oTable.getBusyIndicatorDelay();

			
			oViewModel = sap.ui.getCore().getModel('JSONMODEL');
			this.setModel(oViewModel, "worklistView");

			// Make sure, busy indication is showing immediately so there is no
			// break after the busy indication for loading the view's meta data is
			// ended (see promise 'oWhenMetadataIsLoaded' in AppController)
			oTable.attachEventOnce("updateFinished", function() {
				// Restore original busy indicator delay for worklist's table
				oViewModel.setProperty("/tableBusyDelay", iOriginalBusyDelay);
			});
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Triggered by the table's 'updateFinished' event: after new table
		 * data is available, this handler method updates the table counter.
		 * This should only happen if the update was successful, which is
		 * why this handler is attached to 'updateFinished' and not to the
		 * table's list binding's 'dataReceived' method.
		 * @param {sap.ui.base.Event} oEvent the update finished event
		 * @public
		 */
		onUpdateFinished: function(oEvent) {
			// update the worklist's object counter after the table update
			var sTitle,
				oTable = oEvent.getSource(),
				iTotalItems = oEvent.getParameter("total");
			// only update the counter if the length is final and
			// the table is not empty
			if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
				sTitle = this.getResourceBundle().getText("worklistTableTitleCount", [iTotalItems]);
			} else {
				sTitle = this.getResourceBundle().getText("worklistTableTitle");
			}
			this.getModel("worklistView").setProperty("/worklistTableTitle", sTitle);
			// Create an array to put in the entries we need to update
			var jsonArray = [];
			
			// Map reduce to get the object into the array
			var array = $.map(sap.ui.core.Core().getModel("JSONMODEL").oData.oData, function(value, index) {
				var itemSet = value.__metadata.id + "/SalesOrderItemSet";
				jsonArray.push(itemSet);

			});
			var that = this;
			
			var jsonModel = new sap.ui.model.json.JSONModel();
			// Initialise the web worker
			if (typeof(Worker) !== "undefined" && typeof(Promise) !== "undefined") {
				if(typeof(w) == "undefined") {
					w = new Worker("./demo_workers.js");
					sap.m.MessageToast.show("Starts caching item data now");
				}
				else{
				// If the web worker is already running, terminate it so we won't get two running at the same time
					w.terminate();
					w = undefined;
					w = new Worker("./demo_workers.js");
				}
				// Post message to web worker if the jsonArray1 is already filled out, then we start the latest entry
				w.postMessage("initial~" +jsonArray.toString() +"~" +jsonArray1.length);
				w.onmessage = function(entry) {
					if (entry.data === "Done"){
						sap.m.MessageToast.show("All Done");
						//w.postMessage("next:" +this.getView().getModel().sServiceUrl);
					}
					else{
					var newEntry = entry.data;
					jsonArray1.push(newEntry);
					jsonModel.setData({modelData : jsonArray1});
					sap.ui.getCore().setModel(jsonModel, 'OrderDetails');
					}
				};

			}
		},

		/**
		 * Event handler when a table item gets pressed
		 * @param {sap.ui.base.Event} oEvent the table selectionChange event
		 * @public
		 */
		onPress: function(oEvent) {
			// The source is the list item that got pressed
			this._showObject(oEvent.getSource());
		},

		/**
		 * Navigates back in the browser history, if the entry was created by this app.
		 * If not, it navigates to the Fiori Launchpad home page.
		 * @public
		 */
		onNavBack: function() {
			var oHistory = sap.ui.core.routing.History.getInstance(),
				sPreviousHash = oHistory.getPreviousHash(),
				oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");

			if (sPreviousHash !== undefined) {
				// The history contains a previous entry
				history.go(-1);
			} else {
				// Navigate back to FLP home
				oCrossAppNavigator.toExternal({
					target: {
						shellHash: "#"
					}
				});
			}
		},

		/**
		 * Event handler when the share in JAM button has been clicked
		 * @public
		 */
		onShareInJamPress: function() {
			var oViewModel = this.getModel("worklistView"),
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

		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */

		/**
		 * Shows the selected item on the object page
		 * On phones a additional history entry is created
		 * @param {sap.m.ObjectListItem} oItem selected Item
		 * @private
		 */
		_showObject: function(oItem) {
			this.getRouter().navTo("object", {
				objectId: oItem.getBindingContext().getProperty("SoId")
			});
		},

		/**
		 * Sets the item count on the worklist view header
		 * @param {integer} iTotalItems the total number of items in the table
		 * @private
		 */
		_updateListItemCount: function(iTotalItems) {
			var sTitle;
			// only update the counter if the length is final
			if (this._oTable.getBinding("items").isLengthFinal()) {
				sTitle = this.getResourceBundle().getText("worklistTableTitleCount", [iTotalItems]);
				this.oViewModel.setProperty("/worklistTableTitle", sTitle);
			}
		}

	});

});