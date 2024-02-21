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

            //Checking if there is a form saved and ui input validity
            if (formMsg && 
                formMsg.dataComponentType == "form" &&
                compRefNameValue && 
                compValueValue !== undefined) {
                    //Checking if the saved form has the component to update
                    if (formMsg.formComponents) {
                        var component = formMsg.formComponents.find(comp => comp.refName == compRefNameValue);
                        if (component) {
                            //Updating the value
                            component.value = compValueValue;
                        }
                    } 
            }

            send(msg, false);
            done && done();        

        });
    };

    RED.nodes.registerType("formUpdater", SmeFormUpdaterNode);
};