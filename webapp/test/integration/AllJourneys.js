jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
jQuery.sap.require("sap.ui.test.opaQunit");
jQuery.sap.require("sap.ui.test.Opa5");

jQuery.sap.require("plaut.test.integration.pages.Common");
jQuery.sap.require("plaut.test.integration.pages.Worklist");
jQuery.sap.require("plaut.test.integration.pages.Object");
jQuery.sap.require("plaut.test.integration.pages.NotFound");
jQuery.sap.require("plaut.test.integration.pages.Browser");
jQuery.sap.require("plaut.test.integration.pages.App");

sap.ui.test.Opa5.extendConfig({
	arrangements: new plaut.test.integration.pages.Common(),
	viewNamespace: "plaut.view."
});

// Start the tests
jQuery.sap.require("plaut.test.integration.WorklistJourney");
jQuery.sap.require("plaut.test.integration.ObjectJourney");
jQuery.sap.require("plaut.test.integration.NavigationJourney");
jQuery.sap.require("plaut.test.integration.NotFoundJourney");
jQuery.sap.require("plaut.test.integration.FLPIntegrationJourney");