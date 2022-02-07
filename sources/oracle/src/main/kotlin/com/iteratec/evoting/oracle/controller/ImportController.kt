/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.oracle.controller

import com.iteratec.evoting.oracle.dtos.ImportUserDataTransferObject
import com.iteratec.evoting.oracle.entities.ImportUser
import com.iteratec.evoting.oracle.enums.SolidityRole
import com.iteratec.evoting.oracle.exceptions.DuplicateUser
import com.iteratec.evoting.oracle.exceptions.SignatureNotValid
import com.iteratec.evoting.oracle.models.Signature
import com.iteratec.evoting.oracle.service.ImportService
import com.iteratec.evoting.oracle.service.SignatureService
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.context.annotation.Profile
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.server.ResponseStatusException
import javax.servlet.http.HttpServletRequest
import javax.servlet.http.HttpServletResponse

@CrossOrigin(origins = ["*"])
@Profile("token")
@RestController
@RequestMapping("/api/import")
class ImportController(
        val importService: ImportService,
        val signatureService: SignatureService
) {
    val logger: Logger = LoggerFactory.getLogger(ImportController::class.java)

    @PostMapping
    fun postImport(request: HttpServletRequest,
                   @RequestBody data: List<ImportUser>,
                   @RequestHeader("Signature") signature: String,
                   @RequestHeader("Message") message: String)
            : ResponseEntity<*> {
        return try {
            val role = signatureService.getRoleFromSignature(Signature(signature, message))
            if (!SolidityRole.DIRECTOR.check(role))
                throw SignatureNotValid("Signature has no Director Role")

            importService.checkIfDuplicate(data)
            importService.generateAccessCodes(data)
            ResponseEntity.ok().body("")
        } catch (e: DuplicateUser) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, e.message)
        } catch (e: SignatureNotValid) {
            throw ResponseStatusException(HttpStatus.FORBIDDEN, e.message)
        } catch (e: Exception) {
            throw ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, e.message)
        }
    }

    @GetMapping
    fun getImportMember(request: HttpServletRequest,
                        response: HttpServletResponse,
                        @RequestHeader("Signature") signature: String,
                        @RequestHeader("Message") message: String)
            : ResponseEntity<List<ImportUserDataTransferObject>> {

        return try {
            val role = signatureService.getRoleFromSignature(Signature(signature, message))
            if (SolidityRole.hasAnyRole(role)) {
                val result =
                        if (SolidityRole.DIRECTOR.check(role))
                            importService.getAllImportedMembersWithAccessKeys()
                        else
                            importService.getAllImportedMembers()
                ResponseEntity.ok().body(result)
            } else
                throw SignatureNotValid("Signature has no Director Role")
        } catch (e: SignatureNotValid) {
            throw ResponseStatusException(HttpStatus.FORBIDDEN, e.message)
        } catch (e: Exception) {
            throw ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Get nicht oida")
        }
    }

    @PostMapping("/remove")
    fun deleteImport(request: HttpServletRequest,
                     @RequestBody data: String,
                     @RequestHeader("Signature") signature: String,
                     @RequestHeader("Message") message: String)
            : ResponseEntity<Any> {
        return try {
            val role = signatureService.getRoleFromSignature(Signature(signature, message))
            if (SolidityRole.DIRECTOR.check(role))
                importService.removeUser(data)
            else
                throw SignatureNotValid("Signature has no Director Role")
            ResponseEntity.ok().body("")
        } catch (e: SignatureNotValid) {
            throw ResponseStatusException(HttpStatus.FORBIDDEN, e.message)
        } catch (e: Exception) {
            throw ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, e.message)
        }
    }

    @PostMapping("/extend")
    fun renewImport(request: HttpServletRequest,
                    @RequestBody data: String,
                    @RequestHeader("Signature") signature: String,
                    @RequestHeader("Message") message: String)
            : ResponseEntity<Any> {
        return try {
            val role = signatureService.getRoleFromSignature(Signature(signature, message))
            if (SolidityRole.DIRECTOR.check(role))
                importService.extendAccessCodeValidity(data)
            else
                throw SignatureNotValid("Signature has no Director Role")
            ResponseEntity.ok().body("")
        } catch (e: SignatureNotValid) {
            throw ResponseStatusException(HttpStatus.FORBIDDEN, e.message)
        } catch (e: Exception) {
            throw ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, e.message)
        }
    }

    @PostMapping("/replaceAccessCode")
    fun replaceImport(request: HttpServletRequest,
                      @RequestBody data: String,
                      @RequestHeader("Signature") signature: String,
                      @RequestHeader("Message") message: String)
            : ResponseEntity<Any> {
        return try {
            val role = signatureService.getRoleFromSignature(Signature(signature, message))
            if (SolidityRole.DIRECTOR.check(role)) {
                importService.replaceAccessCodeOfUser(data)
                ResponseEntity.ok().body("")
            } else
                throw SignatureNotValid("Signature has no Director Role")

        } catch (e: SignatureNotValid) {
            throw ResponseStatusException(HttpStatus.FORBIDDEN, e.message)
        } catch (e: Exception) {
            throw ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, e.message)
        }
    }

    @PostMapping("/replace")
    fun replaceUser(request: HttpServletRequest,
                    @RequestBody address: String,
                    @RequestHeader("Signature") signature: String,
                    @RequestHeader("Message") message: String)
            : ResponseEntity<Any> {
        return try {
            val role = signatureService.getRoleFromSignature(Signature(signature, message))
            if (SolidityRole.DIRECTOR.check(role))
                ResponseEntity.ok().body(this.importService.replaceUser(address))
            else
                throw SignatureNotValid("Signature has no Director Role")

        } catch (e: SignatureNotValid) {
            throw ResponseStatusException(HttpStatus.FORBIDDEN, e.message)
        } catch (e: Exception) {
            throw ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, e.message)
        }
    }

    @PostMapping("/editImportUser")
    fun editImportUser(request: HttpServletRequest,
                       @RequestBody data: ImportUser,
                       @RequestHeader("Signature") signature: String,
                       @RequestHeader("Message") message: String)
            : ResponseEntity<Any> {
        return try {
            val role = signatureService.getRoleFromSignature(Signature(signature, message))
            if (SolidityRole.DIRECTOR.check(role))
                importService.editImportUser(data)
            else
                throw SignatureNotValid("Signature has no Director Role")
            ResponseEntity.ok().body("")
        } catch (e: SignatureNotValid) {
            throw ResponseStatusException(HttpStatus.FORBIDDEN, e.message)
        } catch (e: Exception) {
            throw ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, e.message)
        }
    }
}
