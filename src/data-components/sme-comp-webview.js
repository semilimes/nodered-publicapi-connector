"use strict";

const Core = require('../sme-main-core.js');

module.exports = function(RED) {
    function CompWebviewNode(config) {
        RED.nodes.createNode(this, config);

        this.url = config.url;
        this.urlType = config.urlType;
        this.enableFullScreenView = config.enableFullScreenView;
        this.viewSize = config.viewSize || "1:2";

        var node = this;

        node.on('input', function(msg, send, done) {
            send = send || function() { node.send.apply(node,arguments) }
            if (node.url) {
                var core = new Core();
                var smeHelper = new core.SmeHelper();

                var urlValue = smeHelper.getNodeConfigValue(node, msg, node.urlType, node.url);

                if (urlValue) {
                    var smeMsg = {
                        dataComponentType: "webView",
                        url: urlValue,
                        enableFullScreenView: node.enableFullScreenView == "1",
                        viewSize: node.viewSize
                    };
                    smeHelper.addSendingMsg(msg, smeMsg);
                }
            }

            send(msg);

            done && done();
        });
    }
    RED.nodes.registerType("sme-comp-webview", CompWebviewNode);
}