/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.ballotbox.util.bn128

import java.math.BigInteger


class Curve {
    companion object {

        val curve_order = BigInteger("21888242871839275222246405745257275088548364400416034343698204186575808495617")
        val b = FQ(3)
        val b2 = FQ2(arrayOf(3, 0)) / FQ2(arrayOf(9, 1))
        private val b12 = FQ12(arrayOf(3) + Array(11) { 0 })

        private val w = FQ12(arrayOf(0, 1) + Array(10) { 0 })
        private val w2 = w.pow(BigInteger.TWO)
        private val w3 = w.pow(BigInteger.valueOf(3L))

        val G1 = Point<FQ>(FQ(1), FQ(2), FQ(1))
        val G2 = Point<FQ2>(
            FQ2(
                arrayOf(
                    BigInteger("10857046999023057135944570762232829481370756359578518086990519993285655852781"),
                    BigInteger("11559732032986387107991004021392285783925812861821192530917403151452391805634"),
                )
            ),
            FQ2(
                arrayOf(
                    BigInteger("8495653923123431417604973247489272438418190587263600148770280649306958101930"),
                    BigInteger("4082367875863433681332203403145435568316851327593401208105741076214120093531"),
                )
            ),
            FQ2.ONE
        )
        val G12 = twist(G2)


        init {
            assert(isOnCurve(G1, b))
            assert(isOnCurve(G2, b2))
            assert(isOnCurve(G12, b12))
        }

        fun twist(pt: Point<FQ2>): Point<FQ12> {
            if (pt.isInfinite()) return Point(FQ12.ONE, FQ12.ONE, FQ12.ZERO)
            val x = pt.x
            val y = pt.y
            val z = pt.z

            val xcoeffs = arrayOf(x.coefficients[0] - x.coefficients[1] * FQ(9), x.coefficients[1])
            val ycoeffs = arrayOf(y.coefficients[0] - y.coefficients[1] * FQ(9), y.coefficients[1])
            val zcoeffs = arrayOf(z.coefficients[0] - z.coefficients[1] * FQ(9), z.coefficients[1])


            val nx = FQ12(
                arrayOf(
                    xcoeffs[0],
                    FQ.ZERO,
                    FQ.ZERO,
                    FQ.ZERO,
                    FQ.ZERO,
                    FQ.ZERO,
                    xcoeffs[1],
                    FQ.ZERO,
                    FQ.ZERO,
                    FQ.ZERO,
                    FQ.ZERO,
                    FQ.ZERO
                )
            )
            val ny = FQ12(
                arrayOf(
                    ycoeffs[0],
                    FQ.ZERO,
                    FQ.ZERO,
                    FQ.ZERO,
                    FQ.ZERO,
                    FQ.ZERO,
                    ycoeffs[1],
                    FQ.ZERO,
                    FQ.ZERO,
                    FQ.ZERO,
                    FQ.ZERO,
                    FQ.ZERO
                )
            )

            val nz = FQ12(
                arrayOf(
                    zcoeffs[0],
                    FQ.ZERO,
                    FQ.ZERO,
                    FQ.ZERO,
                    FQ.ZERO,
                    FQ.ZERO,
                    zcoeffs[1],
                    FQ.ZERO,
                    FQ.ZERO,
                    FQ.ZERO,
                    FQ.ZERO,
                    FQ.ZERO
                )
            )

            return Point<FQ12>(nx * w2, ny * w3, nz)
        }

        fun <T : F<T>> isOnCurve(pt: Point<T>?, b: T): Boolean {
            if (pt == null) return true
            val x = pt.x
            val y = pt.y
            val z = pt.z
            return z * y.pow(BigInteger.TWO) - x.pow(BigInteger.valueOf(3L)) == b * z.pow(BigInteger.valueOf(3L))
        }

        fun <T : F<T>> add(p1: Point<T>, p2: Point<T>): Point<T> {

            if (p1.isInfinite()) return p2
            if (p2.isInfinite()) return p1

            val one = p1.x.one()
            val zero = p1.x.zero()

            if (p1.z == BigInteger.ZERO || p2.z == BigInteger.ZERO) {
                return if (p2.z == BigInteger.ZERO) p1 else p2
            }
            val (x1, y1, z1) = p1
            val (x2, y2, z2) = p2

            val U1 = y2 * z1
            val U2 = y1 * z2
            val V1 = x2 * z1
            val V2 = x1 * z2

            if (V1 == V2 && U1 == U2) return double(p1)
            else if (V1 == V2) return Point(one, one, zero)

            val U = U1 - U2
            val V = V1 - V2
            val V_squared = V * V
            val V_squared_V2 = V_squared * V2
            val V_cubed = V * V_squared

            val W = z1 * z2
            val A = U * U * W - V_cubed - V_squared_V2 * FQ.TWO

            return Point(
                V * A,
                U * (V_squared_V2 - A) - V_cubed * U2,
                V_cubed * W
            )
        }

        fun <T : F<T>> multiply(pt: Point<T>, n: BigInteger): Point<T> {
            if (pt.isInfinite()) return pt
            return when {
                n == BigInteger.ZERO -> {
                    return Point(pt.x.one(), pt.x.one(), pt.x.zero())
                }
                n == BigInteger.ONE -> {
                    pt
                }
                n % BigInteger.TWO == BigInteger.ZERO -> {
                    multiply(double(pt), n / BigInteger.TWO)
                }
                else -> {
                    add(multiply(double(pt), n / BigInteger.TWO), pt)
                }
            }
        }

        fun <T : F<T>> double(pt: Point<T>): Point<T> {
            val (x, y, z) = pt
            val W = x * x * FQ(3)
            val S = y * z
            val B = x * y * S
            val H = W * W - (B * FQ(8))
            val S_squared = S * S
            return Point(
                H * S * FQ(2),
                W * (B * FQ(4) - H) - (y * y * FQ(8) * S_squared),
                S * S_squared * FQ(8)
            )
        }

        fun <T : F<T>> neg(p1: Point<T>): Point<T> {
            if (p1.isInfinite()) {
                return p1
            }
            val (x, y, z) = p1
            return Point(x, -y, z)
        }

        fun <T : F<T>> isInf(pt: Point<T>): Boolean {
            return pt.z == pt.z.zero()
        }
    }
}


class Point<T : F<T>> {

    var x: T
        private set
    var y: T
        private set
    var z: T
        private set

    constructor(x: T, y: T, z: T) {
        this.x = x
        this.y = y
        this.z = z
    }

    fun isInfinite(): Boolean {
        return z == z.zero()
    }

    operator fun component1(): T {
        return x
    }

    operator fun component2(): T {
        return y
    }

    operator fun component3(): T {
        return z
    }

    fun toPoint2(): Pair<T, T> {
        return Pair(x / z, y / z)
    }


    override fun toString(): String {
        return "Point(x=$x, y=$y, z=$z)"
    }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as Point<T>

        val (x1, y1, z1) = this
        val (x2, y2, z2) = other

        if (x1 * z2 == x2 * z1 && y1 * z2 == y2 * z1) {
            return true
        }
        return false
    }

    override fun hashCode(): Int {
        var result = x.hashCode()
        result = 31 * result + y.hashCode()
        result = 31 * result + z.hashCode()
        return result
    }


}
