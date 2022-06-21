package com.iteratec.evoting.oracle.service

import org.bouncycastle.jce.provider.BouncyCastleProvider
import org.springframework.stereotype.Service
import java.security.DigestException
import java.security.MessageDigest
import java.security.SecureRandom
import java.util.*
import javax.crypto.Cipher
import javax.crypto.spec.IvParameterSpec
import javax.crypto.spec.SecretKeySpec

@Service
class AesEncryptionService {
    private fun generateKeyAndIV(keyLength: Int, ivLength: Int, iterations: Int, salt: ByteArray?, password: ByteArray?, md: MessageDigest): Array<ByteArray?>? {
        val digestLength = md.digestLength
        val requiredLength = (keyLength + ivLength + digestLength - 1) / digestLength * digestLength
        val generatedData = ByteArray(requiredLength)
        var generatedLength = 0
        return try {
            md.reset()

            // Repeat process until sufficient data has been generated
            while (generatedLength < keyLength + ivLength) {

                // Digest data (last digest if available, password data, salt if available)
                if (generatedLength > 0) md.update(generatedData, generatedLength - digestLength, digestLength)
                md.update(password)
                if (salt != null) md.update(salt, 0, 8)
                md.digest(generatedData, generatedLength, digestLength)

                // additional rounds
                for (i in 1 until iterations) {
                    md.update(generatedData, generatedLength, digestLength)
                    md.digest(generatedData, generatedLength, digestLength)
                }
                generatedLength += digestLength
            }

            // Copy key and IV into separate byte arrays
            val result = arrayOfNulls<ByteArray>(2)
            result[0] = Arrays.copyOfRange(generatedData, 0, keyLength)
            if (ivLength > 0) result[1] = Arrays.copyOfRange(generatedData, keyLength, keyLength + ivLength)
            result
        } catch (e: DigestException) {
            throw RuntimeException(e)
        } finally {
            // Clean out temporary data
            Arrays.fill(generatedData, 0.toByte())
        }
    }

    fun encrypt(stringToEncrypt: String, password: String): String? {
        return try {
            val sr = SecureRandom()
            val salt = ByteArray(8)
            sr.nextBytes(salt)
            val keyAndIV = generateKeyAndIV(32, 16, 1, salt, password.toByteArray(),
                    MessageDigest.getInstance("MD5"))
            val cipher: Cipher = Cipher.getInstance("AES/CBC/PKCS7Padding", BouncyCastleProvider.PROVIDER_NAME)
            cipher.init(Cipher.ENCRYPT_MODE, SecretKeySpec(keyAndIV!![0], "AES"), IvParameterSpec(keyAndIV[1]))
            val encryptedData = cipher.doFinal(stringToEncrypt.toByteArray())
            val prefixAndSaltAndEncryptedData = ByteArray(16 + encryptedData.size)
            // Copy prefix (0-th to 7-th bytes)
            System.arraycopy("Salted__".toByteArray(), 0, prefixAndSaltAndEncryptedData, 0, 8)
            // Copy salt (8-th to 15-th bytes)
            System.arraycopy(salt, 0, prefixAndSaltAndEncryptedData, 8, 8)
            // Copy encrypted data (16-th byte and onwards)
            System.arraycopy(encryptedData, 0, prefixAndSaltAndEncryptedData, 16, encryptedData.size)
            Base64.getEncoder().encodeToString(prefixAndSaltAndEncryptedData)
        } catch (e: java.lang.Exception) {
            throw RuntimeException(e)
        }
    }
}