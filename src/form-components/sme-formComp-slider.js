"use strict";

const Core = require('../sme-main-core.js');

module.exports = function(RED) {
    function FormCompSliderNode(config) {
        RED.nodes.createNode(this, config);
        
        this.reference = config.reference;
        this.referenceType = config.referenceType;

        this.title = config.title;
        this.titleType = config.titleType;

        this.required = config.required;

        this.value = config.value;
        this.valueType = config.valueType;

        this.min = config.min;
        this.minType = config.minType;

        this.max = config.max;
        this.maxType = config.maxType;

        this.step = config.step;
        this.stepType = config.stepType;

        var node = this;

        node.on('input', function(msg, send, done) {
            send = send || function() { node.send.apply(node,arguments) }

            var core = new Core();
            var smeHelper = new core.SmeHelper();
            var smeFormMsg = smeHelper.getOrAddSendingFormMsg(msg);

            var referenceValue = smeHelper.getNodeConfigValue(node, msg, node.referenceType, node.reference);
            var titleValue = smeHelper.getNodeConfigValue(node, msg, node.titleType, node.title);
            var valueValue = smeHelper.getNodeConfigValue(node, msg, node.valueType, node.value);
            var minValue = smeHelper.getNodeConfigValue(node, msg, node.minType, node.min);
            var maxValue = smeHelper.getNodeConfigValue(node, msg, node.maxType, node.max);
            var stepValue = smeHelper.getNodeConfigValue(node, msg, node.stepType, node.step);

            if (smeFormMsg && smeFormMsg.dataComponent && smeFormMsg.dataComponent.formComponents) {
                var component = {
                    refName: referenceValue || "",
                    formComponentType: "slider",
                    title: titleValue || "",
                    requiredSelection: node.required == "1",
                    value: valueValue || 0,
                    min: minValue || 0,
                    max: maxValue || 10,
                    step: stepValue || 1
                };
                smeFormMsg.dataComponent.formComponents.push(component);
            }

            send(msg);

            done && done();
        });
    }
    RED.nodes.registerType("sme-formComp-slider", FormCompSliderNode);
}