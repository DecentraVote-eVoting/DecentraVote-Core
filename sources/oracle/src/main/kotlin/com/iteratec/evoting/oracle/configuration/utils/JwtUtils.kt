/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.oracle.configuration.utils

import com.iteratec.evoting.oracle.models.User
import io.jsonwebtoken.*
import org.springframework.beans.factory.annotation.Value
import java.security.InvalidKeyException
import java.security.KeyFactory
import java.security.PrivateKey
import java.security.PublicKey
import java.security.interfaces.RSAPrivateCrtKey
import java.security.spec.PKCS8EncodedKeySpec
import java.security.spec.RSAPublicKeySpec
import java.security.spec.X509EncodedKeySpec
import java.time.Instant
import java.time.ZoneId
import java.util.*
import javax.annotation.PostConstruct


class JwtUtils(private val rsaPublicKey: String?) {

    @Value("\${server.private_key}")
    private val RSA_PRIVATE_ENC: String = ""

    private lateinit var privateKey: PrivateKey

    private lateinit var externalPublicKey: PublicKey
    private lateinit var internalPublicKey: PublicKey

    @PostConstruct
    fun initializeKeys() {
        val kfRSA = KeyFactory.getInstance("RSA")

        // Create Pubic Key from an external Public Key
        if(rsaPublicKey != null){
            val spec = X509EncodedKeySpec(Base64.getDecoder().decode(rsaPublicKey))
            externalPublicKey = kfRSA.generatePublic(spec)
        }

        val data = org.apache.commons.codec.binary.Base64.decodeBase64(RSA_PRIVATE_ENC)
        val specPrivate = PKCS8EncodedKeySpec(data)
        privateKey = kfRSA.generatePrivate(specPrivate)

        val specPublicKey = RSAPublicKeySpec((privateKey as RSAPrivateCrtKey).modulus, (privateKey as RSAPrivateCrtKey).publicExponent)
        internalPublicKey = kfRSA.generatePublic(specPublicKey)
    }

    //private val logger: Logger = LoggerFactory.getLogger(JwtUtils::class.java)

    fun getUserFromToken(jwt: String?): User? {
        val identityProvider = getIdentityProvider(jwt!!)
        val publicKey: PublicKey = if (identityProvider == IdentityProvider.Keycloak) {
            externalPublicKey
        } else {
            internalPublicKey
        }
        return try {
            val claims = Jwts.parser()
                    .setSigningKey(publicKey)
                    .parseClaimsJws(jwt).body as Claims
            User(claims, identityProvider)
        } catch (var6: SignatureException) {
/*            logger.error(var6.message)
            var6.printStackTrace()*/
            null
        } catch (var6: MalformedJwtException) {
/*            logger.error(var6.message)
            var6.printStackTrace()*/
            null
        } catch (var6: InvalidKeyException) {
/*            logger.error(var6.message)
            var6.printStackTrace()*/
            null
        }
    }

    fun getIdentityProvider(jwt: String): IdentityProvider {
        var from = jwt.indexOf(46.toChar())
        var to = jwt.lastIndexOf(46.toChar())
        return if (from != -1 && to != -1) {
            val payload = String(org.apache.commons.codec.binary.Base64.decodeBase64(jwt.substring(from + 1, to)))
            from = payload.indexOf("\"iss\":")
            to = payload.indexOf("\",", from)
            if (from != -1 && to != -1) {
                when (payload.substring(from + 7, to)) {
                    IdentityProvider.Token.name -> IdentityProvider.Token
                    else -> IdentityProvider.Keycloak
                }
            } else {
                throw IllegalArgumentException("JWT Token enhält keinen Issuer.")
            }
        } else {
            throw IllegalArgumentException("Kein gültiger JWT Token.")
        }
    }

    @Throws(Exception::class)
    fun createJwtToken(id: String, uid: String?, name1: String?, name2: String?, roles: List<String>, identityProvider: IdentityProvider): String? {
        return if (identityProvider == IdentityProvider.Keycloak) {
            throw IllegalArgumentException("Die Erstellung von Keycloak JWTs übernimmt der Keycloak Server selbst.")
        } else {
            val expiration = Date.from(Instant.now().atZone(ZoneId.of("CET")).plusMinutes(86400L).toInstant())
            Jwts.builder()
                    .setIssuer(identityProvider.name)
                    .setSubject(identityProvider.name + "-" + id)
                    .claim("uid", uid)
                    .claim("name1", name1)
                    .claim("name2", name2)
                    .claim("roles", roles)
                    .setExpiration(expiration)
                    .signWith(SignatureAlgorithm.RS256, privateKey)
                    .compact()
        }
    }

    enum class IdentityProvider {
        Keycloak, Token
    }
}
