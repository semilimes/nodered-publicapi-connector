"use strict";
const Core = require('./sme-main-core.js');

module.exports = function (RED) {

    function SmeUploaderNode(config) {
        RED.nodes.createNode(this, config);

        this.filePath = config.filePath;
        this.filePathType = config.filePathType;
        //this.fileName = config.fileName;
        //this.fileNameType = config.fileNameType;

        var node = this;

        var smeConnector = config.connector && RED.nodes.getNode(config.connector);
        if (!smeConnector)
            return;

        node.on('input', function (msg, send, done) {
            send = send || function () { node.send.apply(node, arguments) };

            var core = new Core();
            var smeHelper = new core.SmeHelper();

            var filePathValue = smeHelper.getNodeConfigValue(node, msg, node.filePathType, node.filePath);

            if (filePathValue) {
                
                var endpoint = "/service/file/upload";
                var httpMethod = "POST";
                var data = {
                    filePath: filePathValue
                };
                var promise = smeConnector.callApi(endpoint, httpMethod, data);

                promise.then(
                    value => {
                        smeHelper.addResponseMsg(msg, value);
                        msg.payload = {};
                        msg.payload.uploadedFiles = value.data.uploadedFiles;
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
            }
        });
    }

    RED.nodes.registerType("smeUploader", SmeUploaderNode);
};