import assert from "node:assert/strict";
import test from "node:test";
import { ZodError } from "zod";
import { executeNonprofitTool } from "../src/nonprofit_tools.js";

test("campaign reporting caps progress and never reports a negative remainder", () => {
  const report = executeNonprofitTool("summarize_campaign", JSON.stringify({
    campaignName: "Winter Shelter",
    goalCents: 500_000,
    raisedCents: 525_000,
    volunteerHours: 96
  }));

  assert.deepEqual(report, {
    campaignName: "Winter Shelter",
    progressPercent: 100,
    remainingCents: 0,
    volunteerHours: 96
  });
});

test("a receipt rejects a non-positive donation", () => {
  assert.throws(() => executeNonprofitTool("prepare_donor_receipt", JSON.stringify({
    receiptId: "rcpt-0",
    donorName: "Sam Lee",
    amountCents: 0,
    donatedOn: "2026-09-30"
  })), (error: unknown) => {
    assert.ok(error instanceof ZodError);
    assert.equal(error.issues.length, 1);

    const [issue] = error.issues;
    assert.equal(issue.code, "too_small");
    assert.deepEqual(issue.path, ["amountCents"]);
    assert.equal(issue.minimum, 0);
    assert.equal(issue.inclusive, false);
    return true;
  });
});
