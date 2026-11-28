const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CTIValidation", function () {
  let contract;
  let admin;
  let organizationA;
  let organizationB;
  let organizationC;
  let unauthorized;

  const reportHash = ethers.sha256(ethers.toUtf8Bytes("canonical-report"));

  async function deployAndRegister() {
    [admin, organizationA, organizationB, organizationC, unauthorized] =
      await ethers.getSigners();
    const factory = await ethers.getContractFactory("CTIValidation", admin);
    contract = await factory.deploy();
    await contract.waitForDeployment();

    await contract.registerOrganization(organizationA.address);
    await contract.registerOrganization(organizationB.address);
    await contract.registerOrganization(organizationC.address);
  }

  beforeEach(async function () {
    await deployAndRegister();
  });

  describe("organization registration", function () {
    it("allows only the owner to register up to three distinct organizations", async function () {
      await expect(
        contract.connect(unauthorized).registerOrganization(unauthorized.address)
      ).to.be.revertedWith("Only owner");

      await expect(
        contract.registerOrganization(organizationA.address)
      ).to.be.revertedWith("Organization already registered");

      await expect(
        contract.registerOrganization(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid organization");

      await expect(
        contract.registerOrganization(unauthorized.address)
      ).to.be.revertedWith("Organization limit reached");
    });
  });

  describe("report submission", function () {
    it("requires three registered organizations and an authorized submitter", async function () {
      const factory = await ethers.getContractFactory("CTIValidation", admin);
      const uninitializedContract = await factory.deploy();
      await uninitializedContract.waitForDeployment();

      await expect(
        uninitializedContract
          .connect(organizationA)
          .submitReport(reportHash)
      ).to.be.revertedWith("Organization not registered");

      await uninitializedContract.registerOrganization(organizationA.address);
      await expect(
        uninitializedContract
          .connect(organizationA)
          .submitReport(reportHash)
      ).to.be.revertedWith("Three organizations required");

      await expect(
        contract.connect(unauthorized).submitReport(reportHash)
      ).to.be.revertedWith("Organization not registered");
    });

    it("stores the hash and fixes the two validators at submission time", async function () {
      await expect(
        contract.connect(organizationA).submitReport(reportHash)
      )
        .to.emit(contract, "ReportSubmitted")
        .withArgs(1n, reportHash, organizationA.address);

      const report = await contract.getReport(1n);
      expect(report.reportHash).to.equal(reportHash);
      expect(report.submitter).to.equal(organizationA.address);
      expect(report.status).to.equal(0n);
      expect(report.eligibleVotes).to.equal(2n);
      expect(await contract.isEligibleVoter(1n, organizationA.address)).to.equal(
        false
      );
      expect(await contract.isEligibleVoter(1n, organizationB.address)).to.equal(
        true
      );
      expect(await contract.isEligibleVoter(1n, organizationC.address)).to.equal(
        true
      );
    });

    it("rejects an empty report hash", async function () {
      await expect(
        contract.connect(organizationA).submitReport(ethers.ZeroHash)
      ).to.be.revertedWith("Invalid report hash");
    });
  });

  describe("voting and finalization", function () {
    beforeEach(async function () {
      await contract.connect(organizationA).submitReport(reportHash);
    });

    it("rejects unauthorized, self, and duplicate votes", async function () {
      await expect(
        contract.connect(organizationA).voteReport(1n, true)
      ).to.be.revertedWith("Not an eligible voter");

      await expect(
        contract.connect(unauthorized).voteReport(1n, true)
      ).to.be.revertedWith("Not an eligible voter");

      await contract.connect(organizationB).voteReport(1n, true);
      await expect(
        contract.connect(organizationB).voteReport(1n, false)
      ).to.be.revertedWith("Organization already voted");

      expect(await contract.getReportStatus(1n)).to.equal(0n);
    });

    it("validates when both eligible organizations approve", async function () {
      await contract.connect(organizationB).voteReport(1n, true);

      await expect(
        contract.connect(organizationC).voteReport(1n, true)
      )
        .to.emit(contract, "ReportFinalized")
        .withArgs(1n, 1n, 2n, 0n);

      expect(await contract.getReportStatus(1n)).to.equal(1n);
    });

    it("rejects when both eligible organizations reject", async function () {
      await contract.connect(organizationB).voteReport(1n, false);
      await contract.connect(organizationC).voteReport(1n, false);

      expect(await contract.getReportStatus(1n)).to.equal(2n);
    });

    it("marks split votes as disputed and rejects further votes", async function () {
      await contract.connect(organizationB).voteReport(1n, true);
      await expect(
        contract.connect(organizationC).voteReport(1n, false)
      )
        .to.emit(contract, "ReportFinalized")
        .withArgs(1n, 3n, 1n, 1n);

      expect(await contract.getReportStatus(1n)).to.equal(3n);
      await expect(
        contract.connect(organizationB).voteReport(1n, true)
      ).to.be.revertedWith("Report is not pending");
    });

    it("rejects votes for unknown reports", async function () {
      await expect(
        contract.connect(organizationB).voteReport(2n, true)
      ).to.be.revertedWith("Report not found");
    });
  });
});
