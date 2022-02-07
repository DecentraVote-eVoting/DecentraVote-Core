/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.storageservice.controller

import com.google.gson.Gson
import com.iteratec.evoting.storageservice.dto.StorageData
import com.iteratec.evoting.storageservice.extensions.toHash
import com.iteratec.evoting.storageservice.service.SignatureService
import com.iteratec.evoting.storageservice.service.StorageService
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.HttpHeaders
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.context.junit4.SpringRunner
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.MvcResult
import org.springframework.test.web.servlet.ResultActions
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultHandlers.print
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status


@RunWith(SpringRunner::class)
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("local")
class StorageControllerTest {

    @Autowired
    lateinit var mockMvc: MockMvc

    @Autowired
    lateinit var storageService: StorageService

    @Autowired
    lateinit var signatureService: SignatureService

    private val charPool: List<Char> = ('a'..'z') + ('A'..'Z') + ('0'..'9')

    val gson = Gson()

    fun createSignatureHeaders(): HttpHeaders {
        val signature = signatureService.createSignature()
        val headers = HttpHeaders()

        headers["Signature"] = listOf(signature.signature)
        headers["message"] = listOf(signature.message)

        return headers
    }

    /* Utility Functions */

    fun getRandomString(length: Int): String {
        return (1..length)
            .map { kotlin.random.Random.nextInt(0, charPool.size) }
            .map(charPool::get)
            .joinToString("")
    }

    fun getRandomValidStorageData(): StorageData {
        val data = getRandomString(12)
        val hash = data.toHash()
        return StorageData(hash, data)
    }

    fun getRandomInvalidStorageData(): StorageData {
        val data = getRandomString(12)
        val hash = "0"
        return StorageData(hash, data)
    }

    fun getBodyForStorageDataList(storageDataList: List<StorageData>): String {
        return gson.toJson(storageDataList)
    }

    fun getListOfStorageData(count: Int, valid: Boolean): List<StorageData> {
        return (1..count).map {
            if (valid) getRandomValidStorageData() else getRandomInvalidStorageData()
        }
    }

    fun fillDatabaseWithRandomDataAndReturnCorrespondingData(count: Int, public: Boolean): List<StorageData> {
        val list = getListOfStorageData(count, true)
        list.forEach { entry -> storageService.saveData(entry, public) }
        return list
    }

    fun compareResultWithDataList(result: MvcResult, dataList: List<StorageData>): Boolean {
        val jsonString = result.response.contentAsString
        val resultList = gson.fromJson(jsonString, Array<StorageData>::class.java).toList()
        return resultList.containsAll(dataList)
    }

    fun getRequest(hashList: List<String>): ResultActions {
        return mockMvc.perform(
            post("/api/storage/get")
                .contentType("application/json")
                .content(Gson().toJson(hashList))
                .headers(createSignatureHeaders())
        )
    }

    fun saveRequest(dataList: List<StorageData>): ResultActions {
        return mockMvc.perform(
            post("/api/storage/save")
                .contentType("application/json")
                .content(Gson().toJson(dataList))
                .headers(createSignatureHeaders())
        )
    }

    @Before
    fun clearDatabase() {
        storageService.deleteAllData()
    }

    /* Misc Tests*/

    // Malformed JSON wird gesendet und Request wird denied
    @Test
    fun malformed_json_gets_rejected() {
        val liste = listOf(StorageData("hacker".toHash(), "hax.exe"))
        saveRequest(liste)
            .andDo(print())
            .andExpect(status().isBadRequest)
    }

    /* Single POST */
    // Ein valider StorageData JSON wird gesendet und gespeichert
    @Test
    fun single_post_success_with_valid_data() {
        val liste = getListOfStorageData(1, true)
        saveRequest(liste)
            .andDo(print())
            .andExpect(status().isOk)
    }

    // Ein ungültiger StorageData JSON wird gesendet und der Request wird denied
    @Test
    fun single_post_failure_with_invalid_data() {
        val liste = getListOfStorageData(1, false)
        saveRequest(liste)
            .andDo(print())
            .andExpect(status().isBadRequest)
    }

    /* Multi POST */
    // Mehrere valide StorageData JSON werden gesendet und gespeichert
    @Test
    fun multi_post_success_with_valid_data() {
        val liste = getListOfStorageData(5, true)
        saveRequest(liste)
            .andDo(print())
            .andExpect(status().isOk)
    }

    // Mehrere StorageData JSON werden gesendet, nicht alle sind valide. Sollen der Request denied werden, oder die korrekten Daten angenommen
    @Test
    fun multi_post_failure_with_invalid_data() {
        val liste = getListOfStorageData(5, false)
        saveRequest(liste)
            .andDo(print())
            .andExpect(status().isBadRequest)
    }

    /* Single GET */
    @Test
    fun valid_hash_is_requested_and_the_correct_data_is_returned() {
        val dataList = fillDatabaseWithRandomDataAndReturnCorrespondingData(1, true)

        val result = getRequest(dataList.map(StorageData::hash))
            .andExpect(status().isOk)
            .andReturn()

        assert(compareResultWithDataList(result, dataList))
    }

    @Test
    fun valid_hash_is_requested_but_the_data_is_not_present_on_the_server() {
        val validHash = "Test".toHash()

        getRequest(listOf(validHash))
            .andExpect(status().isNotFound)
    }

    @Test
    fun invalid_hash_is_request_and_rejected() {
        val invalidHash = "drölf"

        getRequest(listOf(invalidHash))
            .andExpect(status().isBadRequest)
    }

    /* Multi GET */
    @Test
    fun multiple_valid_hashes_are_request_and_the_correct_data_is_returned() {
        val dataList = fillDatabaseWithRandomDataAndReturnCorrespondingData(5, true)

        val result = getRequest(dataList.map(StorageData::hash))
            .andExpect(status().isOk)
            .andReturn()

        assert(compareResultWithDataList(result, dataList))
    }

    @Test
    fun multiple_valid_hashes_are_requested_but_not_all_data_is_present() {
        val dataList = fillDatabaseWithRandomDataAndReturnCorrespondingData(3, true)
            .plusElement(StorageData("MissingHash".toHash(), "MissingHash"))

        val result = getRequest(dataList.map(StorageData::hash))
            .andExpect(status().isOk)
            .andReturn()

        assert(!compareResultWithDataList(result, dataList))
    }

    @Test
    fun multiple_hashes_containing_valids_and_invalids_are_requested() {
        val dataList = getListOfStorageData(3, true) + getListOfStorageData(3, false)

        getRequest(dataList.map(StorageData::hash))
            .andExpect(status().isBadRequest)
    }

}
