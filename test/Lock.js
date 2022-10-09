const {
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");

describe("Lock", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployOneYearLockFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const Lock = await ethers.getContractFactory("ZKVerifier");
    const lock = await Lock.deploy("0xDC4471ee9DFcA619Ac5465FdE7CF2634253a9dc6", "0xDC4471ee9DFcA619Ac5465FdE7CF2634253a9dc6");

    return { lock, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should set the right unlockTime", async function () {
      const { lock } = await loadFixture(deployOneYearLockFixture);

      console.log(await lock.axe("0xDC4471ee9DFcA619Ac5465FdE7CF2634253a9dc6"))
    });

  });

})
