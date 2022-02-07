/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.oracle.controller

import com.iteratec.evoting.oracle.configuration.Web3jConfig
import com.iteratec.evoting.oracle.entities.ImportUser
import com.iteratec.evoting.oracle.service.AccountService
import com.iteratec.evoting.oracle.service.DatabaseService
import com.iteratec.evoting.oracle.service.ImportService
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.context.annotation.Profile
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.server.ResponseStatusException

@RestController
@RequestMapping("/api/e2e")
@Profile("e2e")
class E2EController(
    @Autowired
    val databaseService: DatabaseService,
    @Autowired
    val importService: ImportService,
    @Autowired
    val accountService: AccountService,
    @Autowired
    val web3jConfig: Web3jConfig
) {

    @GetMapping("/reset")
    fun resetDatabase(): ResponseEntity<String> {
        return try {
            databaseService.deleteAllAccounts()
            importService.removeAllUsers()
            web3jConfig.resetNonce()
            accountService.registerInitialDirector()
            ResponseEntity.ok("Removed all Entries")
        } catch (e: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build()
        }
    }


    @PostMapping("/import")
    fun importStaticMembers(@RequestBody data: List<ImportUser>): ResponseEntity<List<ImportUser>> {
        return try {
            val result = importService.generateAccessCodes(data)
            ResponseEntity.ok(result)
        } catch (e: Exception) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, e.localizedMessage)
        }
    }

    @PostMapping("/invalidUntilImport")
    fun importStaticMembers(@RequestBody data: String) {
        return try {
            importService.setInvalidUntil(data)
        } catch (e: Exception) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, e.localizedMessage)
        }
    }
}
