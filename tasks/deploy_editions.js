const { task, types } = require("hardhat/config");
const fs = require("fs");

task("deploy_editions", "Deploy a ZKEditions verifier")
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

    // deploy verifier
    const Verifier = await hre.ethers.getContractFactory("ZKEditionsVerifier");
    const verifier = await Verifier.deploy(semaphoreAddress);
    await verifier.deployed();

    if (logs) {
      console.log(
        `verifier deployed ${verifier.address}`
      );
    }

    // save addresses
    const data = JSON.stringify(
      {
        semaphoreAddress,
        verifierAddress: verifier.address,
      },
      undefined,
      2
    );
    const network = await hre.ethers.provider.getNetwork();
    if (!fs.existsSync("deployments")) {
      fs.mkdirSync("deployments");
    }

    fs.writeFileSync(
      `deployments/editions_deployment_${network.chainId}.json`,
      data,
      (err) => {
        if (err) {
          throw err;
        }
      }
    );

    return true;
  });
