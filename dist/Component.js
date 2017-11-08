sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"plaut/model/models",
	"plaut/controller/ErrorHandler"
], function(UIComponent, Device, models, ErrorHandler) {
	"use strict";
	
	//Hello World'

	return UIComponent.extend("plaut.Component", {

		metadata: {
			"version": "1.0.0",
			"rootView": {
				"viewName": "plaut.view.App",
				"type": "XML",
				"id": "app"
			},
			"dependencies": {
				"libs": ["sap.ui.core", "sap.m", "sap.ui.layout"]
			},
			"config": {
				"i18nBundle": "plaut.i18n.i18n",
				"serviceUrl": "/sap/opu/odata/sap/ZGWEPM_SALESORDERS_SRV/",
				"icon": "",
				"favIcon": "",
				"phone": "",
				"phone@2": "",
				"tablet": "",
				"tablet@2": ""
			},
			"routing": {
				"config": {
					"routerClass": "sap.m.routing.Router",
					"viewType": "XML",
					"viewPath": "plaut.view",
					"controlId": "app",
					"controlAggregation": "pages",
					"bypassed": {
						"target": "notFound"
					}
				},
				
				rootView: "plaut.view.Worklist",

				"routes": [{
					"pattern": "",
					"name": "worklist",
					"target": "worklist"
				}, {
					"pattern": "SalesOrderSet/{objectId}",
					"name": "object",
					"target": "object"
				}],

				"targets": {
					"worklist": {
						"viewName": "Worklist",
						"viewId": "worklist",
						"viewLevel": 1
					},
					"object": {
						"viewName": "Object",
						"viewId": "object",
						"viewLevel": 2
					},
					"objectNotFound": {
						"viewName": "ObjectNotFound",
						"viewId": "objectNotFound"
					},
					"notFound": {
						"viewName": "NotFound",
						"viewId": "notFound"
					}
				}
			}
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * In this function, the resource and application models are set and the router is initialized.
		 * @public
		 * @override
		 */
		init: function() {
			
			var mConfig = this.getMetadata().getConfig();

			// create and set the ODataModel
			/*var oModel = models.createODataModel({
				urlParametersForEveryRequest: [
					"sap-server",
					"sap-client",
					"sap-language"
				],
				url: this.getMetadata().getConfig().serviceUrl,
				config: {
					metadataUrlParams: {
						"sap-documentation": "heading"
					}
				}
			});*/
			
			var oModel = new sap.ui.model.odata.v2.ODataModel(mConfig.serviceUrl);
			this.setModel(oModel);
			
			sap.ui.getCore().setModel(oModel, 'oModel');
			var jsonModel = new sap.ui.model.json.JSONModel();
			
			jsonModel.setData(oModel);
			sap.ui.getCore().setModel(jsonModel, 'JSONMODEL');
			this.setModel(jsonModel, 'JSONMODEL');
			
			this._createMetadataPromise(oModel);
			// set the i18n model
			this.setModel(models.createResourceModel(mConfig.i18nBundle), "i18n");
/*
			// set the device model
			this.setModel(models.createDeviceModel(), "device");
			// set the FLP model
			this.setModel(models.createFLPModel(), "FLP");*/

		var oDeviceModel = new sap.ui.model.json.JSONModel({
			isTouch: sap.ui.Device.support.touch,
			isNoTouch: !sap.ui.Device.support.touch,
			isPhone: sap.ui.Device.system.phone,
			isNoPhone: !sap.ui.Device.system.phone,
			listMode: sap.ui.Device.system.phone ? "None" : "SingleSelectMaster",
			listItemType: sap.ui.Device.system.phone ? "Active" : "Inactive"
		});
		oDeviceModel.setDefaultBindingMode("OneWay");
		this.setModel(oDeviceModel, "device");
		
			// initialize the error handler with the component
			this._oErrorHandler = new ErrorHandler(this);

			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			// create the views based on the url/hash
			this.getRouter().initialize();
		},

		/**
		 * The component is destroyed by UI5 automatically.
		 * In this method, the ErrorHandler are destroyed.
		 * @public
		 * @override
		 */
		destroy: function() {
			this._oErrorHandler.destroy();
			this.getModel().destroy();
			this.getModel("i18n").destroy();
			this.getModel("FLP").destroy();
			this.getModel("device").destroy();
			// call the base component's destroy function
			UIComponent.prototype.destroy.apply(this, arguments);
		},

		/**
		 * This method can be called to determine whether the sapUiSizeCompact or sapUiSizeCozy
		 * design mode class should be set, which influences the size appearance of some controls.
		 * @public
		 * @return {string} css class, either 'sapUiSizeCompact' or 'sapUiSizeCozy' - or an empty string if no css class should be set
		 */
		getContentDensityClass: function() {
			if (this._sContentDensityClass === undefined) {
				// check whether FLP has already set the content density class; do nothing in this case
				if (jQuery(document.body).hasClass("sapUiSizeCozy") || jQuery(document.body).hasClass("sapUiSizeCompact")) {
					this._sContentDensityClass = "";
				} else if (!Device.support.touch) { // apply "compact" mode if touch is not supported
					this._sContentDensityClass = "sapUiSizeCompact";
				} else {
					// "cozy" in case of touch support; default for most sap.m controls, but needed for desktop-first controls like sap.ui.table.Table
					this._sContentDensityClass = "sapUiSizeCozy";
				}
			}
			return this._sContentDensityClass;
		},

		/**
		 * Creates a promise which is resolved when the metadata is loaded.
		 * @param {sap.ui.core.Model} oModel the app model
		 * @private
		 */
		_createMetadataPromise: function(oModel) {
			this.oWhenMetadataIsLoaded = new Promise(function(fnResolve, fnReject) {
				oModel.attachEventOnce("metadataLoaded", fnResolve);
				oModel.attachEventOnce("metadataFailed", fnReject);
			});
		}

	});

});
