"use strict";

const Core = require('../sme-main-core.js');

module.exports = function(RED) {
    function FormCompBucketPickerNode(config) {
        RED.nodes.createNode(this, config);
        
        this.reference = config.reference;
        this.referenceType = config.referenceType;

        this.title = config.title;
        this.titleType = config.titleType;

        this.required = config.required;

        this.bucketType = config.bucketType;

        this.actionButtonTitle = config.actionButtonTitle;
        this.actionButtonTitleType = config.actionButtonTitleType;

        this.multiSelection = config.multiSelection;

        var node = this;

        node.on('input', function(msg, send, done) {
            send = send || function() { node.send.apply(node,arguments) }
            
            var core = new Core();
            var smeHelper = new core.SmeHelper();
            var smeFormMsg = smeHelper.getOrAddSendingFormMsg(msg);

            var referenceValue = smeHelper.getNodeConfigValue(node, msg, node.referenceType, node.reference);
            var titleValue = smeHelper.getNodeConfigValue(node, msg, node.titleType, node.title);
            var actionButtonTitleValue = smeHelper.getNodeConfigValue(node, msg, node.actionButtonTitleType, node.actionButtonTitle);

            var bucketTypesArray = [];
            if (node.bucketType == "all") {
                bucketTypesArray.push("post");
                bucketTypesArray.push("profile");
                bucketTypesArray.push("groupchat");
                bucketTypesArray.push("channel");
            } else {
                bucketTypesArray.push(node.bucketType);
            }

            if(smeFormMsg && smeFormMsg.dataComponent && smeFormMsg.dataComponent.formComponents) {
                smeFormMsg.dataComponent.formComponents.push({
                    refName: referenceValue || "",
                    formComponentType: "bucketpicker",
                    title: titleValue,
                    requiredSelection: false,
                    value: [],
                    filter: {
                        types: bucketTypesArray
                    },
                    actionButtonTitle: actionButtonTitleValue || "Select Bucket(s)",
                    multiSelection: node.multiSelection == "1"
                });
            }

            send(msg);

            done && done();
        });
    }
    RED.nodes.registerType("sme-formComp-bucketPicker", FormCompBucketPickerNode);
}