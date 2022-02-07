/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.oracle.configuration


import org.keycloak.OAuth2Constants
import org.keycloak.admin.client.Keycloak
import org.keycloak.admin.client.KeycloakBuilder
import org.keycloak.admin.client.resource.RealmResource
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Profile
import org.springframework.web.client.RestClientException
import org.springframework.web.client.RestTemplate
import java.util.concurrent.TimeUnit

@Profile("keycloak")
@Configuration
class KeycloakConfig {

    @Value("\${keycloak.auth-server-url}")
    lateinit var keycloakUrl: String

    @Value("\${keycloak.realm}")
    lateinit var realm: String

    @Value("\${keycloak.resource}")
    lateinit var clientId: String

    @Value("\${keycloak.credentials.secret}")
    lateinit var clientSecret: String

    val logger: Logger = LoggerFactory.getLogger(KeycloakConfig::class.java)

    var keycloakPublicKey: String? = null


    @Bean
    fun getResource(): RealmResource {
        return createKeycloak().realm(realm)
    }

    fun createKeycloak(): Keycloak {
        return KeycloakBuilder.builder()
                .serverUrl(keycloakUrl)
                .realm(realm)
                .grantType(OAuth2Constants.CLIENT_CREDENTIALS)
                .clientId(clientId)
                .clientSecret(clientSecret)
                .build()
    }

    fun loadKeycloakPublicKey() {
        var publicKeyLoaded = false
        do {
            val rt = RestTemplate()
            try {
                keycloakPublicKey = rt.getForObject("$keycloakUrl/realms/$realm", HashMap::class.java)!!["public_key"] as String
                publicKeyLoaded = true
            } catch (e: RestClientException) {
                logger.error("Der Keycloak Server ist nicht erreichbar um den Public Key zu laden.")
                try {
                    TimeUnit.SECONDS.sleep(5)
                } catch (e1: InterruptedException) {
                    throw e
                }
            }
        } while (!publicKeyLoaded)
    }
}
