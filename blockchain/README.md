# Blockchain module

The Hardhat project in this directory implements the first CTI validation MVP.
The contract stores a SHA-256 report commitment, the submitting organization,
votes, and the resulting status. Full reports remain off-chain.

## Validation rules

- The deployer is the contract owner and the only account that can register
  organizations.
- Exactly three organizations must be registered before a report can be
  submitted.
- The submitter is excluded from voting; the other two organizations are
  recorded as the eligible voters for that report.
- Each eligible organization can vote once.
- The report stays `Pending` until both eligible organizations vote.
- Two approvals produce `Validated`, two rejections produce `Rejected`, and
  split votes produce `Disputed`. The second vote finalizes the status.
- A report hash must be non-zero. The contract treats it as an opaque `bytes32`;
  the application is responsible for canonicalizing the report and calculating
  its SHA-256 digest consistently at submission and verification time.

`Status` enum values are `Pending = 0`, `Validated = 1`, `Rejected = 2`, and
`Disputed = 3`.

## Local development

Run these commands from this directory:

```powershell
npm install
npm test
npm run compile
```

For a persistent local node, use two terminals:

```powershell
npm run node
```

```powershell
npm run deploy:local
```

The deployment script uses the first Hardhat account as the administrator and
the next three accounts as organizations A, B, and C. These are local
development accounts only; never use their keys on a public network.

## Contract interface

- `registerOrganization(address)`: owner-only organization registration.
- `submitReport(bytes32)`: submit a SHA-256 digest and receive a sequential
  report ID.
- `voteReport(uint256, bool)`: record an eligible organization's vote.
- `getReport(uint256)`: read the commitment, submitter, vote totals, and status.
- `getReportStatus(uint256)`: read the report status.
- `getOrganizations()`: read the registered organization addresses.

The contract emits `OrganizationRegistered`, `ReportSubmitted`, `VoteCast`, and
`ReportFinalized` events for the application adapter and audit trail.

## Python hash helper

`python/cti_hash.py` canonicalizes a JSON report object with RFC 8785 and
computes its SHA-256 digest. It does not define which report fields belong in
the object; that schema must be agreed with the application team before
integration. Keep mutable validation data such as votes and status outside the
hashed object.

From this directory, install the isolated helper dependency and run its tests:

```powershell
python -m pip install -r python/requirements.txt
python -m unittest discover -s python -p "test_*.py"
```
