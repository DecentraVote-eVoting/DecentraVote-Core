/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.ballotbox.configuration

import com.google.gson.Gson
import com.iteratec.evoting.ballotbox.util.bn128.FQ
import com.iteratec.evoting.ballotbox.util.bn128.FQ2
import com.iteratec.evoting.ballotbox.util.bn128.Point
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.core.io.ResourceLoader
import java.io.InputStreamReader
import java.math.BigInteger

@Configuration
class CircomVerificationConfig(
        @Autowired
        val resourceLoader: ResourceLoader
) {

    @Bean
    fun verificationKey(): VerifingKey {
        val resource = resourceLoader.getResource("classpath:verification_key.json").inputStream

        val json = Gson().fromJson(InputStreamReader(resource), VerifyingKeyDTO::class.java)
        resource.close()

        return VerifingKey(
                Point(FQ(json.vk_alpha_1[0]), FQ(json.vk_alpha_1[1]), FQ(json.vk_alpha_1[2])),
                Point(FQ2(json.vk_beta_2[0]), FQ2(json.vk_beta_2[1]), FQ2(json.vk_beta_2[2])),
                Point(FQ2(json.vk_gamma_2[0]), FQ2(json.vk_gamma_2[1]), FQ2(json.vk_gamma_2[2])),
                Point(FQ2(json.vk_delta_2[0]), FQ2(json.vk_delta_2[1]), FQ2(json.vk_delta_2[2])),
                json.IC.map { array -> Point(FQ(array[0]), FQ(array[1]), FQ(array[2])) }
        )
    }

    data class VerifingKey(
            val alfa1: Point<FQ>,
            val beta2: Point<FQ2>,
            val gamma2: Point<FQ2>,
            val delta2: Point<FQ2>,
            val IC: List<Point<FQ>>,
    )

    data class VerifyingKeyDTO(
            val vk_alpha_1: Array<BigInteger>,
            val vk_beta_2: Array<Array<BigInteger>>,
            val vk_gamma_2: Array<Array<BigInteger>>,
            val vk_delta_2: Array<Array<BigInteger>>,
            val vk_alphabeta_12: Array<Array<Array<BigInteger>>>,
            val IC: List<Array<BigInteger>>,
    )
}
