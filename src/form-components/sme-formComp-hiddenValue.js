"use strict";

const Core = require('../sme-main-core.js');

module.exports = function(RED) {
    function FormCompHiddenValueNode(config) {
        RED.nodes.createNode(this, config);
        
        this.reference = config.reference;
        this.referenceType = config.referenceType;

        this.text = config.text;

        var node = this;

        node.on('input', function(msg, send, done) {
            send = send || function() { node.send.apply(node,arguments) }
            if (node.text) {
                var core = new Core();
                var smeHelper = new core.SmeHelper();
                var smeFormMsg = smeHelper.getOrAddSendingFormMsg(msg);

                var referenceValue = smeHelper.getNodeConfigValue(node, msg, node.referenceType, node.reference);

                if(smeFormMsg && smeFormMsg.dataComponent && smeFormMsg.dataComponent.formComponents) {
                    smeFormMsg.dataComponent.formComponents.push({
                        refName: referenceValue || "",
                        formComponentType: "hiddenvalue",
                        title: "",
                        requiredSelection: false,
                        value: node.text
                    });
                }
            }

            send(msg);

            done && done();
        });
    }
    RED.nodes.registerType("sme-formComp-hiddenValue", FormCompHiddenValueNode);
}