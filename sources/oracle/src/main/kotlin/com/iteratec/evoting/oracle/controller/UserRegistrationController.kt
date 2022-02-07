/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.oracle.controller

import com.iteratec.evoting.oracle.configuration.utils.Role
import com.iteratec.evoting.oracle.configuration.utils.UserUtil
import com.iteratec.evoting.oracle.models.Account
import com.iteratec.evoting.oracle.models.User
import com.iteratec.evoting.oracle.service.AccountService
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import java.security.Principal
import javax.servlet.http.HttpServletRequest


@RestController
@RequestMapping("/api")
class UserRegistrationController(
        val accountService: AccountService
) {
    val regex = """^0x[a-fA-F0-9]{40}${'$'}""".toRegex()
    val logger: Logger = LoggerFactory.getLogger(UserRegistrationController::class.java)

    @PostMapping("/member")
    @PreAuthorize("hasAnyAuthority('" + Role.authorityString + "')")
    fun registerAddress(
            request: HttpServletRequest,
            @RequestBody address: String,
            @RequestParam(required = false) secret: String?
    ): ResponseEntity<String> {
        return try {
            if (!regex.matches(address)) throw Exception("Not a valid Ethereum Address")
            val user = UserUtil.getUser(request.userPrincipal)?: throw Exception("User JWT is invalid")

            val role = user.groups
                    .map { group -> Role.fromString(group)!!.toSolidityRole().value }
                    .reduce { acc, value -> acc + value }

            val account = Account(
                    uuid = user.id,
                    address = address,
                    field0 = user.field0,
                    field1 = user.field1,
                    field2 = user.field2,
                    membershipClaim = null,
                    role = role
            )

            val transactionReceipt = accountService.registration(account, secret, user.identityProvider, user.id)
            ResponseEntity.ok(transactionReceipt)
        } catch (ex: Exception) {
            return ResponseEntity("Failed with error message: " + ex.message, HttpStatus.BAD_REQUEST)
        }
    }

    @GetMapping("whoAmI")
    @CrossOrigin("*")
    fun whoAmI(principal: Principal, request: HttpServletRequest): ResponseEntity<User> {
        return ResponseEntity.ok(UserUtil.getUser(principal)!!)
    }
}
