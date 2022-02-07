/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.ballotbox.service

import com.iteratec.evoting.ballotbox.BallotBoxApplication
import com.iteratec.evoting.ballotbox.model.ZKProof
import com.iteratec.evoting.ballotbox.model.ZKProofPoints
import com.iteratec.evoting.solidity.contracts.EventManager
import com.iteratec.evoting.solidity.contracts.Organization
import org.junit.Test
import org.junit.jupiter.api.BeforeAll
import org.junit.jupiter.api.TestInstance
import org.junit.jupiter.api.extension.ExtendWith
import org.junit.runner.RunWith
import org.mockito.Mockito
import org.mockito.stubbing.Answer
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.mock.mockito.MockBean
import org.springframework.test.context.junit.jupiter.SpringExtension
import org.springframework.test.context.junit4.SpringRunner
import org.web3j.protocol.core.DefaultBlockParameterName
import kotlin.test.assertFalse
import kotlin.test.assertTrue

@RunWith(SpringRunner::class)
@ExtendWith(SpringExtension::class)
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, classes = [BallotBoxApplication::class])
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class SnarkVerificationServiceTest {

    @MockBean
    lateinit var org: Organization

    @MockBean
    lateinit var em: EventManager

    @MockBean
    lateinit var voteContractService: VoteContractService

    @Autowired
    lateinit var service: IVerifierService

    // TODO: Mockito mocks for the EventManager
    @BeforeAll
    fun mock() {
        // stub
        Mockito
            .`when`(
                em.voteClosedEventFlowable(DefaultBlockParameterName.EARLIEST, DefaultBlockParameterName.LATEST)
                    .subscribe()
            )
            .then(Answer { })
    }

    @Test
    fun testInvalidProof() {

        val memoryA = listOf("1", "1")
        val memoryB = listOf(listOf("1", "1"), listOf("1", "1"))
        val memoryC = listOf("1", "1")
        val memoryInput = listOf("1", "1", "1", "1")

        val zkProof = ZKProof(
                ZKProofPoints(
                        memoryA, memoryB, memoryC, "groth16"
                ),
                memoryInput
        )

        assertFalse(service.verifyProof(zkProof))
    }

    @Test
    fun testValidProof1() {

        val memoryA = listOf(
            "14789202723050015382632858229725718933679676774382571623504330730842194729950",
            "21181805271181027424484972214690020562325452257392705936061180722140053512950"
        )

        val memoryB = listOf(
                listOf(
                        "14797265953085393606457902823832160501011176223503152453963974438322485859769",
                        "14584972324531006967793173636880973213457091019329450805005613232786237698370"
                ),
                listOf(
                        "5248421336670066592968736516306257070360994893542553039189636725360521340016",
                        "17489378174251466386707195077396586079786689655943353251444279302433597564954"
                )
        )

        val memoryC = listOf(
            "16298862501587569250467700143129453388926298683450840339761755908682744158511",
            "4324653110281166490032501753447868199930444747248357460709730919832200993140"
        )

        val memoryInput = listOf(
            "711840802788913364492631490721076839094283926472",
            "11067972280819431264356688310108992855080240186946315367627323642392075827242",
            "0",
            "13796596083990068091683061279739650687290111989259623252942589852184109860101"
        )

        val zkProof = ZKProof(
                ZKProofPoints(
                        memoryA, memoryB, memoryC, "groth16"
                ),
                memoryInput
        )

        assertTrue(service.verifyProof(zkProof))
    }

    @Test
    fun testValidProof2() {

        val memoryA = listOf(
            "13203975947293245588616550022003373140435076243176718406150952644170864378917",
            "17672811760871364890773272897490557567192445700190417093517450840779425570871"
        )

        val memoryB = listOf(
                listOf(
                        "5292333603846682819131112435483988543164787196978978326986144497024432313938",
                        "16349385180146491468495132829229984664998370516872712400961059108448312836078"
                ),
                listOf(
                        "1937337950206232837423502400623112862910835799564361744774925296701160721497",
                        "1777329284502972322296852720298487359351701480337211574285995575590236792166"
                )
        )

        val memoryC = listOf(
            "9565005383669479814617315946367992292390336937305038250065140886029993146309",
            "240758884145483228965007075994054930303151121718688082633321443890086261407"
        )

        val memoryInput = listOf(
            "738873054645249387977560281977481114076153359438",
            "11067972280819431264356688310108992855080240186946315367627323642392075827242",
            "0",
            "12320774261463714676092754342485875507139968684626668642296589986149927171570"
        )

        val zkProof = ZKProof(
                ZKProofPoints(
                        memoryA, memoryB, memoryC, "groth16"
                ),
                memoryInput
        )

        assertTrue(service.verifyProof(zkProof))
    }
}


