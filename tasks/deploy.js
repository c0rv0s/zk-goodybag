const { task, types } = require("hardhat/config");
const fs = require("fs");

task("deploy", "Deploy a Greeter contract")
  .addOptionalParam(
    "semaphore",
    "Semaphore contract address",
    undefined,
    types.address
  )
  .addOptionalParam("logs", "Print the logs", true, types.boolean)
  .setAction(async ({ logs, semaphore: semaphoreAddress }, { ethers, run }) => {
    if (!semaphoreAddress) {
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

      semaphoreAddress = address;
    }

    // deploy goody bag
    const Bag = await hre.ethers.getContractFactory("GoodyBag");
    const bag = await Bag.deploy();
    await bag.deployed();

    // deploy verifier
    const Verifier = await hre.ethers.getContractFactory("ZKVerifier");
    const verifier = await Verifier.deploy(semaphoreAddress, bag.address);
    await verifier.deployed();

    // set verfier in goody bag
    await bag.init(verifier.address);

    if (logs) {
      console.log(
        `bag deployed ${bag.address} verifier deployed ${verifier.address}`
      );
    }

    // save addresses
    const data = JSON.stringify({
      semaphoreAddress,
      bagAddress: bag.address,
      verifierAddress: verifier.address,
    });
    const network = await hre.ethers.provider.getNetwork();
    if (!fs.existsSync("deployments")) {
      fs.mkdirSync("deployments");
    }

    fs.writeFileSync(
      `deployments/deployment_${network.chainId}.json`,
      data,
      (err) => {
        if (err) {
          throw err;
        }
      }
    );

    return true;
  });
