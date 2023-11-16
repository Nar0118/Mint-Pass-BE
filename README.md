# Project Name

Mint Pass Backend

## Description

## Features

## Technologies Used

- Node js
- Express js
- Typescript
- web3
- cron
- mongoose

## Screenshots/Demo

## Getting Started

- Make sure you you have `yarn` installed in your local machine
- `yarn` version ^1.22.18
- `Node` version ^16.14.0

### Installation

1. Clone the repository:
   git clone https://your-username:your-access-token@github.com/Solicy-App/Passphrase-Launchpad-BE.git

2. Create `.env` and `.env.example` file (command `cp .env` and `.env.example`)

- `DATABASE_CONNECTION_URL` should be the database (MongoDB) url
  for local `mongodb://localhost:27017/`
- `TOKEN_KEY` should be the token key
  for example `very_secret_token`
- `SECRET_JWT_CODE` should be jwt secret
  for example `asl;dihf8#@TGBw`
- `DEFAULT_EMAIL` we will send emails from this account to users of the website
- `DEFAULT_EMAIL_PASSWORD` this is the DEFAULT_EMAIL app password
- `CLIENT_ID` this will be used for Google Auth, it's the clientId of the owner account
- `SESSION_SECRET` should be session secret
  for example very_secret_token
- `OAUTH_TWITTER_CALLBACK` this will be used for Twitter Auth
- `DEPLOYED_FE_URL` it is the url of the deploy frontend
- `PORT` port that we will use to run BE
- `BUCKET_NAME` this is the gcp bucket name where we will save images
- `PROJECT_ID` this will be used for gcp
- `TWITTER_CONSUMER_KEY` consumer key from(for) twitter
- `TWITTER_CONSUMER_SECRET` consumer secret from(for) twitter
- `YOUSIGN_API_KEY` api key for YouSign
- `YOUSIGN_API_URL` YouSign api url
- `ANVIL_API_KEY` you need to get this from Anvil (admin)
- `SANDBOX_TOKEN_KYC` it is sandbox token using for KYC
- `KYC_START_URL` it is kyc start url which redirects to sandbox to pass kyc
- `AVALANCHE_NATIVE_TOKEN_SYMBOL` this will be network Currency symbol

3. Run `yarn` command in terminal in root directory of project

#### Run Command

- `yarn dev`

#### Build Command

- `yarn build`

#### Folders Structure

```
├── blockchain
└── provider.ts
├── src
    ├── api
        ├── Company
        ├── FundingPool
        ├── GoogleStorage
        ├── Investment
        ├── Invitation
        ├── lib
        ├── User
        └── Webhook
    ├── app
        └── .gitkeep
    ├── assets
        └── .gitkeep
    ├── environments
        ├── environment.prod.ts
        └── environment.ts
    ├── middleware
        └── auth.middleware.ts
    ├── models
        ├── Company
        ├── FundingPool
        ├── Investment
        ├── Invitation
        ├── Payment
        └── User
    ├── util
        ├── constants
        ├── email
        ├── error
        ├── token
        ├── types
        ├── yousign
        └── helpers.ts
    ├── cron-job.ts
    ├── main.ts
    └── myKeys.json
├── .env
├── .env.example
├── .eslintrc.json
├── .gitignore
├── jest.config.js
├── package.json
├── README.md
├── tsconfig.json
├── tsconfig.spec.json
└── yarn.lock
```
