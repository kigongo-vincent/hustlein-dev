import { describe, it, expect } from "vitest";
import { currencyFormatter } from "./currency";

describe("fomat currency test", () => {
  it("checks formatting of k", () => {
    expect(currencyFormatter(1200)).toBe("1.2K");
  });

  it("checks fomratting of m", () => {
    expect(currencyFormatter(1_200_000)).toBe("1.2M");
  });

  it("checks formatting of b", () => {
    expect(currencyFormatter(1_200_000_000)).toBe("1.2B");
  });
});
