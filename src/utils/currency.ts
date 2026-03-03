export const currencyFormatter = (amount: number): string => {
  let abs = Math.abs(amount);

  // check for b
  if (abs >= 1_000_000_000) {
    return `${(abs / 1_000_000_000).toFixed(1).replace("/.\0$/", "")}B`;
  }

  // check for m
  if (abs >= 1_000_000) {
    return `${(abs / 1_000_000).toFixed(1).replace("/.\0$/", "")}M`;
  }

  //   check for k
  if (abs >= 1_000) {
    return `${(abs / 1_000).toFixed(1).replace("/.\0$/", "")}K`;
  }

  return abs.toString();
};
