# ᝰ.ᐟ TENEO-NODE



## 🚨 Attention Before Running Teneo Cli Version

I am not `responsible` for the possibility of an account being `banned`, due to running node in the CLI, because Officially `Teneo Node Beta` does not provide an option for the CLI version, only with the Chrome extension.
but `I think` there is no reason to ban the account, because this is not cheating, I didn't change anything in the script (Heartbeats 15 minutes, maximum teneo points 25, maximum points per day 2400)

## 📎 Teneo Node cli version Script features

- Register
- Login
- Running Node
- AutoLogin
- AutoReconnect


## ✎ᝰ. RUNNING 
- Clone Repository
```bash
git clone https://github.com/airdropbomb/Teneo-DropXpert.git
cd Teneo-DropXpert
```
- Install Dependency
```bash
npm install
```
- Run the script its only for 1 account - run multy below for multiple accounts
```bash
node main.js
```
## run for multy accounts: 
- Manual put token in `tokens.txt` 1 line 1 token
    ```bash
    nano tokens.txt
    ```
- proxy (optional) in `proxies.txt`
    ```bash
    nano proxies.txt
    ```
    
### Auto get tokens if you dont want put it manually: 
- fill `accounts.txt` format : `test@gmail.com|password123` 1 line 1 account
    ```bash
    nano accounts.txt
    ```
- run to get tokens
    ```bash
    node getToken
    ```

- Start multy accounts
    ```bash
    node multy
    ```

## ![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

This project is licensed under the [MIT License](LICENSE).
