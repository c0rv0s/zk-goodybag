const { Identity } = require("@semaphore-protocol/identity");
const { Group } = require("@semaphore-protocol/group");
const {
  generateProof,
  packToSolidityProof,
  verifyProof,
} = require("@semaphore-protocol/proof");
const { expect } = require("chai");
const { run, ethers } = require("hardhat");

const wasmFilePath = "./static/semaphore.wasm";
const zkeyFilePath = "./static/semaphore.zkey";

describe("claim goody bag", function () {
  let sempahore;
  let bag;
  let verifier;

  let owner, otherAccount;
  let accounts = [];

  const users = [];
  const groupIds = [1, 2, 3, 4];
  const group = new Group();
  const logs = false;

  before(async () => {
    [owner, otherAccount] = await ethers.getSigners();
    accounts = [owner, otherAccount];

    const { address: verifierAddress } = await run("deploy:verifier", {
      logs,
      merkleTreeDepth: 20,
    });

    const { address } = await run("deploy:semaphore", {
      logs,
      verifiers: [
        {
          merkleTreeDepth: 20,
          contractAddress: verifierAddress,
        },
      ],
    });

    users.push({
      identity: new Identity(),
      username: ethers.utils.formatBytes32String("anon1"),
    });

    users.push({
      identity: new Identity(),
      username: ethers.utils.formatBytes32String("anon2"),
    });

    group.addMember(users[0].identity.generateCommitment());
    group.addMember(users[1].identity.generateCommitment());

    const semaphoreAddress = address;

    // deploy goody bag
    const Bag = await hre.ethers.getContractFactory("GoodyBag");
    bag = await Bag.deploy();
    await bag.deployed();

    // deploy verifier
    const Verifier = await hre.ethers.getContractFactory("ZKVerifier");
    verifier = await Verifier.deploy(semaphoreAddress, bag.address);
    await verifier.deployed();

    // set verfier in goody bag
    await bag.init(verifier.address);
  });

  it("create group", async () => {
    const tx = await verifier.createGroup(groupIds[0], "uri", 0, 0);
    await expect(tx).to.emit(verifier, "GroupCreated");

    expect(await verifier.groupIds(groupIds[0])).to.equal(true);
  });

  it("join group", async () => {
    for (let i = 0; i < group.members.length; i++) {
      const transaction = verifier.joinGroup(
        group.members[i],
        users[i].username,
        groupIds[0]
      );

      await expect(transaction)
        .to.emit(verifier, "NewUser")
        .withArgs(group.members[i], users[i].username, groupIds[0]);
    }
  });

  it("claim bag", async () => {
    for (let i = 0; i < group.members.length; i++) {
      const signal = ethers.utils.formatBytes32String("ClubSpace");
      const fullProof = await generateProof(
        users[i].identity,
        group,
        groupIds[0],
        signal,
        {
          wasmFilePath,
          zkeyFilePath,
        }
      );
      const solidityProof = packToSolidityProof(fullProof.proof);

      const transaction = verifier.claim(
        groupIds[0],
        accounts[i].address,
        signal,
        fullProof.publicSignals.merkleRoot,
        fullProof.publicSignals.nullifierHash,
        solidityProof
      );

      await expect(transaction)
        .to.emit(verifier, "Claim")
        .withArgs(accounts[i].address, groupIds[0]);
    }
  });

  it("multiple groups, claims", async () => {
    for (let i = 1; i < groupIds.length; i++) {
      // create group
      await verifier.createGroup(groupIds[i], "uri", 0, 0);

      // join group
      for (let j = 0; j < group.members.length; j++) {
        await verifier.joinGroup(
          group.members[j],
          users[j].username,
          groupIds[i]
        );
      }

      // claim
      for (let j = 0; j < group.members.length; j++) {
        const signal = ethers.utils.formatBytes32String("ClubSpace");
        const fullProof = await generateProof(
          users[j].identity,
          group,
          groupIds[i],
          signal,
          {
            wasmFilePath,
            zkeyFilePath,
          }
        );
        const solidityProof = packToSolidityProof(fullProof.proof);

        await verifier.claim(
          groupIds[i],
          accounts[j].address,
          signal,
          fullProof.publicSignals.merkleRoot,
          fullProof.publicSignals.nullifierHash,
          solidityProof
        );
      }
    }
  });

  it.skip("offchain group", async () => {
    // create new group
    const tx = await verifier.createGroup(groupIds[1], "uri", 0, 0);
    await expect(tx).to.emit(verifier, "GroupCreated");
    expect(await verifier.groupIds(groupIds[1])).to.equal(true);

    // off chain membership
    const offChainGroup = new Group(20);
    offChainGroup.addMember(users[0].identity.generateCommitment());
    offChainGroup.addMember(users[1].identity.generateCommitment());

    // verify
    const signal = ethers.utils.formatBytes32String("ClubSpace");
    const fullProof = await generateProof(
      users[0].identity,
      offChainGroup,
      groupIds[1],
      signal,
      {
        wasmFilePath,
        zkeyFilePath,
      }
    );
    const solidityProof = packToSolidityProof(fullProof.proof);

    const transaction = verifier.claim(
      groupIds[1],
      accounts[0].address,
      signal,
      fullProof.publicSignals.merkleRoot,
      fullProof.publicSignals.nullifierHash,
      solidityProof
    );

    await expect(transaction)
      .to.emit(verifier, "Claim")
      .withArgs(accounts[i].address, groupIds[1]);
  });
});
