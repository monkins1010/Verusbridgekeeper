# Verus Bridgekeeper

Verus Bridgekeeper is a node js application passing transactions between Verus and Ethereum blockchains.

To install Verus Bridgekeeper  complete the following steps:

## Installing NVM, node, yarn & pm2
```shell
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
# you may need to log out and log back in or source your shell profile at this step
nvm install 18
npm install -g pm2 yarn
```
## Installing the Bridgekeeper
```shell
cd ~
git clone https://github.com/VerusCoin/Verusbridgekeeper.git
cd ~/Verusbridgekeeper
yarn install
```
Then after the installation run the following to create the initial configuration file
```shell
yarn start
```
It will exit with an error after creating a template configuration file for you to edit/populate.
#### In *.conf set:
delegatorcontractaddress= The bridge delegator contract address provided after the contracts have been launched

ethnode=wss:// to a websocket address for an Ethereum node

Only for witnesses:

privatekey= the private key (in hex, no leading 0x) of an ethereum account on the mainnet (goerli on testnet) chain with sufficient funds, to provide gas for calls to the contracts.
```
(mainnet)
Apple: /Library/Application Support/Verus/pbaas/52c7a71ed15802d33778235e7988d61339b84c45/52c7a71ed15802d33778235e7988d61339b84c45.conf
Linux: ~/.verus/pbaas/52c7a71ed15802d33778235e7988d61339b84c45/52c7a71ed15802d33778235e7988d61339b84c45.conf
Windows: %appdata%\Verus\pbaas\52c7a71ed15802d33778235e7988d61339b84c45\52c7a71ed15802d33778235e7988d61339b84c45.conf

(testnet)
Apple: /Library/Application Support/Verustest/pbaas/000b090bec6c9ff28586eb7ed24e77562f0c4667/000b090bec6c9ff28586eb7ed24e77562f0c4667.conf
Linux: ~/.verustest/pbaas/000b090bec6c9ff28586eb7ed24e77562f0c4667/000b090bec6c9ff28586eb7ed24e77562f0c4667.conf
Windows: %appdata%\Verustest\pbaas\000b090bec6c9ff28586eb7ed24e77562f0c4667\000b090bec6c9ff28586eb7ed24e77562f0c4667.conf
```
### Running the bridgekeeper on the console:
```shell
yarn start -consolelog <-debug // shows extra information>  <-debugsubmit //shows information on submissions> <-debugnotarization shows notarization data>
```
### Running the bridgekeeper in PM2:
```shell
cd ~/Verusbridgekeeper;  pm2 start start.js --name bridgekeeper -- -consolelog
```
or create a shell script (in `~/bin`) for convenient starting and start that using `~/bin/startbridge.sh`:
```
cat << EOF > ~/bin/startbridge.sh
#!/bin/bash
cd ~/Verusbridgekeeper;  pm2 start start.js --name bridgekeeper -- -consolelog
EOF
chmod +x ~/bin/startbridge.sh
```
When using PM2, console logs are stored in `~/.pm2/logs/bridgekeeper-out.log` and the errors in `~/.pm2/logs/bridgekeeper-error.log`

This will result in the service running on port 8000 it can be queried using the following examples:
```shell
curl  --data-binary '{"jsonrpc":"1.0","id":"curltext","method":"getinfo","params":[]}' -H 'content-type:text/plain;' http://127.0.0.1:8000

curl  --data-binary '{"jsonrpc":"1.0","id":"curltext","method":"getcurrency","params":["iCtawpxUiCc2sEupt7Z4u8SDAncGZpgSKm"]}' -H 'content-type:text/plain;' http://127.0.0.1:8000
```

## Optional: logrotate with PM2
As root user, create a file called /etc/logrotate.d/verusd-rpc with these contents:
```shell
/home/verus/.komodo/VRSC/debug.log
/home/verusd-rpc/.pm2/logs/verusbridge-out.log
/home/verusd-rpc/.pm2/logs/verusbridge-error.log
{
  rotate 14
  daily
  compress
  delaycompress
  copytruncate
  missingok
  notifempty
}
```
=======
#Updgrading contracts utility

Run `yarn run getcontracthash`  from the main directory.
