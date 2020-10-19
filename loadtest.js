/* eslint-disable node/no-extraneous-require */

"use strict";

const SERVICE = get_environment_var("SERVICE_URL", "ws://localhost:5280/xmpp-websocket");
const DOMAIN = get_environment_var("DOMAIN", "localhost");
const MUC_COMPONENT_PREFIX = get_environment_var("MUC_COMPONENT_PREFIX", "conference")
const TOTAL_CLIENTS_PER_CONFERENCE = get_environment_var("TOTAL_CLIENTS_PER_CONFERENCE", 10);
const TOTAL_CONFERENCES = get_environment_var("TOTAL_CONFERENCES", 10);
const CONFERENCE_PREFIX = get_environment_var("CONFERENCE_PREFIX", "testroom");
const TEST_DURATION = get_environment_var("TEST_DURATION", 120); //SECONDS
const DELAY_BETWEEN_SUCCESSIVE_MESSAGES = get_environment_var(
    "DELAY_BETWEEN_SUCCESSIVE_MESSAGES", 1); // seconds
const DEBUG = get_environment_var("DEBUG", true) === "true";
console.assert(DELAY_BETWEEN_SUCCESSIVE_MESSAGES > 0);

let clients = [];

function get_environment_var(varname, defaultvalue) {
    let result = process.env[varname];
    if (result !== undefined)
        return result;
    else
        return defaultvalue;
}

const randomstring = function () {
    const l = 5 + Math.floor(Math.random() * 5);
    const chars = "0123456789qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM";
    let str = "";
    for (let i = 0; i < l; i++) {
        const n = Math.floor(Math.random() * chars.length);
        str += chars.substr(n, 1);
    }
    return str;
}

const get_conference_address = function (conference_counter) {
    let zero_prefix = "";
    if (conference_counter < 10)
        zero_prefix = "000";
    else if (conference_counter < 100)
        zero_prefix = "00";
    else if (conference_counter < 1000)
        zero_prefix = "0";

    return CONFERENCE_PREFIX + zero_prefix + conference_counter + "@" + MUC_COMPONENT_PREFIX + "." + DOMAIN;
}

const init = function () {
    for (let i = 0; i < TOTAL_CONFERENCES; i++) {
        for (let j = 0; j < TOTAL_CLIENTS_PER_CONFERENCE; j++) {
            const {client, xml} = require("@xmpp/client");
            const debug = require("@xmpp/debug");
            const xmpp = client({
                service: SERVICE,
                domain: DOMAIN,
                resource: randomstring(),
                preferredSaslMechanism: "ANONYMOUS"
            });

            if (DEBUG) {
                debug(xmpp, true);
            }

            const client_index = i * 10 + j;
            const conference_address = get_conference_address(i);

            xmpp.on("error", (err) => {
                console.error("error: " + "client= " + client_index + " ===> " + err);
            });

            xmpp.on("offline", () => {
                console.log("client " + client_index + " went offline");
            });

            xmpp.on("stanza", async (stanza) => {
                if (DEBUG) {
                    if (stanza.is('message')) {
                        if (stanza.getChild('body') && stanza.getChild('body').text()) {
                            if (stanza.attrs.type === 'groupchat') {
                                console.warn("client ", client_index, " received ", stanza.getChild('body').text());
                            }
                        }
                    }
                }
            });

            xmpp.on("online", async (client_jid) => {
                console.log("client " + client_index + " is online as", client_jid.toString());
                await xmpp.send(xml("presence", {
                    from: client_jid,
                    to: conference_address + "/" + randomstring()
                }, xml("x", {xmlns: "http://jabber.org/protocol/muc"})));

                const message = xml("message", {
                        type: "groupchat",
                        to: conference_address
                    },
                    xml("body", {}, "hello guys. I am client " + client_index),
                );
                xmpp.send(message);
            });

            xmpp.send_random_broadcast_message = async () => {
                if (xmpp.status === "online") {
                    const message = xml("message", {
                            type: "groupchat",
                            to: conference_address
                        },
                        xml("body", {}, "client " + client_index + " ===> " + randomstring()),
                    )
                    return xmpp.send(message);
                }
            }

            xmpp.start().catch(console.error);
            clients.push(xmpp);
        }
    }
}

const main = function () {
    init();
    let counter = TEST_DURATION / DELAY_BETWEEN_SUCCESSIVE_MESSAGES;
    setInterval(function () {
        for (let i = 0; i < clients.length; i++)
            clients[i].send_random_broadcast_message().then(() => {
            }).catch((e) => {
                console.log('error: ', e)
            });
        counter--;
        if (counter < 0) process.exit();
        console.log("time left: " + counter + " seconds");
    }, DELAY_BETWEEN_SUCCESSIVE_MESSAGES * 1000);
}

main();
