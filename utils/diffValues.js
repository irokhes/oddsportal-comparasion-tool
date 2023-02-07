const getDiffValue = (value) => {
  if (value > 2.5) return 0.85;
  if (value > 2.4) return 0.87;
  if (value > 2.3) return 0.88;
  if (value > 2.2) return 0.88;
  if (value > 2.1) return 0.88;
  if (value > 2) return 0.9;
  if (value > 1.9) return 0.9;
  if (value > 1.8) return 0.91;
  if (value > 1.7) return 0.935;
  if (value > 1.6) return 0.92;
  if (value > 1.5) return 0.94;
  if (value > 1.4) return 0.93;
  if (value > 1.3) return 0.945;
  if (value > 1.2) return 0.94;
  if (value > 1.1) return 0.94;
  return 0.96;
};
const getPinnacleDiffValueOriginal = (value) => {
  if (value > 2.5) return 0.85;
  if (value > 2.4) return 0.87;
  if (value > 2.3) return 0.88;
  if (value > 2.2) return 0.88;
  if (value > 2.1) return 0.88;
  if (value > 2) return 0.9;
  if (value > 1.9) return 0.9;
  if (value > 1.8) return 0.91;
  if (value > 1.7) return 0.91;
  if (value > 1.6) return 0.91;
  if (value > 1.5) return 0.92;
  if (value > 1.4) return 0.93;
  if (value > 1.3) return 0.93;
  if (value > 1.2) return 0.93;
  if (value > 1.1) return 0.94;
  return 0.96;
};
const getPinnacleDiffValue = (value) => {
  if (value > 2.5) return 0.9;
  if (value > 2.4) return 0.9;
  if (value > 2.3) return 0.9;
  if (value > 2.2) return 0.9;
  if (value > 2.1) return 0.9;
  if (value > 2) return 0.93;
  if (value > 1.9) return 0.93;
  if (value > 1.8) return 0.93;
  if (value > 1.7) return 0.93;
  if (value > 1.6) return 0.93;
  if (value > 1.5) return 0.925;
  if (value > 1.4) return 0.925;
  if (value > 1.3) return 0.925;
  if (value > 1.2) return 0.925;
  if (value > 1.1) return 0.925;
  return 0.93;
};
module.exports = {
  getDiffValue,
  getPinnacleDiffValue,
};
