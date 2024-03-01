"use strict";
const Core = require('./sme-main-core.js');

module.exports = function (RED) {

    function SmeDownloaderNode(config) {
        RED.nodes.createNode(this, config);

        this.fileId = config.fileId;
        this.fileIdType = config.fileIdType;
        this.maxWidth = config.maxWidth;
        this.maxWidthType = config.maxWidthType;
        this.saveFilePath = config.saveFilePath;
        this.saveFilePathType = config.saveFilePathType;

        var node = this;

        var smeConnector = config.connector && RED.nodes.getNode(config.connector);
        if (!smeConnector)
            return;

        node.on('input', function (msg, send, done) {
            send = send || function () { node.send.apply(node, arguments) };

            var core = new Core();
            var smeHelper = new core.SmeHelper();

            var fileIdValue = smeHelper.getNodeConfigValue(node, msg, node.fileIdType, node.fileId);
            var maxWidthValue = smeHelper.getNodeConfigValue(node, msg, node.maxWidthType, node.maxWidth);
            var saveFilePathValue = smeHelper.getNodeConfigValue(node, msg, node.saveFilePathType, node.saveFilePath);

            if (fileIdValue && saveFilePathValue) {
                
                var endpoint = "/service/file/download";
                var httpMethod = "POST";
                var data = {
                    fileId: fileIdValue,
                    filePath: saveFilePathValue
                };
                if (typeof maxWidthValue === 'number' && maxWidthValue > 0) {
                    data.thumbnailSize = maxWidthValue
                }

                var promise = smeConnector.callApi(endpoint, httpMethod, data);

                promise.then(
                    value => {
                        smeHelper.addResponseMsg(msg, value);
                        msg.payload = value;
                        send(msg, false);
                        done && done();
                    },
                    reason => {
                        smeHelper.addResponseMsg(msg, reason);
                        msg.error = reason;
                        send(msg, false);
                        done && done(reason);
                    }
                );
            } else {
                done && done("File Id or Save File Path not specified!");
            }
        });
    }

    RED.nodes.registerType("smeDownloader", SmeDownloaderNode);
};