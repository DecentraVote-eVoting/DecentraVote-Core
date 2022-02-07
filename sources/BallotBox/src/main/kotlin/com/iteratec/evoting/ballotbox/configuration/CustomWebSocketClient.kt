/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.ballotbox.configuration

import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.web3j.protocol.websocket.WebSocketClient
import java.net.URI
import kotlin.concurrent.thread

class CustomWebSocketClient(uri: URI) : WebSocketClient(uri) {

    val logger: Logger = LoggerFactory.getLogger(CustomWebSocketClient::class.java)

    override fun onClose(code: Int, reason: String?, remote: Boolean) {
        super.onClose(code, reason, remote)
        logger.trace("Lost connection to RPC: $uri Reason: $reason")
        thread(start = true) {
            this.reconnect()
        }
    }

}