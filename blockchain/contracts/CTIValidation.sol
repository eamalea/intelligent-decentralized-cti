// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract CTIValidation {
    uint256 public constant ORGANIZATION_LIMIT = 3;

    enum Status {
        Pending,
        Validated,
        Rejected,
        Disputed
    }

    struct Report {
        bytes32 reportHash;
        address submitter;
        Status status;
        uint8 approvals;
        uint8 rejections;
        uint8 votesCast;
        uint8 eligibleVotes;
    }

    address public immutable owner;
    uint256 public reportCount;
    address[] private organizations;

    mapping(address => bool) public isOrganization;
    mapping(uint256 => Report) private reports;
    mapping(uint256 => mapping(address => bool)) public isEligibleVoter;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event OrganizationRegistered(address indexed organization);
    event ReportSubmitted(
        uint256 indexed reportId,
        bytes32 indexed reportHash,
        address indexed submitter
    );
    event VoteCast(
        uint256 indexed reportId,
        address indexed organization,
        bool approve
    );
    event ReportFinalized(
        uint256 indexed reportId,
        Status status,
        uint8 approvals,
        uint8 rejections
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function registerOrganization(address organization) external onlyOwner {
        require(organization != address(0), "Invalid organization");
        require(!isOrganization[organization], "Organization already registered");
        require(
            organizations.length < ORGANIZATION_LIMIT,
            "Organization limit reached"
        );

        isOrganization[organization] = true;
        organizations.push(organization);
        emit OrganizationRegistered(organization);
    }

    function submitReport(bytes32 reportHash) external returns (uint256 reportId) {
        require(isOrganization[msg.sender], "Organization not registered");
        require(
            organizations.length == ORGANIZATION_LIMIT,
            "Three organizations required"
        );
        require(reportHash != bytes32(0), "Invalid report hash");

        reportId = ++reportCount;
        Report storage report = reports[reportId];
        report.reportHash = reportHash;
        report.submitter = msg.sender;
        report.status = Status.Pending;

        for (uint256 i = 0; i < organizations.length; i++) {
            address organization = organizations[i];
            if (organization != msg.sender) {
                isEligibleVoter[reportId][organization] = true;
                report.eligibleVotes++;
            }
        }

        emit ReportSubmitted(reportId, reportHash, msg.sender);
    }

    function voteReport(uint256 reportId, bool approve) external {
        Report storage report = reports[reportId];
        require(reportId != 0 && reportId <= reportCount, "Report not found");
        require(report.status == Status.Pending, "Report is not pending");
        require(isEligibleVoter[reportId][msg.sender], "Not an eligible voter");
        require(!hasVoted[reportId][msg.sender], "Organization already voted");

        hasVoted[reportId][msg.sender] = true;
        report.votesCast++;

        if (approve) {
            report.approvals++;
        } else {
            report.rejections++;
        }

        emit VoteCast(reportId, msg.sender, approve);

        if (report.votesCast == report.eligibleVotes) {
            if (report.approvals > report.rejections) {
                report.status = Status.Validated;
            } else if (report.approvals < report.rejections) {
                report.status = Status.Rejected;
            } else {
                report.status = Status.Disputed;
            }

            emit ReportFinalized(
                reportId,
                report.status,
                report.approvals,
                report.rejections
            );
        }
    }

    function getReport(
        uint256 reportId
    )
        external
        view
        returns (
            bytes32 reportHash,
            address submitter,
            Status status,
            uint8 approvals,
            uint8 rejections,
            uint8 votesCast,
            uint8 eligibleVotes
        )
    {
        require(reportId != 0 && reportId <= reportCount, "Report not found");
        Report storage report = reports[reportId];
        return (
            report.reportHash,
            report.submitter,
            report.status,
            report.approvals,
            report.rejections,
            report.votesCast,
            report.eligibleVotes
        );
    }

    function getReportStatus(uint256 reportId) external view returns (Status) {
        require(reportId != 0 && reportId <= reportCount, "Report not found");
        return reports[reportId].status;
    }

    function getOrganizations() external view returns (address[] memory) {
        return organizations;
    }
}
