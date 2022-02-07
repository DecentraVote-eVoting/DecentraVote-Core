/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.solidity.json;

import java.math.BigInteger;

public class Profile {

    private String httpRpcServer;
    private String wsRpcServer;
    private String ensRegistryAddress;
    private int networkId;
    private BigInteger gasPrice;
    private BigInteger gasLimit;

    // TODO Maybe use a map for the addresses to reduce the number of parameters
    public Profile(
            String wsRpcServer, String httpRpcServer,
            String ensRegistryAddress,
            int networkId, BigInteger gasPrice,
            BigInteger gasLimit) {
        this.wsRpcServer = wsRpcServer;
        this.httpRpcServer = httpRpcServer;
        this.networkId = networkId;
        this.gasPrice = gasPrice;
        this.gasLimit = gasLimit;
        this.ensRegistryAddress = ensRegistryAddress;
    }

    public Profile() {
        this("ws://localhost:7545",
                "http://localhost:7545",
                "",
                5777,
                new BigInteger("1000000"),
                new BigInteger("10000000"));
    }

    public String getWsRpcServer() {
        return wsRpcServer;
    }

    public String getHttpRpcServer() {
        return httpRpcServer;
    }


    public int getNetworkId() {
        return networkId;
    }

    public BigInteger getGasPrice() {
        return gasPrice;
    }

    public BigInteger getGasLimit() {
        return gasLimit;
    }

    public void setWsRpcServer(String wsRpcServer) {
        this.wsRpcServer = wsRpcServer;
    }

    public void setHttpRpcServer(String httpRpcServer) {
        this.httpRpcServer = httpRpcServer;
    }

    public void setNetworkId(int networkId) {
        this.networkId = networkId;
    }

    public void setGasPrice(BigInteger gasPrice) {
        this.gasPrice = gasPrice;
    }

    public void setGasLimit(BigInteger gasLimit) {
        this.gasLimit = gasLimit;
    }

    public String getEnsRegistryAddress() {
        return ensRegistryAddress;
    }

    public void setEnsRegistryAddress(String ensRegistryAddress) {
        this.ensRegistryAddress = ensRegistryAddress;
    }
}
