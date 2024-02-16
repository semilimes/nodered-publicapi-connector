"use strict";

const Core = require('../sme-main-core.js');

module.exports = function(RED) {
    function FormComponentNode(config) {
        RED.nodes.createNode(this, config);
        
        this.reference = config.reference;
        this.referenceType = config.referenceType;
        this.saveLocation = config.saveLocation;
        this.saveLocationType = config.saveLocationType;

        this.component = config.component;

        this.title = config.title;
        this.titleType = config.titleType;

        this.required = config.required;

        this.text = config.text;
        this.textType = config.textType;

        this.verticalList = config.verticalList;
        this.buttons = config.buttons;

        var node = this;

        node.on('input', function(msg, send, done) {
            send = send || function() { node.send.apply(node,arguments) }
            if (node.title) {
                var core = new Core();
                var smeHelper = new core.SmeHelper();
                var smeFormMsg = smeHelper.getOrAddSendingFormMsg(msg);

                var referenceValue = smeHelper.getNodeConfigValue(node, msg, node.referenceType, node.reference);

                if(smeFormMsg && smeFormMsg.dataComponent && smeFormMsg.dataComponent.formComponents) {
                    smeFormMsg.dataComponent.formComponents.push({
                        refName: referenceValue || "",
                        formComponentType: "label",
                        title: node.title
                    });
                }
            }

            send(msg);

            done && done();
        });
    }
    RED.nodes.registerType("formComponent", FormComponentNode);
}