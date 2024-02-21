"use strict";

const { config } = require('process');
const { debug } = require('util');
const Core = require('./sme-main-core.js');

module.exports = function (RED) {
    const { Client } = require('ssh2');
    const forge = require('node-forge');
    const fs = require('fs');
    const net = require('net');

    function generateCA(id) {
        const rsa = forge.pki.rsa;

        const keypair = rsa.generateKeyPair({ bits: 4096 });
        const sshPubKey = forge.ssh.publicKeyToOpenSSH(keypair.publicKey);
        const sshPrivateKey = forge.ssh.privateKeyToOpenSSH(keypair.privateKey);

        fs.writeFileSync(`sme_node_${id}_rsa`, sshPrivateKey);
        fs.writeFileSync(`sme_node_${id}_rsa.pub`, sshPubKey);
        fs.chmodSync(`sme_node_${id}_rsa`, '400')
    }

    function getCA(id) {
        if (!(fs.existsSync(`sme_node_${id}_rsa`) && fs.existsSync(`sme_node_${id}_rsa.pub`))) {
            generateCA(id);
        }

        const pubKey = fs.readFileSync(`sme_node_${id}_rsa.pub`, 'utf-8');
        return pubKey
    }

    function getPrivateKey(id) {
        const privateKey = fs.readFileSync(`sme_node_${id}_rsa`, 'utf8');
        return privateKey;
    }

    function createConnection(node, clientAddr, clientPort) {
        const conn = new Client();

        conn.on('connect', function () {
            node.status({ fill: "green", shape: "dot", text: "connected" });
        })
        .on('tcp connection', function (info, accept) {
            const stream = accept();

            stream.on('error', function (err) {
                console.log(`TCP error: ${err}`);
            });

            stream.on('close', function () {
                console.log('TCP closed.');
            });

            stream.pause();

            const socket = net.connect(clientPort, clientAddr, function () {
                stream.pipe(socket);
                socket.pipe(stream);
                stream.resume();
            });
        })
        .on('end', function () {
            node.log('SSH2 end.');
        })
        .on('close', function () {
            node.status({ fill: "red", shape: "dot", text: "stopped" });
        });

        return conn;
    }

    function writeTunnelServerLog(node, log) {
        if (node && log) {
            node.log(log);
        }
    }

    function startTunnel(node, args) {
        if (node.sshConn)
            return;

        node.log("Start establishing connection using ssh");

        const clientAddr = node.host;
        const clientPort = node.port;
        const privateKey = node.privateKey;

        var tunnelId = args.TunnelId;
        var sshPort = args.SshPort;
        var sshServer = args.SshServer;
        var sshUsername = args.SshUsername;
        var tunnelUrl = args.TunnelUrl;
        var serverPort = args.ServerPort;

        node.log("Start tunnel")
        node.log("Remote port: " + serverPort)
        node.log("Local port: " + clientPort)
        node.log("Username: " + sshUsername)
        node.log("TunnelURL: "+ tunnelUrl)
        node.log("ssh port: " + sshPort)
        node.log("Server: "+ sshServer)

        const sshConn = createConnection(node, clientAddr, clientPort);

        sshConn.on('connect', function () {
            node.retry = null;
            writeTunnelServerLog(node, 'SSH2 connected.');

            node.send({
                TunnelId: tunnelId,
                TunnelStatus: 'started',
                TunnelName: node.name,
                TunnelUrl: tunnelUrl,
                ClientHost: clientAddr,
                ClientPort: clientPort,
                ServerPort: serverPort,
            }, false);
        })
        .on('ready', function () {
            sshConn.forwardIn('0.0.0.0', serverPort, function (err) {
                if (err) {
                    throw err;
                };

                writeTunnelServerLog(node, `SSH2 started with server port: ${serverPort}`);                 
            });
        })
        .on('error', function (err) {
            writeTunnelServerLog(node, `SSH2 error: ${err}`);
        })
        .on('close', function () {
            //  Remove current broken connection.
            node.sshConn = null;

            if (node.serving) {
                if (node.retryTimeout > 0 && node.retry > node.retryTimeout) {
                    node.retry = null;
                    node.serving = false;
                    writeTunnelServerLog(node, 'SSH reconnecting timeout!');
                    return;
                }

                //  Re-connect.
                node.retry = (node.retry || 0) + 1;
                var delay = node.retryInterval * 1000;

                setTimeout(() => {
                    writeTunnelServerLog(node, `SSH reconnecting (${node.retry})...`);

                    node.send({
                        TunnelId : tunnelId,
                        TunnelStatus: 'connecting',
                        TunnelName: node.name,
                    }, false);

                    startTunnel(node, args);
                }, delay);
                return;
            }

            writeTunnelServerLog(node, 'SSH closed.');
        });

        node.sshConn = sshConn;

        sshConn.connect({ host: sshServer, port: sshPort, username: sshUsername, privateKey: privateKey });

        node.on('close', function () {
            node.serving = false;
            stopTunnel(node, {TunnelId: tunnelId});
        });
    }
    
    function stopTunnel(node, args) {
        var sshConn = node.sshConn;
        node.sshConn = null;

        if (sshConn) {
            sshConn.end();
        }

        node.status({ fill: "red", shape: "dot", text: "stopped" });

        node.send({
            TunnelId: args.TunnelId,
            TunnelStatus: 'stopped',
            TunnelName: node.name,
        }, false);
        
    }

    function SmeNode(config) {
        RED.nodes.createNode(this, config);

        var smeConnector = config.connector && RED.nodes.getNode(config.connector);
        if (!smeConnector)
            return;

        this.smeConnector = smeConnector;

        var node = this;

        node.name = config.name;
        node.host = config.host;
        node.port = config.port && parseInt(config.port);
        node.path = config.path;
        node.retryInterval = (config.retryInterval && parseInt(config.retryInterval)) || 10;
        node.retryTimeout = (config.retryTimeout && parseInt(config.retryTimeout)) || 0;
        node.publicKey = getCA(node.id);
        node.privateKey = getPrivateKey(node.id);

        node.sshConn = null;

        //  Send message to semilimes to create tunnel.
        node.on('input', function (msg, send, done) {
            send = send || function () { node.send.apply(node, arguments) };

            node.log("Command: " + msg.Command);

            if (node.host && node.port) {
                switch ((msg.Command || '').toUpperCase()) {
                    case 'CREATE':
                        if(!node.tunnelId) {
                            //Tunnel has to be created
                            node.log(`Creating tunnel: ${node.name}`);
                            
                            var promise = smeConnector.sendMessage({
                                endpoint: "/service/tunnel/create",
                                httpMethod: "POST",
                                body: {
                                    name: node.name,
                                    description: node.description || node.name + " created by node-red",
                                    clientPort: node.port,
                                    clientPath: node.path,
                                    publicKey: node.publicKey
                                }
                            });
                            promise.then(
                                value => {
                                    if(value.success === true) {
                                        node.tunnelId = value.data.tunnelId;
                                        node.log(`Created tunnel: ${node.tunnelId} - ${node.name}`);
                                        node.send({
                                            TunnelId: node.tunnelId,
                                            TunnelStatus: 'created',
                                            TunnelName: node.name,
                                            ClientPort: node.port,
                                            ClientPath: node.path,
                                            PublicKey: node.publicKey
                                        }, false);
                                    } else {
                                        node.log(`Could not create tunnel: ${node.name}`);
                                        done && done(`Error: tunnel ${node.name} not created`);
                                    }
                                },
                                reason => {
                                    done && done(reason);
                                }
                            );
                        } else {
                            done && done(`Tunnel with ID ${node.tunnelId} already existing!`);
                        }
                        break;    
                    case 'OPEN':
                        if((msg.TunnelId || node.tunnelId) && !node.serving) {
                            //Tunnel has been created or specified, open it
                            node.log(`Opening tunnel: ${node.tunnelId}`);

                            //if specified, use this, otherwise, look into the saved id
                            var tunnelIdToOpen = msg.TunnelId ?? node.TunnelId;

                            var promise = smeConnector.sendMessage({
                                endpoint: "/service/tunnel/open",
                                httpMethod: "POST",
                                body: {
                                    tunnelId: tunnelIdToOpen
                                }
                            });
                            promise.then(
                                value => {
                                    if(value.success === true) {
                                        //Initiate SSH connection
                                        node.log(`Opened tunnel: ${tunnelIdToOpen} with server port: ${value.data.port}`);
                                        node.serving = true;
                                        startTunnel(node, {
                                            TunnelId: tunnelIdToOpen,
                                            SshPort: 22,
                                            SshServer: value.data.host,
                                            SshUsername: value.data.username,
                                            ServerPort: value.data.port,
                                            TunnelUrl: value.data.tunnelUrl
                                        });
                                    } else {
                                        node.log(`Could not open tunnel: ${tunnelIdToOpen}`);
                                        done && done(`Error: tunnel ${tunnelIdToOpen} not opened`);
                                    }
                                },
                                reason => {
                                    done && done(reason);
                                }
                            );
                        } else {
                            if (!(msg.TunnelId || node.tunnelId)) {
                                done && done(`No tunnel found. Please create it or specify one TunnelId in Open/Close/Delete commands!`);
                            } else if (node.serving) {
                                done && done(`SSH connection active. Close Tunnel ${msg.TunnelId ?? node.tunnelId} first!`);
                            }
                        }
                        break;
                    case 'CLOSE':
                        if ((msg.TunnelId || node.tunnelId) && node.serving) {
                            node.serving = false;
                            stopTunnel(node, {TunnelId: msg.TunnelId ?? node.tunnelId });
                            node.log(`Stopped tunnel: ${msg.TunnelId ?? node.tunnelId} - ${node.name}`);
                        }   
                        break;
                    case 'DELETE':
                        if ((msg.TunnelId || node.tunnelId) && !node.serving) {
                            node.log(`Deleting tunnel: ${msg.TunnelId ?? node.tunnelId}`);

                            var tunnelToDelete = msg.TunnelId ?? node.tunnelId;

                            var promise = smeConnector.sendMessage({
                                endpoint: "/service/tunnel/delete",
                                httpMethod: "POST",
                                body: {
                                    tunnelId: tunnelToDelete
                                }
                            });
                            promise.then(
                                value => {
                                    if(value.success === true) {
                                        node.log(`Deleted tunnel: ${tunnelToDelete}`);
                                        node.send({
                                            TunnelStatus: 'deleted',
                                            TunnelId: tunnelToDelete,
                                            TunnelName: node.name
                                        }, false);
                                        if (msg.TunnelId == node.tunnelId) delete node.tunnelId;
                                    } else {
                                        node.log(`Could not delete tunnel: ${tunnelToDelete}`);
                                        done && done(`Error: tunnel ${tunnelToDelete} not deleted`);
                                    }
                                },
                                reason => {
                                    done && done(reason);
                                }
                            );
                        } else {
                            done && done(`No Tunnel to delete!`);
                        }
                        break;
                    default:
                        node.log(`Invalid tunnel command: ${msg.Command}`);
                        break;
                }
            }

            done && done();
        });
    };

    RED.nodes.registerType("tunnel", SmeNode);
};