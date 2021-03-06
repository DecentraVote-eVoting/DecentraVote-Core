/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.oracle.extensions

import com.iteratec.evoting.oracle.models.Account
import org.apache.commons.lang3.RandomStringUtils
import org.web3j.crypto.Hash
import java.util.*

fun String.toHash(): String = Hash.sha3String(this)
fun <T> Optional<T>.unwrap(): T? = orElse(null)

fun Account.toClaim(): String = "{" +
        "\"name1\":\"${this.name1}\"," +
        "\"name2\":\"${this.name2}\"," +
        "\"uid\":\"${this.uid}\"," +
        "\"salt\":\"${RandomStringUtils.randomAlphanumeric(20)}\"" +
        "}"
