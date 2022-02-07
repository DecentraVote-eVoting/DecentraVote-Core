/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.oracle.configuration

import com.iteratec.evoting.oracle.configuration.utils.CookieUtils
import com.iteratec.evoting.oracle.configuration.utils.JwtUtils
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class JwtConfig {
    @Value("\${spring.profiles.active:}")
    lateinit var activeProfiles: String

    @Autowired
    lateinit var cookieUtils: CookieUtils

    @Autowired(required = false)
    lateinit var keycloakConfig: KeycloakConfig

    @Bean
    fun jwtUtils(): JwtUtils? {
        if (activeProfiles.contains("keycloak")) {
            if (keycloakConfig.keycloakPublicKey == null) {
                keycloakConfig.loadKeycloakPublicKey()
            }
            return JwtUtils(keycloakConfig.keycloakPublicKey)
        }
        return JwtUtils(null)
    }

    @Bean
    fun jwtFilter(): JwtFilter? {
        if (activeProfiles.contains("keycloak")) {
            if (keycloakConfig.keycloakPublicKey == null) {
                keycloakConfig.loadKeycloakPublicKey()
            }
        }
        return JwtFilter(jwtUtils()!!, cookieUtils)
    }

}
