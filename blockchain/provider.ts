import env from "../src/util/constants/env";
const Web3 = require("web3");

module.exports = {
  web3: new Web3(env.web3Provider),
};
