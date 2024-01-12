"use strict";

const Core = require('./sme-main-core.js');

module.exports = function (RED) {

    function SmeFormUpdaterNode(config) {
        RED.nodes.createNode(this, config);
        
        var node = this;
        
        node.location = config.location;
        node.locationType = config.locationType;
        node.compRefName = config.compRefName;
        node.compRefNameType = config.compRefNameType;
        node.compValue = config.compValue;
        node.compValueType = config.compValueType;

        node.on('input', function (msg, send, done) {
            send = send || function () { node.send.apply(node, arguments) };

            var core = new Core();
            var smeHelper = new core.SmeHelper();
            var formMsg = smeHelper.getNodeConfigValue(node, msg, node.locationType, node.location);
            var compRefNameValue = smeHelper.getNodeConfigValue(node, msg, node.compRefNameType, node.compRefName);
            var compValueValue = smeHelper.getNodeConfigValue(node, msg, node.compValueType, node.compValue);

            node.log(`formMsg: ${formMsg}`);
            node.log(`formMsg.dataComponentType: ${formMsg.dataComponentType}`);
            node.log(`compRefNameValue: ${compRefNameValue}`);
            node.log(`compValueValue: ${compValueValue}`);
            //Checking if there is a form saved and ui input validity
            if (formMsg && 
                formMsg.dataComponentType == "form" &&
                compRefNameValue && 
                compValueValue !== undefined) {
                    //Checking if the saved form has the component to update
                    if (formMsg.formComponents) {
                        var component = formMsg.formComponents.find(comp => comp.refName == compRefNameValue);
                        node.log(`component: ${component}`);
                        if (component) {
                            //Updating the value
                            node.log(`Updating ${component.refName} form component value from ${component.value} to ${compValueValue}`);
                            component.value = compValueValue;
                        }
                    } 
            }

            send(msg, false);
            done && done();        

        });
    };

    RED.nodes.registerType("sme-main-formUpdater", SmeFormUpdaterNode);
};