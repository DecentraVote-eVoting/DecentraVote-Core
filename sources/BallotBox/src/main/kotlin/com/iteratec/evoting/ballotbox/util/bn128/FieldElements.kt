/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.ballotbox.util.bn128

import java.math.BigInteger
import java.util.LinkedList

interface F<T> {
    operator fun plus(other: T): T
    operator fun times(other: T): T
    operator fun times(other: FQ): T
    operator fun div(other: T): T
    operator fun div(other: FQ): T
    operator fun minus(other: T): T
    operator fun unaryMinus(): T
    fun pow(other: BigInteger): T
    fun one(): T
    fun zero(): T
}

class FQ : F<FQ> {
    var n: BigInteger

    constructor(n: BigInteger) {
        if (n >= field_modulus || n < BigInteger.ZERO) {
            this.n = n.mod(field_modulus)
        } else {
            this.n = n
        }
    }

    constructor(n: Int) : this(BigInteger.valueOf(n.toLong()))

    override operator fun plus(other: FQ): FQ = FQ(this.n + other.n)

    override operator fun minus(other: FQ): FQ = FQ(this.n - other.n)

    override fun unaryMinus(): FQ = FQ(-this.n)

    override operator fun times(other: FQ): FQ = FQ(this.n * other.n)

    override operator fun div(other: FQ): FQ = this * other.inv()

    override fun pow(other: BigInteger): FQ {
        return when {
            other == BigInteger.ZERO -> {
                ONE
            }
            other == BigInteger.ONE -> {
                FQ(this.n)
            }
            other.mod(BigInteger.TWO) == BigInteger.ZERO -> {
                (this * this).pow(other / BigInteger.TWO)
            }
            else -> {
                (this * this).pow(other / BigInteger.TWO) * this
            }
        }
    }

    fun inv(): FQ {
        val n = field_modulus
        val a = this.n
        if (this.n == BigInteger.ZERO) {
            return ZERO
        }
        var lm = BigInteger.ONE
        var hm = BigInteger.ZERO
        var low = a
        var high = n

        while (low.compareTo(BigInteger.ONE) == 1) {
            val r: BigInteger = high / low
            val nm = hm - (lm * r)
            val new = high - (low * r)
            hm = lm
            lm = nm
            high = low
            low = new
        }
        return FQ(lm)
    }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as FQ

        if (n != other.n) return false

        return true
    }

    override fun hashCode(): Int = n.hashCode()

    override fun toString(): String = "FQ($n)"


    companion object {
        val field_modulus = BigInteger("21888242871839275222246405745257275088696311157297823662689037894645226208583")
        val ZERO = FQ(0)
        val ONE = FQ(1)
        val TWO = FQ(2)
    }

    override fun one(): FQ = ONE

    override fun zero(): FQ = ZERO
}

abstract class FQP<T : FQP<T>> : F<T> {
    var coefficients: Array<FQ> = arrayOf()
    var modulus_coeffs: Array<Int> = arrayOf()
    var degree: Int = 0

    abstract override fun one(): T
    abstract override fun zero(): T

    abstract fun init(n: Array<FQ>): T

    override operator fun plus(other: T): T {
        assert(this.degree == other.degree)
        return this.init(this.coefficients.zip(other.coefficients) { a, b -> a + b }.toTypedArray())
    }

    override operator fun minus(other: T): T {
        assert(this.degree == other.degree)
        return this.init(this.coefficients.zip(other.coefficients) { a, b -> a - b }.toTypedArray())
    }

    override fun unaryMinus(): T = this.init(this.coefficients.map { c -> -c }.toTypedArray())


    override operator fun div(other: T): T {
        assert(this.degree == other.degree)
        return this * other.inv()
    }

    override operator fun div(other: FQ): T = this.init(this.coefficients.map { coeff -> coeff / other }.toTypedArray())

    override operator fun times(other: T): T {
        assert(this.degree == other.degree)
        val b: MutableList<FQ> = MutableList(this.degree * 2 - 1) { FQ.ZERO }
        for (i in 0 until this.degree) {
            for (j in 0 until this.degree) {
                b[i + j] += FQ(this.coefficients[i].n * other.coefficients[j].n)
            }
        }
        while (b.size > this.degree) {
            val exp = b.size - this.degree - 1
            val top = b.removeAt(b.size - 1)
            for (i in 0 until this.degree) {
                b[exp + i] -= top * FQ(modulus_coeffs[i])
            }
        }

        return this.init(b.toTypedArray())
    }

    override operator fun times(other: FQ): T = this.init(this.coefficients.map { c -> c * other }.toTypedArray())

    override fun pow(other: BigInteger): T {
        var _other = other
        var o = this.one()
        var t = this
        var counter = 0
        while (_other > BigInteger.ZERO) {
            if (_other.testBit(0)) {
                o = t * o
                counter++
            }
            _other = _other.shiftRight(1)
            t = (t as T * t)
            counter++
        }
        return o
    }

    fun pow(list: LinkedList<Boolean>): T {
        var o = this.one()
        var t = this

        for (i in list) {
            if (i) {
                o = t * o
            }
            t = (t as T * t)
        }
        return o
    }

    fun inv(): T {
        var lm: Array<FQ> = arrayOf(FQ.ONE, *(0 until this.degree).map { _ -> FQ.ZERO }.toTypedArray())
        var hm: Array<FQ> = Array<FQ>(this.degree + 1) { FQ.ZERO }
        var low: Array<FQ> = arrayOf(*this.coefficients, FQ.ZERO)
        var high: Array<FQ> = arrayOf(*this.modulus_coeffs, 1).map { v -> FQ(v) }.toTypedArray()

        while (deg(low) != 0) {
            var r = polyRoundedDiv(high, low)
            r = arrayOf(*r, *(Array<FQ>(this.degree + 1 - r.size) { FQ.ZERO }))
            val nm = hm.copyOf()
            val new = high.copyOf()

            assert(lm.size == this.degree + 1)
            assert(hm.size == this.degree + 1)
            assert(low.size == this.degree + 1)
            assert(high.size == this.degree + 1)
            assert(nm.size == this.degree + 1)
            assert(new.size == this.degree + 1)

            for (i in 0..this.degree) {
                for (j in 0..this.degree - i) {
                    nm[i + j] -= lm[i] * r[j]
                    new[i + j] -= low[i] * r[j]
                }
            }
            hm = lm
            lm = nm
            high = low
            low = new
        }

        return this.init(lm.slice(0 until this.degree).toTypedArray()) / low[0]
    }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as FQP<*>

        if (!coefficients.contentEquals(other.coefficients)) return false
        if (!modulus_coeffs.contentEquals(other.modulus_coeffs)) return false
        if (degree != other.degree) return false

        return true
    }

    override fun hashCode(): Int {
        var result = coefficients.contentHashCode()
        result = 31 * result + modulus_coeffs.contentHashCode()
        result = 31 * result + degree
        return result
    }

    override fun toString(): String = "FQP(${coefficients.contentToString()})"


    companion object {

        fun deg(p: Array<FQ>): Int {
            return deg(p.map { v -> v.n }.toTypedArray())
        }

        fun deg(p: Array<BigInteger>): Int {
            var d = p.size - 1
            while ((p[d] == BigInteger.ZERO && d != 0)) {
                d -= 1
            }
            return d
        }

        fun polyRoundedDiv(a: Array<FQ>, b: Array<FQ>): Array<FQ> {
            val dega = deg(a)
            val degb = deg(b)
            val temp = a.copyOf()
            val o = Array<FQ>(a.size) { FQ.ZERO }
            for (i in (dega - degb) downTo 0) {
                o[i] += temp[degb + i] / b[degb]
                for (c in 0..degb) {
                    temp[c + i] -= o[c]
                }
            }
            return o.slice(0..deg(o)).toTypedArray()
        }
    }


}

class FQ2 : FQP<FQ2> {

    override fun init(n: Array<FQ>): FQ2 = FQ2(n)

    constructor(coefficents: Array<FQ>) {
        assert(coefficents.size == 2)
        this.coefficients = coefficents
        this.modulus_coeffs = arrayOf(1, 0)
        this.degree = 2
    }

    constructor(coefficients: Array<BigInteger>) : this(coefficients.map { c -> FQ(c) }.toTypedArray())

    constructor(coefficients: Array<Int>) : this(coefficients.map { c -> BigInteger.valueOf(c.toLong()) }.toTypedArray())

    companion object {
        val ONE = FQ2(arrayOf(1, 0))
        val ZERO = FQ2(arrayOf(0, 0))
    }

    override fun one(): FQ2 = ONE

    override fun zero(): FQ2 = ZERO
}

class FQ12 : FQP<FQ12> {

    override fun init(n: Array<FQ>): FQ12 {
        return FQ12(n)
    }

    constructor(coefficents: Array<FQ>) {
        assert(coefficents.size == 12)
        this.coefficients = coefficents
        this.modulus_coeffs = arrayOf(82, 0, 0, 0, 0, 0, -18, 0, 0, 0, 0, 0)
        this.degree = 12
    }

    constructor(coefficients: Array<BigInteger>) : this(coefficients.map { c -> FQ(c) }.toTypedArray())

    constructor(coefficients: Array<Int>) : this(coefficients.map { c -> BigInteger.valueOf(c.toLong()) }.toTypedArray())

    companion object {
        val ONE = FQ12(arrayOf(1) + Array(11) { 0 })
        val ZERO = FQ12(Array(12) { FQ.ZERO } )
    }

    override fun one(): FQ12 {
        return ONE
    }

    override fun zero(): FQ12 {
        return ZERO
    }
}
