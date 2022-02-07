/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.storageservice.configuration

import com.google.gson.Gson
import com.iteratec.evoting.solidity.contracts.ENSRegistry
import com.iteratec.evoting.solidity.contracts.Organization
import com.iteratec.evoting.solidity.contracts.PublicResolver
import com.iteratec.evoting.solidity.json.Profile
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.core.io.ResourceLoader
import org.web3j.abi.datatypes.generated.Bytes32
import org.web3j.crypto.Bip32ECKeyPair
import org.web3j.crypto.Credentials
import org.web3j.crypto.MnemonicUtils
import org.web3j.ens.NameHash
import org.web3j.protocol.Web3j
import org.web3j.protocol.http.HttpService
import org.web3j.tx.FastRawTransactionManager
import org.web3j.tx.gas.StaticGasProvider
import java.io.InputStreamReader
import java.math.BigInteger
import javax.annotation.PostConstruct


@Configuration
class Web3jConfig(
        @Value("\${web3.mnemonic}")
        val mnemonic: String,

        @Value("\${web3.network}")
        val networkConfig: String,

        @Value("\${web3.environment}")
        val environment: String,

        @Value("\${web3.ensRegistry}")
        val ensRegistry: String,

        @Value("\${web3.wsRpcServer}")
        val wsRpcServer: String,

        @Value("\${web3.httpRpcServer}")
        val httpRpcServer: String,

        @Value("\${web3.derivationPathIndex}")
        val derivationPathIndex: Int,

        @Autowired
        val resourceLoader: ResourceLoader,
) {

    val logger: Logger = LoggerFactory.getLogger(Web3jConfig::class.java)

    var profile: Profile = Profile()

    var derivationPath = intArrayOf(
            44 or Bip32ECKeyPair.HARDENED_BIT,
            60 or Bip32ECKeyPair.HARDENED_BIT,
            0 or Bip32ECKeyPair.HARDENED_BIT,
            0,
            derivationPathIndex
    )

    @PostConstruct
    fun init() {
        val stream = resourceLoader.getResource("classpath:blockchain/$networkConfig" + "_config.json").inputStream
        profile = Gson().fromJson(InputStreamReader(stream), Profile::class.java)
        stream.close()
    }

    @Bean
    fun credentials(): Credentials {
        val masterKeypair = Bip32ECKeyPair.generateKeyPair(MnemonicUtils.generateSeed(mnemonic, null))
        val derivedKeyPair = Bip32ECKeyPair.deriveKeyPair(masterKeypair, derivationPath)
        return Credentials.create(derivedKeyPair)
    }

    @Bean
    fun web3j(): Web3j {
        val finalhttpRpcServer: String = if (httpRpcServer == "") {
            profile.httpRpcServer
        } else {
            httpRpcServer
        }
        return Web3j.build(HttpService(finalhttpRpcServer))
    }

    @Bean
    fun receiptProcessor(): CustomTransactionProcessor {
        return CustomTransactionProcessor(web3j())
    }

    @Bean
    fun txManager(): FastRawTransactionManager {
        return FastRawTransactionManager(web3j(), credentials(), receiptProcessor())
    }

    @Bean
    fun ensRegistry(): ENSRegistry {

        val finalEnsRegistryAddr = if (ensRegistry == "") {
            profile.ensRegistryAddress
        } else {
            ensRegistry
        }

        return ENSRegistry.load(
                finalEnsRegistryAddr,
                web3j(),
                txManager(),
                StaticGasProvider(profile.gasPrice, profile.gasLimit)
        )
    }

    @Bean
    fun organization(): Organization {

        val ensRegistry = ensRegistry()
        val node: Bytes32 = Bytes32(NameHash.nameHashAsBytes("${environment}.decentravoteapp"))
        val resolverAddress = ensRegistry.resolver(node).send()

        val publicResolver = PublicResolver.load(
                resolverAddress.toString(),
                web3j(),
                txManager(),
                StaticGasProvider(profile.gasPrice, profile.gasLimit)
        )

        val organizationAddress = publicResolver.addr(node).send().toString()

        logger.info("Organization Contract ens     : ${environment}.decentravoteapp")
        logger.info("Organization Contract resolved: $organizationAddress")
        val finalHttpRpcServer: String = if (httpRpcServer == "") {
            profile.httpRpcServer
        } else {
            httpRpcServer
        }
        logger.info("Trying to connect to: $finalHttpRpcServer")
        logger.info("Backend is sending from: ${txManager().fromAddress}")
        return Organization.load(
                organizationAddress,
                web3j(),
                txManager(),
                StaticGasProvider(profile.gasPrice, profile.gasLimit)
        )
    }

    @Bean
    fun firstDerivedAddress(): String {
        val masterKeypair = Bip32ECKeyPair.generateKeyPair(MnemonicUtils.generateSeed(mnemonic, null))
        val derivationPath = intArrayOf(
                44 or Bip32ECKeyPair.HARDENED_BIT,
                60 or Bip32ECKeyPair.HARDENED_BIT,
                0 or Bip32ECKeyPair.HARDENED_BIT,
                0,
                0
        )
        val derivedKeyPair = Bip32ECKeyPair.deriveKeyPair(masterKeypair, derivationPath)
        val credentials = Credentials.create(derivedKeyPair)
        return credentials.address
    }

    fun resetNonce() {
        txManager().resetNonce()
        val newNonce = txManager().currentNonce - BigInteger.ONE
        txManager().setNonce(newNonce)
    }

}
