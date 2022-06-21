/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.oracle.controller

import com.iteratec.evoting.oracle.dtos.ChangePasswordDto
import com.iteratec.evoting.oracle.dtos.MnemonicDto
import com.iteratec.evoting.oracle.exceptions.InvalidPassword
import com.iteratec.evoting.oracle.exceptions.NotRegistered
import com.iteratec.evoting.oracle.exceptions.SignatureNotValid
import com.iteratec.evoting.oracle.models.Signature
import com.iteratec.evoting.oracle.service.MnemonicService
import com.iteratec.evoting.oracle.service.SignatureService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.server.ResponseStatusException

@CrossOrigin(origins = ["*"])
@RestController
@RequestMapping("/api/mnemonic")
class MnemonicController(
        val mnemonicService: MnemonicService,
        val signatureService: SignatureService
) {

    @PostMapping
    fun getMnemonic(@RequestBody data: MnemonicDto): ResponseEntity<String> {
        try {
            mnemonicService.getEncryptedMnemonic(data.username, data.password).let {
                return ResponseEntity.ok().body(it)
            }
        } catch (e: NotRegistered) {
            throw ResponseStatusException(HttpStatus.LOCKED)
        } catch (e: InvalidPassword) {
            throw ResponseStatusException(HttpStatus.UNAUTHORIZED)
        } catch (e: NoSuchElementException) {
            throw ResponseStatusException(HttpStatus.UNAUTHORIZED)
        } catch (e: Exception) {
            throw ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, e.message)
        }
    }

    @PostMapping("/password")
    fun resetPassword(
            @RequestBody changePasswordDto: ChangePasswordDto,
            @RequestHeader("Signature") signature: String,
            @RequestHeader("Message") message: String
    ): ResponseEntity<*> {
        try {
            val address = signatureService.signedPrefixedMessageToKey(Signature(signature, message))
            mnemonicService.changePassword(address, changePasswordDto)
            return ResponseEntity.ok().body("")
        } catch (e: SignatureNotValid) {
            throw ResponseStatusException(HttpStatus.FORBIDDEN, e.message)
        } catch (e: Exception) {
            throw ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, e.message)
        }
    }
}