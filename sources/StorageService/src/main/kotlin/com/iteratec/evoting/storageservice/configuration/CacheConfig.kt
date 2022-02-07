/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.storageservice.configuration

import com.github.benmanes.caffeine.cache.Cache
import com.github.benmanes.caffeine.cache.Caffeine
import com.iteratec.evoting.storageservice.entities.DataEntry
import org.checkerframework.checker.nullness.qual.NonNull
import org.springframework.cache.annotation.EnableCaching
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import java.util.concurrent.TimeUnit

const val MAX_CACHE_SIZE: Long = 1000
const val EXPIRE_AFTER_WRITE_IN_MINUTES: Long = 1

@EnableCaching
@Configuration
class CacheConfig {

    @Bean
    fun dataCache(): @NonNull Cache<String, DataEntry> {
        return Caffeine.newBuilder()
                .maximumSize(MAX_CACHE_SIZE)
                .expireAfterWrite(EXPIRE_AFTER_WRITE_IN_MINUTES, TimeUnit.MINUTES)
                .build()
    }

}
