"use strict";

const Core = require('./../sme-main-core.js');

module.exports = function(RED) {
    function FormCompTextBoxNode(config) {
        RED.nodes.createNode(this, config);
        
        this.reference = config.reference;
        this.referenceType = config.referenceType;

        this.title = config.title;
        this.titleType = config.titleType;

        this.required = config.required;

        this.text = config.text;

        var node = this;

        node.on('input', function(msg, send, done) {
            send = send || function() { node.send.apply(node,arguments) }
            if (node.text) {
                var core = new Core();
                var smeHelper = new core.SmeHelper();
                var smeFormMsg = smeHelper.getOrAddSendingFormMsg(msg);

                var referenceValue = smeHelper.getNodeConfigValue(node, msg, node.referenceType, node.reference);
                var titleValue = smeHelper.getNodeConfigValue(node, msg, node.titleType, node.title);

                if(smeFormMsg && smeFormMsg.dataComponent && smeFormMsg.dataComponent.formComponents) {
                    smeFormMsg.dataComponent.formComponents.push({
                        refName: referenceValue || "",
                        formComponentType: "textbox",
                        title: titleValue || "",
                        requiredSelection: node.required == "1",
                        value: msg.text || node.text || ""
                    });
                }
            }

            send(msg);

            done && done();
        });
    }
    RED.nodes.registerType("sme-formComp-textBox", FormCompTextBoxNode);
}