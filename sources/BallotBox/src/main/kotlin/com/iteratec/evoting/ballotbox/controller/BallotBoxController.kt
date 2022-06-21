/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.ballotbox.controller

import com.google.gson.Gson
import com.iteratec.evoting.ballotbox.configuration.BallotBoxProfiles
import com.iteratec.evoting.ballotbox.exceptions.SignatureNotValid
import com.iteratec.evoting.ballotbox.exceptions.VoteNotFoundException
import com.iteratec.evoting.ballotbox.exceptions.ZKProofNotValid
import com.iteratec.evoting.ballotbox.model.AnonymousBallot
import com.iteratec.evoting.ballotbox.model.OpenBallot
import com.iteratec.evoting.ballotbox.model.SignedJsonString
import com.iteratec.evoting.ballotbox.service.BallotBoxService
import com.iteratec.evoting.ballotbox.service.SignatureService
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.context.annotation.Profile
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.server.ResponseStatusException

@RestController
@RequestMapping("/api/ballotbox")
@Profile(BallotBoxProfiles.RECEIVER)
class BallotBoxController(
        val ballotBoxService: BallotBoxService,
        val signatureService: SignatureService
) {
    val logger: Logger = LoggerFactory.getLogger(BallotBoxController::class.java)

    @PostMapping("/open/{voteAddress}")
    fun castOpenVote(
        @PathVariable("voteAddress") voteAddress: String,
        @RequestBody() castVoteRequest: OpenBallot
    ): ResponseEntity<SignedJsonString> {
        val startTime = System.currentTimeMillis()
        logger.trace("Received new open vote for voteAddress $voteAddress")

        return try {
            ballotBoxService.verifyVoteConstraints(voteAddress.lowercase())
            ballotBoxService.verifyOpenBallot(voteAddress.lowercase(), castVoteRequest)
            val certificate = castVoteRequest.toEntity(voteAddress.lowercase()).let {
                ballotBoxService.saveBallot(it)
                signatureService.createSignature(Gson().toJson(it))
            }
            logger.trace("Processing open Ballot took:  ${(System.currentTimeMillis() - startTime)}ms")
            ResponseEntity.ok(certificate)
        } catch (e: SignatureNotValid) {
            logger.error("${e.reason} ${Gson().toJson(castVoteRequest)}")
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Signature not valid ${e.reason}")
        } catch (e: VoteNotFoundException) {
            logger.error("Vote not found: $voteAddress")
            throw ResponseStatusException(HttpStatus.NOT_FOUND, "Vote not found ${e.reason}")
        } catch (e: Exception) {
            logger.error("${e.message}")
            throw ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    @PostMapping("/anonymous/{voteAddress}")
    fun castAnonymousVote(
            @PathVariable("voteAddress") voteAddress: String,
            @RequestBody() castVoteRequest: AnonymousBallot
    ): ResponseEntity<SignedJsonString> {
        val startTime = System.currentTimeMillis()
        logger.trace("Received new anonymous vote for voteAddress $voteAddress from ${castVoteRequest.signedDecision.signingAddress}")

        return try {
            ballotBoxService.verifyVoteConstraints(voteAddress.lowercase()).let { root ->
                ballotBoxService.verifyAnonymousBallot(castVoteRequest, root?: throw Exception("No Root"))
            }
            val certificate = castVoteRequest.toEntity(voteAddress.lowercase()).let { ballot ->
                ballotBoxService.saveBallot(ballot)
                signatureService.createSignature(Gson().toJson(ballot))
            }
            logger.trace("Processing anonymous Ballot took:  ${(System.currentTimeMillis() - startTime)}ms")
            ResponseEntity.ok(certificate)
        } catch (e: SignatureNotValid) {
            logger.error("${e.reason} $castVoteRequest")
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Signature not valid ${e.reason}")
        } catch (e: VoteNotFoundException) {
            logger.error("Vote not found: $voteAddress")
            throw ResponseStatusException(HttpStatus.NOT_FOUND, "Vote not found ${e.reason}")
        } catch (e: ZKProofNotValid) {
            logger.error("${e.reason} $castVoteRequest")
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "ZkProof not valid ${e.reason}")
        } catch (e: Exception) {
            logger.error("${e.message}")
            throw ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    @GetMapping("/open/{voteAddress}")
    fun getOpenBallotsFromVote(@PathVariable("voteAddress") voteAddress: String): ResponseEntity<List<OpenBallot>> {
        return try {
            ResponseEntity.ok(ballotBoxService.getBallotsFromVote(voteAddress.lowercase()).map {
                it.toModel()
            })
        } catch (e: NoSuchElementException) {
            ResponseEntity.ok(listOf())
        } catch (e: Exception) {
            logger.error("${e.message}")
            throw ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    @GetMapping("/anonymous/{voteAddress}")
    fun getAnonymousBallotsFromVote(@PathVariable("voteAddress") voteAddress: String): ResponseEntity<List<AnonymousBallot>> {
        return try {
            ResponseEntity.ok(ballotBoxService.getAnonymousBallotsFromVote(voteAddress.lowercase()).map {
                it.toModel()
            })
        } catch (e: NoSuchElementException) {
            ResponseEntity.ok(listOf())
        } catch (e: Exception) {
            logger.error("${e.message}")
            throw ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    @GetMapping("/open/{voteAddress}/voteCast")
    fun getCastedVoteLength(@PathVariable("voteAddress") voteAddress: String): ResponseEntity<Number> {
        return try {
            ResponseEntity.ok(ballotBoxService.getCastedVoteLength(voteAddress.lowercase()))
        } catch (e: NoSuchElementException) {
            ResponseEntity.ok(0)
        } catch (e: Exception) {
            logger.error("${e.message}")
            throw ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    @GetMapping("/anonymous/{voteAddress}/voteCast")
    fun getAnonCastedVoteLength(@PathVariable("voteAddress") voteAddress: String): ResponseEntity<Number> {
        return try {
            ResponseEntity.ok(ballotBoxService.getAnonCastedVoteLength(voteAddress.lowercase()))
        } catch (e: NoSuchElementException) {
            ResponseEntity.ok(0)
        } catch (e: Exception) {
            logger.error("${e.message}")
            throw ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }
}
