/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.ballotbox.util.bn128

import com.iteratec.evoting.ballotbox.util.bn128.Curve.Companion.G1
import com.iteratec.evoting.ballotbox.util.bn128.Curve.Companion.G12
import com.iteratec.evoting.ballotbox.util.bn128.Curve.Companion.G2
import com.iteratec.evoting.ballotbox.util.bn128.Curve.Companion.add
import com.iteratec.evoting.ballotbox.util.bn128.Curve.Companion.b2
import com.iteratec.evoting.ballotbox.util.bn128.Curve.Companion.curve_order
import com.iteratec.evoting.ballotbox.util.bn128.Curve.Companion.double
import com.iteratec.evoting.ballotbox.util.bn128.Curve.Companion.isInf
import com.iteratec.evoting.ballotbox.util.bn128.Curve.Companion.isOnCurve
import com.iteratec.evoting.ballotbox.util.bn128.Curve.Companion.multiply
import com.iteratec.evoting.ballotbox.util.bn128.Curve.Companion.neg
import com.iteratec.evoting.ballotbox.util.bn128.FQ.Companion.field_modulus
import com.iteratec.evoting.ballotbox.util.bn128.Pairing.pairing
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import java.math.BigInteger

class BN128Test {

    @Test
    fun testFQOperators() {
        assertEquals(FQ(4), FQ(2) * FQ(2))
        assertEquals(FQ(2) / FQ(7) + FQ(9) / FQ(7), FQ(11) / FQ(7))
        assertEquals(FQ(2) * FQ(7) + FQ(9) * FQ(7), FQ(11) * FQ(7))
        assertEquals(FQ(9).pow(field_modulus), FQ(9))
    }

    @Test
    fun testFQ2() {
        val x = FQ2(arrayOf(1, 0))
        val f = FQ2(arrayOf(1, 2))
        val fxp = FQ2(arrayOf(2, 2))
        val one = FQ2(arrayOf(1, 0))

        assertEquals(fxp, x + f)
        assertEquals(one, f / f)
        assertEquals(one / f + x / f, (one + x) / f)
        assertEquals(one * f + x * f, (one + x) * f)
        assertEquals(one, x.pow(field_modulus.pow(2).minus(BigInteger.ONE)))
    }

    @Test
    fun testFQ12() {
        val x = FQ12(arrayOf(1) + Array(11) { 0 })
        val f = FQ12(arrayOf(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12))
        val fpx = FQ12(arrayOf(2, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12))
        val one = FQ12(x.coefficients)
        assertEquals(fpx, x + f)
        assertEquals(one, f / f)
        assertEquals(one / f + x / f, (one + x) / f)
        assertEquals(one * f + x * f, (one + x) * f)
        assertEquals(one, x.pow(field_modulus.pow(12) - BigInteger.ONE))
    }

    @Test
    fun testG1() {
        assertEquals(add(add(double(G1), G1), G1), double(double(G1)))
        assertNotEquals(double(G1), G1)
        assertEquals(add(multiply(G1, BigInteger("9")), multiply(G1, BigInteger("5"))), add(multiply(G1, BigInteger("12")), multiply(G1, BigInteger.TWO)))
        assertTrue(isInf(multiply(G1, curve_order)))
    }

    @Test
    fun testG2() {
        assertEquals(add(add(double(G2), G2), G2), double(double(G2)))
        assertNotEquals(double(G2), G2)
        assertEquals(add(multiply(G2, BigInteger("9")), multiply(G2, BigInteger("5"))), add(multiply(G2, BigInteger("12")), multiply(G2, BigInteger.TWO)))
        assertTrue(isInf(multiply(G2, curve_order)))

        assertFalse(isInf(multiply(G2, BigInteger.TWO * field_modulus - curve_order)))
        assertTrue(isOnCurve(multiply(G2, BigInteger("9")), b2))
    }

    @Test
    fun testG12() {
        assertEquals(add(add(double(G12), G12), G12), double(double(G12)))
        assertNotEquals(double(G12), G12)
        assertEquals(add(multiply(G12, BigInteger("9")), multiply(G12, BigInteger("5"))), add(multiply(G12, BigInteger("12")), multiply(G12, BigInteger.TWO)))
        assertTrue(isInf(multiply(G12, curve_order)))
    }

    @Test
    fun testNegativeG1() {
        val p1 = pairing(G2, G1)
        val pn1 = pairing(G2, neg(G1))
        assertEquals(FQ12.ONE, p1 * pn1)
    }

    @Test
    fun test() {
        val pn1 = pairing(G2, neg(G1))
        val p1 = pairing(G2, G1)
        val p2 = pairing(G2, multiply(G1, BigInteger.TWO))
        assertEquals(pn1 * p1 * p1 * pn1 * p2, p2 * pn1 * pn1 * p1 * p1)
    }

    @Test
    fun testNegativeG2() {
        val p1 = pairing(G2, G1)
        val pn1 = pairing(G2, neg(G1))

        val np1 = pairing(neg(G2), G1)
        assertEquals(FQ12.ONE, p1 * np1)
        assertEquals(pn1, np1)
    }

    @Test
    fun testPairingOrder() {
        val p1 = pairing(G2, G1)
        assertEquals(FQ12.ONE, p1.pow(curve_order))
    }

    @Test
    fun testPairingBilinearityG1() {
        val p1 = pairing(G2, G1)
        val p2 = pairing(G2, multiply(G1, BigInteger.TWO))
        assertEquals(p2, p1 * p1)
    }

    @Test
    fun testPairingBilinearityG2() {
        val p3 = pairing(multiply(G2, BigInteger("27")), multiply(G1, BigInteger("37")))
        val po3 = pairing(G2, multiply(G1, BigInteger("999")))
        assertEquals(p3, po3)
    }

    @Test
    fun testPairingNonDegenerate() {
        val p1 = pairing(G2, G1)
        val p2 = pairing(G2, multiply(G1, BigInteger.TWO))
        val np1 = pairing(neg(G2), G1)

        assertNotEquals(p1, p2)
        assertNotEquals(p1, np1)
        assertNotEquals(p2, np1)
    }

}
