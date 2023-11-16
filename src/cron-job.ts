// import { CronJob } from 'cron';
// import { Investment } from './models/Investment';
// import { FundingPool } from './models/FundingPool';
// import env from './util/constants/env';

// const web3 = require('../blockchain/provider').web3;

// const abi = [
//   {
//     inputs: [
//       {
//         internalType: 'address',
//         name: '_user',
//         type: 'address',
//       },
//     ],
//     name: 'getUserFunds',
//     outputs: [
//       {
//         internalType: 'uint256',
//         name: '',
//         type: 'uint256',
//       },
//     ],
//     stateMutability: 'view',
//     type: 'function',
//   },
//   {
//     inputs: [],
//     name: 'fee',
//     outputs: [
//       {
//         internalType: 'uint256',
//         name: '',
//         type: 'uint256',
//       },
//     ],
//     stateMutability: 'view',
//     type: 'function',
//   },
// ];

// export const startInvestmentsVerificationCronJob = () => {
//   const cronJob = new CronJob(env.cronJobPeriod, async () => {
//     await checkAllInvestmentsAndVerify();
//   });

//   cronJob.start();
// };

// export const testCron = () => {
//   var job = new CronJob(
//     '* * * * * *',
//     function() {
//         console.log('Cronjob worked every second');
//     },
//     null,
//     true,
//     'America/Los_Angeles'
// );
// job.start()
// }

// export const startSaftsVerification = () => {
//   const cronJob = new CronJob(env.saftValidationCronJobPeriod, async () => {
//     await checkFundingPoolsSaftsAndVerify();
//   });

//   cronJob.start();
// };

// const checkFundingPoolsSaftsAndVerify = async () => {
//   try {
//     const filteredFundingPools = await FundingPool.find({
//       saftFiles: { $exists: true, $not: { $size: 0 } },
//     }).exec();

//     filteredFundingPools?.map((fundingPool) => {
//       fundingPool.saftFiles.map((file) => {
//         if (file && file.saftId) {
//           const dateNow = new Date(Date()).getTime();
//           const fileCreatedDate = new Date(file.createdAt).getTime();
//           const msDay = 24 * 60 * 60 * 1000;
//           const validDaysCount = 2;

//           const days = Math.floor((dateNow - fileCreatedDate) / msDay);
//           const changeValidStatus = days >= validDaysCount;

//           if (changeValidStatus) file.isValid = false;
//         }
//       });

//       fundingPool.save();
//     });
//   } catch (error) {
//     console.log('checkFundingPoolsSaftsAndVerify cronJob failed: ', error);
//   }
// };

// const checkAllInvestmentsAndVerify = async () => {
//   const investments = await Investment.find({
//     verified: false,
//   })
//     .populate('user')
//     .exec();

//   const fundingPools = await FundingPool.find().exec();

//   if (investments?.length) {
//     investments.map(async (investment) => {
//       const fundingPoolId = investment.fundingPoolId;

//       const fundingPool = fundingPools.find(
//         (pool) => pool.id === fundingPoolId
//       );
//       const userWallets = investment.user?.walletAddresses;

//       if (fundingPool?.contractAddress && userWallets) {
//         const contract = new web3.eth.Contract(
//           abi,
//           fundingPool.contractAddress
//         );
//         const fee = await contract.methods
//           .fee()
//           .call()
//           .catch((error) => {
//             console.log(error);
//           });

//         const fundedAmount = await getFundedAmount(userWallets, contract);

//         if (
//           fundedAmount &&
//           fundedAmount + Number(fee) >= investment.amountInvested
//         ) {
//           console.log(`Verifying ${investment.id}`);

//           await Investment.findOneAndUpdate(
//             { _id: investment.id },
//             { verified: true }
//           );
//         }
//       }
//     });
//   }
// };

// const getFundedAmount = async (wallets: Array<string>, contract) => {
//   let fundAmount;

//   for (let i = 0; i < wallets.length; ++i) {
//     const funds = await contract.methods
//       .getUserFunds(wallets[i])
//       .call()
//       .catch((error) => {
//         console.log(error);
//       });

//     if (funds) {
//       // User may have funded from different accounts.
//       fundAmount = fundAmount ? Number(funds) + fundAmount : Number(funds);
//     }
//   }

//   return fundAmount;
// };
