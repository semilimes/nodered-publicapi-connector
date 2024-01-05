"use strict";

const Core = require('../sme-main-core.js');

module.exports = function(RED) {
    function CompTextNode(config) {
        RED.nodes.createNode(this, config);

        this.text = config.text;
        this.textType = config.textType;

        var node = this;

        node.on('input', function(msg, send, done) {
            send = send || function() { node.send.apply(node,arguments) }
            if (node.text) {
                var core = new Core();
                var smeHelper = new core.SmeHelper();

                var textValue = smeHelper.getNodeConfigValue(node, msg, node.textType, node.text);
                if (textValue) {
                    var smeMsg = {
                        dataComponent: {
                            dataComponentType: "text",
                            text: textValue
                        }
                    };
                    smeHelper.addSendingMsg(msg, smeMsg);
                }
            }

            send(msg);

            done && done();
        });
    }
    RED.nodes.registerType("sme-comp-text", CompTextNode);
}