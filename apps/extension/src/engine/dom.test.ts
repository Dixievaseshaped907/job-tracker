// ⚠ banner cache invalidation: a policy edit — or more of a progressively rendered
// pane arriving — must invalidate a rendered banner as surely as moving to another job
// does, or the user's newly added words and the rest of the page's warnings stay
// unseen until a reload.
import { afterEach, describe, expect, it } from "vitest";

import { bannerCurrent, bannerFingerprint, placeBanner } from "./dom";
import { defaultPolicy, setActivePolicy } from "./keywords";

function anchoredBanner() {
  document.body.innerHTML = '<div id="anchor"></div>';
  placeBanner({ chips: ["blocked company"] }, document.querySelector("#anchor"));
  return document.querySelector(".jh-detail-banner") as HTMLElement | null;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("bannerCurrent", () => {
  it("keeps a banner that still matches this job and this policy", () => {
    expect(anchoredBanner()).not.toBeNull();
    expect(bannerCurrent()).toBe(true);
    expect(document.querySelector(".jh-detail-banner")).not.toBeNull();
  });

  it("drops a banner built under a superseded policy, so an edit repaints it", () => {
    anchoredBanner();
    const before = bannerFingerprint();

    setActivePolicy(defaultPolicy()); // what loadKeywordPolicy does when storage changes
    expect(bannerFingerprint()).not.toBe(before);
    expect(bannerCurrent()).toBe(false);
    // Cleared, not left stale — the caller rebuilds from the new policy.
    expect(document.querySelector(".jh-detail-banner")).toBeNull();
  });

  it("reports nothing current when no banner is up", () => {
    document.body.innerHTML = "";
    expect(bannerCurrent()).toBe(false);
  });

  // A detail pane renders in stages, so the same job can yield more warnings a scan
  // later — the applicant count, the posting age, or a JD that had not loaded yet.
  it("drops a banner built from less than the pane now shows", () => {
    anchoredBanner(); // built from the "blocked company" chip alone
    expect(bannerCurrent({ chips: ["blocked company"] })).toBe(true);
    expect(bannerCurrent({ chips: ["blocked company", "100+ applicants"] })).toBe(false);
    expect(document.querySelector(".jh-detail-banner")).toBeNull();
  });
});
