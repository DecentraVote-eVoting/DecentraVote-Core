/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.oracle.controller

import com.iteratec.evoting.oracle.configuration.utils.CookieUtils
import com.iteratec.evoting.oracle.configuration.utils.JwtUtils
import com.iteratec.evoting.oracle.enums.SolidityRole
import com.iteratec.evoting.oracle.service.ImportService
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Profile
import org.springframework.http.*
import org.springframework.util.LinkedMultiValueMap
import org.springframework.web.bind.annotation.*
import org.springframework.web.client.RestTemplate
import javax.servlet.ServletException
import javax.servlet.http.HttpServletRequest
import javax.servlet.http.HttpServletResponse

@CrossOrigin(origins = ["*"])

@RestController
@RequestMapping("/auth")
class AccessController {

    @Autowired
    lateinit var cookieUtils: CookieUtils

    @Autowired(required = false)
    lateinit var importService: ImportService

    @Autowired
    lateinit var jwtUtils: JwtUtils

    @Value("\${server.url}")
    lateinit var serverUrl: String

    @Value("\${keycloak.auth-server-url:null}")
    val keycloakUrl: String? = null

    @Value("\${keycloak.realm:null}")
    val keycloakRealm: String? = null

    @Value("\${keycloak.resource:null}")
    val keycloakClientId: String? = null

    @Value("\${keycloak.credentials.secret:null}")
    val keycloakClientSecret: String? = null

    @Value("\${spring.profiles.active:}")
    lateinit var activeProfiles: String


    @GetMapping(path = ["/logout"])
    @Throws(ServletException::class)
    fun logout(@RequestParam domain: String, request: HttpServletRequest, response: HttpServletResponse) {
        request.session.invalidate()
        request.logout()
        cookieUtils.removeCookie(cookieUtils.jwtAccessCookieName, response, domain)
        cookieUtils.removeCookie(cookieUtils.jwRefreshCookieName, response, domain)
    }

    @Profile("keycloak")
    @GetMapping("/login/keycloak")
    fun login(@RequestParam(required = false) session_state: String?, @RequestParam(required = false) code: String?, @RequestParam domain: String, response: HttpServletResponse, request: HttpServletRequest): ResponseEntity<Any> {
        if (session_state == null || code == null) {
            // login request of user gets redirected to Keycloak
            // Keycloak then redirects back to us with a code
            response.sendRedirect(
                    "${keycloakUrl}/realms/${keycloakRealm}/protocol/openid-connect/auth" +
                            "?response_type=code" +
                            "&client_id=${keycloakClientId}" +
                            "&redirect_uri=${serverUrl}/auth/login/keycloak" +
                            "?domain=${domain}")
            return ResponseEntity.ok().build()
        }

        // code was received
        val rt = RestTemplate()
        val headers = HttpHeaders()
        headers.contentType = MediaType.APPLICATION_FORM_URLENCODED
        val map: LinkedMultiValueMap<Any?, Any?> = LinkedMultiValueMap<Any?, Any?>()
        map.add("client_id", "login-app")
        map.add("grant_type", "authorization_code")
        map.add("client_secret", keycloakClientSecret)
        map.add("code", code)
        map.add("redirect_uri", "${serverUrl}/auth/login/keycloak?domain=${domain}")

        // get JWT Tokens from Keycloak
        val responseEntity = rt.exchange("${keycloakUrl}/realms/${keycloakRealm}/protocol/openid-connect/token", HttpMethod.POST, HttpEntity<Any?>(map, headers), HashMap::class.java, *arrayOfNulls(0))

        return if (responseEntity.statusCode == HttpStatus.OK) {
            ResponseEntity.ok(this.success(responseEntity.body?.get("access_token") as String,
                    responseEntity.body?.get("refresh_token") as String, domain))
        } else {
            ResponseEntity.ok(this.error())
        }
    }

    @Profile("token")
    @GetMapping("/login/token")
    fun loginToken(@RequestParam token: String, @RequestParam domain: String, response: HttpServletResponse, request: HttpServletRequest): ResponseEntity<String> {
        return try {
            val user = importService.getUserFromAccessCode(token)
            val role = SolidityRole.values()
                    .filter { role -> role.check(user.role!!) }
                    .map { role -> role.toRole().value }
                    .toList()

            val jwt = this.jwtUtils.createJwtToken(
                    user.id.toString(),
                    user.field0,
                    user.field1,
                    user.field2,
                    role,
                    JwtUtils.IdentityProvider.Token
            )

            ResponseEntity.ok().body(jwt)
        } catch (e: Exception) {
            ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.localizedMessage)
        }
    }

    @GetMapping("/login/options")
    fun options(): ResponseEntity<List<JwtUtils.IdentityProvider>> {
        val list = ArrayList<JwtUtils.IdentityProvider>(0)
        if (activeProfiles.contains("keycloak")) {
            list.add(JwtUtils.IdentityProvider.Keycloak)
        }
        if (activeProfiles.contains("token")) {
            list.add(JwtUtils.IdentityProvider.Token)
        }
        return ResponseEntity.ok(list)
    }

    fun error(): String {
        return "<!DOCTYPE html>\n" +
                "<html lang=\"en\">\n" +
                "<head>\n" +
                "    <meta charset=\"UTF-8\">\n" +
                "    <title>Login</title>\n" +
                "</head>\n" +
                "<body>\n" +
                "<script type=\"text/javascript\">\n" +
                "    window.opener.postMessage(\"1\", \"*\");\n" +
                "    window.close();\n" +
                "</script>\n" +
                "\n" +
                "</body>\n" +
                "</html>\n"
    }

    fun success(accessToken: String, refreshToken: String, domain: String): String {
        return "<!DOCTYPE html>\n" +
                "<html lang=\"en\">\n" +
                "<head>\n" +
                "    <meta charset=\"UTF-8\">\n" +
                "    <title>Login</title>\n" +
                "</head>\n" +
                "<body>\n" +
                "<script type=\"text/javascript\">\n" +
                "    window.opener.postMessage(" +
                "{\"access_token\": \"${accessToken}\", \"refresh_token\": \"${refreshToken}\"}, \"${domain}\");\n" +
                "    window.close();\n" +
                "</script>\n" +
                "\n" +
                "</body>\n" +
                "</html>\n"
    }

}
