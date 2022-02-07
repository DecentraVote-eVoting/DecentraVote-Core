/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.ballotbox.service

import com.iteratec.evoting.ballotbox.configuration.BallotBoxProfiles
import com.iteratec.evoting.ballotbox.configuration.CircomVerificationConfig
import com.iteratec.evoting.ballotbox.model.ZKProof
import com.iteratec.evoting.ballotbox.util.bn128.*
import com.iteratec.evoting.ballotbox.util.bn128.Curve.Companion.add
import com.iteratec.evoting.ballotbox.util.bn128.Curve.Companion.multiply
import com.iteratec.evoting.ballotbox.util.bn128.Curve.Companion.neg
import com.iteratec.evoting.ballotbox.util.bn128.Pairing.finalPower
import com.iteratec.evoting.ballotbox.util.bn128.Pairing.genPrecompute
import com.iteratec.evoting.ballotbox.util.bn128.Pairing.pairing
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.runBlocking
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.context.annotation.Profile
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Service
import java.math.BigInteger
import javax.annotation.PostConstruct

@Service
@Profile("!${BallotBoxProfiles.LAMBDA}")
class SnarkVerifierService(val vk: CircomVerificationConfig.VerifingKey) : IVerifierService {

    val logger: Logger = LoggerFactory.getLogger(SnarkVerifierService::class.java)

    private lateinit var preComputedPair: FQ12
    private lateinit var precompDelta: Precompute
    private lateinit var precompGamma: Precompute

    val SNARK_SCALAR_FIELD = BigInteger("21888242871839275222246405745257275088548364400416034343698204186575808495617")

    @PostConstruct
    private fun postConstruct() {
        preComputedPair = pairing(vk.beta2, vk.alfa1, false)
        precompDelta = genPrecompute(vk.delta2)
        precompGamma = genPrecompute(vk.gamma2)
    }

    override fun verifyProof(zkproof: ZKProof): Boolean {

        val proof = Proof(
                Point(FQ(BigInteger(zkproof.proof.pi_a[0])), FQ(BigInteger(zkproof.proof.pi_a[1])), FQ.ONE),
                Point(
                        FQ2(arrayOf(BigInteger(zkproof.proof.pi_b[0][0]), BigInteger(zkproof.proof.pi_b[0][1]))),
                        FQ2(arrayOf(BigInteger(zkproof.proof.pi_b[1][0]), BigInteger(zkproof.proof.pi_b[1][1]))),
                        FQ2.ONE
                ),
                Point(FQ(BigInteger(zkproof.proof.pi_c[0])), FQ(BigInteger(zkproof.proof.pi_c[1])), FQ.ONE)
        )
        val input = zkproof.publicSignals.map { BigInteger(it) }

        return try {
            verify(proof, input)
        } catch (e: Error) {
            false
        }
    }

    @Async
    fun verify(proof: Proof, inputs: List<BigInteger>): Boolean {

        assert(inputs.size + 1 == vk.IC.size)

        return runBlocking {

            val vk_x_comp = async(Dispatchers.IO) {
                var vk_x = Point(FQ.ONE, FQ.ONE, FQ.ZERO)

                for (i in inputs.indices) {
                    assert(inputs[i] < SNARK_SCALAR_FIELD)
                    vk_x = add(vk_x, multiply(vk.IC[i + 1], inputs[i]))
                }

                vk_x = add(vk_x, vk.IC[0])
                vk_x
            }

            val p1_calc = async(Dispatchers.IO) {
                pairing(proof.B, neg(proof.A), false)
            }

            val p2_calc = async(Dispatchers.IO) {
                pairing(precompGamma, vk_x_comp.await(), false)
            }

            val p3_calc = async(Dispatchers.IO) {
                pairing(precompDelta, proof.C, false)
            }

            (preComputedPair * p1_calc.await() * p3_calc.await() * p2_calc.await()).pow(finalPower) == FQ12.ONE
        }
    }

    data class Proof(val A: Point<FQ>, val B: Point<FQ2>, val C: Point<FQ>)
}
