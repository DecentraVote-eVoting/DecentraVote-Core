/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.ballotbox.configuration

import com.github.benmanes.caffeine.cache.Cache
import com.github.benmanes.caffeine.cache.Caffeine
import com.iteratec.evoting.ballotbox.model.VoteState
import org.checkerframework.checker.nullness.qual.NonNull
import org.springframework.cache.annotation.EnableCaching
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.web3j.abi.datatypes.Address
import java.util.concurrent.TimeUnit

const val MAX_CACHE_SIZE: Long = 500

@EnableCaching
@Configuration
class CacheConfig {

    @Bean
    fun isVoteCache(): @NonNull Cache<Address, Boolean> {
        return Caffeine.newBuilder()
            .maximumSize(MAX_CACHE_SIZE)
            .expireAfterWrite(600, TimeUnit.SECONDS)
            .build()
    }

    @Bean
    fun voteStageCache(): @NonNull Cache<String, VoteState> {
        return Caffeine.newBuilder()
            .maximumSize(MAX_CACHE_SIZE)
            .expireAfterWrite(5, TimeUnit.SECONDS)
            .build()
    }

}
