/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.storageservice.extensions

import org.web3j.crypto.Hash
import java.util.*

fun String.toHash(): String = Hash.sha3String(this)
fun <T> Optional<T>.unwrap(): T? = orElse(null)