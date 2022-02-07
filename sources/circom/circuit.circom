include "./node_modules/circomlib/circuits/mimcsponge.circom";
include "./node_modules/circomlib/circuits/mimc.circom";
include "./node_modules/circomlib/circuits/bitify.circom";

template Hasher1() {
    signal input in;
    signal output hash;
    component hasher = MiMC7(91);
    hasher.x_in <== in;
    hasher.k <== 0;
    hash <== hasher.out;
}

template Hasher2() {
    signal input in[2];
    signal input direction;
    signal output hash;
    signal par[2];
    if (direction == 0) {
        par[0] <-- in[0];
        par[1] <-- in[1];
    } else {
        par[1] <-- in[0];
        par[0] <-- in[1];
    }
    component hasher = MiMCSponge(2, 220, 1);
    hasher.ins[0] <== par[0];
    hasher.ins[1] <== par[1];
    hasher.k <== 0;
    hash <== hasher.outs[0];
}

template Test(levels) {
    signal input anonymous; // unused
    signal input root; // set by smart contract Vote v to v.root
    signal input index;
    signal input nullifier;
    signal private input secret;
    signal private input merkle[levels];
    signal private input direction[levels];
    signal hash[levels+1];
    signal indexbits[256];
    signal indexext;

    component n2b = Num2Bits(256);
    n2b.in <== index;
    for (var i = 0; i < 128; i++) {
        indexbits[i] <== n2b.out[i];
    }
    for (var i = 0; i < levels; i++) {
        if (direction[i] == 0)
            indexbits[128 + i] <-- 0;
        else
            indexbits[128 + i] <-- 1;
    }
    for (var i = 128 + levels; i < 256; i++) {
            indexbits[i] <-- 0;
    }
    component b2n = Bits2Num(256);
    for (var i = 0; i < 256; i++) {
        b2n.in[i] <== indexbits[i];
    }
    indexext <== b2n.out;

    signal secretRoot;
    component secretRootHasher = Hasher2();
    secretRootHasher.in[0] <== secret;
    secretRootHasher.in[1] <== root;
    secretRootHasher.direction <== 0;
    secretRoot <== secretRootHasher.hash;

    component nullifierHasher = Hasher2();
    nullifierHasher.in[0] <== secretRoot;
    nullifierHasher.in[1] <== indexext;
    nullifierHasher.direction <== 0;
    nullifier === nullifierHasher.hash;

    component secretHasher = Hasher1();
    secretHasher.in <== secret;
    hash[0] <== secretHasher.hash;

    component hasher[levels];
    for (var i = 0; i < levels; i++) {
        hasher[i] = Hasher2();
        hasher[i].in[0] <== hash[i];
        hasher[i].in[1] <== merkle[i];
        hasher[i].direction <== direction[i];
        hash[i+1] <== hasher[i].hash;
    }

    hash[levels] === root;
}

component main = Test(12);




