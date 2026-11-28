const hre = require("hardhat");

async function main() {
  const [admin, organizationA, organizationB, organizationC] =
    await hre.ethers.getSigners();
  const validationFactory = await hre.ethers.getContractFactory("CTIValidation");
  const validation = await validationFactory.deploy();
  await validation.waitForDeployment();

  for (const organization of [organizationA, organizationB, organizationC]) {
    const transaction = await validation.registerOrganization(organization.address);
    await transaction.wait();
  }

  console.log(`CTIValidation: ${await validation.getAddress()}`);
  console.log(`Admin: ${admin.address}`);
  console.log(`Organization A: ${organizationA.address}`);
  console.log(`Organization B: ${organizationB.address}`);
  console.log(`Organization C: ${organizationC.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
