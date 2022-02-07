/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.ballotbox.util.bn128

import com.iteratec.evoting.ballotbox.util.bn128.Curve.Companion.add
import com.iteratec.evoting.ballotbox.util.bn128.Curve.Companion.b
import com.iteratec.evoting.ballotbox.util.bn128.Curve.Companion.b2
import com.iteratec.evoting.ballotbox.util.bn128.Curve.Companion.curve_order
import com.iteratec.evoting.ballotbox.util.bn128.Curve.Companion.double
import com.iteratec.evoting.ballotbox.util.bn128.Curve.Companion.isOnCurve
import com.iteratec.evoting.ballotbox.util.bn128.Curve.Companion.neg
import com.iteratec.evoting.ballotbox.util.bn128.Curve.Companion.twist
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.runBlocking
import java.math.BigInteger

object Pairing {

    private val pseudoBinaryEncoding = listOf(
            1, 0, 1, 0, 0, -1, 0, 1, 1, 0, 0, 0, -1, 0, 0, 1, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 1,
            1, 1, 0, 0, 0, 0, -1, 0, 1, 0, 0, -1, 0, 1, 1, 0, 0, 1, 0, 0, -1, 1, 0, 0, -1, 0, 1, 0, 1, 0, 0, 0
    )

    val finalPower = ((FQ.field_modulus.pow(12) - BigInteger.ONE) / (curve_order))

    fun pairing(Q: Point<FQ2>, P: Point<FQ>, finalExponent: Boolean = true): FQ12 {
        assert(isOnCurve(Q, b2))
        assert(isOnCurve(P, b))
        return millerLoop(twist(Q), castPointToFq12(P), finalExponent)
    }

    fun pairing(pre: Precompute, P: Point<FQ>, finalExponent: Boolean = true): FQ12 {
        assert(isOnCurve(P, b))
        return millerLoop(pre, castPointToFq12(P), finalExponent)
    }

    fun millerLoop(Q: Point<FQ12>, P: Point<FQ12>, finalExponent: Boolean): FQ12 {

        return runBlocking(Dispatchers.Default) {
            if (Q.isInfinite() || P.isInfinite()) {
                FQ12(arrayOf(1) + Array(11) { 0 })
            }

            var R = Q
            var f_den = FQ12.ONE
            var f_num = FQ12.ONE

            val com1 = async {
                val nQ = neg(Q)

                for (b in pseudoBinaryEncoding) {
                    var (_n, _d) = linefunc(R, R, P)
                    f_num = f_num * f_num * _n
                    f_den = f_den * f_den * _d
                    R = double(R)

                    if (b == 1) {
                        val (_n1, _d1) = linefunc(R, Q, P)
                        f_num *= _n1
                        f_den *= _d1
                        R = add(R, Q)
                    } else if (b == -1) {
                        val (_n1, _d1) = linefunc(R, nQ, P)
                        f_num *= _n1
                        f_den *= _d1
                        R = add(R, nQ)
                    }
                }
            }


            lateinit var Q1: Point<FQ12>
            lateinit var nQ2: Point<FQ12>
            val com2 = async {
                // assert R == multiply(Q, ate_loop_count)
                Q1 = Point(Q.x.pow(FQ.field_modulus), Q.y.pow(FQ.field_modulus), Q.z.pow(FQ.field_modulus))
                // assert is_on_curve(Q1, b12)
                nQ2 = Point(Q1.x.pow(FQ.field_modulus), -Q1.y.pow(FQ.field_modulus), Q1.z.pow(FQ.field_modulus))
            }
            com2.await()
            com1.await()

            val (_n1, _d1) = linefunc(R, Q1, P)
            R = add(R, Q1)
            val (_n2, _d2) = linefunc(R, nQ2, P)


            val f = (f_num * _n1 * _n2) / (f_den * _d1 * _d2)

            if (finalExponent) {
                f.pow(finalPower)
            } else {
                f
            }
        }
    }

    /**
     * millerLoop for precomputed points
     * */
    fun millerLoop(pre: Precompute, P: Point<FQ12>, finalExponent: Boolean): FQ12 {
        val Q = pre.Q
        val Q1 = pre.Q1
        val nQ2 = pre.nQ2

        if (Q.isInfinite() || P.isInfinite()) {
            return FQ12(arrayOf(1) + Array(11) { 0 })
        }
        var R = Q
        var f_den = FQ12.ONE
        var f_num = FQ12.ONE

        val nQ = neg(Q)

        for (b in pseudoBinaryEncoding) {
            var (_n, _d) = linefunc(R, R, P)
            f_num = f_num * f_num * _n
            f_den = f_den * f_den * _d
            R = double(R)

            if (b == 1) {
                val (_n1, _d1) = linefunc(R, Q, P)
                f_num = f_num * _n1
                f_den = f_den * _d1
                R = add(R, Q)
            } else if (b == -1) {
                val (_n1, _d1) = linefunc(R, nQ, P)
                f_num = f_num * _n1
                f_den = f_den * _d1
                R = add(R, nQ)
            }
        }


        val (_n1, _d1) = linefunc(R, Q1, P)
        R = add(R, Q1)
        val (_n2, _d2) = linefunc(R, nQ2, P)
        val f = (f_num * _n1 * _n2) / (f_den * _d1 * _d2)

        return if (finalExponent) {
            f.pow(finalPower)
        } else {
            f
        }
    }

    private fun linefunc(P1: Point<FQ12>?, P2: Point<FQ12>?, T: Point<FQ12>?): Pair<FQ12, FQ12> {
        if (P1 == null) throw Error()
        if (P2 == null) throw Error()
        if (T == null) throw Error()

        val zero = FQ12.ZERO
        val (x1: FQ12, y1: FQ12, z1: FQ12) = P1
        val (x2: FQ12, y2: FQ12, z2: FQ12) = P2
        val (xt: FQ12, yt: FQ12, zt: FQ12) = T

        var mNumerator = y2 * z1 - y1 * z2
        var mDenominator = x2 * z1 - x1 * z2

        when {
            mDenominator != zero -> {
                return Pair(
                        mNumerator * (xt * z1 - x1 * zt) - mDenominator * (yt * z1 - y1 * zt),
                        mDenominator * zt * z1
                )
            }
            mNumerator == zero -> {
                mNumerator = x1 * x1 * FQ(3)
                mDenominator = y1 * z1 * FQ(2)
                return Pair(
                        mNumerator * (xt * z1 - x1 * zt) - mDenominator * (yt * z1 - y1 * zt),
                        mDenominator * zt * z1
                )
            }
            else -> {
                return Pair(
                        xt * z1 - x1 * zt,
                        z1 * zt
                )
            }
        }
    }

    fun genPrecompute(Q: Point<FQ2>): Precompute {
        val _Q: Point<FQ12> = twist(Q)
        val Q1 = Point(_Q.x.pow(FQ.field_modulus), _Q.y.pow(FQ.field_modulus), _Q.z.pow(FQ.field_modulus))
        // assert is_on_curve(Q1, b12)
        val nQ2 = Point(Q1.x.pow(FQ.field_modulus), -Q1.y.pow(FQ.field_modulus), Q1.z.pow(FQ.field_modulus))

        return Precompute(_Q, Q1, nQ2)
    }

    fun castPointToFq12(pt: Point<FQ>): Point<FQ12> {
        if (pt.isInfinite()) return Point(FQ12.ONE, FQ12.ONE, FQ12.ZERO)
        val (x, y, z) = pt
        return Point(
                FQ12(arrayOf(x.n) + Array(11) { BigInteger.ZERO }),
                FQ12(arrayOf(y.n) + Array(11) { BigInteger.ZERO }),
                FQ12(arrayOf(z.n) + Array(11) { BigInteger.ZERO })
        )
    }
}

data class Precompute(val Q: Point<FQ12>, val Q1: Point<FQ12>, val nQ2: Point<FQ12>)
