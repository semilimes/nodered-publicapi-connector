"use strict";

const Core = require('../sme-main-core.js');

module.exports = function(RED) {
    function CompHtmlNode(config) {
        RED.nodes.createNode(this, config);

        this.html = config.html;
        this.htmlType = config.htmlType;

        var node = this;

        node.on('input', function(msg, send, done) {
            send = send || function() { node.send.apply(node,arguments) }
            if (node.html) {
                var core = new Core();
                var smeHelper = new core.SmeHelper();

                var htmlValue = smeHelper.getNodeConfigValue(node, msg, node.htmlType, node.html);
                if (htmlValue) {
                    var smeMsg = {
                        dataComponent: {
                            dataComponentType: "html",
                            html: htmlValue
                        }
                    };
                    smeHelper.addSendingMsg(msg, smeMsg);
                }
            }

            send(msg);

            done && done();
        });
    }
    RED.nodes.registerType("sme-comp-html", CompHtmlNode);
}