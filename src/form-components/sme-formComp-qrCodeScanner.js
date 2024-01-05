"use strict";

const Core = require('../sme-main-core.js');

module.exports = function(RED) {
    function FormCompQRCodeScannerNode(config) {
        RED.nodes.createNode(this, config);
        
        this.reference = config.reference;
        this.referenceType = config.referenceType;

        this.title = config.title;
        this.titleType = config.titleType;

        this.required = config.required;

        this.actionButtonTitle = config.actionButtonTitle;
        this.actionButtonTitleType = config.actionButtonTitleType;

        var node = this;

        node.on('input', function(msg, send, done) {
            send = send || function() { node.send.apply(node,arguments) }
            
            var core = new Core();
            var smeHelper = new core.SmeHelper();
            var smeFormMsg = smeHelper.getOrAddSendingFormMsg(msg);

            var referenceValue = smeHelper.getNodeConfigValue(node, msg, node.referenceType, node.reference);
            var titleValue = smeHelper.getNodeConfigValue(node, msg, node.titleType, node.title);
            var actionButtonTitleValue = smeHelper.getNodeConfigValue(node, msg, node.actionButtonTitleType, node.actionButtonTitle);


            if(smeFormMsg && smeFormMsg.dataComponent && smeFormMsg.dataComponent.formComponents) {
                smeFormMsg.dataComponent.formComponents.push({
                    refName: referenceValue || "",
                    formComponentType: "qrcodescanner",
                    title: titleValue,
                    requiredSelection: false,
                    value: "",
                    actionButtonTitle: actionButtonTitleValue || "Scan QR Code",
                });
            }

            send(msg);

            done && done();
        });
    }
    RED.nodes.registerType("sme-formComp-qrCodeScanner", FormCompQRCodeScannerNode);
}