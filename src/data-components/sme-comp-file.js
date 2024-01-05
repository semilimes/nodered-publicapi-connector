"use strict";

const Core = require('../sme-main-core.js');

module.exports = function(RED) {
    function CompFileNode(config) {
        RED.nodes.createNode(this, config);

        this.fileIds = config.fileIds;
        this.fileIdsType = config.fileIdsType;

        var node = this;

        node.on('input', function(msg, send, done) {
            send = send || function() { node.send.apply(node,arguments) }
            if (node.fileIds) {
                var core = new Core();
                var smeHelper = new core.SmeHelper();

                var fileIdsValue = smeHelper.getNodeConfigValue(node, msg, node.fileIdsType, node.fileIds);
                if (fileIdsValue) {
                    var smeMsg = {
                        dataComponent: {
                            dataComponentType: "file",
                            fileIds: []
                        }
                    };
                    const fileIdArray = fileIdsValue.split(',');
                    fileIdArray.forEach(fileId => {
                        smeMsg.dataComponent.fileIds.push(fileId.trim());
                    });

                    smeHelper.addSendingMsg(msg, smeMsg);
                }
            }

            send(msg);

            done && done();
        });
    }
    RED.nodes.registerType("sme-comp-file", CompFileNode);
}