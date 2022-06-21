/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.ballotbox.service

import com.google.gson.Gson
import com.iteratec.evoting.ballotbox.entities.AnonymousBallotEntity
import com.iteratec.evoting.ballotbox.entities.OpenBallotEntity
import com.iteratec.evoting.ballotbox.exceptions.SignatureNotValid
import com.iteratec.evoting.ballotbox.exceptions.VoteNotFoundException
import com.iteratec.evoting.ballotbox.exceptions.ZKProofNotValid
import com.iteratec.evoting.ballotbox.model.AnonymousBallot
import com.iteratec.evoting.ballotbox.model.OpenBallot
import com.iteratec.evoting.ballotbox.model.OpenBallotNullifier
import com.iteratec.evoting.ballotbox.repository.AnonymousBallotRepository
import com.iteratec.evoting.ballotbox.repository.OpenBallotRepository
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Service
import org.web3j.abi.datatypes.Address
import java.math.BigInteger
import javax.transaction.Transactional

@Service
class BallotBoxService(
        @Autowired val openBallotRepository: OpenBallotRepository,
        @Autowired val anonymousBallotRepository: AnonymousBallotRepository,
        @Autowired val snarkVerifierService: IVerifierService,
        @Autowired val voteContractService: VoteContractService,
        @Autowired val organizationContractService: OrganizationContractService,
) {

    val logger: Logger = LoggerFactory.getLogger(BallotBoxService::class.java)

    fun verifyVoteConstraints(voteAddress: String): BigInteger? {
        if (!organizationContractService.isVote(Address(voteAddress))) throw VoteNotFoundException("Organization does not recognise $voteAddress")
        val voteState = voteContractService.getVoteState(voteAddress)
        if (voteState.stage != BigInteger.ONE) throw SignatureNotValid("VoteStage is not open! VoteStage is ${voteState.stage}")
        return if (voteState.anonymous) voteState.root else null
    }

    fun verifyAnonymousBallot(ballot: AnonymousBallot, root: BigInteger) {
        val zkProofAddress = Address(BigInteger(ballot.zkProof.anonymousAddress()))
        val signingAddress = ballot.signedDecision.signingAddress

        if (signingAddress != zkProofAddress)
            throw SignatureNotValid("Signing Address $signingAddress and ZKProof Address $zkProofAddress are not equal")

        if (root.toString() != ballot.zkProof.root())
            throw ZKProofNotValid("Root is not equal: $root != ${ballot.zkProof.root()}")

        if (!snarkVerifierService.verifyProof(ballot.zkProof))
            throw ZKProofNotValid()
    }

    fun verifyOpenBallot(voteAddress: String, ballot: OpenBallot) {
        logger.debug("Start validation for ${ballot.signedDecision.signingAddress}")

        val openNullifier = Gson().fromJson(ballot.signedNullifier.message, OpenBallotNullifier::class.java)

        if (ballot.signedDecision.signingAddress != ballot.signedNullifier.signingAddress && ballot.signedDecision.signingAddress != openNullifier.signerAsAddress())
            throw SignatureNotValid("Decision and Nullifier Signatures are different")

        if (voteAddress != openNullifier.voteAddress.lowercase())
            throw SignatureNotValid("Nullifier Signature was not created for this vote")

        ballotExistsByVoteAddressAndNullifier(voteAddress, ballot.signedNullifier.message).let { exists ->
            if (exists) throw SignatureNotValid("Nullifier already used")
        }

        voteContractService.getNumberOfVotingRights(voteAddress, ballot.signedDecision.signingAddress).let { voteRights ->
            if (openNullifier.index >= voteRights) throw SignatureNotValid("No voting rights left")
        }
    }

    @Throws(java.util.NoSuchElementException::class)
    fun getBallotsFromVoteForAddress(voteAddress: String, signer: String): List<OpenBallotEntity> {
        return openBallotRepository.findAllByVoteAddressAndSignedDecisionSigner(voteAddress, signer).get()
    }

    @Throws(java.util.NoSuchElementException::class)
    fun getBallotFromVoteForAddressAndNullifier(voteAddress: String, nullifier: String): OpenBallotEntity {
        return openBallotRepository.findByVoteAddressAndSignedNullifierNullifier(voteAddress, nullifier).get()
    }

    fun ballotExistsByVoteAddressAndNullifier(voteAddress: String, nullifier: String): Boolean {
        return openBallotRepository.existsByVoteAddressAndSignedNullifierNullifier(voteAddress, nullifier)
    }

    @Throws(java.util.NoSuchElementException::class)
    fun getBallotsFromVote(voteAddress: String): List<OpenBallotEntity> {
        return openBallotRepository.findAllByVoteAddress(voteAddress).get()
    }

    @Throws(java.util.NoSuchElementException::class)
    fun getAnonymousBallotsFromVote(voteAddress: String): List<AnonymousBallotEntity> {
        return anonymousBallotRepository.findAllByVoteAddress(voteAddress).get()
    }

    @Throws(java.util.NoSuchElementException::class)
    fun getCastedVoteLength(voteAddress: String): Number {
        return openBallotRepository.countAllByVoteAddress(voteAddress)
    }

    @Throws(java.util.NoSuchElementException::class)
    fun getAnonCastedVoteLength(voteAddress: String): Number {
        return anonymousBallotRepository.countAllByVoteAddress(voteAddress)
    }

    @Transactional
    fun saveBallot(ballotEntity: OpenBallotEntity) {
        logger.debug("Save Ballot for Vote ${ballotEntity.voteAddress} from ${ballotEntity.signedDecision.signer}")
        try {
            openBallotRepository.save(ballotEntity)
        } catch (e: Exception) {
            logger.error("Save Vote ${e.message}")
            throw e
        }
    }

    @Transactional
    fun saveBallot(ballotEntity: AnonymousBallotEntity) {
        logger.debug("Save Ballot for Vote ${ballotEntity.voteAddress} from ${ballotEntity.signedDecision.signer}")
        try {
            anonymousBallotRepository.save(ballotEntity)
        } catch (e: Exception) {
            logger.error("Save Vote ${e.message}")
            throw e
        }
    }

}
