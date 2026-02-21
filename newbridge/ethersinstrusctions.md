
ethers
6.16.0
DOCUMENTATION
Getting Started
Some Common Terminology
Connecting to Ethereum
User Interaction
Interacting with the Blockchain
Contracts
Signing Messages
Ethereum Basics
Topics
Application Binary Interfaces
Call Data Representation
Event Data Representation
Deployment
Application Programming Interface
PollingBlockTagSubscriber
Application Binary Interface
Result
Interfaces
ErrorDescription
Indexed
Interface
LogDescription
TransactionDescription
Typed Values
Typed
TypedBigInt
TypedData
TypedString
ABI Encoding
AbiCoder
Fragments
ConstructorFragment
ErrorFragment
EventFragment
FallbackFragment
Fragment
FunctionFragment
JsonFragment
JsonFragmentType
NamedFragment
ParamType
StructFragment
Addresses
Addressable
NameResolver
Constants
Contracts
BaseContract
BaseContractMethod
ConstantContractMethod
Contract
ContractDeployTransaction
ContractEvent
ContractEventPayload
ContractFactory
ContractInterface
ContractMethod
ContractTransaction
ContractTransactionReceipt
ContractTransactionResponse
ContractUnknownEventPayload
DeferredTopicFilter
EventLog
Overrides
UndecodedEventLog
WrappedFallback
Cryptographic Functions
Hash Functions
HMAC
Passwords
Random Values
Signing
Signature
SigningKey
Hashing Utilities
AuthorizationRequest
TypedDataDomain
TypedDataEncoder
TypedDataField
Providers
Block
BrowserDiscoverOptions
BrowserProvider
ContractRunner
Eip1193Provider
Eip6963ProviderInfo
EnsPlugin
EventFilter
FeeData
FeeDataNetworkPlugin
FetchUrlFeeDataNetworkPlugin
Filter
FilterByBlockHash
GasCostPlugin
IpcSocketProvider
Log
MinedBlock
MinedTransactionResponse
NetworkPlugin
NonceManager
PreparedTransactionRequest
Provider
Signer
TransactionReceipt
TransactionRequest
TransactionResponse
WebSocketLike
WebSocketProvider
Networks
Network
Subclassing Provider
AbstractProvider
AbstractProviderPlugin
FilterIdEventSubscriber
FilterIdPendingSubscriber
FilterIdSubscriber
OnBlockSubscriber
PerformActionTransaction
PollingBlockSubscriber
PollingEventSubscriber
PollingTransactionSubscriber
Subscriber
UnmanagedSubscriber
Socket Providers
SocketBlockSubscriber
SocketEventSubscriber
SocketPendingSubscriber
SocketProvider
SocketSubscriber
Subclassing Signer
AbstractSigner
VoidSigner
ENS Resolver
AvatarLinkage
AvatarResult
BasicMulticoinProviderPlugin
EnsResolver
MulticoinProviderPlugin
Fallback Provider
FallbackProvider
FallbackProviderConfig
FallbackProviderState
Formatting
BlockParams
LogParams
TransactionReceiptParams
TransactionResponseParams
JSON-RPC Provider
JsonRpcApiProvider
JsonRpcProvider
JsonRpcSigner
JsonRpcTransactionRequest
Community Providers
AlchemyProvider
CommunityResourcable
Alchemy
Ankr
AnkrProvider
Blockscout
BlockscoutProvider
Chainstack
ChainstackProvider
Cloudflare
CloudflareProvider
Etherscan
EtherscanPlugin
EtherscanProvider
INFURA
InfuraProvider
InfuraWebSocketProvider
Pocket
PocketProvider
QuickNode
QuickNodeProvider
Transactions
Authorization
Blob
KzgLibrary
Transaction
TransactionLike
Utilities
Base58 Encoding
Base64 Encoding
Data Helpers
Math Helpers
Properties
Recursive-Length Prefix
Strings and UTF-8
Unit Conversion
UUID
Errors
ActionRejectedError
BadDataError
BufferOverrunError
CallExceptionError
CancelledError
EthersError
InsufficientFundsError
InvalidArgumentError
MissingArgumentError
NetworkError
NonceExpiredError
NotImplementedError
NumericFaultError
OffchainFaultError
ReplacementUnderpricedError
ServerError
TimeoutError
TransactionReplacedError
UnconfiguredNameError
UnexpectedArgumentError
UnknownError
UnsupportedOperationError
Events
EventEmitterable
EventPayload
Fetching Web Content
FetchRequest
FetchResponse
Fixed-Point Maths
FixedNumber
Wallets
BaseWallet
Mnemonic
Wallet
HD Wallets
HDNodeVoidWallet
HDNodeWallet
JSON Wallets
Wordlists
LangCz
LangEn
LangEs
LangFr
LangIt
LangJa
LangKo
LangPt
LangZh
Wordlist
WordlistOwl
WordlistOwlA
Cookbook
Cookbook: ENS Recipes
Get all Text records
React Native
Signing
Messages
EIP-712 Typed Data
Migrating from v5
Big Numbers
Contracts
Importing
Providers
Signatures
Transactions
Utilities
Removed Classes and functions
Contributions and Hacking
Documentation
Fixing Bugs
Adding Features
Building
Previewing Documentation
License and Copyright
MIT License
Split Pages
Documentation (single page)
 Documentation
The ethers.js library aims to be a complete and compact library for interacting with the Ethereum Blockchain and its ecosystem.

It is often used to create decentralized applications (dapps), wallets (such as MetaMask) and other tools and simple scripts that require reading and writing to the blockchain.

 About this documentation?
These docs are still under construction, and are being expanded every day.

Developers new to Ethers should be sure to read through the Getting Started section.

And the Application Programming Interface is available for drilling down into more details about the entire Application Programming Interface.

 Older Documentation

v5 documentation
v4 documentation
v3 documentation
 Getting Started
This is a very short introduction to Ethers, but covers many of the most common operations that developers require and provides a starting point for those newer to Ethereum.

Getting Ethers
If using NPM, you must first install Ethers.

installing via NPM
# Install ethers
/home/ricmoo/test-ethers> npm install ethers
Everything in Ethers is exported from its root as well as on the ethers object. There are also exports in the package.json to facilitate more fine-grained importing.

Generally this documentation will presume all exports from ethers have been imported in the code examples, but you may import the necessary objects in any way you wish.

importing in Node.js
// Import everything
import { ethers } from "ethers";

// Import just a few select items
import { BrowserProvider, parseUnits } from "ethers";

// Import from a specific export
import { HDNodeWallet } from "ethers/wallet";
importing ESM in a browser
<script type="module">
  import { ethers } from "https://cdnjs.cloudflare.com/ajax/libs/ethers/6.7.0/ethers.min.js";
  // Your code here...
</script>
 Some Common Terminology
To begin, it is useful to have a basic understanding of the types of objects available and what they are responsible for, at a high level.

Provider
A Provider is a read-only connection to the blockchain, which allows querying the blockchain state, such as account, block or transaction details, querying event logs or evaluating read-only code using call.

If you are coming from Web3.js, you are used to a Provider offering both read and write access. In Ethers, all write operations are further abstracted into another Object, the Signer.

Signer
A Signer wraps all operations that interact with an account. An account generally has a private key located somewhere, which can be used to sign a variety of types of payloads.

The private key may be located in memory (using a Wallet) or protected via some IPC layer, such as MetaMask which proxies interaction from a website to a browser plug-in, which keeps the private key out of the reach of the website and only permits interaction after requesting permission from the user and receiving authorization.

Transaction
To make any state changes to the blockchain, a transaction is required, which requires a fee to be paid, where the fee covers the associated costs with executing the transaction (such as reading the disk and performing maths) and storing the updated information.

If a transaction reverts, a fee must still be paid, since the validator still had to expend resources to try running the transaction to determine that it reverted and the details of its failure are still be recorded.

Transactions include sending ether from one user to another, deploying a Contract or executing a state-changing operation against a Contract.

Contract
A Contract is a program that has been deployed to the blockchain, which includes some code and has allocated storage which it can read from and write to.

It may be read from when it is connected to a Provider or state-changing operations can be called when connected to a Signer.

Receipt
Once a Transaction has been submitted to the blockchain, it is placed in the memory pool (mempool) until a validator decides to include it.

A transaction's changes are only made once it has been included in the blockchain, at which time a receipt is available, which includes details about the transaction, such as which block it was included in, the actual fee paid, gas used, all the events that it emitted and whether it was successful or reverted.

 Connecting to Ethereum
This very first thing needed to begin interacting with the blockchain is connecting to it using a Provider.

MetaMask (and other injected providers)
The quickest and easiest way to experiment and begin developing on Ethereum is to use MetaMask, which is a browser extension that injects objects into the window, providing:


read-only access to the Ethereum network (a Provider)
authenticated write access backed by a private key (a Signer)
When requesting access to the authenticated methods, such as sending a transaction or even requesting the private key address, MetaMask will show a pop-up to the user asking for permission.

let signer = null;

let provider;
if (window.ethereum == null) {

    // If MetaMask is not installed, we use the default provider,
    // which is backed by a variety of third-party services (such
    // as INFURA). They do not have private keys installed,
    // so they only have read-only access
    console.log("MetaMask not installed; using read-only defaults")
    provider = ethers.getDefaultProvider()

} else {

    // Connect to the MetaMask EIP-1193 object. This is a standard
    // protocol that allows Ethers access to make all read-only
    // requests through MetaMask.
    provider = new ethers.BrowserProvider(window.ethereum)

    // It also provides an opportunity to request access to write
    // operations, which will be performed by the private key
    // that MetaMask manages for the user.
    signer = await provider.getSigner();
}
Custom RPC Backend
If you are running your own Ethereum node (e.g. Geth) or using a custom third-party service (e.g. INFURA), you can use the JsonRpcProvider directly, which communicates using the link-jsonrpc protocol.

When using your own Ethereum node or a developer-base blockchain, such as Hardhat or Ganache, you can get access to the accounts with JsonRpcProvider-getSigner.

connecting to a JSON-RPC URL
// If no %%url%% is provided, it connects to the default
// http://localhost:8545, which most nodes use.
provider = new ethers.JsonRpcProvider(url)

// Get write access as an account by getting the signer
signer = await provider.getSigner()
 User Interaction
All units in Ethereum tend to be integer values, since dealing with decimals and floating points can lead to imprecise and non-obvious results when performing mathematic operations.

As a result, the internal units used (e.g. wei) which are suited for machine-readable purposes and maths are often very large and not easily human-readable.

For example, imagine dealing with dollars and cents; you would show values like "$2.56". In the blockchain world, we would keep all values as cents, so that would be 256 cents, internally.

So, when accepting data that a user types, it must be converted from its decimal string representation (e.g. "2.56") to its lowest-unit integer representation (e.g. 256). And when displaying a value to a user the opposite operation is necessary.

In Ethereum, one ether is equal to 10 ** 18 wei and one gwei is equal to 10 ** 9 wei, so the values get very large very quickly, so some convenience functions are provided to help convert between representations.

// Convert user-provided strings in ether to wei for a value
eth = parseEther("1.0")
// 1000000000000000000n

// Convert user-provided strings in gwei to wei for max base fee
feePerGas = parseUnits("4.5", "gwei")
// 4500000000n

// Convert a value in wei to a string in ether to display in a UI
formatEther(eth)
// '1.0'

// Convert a value in wei to a string in gwei to display in a UI
formatUnits(feePerGas, "gwei")
// '4.5'
 Interacting with the Blockchain
Querying State
Once you have a Provider, you have a read-only connection to the data on the blockchain. This can be used to query the current account state, fetch historic logs, look up contract code and so on.

// Look up the current block number (i.e. height)
await provider.getBlockNumber()
// 23929462

// Get the current balance of an account (by address or ENS name)
balance = await provider.getBalance("ethers.eth")
// 4085267032476673080n

// Since the balance is in wei, you may wish to display it
// in ether instead.
formatEther(balance)
// '4.08526703247667308'

// Get the next nonce required to send a transaction
await provider.getTransactionCount("ethers.eth")
// 2
Sending Transactions
To write to the blockchain you require access to a private key which controls some account. In most cases, those private keys are not accessible directly to your code, and instead you make requests via a Signer, which dispatches the request to a service (such as MetaMask) which provides strictly gated access and requires feedback to the user to approve or reject operations.

// When sending a transaction, the value is in wei, so parseEther
// converts ether to wei.
tx = await signer.sendTransaction({
  to: "ethers.eth",
  value: parseEther("1.0")
});

// Often you may wish to wait until the transaction is mined
receipt = await tx.wait();
 Contracts
A Contract is a meta-class, which means that its definition is derived at run-time, based on the ABI it is passed, which then determined what methods and properties are available on it.

Application Binary Interface (ABI)
Since all operations that occur on the blockchain must be encoded as binary data, we need a concise way to define how to convert between common objects (like strings and numbers) and its binary representation, as well as encode the ways to call and interpret the Contract.

For any method, event or error you wish to use, you must include a Fragment to inform Ethers how it should encode the request and decode the result.

Any methods or events that are not needed can be safely excluded.

There are several common formats available to describe an ABI. The Solidity compiler usually dumps a JSON representation but when typing an ABI by hand it is often easier (and more readable) to use the human-readable ABI, which is just the Solidity signature.

simplified ERC-20 ABI
abi = [
  "function decimals() view returns (string)",
  "function symbol() view returns (string)",
  "function balanceOf(address addr) view returns (uint)"
]

// Create a contract
contract = new Contract("dai.tokens.ethers.eth", abi, provider)
Read-only methods (i.e. view and pure)
A read-only method is one which cannot change the state of the blockchain, but often provide a simple interface to get important data about a Contract.

reading the DAI ERC-20 contract
// The contract ABI (fragments we care about)
abi = [
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function balanceOf(address a) view returns (uint)"
]

// Create a contract; connected to a Provider, so it may
// only access read-only methods (like view and pure)
contract = new Contract("dai.tokens.ethers.eth", abi, provider)

// The symbol name for the token
sym = await contract.symbol()
// 'DAI'

// The number of decimals the token uses
decimals = await contract.decimals()
// 18n

// Read the token balance for an account
balance = await contract.balanceOf("ethers.eth")
// 4000000000000000000000n

// Format the balance for humans, such as in a UI
formatUnits(balance, decimals)
// '4000.0'
State-changing Methods
change state on an ERC-20 contract
abi = [
  "function transfer(address to, uint amount)"
]

// Connected to a Signer; can make state changing transactions,
// which will cost the account ether
contract = new Contract("dai.tokens.ethers.eth", abi, signer)

// Send 1 DAI
amount = parseUnits("1.0", 18);

// Send the transaction
tx = await contract.transfer("ethers.eth", amount)

// Currently the transaction has been sent to the mempool,
// but has not yet been included. So, we...

// ...wait for the transaction to be included.
await tx.wait()
forcing a call (simulation) of a state-changing method
abi = [
  "function transfer(address to, uint amount) returns (bool)"
]

// Connected to a Provider since we only require read access
contract = new Contract("dai.tokens.ethers.eth", abi, provider)

amount = parseUnits("1.0", 18)

// There are many limitations to using a static call, but can
// often be useful to preflight a transaction.
await contract.transfer.staticCall("ethers.eth", amount)
// true

// We can also simulate the transaction as another account
other = new VoidSigner("0x643aA0A61eADCC9Cc202D1915D942d35D005400C")
contractAsOther = contract.connect(other.connect(provider))
await contractAsOther.transfer.staticCall("ethers.eth", amount)
// true
Listening to Events
When adding event listeners for a named event, the event parameters are destructed for the listener.

There is always one additional parameter passed to a listener, which is an EventPayload, which includes more information about the event including the filter and a method to remove that listener.

listen for ERC-20 events
abi = [
  "event Transfer(address indexed from, address indexed to, uint amount)"
]

// Create a contract; connected to a Provider, so it may
// only access read-only methods (like view and pure)
contract = new Contract("dai.tokens.ethers.eth", abi, provider)

// Begin listening for any Transfer event
contract.on("Transfer", (from, to, _amount, event) => {
  const amount = formatEther(_amount, 18)
  console.log(`${ from } => ${ to }: ${ amount }`);

  // The `event.log` has the entire EventLog

  // Optionally, stop listening
  event.removeListener();
});

// Same as above
contract.on(contract.filters.Transfer, (from, to, amount, event) => {
  // See above
})

// Listen for any Transfer to "ethers.eth"
filter = contract.filters.Transfer(null, "ethers.eth")
contract.on(filter, (from, to, amount, event) => {
  // `to` will always be equal to the address of "ethers.eth"
});

// Listen for any event, whether it is present in the ABI
// or not. Since unknown events can be picked up, the
// parameters are not destructed.
contract.on("*", (event) => {
  // The `event.log` has the entire EventLog
});
Query Historic Events
When querying within a large range of blocks, some backends may be prohibitively slow, may return an error or may truncate the results without any indication. This is at the discretion of each backend.

query historic ERC-20 events
abi = [
  "event Transfer(address indexed from, address indexed to, uint amount)"
]

// Create a contract; connected to a Provider, so it may
// only access read-only methods (like view and pure)
contract = new Contract("dai.tokens.ethers.eth", abi, provider)

// Query the last 100 blocks for any transfer
filter = contract.filters.Transfer
events = await contract.queryFilter(filter, -100)

// The events are a normal Array
events.length
// 319

// The first matching event
events[0]
// EventLog {
//   address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
//   args: Result(3) [
//     '0xC2e9F25Be6257c210d7Adf0D4Cd6E3E881ba25f8',
//     '0xfBd4cdB413E45a52E2C8312f670e9cE67E794C37',
//     370136547842778449664n
//   ],
//   blockHash: '0x9d343d0880968c61e2285ebbeecf02a73e535010cdcef97c4823a69bb78e57f8',
//   blockNumber: 23929363,
//   data: '0x00000000000000000000000000000000000000000000001410ad2d320e2fc700',
//   fragment: EventFragment { ... },
//   index: 67,
//   interface: Interface { ... },
//   provider: InfuraProvider { ... },
//   removed: false,
//   topics: [
//     '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
//     '0x000000000000000000000000c2e9f25be6257c210d7adf0d4cd6e3e881ba25f8',
//     '0x000000000000000000000000fbd4cdb413e45a52e2c8312f670e9ce67e794c37'
//   ],
//   transactionHash: '0x3b0d0740794f7bd557644caa84bf6330c6e155eda07e6efa43c9295054f61b03',
//   transactionIndex: 1
// }

// Query all time for any transfer to ethers.eth
filter = contract.filters.Transfer(null, "ethers.eth")
events = await contract.queryFilter(filter)

// The first matching event
events[0]
// EventLog {
//   address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
//   args: Result(3) [
//     '0xaB7C8803962c0f2F5BBBe3FA8bf41cd82AA1923C',
//     '0x047218ea2AE0Ce6be5052AC99AfB59B26d3e5059',
//     4000000000000000000000n
//   ],
//   blockHash: '0x45b1f248e926db6122f46b1e24e2ce50840b107b435ec246ee5e249f8595e9f5',
//   blockNumber: 12385295,
//   data: '0x0000000000000000000000000000000000000000000000d8d726b7177a800000',
//   fragment: EventFragment { ... },
//   index: 385,
//   interface: Interface { ... },
//   provider: InfuraProvider { ... },
//   removed: false,
//   topics: [
//     '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
//     '0x000000000000000000000000ab7c8803962c0f2f5bbbe3fa8bf41cd82aa1923c',
//     '0x000000000000000000000000047218ea2ae0ce6be5052ac99afb59b26d3e5059'
//   ],
//   transactionHash: '0xe9886e50be3adba3859ad9d5b4f1b3819f686f1dd171d0d7f492b3e6dfa53507',
//   transactionIndex: 239
// }
 Signing Messages
A private key can do a lot more than just sign a transaction to authorize it. It can also be used to sign other forms of data, which are then able to be validated for other purposes.

For example, signing a message can be used to prove ownership of an account which a website could use to authenticate a user and log them in.

// Our signer; Signing messages does not require a Provider
signer = new Wallet(id("test"))
// Wallet {
//   address: '0xC08B5542D177ac6686946920409741463a15dDdB',
//   provider: null
// }

message = "sign into ethers.org?"

// Signing the message
sig = await signer.signMessage(message);
// '0xefc6e1d2f21bb22b1013d05ecf1f06fd73cdcb34388111e4deec58605f3667061783be1297d8e3bee955d5b583bac7b26789b4a4c12042d59799ca75d98d23a51c'

// Validating a message; notice the address matches the signer
verifyMessage(message, sig)
// '0xC08B5542D177ac6686946920409741463a15dDdB'
Many other more advanced protocols built on top of signed messages are used to allow a private key to authorize other users to transfer their tokens, allowing the transaction fees of the transfer to be paid by someone else.

 Ethereum Basics
This section aims to cover some of the basics for those interested in a deeper understanding of the inner-workings of Ethereum.

 Topics

Application Binary Interface
 Application Binary Interfaces
When interacting with any application, whether it is on Ethereum, over the internet or within a compiled application on a computer all information is stored and sent as binary data which is just a sequence of bytes.

So every application must agree on how to encode and decode their information as a sequence of bytes.

An Application Binary Interface (ABI) provides a way to describe the encoding and decoding process, in a generic way so that a variety of types and structures of types can be defined.

For example, a string is often encoded as a UTF-8 sequence of bytes, which uses specific bits within sub-sequences to indicate emoji and other special characters. Every implementation of UTF-8 must understand and operate under the same rules so that strings work universally. In this way, UTF-8 standard is itself an ABI.

When interacting with Ethereum, a contract received a sequence of bytes as input (provided by sending a transaction or through a call) and returns a result as a sequence of bytes. So, each Contract has its own ABI that helps specify how to encode the input and how to decode the output.

It is up to the contract developer to make this ABI available. Many Contracts implement a standard (such as ERC-20), in which case the ABI for that standard can be used. Many developers choose to verify their source code on Etherscan, in which case Etherscan computes the ABI and provides it through their website (which can be fetched using the getContract method). Otherwise, beyond reverse engineering the Contract there is not a meaningful way to extract the contract ABI.

 Call Data Representation
When calling a Contract on Ethereum, the input data must be encoded according to the ABI.

The first 4 bytes of the data are the method selector, which is the keccak256 hash of the normalized method signature.

Then the method parameters are encoded and concatenated to the selector.

All encoded data is made up of components padded to 32 bytes, so the length of input data will always be congruent to 4 mod 32.

The result of a successful call will be encoded values, whose components are padded to 32 bytes each as well, so the length of a result will always be congruent to 0 mod 32, on success.

The result of a reverted call will contain the error selector as the first 4 bytes, which is the keccak256 of the normalized error signature, followed by the encoded values, whose components are padded to 32 bytes each, so the length of a revert will be congruent to 4 mod 32.

The one exception to all this is that revert(false) will return a result or 0x.

 Event Data Representation
When an Event is emitted from a contract, there are two places data is logged in a Log: the topics and the data.

An additional fee is paid for each topic, but this affords a topic to be indexed in a bloom filter within the block, which allows efficient filtering.

The topic hash is always the first topic in a Log, which is the keccak256 of the normalized event signature. This allows a specific event to be efficiently filtered, finding the matching events in a block.

Each additional indexed parameter (i.e. parameters marked with indexed in the signautre) are placed in the topics as well, but may be filtered to find matching values.

All non-indexed parameters are encoded and placed in the data. This is cheaper and more compact, but does not allow filtering on these values.

For example, the event Transfer(address indexed from, address indexed to, uint value) would require 3 topics, which are the topic hash, the from address and the to address and the data would contain 32 bytes, which is the padded big-endian representation of value. This allows for efficient filtering by the event (i.e. Transfer) as well as the from address and to address.

 Deployment
When deploying a transaction, the data provided is treated as initcode, which executes the data as normal EVM bytecode, which returns a sequence of bytes, but instead of that sequence of bytes being treated as data that result is instead the bytecode to install as the bytecode of the contract.

The bytecode produced by Solidity is designed to have all constructor parameters encoded normally and concatenated to the bytecode and provided as the data to a transaction with no to address.

 Application Programming Interface
The Application Programming Interface (API) is the collection of functions, classes and types offered by the Ethers library.

CONSTANTS
 <src>version⇒ string
The current version of Ethers.

FUNCTIONS
 <src>splitBlobCells(proof: BytesLike, cellCount?: number)⇒ Array< string >
Returns a BLOb proof as its cells for EIP-7594 BLOb.

The default cellCount is 128.

 class PollingBlockTagSubscriber
inherits from OnBlockSubscriber, Subscriber
CREATING INSTANCES
 <src>new PollingBlockTagSubscriber(provider: AbstractProvider, tag: string)
 Application Binary Interface
The Application Binary Interface (ABI) describes how method input parameters should be encoded, their results decoded, and how to decode events and errors.

See About ABIs for more details how they are used.

FUNCTIONS
 <src>checkResultErrors(result: Result)⇒ Array< { error: Error , path: Array< string | number > } >
Returns all errors found in a Result.

Since certain errors encountered when creating a Result do not impact the ability to continue parsing data, they are deferred until they are actually accessed. Hence a faulty string in an Event that is never used does not impact the program flow.

However, sometimes it may be useful to access, identify or validate correctness of a Result.

 <src>decodeBytes32String(bytes: BytesLike)⇒ string
Encodes the Bytes32-encoded bytes into a string.

 <src>encodeBytes32String(text: string)⇒ string
Encodes text as a Bytes32 string.

 class Result
A Result is a sub-class of Array, which allows accessing any of its values either positionally by its index or, if keys are provided by its name.

CREATING INSTANCES
 <src>Result.fromItems(items: Array< any >, keys?: Array< null | string >)⇒ Result
Creates a new Result for items with each entry also accessible by its corresponding name in keys.

METHODS
 <src>result.getValue(name: string)⇒ any
Returns the value for name.

Since it is possible to have a key whose name conflicts with a method on a Result or its superclass Array, or any JavaScript keyword, this ensures all named values are still accessible by name.

 <src>result.toArray(deep?: boolean)⇒ Array< any >
Returns the Result as a normal Array. If deep, any children which are Result objects are also converted to a normal Array.

This will throw if there are any outstanding deferred errors.

 <src>result.toObject(deep?: boolean)⇒ Record< string, any >
Returns the Result as an Object with each name-value pair. If deep, any children which are Result objects are also converted to an Object.

This will throw if any value is unnamed, or if there are any outstanding deferred errors.

 Interfaces
The Interface class is a low-level class that accepts an ABI and provides all the necessary functionality to encode and decode paramaters to and results from methods, events and errors.

It also provides several convenience methods to automatically search and find matching transactions and events to parse them.

TYPES
 <src>InterfaceAbi⇒ string | ReadonlyArray< Fragment | JsonFragment | string >
An InterfaceAbi may be any supported ABI format.

A string is expected to be a JSON string, which will be parsed using JSON.parse. This means that the value must be a valid JSON string, with no stray commas, etc.

An array may contain any combination of:


Human-Readable fragments
Parsed JSON fragment
Fragment instances
A Human-Readable Fragment is a string which resembles a Solidity signature and is introduced in this blog entry. For example, function balanceOf(address) view returns (uint).

A Parsed JSON Fragment is a JavaScript Object desribed in the Solidity documentation.

 class ErrorDescription
When using the interface.parseError to automatically match an error for a call result for parsing, an ErrorDescription is returned.

PROPERTIES
 <src>errorDescription.args⇒ Resultread-only
The arguments passed to the Error with revert.

 <src>errorDescription.fragment⇒ ErrorFragmentread-only
The matching fragment.

 <src>errorDescription.name⇒ stringread-only
The name of the Error.

 <src>errorDescription.selector⇒ stringread-only
The selector for the Error.

 <src>errorDescription.signature⇒ stringread-only
The full Error signature.

 class Indexed
An Indexed is used as a value when a value that does not fit within a topic (i.e. not a fixed-length, 32-byte type). It is the keccak256 of the value, and used for types such as arrays, tuples, bytes and strings.

PROPERTIES
 <src>indexed.hash⇒ null | stringread-only
The keccak256 of the value logged.

STATIC METHODS
 <src>Indexed.isIndexed(value: any)⇒ boolean
Returns true if value is an Indexed.

This provides a Type Guard for property access.

 class Interface
An Interface abstracts many of the low-level details for encoding and decoding the data on the blockchain.

An ABI provides information on how to encode data to send to a Contract, how to decode the results and events and how to interpret revert errors.

The ABI can be specified by any supported format.

PROPERTIES
 <src>interface.deploy⇒ ConstructorFragmentread-only
The Contract constructor.

 <src>interface.fallback⇒ null | FallbackFragmentread-only
The Fallback method, if any.

 <src>interface.fragments⇒ ReadonlyArray< Fragment >read-only
All the Contract ABI members (i.e. methods, events, errors, etc).

 <src>interface.receive⇒ booleanread-only
If receiving ether is supported.

CREATING INSTANCES
 <src>new Interface(fragments: InterfaceAbi)
Create a new Interface for the fragments.

 <src>Interface.from(value: InterfaceAbi | Interface)⇒ Interface
Creates a new Interface from the ABI value.

The value may be provided as an existing Interface object, a JSON-encoded ABI or any Human-Readable ABI format.

METHODS
 <src>interface._decodeParams(params: ReadonlyArray< ParamType >, data: BytesLike)⇒ Result
 <src>interface._encodeParams(params: ReadonlyArray< ParamType >, values: ReadonlyArray< any >)⇒ string
 <src>interface.decodeErrorResult(fragment: ErrorFragment | string, data: BytesLike)⇒ Result
Decodes the result data (e.g. from an eth_call) for the specified error (see getError for valid values for key).

Most developers should prefer the parseCallResult method instead, which will automatically detect a CALL_EXCEPTION and throw the corresponding error.

 <src>interface.decodeEventLog(fragment: EventFragment | string, data: BytesLike, topics?: ReadonlyArray< string >)⇒ Result
 <src>interface.decodeFunctionData(fragment: FunctionFragment | string, data: BytesLike)⇒ Result
Decodes the data from a transaction tx.data for the function specified (see getFunction for valid values for fragment).

Most developers should prefer the parseTransaction method instead, which will automatically detect the fragment.

 <src>interface.decodeFunctionResult(fragment: FunctionFragment | string, data: BytesLike)⇒ Result
Decodes the result data (e.g. from an eth_call) for the specified function (see getFunction for valid values for key).

Most developers should prefer the parseCallResult method instead, which will automatically detect a CALL_EXCEPTION and throw the corresponding error.

 <src>interface.encodeDeploy(values?: ReadonlyArray< any >)⇒ string
Encodes a tx.data object for deploying the Contract with the values as the constructor arguments.

 <src>interface.encodeErrorResult(fragment: ErrorFragment | string, values?: ReadonlyArray< any >)⇒ string
Encodes the transaction revert data for a call result that reverted from the the Contract with the sepcified error (see getError for valid values for fragment) with the values.

This is generally not used by most developers, unless trying to mock a result from a Contract.

 <src>interface.encodeEventLog(fragment: EventFragment | string, values: ReadonlyArray< any >)⇒ { data: string , topics: Array< string > }
 <src>interface.encodeFilterTopics(fragment: EventFragment | string, values: ReadonlyArray< any >)⇒ Array< null | string | Array< string > >
 <src>interface.encodeFunctionData(fragment: FunctionFragment | string, values?: ReadonlyArray< any >)⇒ string
Encodes the tx.data for a transaction that calls the function specified (see getFunction for valid values for fragment) with the values.

 <src>interface.encodeFunctionResult(fragment: FunctionFragment | string, values?: ReadonlyArray< any >)⇒ string
Encodes the result data (e.g. from an eth_call) for the specified function (see getFunction for valid values for fragment) with values.

This is generally not used by most developers, unless trying to mock a result from a Contract.

 <src>interface.forEachError(callback: (func: ErrorFragment, index: number) => void)⇒ void
Iterate over all errors, calling callback, sorted by their name.

 <src>interface.forEachEvent(callback: (func: EventFragment, index: number) => void)⇒ void
Iterate over all events, calling callback, sorted by their name.

 <src>interface.forEachFunction(callback: (func: FunctionFragment, index: number) => void)⇒ void
Iterate over all functions, calling callback, sorted by their name.

 <src>interface.format(minimal?: boolean)⇒ Array< string >
Returns the entire Human-Readable ABI, as an array of signatures, optionally as minimal strings, which removes parameter names and unneceesary spaces.

 <src>interface.formatJson()⇒ string
Return the JSON-encoded ABI. This is the format Solidiy returns.

 <src>interface.getAbiCoder()⇒ AbiCoder
The ABI coder that will be used to encode and decode binary data.

 <src>interface.getError(key: string, values?: Array< any | Typed >)⇒ null | ErrorFragment
Get the ErrorFragment for key, which may be an error selector, error name or error signature that belongs to the ABI.

If values is provided, it will use the Typed API to handle ambiguous cases where multiple errors match by name.

If the key and values do not refine to a single error in the ABI, this will throw.

 <src>interface.getEvent(key: string, values?: Array< any | Typed >)⇒ null | EventFragment
Get the EventFragment for key, which may be a topic hash, event name or event signature that belongs to the ABI.

If values is provided, it will use the Typed API to handle ambiguous cases where multiple events match by name.

If the key and values do not refine to a single event in the ABI, this will throw.

 <src>interface.getEventName(key: string)⇒ string
Get the event name for key, which may be a topic hash, event name or event signature that belongs to the ABI.

 <src>interface.getFunction(key: string, values?: Array< any | Typed >)⇒ null | FunctionFragment
Get the FunctionFragment for key, which may be a function selector, function name or function signature that belongs to the ABI.

If values is provided, it will use the Typed API to handle ambiguous cases where multiple functions match by name.

If the key and values do not refine to a single function in the ABI, this will throw.

 <src>interface.getFunctionName(key: string)⇒ string
Get the function name for key, which may be a function selector, function name or function signature that belongs to the ABI.

 <src>interface.hasEvent(key: string)⇒ boolean
Returns true if key (an event topic hash, event name or event signature) is present in the ABI.

In the case of an event name, the name may be ambiguous, so accessing the EventFragment may require refinement.

 <src>interface.hasFunction(key: string)⇒ boolean
Returns true if key (a function selector, function name or function signature) is present in the ABI.

In the case of a function name, the name may be ambiguous, so accessing the FunctionFragment may require refinement.

 <src>interface.makeError(data: BytesLike, tx: CallExceptionTransaction)⇒ CallExceptionError
 <src>interface.parseCallResult(data: BytesLike)⇒ Result
 <src>interface.parseError(data: BytesLike)⇒ null | ErrorDescription
Parses a revert data, finding the matching error and extracts the parameter values along with other useful error details.

If the matching error cannot be found, returns null.

 <src>interface.parseLog(log: { data: string , topics: ReadonlyArray< string > })⇒ null | LogDescription
Parses a receipt log, finding the matching event and extracts the parameter values along with other useful event details.

If the matching event cannot be found, returns null.

 <src>interface.parseTransaction(tx: { data: string , value?: BigNumberish })⇒ null | TransactionDescription
Parses a transaction, finding the matching function and extracts the parameter values along with other useful function details.

If the matching function cannot be found, return null.

 class LogDescription
When using the interface.parseLog to automatically match a Log to its event for parsing, a LogDescription is returned.

PROPERTIES
 <src>logDescription.args⇒ Resultread-only
The arguments passed into the Event with emit.

 <src>logDescription.fragment⇒ EventFragmentread-only
The matching fragment for the topic0.

 <src>logDescription.name⇒ stringread-only
The name of the Event.

 <src>logDescription.signature⇒ stringread-only
The full Event signature.

 <src>logDescription.topic⇒ stringread-only
The topic hash for the Event.

 class TransactionDescription
When using the interface.parseTransaction to automatically match a transaction data to its function for parsing, a TransactionDescription is returned.

PROPERTIES
 <src>transactionDescription.args⇒ Resultread-only
The arguments passed to the Function from the transaction data.

 <src>transactionDescription.fragment⇒ FunctionFragmentread-only
The matching fragment from the transaction data.

 <src>transactionDescription.name⇒ stringread-only
The name of the Function from the transaction data.

 <src>transactionDescription.selector⇒ stringread-only
The selector for the Function from the transaction data.

 <src>transactionDescription.signature⇒ stringread-only
The full Function signature from the transaction data.

 <src>transactionDescription.value⇒ bigintread-only
The value (in wei) from the transaction.

 Typed Values
A Typed object allows a value to have its type explicitly specified.

For example, in Solidity, the value 45 could represent a uint8 or a uint256. The value 0x1234 could represent a bytes2 or bytes.

Since JavaScript has no meaningful way to explicitly inform any APIs which what the type is, this allows transparent interoperation with Soldity.

 class Typed
The Typed class to wrap values providing explicit type information.

PROPERTIES
 <src>typed.arrayLength⇒ null | numberread-only
Returns the length of the array type or -1 if it is dynamic.

Throws if the type is not an array.

 <src>typed.tupleName⇒ null | stringread-only
Returns the tuple name, if this is a tuple. Throws otherwise.

 <src>typed.type⇒ stringread-only
The type, as a Solidity-compatible type.

 <src>typed.value⇒ anyread-only
The actual value.

CREATING INSTANCES
 <src>Typed.address(v: string | Addressable)⇒ Typed
Return a new address type for v.

 <src>Typed.array(v: Array< any | Typed >, dynamic?: null | boolean)⇒ Typed
Return a new array type for v, allowing dynamic length.

 <src>Typed.bool(v: any)⇒ Typed
Return a new bool type for v.

 <src>Typed.bytes(v: BytesLike)⇒ Typed
Return a new bytes type for v.

 <src>Typed.bytes1(v: BytesLike)⇒ Typed
Return a new bytes1 type for v.

 <src>Typed.bytes10(v: BytesLike)⇒ Typed
Return a new bytes10 type for v.

 <src>Typed.bytes11(v: BytesLike)⇒ Typed
Return a new bytes11 type for v.

 <src>Typed.bytes12(v: BytesLike)⇒ Typed
Return a new bytes12 type for v.

 <src>Typed.bytes13(v: BytesLike)⇒ Typed
Return a new bytes13 type for v.

 <src>Typed.bytes14(v: BytesLike)⇒ Typed
Return a new bytes14 type for v.

 <src>Typed.bytes15(v: BytesLike)⇒ Typed
Return a new bytes15 type for v.

 <src>Typed.bytes16(v: BytesLike)⇒ Typed
Return a new bytes16 type for v.

 <src>Typed.bytes17(v: BytesLike)⇒ Typed
Return a new bytes17 type for v.

 <src>Typed.bytes18(v: BytesLike)⇒ Typed
Return a new bytes18 type for v.

 <src>Typed.bytes19(v: BytesLike)⇒ Typed
Return a new bytes19 type for v.

 <src>Typed.bytes2(v: BytesLike)⇒ Typed
Return a new bytes2 type for v.

 <src>Typed.bytes20(v: BytesLike)⇒ Typed
Return a new bytes20 type for v.

 <src>Typed.bytes21(v: BytesLike)⇒ Typed
Return a new bytes21 type for v.

 <src>Typed.bytes22(v: BytesLike)⇒ Typed
Return a new bytes22 type for v.

 <src>Typed.bytes23(v: BytesLike)⇒ Typed
Return a new bytes23 type for v.

 <src>Typed.bytes24(v: BytesLike)⇒ Typed
Return a new bytes24 type for v.

 <src>Typed.bytes25(v: BytesLike)⇒ Typed
Return a new bytes25 type for v.

 <src>Typed.bytes26(v: BytesLike)⇒ Typed
Return a new bytes26 type for v.

 <src>Typed.bytes27(v: BytesLike)⇒ Typed
Return a new bytes27 type for v.

 <src>Typed.bytes28(v: BytesLike)⇒ Typed
Return a new bytes28 type for v.

 <src>Typed.bytes29(v: BytesLike)⇒ Typed
Return a new bytes29 type for v.

 <src>Typed.bytes3(v: BytesLike)⇒ Typed
Return a new bytes3 type for v.

 <src>Typed.bytes30(v: BytesLike)⇒ Typed
Return a new bytes30 type for v.

 <src>Typed.bytes31(v: BytesLike)⇒ Typed
Return a new bytes31 type for v.

 <src>Typed.bytes32(v: BytesLike)⇒ Typed
Return a new bytes32 type for v.

 <src>Typed.bytes4(v: BytesLike)⇒ Typed
Return a new bytes4 type for v.

 <src>Typed.bytes5(v: BytesLike)⇒ Typed
Return a new bytes5 type for v.

 <src>Typed.bytes6(v: BytesLike)⇒ Typed
Return a new bytes6 type for v.

 <src>Typed.bytes7(v: BytesLike)⇒ Typed
Return a new bytes7 type for v.

 <src>Typed.bytes8(v: BytesLike)⇒ Typed
Return a new bytes8 type for v.

 <src>Typed.bytes9(v: BytesLike)⇒ Typed
Return a new bytes9 type for v.

 <src>Typed.from(type: string, value: any)⇒ Typed
Returns a new Typed of type with the value.

 <src>Typed.int(v: BigNumberish)⇒ Typed
Return a new int256 type for v.

 <src>Typed.int104(v: BigNumberish)⇒ Typed
Return a new int104 type for v.

 <src>Typed.int112(v: BigNumberish)⇒ Typed
Return a new int112 type for v.

 <src>Typed.int120(v: BigNumberish)⇒ Typed
Return a new int120 type for v.

 <src>Typed.int128(v: BigNumberish)⇒ Typed
Return a new int128 type for v.

 <src>Typed.int136(v: BigNumberish)⇒ Typed
Return a new int136 type for v.

 <src>Typed.int144(v: BigNumberish)⇒ Typed
Return a new int144 type for v.

 <src>Typed.int152(v: BigNumberish)⇒ Typed
Return a new int52 type for v.

 <src>Typed.int16(v: BigNumberish)⇒ Typed
Return a new int16 type for v.

 <src>Typed.int160(v: BigNumberish)⇒ Typed
Return a new int160 type for v.

 <src>Typed.int168(v: BigNumberish)⇒ Typed
Return a new int168 type for v.

 <src>Typed.int176(v: BigNumberish)⇒ Typed
Return a new int176 type for v.

 <src>Typed.int184(v: BigNumberish)⇒ Typed
Return a new int184 type for v.

 <src>Typed.int192(v: BigNumberish)⇒ Typed
Return a new int92 type for v.

 <src>Typed.int200(v: BigNumberish)⇒ Typed
Return a new int200 type for v.

 <src>Typed.int208(v: BigNumberish)⇒ Typed
Return a new int208 type for v.

 <src>Typed.int216(v: BigNumberish)⇒ Typed
Return a new int216 type for v.

 <src>Typed.int224(v: BigNumberish)⇒ Typed
Return a new int224 type for v.

 <src>Typed.int232(v: BigNumberish)⇒ Typed
Return a new int232 type for v.

 <src>Typed.int24(v: BigNumberish)⇒ Typed
Return a new int24 type for v.

 <src>Typed.int240(v: BigNumberish)⇒ Typed
Return a new int240 type for v.

 <src>Typed.int248(v: BigNumberish)⇒ Typed
Return a new int248 type for v.

 <src>Typed.int256(v: BigNumberish)⇒ Typed
Return a new int256 type for v.

 <src>Typed.int32(v: BigNumberish)⇒ Typed
Return a new int32 type for v.

 <src>Typed.int40(v: BigNumberish)⇒ Typed
Return a new int40 type for v.

 <src>Typed.int48(v: BigNumberish)⇒ Typed
Return a new int48 type for v.

 <src>Typed.int56(v: BigNumberish)⇒ Typed
Return a new int56 type for v.

 <src>Typed.int64(v: BigNumberish)⇒ Typed
Return a new int64 type for v.

 <src>Typed.int72(v: BigNumberish)⇒ Typed
Return a new int72 type for v.

 <src>Typed.int8(v: BigNumberish)⇒ Typed
Return a new int8 type for v.

 <src>Typed.int80(v: BigNumberish)⇒ Typed
Return a new int80 type for v.

 <src>Typed.int88(v: BigNumberish)⇒ Typed
Return a new int88 type for v.

 <src>Typed.int96(v: BigNumberish)⇒ Typed
Return a new int96 type for v.

 <src>Typed.overrides(v: Record< string, any >)⇒ Typed
Return a new uint8 type for v.

 <src>Typed.string(v: string)⇒ Typed
Return a new string type for v.

 <src>Typed.tuple(v: Array< any | Typed > | Record< string, any | Typed >, name?: string)⇒ Typed
Return a new tuple type for v, with the optional name.

 <src>Typed.uint(v: BigNumberish)⇒ Typed
Return a new uint256 type for v.

 <src>Typed.uint104(v: BigNumberish)⇒ Typed
Return a new uint104 type for v.

 <src>Typed.uint112(v: BigNumberish)⇒ Typed
Return a new uint112 type for v.

 <src>Typed.uint120(v: BigNumberish)⇒ Typed
Return a new uint120 type for v.

 <src>Typed.uint128(v: BigNumberish)⇒ Typed
Return a new uint128 type for v.

 <src>Typed.uint136(v: BigNumberish)⇒ Typed
Return a new uint136 type for v.

 <src>Typed.uint144(v: BigNumberish)⇒ Typed
Return a new uint144 type for v.

 <src>Typed.uint152(v: BigNumberish)⇒ Typed
Return a new uint152 type for v.

 <src>Typed.uint16(v: BigNumberish)⇒ Typed
Return a new uint16 type for v.

 <src>Typed.uint160(v: BigNumberish)⇒ Typed
Return a new uint160 type for v.

 <src>Typed.uint168(v: BigNumberish)⇒ Typed
Return a new uint168 type for v.

 <src>Typed.uint176(v: BigNumberish)⇒ Typed
Return a new uint176 type for v.

 <src>Typed.uint184(v: BigNumberish)⇒ Typed
Return a new uint184 type for v.

 <src>Typed.uint192(v: BigNumberish)⇒ Typed
Return a new uint192 type for v.

 <src>Typed.uint200(v: BigNumberish)⇒ Typed
Return a new uint200 type for v.

 <src>Typed.uint208(v: BigNumberish)⇒ Typed
Return a new uint208 type for v.

 <src>Typed.uint216(v: BigNumberish)⇒ Typed
Return a new uint216 type for v.

 <src>Typed.uint224(v: BigNumberish)⇒ Typed
Return a new uint224 type for v.

 <src>Typed.uint232(v: BigNumberish)⇒ Typed
Return a new uint232 type for v.

 <src>Typed.uint24(v: BigNumberish)⇒ Typed
Return a new uint24 type for v.

 <src>Typed.uint240(v: BigNumberish)⇒ Typed
Return a new uint240 type for v.

 <src>Typed.uint248(v: BigNumberish)⇒ Typed
Return a new uint248 type for v.

 <src>Typed.uint256(v: BigNumberish)⇒ Typed
Return a new uint256 type for v.

 <src>Typed.uint32(v: BigNumberish)⇒ Typed
Return a new uint32 type for v.

 <src>Typed.uint40(v: BigNumberish)⇒ Typed
Return a new uint40 type for v.

 <src>Typed.uint48(v: BigNumberish)⇒ Typed
Return a new uint48 type for v.

 <src>Typed.uint56(v: BigNumberish)⇒ Typed
Return a new uint56 type for v.

 <src>Typed.uint64(v: BigNumberish)⇒ Typed
Return a new uint64 type for v.

 <src>Typed.uint72(v: BigNumberish)⇒ Typed
Return a new uint72 type for v.

 <src>Typed.uint8(v: BigNumberish)⇒ Typed
Return a new uint8 type for v.

 <src>Typed.uint80(v: BigNumberish)⇒ Typed
Return a new uint80 type for v.

 <src>Typed.uint88(v: BigNumberish)⇒ Typed
Return a new uint88 type for v.

 <src>Typed.uint96(v: BigNumberish)⇒ Typed
Return a new uint96 type for v.

METHODS
 <src>typed.defaultValue()⇒ string | number | bigint | Result
The default value returned by this type.

 <src>typed.format()⇒ string
Format the type as a Human-Readable type.

 <src>typed.isBigInt()⇒ boolean
Returns true and provides a type guard is this is a TypedBigInt.

 <src>typed.isData()⇒ boolean
Returns true and provides a type guard is this is a TypedData.

 <src>typed.isString()⇒ boolean
Returns true and provides a type guard is this is a TypedString.

 <src>typed.maxValue()⇒ string | number | bigint
The maximum value for numeric types.

 <src>typed.minValue()⇒ string | number | bigint
The minimum value for numeric types.

STATIC METHODS
 <src>Typed.dereference(value: Typed | T, type: string)⇒ T
If the value is a Typed instance, validates the underlying value and returns it, otherwise returns value directly.

This is useful for functions that with to accept either a Typed object or values.

 <src>Typed.isTyped(value: any)⇒ boolean
Returns true only if value is a Typed instance.

 interface TypedBigInt
inherits from Typed
A Typed that represents a numeric value.

PROPERTIES
 <src>typedBigInt.value⇒ bigint
The value.

METHODS
 <src>typedBigInt.defaultValue()⇒ bigint
The default value for all numeric types is 0.

 <src>typedBigInt.maxValue()⇒ bigint
The minimum value for this type, accounting for bit-width.

 <src>typedBigInt.minValue()⇒ bigint
The minimum value for this type, accounting for bit-width and signed-ness.

 interface TypedData
inherits from Typed
A Typed that represents a binary sequence of data as bytes.

PROPERTIES
 <src>typedData.value⇒ string
The value.

METHODS
 <src>typedData.defaultValue()⇒ string
The default value for this type.

 interface TypedString
inherits from Typed
A Typed that represents a UTF-8 sequence of bytes.

PROPERTIES
 <src>typedString.value⇒ string
The value.

METHODS
 <src>typedString.defaultValue()⇒ string
The default value for the string type is the empty string (i.e. "").

 ABI Encoding
When sending values to or receiving values from a Contract, the data is generally encoded using the ABI standard.

The AbiCoder provides a utility to encode values to ABI data and decode values from ABI data.

Most of the time, developers should favour the Contract class, which further abstracts a lot of the finer details of ABI data.

 class AbiCoder
The AbiCoder is a low-level class responsible for encoding JavaScript values into binary data and decoding binary data into JavaScript values.

CREATING INSTANCES
 <src>AbiCoder.defaultAbiCoder()⇒ AbiCoder
Returns the shared singleton instance of a default AbiCoder.

On the first call, the instance is created internally.

METHODS
 <src>abiCoder.decode(types: ReadonlyArray< string | ParamType >, data: BytesLike, loose?: boolean)⇒ Result
Decode the ABI data as the types into values.

If loose decoding is enabled, then strict padding is not enforced. Some older versions of Solidity incorrectly padded event data emitted from external functions.

 <src>abiCoder.encode(types: ReadonlyArray< string | ParamType >, values: ReadonlyArray< any >)⇒ DataHexstring
Encode the values as the types into ABI data.

 <src>abiCoder.getDefaultValue(types: ReadonlyArray< string | ParamType >)⇒ Result
Get the default values for the given types.

For example, a uint is by default 0 and bool is by default false.

STATIC METHODS
 <src>AbiCoder._setDefaultMaxInflation(value: number)⇒ void
 <src>AbiCoder.getBuiltinCallException(action: CallExceptionAction, tx: { data?: string , from?: null | string , to?: null | string }, data: null | BytesLike)⇒ CallExceptionError
Returns an ethers-compatible CallExceptionError Error for the given result data for the CallExceptionAction action against the Transaction tx.

 Fragments
A fragment is a single item from an ABI, which may represent any of:


Functions
Events
Constructors
Custom Errors
Fallback or Receive functions
TYPES
 <src>FormatType⇒ "sighash" | "minimal" | "full" | "json"
The format to serialize the output as.

"sighash" - the bare formatting, used to compute the selector or topic hash; this format cannot be reversed (as it discards indexed) so cannot by used to export an Interface.

"minimal" - Human-Readable ABI with minimal spacing and without names, so it is compact, but will result in Result objects that cannot be accessed by name.

"full" - Full Human-Readable ABI, with readable spacing and names intact; this is generally the recommended format.

"json" - The JSON ABI format.

 <src>FragmentType⇒ "constructor" | "error" | "event" | "fallback" | "function" | "struct"
The type of a Fragment.

 <src>ParamTypeWalkAsyncFunc⇒ (type: string, value: any) => any | Promise< any >
When walking asynchronously a ParamType, this is called on each component.

 <src>ParamTypeWalkFunc⇒ (type: string, value: any) => any
When walking a ParamType, this is called on each component.

 class ConstructorFragment
inherits from Fragment
A Fragment which represents a constructor.

PROPERTIES
 <src>constructorFragment.gas⇒ null | bigintread-only
The recommended gas limit for deployment or null.

 <src>constructorFragment.payable⇒ booleanread-only
Whether the constructor can receive an endowment.

CREATING INSTANCES
 <src>ConstructorFragment.from(obj: any)⇒ ConstructorFragment
Returns a new ConstructorFragment for obj.

METHODS
 <src>constructorFragment.format(format?: FormatType)⇒ string
Returns a string representation of this constructor as format.

STATIC METHODS
 <src>ConstructorFragment.isFragment(value: any)⇒ boolean
Returns true and provides a type guard if value is a ConstructorFragment.

 class ErrorFragment
inherits from NamedFragment, Fragment
A Fragment which represents a Custom Error.

PROPERTIES
 <src>errorFragment.selector⇒ stringread-only
The Custom Error selector.

CREATING INSTANCES
 <src>ErrorFragment.from(obj: any)⇒ ErrorFragment
Returns a new ErrorFragment for obj.

METHODS
 <src>errorFragment.format(format?: FormatType)⇒ string
Returns a string representation of this fragment as format.

STATIC METHODS
 <src>ErrorFragment.isFragment(value: any)⇒ boolean
Returns true and provides a type guard if value is an ErrorFragment.

 class EventFragment
inherits from NamedFragment, Fragment
A Fragment which represents an Event.

PROPERTIES
 <src>eventFragment.anonymous⇒ booleanread-only
Whether this event is anonymous.

 <src>eventFragment.topicHash⇒ stringread-only
The Event topic hash.

CREATING INSTANCES
 <src>EventFragment.from(obj: any)⇒ EventFragment
Returns a new EventFragment for obj.

METHODS
 <src>eventFragment.format(format?: FormatType)⇒ string
Returns a string representation of this event as format.

STATIC METHODS
 <src>EventFragment.getTopicHash(name: string, params?: Array< any >)⇒ string
Return the topic hash for an event with name and params.

 <src>EventFragment.isFragment(value: any)⇒ boolean
Returns true and provides a type guard if value is an EventFragment.

 class FallbackFragment
inherits from Fragment
A Fragment which represents a method.

PROPERTIES
 <src>fallbackFragment.payable⇒ booleanread-only
If the function can be sent value during invocation.

CREATING INSTANCES
 <src>new FallbackFragment(guard: any, inputs: ReadonlyArray< ParamType >, payable: boolean)
 <src>FallbackFragment.from(obj: any)⇒ FallbackFragment
Returns a new FallbackFragment for obj.

METHODS
 <src>fallbackFragment.format(format?: FormatType)⇒ string
Returns a string representation of this fallback as format.

STATIC METHODS
 <src>FallbackFragment.isFragment(value: any)⇒ boolean
Returns true and provides a type guard if value is a FallbackFragment.

 abstract class Fragment
An abstract class to represent An individual fragment from a parse ABI.

PROPERTIES
 <src>fragment.inputs⇒ ReadonlyArray< ParamType >read-only
The inputs for the fragment.

 <src>fragment.type⇒ FragmentTyperead-only
The type of the fragment.

CREATING INSTANCES
 <src>Fragment.from(obj: any)⇒ Fragment
Creates a new Fragment for obj, wich can be any supported ABI frgament type.

METHODS
 <src>fragment.format(format?: FormatType)⇒ stringabstract
Returns a string representation of this fragment as format.

STATIC METHODS
 <src>Fragment.isConstructor(value: any)⇒ boolean
Returns true if value is a ConstructorFragment.

 <src>Fragment.isError(value: any)⇒ boolean
Returns true if value is an ErrorFragment.

 <src>Fragment.isEvent(value: any)⇒ boolean
Returns true if value is an EventFragment.

 <src>Fragment.isFunction(value: any)⇒ boolean
Returns true if value is a FunctionFragment.

 <src>Fragment.isStruct(value: any)⇒ boolean
Returns true if value is a StructFragment.

 class FunctionFragment
inherits from NamedFragment, Fragment
A Fragment which represents a method.

PROPERTIES
 <src>functionFragment.constant⇒ booleanread-only
If the function is constant (e.g. pure or view functions).

 <src>functionFragment.gas⇒ null | bigintread-only
The recommended gas limit to send when calling this function.

 <src>functionFragment.outputs⇒ ReadonlyArray< ParamType >read-only
The returned types for the result of calling this function.

 <src>functionFragment.payable⇒ booleanread-only
If the function can be sent value during invocation.

 <src>functionFragment.selector⇒ stringread-only
The Function selector.

 <src>functionFragment.stateMutability⇒ "payable" | "nonpayable" | "view" | "pure"read-only
The state mutability (e.g. payable, nonpayable, view or pure)

CREATING INSTANCES
 <src>FunctionFragment.from(obj: any)⇒ FunctionFragment
Returns a new FunctionFragment for obj.

METHODS
 <src>functionFragment.format(format?: FormatType)⇒ string
Returns a string representation of this function as format.

STATIC METHODS
 <src>FunctionFragment.getSelector(name: string, params?: Array< any >)⇒ string
Return the selector for a function with name and params.

 <src>FunctionFragment.isFragment(value: any)⇒ boolean
Returns true and provides a type guard if value is a FunctionFragment.

 interface JsonFragment
A fragment for a method, event or error in a JSON ABI format.

PROPERTIES
 <src>jsonFragment.anonymous⇒ booleanread-only
If the event is anonymous.

 <src>jsonFragment.constant⇒ booleanread-only
If the function is constant.

 <src>jsonFragment.gas⇒ stringread-only
The gas limit to use when sending a transaction for this function.

 <src>jsonFragment.inputs⇒ ReadonlyArray< JsonFragmentType >read-only
The input parameters.

 <src>jsonFragment.name⇒ stringread-only
The name of the error, event, function, etc.

 <src>jsonFragment.outputs⇒ ReadonlyArray< JsonFragmentType >read-only
The output parameters.

 <src>jsonFragment.payable⇒ booleanread-only
If the function is payable.

 <src>jsonFragment.stateMutability⇒ stringread-only
The mutability state of the function.

 <src>jsonFragment.type⇒ stringread-only
The type of the fragment (e.g. event, "function", etc.)

 interface JsonFragmentType
A Type description in a JSON ABI format.

PROPERTIES
 <src>jsonFragmentType.components⇒ ReadonlyArray< JsonFragmentType >read-only
The components for a tuple.

 <src>jsonFragmentType.indexed⇒ booleanread-only
If the parameter is indexed.

 <src>jsonFragmentType.internalType⇒ stringread-only
The internal Solidity type.

 <src>jsonFragmentType.name⇒ stringread-only
The parameter name.

 <src>jsonFragmentType.type⇒ stringread-only
The type of the parameter.

 abstract class NamedFragment
inherits from Fragment
An abstract class to represent An individual fragment which has a name from a parse ABI.

PROPERTIES
 <src>namedFragment.name⇒ stringread-only
The name of the fragment.

 class ParamType
Each input and output of a Fragment is an Array of ParamType.

PROPERTIES
 <src>paramType.arrayChildren⇒ null | ParamTyperead-only
The type of each child in the array.

For non-array types this is null.

 <src>paramType.arrayLength⇒ null | numberread-only
The array length, or -1 for dynamic-lengthed arrays.

For non-array types this is null.

 <src>paramType.baseType⇒ stringread-only
The base type (e.g. "address", "tuple", "array")

 <src>paramType.components⇒ null | ReadonlyArray< ParamType >read-only
The components for the tuple.

For non-tuple types this is null.

 <src>paramType.indexed⇒ null | booleanread-only
True if the parameters is indexed.

For non-indexable types this is null.

 <src>paramType.name⇒ stringread-only
The local name of the parameter (or "" if unbound)

 <src>paramType.type⇒ stringread-only
The fully qualified type (e.g. "address", "tuple(address)", "uint256[3][]")

CREATING INSTANCES
 <src>ParamType.from(obj: any, allowIndexed?: boolean)⇒ ParamType
Creates a new ParamType for obj.

If allowIndexed then the indexed keyword is permitted, otherwise the indexed keyword will throw an error.

METHODS
 <src>paramType.format(format?: FormatType)⇒ string
Return a string representation of this type.

For example,

sighash" => "(uint256,address)"

"minimal" => "tuple(uint256,address) indexed"

"full" => "tuple(uint256 foo, address bar) indexed baz"

 <src>paramType.isArray()⇒ boolean
Returns true if this is an Array type.

This provides a type gaurd ensuring that arrayChildren and arrayLength are non-null.

 <src>paramType.isIndexable()⇒ boolean
Returns true if this is an Indexable type.

This provides a type gaurd ensuring that indexed is non-null.

 <src>paramType.isTuple()⇒ boolean
Returns true if this is a Tuple type.

This provides a type gaurd ensuring that components is non-null.

 <src>paramType.walk(value: any, process: ParamTypeWalkFunc)⇒ any
Walks the ParamType with value, calling process on each type, destructing the value recursively.

 <src>paramType.walkAsync(value: any, process: ParamTypeWalkAsyncFunc)⇒ Promise< any >
Walks the ParamType with value, asynchronously calling process on each type, destructing the value recursively.

This can be used to resolve ENS names by walking and resolving each "address" type.

STATIC METHODS
 <src>ParamType.isParamType(value: any)⇒ boolean
Returns true if value is a ParamType.

 class StructFragment
inherits from NamedFragment, Fragment
A Fragment which represents a structure.

CREATING INSTANCES
 <src>StructFragment.from(obj: any)⇒ StructFragment
Returns a new StructFragment for obj.

METHODS
 <src>structFragment.format()⇒ string
Returns a string representation of this struct as format.

STATIC METHODS
 <src>StructFragment.isFragment(value: any)⇒ boolean
Returns true and provides a type guard if value is a StructFragment.

 Addresses
Addresses are a fundamental part of interacting with Ethereum. They represent the global identity of Externally Owned Accounts (accounts backed by a private key) and contracts.

The Ethereum Naming Service (ENS) provides an interconnected ecosystem of contracts, standards and libraries which enable looking up an address for an ENS name.

These functions help convert between various formats, validate addresses and safely resolve ENS names.

TYPES
 <src>AddressLike⇒ string | Promise< string > | Addressable
Anything that can be used to return or resolve an address.

FUNCTIONS
 <src>getAddress(address: string)⇒ string
Returns a normalized and checksumed address for address. This accepts non-checksum addresses, checksum addresses and getIcapAddress formats.

The checksum in Ethereum uses the capitalization (upper-case vs lower-case) of the characters within an address to encode its checksum, which offers, on average, a checksum of 15-bits.

If address contains both upper-case and lower-case, it is assumed to already be a checksum address and its checksum is validated, and if the address fails its expected checksum an error is thrown.

If you wish the checksum of address to be ignore, it should be converted to lower-case (i.e. .toLowercase()) before being passed in. This should be a very rare situation though, that you wish to bypass the safegaurds in place to protect against an address that has been incorrectly copied from another source.

// Adds the checksum (via upper-casing specific letters)
getAddress("0x8ba1f109551bd432803012645ac136ddd64dba72")
// '0x8ba1f109551bD432803012645Ac136ddd64DBA72'

// Converts ICAP address and adds checksum
getAddress("XE65GB6LDNXYOFTX0NSV3FUWKOWIXAMJK36");
// '0x8ba1f109551bD432803012645Ac136ddd64DBA72'

// Throws an error if an address contains mixed case,
// but the checksum fails
getAddress("0x8Ba1f109551bD432803012645Ac136ddd64DBA72")
// Error("bad address checksum", {
//   code: "INVALID_ARGUMENT"
//   argument: "address"
//   value: "0x8Ba1f109551bD432803012645Ac136ddd64DBA72"
//   shortMessage: "bad address checksum"
// })
 <src>getCreate2Address(from: string, salt: BytesLike, initCodeHash: BytesLike)⇒ string
Returns the address that would result from a CREATE2 operation with the given from, salt and initCodeHash.

To compute the initCodeHash from a contract's init code, use the keccak256 function.

For a quick overview and example of CREATE2, see Wisps: The Magical World of Create2.

// The address of the contract
from = "0x8ba1f109551bD432803012645Ac136ddd64DBA72"

// The salt
salt = id("HelloWorld")

// The hash of the initCode
initCode = "0x6394198df16000526103ff60206004601c335afa6040516060f3";
initCodeHash = keccak256(initCode)

getCreate2Address(from, salt, initCodeHash)
// '0x533ae9d683B10C02EbDb05471642F85230071FC3'
 <src>getCreateAddress(tx: { from: string , nonce: BigNumberish })⇒ string
Returns the address that would result from a CREATE for tx.

This can be used to compute the address a contract will be deployed to by an EOA when sending a deployment transaction (i.e. when the to address is null).

This can also be used to compute the address a contract will be deployed to by a contract, by using the contract's address as the to and the contract's nonce.

from = "0x8ba1f109551bD432803012645Ac136ddd64DBA72";
nonce = 5;

getCreateAddress({ from, nonce });
// '0x082B6aC9e47d7D83ea3FaBbD1eC7DAba9D687b36'
 <src>getIcapAddress(address: string)⇒ string
The ICAP Address format format is an early checksum format which attempts to be compatible with the banking industry IBAN format for bank accounts.

It is no longer common or a recommended format.

getIcapAddress("0x8ba1f109551bd432803012645ac136ddd64dba72");
// 'XE65GB6LDNXYOFTX0NSV3FUWKOWIXAMJK36'

getIcapAddress("XE65GB6LDNXYOFTX0NSV3FUWKOWIXAMJK36");
// 'XE65GB6LDNXYOFTX0NSV3FUWKOWIXAMJK36'

// Throws an error if the ICAP checksum is wrong
getIcapAddress("XE65GB6LDNXYOFTX0NSV3FUWKOWIXAMJK37");
// Error("bad icap checksum", {
//   code: "INVALID_ARGUMENT"
//   argument: "address"
//   value: "XE65GB6LDNXYOFTX0NSV3FUWKOWIXAMJK37"
//   shortMessage: "bad icap checksum"
// })
 <src>isAddress(value: any)⇒ boolean
Returns true if value is a valid address.

// Valid address
isAddress("0x8ba1f109551bD432803012645Ac136ddd64DBA72")
// true

// Valid ICAP address
isAddress("XE65GB6LDNXYOFTX0NSV3FUWKOWIXAMJK36")
// true

// Invalid checksum
isAddress("0x8Ba1f109551bD432803012645Ac136ddd64DBa72")
// false

// Invalid ICAP checksum
isAddress("0x8Ba1f109551bD432803012645Ac136ddd64DBA72")
// false

// Not an address (an ENS name requires a provided and an
// asynchronous API to access)
isAddress("ricmoo.eth")
// false
 <src>isAddressable(value: any)⇒ boolean
Returns true if value is an object which implements the Addressable interface.

// Wallets and AbstractSigner sub-classes
isAddressable(Wallet.createRandom())
// true

// Contracts
contract = new Contract("dai.tokens.ethers.eth", [ ], provider)
isAddressable(contract)
// true
 <src>resolveAddress(target: AddressLike, resolver?: null | NameResolver)⇒ string | Promise< string >
Resolves to an address for the target, which may be any supported address type, an Addressable or a Promise which resolves to an address.

If an ENS name is provided, but that name has not been correctly configured a UnconfiguredNameError is thrown.

addr = "0x6B175474E89094C44Da98b954EedeAC495271d0F"

// Addresses are return synchronously
resolveAddress(addr, provider)
// '0x6B175474E89094C44Da98b954EedeAC495271d0F'

// Address promises are resolved asynchronously
resolveAddress(Promise.resolve(addr))
// Promise<'0x6B175474E89094C44Da98b954EedeAC495271d0F'>

// ENS names are resolved asynchronously
resolveAddress("dai.tokens.ethers.eth", provider)
// Promise<'0x6B175474E89094C44Da98b954EedeAC495271d0F'>

// Addressable objects are resolved asynchronously
contract = new Contract(addr, [ ])
resolveAddress(contract, provider)
// Promise<'0x6B175474E89094C44Da98b954EedeAC495271d0F'>

// Unconfigured ENS names reject
resolveAddress("nothing-here.ricmoo.eth", provider)
// Promise<Error("unconfigured name", {
//   code: "UNCONFIGURED_NAME"
//   value: "nothing-here.ricmoo.eth"
//   shortMessage: "unconfigured name"
// })>

// ENS names require a NameResolver object passed in
// (notice the provider was omitted)
resolveAddress("nothing-here.ricmoo.eth")
// Error("ENS resolution requires a provider", {
//   code: "UNSUPPORTED_OPERATION"
//   operation: "resolveName"
//   shortMessage: "ENS resolution requires a provider"
// })
 interface Addressable
An interface for objects which have an address, and can resolve it asyncronously.

This allows objects such as Signer or Contract to be used most places an address can be, for example getting the balance.

METHODS
 <src>addressable.getAddress()⇒ Promise< string >
Get the object address.

 interface NameResolver
An interface for any object which can resolve an ENS name.

METHODS
 <src>nameResolver.resolveName(name: string)⇒ Promise< null | string >
Resolve to the address for the ENS name.

Resolves to null if the name is unconfigued. Use resolveAddress (passing this object as resolver) to throw for names that are unconfigured.

 Constants
Some common constants useful for Ethereum.

CONSTANTS
 <src>EtherSymbol⇒ string
A constant for the ether symbol (normalized using NFKC).

(i.e. "\u039e")

 <src>MaxInt256⇒ bigint
A constant for the maximum value for an int256.

(i.e. 0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn)

 <src>MaxUint256⇒ bigint
A constant for the maximum value for a uint256.

(i.e. 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn)

 <src>MessagePrefix⇒ string
A constant for the EIP-191 personal message prefix.

(i.e. "\x19Ethereum Signed Message:\n")

 <src>MinInt256⇒ bigint
A constant for the minimum value for an int256.

(i.e. -8000000000000000000000000000000000000000000000000000000000000000n)

 <src>N⇒ bigint
A constant for the order N for the secp256k1 curve.

(i.e. 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n)

 <src>WeiPerEther⇒ bigint
A constant for the number of wei in a single ether.

(i.e. 1000000000000000000n)

 <src>ZeroAddress⇒ string
A constant for the zero address.

(i.e. "0x0000000000000000000000000000000000000000")

 <src>ZeroHash⇒ string
A constant for the zero hash.

(i.e. "0x0000000000000000000000000000000000000000000000000000000000000000")

 Contracts
A Contract object is a meta-class (a class whose definition is defined at runtime), which communicates with a deployed smart contract on the blockchain and provides a simple JavaScript interface to call methods, send transaction, query historic logs and listen for its events.

TYPES
 <src>ContractEventName⇒ string | ContractEvent | TopicFilter | DeferredTopicFilter
The name for an event used for subscribing to Contract events.

string - An event by name. The event must be non-ambiguous. The parameters will be dereferenced when passed into the listener.

ContractEvent - A filter from the contract.filters, which will pass only the EventPayload as a single parameter, which includes a .signature property that can be used to further filter the event.

TopicFilter - A filter defined using the standard Ethereum API which provides the specific topic hash or topic hashes to watch for along with any additional values to filter by. This will only pass a single parameter to the listener, the EventPayload which will include additional details to refine by, such as the event name and signature.

DeferredTopicFilter - A filter created by calling a ContractEvent with parameters, which will create a filter for a specific event signature and dereference each parameter when calling the listener.

 class BaseContract
inherits from Addressable
PROPERTIES
 <src>baseContract.fallback⇒ null | WrappedFallbackread-only
The fallback or receive function if any.

 <src>baseContract.filters⇒ Record< string, ContractEvent >read-only
All the Events available on this contract.

 <src>baseContract.interface⇒ Interfaceread-only
The contract Interface.

 <src>baseContract.runner⇒ null | ContractRunnerread-only
The connected runner. This is generally a Provider or a Signer, which dictates what operations are supported.

For example, a Contract connected to a Provider may only execute read-only operations.

 <src>baseContract.target⇒ string | Addressableread-only
The target to connect to.

This can be an address, ENS name or any Addressable, such as another contract. To get the resolved address, use the getAddress method.

CREATING INSTANCES
 <src>new BaseContract(target: string | Addressable, abi: Interface | InterfaceAbi, runner?: null | ContractRunner, deployTx?: null | TransactionResponse)
Creates a new contract connected to target with the abi and optionally connected to a runner to perform operations on behalf of.

METHODS
 <src>baseContract.addListener(event: ContractEventName, listener: Listener)⇒ Promise< this >
Alias for [on].

 <src>baseContract.attach(target: string | Addressable)⇒ BaseContract
Return a new Contract instance with the same ABI and runner, but a different target.

 <src>baseContract.connect(runner: null | ContractRunner)⇒ BaseContract
Return a new Contract instance with the same target and ABI, but a different runner.

 <src>baseContract.deploymentTransaction()⇒ null | ContractTransactionResponse
Return the transaction used to deploy this contract.

This is only available if this instance was returned from a ContractFactory.

 <src>baseContract.emit(event: ContractEventName, args: Array< any >)⇒ Promise< boolean >
Emit an event calling all listeners with args.

Resolves to true if any listeners were called.

 <src>baseContract.getAddress()⇒ Promise< string >
Return the resolved address of this Contract.

 <src>baseContract.getDeployedCode()⇒ Promise< null | string >
Return the deployed bytecode or null if no bytecode is found.

 <src>baseContract.getEvent(key: string | EventFragment)⇒ ContractEvent
Return the event for a given name. This is useful when a contract event name conflicts with a JavaScript name such as prototype or when using a Contract programmatically.

 <src>baseContract.getFunction(key: string | FunctionFragment)⇒ T
Return the function for a given name. This is useful when a contract method name conflicts with a JavaScript name such as prototype or when using a Contract programmatically.

 <src>baseContract.listenerCount(event?: ContractEventName)⇒ Promise< number >
Resolves to the number of listeners of event or the total number of listeners if unspecified.

 <src>baseContract.listeners(event?: ContractEventName)⇒ Promise< Array< Listener > >
Resolves to the listeners subscribed to event or all listeners if unspecified.

 <src>baseContract.off(event: ContractEventName, listener?: Listener)⇒ Promise< this >
Remove the listener from the listeners for event or remove all listeners if unspecified.

 <src>baseContract.on(event: ContractEventName, listener: Listener)⇒ Promise< this >
Add an event listener for the event.

 <src>baseContract.once(event: ContractEventName, listener: Listener)⇒ Promise< this >
Add an event listener for the event, but remove the listener after it is fired once.

 <src>baseContract.queryFilter(event: ContractEventName, fromBlock?: BlockTag, toBlock?: BlockTag)⇒ Promise< Array< EventLog | Log > >
Provide historic access to event data for event in the range fromBlock (default: 0) to toBlock (default: "latest") inclusive.

 <src>baseContract.removeAllListeners(event?: ContractEventName)⇒ Promise< this >
Remove all the listeners for event or remove all listeners if unspecified.

 <src>baseContract.removeListener(event: ContractEventName, listener: Listener)⇒ Promise< this >
Alias for [off].

 <src>baseContract.waitForDeployment()⇒ Promise< this >
Resolve to this Contract once the bytecode has been deployed, or resolve immediately if already deployed.

STATIC METHODS
 <src>BaseContract.buildClass(abi: Interface | InterfaceAbi)⇒ TODO(A2Bconstructor(@TODO-001))
Create a new Class for the abi.

 <src>BaseContract.from(target: string, abi: Interface | InterfaceAbi, runner?: null | ContractRunner)⇒ BaseContract & Omit< T, keyof<BaseContract> >
Create a new BaseContract with a specified Interface.

 interface BaseContractMethod
A Contract method can be called directly, or used in various ways.

PROPERTIES
 <src>baseContractMethod.fragment⇒ FunctionFragment
The fragment of the Contract method. This will throw on ambiguous method names.

 <src>baseContractMethod.name⇒ string
The name of the Contract method.

METHODS
 <src>baseContractMethod.estimateGas(args: ContractMethodArgs< A >)⇒ Promise< bigint >
Estimate the gas to send the contract method with args.

 <src>baseContractMethod.getFragment(args: ContractMethodArgs< A >)⇒ FunctionFragment
Returns the fragment constrained by args. This can be used to resolve ambiguous method names.

 <src>baseContractMethod.populateTransaction(args: ContractMethodArgs< A >)⇒ Promise< ContractTransaction >
Returns a populated transaction that can be used to perform the contract method with args.

 <src>baseContractMethod.send(args: ContractMethodArgs< A >)⇒ Promise< ContractTransactionResponse >
Send a transaction for the contract method with args.

 <src>baseContractMethod.staticCall(args: ContractMethodArgs< A >)⇒ Promise< R >
Call the contract method with args and return the value.

If the return value is a single type, it will be dereferenced and returned directly, otherwise the full Result will be returned.

 <src>baseContractMethod.staticCallResult(args: ContractMethodArgs< A >)⇒ Promise< Result >
Call the contract method with args and return the Result without any dereferencing.

 interface ConstantContractMethod
inherits from ContractMethod, BaseContractMethod
A pure of view method on a Contract.

 class Contract
A BaseContract with no type guards on its methods or events.

 interface ContractDeployTransaction
A deployment transaction for a contract.

 interface ContractEvent
PROPERTIES
 <src>contractEvent.fragment⇒ EventFragment
The fragment of the Contract event. This will throw on ambiguous method names.

 <src>contractEvent.name⇒ string
The name of the Contract event.

METHODS
 <src>contractEvent.getFragment(args: ContractEventArgs< A >)⇒ EventFragment
Returns the fragment constrained by args. This can be used to resolve ambiguous event names.

 class ContractEventPayload
inherits from ContractUnknownEventPayload, EventPayload
A ContractEventPayload is included as the last parameter to Contract Events when the event is known.

PROPERTIES
 <src>contractEventPayload.args⇒ Resultread-only
The parsed arguments passed to the event by emit.

 <src>contractEventPayload.eventName⇒ stringread-only
The event name.

 <src>contractEventPayload.eventSignature⇒ stringread-only
The event signature.

 <src>contractEventPayload.fragment⇒ EventFragmentread-only
The matching event.

 <src>contractEventPayload.log⇒ EventLogread-only
The log, with parsed properties.

 class ContractFactory
A ContractFactory is used to deploy a Contract to the blockchain.

PROPERTIES
 <src>contractFactory.bytecode⇒ stringread-only
The Contract deployment bytecode. Often called the initcode.

 <src>contractFactory.interface⇒ Interfaceread-only
The Contract Interface.

 <src>contractFactory.runner⇒ null | ContractRunnerread-only
The ContractRunner to deploy the Contract as.

CREATING INSTANCES
 <src>new ContractFactory(abi: Interface | InterfaceAbi, bytecode: BytesLike | { object: string }, runner?: null | ContractRunner)
Create a new ContractFactory with abi and bytecode, optionally connected to runner.

The bytecode may be the bytecode property within the standard Solidity JSON output.

METHODS
 <src>contractFactory.attach(target: string | Addressable)⇒ BaseContract & Omit< I, keyof<BaseContract> >
 <src>contractFactory.connect(runner: null | ContractRunner)⇒ ContractFactory < A, I >
Return a new ContractFactory with the same ABI and bytecode, but connected to runner.

 <src>contractFactory.deploy(args: ContractMethodArgs< A >)⇒ Promise< BaseContract & { deploymentTransaction: ContractTransactionResponse } & Omit< I, keyof<BaseContract> > >
Resolves to the Contract deployed by passing args into the constructor.

This will resolve to the Contract before it has been deployed to the network, so the baseContract.waitForDeployment should be used before sending any transactions to it.

 <src>contractFactory.getDeployTransaction(args: ContractMethodArgs< A >)⇒ Promise< ContractDeployTransaction >
Resolves to the transaction to deploy the contract, passing args into the constructor.

STATIC METHODS
 <src>ContractFactory.fromSolidity(output: any, runner?: ContractRunner)⇒ ContractFactory < A, I >
Create a new ContractFactory from the standard Solidity JSON output.

 interface ContractInterface
A Contract with no method constraints.

 interface ContractMethod
inherits from BaseContractMethod
A contract method on a Contract.

 interface ContractTransaction
inherits from PreparedTransactionRequest
When populating a transaction this type is returned.

PROPERTIES
 <src>contractTransaction.data⇒ string
The transaction data.

 <src>contractTransaction.from⇒ string
The from address, if any.

 <src>contractTransaction.to⇒ string
The target address.

 class ContractTransactionReceipt
inherits from TransactionReceipt, TransactionReceiptParams
A ContractTransactionReceipt includes the parsed logs from a TransactionReceipt.

PROPERTIES
 <src>contractTransactionReceipt.logs⇒ Array< EventLog | Log >read-only
The parsed logs for any Log which has a matching event in the Contract ABI.

 class ContractTransactionResponse
inherits from TransactionResponse, TransactionResponseParams
A ContractTransactionResponse will return a ContractTransactionReceipt when waited on.

METHODS
 <src>contractTransactionResponse.wait(confirms?: number, timeout?: number)⇒ Promise< null | ContractTransactionReceipt >
Resolves once this transaction has been mined and has confirms blocks including it (default: 1) with an optional timeout.

This can resolve to null only if confirms is 0 and the transaction has not been mined, otherwise this will wait until enough confirmations have completed.

 class ContractUnknownEventPayload
inherits from EventPayload
A ContractUnknownEventPayload is included as the last parameter to Contract Events when the event does not match any events in the ABI.

PROPERTIES
 <src>contractUnknownEventPayload.log⇒ Logread-only
The log with no matching events.

CREATING INSTANCES
 <src>new ContractUnknownEventPayload(contract: BaseContract, listener: null | Listener, filter: ContractEventName, log: Log)
METHODS
 <src>contractUnknownEventPayload.getBlock()⇒ Promise< Block >
Resolves to the block the event occured in.

 <src>contractUnknownEventPayload.getTransaction()⇒ Promise< TransactionResponse >
Resolves to the transaction the event occured in.

 <src>contractUnknownEventPayload.getTransactionReceipt()⇒ Promise< TransactionReceipt >
Resolves to the transaction receipt the event occured in.

 interface DeferredTopicFilter
When creating a filter using the contract.filters, this is returned.

PROPERTIES
 <src>deferredTopicFilter.fragment⇒ EventFragment
METHODS
 <src>deferredTopicFilter.getTopicFilter()⇒ Promise< TopicFilter >
 class EventLog
inherits from Log, LogParams
An EventLog contains additional properties parsed from the Log.

PROPERTIES
 <src>eventLog.args⇒ Resultread-only
The parsed arguments passed to the event by emit.

 <src>eventLog.eventName⇒ stringread-only
The name of the event.

 <src>eventLog.eventSignature⇒ stringread-only
The signature of the event.

 <src>eventLog.fragment⇒ EventFragmentread-only
The matching event.

 <src>eventLog.interface⇒ Interfaceread-only
The Contract Interface.

 interface Overrides
The overrides for a contract transaction.

 class UndecodedEventLog
inherits from Log, LogParams
An EventLog contains additional properties parsed from the Log.

PROPERTIES
 <src>undecodedEventLog.error⇒ Errorread-only
The error encounted when trying to decode the log.

 interface WrappedFallback
A Fallback or Receive function on a Contract.

METHODS
 <src>wrappedFallback.estimateGas(overrides?: Omit< TransactionRequest, "to" >)⇒ Promise< bigint >
Estimate the gas to send a transaction to the contract fallback.

For non-receive fallback, data may be overridden.

 <src>wrappedFallback.populateTransaction(overrides?: Omit< TransactionRequest, "to" >)⇒ Promise< ContractTransaction >
Returns a populated transaction that can be used to perform the fallback method.

For non-receive fallback, data may be overridden.

 <src>wrappedFallback.send(overrides?: Omit< TransactionRequest, "to" >)⇒ Promise< ContractTransactionResponse >
Send a transaction to the contract fallback.

For non-receive fallback, data may be overridden.

 <src>wrappedFallback.staticCall(overrides?: Omit< TransactionRequest, "to" >)⇒ Promise< string >
Call the contract fallback and return the result.

For non-receive fallback, data may be overridden.

 Cryptographic Functions
A fundamental building block of Ethereum is the underlying cryptographic primitives.

FUNCTIONS
 <src>lock()⇒ void
Once called, prevents any future change to the underlying cryptographic primitives using the .register feature for hooks.

 Hash Functions
Cryptographic hashing functions

FUNCTIONS
 <src>keccak256(data: BytesLike)⇒ DataHexstring
Compute the cryptographic KECCAK256 hash of data.

The data must be a data representation, to compute the hash of UTF-8 data use the id function.

keccak256("0x")
// '0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470'

keccak256("0x1337")
// '0x2636a8beb2c41b8ccafa9a55a5a5e333892a83b491df3a67d2768946a9f9c6dc'

keccak256(new Uint8Array([ 0x13, 0x37 ]))
// '0x2636a8beb2c41b8ccafa9a55a5a5e333892a83b491df3a67d2768946a9f9c6dc'

// Strings are assumed to be DataHexString, otherwise it will
// throw. To hash UTF-8 data, see the note above.
keccak256("Hello World")
// Error("invalid BytesLike value", {
//   code: "INVALID_ARGUMENT"
//   argument: "data"
//   value: "Hello World"
//   shortMessage: "invalid BytesLike value"
// })
 <src>ripemd160(data: BytesLike)⇒ DataHexstring
Compute the cryptographic RIPEMD-160 hash of data.

ripemd160("0x")
// '0x9c1185a5c5e9fc54612808977ee8f548b2258d31'

ripemd160("0x1337")
// '0x224d2bd5251d8f9faa114eb0826e371d1236fda1'

ripemd160(new Uint8Array([ 0x13, 0x37 ]))
// '0x224d2bd5251d8f9faa114eb0826e371d1236fda1'
 <src>sha256(data: BytesLike)⇒ DataHexstring
Compute the cryptographic SHA2-256 hash of data.

sha256("0x")
// '0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'

sha256("0x1337")
// '0x158760c856e5ea1ba97e2e2a456736c4bf30d964559afa6d748cf05694a636ff'

sha256(new Uint8Array([ 0x13, 0x37 ]))
// '0x158760c856e5ea1ba97e2e2a456736c4bf30d964559afa6d748cf05694a636ff'
 <src>sha512(data: BytesLike)⇒ DataHexstring
Compute the cryptographic SHA2-512 hash of data.

sha512("0x")
// '0xcf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e'

sha512("0x1337")
// '0x55ccb35e52b39adac42b68304bf33ff7ecb854f09b2e761e234061482e98e45b4e68de2756bcc7b7099d7dd178f04dafa229d403b90bf8884eedea3806d4642b'

sha512(new Uint8Array([ 0x13, 0x37 ]))
// '0x55ccb35e52b39adac42b68304bf33ff7ecb854f09b2e761e234061482e98e45b4e68de2756bcc7b7099d7dd178f04dafa229d403b90bf8884eedea3806d4642b'
 HMAC
An HMAC enables verification that a given key was used to authenticate a payload.

See: link-wiki-hmac

FUNCTIONS
 <src>computeHmac(algorithm: "sha256" | "sha512", key: BytesLike, data: BytesLike)⇒ string
Return the HMAC for data using the key key with the underlying algo used for compression.

key = id("some-secret")

// Compute the HMAC
computeHmac("sha256", key, "0x1337")
// '0xbc985612171f71b89c7561c593f2cea20038d3f38f710b2516e405085d7c0c79'

// To compute the HMAC of UTF-8 data, the data must be
// converted to UTF-8 bytes
computeHmac("sha256", key, toUtf8Bytes("Hello World"))
// '0xd0404ef8fae0d7f18a54a0ddfad8b81afa9e4cdab872a1dc36628c4397fd8201'
 Passwords
A Password-Based Key-Derivation Function is designed to create a sequence of bytes suitible as a key from a human-rememberable password.

TYPES
 <src>ProgressCallback⇒ (percent: number) => void
A callback during long-running operations to update any UI or provide programatic access to the progress.

The percent is a value between 0 and 1.

FUNCTIONS
 <src>pbkdf2(password: BytesLike, salt: BytesLike, iterations: number, keylen: number, algo: "sha256" | "sha512")⇒ string
Return the PBKDF2 for keylen bytes for password using the salt and using iterations of algo.

This PBKDF is outdated and should not be used in new projects, but is required to decrypt older files.

// The password must be converted to bytes, and it is generally
// best practices to ensure the string has been normalized. Many
// formats explicitly indicate the normalization form to use.
password = "hello"
passwordBytes = toUtf8Bytes(password, "NFKC")

salt = id("some-salt")

// Compute the PBKDF2
pbkdf2(passwordBytes, salt, 1024, 16, "sha256")
// '0x226addf5b6d87544337e9733b99ceb9d'
 <src>scrypt(passwd: BytesLike, salt: BytesLike, N: number, r: number, p: number, dkLen: number, progress?: ProgressCallback)⇒ Promise< string >
The scrypt PBKDF uses a memory and cpu hard method of derivation to increase the resource cost to brute-force a password for a given key.

This means this algorithm is intentionally slow, and can be tuned to become slower. As computation and memory speed improve over time, increasing the difficulty maintains the cost of an attacker.

For example, if a target time of 5 seconds is used, a legitimate user which knows their password requires only 5 seconds to unlock their account. A 6 character password has 68 billion possibilities, which would require an attacker to invest over 10,000 years of CPU time. This is of course a crude example (as password generally aren't random), but demonstrates to value of imposing large costs to decryption.

For this reason, if building a UI which involved decrypting or encrypting datsa using scrypt, it is recommended to use a ProgressCallback (as event short periods can seem lik an eternity if the UI freezes). Including the phrase "decrypting" in the UI can also help, assuring the user their waiting is for a good reason.

// The password must be converted to bytes, and it is generally
// best practices to ensure the string has been normalized. Many
// formats explicitly indicate the normalization form to use.
password = "hello"
passwordBytes = toUtf8Bytes(password, "NFKC")

salt = id("some-salt")

// Compute the scrypt
scrypt(passwordBytes, salt, 1024, 8, 1, 16)
// Promise<'0x3982633256a26ab2e62efa0621d1a5c0'>
 <src>scryptSync(passwd: BytesLike, salt: BytesLike, N: number, r: number, p: number, dkLen: number)⇒ string
Provides a synchronous variant of scrypt.

This will completely lock up and freeze the UI in a browser and will prevent any event loop from progressing. For this reason, it is preferred to use the async variant.

// The password must be converted to bytes, and it is generally
// best practices to ensure the string has been normalized. Many
// formats explicitly indicate the normalization form to use.
password = "hello"
passwordBytes = toUtf8Bytes(password, "NFKC")

salt = id("some-salt")

// Compute the scrypt
scryptSync(passwordBytes, salt, 1024, 8, 1, 16)
// '0x3982633256a26ab2e62efa0621d1a5c0'
 Random Values
A Cryptographically Secure Random Value is one that has been generated with additional care take to prevent side-channels from allowing others to detect it and prevent others from through coincidence generate the same values.

FUNCTIONS
 <src>randomBytes(length: number)⇒ Uint8Array
Return length bytes of cryptographically secure random data.

randomBytes(8)
// Uint8Array(8) [
//    73,  97,  16, 177,
//   149, 127, 215,  33
// ]
 Signing
Add details about signing here.

TYPES
 <src>SignatureLike⇒ Signature | string | { r: string , s: string , v: BigNumberish , yParity?: 0 | 1 , yParityAndS?: string } | { r: string , s?: string , v?: number , yParity?: 0 | 1 , yParityAndS: string } | { r: string , s: string , v?: BigNumberish , yParity: 0 | 1 , yParityAndS?: string }
A SignatureLike

 class Signature
A Signature @TODO

PROPERTIES
 <src>signature._s⇒ stringread-only
Return the s value, unchecked for EIP-2 compliance.

This should generally not be used and is for situations where a non-canonical S value might be relevant, such as Frontier blocks that were mined prior to EIP-2 or invalid Authorization List signatures.

 <src>signature.compactSerialized⇒ stringread-only
The EIP-2098 compact representation.

 <src>signature.legacyChainId⇒ null | bigintread-only
The chain ID for EIP-155 legacy transactions. For non-legacy transactions, this value is null.

 <src>signature.networkV⇒ null | bigintread-only
The EIP-155 v for legacy transactions. For non-legacy transactions, this value is null.

 <src>signature.r⇒ string
The r value for a signature.

This represents the x coordinate of a "reference" or challenge point, from which the y can be computed.

 <src>signature.s⇒ string
The s value for a signature.

 <src>signature.serialized⇒ stringread-only
The serialized representation.

 <src>signature.v⇒ 27 | 28
The v value for a signature.

Since a given x value for r has two possible values for its correspondin y, the v indicates which of the two y values to use.

It is normalized to the values 27 or 28 for legacy purposes.

 <src>signature.yParity⇒ 0 | 1read-only
The yParity for the signature.

See v for more details on how this value is used.

 <src>signature.yParityAndS⇒ stringread-only
The EIP-2098 compact representation of the yParity and s compacted into a single bytes32.

CREATING INSTANCES
 <src>Signature.from(sig?: SignatureLike)⇒ Signature
Creates a new Signature.

If no sig is provided, a new Signature is created with default values.

If sig is a string, it is parsed.

METHODS
 <src>signature.clone()⇒ Signature
Returns a new identical Signature.

 <src>signature.getCanonical()⇒ Signature
Returns the canonical signature.

This is only necessary when dealing with legacy transaction which did not enforce canonical S values (i.e. EIP-155. Most developers should never require this.

 <src>signature.inspect()⇒ string
 <src>signature.isValid()⇒ boolean
Returns true if the Signature is valid for EIP-155 signatures.

 <src>signature.toJSON()⇒ any
Returns a representation that is compatible with JSON.stringify.

 <src>signature.toString()⇒ string
STATIC METHODS
 <src>Signature.getChainId(v: BigNumberish)⇒ bigint
Compute the chain ID from the v in a legacy EIP-155 transactions.

Signature.getChainId(45)
// 5n

Signature.getChainId(46)
// 5n
 <src>Signature.getChainIdV(chainId: BigNumberish, v: 27 | 28)⇒ bigint
Compute the v for a chain ID for a legacy EIP-155 transactions.

Legacy transactions which use EIP-155 hijack the v property to include the chain ID.

Signature.getChainIdV(5, 27)
// 45n

Signature.getChainIdV(5, 28)
// 46n
 <src>Signature.getNormalizedV(v: BigNumberish)⇒ 27 | 28
Compute the normalized legacy transaction v from a yParirty, a legacy transaction v or a legacy EIP-155 transaction.

// The values 0 and 1 imply v is actually yParity
Signature.getNormalizedV(0)
// 27

// Legacy non-EIP-1559 transaction (i.e. 27 or 28)
Signature.getNormalizedV(27)
// 27

// Legacy EIP-155 transaction (i.e. >= 35)
Signature.getNormalizedV(46)
// 28

// Invalid values throw
Signature.getNormalizedV(5)
// Error("invalid v", {
//   code: "INVALID_ARGUMENT"
//   argument: "v"
//   value: 5
//   shortMessage: "invalid v"
// })
 class SigningKey
A SigningKey provides high-level access to the elliptic curve cryptography (ECC) operations and key management.

PROPERTIES
 <src>signingKey.compressedPublicKey⇒ stringread-only
The compressed public key.

This will always begin with either the prefix 0x02 or 0x03 and be 68 characters long (the 0x prefix and 33 hexadecimal nibbles)

 <src>signingKey.privateKey⇒ stringread-only
The private key.

 <src>signingKey.publicKey⇒ stringread-only
The uncompressed public key.

This will always begin with the prefix 0x04 and be 132 characters long (the 0x prefix and 130 hexadecimal nibbles).

CREATING INSTANCES
 <src>new SigningKey(privateKey: BytesLike)
Creates a new SigningKey for privateKey.

METHODS
 <src>signingKey.computeSharedSecret(other: BytesLike)⇒ string
Returns the ECDH shared secret between this private key and the other key.

The other key may be any type of key, a raw public key, a compressed/uncompressed pubic key or aprivate key.

Best practice is usually to use a cryptographic hash on the returned value before using it as a symetric secret.

sign1 = new SigningKey(id("some-secret-1"))
sign2 = new SigningKey(id("some-secret-2"))

// Notice that privA.computeSharedSecret(pubB)...
sign1.computeSharedSecret(sign2.publicKey)
// '0x04b5bc2a5428042331a4c70da8f090d5552bdb35bc08a00ea8ed0a9b6d8737b8b7ea016b268d7cb9f02e11736b82b129ea3f37a8fdc6a7b0e9f5cdde4105ceb0de'

// ...is equal to privB.computeSharedSecret(pubA).
sign2.computeSharedSecret(sign1.publicKey)
// '0x04b5bc2a5428042331a4c70da8f090d5552bdb35bc08a00ea8ed0a9b6d8737b8b7ea016b268d7cb9f02e11736b82b129ea3f37a8fdc6a7b0e9f5cdde4105ceb0de'
 <src>signingKey.sign(digest: BytesLike)⇒ Signature
Return the signature of the signed digest.

STATIC METHODS
 <src>SigningKey.addPoints(p0: BytesLike, p1: BytesLike, compressed?: boolean)⇒ string
Returns the point resulting from adding the ellipic curve points p0 and p1.

This is not a common function most developers should require, but can be useful for certain privacy-specific techniques.

For example, it is used by HDNodeWallet to compute child addresses from parent public keys and chain codes.

 <src>SigningKey.computePublicKey(key: BytesLike, compressed?: boolean)⇒ string
Compute the public key for key, optionally compressed.

The key may be any type of key, a raw public key, a compressed/uncompressed public key or private key.

sign = new SigningKey(id("some-secret"));

// Compute the uncompressed public key for a private key
SigningKey.computePublicKey(sign.privateKey)
// '0x04925bec9818e11ac806bf8b142a7965ac9231aaa9d23f256795d63b1d8d7f203f7481609b6a6964a0f5b459585e9d18a9ec9070d0baf24689138868811c974c96'

// Compute the compressed public key for a private key
SigningKey.computePublicKey(sign.privateKey, true)
// '0x02925bec9818e11ac806bf8b142a7965ac9231aaa9d23f256795d63b1d8d7f203f'

// Compute the uncompressed public key
SigningKey.computePublicKey(sign.publicKey, false);
// '0x04925bec9818e11ac806bf8b142a7965ac9231aaa9d23f256795d63b1d8d7f203f7481609b6a6964a0f5b459585e9d18a9ec9070d0baf24689138868811c974c96'

// Compute the Compressed a public key
SigningKey.computePublicKey(sign.publicKey, true);
// '0x02925bec9818e11ac806bf8b142a7965ac9231aaa9d23f256795d63b1d8d7f203f'
 <src>SigningKey.recoverPublicKey(digest: BytesLike, signature: SignatureLike)⇒ string
Returns the public key for the private key which produced the signature for the given digest.

key = new SigningKey(id("some-secret"))
digest = id("hello world")
sig = key.sign(digest)

// Notice the signer public key...
key.publicKey
// '0x04925bec9818e11ac806bf8b142a7965ac9231aaa9d23f256795d63b1d8d7f203f7481609b6a6964a0f5b459585e9d18a9ec9070d0baf24689138868811c974c96'

// ...is equal to the recovered public key
SigningKey.recoverPublicKey(digest, sig)
// '0x04925bec9818e11ac806bf8b142a7965ac9231aaa9d23f256795d63b1d8d7f203f7481609b6a6964a0f5b459585e9d18a9ec9070d0baf24689138868811c974c96'
 Hashing Utilities
Utilities for common tasks involving hashing. Also see cryptographic hashing.

FUNCTIONS
 <src>dnsEncode(name: string, maxLength?: number)⇒ string
Returns the DNS encoded name.

This is used for various parts of ENS name resolution, such as the wildcard resolution.

 <src>ensNormalize(name: string)⇒ string
Returns the ENS name normalized.

 <src>hashAuthorization(auth: AuthorizationRequest)⇒ string
Computes the EIP-7702 authorization digest to sign.

 <src>hashMessage(message: Uint8Array | string)⇒ string
Computes the EIP-191 personal-sign message digest to sign.

This prefixes the message with MessagePrefix and the decimal length of message and computes the keccak256 digest.

If message is a string, it is converted to its UTF-8 bytes first. To compute the digest of a DataHexString, it must be converted to bytes.

hashMessage("Hello World")
// '0xa1de988600a42c4b4ab089b619297c17d53cffae5d5120d82d8a92d0bb3b78f2'

// Hashes the SIX (6) string characters, i.e.
// [ "0", "x", "4", "2", "4", "3" ]
hashMessage("0x4243")
// '0x6d91b221f765224b256762dcba32d62209cf78e9bebb0a1b758ca26c76db3af4'

// Hashes the TWO (2) bytes [ 0x42, 0x43 ]...
hashMessage(getBytes("0x4243"))
// '0x0d3abc18ec299cf9b42ba439ac6f7e3e6ec9f5c048943704e30fc2d9c7981438'

// ...which is equal to using data
hashMessage(new Uint8Array([ 0x42, 0x43 ]))
// '0x0d3abc18ec299cf9b42ba439ac6f7e3e6ec9f5c048943704e30fc2d9c7981438'
 <src>id(value: string)⇒ string
A simple hashing function which operates on UTF-8 strings to compute an 32-byte identifier.

This simply computes the UTF-8 bytes and computes the keccak256.

id("hello world")
// '0x47173285a8d7341e5e972fc677286384f802f8ef42a5ec5f03bbfa254cb01fad'
 <src>isValidName(name: string)⇒ boolean
Returns true if name is a valid ENS name.

 <src>namehash(name: string)⇒ string
Returns the namehash for name.

 <src>solidityPacked(types: ReadonlyArray< string >, values: ReadonlyArray< any >)⇒ string
Computes the Non-Standard Packed Mode representation of values respectively to their types.

addr = "0x8ba1f109551bd432803012645ac136ddd64dba72"
solidityPacked([ "address", "uint" ], [ addr, 45 ]);
// '0x8ba1f109551bd432803012645ac136ddd64dba72000000000000000000000000000000000000000000000000000000000000002d'
 <src>solidityPackedKeccak256(types: ReadonlyArray< string >, values: ReadonlyArray< any >)⇒ string
Computes the Non-Standard Packed Mode keccak256 hash of values respectively to their types.

addr = "0x8ba1f109551bd432803012645ac136ddd64dba72"
solidityPackedKeccak256([ "address", "uint" ], [ addr, 45 ]);
// '0x9465ddbc845149cfc7046bee85c30fd1b52b4f87d9c03ca8a0bd046868763030'
 <src>solidityPackedSha256(types: ReadonlyArray< string >, values: ReadonlyArray< any >)⇒ string
Computes the Non-Standard Packed Mode sha256 hash of values respectively to their types.

addr = "0x8ba1f109551bd432803012645ac136ddd64dba72"
solidityPackedSha256([ "address", "uint" ], [ addr, 45 ]);
// '0xb9d5d16842f6832018ea7bd1aa6aef22049eb966a5fb915470e22dfc3e2f828f'
 <src>verifyAuthorization(auth: AuthorizationRequest, sig: SignatureLike)⇒ string
Return the address of the private key that produced the signature sig during signing for message.

 <src>verifyMessage(message: Uint8Array | string, sig: SignatureLike)⇒ string
Return the address of the private key that produced the signature sig during signing for message.

 <src>verifyTypedData(domain: TypedDataDomain, types: Record< string, Array< TypedDataField > >, value: Record< string, any >, signature: SignatureLike)⇒ string
Compute the address used to sign the typed data for the signature.

 interface AuthorizationRequest
PROPERTIES
 <src>authorizationRequest.address⇒ string | Addressable
 <src>authorizationRequest.chainId⇒ BigNumberish
 <src>authorizationRequest.nonce⇒ Numeric
 interface TypedDataDomain
The domain for an EIP-712 payload.

PROPERTIES
 <src>typedDataDomain.chainId⇒ null | BigNumberish
The chain ID of the signing domain.

 <src>typedDataDomain.name⇒ null | string
The human-readable name of the signing domain.

 <src>typedDataDomain.salt⇒ null | BytesLike
A salt used for purposes decided by the specific domain.

 <src>typedDataDomain.verifyingContract⇒ null | string
The the address of the contract that will verify the signature.

 <src>typedDataDomain.version⇒ null | string
The major version of the signing domain.

 class TypedDataEncoder
A TypedDataEncode prepares and encodes EIP-712 payloads for signed typed data.

This is useful for those that wish to compute various components of a typed data hash, primary types, or sub-components, but generally the higher level signer.signTypedData is more useful.

PROPERTIES
 <src>typedDataEncoder.primaryType⇒ stringread-only
The primary type for the structured types.

This is derived automatically from the types, since no recursion is possible, once the DAG for the types is consturcted internally, the primary type must be the only remaining type with no parent nodes.

 <src>typedDataEncoder.types⇒ Record< string, Array< TypedDataField > >read-only
The types.

CREATING INSTANCES
 <src>new TypedDataEncoder(types: Record< string, Array< TypedDataField > >)
Create a new TypedDataEncoder for types.

This performs all necessary checking that types are valid and do not violate the EIP-712 structural constraints as well as computes the primaryType.

 <src>TypedDataEncoder.from(types: Record< string, Array< TypedDataField > >)⇒ TypedDataEncoder
Create a new TypedDataEncoder for types.

METHODS
 <src>typedDataEncoder.encode(value: Record< string, any >)⇒ string
Return the fulled encoded value for the types.

 <src>typedDataEncoder.encodeData(type: string, value: any)⇒ string
Return the encoded value for the type.

 <src>typedDataEncoder.encodeType(name: string)⇒ string
Return the full type for name.

 <src>typedDataEncoder.getEncoder(type: string)⇒ (value: any) => string
Returnthe encoder for the specific type.

 <src>typedDataEncoder.hash(value: Record< string, any >)⇒ string
Return the hash of the fully encoded value for the types.

 <src>typedDataEncoder.hashStruct(name: string, value: Record< string, any >)⇒ string
Returns the hash of value for the type of name.

 <src>typedDataEncoder.visit(value: Record< string, any >, callback: (type: string, data: any) => any)⇒ any
Call calback for each value in value, passing the type and component within value.

This is useful for replacing addresses or other transformation that may be desired on each component, based on its type.

STATIC METHODS
 <src>TypedDataEncoder.encode(domain: TypedDataDomain, types: Record< string, Array< TypedDataField > >, value: Record< string, any >)⇒ string
Return the fully encoded EIP-712 value for types with domain.

 <src>TypedDataEncoder.getPayload(domain: TypedDataDomain, types: Record< string, Array< TypedDataField > >, value: Record< string, any >)⇒ any
Returns the JSON-encoded payload expected by nodes which implement the JSON-RPC EIP-712 method.

 <src>TypedDataEncoder.getPrimaryType(types: Record< string, Array< TypedDataField > >)⇒ string
Return the primary type for types.

 <src>TypedDataEncoder.hash(domain: TypedDataDomain, types: Record< string, Array< TypedDataField > >, value: Record< string, any >)⇒ string
Return the hash of the fully encoded EIP-712 value for types with domain.

 <src>TypedDataEncoder.hashDomain(domain: TypedDataDomain)⇒ string
Return the domain hash for domain.

 <src>TypedDataEncoder.hashStruct(name: string, types: Record< string, Array< TypedDataField > >, value: Record< string, any >)⇒ string
Return the hashed struct for value using types and name.

 <src>TypedDataEncoder.resolveNames(domain: TypedDataDomain, types: Record< string, Array< TypedDataField > >, value: Record< string, any >, resolveName: (name: string) => Promise< string >)⇒ Promise< { domain: TypedDataDomain , value: any } >
Resolves to the value from resolving all addresses in value for types and the domain.

 interface TypedDataField
A specific field of a structured EIP-712 type.

PROPERTIES
 <src>typedDataField.name⇒ string
The field name.

 <src>typedDataField.type⇒ string
The type of the field.

 Providers
A Provider provides a connection to the blockchain, whch can be used to query its current state, simulate execution and send transactions to update the state.

It is one of the most fundamental components of interacting with a blockchain application, and there are many ways to connect, such as over HTTP, WebSockets or injected providers such as MetaMask.

TYPES
 <src>BlockTag⇒ BigNumberish | string
A BlockTag specifies a specific block.

numeric value - specifies the block height, where the genesis block is block 0; many operations accept a negative value which indicates the block number should be deducted from the most recent block. A numeric value may be a number, bigint, or a decimal of hex string.

blockhash - specifies a specific block by its blockhash; this allows potentially orphaned blocks to be specifed, without ambiguity, but many backends do not support this for some operations.

 <src>BrowserProviderOptions⇒ { cacheTimeout?: number , polling?: boolean , pollingInterval?: number , providerInfo?: Eip6963ProviderInfo , staticNetwork?: null | boolean | Network }
 <src>DebugEventBrowserProvider⇒ { action: "sendEip1193Payload" , payload: { method: string , params: Array< any > } } | { action: "receiveEip1193Result" , result: any } | { action: "receiveEip1193Error" , error: Error }
The possible additional events dispatched when using the "debug" event on a BrowserProvider.

 <src>GasCostParameters⇒ { txAccessListAddress?: number , txAccessListStorageKey?: number , txBase?: number , txCreate?: number , txDataNonzero?: number , txDataZero?: number }
The gas cost parameters for a GasCostPlugin.

 <src>OrphanFilter⇒ { hash: string , number: number , orphan: "drop-block" } | { orphan: "drop-transaction" , other?: { blockHash: string , blockNumber: number , hash: string } , tx: { blockHash: string , blockNumber: number , hash: string } } | { orphan: "reorder-transaction" , other?: { blockHash: string , blockNumber: number , hash: string } , tx: { blockHash: string , blockNumber: number , hash: string } } | { log: { address: string , blockHash: string , blockNumber: number , data: string , index: number , topics: ReadonlyArray< string > , transactionHash: string } , orphan: "drop-log" }
An Orphan Filter allows detecting when an orphan block has resulted in dropping a block or transaction or has resulted in transactions changing order.

Not currently fully supported.

 <src>ProviderEvent⇒ string | Array< string | Array< string > > | EventFilter | OrphanFilter
A ProviderEvent provides the types of events that can be subscribed to on a Provider.

Each provider may include additional possible events it supports, but the most commonly supported are:

"block" - calls the listener with the current block number on each new block.

"error" - calls the listener on each async error that occurs during the event loop, with the error.

"debug" - calls the listener on debug events, which can be used to troubleshoot network errors, provider problems, etc.

transaction hash - calls the listener on each block after the transaction has been mined; generally .once is more appropriate for this event.

Array - calls the listener on each log that matches the filter.

EventFilter - calls the listener with each matching log

 <src>TopicFilter⇒ Array< null | string | Array< string > >
A TopicFilter provides a struture to define bloom-filter queries.

Each field that is null matches any value, a field that is a string must match exactly that value and array is effectively an OR-ed set, where any one of those values must match.

 <src>WebSocketCreator⇒ () => WebSocketLike
A function which can be used to re-create a WebSocket connection on disconnect.

FUNCTIONS
 <src>copyRequest(req: TransactionRequest)⇒ PreparedTransactionRequest
Returns a copy of req with all properties coerced to their strict types.

 <src>getDefaultProvider(network?: string | Networkish | WebSocketLike, options?: any)⇒ AbstractProvider
Returns a default provider for network.

If network is a WebSocketLike or string that begins with "ws:" or "wss:", a WebSocketProvider is returned backed by that WebSocket or URL.

If network is a string that begins with "HTTP:" or "HTTPS:", a JsonRpcProvider is returned connected to that URL.

Otherwise, a default provider is created backed by well-known public Web3 backends (such as INFURA) using community-provided API keys.

The options allows specifying custom API keys per backend (setting an API key to "-" will omit that provider) and options.exclusive can be set to either a backend name or and array of backend names, which will whitelist only those backends.

Current backend strings supported are:


"alchemy"
"ankr"
"cloudflare"
"chainstack"
"etherscan"
"infura"
"publicPolygon"
"quicknode"
// Connect to a local Geth node
provider = getDefaultProvider("http://localhost:8545/");

// Connect to Ethereum mainnet with any current and future
// third-party services available
provider = getDefaultProvider("mainnet");

// Connect to Polygon, but only allow Etherscan and
// INFURA and use "MY_API_KEY" in calls to Etherscan.
provider = getDefaultProvider("matic", {
  etherscan: "MY_API_KEY",
  exclusive: [ "etherscan", "infura" ]
});
 class Block
inherits from BlockParams
A Block represents the data associated with a full block on Ethereum.

PROPERTIES
 <src>block.baseFeePerGas⇒ null | bigintread-only
The base fee per gas that all transactions in this block were charged.

This adjusts after each block, depending on how congested the network is.

 <src>block.blobGasUsed⇒ null | bigintread-only
The total amount of blob gas consumed by the transactions within the block. See EIP-4844.

 <src>block.date⇒ null | Dateread-only
The Date this block was included at.

 <src>block.difficulty⇒ bigintread-only
The difficulty target.

On legacy networks, this is the proof-of-work target required for a block to meet the protocol rules to be included.

On modern networks, this is a random number arrived at using randao. @TODO: Find links?

 <src>block.excessBlobGas⇒ null | bigintread-only
The running total of blob gas consumed in excess of the target, prior to the block. See EIP-4844.

 <src>block.extraData⇒ stringread-only
Any extra data the validator wished to include.

 <src>block.gasLimit⇒ bigintread-only
The total gas limit for this block.

 <src>block.gasUsed⇒ bigintread-only
The total gas used in this block.

 <src>block.hash⇒ null | stringread-only
The block hash.

This hash includes all properties, so can be safely used to identify an exact set of block properties.

 <src>block.length⇒ numberread-only
The number of transactions in this block.

 <src>block.miner⇒ stringread-only
The miner coinbase address, wihch receives any subsidies for including this block.

 <src>block.nonce⇒ stringread-only
The nonce.

On legacy networks, this is the random number inserted which permitted the difficulty target to be reached.

 <src>block.number⇒ numberread-only
The block number, sometimes called the block height. This is a sequential number that is one higher than the parent block.

 <src>block.parentBeaconBlockRoot⇒ null | string
The hash tree root of the parent beacon block for the given execution block. See EIP-4788.

 <src>block.parentHash⇒ stringread-only
The block hash of the parent block.

 <src>block.prefetchedTransactions⇒ Array< TransactionResponse >read-only
Returns the complete transactions, in the order they were executed within the block.

This is only available for blocks which prefetched transactions, by passing true to prefetchTxs into provider.getBlock.

 <src>block.prevRandao⇒ null | stringread-only
The latest RANDAO mix of the post beacon state of the previous block.

 <src>block.provider⇒ Providerread-only
The provider connected to the block used to fetch additional details if necessary.

 <src>block.receiptsRoot⇒ null | stringread-only
The hash of the transaction receipts trie.

 <src>block.stateRoot⇒ null | stringread-only
The root hash for the global state after applying changes in this block.

 <src>block.timestamp⇒ numberread-only
The timestamp for this block, which is the number of seconds since epoch that this block was included.

 <src>block.transactions⇒ ReadonlyArray< string >read-only
Returns the list of transaction hashes, in the order they were executed within the block.

CREATING INSTANCES
 <src>new Block(block: BlockParams, provider: Provider)
Create a new Block object.

This should generally not be necessary as the unless implementing a low-level library.

METHODS
 <src>block.getPrefetchedTransaction(indexOrHash: number | string)⇒ TransactionResponse
If a Block was fetched with a request to include the transactions this will allow synchronous access to those transactions.

If the transactions were not prefetched, this will throw.

 <src>block.getTransaction(indexOrHash: number | string)⇒ Promise< TransactionResponse >
Get the transaction at indexe within this block.

 <src>block.isLondon()⇒ boolean
Returns true if this block is an EIP-2930 block.

 <src>block.isMined()⇒ boolean
Returns true if this block been mined. This provides a type guard for all properties on a MinedBlock.

 <src>block.toJSON()⇒ any
Returns a JSON-friendly value.

 interface BrowserDiscoverOptions
Specifies how EIP-6963 discovery should proceed.

See: BrowserProvider-discover

PROPERTIES
 <src>browserDiscoverOptions.anyProvider⇒ boolean
Return the first detected provider. Otherwise wait for timeout and allowing filtering before selecting the desired provider.

 <src>browserDiscoverOptions.filter⇒ (found: Array< Eip6963ProviderInfo >) => null | BrowserProvider | Eip6963ProviderInfo
Explicitly choose which provider to used once scanning is complete.

 <src>browserDiscoverOptions.provider⇒ Eip1193Provider
Override provider detection with this provider.

 <src>browserDiscoverOptions.timeout⇒ number
Duration to wait to detect providers. (default: 300ms)

 <src>browserDiscoverOptions.window⇒ any
Use the provided window context. Useful in non-standard environments or to hijack where a provider comes from.

 class BrowserProvider
A BrowserProvider is intended to wrap an injected provider which adheres to the EIP-1193 standard, which most (if not all) currently do.

PROPERTIES
 <src>browserProvider.providerInfo⇒ null | Eip6963ProviderInforead-only
CREATING INSTANCES
 <src>new BrowserProvider(ethereum: Eip1193Provider, network?: Networkish, options?: BrowserProviderOptions)
Connect to the ethereum provider, optionally forcing the network.

METHODS
 <src>browserProvider._send(payload: JsonRpcPayload | Array< JsonRpcPayload >)⇒ Promise< Array< JsonRpcResult | JsonRpcError > >
 <src>browserProvider.getRpcError(payload: JsonRpcPayload, error: JsonRpcError)⇒ Error
 <src>browserProvider.getSigner(address?: number | string)⇒ Promise< JsonRpcSigner >
 <src>browserProvider.hasSigner(address: number | string)⇒ Promise< boolean >
Resolves to true if the provider manages the address.

 <src>browserProvider.send(method: string, params: Array< any > | Record< string, any >)⇒ Promise< any >
STATIC METHODS
 <src>BrowserProvider.discover(options?: BrowserDiscoverOptions)⇒ Promise< null | BrowserProvider >
Discover and connect to a Provider in the Browser using the EIP-6963 discovery mechanism. If no providers are present, null is resolved.

 interface ContractRunner
A ContractRunner is a generic interface which defines an object capable of interacting with a Contract on the network.

The more operations supported, the more utility it is capable of.

The most common ContractRunners are Providers which enable read-only access and Signers which enable write-access.

PROPERTIES
 <src>contractRunner.call⇒ (tx: TransactionRequest) => Promise< string >
Required for pure, view or static calls to contracts.

 <src>contractRunner.estimateGas⇒ (tx: TransactionRequest) => Promise< bigint >
Required to estimate gas.

 <src>contractRunner.provider⇒ null | Provider
The provider used for necessary state querying operations.

This can also point to the ContractRunner itself, in the case of an AbstractProvider.

 <src>contractRunner.resolveName⇒ (name: string) => Promise< null | string >
Required to support ENS names

 <src>contractRunner.sendTransaction⇒ (tx: TransactionRequest) => Promise< TransactionResponse >
Required for state mutating calls

 interface Eip1193Provider
The interface to an EIP-1193 provider, which is a standard used by most injected providers, which the BrowserProvider accepts and exposes the API of.

METHODS
 <src>eip1193Provider.request(request: { method: string , params?: Array< any > | Record< string, any > })⇒ Promise< any >
See EIP-1193 for details on this method.

 interface Eip6963ProviderInfo
Provider info provided by the EIP-6963 discovery mechanism.

PROPERTIES
 <src>eip6963ProviderInfo.icon⇒ string
 <src>eip6963ProviderInfo.name⇒ string
 <src>eip6963ProviderInfo.rdns⇒ string
 <src>eip6963ProviderInfo.uuid⇒ string
 class EnsPlugin
inherits from NetworkPlugin
An EnsPlugin allows a Network to specify the ENS Registry Contract address and the target network to use when using that contract.

Various testnets have their own instance of the contract to use, but in general, the mainnet instance supports multi-chain addresses and should be used.

PROPERTIES
 <src>ensPlugin.address⇒ stringread-only
The ENS Registrty Contract address.

 <src>ensPlugin.targetNetwork⇒ numberread-only
The chain ID that the ENS contract lives on.

CREATING INSTANCES
 <src>new EnsPlugin(address?: null | string, targetNetwork?: null | number)
Creates a new EnsPlugin connected to address on the targetNetwork. The default ENS address and mainnet is used if unspecified.

 interface EventFilter
An EventFilter allows efficiently filtering logs (also known as events) using bloom filters included within blocks.

PROPERTIES
 <src>eventFilter.address⇒ AddressLike | Array< AddressLike >
 <src>eventFilter.topics⇒ TopicFilter
 class FeeData
A FeeData wraps all the fee-related values associated with the network.

PROPERTIES
 <src>feeData.gasPrice⇒ null | bigintread-only
The gas price for legacy networks.

 <src>feeData.maxFeePerGas⇒ null | bigintread-only
The maximum fee to pay per gas.

The base fee per gas is defined by the network and based on congestion, increasing the cost during times of heavy load and lowering when less busy.

The actual fee per gas will be the base fee for the block and the priority fee, up to the max fee per gas.

This will be null on legacy networks (i.e. pre-EIP-1559)

 <src>feeData.maxPriorityFeePerGas⇒ null | bigintread-only
The additional amout to pay per gas to encourage a validator to include the transaction.

The purpose of this is to compensate the validator for the adjusted risk for including a given transaction.

This will be null on legacy networks (i.e. pre-EIP-1559)

CREATING INSTANCES
 <src>new FeeData(gasPrice?: null | bigint, maxFeePerGas?: null | bigint, maxPriorityFeePerGas?: null | bigint)
Creates a new FeeData for gasPrice, maxFeePerGas and maxPriorityFeePerGas.

METHODS
 <src>feeData.toJSON()⇒ any
Returns a JSON-friendly value.

 class FeeDataNetworkPlugin
inherits from NetworkPlugin
A FeeDataNetworkPlugin allows a network to provide and alternate means to specify its fee data.

For example, a network which does not support EIP-1559 may choose to use a Gas Station site to approximate the gas price.

PROPERTIES
 <src>feeDataNetworkPlugin.feeDataFunc⇒ (provider: Provider) => Promise< FeeData >read-only
The fee data function provided to the constructor.

CREATING INSTANCES
 <src>new FeeDataNetworkPlugin(feeDataFunc: (provider: Provider) => Promise< FeeData >)
Creates a new FeeDataNetworkPlugin.

METHODS
 <src>feeDataNetworkPlugin.getFeeData(provider: Provider)⇒ Promise< FeeData >
Resolves to the fee data.

 class FetchUrlFeeDataNetworkPlugin
inherits from NetworkPlugin
PROPERTIES
 <src>fetchUrlFeeDataNetworkPlugin.processFunc⇒ (f: () => Promise< FeeData >, p: Provider, r: FetchRequest) => Promise< { gasPrice?: null | bigint , maxFeePerGas?: null | bigint , maxPriorityFeePerGas?: null | bigint } >read-only
The callback to use when computing the FeeData.

 <src>fetchUrlFeeDataNetworkPlugin.url⇒ stringread-only
The URL to initialize the FetchRequest with in processFunc.

CREATING INSTANCES
 <src>new FetchUrlFeeDataNetworkPlugin(url: string, processFunc: (f: () => Promise< FeeData >, p: Provider, r: FetchRequest) => Promise< { gasPrice?: null | bigint , maxFeePerGas?: null | bigint , maxPriorityFeePerGas?: null | bigint } >)
Creates a new FetchUrlFeeDataNetworkPlugin which will be used when computing the fee data for the network.

 interface Filter
inherits from EventFilter
A Filter allows searching a specific range of blocks for mathcing logs.

PROPERTIES
 <src>filter.fromBlock⇒ BlockTag
The start block for the filter (inclusive).

 <src>filter.toBlock⇒ BlockTag
The end block for the filter (inclusive).

 interface FilterByBlockHash
inherits from EventFilter
A FilterByBlockHash allows searching a specific block for mathcing logs.

PROPERTIES
 <src>filterByBlockHash.blockHash⇒ string
The blockhash of the specific block for the filter.

 class GasCostPlugin
inherits from NetworkPlugin
A GasCostPlugin allows a network to provide alternative values when computing the intrinsic gas required for a transaction.

PROPERTIES
 <src>gasCostPlugin.effectiveBlock⇒ numberread-only
The block number to treat these values as valid from.

This allows a hardfork to have updated values included as well as mulutiple hardforks to be supported.

 <src>gasCostPlugin.txAccessListAddress⇒ numberread-only
The fee per address in the EIP-2930 access list.

 <src>gasCostPlugin.txAccessListStorageKey⇒ numberread-only
The fee per storage key in the EIP-2930 access list.

 <src>gasCostPlugin.txBase⇒ numberread-only
The transactions base fee.

 <src>gasCostPlugin.txCreate⇒ numberread-only
The fee for creating a new account.

 <src>gasCostPlugin.txDataNonzero⇒ numberread-only
The fee per non-zero-byte in the data.

 <src>gasCostPlugin.txDataZero⇒ numberread-only
The fee per zero-byte in the data.

CREATING INSTANCES
 <src>new GasCostPlugin(effectiveBlock?: number, costs?: GasCostParameters)
Creates a new GasCostPlugin from effectiveBlock until the latest block or another GasCostPlugin supercedes that block number, with the associated costs.

 class IpcSocketProvider
inherits from SocketProvider, JsonRpcApiProvider
An IpcSocketProvider connects over an IPC socket on the host which provides fast access to the node, but requires the node and the script run on the same machine.

PROPERTIES
 <src>ipcSocketProvider.socket⇒ Socketread-only
The connected socket.

CREATING INSTANCES
 <src>new IpcSocketProvider(path: string, network?: Networkish, options?: JsonRpcApiProviderOptions)
 class Log
inherits from LogParams
A Log in Ethereum represents an event that has been included in a transaction using the LOG* opcodes, which are most commonly used by Solidity's emit for announcing events.

PROPERTIES
 <src>log.address⇒ stringread-only
The address of the contract that emitted this log.

 <src>log.blockHash⇒ stringread-only
The block hash of the block this log occurred in. Use the log.getBlock to get the Block.

 <src>log.blockNumber⇒ numberread-only
The block number of the block this log occurred in. It is preferred to use the block.hash when fetching the related Block, since in the case of an orphaned block, the block at that height may have changed.

 <src>log.data⇒ stringread-only
The data included in this log when it was emitted.

 <src>log.index⇒ numberread-only
The index within the block this log occurred at. This is generally not useful to developers, but can be used with the various roots to proof inclusion within a block.

 <src>log.provider⇒ Providerread-only
The provider connected to the log used to fetch additional details if necessary.

 <src>log.removed⇒ booleanread-only
If the Log represents a block that was removed due to an orphaned block, this will be true.

This can only happen within an orphan event listener.

 <src>log.topics⇒ ReadonlyArray< string >read-only
The indexed topics included in this log when it was emitted.

All topics are included in the bloom filters, so they can be efficiently filtered using the provider.getLogs method.

 <src>log.transactionHash⇒ stringread-only
The transaction hash of the transaction this log occurred in. Use the log.getTransaction to get the TransactionResponse.

 <src>log.transactionIndex⇒ numberread-only
The index within the transaction of this log.

METHODS
 <src>log.getBlock()⇒ Promise< Block >
Returns the block that this log occurred in.

 <src>log.getTransaction()⇒ Promise< TransactionResponse >
Returns the transaction that this log occurred in.

 <src>log.getTransactionReceipt()⇒ Promise< TransactionReceipt >
Returns the transaction receipt fot the transaction that this log occurred in.

 <src>log.toJSON()⇒ any
Returns a JSON-compatible object.

 interface MinedBlock
inherits from Block, BlockParams
An Interface to indicate a Block has been included in the blockchain. This asserts a Type Guard that necessary properties are non-null.

Before a block is included, it is a pending block.

PROPERTIES
 <src>minedBlock.date⇒ Dateread-only
The block date, created from the timestamp.

 <src>minedBlock.hash⇒ stringread-only
The block hash.

 <src>minedBlock.miner⇒ stringread-only
The miner of the block, also known as the author or block producer.

 <src>minedBlock.number⇒ numberread-only
The block number also known as the block height.

 <src>minedBlock.timestamp⇒ numberread-only
The block timestamp, in seconds from epoch.

 interface MinedTransactionResponse
inherits from TransactionResponse, TransactionResponseParams
A MinedTransactionResponse is an interface representing a transaction which has been mined and allows for a type guard for its property values being defined.

PROPERTIES
 <src>minedTransactionResponse.blockHash⇒ string
The block hash this transaction occurred in.

 <src>minedTransactionResponse.blockNumber⇒ number
The block number this transaction occurred in.

 <src>minedTransactionResponse.date⇒ Date
The date this transaction occurred on.

 class NetworkPlugin
A NetworkPlugin provides additional functionality on a Network.

PROPERTIES
 <src>networkPlugin.name⇒ stringread-only
The name of the plugin.

It is recommended to use reverse-domain-notation, which permits unique names with a known authority as well as hierarchal entries.

CREATING INSTANCES
 <src>new NetworkPlugin(name: string)
Creates a new NetworkPlugin.

METHODS
 <src>networkPlugin.clone()⇒ NetworkPlugin
Creates a copy of this plugin.

 class NonceManager
inherits from AbstractSigner, Signer
A NonceManager wraps another Signer and automatically manages the nonce, ensuring serialized and sequential nonces are used during transaction.

PROPERTIES
 <src>nonceManager.signer⇒ Signer
The Signer being managed.

CREATING INSTANCES
 <src>new NonceManager(signer: Signer)
Creates a new NonceManager to manage signer.

METHODS
 <src>nonceManager.increment()⇒ void
Manually increment the nonce. This may be useful when managng offline transactions.

 <src>nonceManager.reset()⇒ void
Resets the nonce, causing the NonceManager to reload the current nonce from the blockchain on the next transaction.

 interface PreparedTransactionRequest
A PreparedTransactionRequest is identical to a TransactionRequest except all the property types are strictly enforced.

PROPERTIES
 <src>preparedTransactionRequest.accessList⇒ AccessList
The EIP-2930 access list. Storage slots included in the access list are warmed by pre-loading them, so their initial cost to fetch is guaranteed, but then each additional access is cheaper.

 <src>preparedTransactionRequest.authorizationList⇒ Array< Authorization >
The EIP-7702 authorizations (if any).

 <src>preparedTransactionRequest.blockTag⇒ BlockTag
When using call or estimateGas, this allows a specific block to be queried. Many backends do not support this and when unsupported errors are silently squelched and "latest" is used.

 <src>preparedTransactionRequest.chainId⇒ bigint
The chain ID for the network this transaction is valid on.

 <src>preparedTransactionRequest.customData⇒ any
A custom object, which can be passed along for network-specific values.

 <src>preparedTransactionRequest.data⇒ string
The transaction data.

 <src>preparedTransactionRequest.enableCcipRead⇒ boolean
When using call, this enables CCIP-read, which permits the provider to be redirected to web-based content during execution, which is then further validated by the contract.

There are potential security implications allowing CCIP-read, as it could be used to expose the IP address or user activity during the fetch to unexpected parties.

 <src>preparedTransactionRequest.from⇒ AddressLike
The sender of the transaction.

 <src>preparedTransactionRequest.gasLimit⇒ bigint
The maximum amount of gas to allow this transaction to consume.

 <src>preparedTransactionRequest.gasPrice⇒ bigint
The gas price to use for legacy transactions or transactions on legacy networks.

Most of the time the max*FeePerGas is preferred.

 <src>preparedTransactionRequest.maxFeePerGas⇒ bigint
The EIP-1559 maximum total fee to pay per gas. The actual value used is protocol enforced to be the block's base fee.

 <src>preparedTransactionRequest.maxPriorityFeePerGas⇒ bigint
The EIP-1559 maximum priority fee to pay per gas.

 <src>preparedTransactionRequest.nonce⇒ number
The nonce of the transaction, used to prevent replay attacks.

 <src>preparedTransactionRequest.to⇒ AddressLike
The target of the transaction.

 <src>preparedTransactionRequest.type⇒ number
The transaction type.

 <src>preparedTransactionRequest.value⇒ bigint
The transaction value (in wei).

 interface Provider
inherits from ContractRunner, EventEmitterable, NameResolver
A Provider is the primary method to interact with the read-only content on Ethereum.

It allows access to details about accounts, blocks and transactions and the ability to query event logs and simulate contract execution.

Account data includes the balance, transaction count, code and state trie storage.

Simulating execution can be used to call, estimate gas and get transaction results.

The broadcastTransaction is the only method which allows updating the blockchain, but it is usually accessed by a Signer, since a private key must be used to sign the transaction before it can be broadcast.

PROPERTIES
 <src>provider.provider⇒ this
The provider iteself.

This is part of the necessary API for executing a contract, as it provides a common property on any ContractRunner that can be used to access the read-only portion of the runner.

METHODS
 <src>provider.broadcastTransaction(signedTx: string)⇒ Promise< TransactionResponse >
Broadcasts the signedTx to the network, adding it to the memory pool of any node for which the transaction meets the rebroadcast requirements.

 <src>provider.call(tx: TransactionRequest)⇒ Promise< string >
Simulate the execution of tx. If the call reverts, it will throw a CallExceptionError which includes the revert data.

 <src>provider.destroy()⇒ void
Shutdown any resources this provider is using. No additional calls should be made to this provider after calling this.

 <src>provider.estimateGas(tx: TransactionRequest)⇒ Promise< bigint >
Estimates the amount of gas required to execute tx.

 <src>provider.getBalance(address: AddressLike, blockTag?: BlockTag)⇒ Promise< bigint >
Get the account balance (in wei) of address. If blockTag is specified and the node supports archive access for that blockTag, the balance is as of that BlockTag.

 <src>provider.getBlock(blockHashOrBlockTag: BlockTag | string, prefetchTxs?: boolean)⇒ Promise< null | Block >
Resolves to the block for blockHashOrBlockTag.

If prefetchTxs, and the backend supports including transactions with block requests, all transactions will be included and the Block object will not need to make remote calls for getting transactions.

 <src>provider.getBlockNumber()⇒ Promise< number >
Get the current block number.

 <src>provider.getCode(address: AddressLike, blockTag?: BlockTag)⇒ Promise< string >
Get the bytecode for address.

 <src>provider.getFeeData()⇒ Promise< FeeData >
Get the best guess at the recommended FeeData.

 <src>provider.getLogs(filter: Filter | FilterByBlockHash)⇒ Promise< Array< Log > >
Resolves to the list of Logs that match filter

 <src>provider.getNetwork()⇒ Promise< Network >
Get the connected Network.

 <src>provider.getStorage(address: AddressLike, position: BigNumberish, blockTag?: BlockTag)⇒ Promise< string >
Get the storage slot value for address at slot position.

 <src>provider.getTransaction(hash: string)⇒ Promise< null | TransactionResponse >
Resolves to the transaction for hash.

If the transaction is unknown or on pruning nodes which discard old transactions this resolves to null.

 <src>provider.getTransactionCount(address: AddressLike, blockTag?: BlockTag)⇒ Promise< number >
Get the number of transactions ever sent for address, which is used as the nonce when sending a transaction. If blockTag is specified and the node supports archive access for that blockTag, the transaction count is as of that BlockTag.

 <src>provider.getTransactionReceipt(hash: string)⇒ Promise< null | TransactionReceipt >
Resolves to the transaction receipt for hash, if mined.

If the transaction has not been mined, is unknown or on pruning nodes which discard old transactions this resolves to null.

 <src>provider.getTransactionResult(hash: string)⇒ Promise< null | string >
Resolves to the result returned by the executions of hash.

This is only supported on nodes with archive access and with the necessary debug APIs enabled.

 <src>provider.lookupAddress(address: string)⇒ Promise< null | string >
Resolves to the ENS name associated for the address or null if the primary name is not configured.

Users must perform additional steps to configure a primary name, which is not currently common.

 <src>provider.resolveName(ensName: string)⇒ Promise< null | string >
Resolves to the address configured for the ensName or null if unconfigured.

 <src>provider.waitForBlock(blockTag?: BlockTag)⇒ Promise< Block >
Resolves to the block at blockTag once it has been mined.

This can be useful for waiting some number of blocks by using the currentBlockNumber + N.

 <src>provider.waitForTransaction(hash: string, confirms?: number, timeout?: number)⇒ Promise< null | TransactionReceipt >
Waits until the transaction hash is mined and has confirms confirmations.

 interface Signer
inherits from Addressable, ContractRunner, NameResolver
A Signer represents an account on the Ethereum Blockchain, and is most often backed by a private key represented by a mnemonic or residing on a Hardware Wallet.

The API remains abstract though, so that it can deal with more advanced exotic Signing entities, such as Smart Contract Wallets or Virtual Wallets (where the private key may not be known).

PROPERTIES
 <src>signer.provider⇒ null | Provider
The Provider attached to this Signer (if any).

METHODS
 <src>signer.authorize(authorization: AuthorizationRequest)⇒ Promise< Authorization >
Signs an authorization to be used in EIP-7702 transactions.

 <src>signer.call(tx: TransactionRequest)⇒ Promise< string >
Evaluates the tx by running it against the current Blockchain state. This cannot change state and has no cost in ether, as it is effectively simulating execution.

This can be used to have the Blockchain perform computations based on its state (e.g. running a Contract's getters) or to simulate the effect of a transaction before actually performing an operation.

 <src>signer.connect(provider: null | Provider)⇒ Signer
Returns a new instance of this Signer connected to provider or detached from any Provider if null.

 <src>signer.estimateGas(tx: TransactionRequest)⇒ Promise< bigint >
Estimates the required gas required to execute tx on the Blockchain. This will be the expected amount a transaction will require as its gasLimit to successfully run all the necessary computations and store the needed state that the transaction intends.

Keep in mind that this is best efforts, since the state of the Blockchain is in flux, which could affect transaction gas requirements.

 <src>signer.getAddress()⇒ Promise< string >
Get the address of the Signer.

 <src>signer.getNonce(blockTag?: BlockTag)⇒ Promise< number >
Gets the next nonce required for this Signer to send a transaction.

 <src>signer.populateAuthorization(auth: AuthorizationRequest)⇒ Promise< AuthorizationRequest >
Prepares an AuthorizationRequest for authorization by populating any missing properties:


resolves address (if an Addressable or ENS name)
populates nonce via signer.getNonce("pending")
populates chainId via signer.provider.getNetwork()
 <src>signer.populateCall(tx: TransactionRequest)⇒ Promise< TransactionLike < string > >
Prepares a {@link TransactionRequest} for calling:


resolves to and from addresses
if from is specified , check that it matches this Signer
 <src>signer.populateTransaction(tx: TransactionRequest)⇒ Promise< TransactionLike < string > >
Prepares a {@link TransactionRequest} for sending to the network by populating any missing properties:


resolves to and from addresses
if from is specified , check that it matches this Signer
populates nonce via signer.getNonce("pending")
populates gasLimit via signer.estimateGas(tx)
populates chainId via signer.provider.getNetwork()
populates type and relevant fee data for that type (gasPrice for legacy transactions, maxFeePerGas for EIP-1559, etc)
 <src>signer.resolveName(name: string)⇒ Promise< null | string >
Resolves an ENS Name to an address.

 <src>signer.sendTransaction(tx: TransactionRequest)⇒ Promise< TransactionResponse >
Sends tx to the Network. The signer.populateTransaction(tx) is called first to ensure all necessary properties for the transaction to be valid have been popualted first.

 <src>signer.signMessage(message: string | Uint8Array)⇒ Promise< string >
Signs an EIP-191 prefixed personal message.

If the message is a string, it is signed as UTF-8 encoded bytes. It is not interpretted as a BytesLike; so the string "0x1234" is signed as six characters, not two bytes.

To sign that example as two bytes, the Uint8Array should be used (i.e. new Uint8Array([ 0x12, 0x34 ])).

 <src>signer.signTransaction(tx: TransactionRequest)⇒ Promise< string >
Signs tx, returning the fully signed transaction. This does not populate any additional properties within the transaction.

 <src>signer.signTypedData(domain: TypedDataDomain, types: Record< string, Array< TypedDataField > >, value: Record< string, any >)⇒ Promise< string >
Signs the EIP-712 typed data.

 class TransactionReceipt
inherits from TransactionReceiptParams
A TransactionReceipt includes additional information about a transaction that is only available after it has been mined.

PROPERTIES
 <src>transactionReceipt.blobGasPrice⇒ null | bigintread-only
The price paid per BLOB in gas. See EIP-4844.

 <src>transactionReceipt.blobGasUsed⇒ null | bigintread-only
The gas used for BLObs. See EIP-4844.

 <src>transactionReceipt.blockHash⇒ stringread-only
The block hash of the Block this transaction was included in.

 <src>transactionReceipt.blockNumber⇒ numberread-only
The block number of the Block this transaction was included in.

 <src>transactionReceipt.contractAddress⇒ null | stringread-only
The address of the contract if the transaction was directly responsible for deploying one.

This is non-null only if the to is empty and the data was successfully executed as initcode.

 <src>transactionReceipt.cumulativeGasUsed⇒ bigintread-only
The amount of gas used by all transactions within the block for this and all transactions with a lower index.

This is generally not useful for developers but can be used to validate certain aspects of execution.

 <src>transactionReceipt.fee⇒ bigintread-only
The total fee for this transaction, in wei.

 <src>transactionReceipt.from⇒ stringread-only
The sender of the transaction.

 <src>transactionReceipt.gasPrice⇒ bigintread-only
The actual gas price used during execution.

Due to the complexity of EIP-1559 this value can only be caluclated after the transaction has been mined, snce the base fee is protocol-enforced.

 <src>transactionReceipt.gasUsed⇒ bigintread-only
The actual amount of gas used by this transaction.

When creating a transaction, the amount of gas that will be used can only be approximated, but the sender must pay the gas fee for the entire gas limit. After the transaction, the difference is refunded.

 <src>transactionReceipt.hash⇒ stringread-only
The transaction hash.

 <src>transactionReceipt.index⇒ numberread-only
The index of this transaction within the block transactions.

 <src>transactionReceipt.logs⇒ ReadonlyArray< Log >read-only
The logs for this transaction.

 <src>transactionReceipt.logsBloom⇒ stringread-only
The bloom filter bytes that represent all logs that occurred within this transaction. This is generally not useful for most developers, but can be used to validate the included logs.

 <src>transactionReceipt.provider⇒ Providerread-only
The provider connected to the log used to fetch additional details if necessary.

 <src>transactionReceipt.root⇒ null | stringread-only
The root hash of this transaction.

This is no present and was only included in pre-byzantium blocks, but could be used to validate certain parts of the receipt.

 <src>transactionReceipt.status⇒ null | numberread-only
The status of this transaction, indicating success (i.e. 1) or a revert (i.e. 0).

This is available in post-byzantium blocks, but some backends may backfill this value.

 <src>transactionReceipt.to⇒ null | stringread-only
The address the transaction was sent to.

 <src>transactionReceipt.type⇒ numberread-only
The EIP-2718 transaction type.

METHODS
 <src>transactionReceipt.confirmations()⇒ Promise< number >
Resolves to the number of confirmations this transaction has.

 <src>transactionReceipt.getBlock()⇒ Promise< Block >
Resolves to the block this transaction occurred in.

 <src>transactionReceipt.getResult()⇒ Promise< string >
Resolves to the return value of the execution of this transaction.

Support for this feature is limited, as it requires an archive node with the debug_ or trace_ API enabled.

 <src>transactionReceipt.getTransaction()⇒ Promise< TransactionResponse >
Resolves to the transaction this transaction occurred in.

 <src>transactionReceipt.toJSON()⇒ any
Returns a JSON-compatible representation.

 interface TransactionRequest
A TransactionRequest is a transactions with potentially various properties not defined, or with less strict types for its values.

This is used to pass to various operations, which will internally coerce any types and populate any necessary values.

PROPERTIES
 <src>transactionRequest.accessList⇒ null | AccessListish
The EIP-2930 access list. Storage slots included in the access list are warmed by pre-loading them, so their initial cost to fetch is guaranteed, but then each additional access is cheaper.

 <src>transactionRequest.authorizationList⇒ null | Array< AuthorizationLike >
The EIP-7702 authorizations (if any).

 <src>transactionRequest.blobs⇒ null | Array< BlobLike >
Any blobs to include in the transaction (see EIP-4844).

 <src>transactionRequest.blobVersionedHashes⇒ null | Array< string >
The blob versioned hashes (see EIP-4844).

 <src>transactionRequest.blobWrapperVersion⇒ null | number
The EIP-7594 BLOb Wrapper Version used for PeerDAS.

For networks that use EIP-7594, this property is required to serialize the sidecar correctly.

 <src>transactionRequest.blockTag⇒ BlockTag
When using call or estimateGas, this allows a specific block to be queried. Many backends do not support this and when unsupported errors are silently squelched and "latest" is used.

 <src>transactionRequest.chainId⇒ null | BigNumberish
The chain ID for the network this transaction is valid on.

 <src>transactionRequest.customData⇒ any
A custom object, which can be passed along for network-specific values.

 <src>transactionRequest.data⇒ null | string
The transaction data.

 <src>transactionRequest.enableCcipRead⇒ boolean
When using call, this enables CCIP-read, which permits the provider to be redirected to web-based content during execution, which is then further validated by the contract.

There are potential security implications allowing CCIP-read, as it could be used to expose the IP address or user activity during the fetch to unexpected parties.

 <src>transactionRequest.from⇒ null | AddressLike
The sender of the transaction.

 <src>transactionRequest.gasLimit⇒ null | BigNumberish
The maximum amount of gas to allow this transaction to consume.

 <src>transactionRequest.gasPrice⇒ null | BigNumberish
The gas price to use for legacy transactions or transactions on legacy networks.

Most of the time the max*FeePerGas is preferred.

 <src>transactionRequest.kzg⇒ null | KzgLibraryLike
An external library for computing the KZG commitments and proofs necessary for EIP-4844 transactions (see EIP-4844).

This is generally null, unless you are creating BLOb transactions.

 <src>transactionRequest.maxFeePerBlobGas⇒ null | BigNumberish
The maximum fee per blob gas (see EIP-4844).

 <src>transactionRequest.maxFeePerGas⇒ null | BigNumberish
The EIP-1559 maximum total fee to pay per gas. The actual value used is protocol enforced to be the block's base fee.

 <src>transactionRequest.maxPriorityFeePerGas⇒ null | BigNumberish
The EIP-1559 maximum priority fee to pay per gas.

 <src>transactionRequest.nonce⇒ null | number
The nonce of the transaction, used to prevent replay attacks.

 <src>transactionRequest.to⇒ null | AddressLike
The target of the transaction.

 <src>transactionRequest.type⇒ null | number
The transaction type.

 <src>transactionRequest.value⇒ null | BigNumberish
The transaction value (in wei).

 class TransactionResponse
inherits from TransactionResponseParams
A TransactionResponse includes all properties about a transaction that was sent to the network, which may or may not be included in a block.

The transactionResponse.isMined can be used to check if the transaction has been mined as well as type guard that the otherwise possibly null properties are defined.

PROPERTIES
 <src>transactionResponse.accessList⇒ null | AccessListread-only
The EIP-2930 access list for transaction types that support it, otherwise null.

 <src>transactionResponse.authorizationList⇒ null | Array< Authorization >read-only
The EIP-7702 authorizations (if any).

 <src>transactionResponse.blobVersionedHashes⇒ null | Array< string >read-only
The EIP-4844 BLOb versioned hashes.

 <src>transactionResponse.blockHash⇒ null | stringread-only
The blockHash of the block that this transaction was included in.

This is null for pending transactions.

 <src>transactionResponse.blockNumber⇒ null | numberread-only
The block number of the block that this transaction was included in.

This is null for pending transactions.

 <src>transactionResponse.chainId⇒ bigintread-only
The chain ID.

 <src>transactionResponse.data⇒ stringread-only
The data.

 <src>transactionResponse.from⇒ stringread-only
The sender of this transaction. It is implicitly computed from the transaction pre-image hash (as the digest) and the signature using ecrecover.

 <src>transactionResponse.gasLimit⇒ bigintread-only
The maximum units of gas this transaction can consume. If execution exceeds this, the entries transaction is reverted and the sender is charged for the full amount, despite not state changes being made.

 <src>transactionResponse.gasPrice⇒ bigintread-only
The gas price can have various values, depending on the network.

In modern networks, for transactions that are included this is the effective gas price (the fee per gas that was actually charged), while for transactions that have not been included yet is the maxFeePerGas.

For legacy transactions, or transactions on legacy networks, this is the fee that will be charged per unit of gas the transaction consumes.

 <src>transactionResponse.hash⇒ stringread-only
The transaction hash.

 <src>transactionResponse.index⇒ numberread-only
The index within the block that this transaction resides at.

 <src>transactionResponse.maxFeePerBlobGas⇒ null | bigintread-only
The EIP-4844 max fee per BLOb gas.

 <src>transactionResponse.maxFeePerGas⇒ null | bigintread-only
The maximum fee (per unit of gas) to allow this transaction to charge the sender.

 <src>transactionResponse.maxPriorityFeePerGas⇒ null | bigintread-only
The maximum priority fee (per unit of gas) to allow a validator to charge the sender. This is inclusive of the maxFeeFeePerGas.

 <src>transactionResponse.nonce⇒ numberread-only
The nonce, which is used to prevent replay attacks and offer a method to ensure transactions from a given sender are explicitly ordered.

When sending a transaction, this must be equal to the number of transactions ever sent by from.

 <src>transactionResponse.provider⇒ Providerread-only
The provider this is connected to, which will influence how its methods will resolve its async inspection methods.

 <src>transactionResponse.signature⇒ Signatureread-only
The signature.

 <src>transactionResponse.to⇒ null | stringread-only
The receiver of this transaction.

If null, then the transaction is an initcode transaction. This means the result of executing the data will be deployed as a new contract on chain (assuming it does not revert) and the address may be computed using getCreateAddress.

 <src>transactionResponse.type⇒ numberread-only
The EIP-2718 transaction envelope type. This is 0 for legacy transactions types.

 <src>transactionResponse.value⇒ bigintread-only
The value, in wei. Use formatEther to format this value as ether.

METHODS
 <src>transactionResponse.confirmations()⇒ Promise< number >
Resolve to the number of confirmations this transaction has.

 <src>transactionResponse.getBlock()⇒ Promise< null | Block >
Resolves to the Block that this transaction was included in.

This will return null if the transaction has not been included yet.

 <src>transactionResponse.getTransaction()⇒ Promise< null | TransactionResponse >
Resolves to this transaction being re-requested from the provider. This can be used if you have an unmined transaction and wish to get an up-to-date populated instance.

 <src>transactionResponse.isBerlin()⇒ boolean
Returns true if the transaction is a Berlin (i.e. type == 1) transaction. See EIP-2930.

This provides a Type Guard that this transaction will have the null-ness for hardfork-specific properties set correctly.

 <src>transactionResponse.isCancun()⇒ boolean
Returns true if hte transaction is a Cancun (i.e. type == 3) transaction. See EIP-4844.

 <src>transactionResponse.isLegacy()⇒ boolean
Returns true if the transaction is a legacy (i.e. type == 0) transaction.

This provides a Type Guard that this transaction will have the null-ness for hardfork-specific properties set correctly.

 <src>transactionResponse.isLondon()⇒ boolean
Returns true if the transaction is a London (i.e. type == 2) transaction. See EIP-1559.

This provides a Type Guard that this transaction will have the null-ness for hardfork-specific properties set correctly.

 <src>transactionResponse.isMined()⇒ boolean
Returns true if this transaction has been included.

This is effective only as of the time the TransactionResponse was instantiated. To get up-to-date information, use getTransaction.

This provides a Type Guard that this transaction will have non-null property values for properties that are null for unmined transactions.

 <src>transactionResponse.removedEvent()⇒ OrphanFilter
Returns a filter which can be used to listen for orphan events that evict this transaction.

 <src>transactionResponse.reorderedEvent(other?: TransactionResponse)⇒ OrphanFilter
Returns a filter which can be used to listen for orphan events that re-order this event against other.

 <src>transactionResponse.replaceableTransaction(startBlock: number)⇒ TransactionResponse
Returns a new TransactionResponse instance which has the ability to detect (and throw an error) if the transaction is replaced, which will begin scanning at startBlock.

This should generally not be used by developers and is intended primarily for internal use. Setting an incorrect startBlock can have devastating performance consequences if used incorrectly.

 <src>transactionResponse.toJSON()⇒ any
Returns a JSON-compatible representation of this transaction.

 <src>transactionResponse.wait(confirms?: number, timeout?: number)⇒ Promise< null | TransactionReceipt >
Resolves once this transaction has been mined and has confirms blocks including it (default: 1) with an optional timeout.

This can resolve to null only if confirms is 0 and the transaction has not been mined, otherwise this will wait until enough confirmations have completed.

 interface WebSocketLike
A generic interface to a Websocket-like object.

PROPERTIES
 <src>webSocketLike.onerror⇒ null | PAREN<(args: Array< any >) => any>
 <src>webSocketLike.onmessage⇒ null | PAREN<(args: Array< any >) => any>
 <src>webSocketLike.onopen⇒ null | PAREN<(args: Array< any >) => any>
 <src>webSocketLike.readyState⇒ number
METHODS
 <src>webSocketLike.close(code?: number, reason?: string)⇒ void
 <src>webSocketLike.send(payload: any)⇒ void
 class WebSocketProvider
inherits from SocketProvider, JsonRpcApiProvider
A JSON-RPC provider which is backed by a WebSocket.

WebSockets are often preferred because they retain a live connection to a server, which permits more instant access to events.

However, this incurs higher server infrasturture costs, so additional resources may be required to host your own WebSocket nodes and many third-party services charge additional fees for WebSocket endpoints.

PROPERTIES
 <src>webSocketProvider.websocket⇒ WebSocketLikeread-only
CREATING INSTANCES
 <src>new WebSocketProvider(url: string | WebSocketLike | WebSocketCreator, network?: Networkish, options?: JsonRpcApiProviderOptions)
 Networks
A Network encapsulates the various properties required to interact with a specific chain.

TYPES
 <src>Networkish⇒ Network | number | bigint | string | { chainId?: number , ensAddress?: string , ensNetwork?: number , name?: string }
A Networkish can be used to allude to a Network, by specifing:


a Network object
a well-known (or registered) network name
a well-known (or registered) chain ID
an object with sufficient details to describe a network
 class Network
A Network provides access to a chain's properties and allows for plug-ins to extend functionality.

PROPERTIES
 <src>network.chainId⇒ bigint
The network chain ID.

 <src>network.name⇒ string
The network common name.

This is the canonical name, as networks migh have multiple names.

 <src>network.plugins⇒ Array< NetworkPlugin >read-only
Returns the list of plugins currently attached to this Network.

CREATING INSTANCES
 <src>new Network(name: string, chainId: BigNumberish)
Creates a new Network for name and chainId.

 <src>Network.from(network?: Networkish)⇒ Network
Returns a new Network for the network name or chainId.

METHODS
 <src>network.attachPlugin(plugin: NetworkPlugin)⇒ this
Attach a new plugin to this Network. The network name must be unique, excluding any fragment.

 <src>network.clone()⇒ Network
Create a copy of this Network.

 <src>network.computeIntrinsicGas(tx: TransactionLike)⇒ number
Compute the intrinsic gas required for a transaction.

A GasCostPlugin can be attached to override the default values.

 <src>network.getPlugin(name: string)⇒ null | T
Return the plugin, if any, matching name exactly. Plugins with fragments will not be returned unless name includes a fragment.

 <src>network.getPlugins(basename: string)⇒ Array< T >
Gets a list of all plugins that match name, with otr without a fragment.

 <src>network.matches(other: Networkish)⇒ boolean
Returns true if other matches this network. Any chain ID must match, and if no chain ID is present, the name must match.

This method does not currently check for additional properties, such as ENS address or plug-in compatibility.

 <src>network.toJSON()⇒ any
Returns a JSON-compatible representation of a Network.

STATIC METHODS
 <src>Network.register(nameOrChainId: string | number | bigint, networkFunc: () => Network)⇒ void
Register nameOrChainId with a function which returns an instance of a Network representing that chain.

 Subclassing Provider
The available providers should suffice for most developers purposes, but the AbstractProvider class has many features which enable sub-classing it for specific purposes.

TYPES
 <src>AbstractProviderOptions⇒ { cacheTimeout?: number , pollingInterval?: number }
Options for configuring some internal aspects of an AbstractProvider.

cacheTimeout - how long to cache a low-level _perform for, based on input parameters. This reduces the number of calls to getChainId and getBlockNumber, but may break test chains which can perform operations (internally) synchronously. Use -1 to disable, 0 will only buffer within the same event loop and any other value is in ms. (default: 250)

 <src>DebugEventAbstractProvider⇒ { action: "sendCcipReadFetchRequest" , index: number , request: FetchRequest , urls: Array< string > } | { action: "receiveCcipReadFetchResult" , request: FetchRequest , result: any } | { action: "receiveCcipReadFetchError" , request: FetchRequest , result: any } | { action: "sendCcipReadCall" , transaction: { data: string , to: string } } | { action: "receiveCcipReadCallResult" , result: string , transaction: { data: string , to: string } } | { action: "receiveCcipReadCallError" , error: Error , transaction: { data: string , to: string } }
The types of additional event values that can be emitted for the "debug" event.

 <src>PerformActionFilter⇒ { address?: string | Array< string > , fromBlock?: BlockTag , toBlock?: BlockTag , topics?: Array< null | string | Array< string > > } | { address?: string | Array< string > , blockHash?: string , topics?: Array< null | string | Array< string > > }
A normalized filter used for PerformActionRequest objects.

 <src>PerformActionRequest⇒ { method: "broadcastTransaction" , signedTransaction: string } | { blockTag: BlockTag , method: "call" , transaction: PerformActionTransaction } | { method: "chainId" } | { method: "estimateGas" , transaction: PerformActionTransaction } | { address: string , blockTag: BlockTag , method: "getBalance" } | { blockTag: BlockTag , includeTransactions: boolean , method: "getBlock" } | { blockHash: string , includeTransactions: boolean , method: "getBlock" } | { method: "getBlockNumber" } | { address: string , blockTag: BlockTag , method: "getCode" } | { method: "getGasPrice" } | { filter: PerformActionFilter , method: "getLogs" } | { method: "getPriorityFee" } | { address: string , blockTag: BlockTag , method: "getStorage" , position: bigint } | { hash: string , method: "getTransaction" } | { address: string , blockTag: BlockTag , method: "getTransactionCount" } | { hash: string , method: "getTransactionReceipt" } | { hash: string , method: "getTransactionResult" }
The AbstractProvider methods will normalize all values and pass this type to abstractProvider._perform.

 <src>Subscription⇒ { tag: string , type: "block" | "close" | "debug" | "error" | "finalized" | "network" | "pending" | "safe" } | { hash: string , tag: string , type: "transaction" } | { filter: EventFilter , tag: string , type: "event" } | { filter: OrphanFilter , tag: string , type: "orphan" }
The value passed to the abstractProvider._getSubscriber method.

Only developers sub-classing [[AbstractProvider[[ will care about this, if they are modifying a low-level feature of how subscriptions operate.

FUNCTIONS
 <src>getPollingSubscriber(provider: AbstractProvider, event: ProviderEvent)⇒ Subscriber
Return the polling subscriber for common events.

 class AbstractProvider
inherits from Provider, ContractRunner, EventEmitterable, NameResolver
An AbstractProvider provides a base class for other sub-classes to implement the Provider API by normalizing input arguments and formatting output results as well as tracking events for consistent behaviour on an eventually-consistent network.

PROPERTIES
 <src>abstractProvider.destroyed⇒ booleanread-only
If this provider has been destroyed using the destroy method.

Once destroyed, all resources are reclaimed, internal event loops and timers are cleaned up and no further requests may be sent to the provider.

 <src>abstractProvider.disableCcipRead⇒ boolean
Prevent any CCIP-read operation, regardless of whether requested in a call using enableCcipRead.

 <src>abstractProvider.paused⇒ boolean
Whether the provider is currently paused.

A paused provider will not emit any events, and generally should not make any requests to the network, but that is up to sub-classes to manage.

Setting paused = true is identical to calling .pause(false), which will buffer any events that occur while paused until the provider is unpaused.

 <src>abstractProvider.plugins⇒ Array< AbstractProviderPlugin >read-only
Returns all the registered plug-ins.

 <src>abstractProvider.pollingInterval⇒ numberread-only
 <src>abstractProvider.provider⇒ thisread-only
Returns this, to allow an AbstractProvider to implement the ContractRunner interface.

CREATING INSTANCES
 <src>new AbstractProvider(network?: "any" | Networkish, options?: AbstractProviderOptions)
Create a new AbstractProvider connected to network, or use the various network detection capabilities to discover the Network if necessary.

METHODS
 <src>abstractProvider._clearTimeout(timerId: number)⇒ void
Clear a timer created using the _setTimeout method.

 <src>abstractProvider._detectNetwork()⇒ Promise< Network >
Resolves to the Network, forcing a network detection using whatever technique the sub-class requires.

Sub-classes must override this.

 <src>abstractProvider._forEachSubscriber(func: (s: Subscriber) => void)⇒ void
Perform func on each subscriber.

 <src>abstractProvider._getAddress(address: AddressLike)⇒ string | Promise< string >
Returns or resolves to the address for address, resolving ENS names and Addressable objects and returning if already an address.

 <src>abstractProvider._getBlockTag(blockTag?: BlockTag)⇒ string | Promise< string >
Returns or resolves to a valid block tag for blockTag, resolving negative values and returning if already a valid block tag.

 <src>abstractProvider._getFilter(filter: Filter | FilterByBlockHash)⇒ PerformActionFilter | Promise< PerformActionFilter >
Returns or resolves to a filter for filter, resolving any ENS names or Addressable object and returning if already a valid filter.

 <src>abstractProvider._getProvider(chainId: number)⇒ AbstractProvider
 <src>abstractProvider._getSubscriber(sub: Subscription)⇒ Subscriber
Sub-classes may override this to customize subscription implementations.

 <src>abstractProvider._getTransactionRequest(request: TransactionRequest)⇒ PerformActionTransaction | Promise< PerformActionTransaction >
Returns or resolves to a transaction for request, resolving any ENS names or Addressable and returning if already a valid transaction.

 <src>abstractProvider._perform(req: PerformActionRequest)⇒ Promise< T >
Sub-classes should use this to perform all built-in operations. All methods sanitizes and normalizes the values passed into this.

Sub-classes must override this.

 <src>abstractProvider._recoverSubscriber(oldSub: Subscriber, newSub: Subscriber)⇒ void
If a Subscriber fails and needs to replace itself, this method may be used.

For example, this is used for providers when using the eth_getFilterChanges method, which can return null if state filters are not supported by the backend, allowing the Subscriber to swap in a PollingEventSubscriber.

 <src>abstractProvider._setTimeout(func: () => void, timeout?: number)⇒ number
Create a timer that will execute func after at least timeout (in ms). If timeout is unspecified, then func will execute in the next event loop.

Pausing the provider will pause any associated timers.

 <src>abstractProvider._wrapBlock(value: BlockParams, network: Network)⇒ Block
Provides the opportunity for a sub-class to wrap a block before returning it, to add additional properties or an alternate sub-class of Block.

 <src>abstractProvider._wrapLog(value: LogParams, network: Network)⇒ Log
Provides the opportunity for a sub-class to wrap a log before returning it, to add additional properties or an alternate sub-class of Log.

 <src>abstractProvider._wrapTransactionReceipt(value: TransactionReceiptParams, network: Network)⇒ TransactionReceipt
Provides the opportunity for a sub-class to wrap a transaction receipt before returning it, to add additional properties or an alternate sub-class of TransactionReceipt.

 <src>abstractProvider._wrapTransactionResponse(tx: TransactionResponseParams, network: Network)⇒ TransactionResponse
Provides the opportunity for a sub-class to wrap a transaction response before returning it, to add additional properties or an alternate sub-class of TransactionResponse.

 <src>abstractProvider.attachPlugin(plugin: AbstractProviderPlugin)⇒ this
Attach a new plug-in.

 <src>abstractProvider.ccipReadFetch(tx: PerformActionTransaction, calldata: string, urls: Array< string >)⇒ Promise< null | string >
Resolves to the data for executing the CCIP-read operations.

 <src>abstractProvider.destroy()⇒ void
Sub-classes may use this to shutdown any sockets or release their resources and reject any pending requests.

Sub-classes must call super.destroy().

 <src>abstractProvider.getAvatar(name: string)⇒ Promise< null | string >
 <src>abstractProvider.getPlugin(name: string)⇒ null | T
Get a plugin by name.

 <src>abstractProvider.getResolver(name: string)⇒ Promise< null | EnsResolver >
 <src>abstractProvider.pause(dropWhilePaused?: boolean)⇒ void
Pause the provider. If dropWhilePaused, any events that occur while paused are dropped, otherwise all events will be emitted once the provider is unpaused.

 <src>abstractProvider.resume()⇒ void
Resume the provider.

 interface AbstractProviderPlugin
An AbstractPlugin is used to provide additional internal services to an AbstractProvider without adding backwards-incompatible changes to method signatures or other internal and complex logic.

PROPERTIES
 <src>abstractProviderPlugin.name⇒ stringread-only
The reverse domain notation of the plugin.

METHODS
 <src>abstractProviderPlugin.connect(provider: AbstractProvider)⇒ AbstractProviderPlugin
Creates a new instance of the plugin, connected to provider.

 class FilterIdEventSubscriber
inherits from FilterIdSubscriber, Subscriber
A FilterIdSubscriber for receiving contract events.

CREATING INSTANCES
 <src>new FilterIdEventSubscriber(provider: JsonRpcApiProvider, filter: EventFilter)
Creates a new FilterIdEventSubscriber attached to provider listening for filter.

 class FilterIdPendingSubscriber
inherits from FilterIdSubscriber, Subscriber
A FilterIdSubscriber for receiving pending transactions events.

 class FilterIdSubscriber
inherits from Subscriber
Some backends support subscribing to events using a Filter ID.

When subscribing with this technique, the node issues a unique Filter ID. At this point the node dedicates resources to the filter, so that periodic calls to follow up on the Filter ID will receive any events since the last call.

CREATING INSTANCES
 <src>new FilterIdSubscriber(provider: JsonRpcApiProvider)
Creates a new FilterIdSubscriber which will used _subscribe and _emitResults to setup the subscription and provide the event to the provider.

METHODS
 <src>filterIdSubscriber._emitResults(provider: AbstractProvider, result: Array< any >)⇒ Promise< void >
Sub-classes must override this handle the events.

 <src>filterIdSubscriber._recover(provider: AbstractProvider)⇒ Subscriber
Sub-classes must override this handle recovery on errors.

 <src>filterIdSubscriber._subscribe(provider: JsonRpcApiProvider)⇒ Promise< string >
Sub-classes must override this to begin the subscription.

 class OnBlockSubscriber
inherits from Subscriber
An OnBlockSubscriber can be sub-classed, with a _poll implmentation which will be called on every new block.

CREATING INSTANCES
 <src>new OnBlockSubscriber(provider: AbstractProvider)
Create a new OnBlockSubscriber attached to provider.

METHODS
 <src>onBlockSubscriber._poll(blockNumber: number, provider: AbstractProvider)⇒ Promise< void >
Called on every new block.

 interface PerformActionTransaction
inherits from PreparedTransactionRequest
A normalized transactions used for PerformActionRequest objects.

PROPERTIES
 <src>performActionTransaction.from⇒ string
The sender of the transaction.

 <src>performActionTransaction.to⇒ string
The to address of the transaction.

 class PollingBlockSubscriber
inherits from Subscriber
A PollingBlockSubscriber polls at a regular interval for a change in the block number.

PROPERTIES
 <src>pollingBlockSubscriber.pollingInterval⇒ number
The polling interval.

CREATING INSTANCES
 <src>new PollingBlockSubscriber(provider: AbstractProvider)
Create a new PollingBlockSubscriber attached to provider.

 class PollingEventSubscriber
inherits from Subscriber
A PollingEventSubscriber will poll for a given filter for its logs.

CREATING INSTANCES
 <src>new PollingEventSubscriber(provider: AbstractProvider, filter: EventFilter)
Create a new PollingTransactionSubscriber attached to provider, listening for filter.

 class PollingTransactionSubscriber
inherits from OnBlockSubscriber, Subscriber
A PollingTransactionSubscriber will poll for a given transaction hash for its receipt.

CREATING INSTANCES
 <src>new PollingTransactionSubscriber(provider: AbstractProvider, hash: string)
Create a new PollingTransactionSubscriber attached to provider, listening for hash.

 interface Subscriber
A Subscriber manages a subscription.

Only developers sub-classing [[AbstractProvider[[ will care about this, if they are modifying a low-level feature of how subscriptions operate.

PROPERTIES
 <src>subscriber.pollingInterval⇒ number
The frequency (in ms) to poll for events, if polling is used by the subscriber.

For non-polling subscribers, this must return undefined.

METHODS
 <src>subscriber.pause(dropWhilePaused?: boolean)⇒ void
Called when the subscription should pause.

If dropWhilePaused, events that occur while paused should not be emitted resume.

 <src>subscriber.resume()⇒ void
Resume a paused subscriber.

 <src>subscriber.start()⇒ void
Called initially when a subscriber is added the first time.

 <src>subscriber.stop()⇒ void
Called when there are no more subscribers to the event.

 class UnmanagedSubscriber
inherits from Subscriber
An UnmanagedSubscriber is useful for events which do not require any additional management, such as "debug" which only requires emit in synchronous event loop triggered calls.

PROPERTIES
 <src>unmanagedSubscriber.name⇒ string
The name fof the event.

CREATING INSTANCES
 <src>new UnmanagedSubscriber(name: string)
Create a new UnmanagedSubscriber with name.

 Socket Providers
Generic long-lived socket provider.

Sub-classing notes


a sub-class MUST call the `_start()` method once connected
a sub-class MUST override the `_write(string)` method
a sub-class MUST call `_processMessage(string)` for each message
 class SocketBlockSubscriber
inherits from SocketSubscriber, Subscriber
A SocketBlockSubscriber listens for newHeads events and emits "block" events.

 class SocketEventSubscriber
inherits from SocketSubscriber, Subscriber
A SocketEventSubscriber listens for event logs.

PROPERTIES
 <src>socketEventSubscriber.logFilter⇒ EventFilterread-only
The filter.

 class SocketPendingSubscriber
inherits from SocketSubscriber, Subscriber
A SocketPendingSubscriber listens for pending transacitons and emits "pending" events.

 class SocketProvider
inherits from JsonRpcApiProvider, AbstractProvider
A SocketProvider is backed by a long-lived connection over a socket, which can subscribe and receive real-time messages over its communication channel.

CREATING INSTANCES
 <src>new SocketProvider(network?: Networkish, options?: JsonRpcApiProviderOptions)
Creates a new SocketProvider connected to network.

If unspecified, the network will be discovered.

METHODS
 <src>socketProvider._processMessage(message: string)⇒ Promise< void >
Sub-classes must call this with messages received over their transport to be processed and dispatched.

 <src>socketProvider._register(filterId: number | string, subscriber: SocketSubscriber)⇒ void
Register a new subscriber. This is used internalled by Subscribers and generally is unecessary unless extending capabilities.

 <src>socketProvider._write(message: string)⇒ Promise< void >
Sub-classes must override this to send message over their transport.

 class SocketSubscriber
inherits from Subscriber
A SocketSubscriber uses a socket transport to handle events and should use _emit to manage the events.

PROPERTIES
 <src>socketSubscriber.filter⇒ Array< any >read-only
The filter.

CREATING INSTANCES
 <src>new SocketSubscriber(provider: SocketProvider, filter: Array< any >)
Creates a new SocketSubscriber attached to provider listening to filter.

METHODS
 <src>socketSubscriber._emit(provider: SocketProvider, message: any)⇒ Promise< void >
Sub-classes must override this to emit the events on the provider.

 Subclassing Signer
Generally the Wallet and JsonRpcSigner and their sub-classes are sufficient for most developers, but this is provided to fascilitate more complex Signers.

 abstract class AbstractSigner
inherits from Signer, Addressable, ContractRunner, NameResolver
An AbstractSigner includes most of teh functionality required to get a Signer working as expected, but requires a few Signer-specific methods be overridden.

PROPERTIES
 <src>abstractSigner.provider⇒ Pread-only
The provider this signer is connected to.

CREATING INSTANCES
 <src>new AbstractSigner(provider?: P)
Creates a new Signer connected to provider.

METHODS
 <src>abstractSigner.connect(provider: null | Provider)⇒ Signerabstract
Returns the signer connected to provider.

This may throw, for example, a Signer connected over a Socket or to a specific instance of a node may not be transferrable.

 <src>abstractSigner.getAddress()⇒ Promise< string >abstract
Resolves to the Signer address.

 class VoidSigner
inherits from AbstractSigner, Signer
A VoidSigner is a class designed to allow an address to be used in any API which accepts a Signer, but for which there are no credentials available to perform any actual signing.

This for example allow impersonating an account for the purpose of static calls or estimating gas, but does not allow sending transactions.

PROPERTIES
 <src>voidSigner.address⇒ stringread-only
The signer address.

CREATING INSTANCES
 <src>new VoidSigner(address: string, provider?: null | Provider)
Creates a new VoidSigner with address attached to provider.

 ENS Resolver
ENS is a service which allows easy-to-remember names to map to network addresses.

TYPES
 <src>AvatarLinkageType⇒ "name" | "avatar" | "!avatar" | "url" | "data" | "ipfs" | "erc721" | "erc1155" | "!erc721-caip" | "!erc1155-caip" | "!owner" | "owner" | "!balance" | "balance" | "metadata-url-base" | "metadata-url-expanded" | "metadata-url" | "!metadata-url" | "!metadata" | "metadata" | "!imageUrl" | "imageUrl-ipfs" | "imageUrl" | "!imageUrl-ipfs"
The type of data found during a steip during avatar resolution.

 interface AvatarLinkage
An individual record for each step during avatar resolution.

PROPERTIES
 <src>avatarLinkage.type⇒ AvatarLinkageType
The type of linkage.

 <src>avatarLinkage.value⇒ string
The linkage value.

 interface AvatarResult
When resolving an avatar for an ENS name, there are many steps involved, fetching metadata, validating results, et cetera.

Some applications may wish to analyse this data, or use this data to diagnose promblems, so an AvatarResult provides details of each completed step during avatar resolution.

PROPERTIES
 <src>avatarResult.linkage⇒ Array< AvatarLinkage >
How the url was arrived at, resolving the many steps required for an avatar URL.

 <src>avatarResult.url⇒ null | string
The avatar URL or null if the avatar was not set, or there was an issue during validation (such as the address not owning the avatar or a metadata error).

 class BasicMulticoinProviderPlugin
inherits from MulticoinProviderPlugin, AbstractProviderPlugin
A BasicMulticoinProviderPlugin provides service for common coin types, which do not require additional libraries to encode or decode.

CREATING INSTANCES
 <src>new BasicMulticoinProviderPlugin()
Creates a new BasicMulticoinProviderPlugin.

 class EnsResolver
A connected object to a resolved ENS name resolver, which can be used to query additional details.

PROPERTIES
 <src>ensResolver.address⇒ string
The address of the resolver.

 <src>ensResolver.name⇒ string
The name this resolver was resolved against.

 <src>ensResolver.provider⇒ AbstractProvider
The connected provider.

CREATING INSTANCES
 <src>new EnsResolver(provider: AbstractProvider, address: string, name: string)
METHODS
 <src>ensResolver._getAvatar()⇒ Promise< AvatarResult >
When resolving an avatar, there are many steps involved, such fetching metadata and possibly validating ownership of an NFT.

This method can be used to examine each step and the value it was working from.

 <src>ensResolver.getAddress(coinType?: number)⇒ Promise< null | string >
Resolves to the address for coinType or null if the provided coinType has not been configured.

 <src>ensResolver.getAvatar()⇒ Promise< null | string >
Resolves to the avatar url or null if the avatar is either unconfigured or incorrectly configured (e.g. references an NFT not owned by the address).

If diagnosing issues with configurations, the _getAvatar method may be useful.

 <src>ensResolver.getContentHash()⇒ Promise< null | string >
Rsolves to the content-hash or null if unconfigured.

 <src>ensResolver.getText(key: string)⇒ Promise< null | string >
Resolves to the EIP-634 text record for key, or null if unconfigured.

 <src>ensResolver.supportsWildcard()⇒ Promise< boolean >
Resolves to true if the resolver supports wildcard resolution.

STATIC METHODS
 <src>EnsResolver.fromName(provider: AbstractProvider, name: string)⇒ Promise< null | EnsResolver >
Resolve to the ENS resolver for name using provider or null if unconfigured.

 <src>EnsResolver.getEnsAddress(provider: Provider)⇒ Promise< string >
 abstract class MulticoinProviderPlugin
inherits from AbstractProviderPlugin
A provider plugin super-class for processing multicoin address types.

PROPERTIES
 <src>multicoinProviderPlugin.name⇒ stringread-only
The name.

CREATING INSTANCES
 <src>new MulticoinProviderPlugin(name: string)
Creates a new MulticoinProviderPluing for name.

METHODS
 <src>multicoinProviderPlugin.decodeAddress(coinType: number, data: BytesLike)⇒ Promise< string >
Resolves to the decoded data for coinType.

 <src>multicoinProviderPlugin.encodeAddress(coinType: number, address: string)⇒ Promise< string >
Resolves to the encoded address for coinType.

 <src>multicoinProviderPlugin.supportsCoinType(coinType: number)⇒ boolean
Returns true if coinType is supported by this plugin.

 Fallback Provider
A FallbackProvider provides resilience, security and performance in a way that is customizable and configurable.

TYPES
 <src>FallbackProviderOptions⇒ { cacheTimeout?: number , eventQuorum?: number , eventWorkers?: number , pollingInterval?: number , quorum?: number }
Additional options to configure a FallbackProvider.

 class FallbackProvider
inherits from AbstractProvider, Provider
A FallbackProvider manages several Providers providing resilience by switching between slow or misbehaving nodes, security by requiring multiple backends to aggree and performance by allowing faster backends to respond earlier.

PROPERTIES
 <src>fallbackProvider.providerConfigs⇒ Array< FallbackProviderState >read-only
 <src>fallbackProvider.quorum⇒ numberread-only
The number of backends that must agree on a value before it is accpeted.

CREATING INSTANCES
 <src>new FallbackProvider(providers: Array< AbstractProvider | FallbackProviderConfig >, network?: Networkish, options?: FallbackProviderOptions)
Creates a new FallbackProvider with providers connected to network.

If a Provider is included in providers, defaults are used for the configuration.

METHODS
 <src>fallbackProvider._translatePerform(provider: AbstractProvider, req: PerformActionRequest)⇒ Promise< any >
Transforms a req into the correct method call on provider.

 interface FallbackProviderConfig
A configuration entry for how to use a Provider.

PROPERTIES
 <src>fallbackProviderConfig.priority⇒ number
The priority. Lower priority providers are dispatched first.

 <src>fallbackProviderConfig.provider⇒ AbstractProvider
The provider.

 <src>fallbackProviderConfig.stallTimeout⇒ number
The amount of time to wait before kicking off the next provider.

Any providers that have not responded can still respond and be counted, but this ensures new providers start.

 <src>fallbackProviderConfig.weight⇒ number
The amount of weight a provider is given against the quorum.

 interface FallbackProviderState
The statistics and state maintained for a Provider.

PROPERTIES
 <src>fallbackProviderState.blockNumber⇒ number
The most recent blockNumber this provider has reported (-2 if none).

 <src>fallbackProviderState.errorResponses⇒ number
The number of responses that errored.

 <src>fallbackProviderState.lateResponses⇒ number
The number of responses that occured after the result resolved.

 <src>fallbackProviderState.outOfSync⇒ number
How many times syncing was required to catch up the expected block.

 <src>fallbackProviderState.requests⇒ number
The number of total requests ever sent to this provider.

 <src>fallbackProviderState.rollingDuration⇒ number
A rolling average (5% current duration) for response time.

 <src>fallbackProviderState.score⇒ number
The ratio of quorum-agreed results to total.

 <src>fallbackProviderState.unsupportedEvents⇒ number
The number of requests which reported unsupported operation.

 Formatting
About provider formatting?

 interface BlockParams
a BlockParams encodes the minimal required properties for a formatted block.

PROPERTIES
 <src>blockParams.baseFeePerGas⇒ null | bigint
The protocol-defined base fee per gas in an EIP-1559 block.

 <src>blockParams.blobGasUsed⇒ null | bigint
The total amount of BLOb gas consumed by transactions within the block. See [[link-eip4844].

 <src>blockParams.difficulty⇒ bigint
For proof-of-work networks, the difficulty target is used to adjust the difficulty in mining to ensure an expected block rate.

 <src>blockParams.excessBlobGas⇒ null | bigint
The running total of BLOb gas consumed in excess of the target prior to the block. See EIP-4844.

 <src>blockParams.extraData⇒ string
Additional data the miner choose to include.

 <src>blockParams.gasLimit⇒ bigint
The maximum amount of gas a block can consume.

 <src>blockParams.gasUsed⇒ bigint
The amount of gas a block consumed.

 <src>blockParams.hash⇒ null | string
The block hash.

 <src>blockParams.miner⇒ string
The miner (or author) of a block.

 <src>blockParams.nonce⇒ string
A random sequence provided during the mining process for proof-of-work networks.

 <src>blockParams.number⇒ number
The block number.

 <src>blockParams.parentBeaconBlockRoot⇒ null | string
The hash tree root of the parent beacon block for the given execution block. See EIP-4788.

 <src>blockParams.parentHash⇒ string
The hash of the previous block in the blockchain. The genesis block has the parentHash of the ZeroHash.

 <src>blockParams.prevRandao⇒ null | string
The latest RANDAO mix of the post beacon state of the previous block.

 <src>blockParams.receiptsRoot⇒ null | string
The hash of the transaction receipts trie.

 <src>blockParams.stateRoot⇒ null | string
The root hash for the global state after applying changes in this block.

 <src>blockParams.timestamp⇒ number
The timestamp for this block, which is the number of seconds since epoch that this block was included.

 <src>blockParams.transactions⇒ ReadonlyArray< string | TransactionResponseParams >
The list of transactions in the block.

 interface LogParams
a LogParams encodes the minimal required properties for a formatted log.

PROPERTIES
 <src>logParams.address⇒ string
The address of the contract that emitted this log.

 <src>logParams.blockHash⇒ string
The block hash of the block that included the transaction for this log.

 <src>logParams.blockNumber⇒ number
The block number of the block that included the transaction for this log.

 <src>logParams.data⇒ string
The data emitted with this log.

 <src>logParams.index⇒ number
The index of this log.

 <src>logParams.removed⇒ boolean
Whether this log was removed due to the transaction it was included in being removed dur to an orphaned block.

 <src>logParams.topics⇒ ReadonlyArray< string >
The topics emitted with this log.

 <src>logParams.transactionHash⇒ string
The transaction hash for the transaxction the log occurred in.

 <src>logParams.transactionIndex⇒ number
The transaction index of this log.

 interface TransactionReceiptParams
a TransactionReceiptParams encodes the minimal required properties for a formatted transaction receipt.

PROPERTIES
 <src>transactionReceiptParams.blobGasPrice⇒ null | bigint
The actual BLOb gas price that was charged. See EIP-4844.

 <src>transactionReceiptParams.blobGasUsed⇒ null | bigint
The amount of BLOb gas used. See EIP-4844.

 <src>transactionReceiptParams.blockHash⇒ string
The block hash of the block that included this transaction.

 <src>transactionReceiptParams.blockNumber⇒ number
The block number of the block that included this transaction.

 <src>transactionReceiptParams.contractAddress⇒ null | string
If the transaction was directly deploying a contract, the to will be null, the data will be initcode and if successful, this will be the address of the contract deployed.

 <src>transactionReceiptParams.cumulativeGasUsed⇒ bigint
The total amount of gas consumed during the entire block up to and including this transaction.

 <src>transactionReceiptParams.effectiveGasPrice⇒ null | bigint
The actual gas price per gas charged for this transaction.

 <src>transactionReceiptParams.from⇒ string
The sender of the transaction.

 <src>transactionReceiptParams.gasPrice⇒ null | bigint
The actual gas price per gas charged for this transaction.

 <src>transactionReceiptParams.gasUsed⇒ bigint
The amount of gas consumed executing this transaction.

 <src>transactionReceiptParams.hash⇒ string
The transaction hash.

 <src>transactionReceiptParams.index⇒ number
The transaction index.

 <src>transactionReceiptParams.logs⇒ ReadonlyArray< LogParams >
The logs emitted during the execution of this transaction.

 <src>transactionReceiptParams.logsBloom⇒ string
The bloom filter for the logs emitted during execution of this transaction.

 <src>transactionReceiptParams.root⇒ null | string
The root of this transaction in a pre-bazatium block. In post-byzantium blocks this is null.

 <src>transactionReceiptParams.status⇒ null | number
The status of the transaction execution. If 1 then the the transaction returned success, if 0 then the transaction was reverted. For pre-byzantium blocks, this is usually null, but some nodes may have backfilled this data.

 <src>transactionReceiptParams.to⇒ null | string
The target of the transaction. If null, the transaction was trying to deploy a transaction with the data as the initi=code.

 <src>transactionReceiptParams.type⇒ number
The EIP-2718 envelope type.

 interface TransactionResponseParams
a TransactionResponseParams encodes the minimal required properties for a formatted transaction response.

PROPERTIES
 <src>transactionResponseParams.accessList⇒ null | AccessList
The transaction access list.

 <src>transactionResponseParams.authorizationList⇒ null | Array< Authorization >
The EIP-7702 authorizations (if any).

 <src>transactionResponseParams.blobVersionedHashes⇒ null | Array< string >
The EIP-4844 BLOb versioned hashes.

 <src>transactionResponseParams.blockHash⇒ null | string
The block hash of the block that included this transaction.

 <src>transactionResponseParams.blockNumber⇒ null | number
The block number of the block that included this transaction.

 <src>transactionResponseParams.chainId⇒ bigint
The chain ID this transaction is valid on.

 <src>transactionResponseParams.data⇒ string
The transaction data.

 <src>transactionResponseParams.from⇒ string
The sender of the transaction.

 <src>transactionResponseParams.gasLimit⇒ bigint
The maximum amount of gas this transaction is authorized to consume.

 <src>transactionResponseParams.gasPrice⇒ bigint
For legacy transactions, this is the gas price per gas to pay.

 <src>transactionResponseParams.hash⇒ string
The transaction hash.

 <src>transactionResponseParams.index⇒ number
The transaction index.

 <src>transactionResponseParams.maxFeePerBlobGas⇒ null | bigint
For EIP-4844 transactions, this is the maximum fee that will be paid per BLOb.

 <src>transactionResponseParams.maxFeePerGas⇒ null | bigint
For EIP-1559 transactions, this is the maximum fee that will be paid.

 <src>transactionResponseParams.maxPriorityFeePerGas⇒ null | bigint
For EIP-1559 transactions, this is the maximum priority fee to allow a producer to claim.

 <src>transactionResponseParams.nonce⇒ number
The nonce of the transaction, used for replay protection.

 <src>transactionResponseParams.signature⇒ Signature
The signature of the transaction.

 <src>transactionResponseParams.to⇒ null | string
The target of the transaction. If null, the data is initcode and this transaction is a deployment transaction.

 <src>transactionResponseParams.type⇒ number
The EIP-2718 transaction type.

 <src>transactionResponseParams.value⇒ bigint
The transaction value (in wei).

 JSON-RPC Provider
One of the most common ways to interact with the blockchain is by a node running a JSON-RPC interface which can be connected to, based on the transport, using:


HTTP or HTTPS - JsonRpcProvider
WebSocket - WebSocketProvider
IPC - IpcSocketProvider
TYPES
 <src>DebugEventJsonRpcApiProvider⇒ { action: "sendRpcPayload" , payload: JsonRpcPayload | Array< JsonRpcPayload > } | { action: "receiveRpcResult" , result: Array< JsonRpcResult | JsonRpcError > } | { action: "receiveRpcError" , error: Error }
When subscribing to the "debug" event, the Listener will receive this object as the first parameter.

 <src>JsonRpcApiProviderOptions⇒ { batchMaxCount?: number , batchMaxSize?: number , batchStallTime?: number , cacheTimeout?: number , polling?: boolean , pollingInterval?: number , staticNetwork?: null | boolean | Network }
Options for configuring a JsonRpcApiProvider. Much of this is targetted towards sub-classes, which often will not expose any of these options to their consumers.

polling - use the polling strategy is used immediately for events; otherwise, attempt to use filters and fall back onto polling (default: false)

staticNetwork - do not request chain ID on requests to validate the underlying chain has not changed (default: null)

This should ONLY be used if it is certain that the network cannot change, such as when using INFURA (since the URL dictates the network). If the network is assumed static and it does change, this can have tragic consequences. For example, this CANNOT be used with MetaMask, since the user can select a new network from the drop-down at any time.

batchStallTime - how long (ms) to aggregate requests into a single batch. 0 indicates batching will only encompass the current event loop. If batchMaxCount = 1, this is ignored. (default: 10)

batchMaxSize - target maximum size (bytes) to allow per batch request (default: 1Mb)

batchMaxCount - maximum number of requests to allow in a batch. If batchMaxCount = 1, then batching is disabled. (default: 100)

cacheTimeout - passed as AbstractProviderOptions.

 <src>JsonRpcError⇒ { error: { code: number , data?: any , message?: string } , id: number }
A JSON-RPC error, which are returned on failure from a JSON-RPC server.

 <src>JsonRpcPayload⇒ { id: number , jsonrpc: "2.0" , method: string , params: Array< any > | Record< string, any > }
A JSON-RPC payload, which are sent to a JSON-RPC server.

 <src>JsonRpcResult⇒ { id: number , result: any }
A JSON-RPC result, which are returned on success from a JSON-RPC server.

 abstract class JsonRpcApiProvider
inherits from AbstractProvider, Provider
The JsonRpcApiProvider is an abstract class and MUST be sub-classed.

It provides the base for all JSON-RPC-based Provider interaction.

Sub-classing Notes:


a sub-class MUST override _send
a sub-class MUST call the `_start()` method once connected
PROPERTIES
 <src>jsonRpcApiProvider._network⇒ Networkread-only
Gets the Network this provider has committed to. On each call, the network is detected, and if it has changed, the call will reject.

 <src>jsonRpcApiProvider.ready⇒ booleanread-only
Returns true only if the _start has been called.

CREATING INSTANCES
 <src>new JsonRpcApiProvider(network?: Networkish, options?: JsonRpcApiProviderOptions)
METHODS
 <src>jsonRpcApiProvider._detectNetwork()⇒ Promise< Network >
Sub-classes may override this; it detects the *actual* network that we are currently connected to.

Keep in mind that send may only be used once ready, otherwise the _send primitive must be used instead.

 <src>jsonRpcApiProvider._getOption(key: K)⇒ TODO(A3B[object Object][[object Object]])
Returns the value associated with the option key.

Sub-classes can use this to inquire about configuration options.

 <src>jsonRpcApiProvider._getSubscriber(sub: Subscription)⇒ Subscriber
Return a Subscriber that will manage the sub.

Sub-classes may override this to modify the behavior of subscription management.

 <src>jsonRpcApiProvider._perform(req: PerformActionRequest)⇒ Promise< any >
Resolves to the non-normalized value by performing req.

Sub-classes may override this to modify behavior of actions, and should generally call super._perform as a fallback.

 <src>jsonRpcApiProvider._send(payload: JsonRpcPayload | Array< JsonRpcPayload >)⇒ Promise< Array< JsonRpcResult | JsonRpcError > >abstract
Sends a JSON-RPC payload (or a batch) to the underlying channel.

Sub-classes MUST override this.

 <src>jsonRpcApiProvider._start()⇒ void
Sub-classes MUST call this. Until _start has been called, no calls will be passed to _send from send. If it is overridden, then super._start() MUST be called.

Calling it multiple times is safe and has no effect.

 <src>jsonRpcApiProvider._waitUntilReady()⇒ Promise< void >
Resolves once the _start has been called. This can be used in sub-classes to defer sending data until the connection has been established.

 <src>jsonRpcApiProvider.getRpcError(payload: JsonRpcPayload, error: JsonRpcError)⇒ Error
Returns an ethers-style Error for the given JSON-RPC error payload, coalescing the various strings and error shapes that different nodes return, coercing them into a machine-readable standardized error.

 <src>jsonRpcApiProvider.getRpcRequest(req: PerformActionRequest)⇒ null | { args: Array< any > , method: string }
Returns the request method and arguments required to perform req.

 <src>jsonRpcApiProvider.getRpcTransaction(tx: TransactionRequest)⇒ JsonRpcTransactionRequest
Returns tx as a normalized JSON-RPC transaction request, which has all values hexlified and any numeric values converted to Quantity values.

 <src>jsonRpcApiProvider.getSigner(address?: number | string)⇒ Promise< JsonRpcSigner >
Resolves to the Signer account for address managed by the client.

If the address is a number, it is used as an index in the the accounts from listAccounts.

This can only be used on clients which manage accounts (such as Geth with imported account or MetaMask).

Throws if the account doesn't exist.

 <src>jsonRpcApiProvider.listAccounts()⇒ Promise< Array< JsonRpcSigner > >
 <src>jsonRpcApiProvider.send(method: string, params: Array< any > | Record< string, any >)⇒ Promise< any >
Requests the method with params via the JSON-RPC protocol over the underlying channel. This can be used to call methods on the backend that do not have a high-level API within the Provider API.

This method queues requests according to the batch constraints in the options, assigns the request a unique ID.

Do NOT override this method in sub-classes; instead override _send or force the options values in the call to the constructor to modify this method's behavior.

 class JsonRpcProvider
The JsonRpcProvider is one of the most common Providers, which performs all operations over HTTP (or HTTPS) requests.

Events are processed by polling the backend for the current block number; when it advances, all block-base events are then checked for updates.

CREATING INSTANCES
 <src>new JsonRpcProvider(url?: string | FetchRequest, network?: Networkish, options?: JsonRpcApiProviderOptions)
METHODS
 <src>jsonRpcProvider._getConnection()⇒ FetchRequest
 <src>jsonRpcProvider._send(payload: JsonRpcPayload | Array< JsonRpcPayload >)⇒ Promise< Array< JsonRpcResult > >
 <src>jsonRpcProvider.send(method: string, params: Array< any > | Record< string, any >)⇒ Promise< any >
 class JsonRpcSigner
inherits from AbstractSigner, Signer
PROPERTIES
 <src>jsonRpcSigner.address⇒ string
CREATING INSTANCES
 <src>new JsonRpcSigner(provider: JsonRpcApiProvider, address: string)
METHODS
 <src>jsonRpcSigner._legacySignMessage(message: string | Uint8Array)⇒ Promise< string >
 <src>jsonRpcSigner.sendUncheckedTransaction(tx: TransactionRequest)⇒ Promise< string >
 <src>jsonRpcSigner.unlock(password: string)⇒ Promise< boolean >
 interface JsonRpcTransactionRequest
A JsonRpcTransactionRequest is formatted as needed by the JSON-RPC Ethereum API specification.

PROPERTIES
 <src>jsonRpcTransactionRequest.accessList⇒ Array< { address: string , storageKeys: Array< string > } >
The transaction access list.

 <src>jsonRpcTransactionRequest.authorizationList⇒ Array< { address: string , chainId: string , nonce: string , r: string , s: string , yParity: string } >
The transaction authorization list.

 <src>jsonRpcTransactionRequest.chainId⇒ string
The chain ID the transaction is valid on.

 <src>jsonRpcTransactionRequest.data⇒ string
The transaction data.

 <src>jsonRpcTransactionRequest.from⇒ string
The sender address to use when signing.

 <src>jsonRpcTransactionRequest.gas⇒ string
The maximum amount of gas to allow a transaction to consume.

In most other places in ethers, this is called gasLimit which differs from the JSON-RPC Ethereum API specification.

 <src>jsonRpcTransactionRequest.gasPrice⇒ string
The gas price per wei for transactions prior to EIP-1559.

 <src>jsonRpcTransactionRequest.maxFeePerGas⇒ string
The maximum fee per gas for EIP-1559 transactions.

 <src>jsonRpcTransactionRequest.maxPriorityFeePerGas⇒ string
The maximum priority fee per gas for EIP-1559 transactions.

 <src>jsonRpcTransactionRequest.nonce⇒ string
The nonce for the transaction.

 <src>jsonRpcTransactionRequest.to⇒ string
The target address.

 <src>jsonRpcTransactionRequest.type⇒ string
The EIP-2718 transaction type.

 <src>jsonRpcTransactionRequest.value⇒ string
The transaction value (in wei).

 Community Providers
There are many awesome community services that provide Ethereum nodes both for developers just starting out and for large-scale communities.

FUNCTIONS
 <src>showThrottleMessage(service: string)⇒ void
Displays a warning in the console when the community resource is being used too heavily by the app, recommending the developer acquire their own credentials instead of using the community credentials.

The notification will only occur once per service.

 class AlchemyProvider
inherits from JsonRpcProvider, CommunityResourcable
The AlchemyProvider connects to the Alchemy JSON-RPC end-points.

By default, a highly-throttled API key is used, which is appropriate for quick prototypes and simple scripts. To gain access to an increased rate-limit, it is highly recommended to sign up here.

PROPERTIES
 <src>alchemyProvider.apiKey⇒ stringread-only
CREATING INSTANCES
 <src>new AlchemyProvider(network?: Networkish, apiKey?: null | string)
METHODS
 <src>alchemyProvider._getProvider(chainId: number)⇒ AbstractProvider
 <src>alchemyProvider._perform(req: PerformActionRequest)⇒ Promise< any >
STATIC METHODS
 <src>AlchemyProvider.getRequest(network: Network, apiKey?: string)⇒ FetchRequest
 interface CommunityResourcable
There are many awesome community services that provide Ethereum nodes both for developers just starting out and for large-scale communities.

METHODS
 <src>communityResourcable.isCommunityResource()⇒ boolean
Returns true if the instance is connected using the community credentials.

 Alchemy
Alchemy provides a third-party service for connecting to various blockchains over JSON-RPC.

Supported Networks


Ethereum Mainnet (mainnet)
Goerli Testnet (goerli)
Sepolia Testnet (sepolia)
Arbitrum (arbitrum)
Arbitrum Goerli Testnet (arbitrum-goerli)
Arbitrum Sepolia Testnet (arbitrum-sepolia)
Base (base)
Base Goerlia Testnet (base-goerli)
Base Sepolia Testnet (base-sepolia)
Optimism (optimism)
Optimism Goerli Testnet (optimism-goerli)
Optimism Sepolia Testnet (optimism-sepolia)
Polygon (matic)
Polygon Amoy Testnet (matic-amoy)
Polygon Mumbai Testnet (matic-mumbai)
 Ankr
Ankr provides a third-party service for connecting to various blockchains over JSON-RPC.

Supported Networks


Ethereum Mainnet (mainnet)
Goerli Testnet (goerli)
Sepolia Testnet (sepolia)
Arbitrum (arbitrum)
Base (base)
Base Goerlia Testnet (base-goerli)
Base Sepolia Testnet (base-sepolia)
BNB (bnb)
BNB Testnet (bnbt)
Filecoin (filecoin)
Filecoin Calibration Testnet (filecoin-calibration)
Optimism (optimism)
Optimism Goerli Testnet (optimism-goerli)
Optimism Sepolia Testnet (optimism-sepolia)
Polygon (matic)
Polygon Mumbai Testnet (matic-mumbai)
 class AnkrProvider
inherits from JsonRpcProvider, CommunityResourcable
The AnkrProvider connects to the Ankr JSON-RPC end-points.

By default, a highly-throttled API key is used, which is appropriate for quick prototypes and simple scripts. To gain access to an increased rate-limit, it is highly recommended to sign up here.

PROPERTIES
 <src>ankrProvider.apiKey⇒ stringread-only
The API key for the Ankr connection.

CREATING INSTANCES
 <src>new AnkrProvider(network?: Networkish, apiKey?: null | string)
Create a new AnkrProvider.

By default connecting to mainnet with a highly throttled API key.

METHODS
 <src>ankrProvider._getProvider(chainId: number)⇒ AbstractProvider
 <src>ankrProvider.getRpcError(payload: JsonRpcPayload, error: JsonRpcError)⇒ Error
STATIC METHODS
 <src>AnkrProvider.getRequest(network: Network, apiKey?: null | string)⇒ FetchRequest
Returns a prepared request for connecting to network with apiKey.

 Blockscout
Blockscout provides a third-party service for connecting to various blockchains over JSON-RPC.

Supported Networks


Ethereum Mainnet (mainnet)
Sepolia Testnet (sepolia)
Holesky Testnet (holesky)
Ethereum Classic (classic)
Arbitrum (arbitrum)
Base (base)
Base Sepolia Testnet (base-sepolia)
Gnosis (xdai)
Optimism (optimism)
Optimism Sepolia Testnet (optimism-sepolia)
Polygon (matic)
 class BlockscoutProvider
inherits from JsonRpcProvider, CommunityResourcable
The BlockscoutProvider connects to the Blockscout JSON-RPC end-points.

By default, a highly-throttled API key is used, which is appropriate for quick prototypes and simple scripts. To gain access to an increased rate-limit, it is highly recommended to sign up here.

PROPERTIES
 <src>blockscoutProvider.apiKey⇒ null | stringread-only
The API key.

CREATING INSTANCES
 <src>new BlockscoutProvider(network?: Networkish, apiKey?: null | string)
Creates a new BlockscoutProvider.

METHODS
 <src>blockscoutProvider._getProvider(chainId: number)⇒ AbstractProvider
 <src>blockscoutProvider.getRpcError(payload: JsonRpcPayload, error: JsonRpcError)⇒ Error
 <src>blockscoutProvider.getRpcRequest(req: PerformActionRequest)⇒ null | { args: Array< any > , method: string }
STATIC METHODS
 <src>BlockscoutProvider.getRequest(network: Network)⇒ FetchRequest
Returns a prepared request for connecting to network with apiKey.

 Chainstack
Chainstack provides a third-party service for connecting to various blockchains over JSON-RPC.

Supported Networks


Ethereum Mainnet (mainnet)
Arbitrum (arbitrum)
BNB Smart Chain Mainnet (bnb)
Polygon (matic)
 class ChainstackProvider
inherits from JsonRpcProvider, CommunityResourcable
The ChainstackProvider connects to the Chainstack JSON-RPC end-points.

By default, a highly-throttled API key is used, which is appropriate for quick prototypes and simple scripts. To gain access to an increased rate-limit, it is highly recommended to sign up here.

PROPERTIES
 <src>chainstackProvider.apiKey⇒ stringread-only
The API key for the Chainstack connection.

CREATING INSTANCES
 <src>new ChainstackProvider(network?: Networkish, apiKey?: null | string)
Creates a new ChainstackProvider.

METHODS
 <src>chainstackProvider._getProvider(chainId: number)⇒ AbstractProvider
STATIC METHODS
 <src>ChainstackProvider.getRequest(network: Network, apiKey?: null | string)⇒ FetchRequest
Returns a prepared request for connecting to network with apiKey and projectSecret.

 Cloudflare
About Cloudflare

 class CloudflareProvider
inherits from JsonRpcProvider
About Cloudflare...

CREATING INSTANCES
 <src>new CloudflareProvider(network?: Networkish)
 Etherscan
Etherscan provides a third-party service for connecting to various blockchains over a combination of JSON-RPC and custom API endpoints.

Supported Networks


Ethereum Mainnet (mainnet)
Goerli Testnet (goerli)
Sepolia Testnet (sepolia)
Holesky Testnet (holesky)
Arbitrum (arbitrum)
Arbitrum Goerli Testnet (arbitrum-goerli)
Base (base)
Base Sepolia Testnet (base-sepolia)
BNB Smart Chain Mainnet (bnb)
BNB Smart Chain Testnet (bnbt)
Optimism (optimism)
Optimism Goerli Testnet (optimism-goerli)
Polygon (matic)
Polygon Mumbai Testnet (matic-mumbai)
Polygon Amoy Testnet (matic-amoy)
TYPES
 <src>DebugEventEtherscanProvider⇒ { action: "sendRequest" , id: number , payload: Record< string, any > , url: string } | { action: "receiveRequest" , id: number , result: any } | { action: "receiveError" , error: any , id: number }
When subscribing to the "debug" event on an Etherscan-based provider, the events receive a DebugEventEtherscanProvider payload.

 class EtherscanPlugin
inherits from NetworkPlugin
A Network can include an EtherscanPlugin to provide a custom base URL.

PROPERTIES
 <src>etherscanPlugin.baseUrl⇒ stringread-only
The Etherscan API base URL.

CREATING INSTANCES
 <src>new EtherscanPlugin(baseUrl: string)
Creates a new EtherscanProvider which will use baseUrl.

 class EtherscanProvider
inherits from AbstractProvider, Provider
The EtherscanBaseProvider is the super-class of EtherscanProvider, which should generally be used instead.

Since the EtherscanProvider includes additional code for Contract access, in rare cases that contracts are not used, this class can reduce code size.

PROPERTIES
 <src>etherscanProvider.apiKey⇒ null | stringread-only
The API key or null if using the community provided bandwidth.

 <src>etherscanProvider.network⇒ Networkread-only
The connected network.

CREATING INSTANCES
 <src>new EtherscanProvider(network?: Networkish, apiKey?: string)
Creates a new EtherscanBaseProvider.

METHODS
 <src>etherscanProvider._checkError(req: PerformActionRequest, error: Error, transaction: any)⇒ never
Throws the normalized Etherscan error.

 <src>etherscanProvider._getTransactionPostData(transaction: TransactionRequest)⇒ Record< string, string >
Returns transaction normalized for the Etherscan API.

 <src>etherscanProvider.detectNetwork()⇒ Promise< Network >
 <src>etherscanProvider.fetch(module: string, params: Record< string, any >, post?: boolean)⇒ Promise< any >
Resolves to the result of calling module with params.

If post, the request is made as a POST request.

 <src>etherscanProvider.getBaseUrl()⇒ string
Returns the base URL.

If an EtherscanPlugin is configured on the EtherscanBaseProvider_network, returns the plugin's baseUrl.

Deprecated; for Etherscan v2 the base is no longer a simply host, but instead a URL including a chainId parameter. Changing this to return a URL prefix could break some libraries, so it is left intact but will be removed in the future as it is unused.

 <src>etherscanProvider.getContract(address: string)⇒ Promise< null | Contract >
Resolves to a [Contract]] for address, using the Etherscan API to retreive the Contract ABI.

 <src>etherscanProvider.getEtherPrice()⇒ Promise< number >
Resolves to the current price of ether.

This returns 0 on any network other than mainnet.

 <src>etherscanProvider.getPostData(module: string, params: Record< string, any >)⇒ Record< string, any >
Returns the parameters for using POST requests.

 <src>etherscanProvider.getPostUrl()⇒ string
Returns the URL for using POST requests.

 <src>etherscanProvider.getUrl(module: string, params: Record< string, string >)⇒ string
Returns the URL for the module and params.

 <src>etherscanProvider.isCommunityResource()⇒ boolean
 INFURA
INFURA provides a third-party service for connecting to various blockchains over JSON-RPC.

Supported Networks


Ethereum Mainnet (mainnet)
Goerli Testnet (goerli)
Sepolia Testnet (sepolia)
Arbitrum (arbitrum)
Arbitrum Goerli Testnet (arbitrum-goerli)
Arbitrum Sepolia Testnet (arbitrum-sepolia)
Base (base)
Base Goerlia Testnet (base-goerli)
Base Sepolia Testnet (base-sepolia)
BNB Smart Chain Mainnet (bnb)
BNB Smart Chain Testnet (bnbt)
Linea (linea)
Linea Goerli Testnet (linea-goerli)
Linea Sepolia Testnet (linea-sepolia)
Optimism (optimism)
Optimism Goerli Testnet (optimism-goerli)
Optimism Sepolia Testnet (optimism-sepolia)
Polygon (matic)
Polygon Amoy Testnet (matic-amoy)
Polygon Mumbai Testnet (matic-mumbai)
 class InfuraProvider
inherits from JsonRpcProvider, CommunityResourcable
The InfuraProvider connects to the INFURA JSON-RPC end-points.

By default, a highly-throttled API key is used, which is appropriate for quick prototypes and simple scripts. To gain access to an increased rate-limit, it is highly recommended to sign up here.

PROPERTIES
 <src>infuraProvider.projectId⇒ stringread-only
The Project ID for the INFURA connection.

 <src>infuraProvider.projectSecret⇒ null | stringread-only
The Project Secret.

If null, no authenticated requests are made. This should not be used outside of private contexts.

CREATING INSTANCES
 <src>new InfuraProvider(network?: Networkish, projectId?: null | string, projectSecret?: null | string)
Creates a new InfuraProvider.

METHODS
 <src>infuraProvider._getProvider(chainId: number)⇒ AbstractProvider
STATIC METHODS
 <src>InfuraProvider.getRequest(network: Network, projectId?: null | string, projectSecret?: null | string)⇒ FetchRequest
Returns a prepared request for connecting to network with projectId and projectSecret.

 <src>InfuraProvider.getWebSocketProvider(network?: Networkish, projectId?: string)⇒ InfuraWebSocketProvider
Creates a new InfuraWebSocketProvider.

 class InfuraWebSocketProvider
inherits from WebSocketProvider, SocketProvider, CommunityResourcable
The InfuraWebSocketProvider connects to the INFURA WebSocket end-points.

By default, a highly-throttled API key is used, which is appropriate for quick prototypes and simple scripts. To gain access to an increased rate-limit, it is highly recommended to sign up here.

PROPERTIES
 <src>infuraWebSocketProvider.projectId⇒ stringread-only
The Project ID for the INFURA connection.

 <src>infuraWebSocketProvider.projectSecret⇒ null | stringread-only
The Project Secret.

If null, no authenticated requests are made. This should not be used outside of private contexts.

CREATING INSTANCES
 <src>new InfuraWebSocketProvider(network?: Networkish, projectId?: string)
Creates a new InfuraWebSocketProvider.

 Pocket
Pocket Network provides a third-party service for connecting to various blockchains over JSON-RPC.

Supported Networks


Ethereum Mainnet (mainnet)
Goerli Testnet (goerli)
Polygon (matic)
Arbitrum (arbitrum)
 class PocketProvider
inherits from JsonRpcProvider, CommunityResourcable
The PocketProvider connects to the Pocket Network JSON-RPC end-points.

By default, a highly-throttled API key is used, which is appropriate for quick prototypes and simple scripts. To gain access to an increased rate-limit, it is highly recommended to sign up here.

PROPERTIES
 <src>pocketProvider.applicationId⇒ stringread-only
The Application ID for the Pocket connection.

 <src>pocketProvider.applicationSecret⇒ null | stringread-only
The Application Secret for making authenticated requests to the Pocket connection.

CREATING INSTANCES
 <src>new PocketProvider(network?: Networkish, applicationId?: null | string, applicationSecret?: null | string)
Create a new PocketProvider.

By default connecting to mainnet with a highly throttled API key.

METHODS
 <src>pocketProvider._getProvider(chainId: number)⇒ AbstractProvider
STATIC METHODS
 <src>PocketProvider.getRequest(network: Network, applicationId?: null | string, applicationSecret?: null | string)⇒ FetchRequest
Returns a prepared request for connecting to network with applicationId.

 QuickNode
QuickNode provides a third-party service for connecting to various blockchains over JSON-RPC.

Supported Networks


Ethereum Mainnet (mainnet)
Goerli Testnet (goerli)
Sepolia Testnet (sepolia)
Holesky Testnet (holesky)
Arbitrum (arbitrum)
Arbitrum Goerli Testnet (arbitrum-goerli)
Arbitrum Sepolia Testnet (arbitrum-sepolia)
Base Mainnet (base);
Base Goerli Testnet (base-goerli);
Base Sepolia Testnet (base-sepolia);
BNB Smart Chain Mainnet (bnb)
BNB Smart Chain Testnet (bnbt)
Optimism (optimism)
Optimism Goerli Testnet (optimism-goerli)
Optimism Sepolia Testnet (optimism-sepolia)
Polygon (matic)
Polygon Mumbai Testnet (matic-mumbai)
 class QuickNodeProvider
inherits from JsonRpcProvider, CommunityResourcable
The QuickNodeProvider connects to the QuickNode JSON-RPC end-points.

By default, a highly-throttled API token is used, which is appropriate for quick prototypes and simple scripts. To gain access to an increased rate-limit, it is highly recommended to sign up here.

PROPERTIES
 <src>quickNodeProvider.token⇒ stringread-only
The API token.

CREATING INSTANCES
 <src>new QuickNodeProvider(network?: Networkish, token?: null | string)
Creates a new QuickNodeProvider.

METHODS
 <src>quickNodeProvider._getProvider(chainId: number)⇒ AbstractProvider
STATIC METHODS
 <src>QuickNodeProvider.getRequest(network: Network, token?: null | string)⇒ FetchRequest
Returns a new request prepared for network and the token.

 Transactions
Each state-changing operation on Ethereum requires a transaction.

TYPES
 <src>AccessList⇒ Array< AccessListEntry >
An ordered collection of AccessList entries.

 <src>AccessListEntry⇒ { address: string , storageKeys: Array< string > }
A single AccessList entry of storage keys (slots) for an address.

 <src>AccessListish⇒ AccessList | Array< tuple< string, Array< string > > > | Record< string, Array< string > >
Any ethers-supported access list structure.

 <src>AuthorizationLike⇒ { address: string , chainId: BigNumberish , nonce: BigNumberish , signature: SignatureLike }
 <src>BlobLike⇒ BytesLike | { commitment: BytesLike , data: BytesLike , proof: BytesLike }
A BLOb object that can be passed for EIP-4844 transactions.

It may have had its commitment and proof already provided or rely on an attached KzgLibrary to compute them.

 <src>KzgLibraryLike⇒ KzgLibrary | { blobToKZGCommitment: (blob: string) => string , computeBlobKZGProof: (blob: string, commitment: string) => string } | { blobToKzgCommitment: (blob: string) => string | Uint8Array , computeBlobProof: (blob: string, commitment: string) => string | Uint8Array }
A KZG Library with any of the various API configurations. As the library is still experimental and the API is not stable, depending on the version used the method names and signatures are still in flux.

This allows any of the versions to be passed into Transaction while providing a stable external API.

FUNCTIONS
 <src>accessListify(value: AccessListish)⇒ AccessList
Returns a AccessList from any ethers-supported access-list structure.

 <src>authorizationify(auth: AuthorizationLike)⇒ Authorization
 <src>computeAddress(key: string | SigningKey)⇒ string
Returns the address for the key.

The key may be any standard form of public key or a private key.

 <src>recoverAddress(digest: BytesLike, signature: SignatureLike)⇒ string
Returns the recovered address for the private key that was used to sign digest that resulted in signature.

 interface Authorization
PROPERTIES
 <src>authorization.address⇒ string
 <src>authorization.chainId⇒ bigint
 <src>authorization.nonce⇒ bigint
 <src>authorization.signature⇒ Signature
 interface Blob
A full-valid BLOb object for EIP-4844 transactions.

The commitment and proof should have been computed using a KZG library.

PROPERTIES
 <src>blob.commitment⇒ string
The BLOb commitment.

 <src>blob.data⇒ string
The blob data.

 <src>blob.proof⇒ string
A EIP-4844 BLOb uses a string proof, while EIP-7594 use an array of strings representing the cells of the proof.

 interface KzgLibrary
A KZG Library with the necessary functions to compute BLOb commitments and proofs.

PROPERTIES
 <src>kzgLibrary.blobToKzgCommitment⇒ (blob: Uint8Array) => Uint8Array
 <src>kzgLibrary.computeBlobKzgProof⇒ (blob: Uint8Array, commitment: Uint8Array) => Uint8Array
 class Transaction
A Transaction describes an operation to be executed on Ethereum by an Externally Owned Account (EOA). It includes who (the to address), what (the data) and how much (the value in ether) the operation should entail.

tx = new Transaction()
// Transaction { to: null, data: "0x1234", nonce: 0, gasLimit: 0, value: 0, chainId: 0 }

tx.data = "0x1234";
// '0x1234'
PROPERTIES
 <src>transaction.accessList⇒ null | AccessList
The access list.

An access list permits discounted (but pre-paid) access to bytecode and state variable access within contract execution.

 <src>transaction.authorizationList⇒ null | Array< Authorization >
 <src>transaction.blobs⇒ null | Array< Blob >
The BLObs for the Transaction, if any.

If blobs is non-null, then the seriailized will return the network formatted sidecar, otherwise it will return the standard EIP-2718 payload. The unsignedSerialized is unaffected regardless.

When setting blobs, either fully valid Blob objects may be specified (i.e. correctly padded, with correct committments and proofs) or a raw BytesLike may be provided.

If raw BytesLike are provided, the kzg property must be already set. The blob will be correctly padded and the KzgLibrary will be used to compute the committment and proof for the blob.

A BLOb is a sequence of field elements, each of which must be within the BLS field modulo, so some additional processing may be required to encode arbitrary data to ensure each 32 byte field is within the valid range.

Setting this automatically populates blobVersionedHashes, overwriting any existing values. Setting this to null does not remove the blobVersionedHashes, leaving them present.

 <src>transaction.blobVersionedHashes⇒ null | Array< string >
The BLOb versioned hashes for Cancun transactions.

 <src>transaction.blobWrapperVersion⇒ null | number
 <src>transaction.chainId⇒ bigint
The chain ID this transaction is valid on.

 <src>transaction.data⇒ string
The transaction data. For init transactions this is the deployment code.

 <src>transaction.from⇒ null | stringread-only
The sending address, if signed. Otherwise, null.

 <src>transaction.fromPublicKey⇒ null | stringread-only
The public key of the sender, if signed. Otherwise, null.

 <src>transaction.gasLimit⇒ bigint
The gas limit.

 <src>transaction.gasPrice⇒ null | bigint
The gas price.

On legacy networks this defines the fee that will be paid. On EIP-1559 networks, this should be null.

 <src>transaction.hash⇒ null | stringread-only
The transaction hash, if signed. Otherwise, null.

 <src>transaction.kzg⇒ null | KzgLibrary
 <src>transaction.maxFeePerBlobGas⇒ null | bigint
The max fee per blob gas for Cancun transactions.

 <src>transaction.maxFeePerGas⇒ null | bigint
The maximum total fee per unit of gas to pay. On legacy networks this should be null.

 <src>transaction.maxPriorityFeePerGas⇒ null | bigint
The maximum priority fee per unit of gas to pay. On legacy networks this should be null.

 <src>transaction.nonce⇒ number
The transaction nonce.

 <src>transaction.serialized⇒ stringread-only
The serialized transaction.

This throws if the transaction is unsigned. For the pre-image, use unsignedSerialized.

 <src>transaction.signature⇒ null | Signature
If signed, the signature for this transaction.

 <src>transaction.to⇒ null | string
The to address for the transaction or null if the transaction is an init transaction.

 <src>transaction.type⇒ null | number
The transaction type.

If null, the type will be automatically inferred based on explicit properties.

 <src>transaction.typeName⇒ null | stringread-only
The name of the transaction type.

 <src>transaction.unsignedHash⇒ stringread-only
The pre-image hash of this transaction.

This is the digest that a Signer must sign to authorize this transaction.

 <src>transaction.unsignedSerialized⇒ stringread-only
The transaction pre-image.

The hash of this is the digest which needs to be signed to authorize this transaction.

 <src>transaction.value⇒ bigint
The amount of ether (in wei) to send in this transactions.

CREATING INSTANCES
 <src>new Transaction()
Creates a new Transaction with default values.

 <src>Transaction.from(tx?: string | TransactionLike < string >)⇒ Transaction
Create a Transaction from a serialized transaction or a Transaction-like object.

METHODS
 <src>transaction.clone()⇒ Transaction
Create a copy of this transaciton.

 <src>transaction.inferType()⇒ number
Return the most "likely" type; currently the highest supported transaction type.

 <src>transaction.inferTypes()⇒ Array< number >
Validates the explicit properties and returns a list of compatible transaction types.

 <src>transaction.inspect()⇒ string
 <src>transaction.isBerlin()⇒ boolean
Returns true if this transaction is berlin hardform transaction (i.e. type === 1).

This provides a Type Guard that the related properties are non-null.

 <src>transaction.isCancun()⇒ boolean
Returns true if this transaction is an EIP-4844 BLOB transaction.

This provides a Type Guard that the related properties are non-null.

 <src>transaction.isLegacy()⇒ boolean
Returns true if this transaction is a legacy transaction (i.e. type === 0).

This provides a Type Guard that the related properties are non-null.

 <src>transaction.isLondon()⇒ boolean
Returns true if this transaction is london hardform transaction (i.e. type === 2).

This provides a Type Guard that the related properties are non-null.

 <src>transaction.isSigned()⇒ boolean
Returns true if signed.

This provides a Type Guard that properties requiring a signed transaction are non-null.

 <src>transaction.isValid()⇒ boolean
 <src>transaction.toJSON()⇒ any
Return a JSON-friendly object.

 <src>transaction.toString()⇒ string
 interface TransactionLike
A TransactionLike is an object which is appropriate as a loose input for many operations which will populate missing properties of a transaction.

PROPERTIES
 <src>transactionLike.accessList⇒ null | AccessListish
The access list for berlin and london transactions.

 <src>transactionLike.authorizationList⇒ null | Array< Authorization >
The EIP-7702 authorizations (if any).

 <src>transactionLike.blobs⇒ null | Array< BlobLike >
The blobs (if any) attached to this transaction (see EIP-4844).

 <src>transactionLike.blobVersionedHashes⇒ null | Array< string >
The versioned hashes (see EIP-4844).

 <src>transactionLike.blobWrapperVersion⇒ null | number
The EIP-7594 BLOb Wrapper Version used for PeerDAS.

For networks that use EIP-7594, this property is required to serialize the sidecar correctly.

 <src>transactionLike.chainId⇒ null | BigNumberish
The chain ID the transaction is valid on.

 <src>transactionLike.data⇒ null | string
The data.

 <src>transactionLike.from⇒ null | A
The sender.

 <src>transactionLike.gasLimit⇒ null | BigNumberish
The maximum amount of gas that can be used.

 <src>transactionLike.gasPrice⇒ null | BigNumberish
The gas price for legacy and berlin transactions.

 <src>transactionLike.hash⇒ null | string
The transaction hash.

 <src>transactionLike.kzg⇒ null | KzgLibraryLike
An external library for computing the KZG commitments and proofs necessary for EIP-4844 transactions (see EIP-4844).

This is generally null, unless you are creating BLOb transactions.

 <src>transactionLike.maxFeePerBlobGas⇒ null | BigNumberish
The maximum fee per blob gas (see EIP-4844).

 <src>transactionLike.maxFeePerGas⇒ null | BigNumberish
The maximum total fee per gas for london transactions.

 <src>transactionLike.maxPriorityFeePerGas⇒ null | BigNumberish
The maximum priority fee per gas for london transactions.

 <src>transactionLike.nonce⇒ null | number
The nonce.

 <src>transactionLike.signature⇒ null | SignatureLike
The signature provided by the sender.

 <src>transactionLike.to⇒ null | A
The recipient address or null for an init transaction.

 <src>transactionLike.type⇒ null | number
The type.

 <src>transactionLike.value⇒ null | BigNumberish
The value (in wei) to send.

 Utilities
There are many simple utilities required to interact with Ethereum and to simplify the library, without increasing the library dependencies for simple functions.

 Base58 Encoding
The Base58 Encoding scheme allows a numeric value to be encoded as a compact string using a radix of 58 using only alpha-numeric characters. Confusingly similar characters are omitted (i.e. "l0O").

Note that Base58 encodes a numeric value, not arbitrary bytes, since any zero-bytes on the left would get removed. To mitigate this issue most schemes that use Base58 choose specific high-order values to ensure non-zero prefixes.

FUNCTIONS
 <src>decodeBase58(value: string)⇒ bigint
Decode the Base58-encoded value.

 <src>encodeBase58(value: BytesLike)⇒ string
Encode value as a Base58-encoded string.

 Base64 Encoding
Base64 encoding using 6-bit words to encode arbitrary bytes into a string using 65 printable symbols, the upper-case and lower-case alphabet, the digits 0 through 9, "+" and "/" with the "=" used for padding.

FUNCTIONS
 <src>decodeBase64(value: string)⇒ Uint8Array
Decodes the base-64 encoded value.

// The decoded value is always binary data...
result = decodeBase64("SGVsbG8gV29ybGQhIQ==")
// Uint8Array(13) [
//    72, 101, 108, 108, 111,
//    32,  87, 111, 114, 108,
//   100,  33,  33
// ]

// ...use toUtf8String to convert it to a string.
toUtf8String(result)
// 'Hello World!!'

// Decoding binary data
decodeBase64("EjQ=")
// Uint8Array(2) [ 18, 52 ]
 <src>encodeBase64(data: BytesLike)⇒ string
Encodes data as a base-64 encoded string.

// Encoding binary data as a hexstring
encodeBase64("0x1234")
// 'EjQ='

// Encoding binary data as a Uint8Array
encodeBase64(new Uint8Array([ 0x12, 0x34 ]))
// 'EjQ='

// The input MUST be data...
encodeBase64("Hello World!!")
// Error("invalid BytesLike value", {
//   code: "INVALID_ARGUMENT"
//   argument: "value"
//   value: "Hello World!!"
//   shortMessage: "invalid BytesLike value"
// })

// ...use toUtf8Bytes for this.
encodeBase64(toUtf8Bytes("Hello World!!"))
// 'SGVsbG8gV29ybGQhIQ=='
 Data Helpers
Some data helpers.

TYPES
 <src>BytesLike⇒ DataHexString | Uint8Array
An object that can be used to represent binary data.

 <src>DataHexString⇒ string
A HexString whose length is even, which ensures it is a valid representation of binary data.

 <src>HexString⇒ string
A string which is prefixed with 0x and followed by any number of case-agnostic hexadecimal characters.

It must match the regular expression /0x[0-9A-Fa-f]*/.

FUNCTIONS
 <src>concat(datas: ReadonlyArray< BytesLike >)⇒ string
Returns a DataHexString by concatenating all values within data.

 <src>dataLength(data: BytesLike)⇒ number
Returns the length of data, in bytes.

 <src>dataSlice(data: BytesLike, start?: number, end?: number)⇒ string
Returns a DataHexString by slicing data from the start offset to the end offset.

By default start is 0 and end is the length of data.

 <src>getBytes(value: BytesLike, name?: string)⇒ Uint8Array
Get a typed Uint8Array for value. If already a Uint8Array the original value is returned; if a copy is required use getBytesCopy.

 <src>getBytesCopy(value: BytesLike, name?: string)⇒ Uint8Array
Get a typed Uint8Array for value, creating a copy if necessary to prevent any modifications of the returned value from being reflected elsewhere.

 <src>hexlify(data: BytesLike)⇒ string
Returns a DataHexString representation of data.

 <src>isBytesLike(value: any)⇒ boolean
Returns true if value is a valid representation of arbitrary data (i.e. a valid DataHexString or a Uint8Array).

 <src>isHexString(value: any, length?: number | boolean)⇒ boolean
Returns true if value is a valid HexString.

If length is true or a number, it also checks that value is a valid DataHexString of length (if a number) bytes of data (e.g. 0x1234 is 2 bytes).

 <src>stripZerosLeft(data: BytesLike)⇒ string
Return the DataHexString result by stripping all leading * zero bytes from data.

 <src>zeroPadBytes(data: BytesLike, length: number)⇒ string
Return the DataHexString of data padded on the right to length bytes.

If data already exceeds length, a BufferOverrunError is thrown.

This pads data the same as bytes are in Solidity (e.g. bytes16).

 <src>zeroPadValue(data: BytesLike, length: number)⇒ string
Return the DataHexString of data padded on the left to length bytes.

If data already exceeds length, a BufferOverrunError is thrown.

This pads data the same as values are in Solidity (e.g. uint128).

 Math Helpers
Some mathematic operations.

TYPES
 <src>BigNumberish⇒ string | Numeric
Any type that can be used where a big number is needed.

 <src>Numeric⇒ number | bigint
Any type that can be used where a numeric value is needed.

FUNCTIONS
 <src>fromTwos(value: BigNumberish, width: Numeric)⇒ bigint
Convert value from a twos-compliment representation of width bits to its value.

If the highest bit is 1, the result will be negative.

 <src>getBigInt(value: BigNumberish, name?: string)⇒ bigint
Gets a BigInt from value. If it is an invalid value for a BigInt, then an ArgumentError will be thrown for name.

 <src>getNumber(value: BigNumberish, name?: string)⇒ number
Gets a number from value. If it is an invalid value for a number, then an ArgumentError will be thrown for name.

 <src>getUint(value: BigNumberish, name?: string)⇒ bigint
Returns value as a bigint, validating it is valid as a bigint value and that it is positive.

 <src>mask(value: BigNumberish, bits: Numeric)⇒ bigint
Mask value with a bitmask of bits ones.

 <src>toBeArray(value: BigNumberish, width?: Numeric)⇒ Uint8Array
Converts value to a Big Endian Uint8Array.

 <src>toBeHex(value: BigNumberish, width?: Numeric)⇒ string
Converts value to a Big Endian hexstring, optionally padded to width bytes.

 <src>toBigInt(value: BigNumberish | Uint8Array)⇒ bigint
 <src>toNumber(value: BigNumberish | Uint8Array)⇒ number
Converts value to a number. If value is a Uint8Array, it is treated as Big Endian data. Throws if the value is not safe.

 <src>toQuantity(value: BytesLike | BigNumberish)⇒ string
Returns a HexString for value safe to use as a Quantity.

A Quantity does not have and leading 0 values unless the value is the literal value `0x0`. This is most commonly used for JSSON-RPC numeric values.

 <src>toTwos(value: BigNumberish, width: Numeric)⇒ bigint
Convert value to a twos-compliment representation of width bits.

The result will always be positive.

 Properties
Property helper functions.

FUNCTIONS
 <src>defineProperties(target: T, values: TODO(A4BRecord<@TODO-005: @TODO-006>), types?: TODO(A4BRecord<@TODO-005: @TODO-006>))⇒ void
Assigns the values to target as read-only values.

It types is specified, the values are checked.

 <src>resolveProperties(value: TODO(A4BRecord<@TODO-005: @TODO-006>))⇒ Promise< T >
Resolves to a new object that is a copy of value, but with all values resolved.

 Recursive-Length Prefix
The Recursive-Length Prefix (RLP) encoding is used throughout Ethereum to serialize nested structures of Arrays and data.

TYPES
 <src>RlpStructuredData⇒ string | Array< RlpStructuredData >
An RLP-encoded structure.

 <src>RlpStructuredDataish⇒ string | Uint8Array | Array< RlpStructuredDataish >
An RLP-encoded structure, which allows Uint8Array.

FUNCTIONS
 <src>decodeRlp(data: BytesLike)⇒ RlpStructuredData
Decodes data into the structured data it represents.

 <src>encodeRlp(object: RlpStructuredDataish)⇒ string
Encodes object as an RLP-encoded DataHexString.

 Strings and UTF-8
Using strings in Ethereum (or any security-basd system) requires additional care. These utilities attempt to mitigate some of the safety issues as well as provide the ability to recover and analyse strings.

CONSTANTS
 <src>Utf8ErrorFuncs⇒ Record< "error" | "ignore" | "replace", Utf8ErrorFunc >
A handful of popular, built-in UTF-8 error handling strategies.

"error" - throws on ANY illegal UTF-8 sequence or non-canonical (overlong) codepoints (this is the default)

"ignore" - silently drops any illegal UTF-8 sequence and accepts non-canonical (overlong) codepoints

"replace" - replace any illegal UTF-8 sequence with the UTF-8 replacement character (i.e. "\ufffd") and accepts non-canonical (overlong) codepoints

TYPES
 <src>UnicodeNormalizationForm⇒ "NFC" | "NFD" | "NFKC" | "NFKD"
The stanard normalization forms.

 <src>Utf8ErrorFunc⇒ (reason: Utf8ErrorReason, offset: number, bytes: Uint8Array, output: Array< number >, badCodepoint?: number) => number
A callback that can be used with toUtf8String to analysis or recovery from invalid UTF-8 data.

Parsing UTF-8 data is done through a simple Finite-State Machine (FSM) which calls the Utf8ErrorFunc if a fault is detected.

The reason indicates where in the FSM execution the fault occurred and the offset indicates where the input failed.

The bytes represents the raw UTF-8 data that was provided and output is the current array of UTF-8 code-points, which may be updated by the Utf8ErrorFunc.

The value of the badCodepoint depends on the reason. See Utf8ErrorReason for details.

The function should return the number of bytes that should be skipped when control resumes to the FSM.

 <src>Utf8ErrorReason⇒ string
When using the UTF-8 error API the following errors can be intercepted and processed as the reason passed to the Utf8ErrorFunc.

"UNEXPECTED_CONTINUE" - a continuation byte was present where there was nothing to continue.

"BAD_PREFIX" - an invalid (non-continuation) byte to start a UTF-8 codepoint was found.

"OVERRUN" - the string is too short to process the expected codepoint length.

"MISSING_CONTINUE" - a missing continuation byte was expected but not found. The offset indicates the index the continuation byte was expected at.

"OUT_OF_RANGE" - the computed code point is outside the range for UTF-8. The badCodepoint indicates the computed codepoint, which was outside the valid UTF-8 range.

"UTF16_SURROGATE" - the UTF-8 strings contained a UTF-16 surrogate pair. The badCodepoint is the computed codepoint, which was inside the UTF-16 surrogate range.

"OVERLONG" - the string is an overlong representation. The badCodepoint indicates the computed codepoint, which has already been bounds checked.

FUNCTIONS
 <src>toUtf8Bytes(str: string, form?: UnicodeNormalizationForm)⇒ Uint8Array
Returns the UTF-8 byte representation of str.

If form is specified, the string is normalized.

 <src>toUtf8CodePoints(str: string, form?: UnicodeNormalizationForm)⇒ Array< number >
Returns the UTF-8 code-points for str.

If form is specified, the string is normalized.

 <src>toUtf8String(bytes: BytesLike, onError?: Utf8ErrorFunc)⇒ string
Returns the string represented by the UTF-8 data bytes.

When onError function is specified, it is called on UTF-8 errors allowing recovery using the Utf8ErrorFunc API. (default: error)

 Unit Conversion
Most interactions with Ethereum requires integer values, which use the smallest magnitude unit.

For example, imagine dealing with dollars and cents. Since dollars are divisible, non-integer values are possible, such as $10.77. By using the smallest indivisible unit (i.e. cents), the value can be kept as the integer 1077.

When receiving decimal input from the user (as a decimal string), the value should be converted to an integer and when showing a user a value, the integer value should be converted to a decimal string.

This creates a clear distinction, between values to be used by code (integers) and values used for display logic to users (decimals).

The native unit in Ethereum, ether is divisible to 18 decimal places, where each individual unit is called a wei.

FUNCTIONS
 <src>formatEther(wei: BigNumberish)⇒ string
Converts value into a decimal string using 18 decimal places.

 <src>formatUnits(value: BigNumberish, unit?: string | Numeric)⇒ string
Converts value into a decimal string, assuming unit decimal places. The unit may be the number of decimal places or the name of a unit (e.g. "gwei" for 9 decimal places).

 <src>parseEther(ether: string)⇒ bigint
Converts the decimal string ether to a BigInt, using 18 decimal places.

 <src>parseUnits(value: string, unit?: string | Numeric)⇒ bigint
Converts the decimal string value to a BigInt, assuming unit decimal places. The unit may the number of decimal places or the name of a unit (e.g. "gwei" for 9 decimal places).

 UUID
Explain UUID and link to RFC here.

FUNCTIONS
 <src>uuidV4(randomBytes: BytesLike)⇒ string
Returns the version 4 UUID for the randomBytes.

 Errors
All errors in ethers include properties to ensure they are both human-readable (i.e. .message) and machine-readable (i.e. .code).

The isError function can be used to check the error code and provide a type guard for the properties present on that error interface.

TYPES
 <src>CallExceptionAction⇒ "call" | "estimateGas" | "getTransactionResult" | "sendTransaction" | "unknown"
The action that resulted in the call exception.

 <src>CallExceptionTransaction⇒ { data: string , from?: string , to: null | string }
The related transaction that caused the error.

 <src>CodedEthersError⇒ TODO(A1Bconditional(@TODO-000))
A conditional type that transforms the ErrorCode T into its EthersError type.

 <src>ErrorCode⇒ "UNKNOWN_ERROR" | "NOT_IMPLEMENTED" | "UNSUPPORTED_OPERATION" | "NETWORK_ERROR" | "SERVER_ERROR" | "TIMEOUT" | "BAD_DATA" | "CANCELLED" | "BUFFER_OVERRUN" | "NUMERIC_FAULT" | "INVALID_ARGUMENT" | "MISSING_ARGUMENT" | "UNEXPECTED_ARGUMENT" | "VALUE_MISMATCH" | "CALL_EXCEPTION" | "INSUFFICIENT_FUNDS" | "NONCE_EXPIRED" | "REPLACEMENT_UNDERPRICED" | "TRANSACTION_REPLACED" | "UNCONFIGURED_NAME" | "OFFCHAIN_FAULT" | "ACTION_REJECTED"
All errors emitted by ethers have an ErrorCode to help identify and coalesce errors to simplify programmatic analysis.

Each ErrorCode is the code proerty of a coresponding EthersError.

Generic Errors

"UNKNOWN_ERROR" - see UnknownError

"NOT_IMPLEMENTED" - see NotImplementedError

"UNSUPPORTED_OPERATION" - see UnsupportedOperationError

"NETWORK_ERROR" - see NetworkError

"SERVER_ERROR" - see ServerError

"TIMEOUT" - see TimeoutError

"BAD_DATA" - see BadDataError

"CANCELLED" - see CancelledError

Operational Errors

"BUFFER_OVERRUN" - see BufferOverrunError

"NUMERIC_FAULT" - see NumericFaultError

Argument Errors

"INVALID_ARGUMENT" - see InvalidArgumentError

"MISSING_ARGUMENT" - see MissingArgumentError

"UNEXPECTED_ARGUMENT" - see UnexpectedArgumentError

"VALUE_MISMATCH" - unused

Blockchain Errors

"CALL_EXCEPTION" - see CallExceptionError

"INSUFFICIENT_FUNDS" - see InsufficientFundsError

"NONCE_EXPIRED" - see NonceExpiredError

"REPLACEMENT_UNDERPRICED" - see ReplacementUnderpricedError

"TRANSACTION_REPLACED" - see TransactionReplacedError

"UNCONFIGURED_NAME" - see UnconfiguredNameError

"OFFCHAIN_FAULT" - see OffchainFaultError

User Interaction Errors

"ACTION_REJECTED" - see ActionRejectedError

 <src>ErrorInfo⇒ Omit< T, "code" | "name" | "message" | "shortMessage" > & { shortMessage?: string }
An error may contain additional properties, but those must not conflict with any implicit properties.

FUNCTIONS
 <src>assert(check: unknown, message: string, code: K, info?: ErrorInfo < T >)⇒ boolean
Throws an EthersError with message, code and additional error info when check is falsish..

 <src>assertArgument(check: unknown, message: string, name: string, value: unknown)⇒ boolean
A simple helper to simply ensuring provided arguments match expected constraints, throwing if not.

In TypeScript environments, the check has been asserted true, so any further code does not need additional compile-time checks.

 <src>assertArgumentCount(count: number, expectedCount: number, message?: string)⇒ void
 <src>assertNormalize(form: string)⇒ void
Throws if the normalization form is not supported.

 <src>assertPrivate(givenGuard: any, guard: any, className?: string)⇒ void
Many classes use file-scoped values to guard the constructor, making it effectively private. This facilitates that pattern by ensuring the givenGaurd matches the file-scoped guard, throwing if not, indicating the className if provided.

 <src>isCallException(error: any)⇒ boolean
Returns true if error is a [[CallExceptionError].

 <src>isError(error: any, code: K)⇒ boolean
Returns true if the error matches an error thrown by ethers that matches the error code.

In TypeScript environments, this can be used to check that error matches an EthersError type, which means the expected properties will be set.

try {
  // code....
} catch (e) {
  if (isError(e, "CALL_EXCEPTION")) {
      // The Type Guard has validated this object
      console.log(e.data);
  }
}
 <src>makeError(message: string, code: K, info?: ErrorInfo < T >)⇒ T
Returns a new Error configured to the format ethers emits errors, with the message, [[api:ErrorCode]] code and additional properties for the corresponding EthersError.

Each error in ethers includes the version of ethers, a machine-readable ErrorCode, and depending on code, additional required properties. The error message will also include the message, ethers version, code and all additional properties, serialized.

 interface ActionRejectedError
inherits from EthersError
This Error indicates a request was rejected by the user.

In most clients (such as MetaMask), when an operation requires user authorization (such as signer.sendTransaction), the client presents a dialog box to the user. If the user denies the request this error is thrown.

PROPERTIES
 <src>actionRejectedError.action⇒ "requestAccess" | "sendTransaction" | "signMessage" | "signTransaction" | "signTypedData" | "unknown"
The requested action.

 <src>actionRejectedError.reason⇒ "expired" | "rejected" | "pending"
The reason the action was rejected.

If there is already a pending request, some clients may indicate there is already a "pending" action. This prevents an app from spamming the user.

 interface BadDataError
inherits from EthersError
This Error indicates that a provided set of data cannot be correctly interpreted.

PROPERTIES
 <src>badDataError.value⇒ any
The data.

 interface BufferOverrunError
inherits from EthersError
This Error indicates an attempt was made to read outside the bounds of protected data.

Most operations in Ethers are protected by bounds checks, to mitigate exploits when parsing data.

PROPERTIES
 <src>bufferOverrunError.buffer⇒ Uint8Array
The buffer that was overrun.

 <src>bufferOverrunError.length⇒ number
The length of the buffer.

 <src>bufferOverrunError.offset⇒ number
The offset that was requested.

 interface CallExceptionError
inherits from EthersError
This Error indicates a transaction reverted.

PROPERTIES
 <src>callExceptionError.action⇒ CallExceptionAction
The action being performed when the revert was encountered.

 <src>callExceptionError.data⇒ null | string
The revert data returned.

 <src>callExceptionError.invocation⇒ null | { args: Array< any > , method: string , signature: string }
The contract invocation details, if available.

 <src>callExceptionError.reason⇒ null | string
A human-readable representation of data, if possible.

 <src>callExceptionError.receipt⇒ TransactionReceipt
If the error occurred in a transaction that was mined (with a status of 0), this is the receipt.

 <src>callExceptionError.revert⇒ null | { args: Array< any > , name: string , signature: string }
The built-in or custom revert error, if available

 <src>callExceptionError.transaction⇒ CallExceptionTransaction
The transaction that triggered the exception.

 interface CancelledError
inherits from EthersError
This Error indicates that the operation was cancelled by a programmatic call, for example to cancel().

 interface EthersError
All errors in Ethers include properties to assist in machine-readable errors.

PROPERTIES
 <src>ethersError.code⇒ ErrorCode
The string error code.

 <src>ethersError.error⇒ Error
Any related error.

 <src>ethersError.info⇒ Record< string, any >
Additional info regarding the error that may be useful.

This is generally helpful mostly for human-based debugging.

 <src>ethersError.shortMessage⇒ string
A short message describing the error, with minimal additional details.

 interface InsufficientFundsError
inherits from EthersError
The sending account has insufficient funds to cover the entire transaction cost.

PROPERTIES
 <src>insufficientFundsError.transaction⇒ TransactionRequest
The transaction.

 interface InvalidArgumentError
inherits from EthersError
This Error indicates an incorrect type or value was passed to a function or method.

PROPERTIES
 <src>invalidArgumentError.argument⇒ string
The name of the argument.

 <src>invalidArgumentError.info⇒ Record< string, any >
 <src>invalidArgumentError.value⇒ any
The value that was provided.

 interface MissingArgumentError
inherits from EthersError
This Error indicates there were too few arguments were provided.

PROPERTIES
 <src>missingArgumentError.count⇒ number
The number of arguments received.

 <src>missingArgumentError.expectedCount⇒ number
The number of arguments expected.

 interface NetworkError
inherits from EthersError
This Error indicates a problem connecting to a network.

PROPERTIES
 <src>networkError.event⇒ string
The network event.

 interface NonceExpiredError
inherits from EthersError
The sending account has already used this nonce in a transaction that has been included.

PROPERTIES
 <src>nonceExpiredError.transaction⇒ TransactionRequest
The transaction.

 interface NotImplementedError
inherits from EthersError
This Error is mostly used as a stub for functionality that is intended for the future, but is currently not implemented.

PROPERTIES
 <src>notImplementedError.operation⇒ string
The attempted operation.

 interface NumericFaultError
inherits from EthersError
This Error indicates an operation which would result in incorrect arithmetic output has occurred.

For example, trying to divide by zero or using a uint8 to store a negative value.

PROPERTIES
 <src>numericFaultError.fault⇒ string
The fault reported.

 <src>numericFaultError.operation⇒ string
The attempted operation.

 <src>numericFaultError.value⇒ any
The value the operation was attempted against.

 interface OffchainFaultError
inherits from EthersError
A CCIP-read exception, which cannot be recovered from or be further processed.

PROPERTIES
 <src>offchainFaultError.reason⇒ string
The reason the CCIP-read failed.

 <src>offchainFaultError.transaction⇒ TransactionRequest
The transaction.

 interface ReplacementUnderpricedError
inherits from EthersError
An attempt was made to replace a transaction, but with an insufficient additional fee to afford evicting the old transaction from the memory pool.

PROPERTIES
 <src>replacementUnderpricedError.transaction⇒ TransactionRequest
The transaction.

 interface ServerError
inherits from EthersError
This Error indicates there was a problem fetching a resource from a server.

PROPERTIES
 <src>serverError.request⇒ FetchRequest | string
The requested resource.

 <src>serverError.response⇒ FetchResponse
The response received from the server, if available.

 interface TimeoutError
inherits from EthersError
This Error indicates that the timeout duration has expired and that the operation has been implicitly cancelled.

The side-effect of the operation may still occur, as this generally means a request has been sent and there has simply been no response to indicate whether it was processed or not.

PROPERTIES
 <src>timeoutError.operation⇒ string
The attempted operation.

 <src>timeoutError.reason⇒ string
The reason.

 <src>timeoutError.request⇒ FetchRequest
The resource request, if available.

 interface TransactionReplacedError
inherits from EthersError
A pending transaction was replaced by another.

PROPERTIES
 <src>transactionReplacedError.cancelled⇒ boolean
If the transaction was cancelled, such that the original effects of the transaction cannot be assured.

 <src>transactionReplacedError.hash⇒ string
The hash of the replaced transaction.

 <src>transactionReplacedError.reason⇒ "repriced" | "cancelled" | "replaced"
The reason the transaction was replaced.

 <src>transactionReplacedError.receipt⇒ TransactionReceipt
The receipt of the transaction that replace the transaction.

 <src>transactionReplacedError.replacement⇒ TransactionResponse
The transaction that replaced the transaction.

 interface UnconfiguredNameError
inherits from EthersError
This Error indicates an ENS name was used, but the name has not been configured.

This could indicate an ENS name is unowned or that the current address being pointed to is the ZeroAddress.

PROPERTIES
 <src>unconfiguredNameError.value⇒ string
The ENS name that was requested

 interface UnexpectedArgumentError
inherits from EthersError
This Error indicates too many arguments were provided.

PROPERTIES
 <src>unexpectedArgumentError.count⇒ number
The number of arguments received.

 <src>unexpectedArgumentError.expectedCount⇒ number
The number of arguments expected.

 interface UnknownError
inherits from EthersError
This Error is a catch-all for when there is no way for Ethers to know what the underlying problem is.

 interface UnsupportedOperationError
inherits from EthersError
This Error indicates that the attempted operation is not supported.

This could range from a specific JSON-RPC end-point not supporting a feature to a specific configuration of an object prohibiting the operation.

For example, a Wallet with no connected Provider is unable to send a transaction.

PROPERTIES
 <src>unsupportedOperationError.operation⇒ string
The attempted operation.

 Events
Events allow for applications to use the observer pattern, which allows subscribing and publishing events, outside the normal execution paths.

TYPES
 <src>Listener⇒ (args: Array< any >) => void
A callback function called when a an event is triggered.

 interface EventEmitterable
An EventEmitterable behaves similar to an EventEmitter except provides async access to its methods.

An EventEmitter implements the observer pattern.

METHODS
 <src>eventEmitterable.addListener(event: T, listener: Listener)⇒ Promise< this >
Alias for on.

 <src>eventEmitterable.emit(event: T, args: Array< any >)⇒ Promise< boolean >
Triggers each listener for event with the args.

 <src>eventEmitterable.listenerCount(event?: T)⇒ Promise< number >
Resolves to the number of listeners for event.

 <src>eventEmitterable.listeners(event?: T)⇒ Promise< Array< Listener > >
Resolves to the listeners for event.

 <src>eventEmitterable.off(event: T, listener?: Listener)⇒ Promise< this >
Unregister the listener for event. If listener is unspecified, all listeners are unregistered.

 <src>eventEmitterable.on(event: T, listener: Listener)⇒ Promise< this >
Registers a listener that is called whenever the event occurs until unregistered.

 <src>eventEmitterable.once(event: T, listener: Listener)⇒ Promise< this >
Registers a listener that is called the next time event occurs.

 <src>eventEmitterable.removeAllListeners(event?: T)⇒ Promise< this >
Unregister all listeners for event.

 <src>eventEmitterable.removeListener(event: T, listener: Listener)⇒ Promise< this >
Alias for off.

 class EventPayload
When an EventEmitterable triggers a Listener, the callback always ahas one additional argument passed, which is an EventPayload.

PROPERTIES
 <src>eventPayload.emitter⇒ EventEmitterable < T >read-only
The EventEmitterable.

 <src>eventPayload.filter⇒ Tread-only
The event filter.

CREATING INSTANCES
 <src>new EventPayload(emitter: EventEmitterable < T >, listener: null | Listener, filter: T)
Create a new EventPayload for emitter with the listener and for filter.

METHODS
 <src>eventPayload.removeListener()⇒ Promise< void >
Unregister the triggered listener for future events.

 Fetching Web Content
Fetching content from the web is environment-specific, so Ethers provides an abstraction that each environment can implement to provide this service.

On Node.js, the http and https libs are used to create a request object, register event listeners and process data and populate the FetchResponse.

In a browser, the DOM fetch is used, and the resulting Promise is waited on to retrieve the payload.

The FetchRequest is responsible for handling many common situations, such as redirects, server throttling, authentication, etc.

It also handles common gateways, such as IPFS and data URIs.

TYPES
 <src>FetchGatewayFunc⇒ (url: string, signal?: FetchCancelSignal) => Promise< FetchRequest | FetchResponse >
Called on Gateway URLs.

 <src>FetchGetUrlFunc⇒ (req: FetchRequest, signal?: FetchCancelSignal) => Promise< GetUrlResponse >
Used to perform a fetch; use this to override the underlying network fetch layer. In NodeJS, the default uses the "http" and "https" libraries and in the browser fetch is used. If you wish to use Axios, this is how you would register it.

 <src>FetchPreflightFunc⇒ (req: FetchRequest) => Promise< FetchRequest >
Called before any network request, allowing updated headers (e.g. Bearer tokens), etc.

 <src>FetchProcessFunc⇒ (req: FetchRequest, resp: FetchResponse) => Promise< FetchResponse >
Called on the response, allowing client-based throttling logic or post-processing.

 <src>FetchRetryFunc⇒ (req: FetchRequest, resp: FetchResponse, attempt: number) => Promise< boolean >
Called prior to each retry; return true to retry, false to abort.

 <src>FetchThrottleParams⇒ { maxAttempts?: number , slotInterval?: number }
This can be used to control how throttling is handled in fetchRequest.setThrottleParams.

 <src>GetUrlResponse⇒ { body: null | Uint8Array , headers: Record< string, string > , statusCode: number , statusMessage: string }
An environment's implementation of getUrl must return this type.

 class FetchRequest
Represents a request for a resource using a URI.

By default, the supported schemes are HTTP, HTTPS, data:, and IPFS:.

Additional schemes can be added globally using registerGateway.

req = new FetchRequest("https://www.ricmoo.com")
resp = await req.send()
resp.body.length
// 22318
PROPERTIES
 <src>fetchRequest.allowGzip⇒ boolean
Enable and request gzip-encoded responses. The response will automatically be decompressed. (default: true)

 <src>fetchRequest.allowInsecureAuthentication⇒ boolean
Allow Authentication credentials to be sent over insecure channels. (default: false)

 <src>fetchRequest.body⇒ null | Uint8Array
The fetch body, if any, to send as the request body. (default: null)

When setting a body, the intrinsic Content-Type is automatically set and will be used if not overridden by setting a custom header.

If body is null, the body is cleared (along with the intrinsic Content-Type).

If body is a string, the intrinsic Content-Type is set to text/plain.

If body is a Uint8Array, the intrinsic Content-Type is set to application/octet-stream.

If body is any other object, the intrinsic Content-Type is set to application/json.

 <src>fetchRequest.credentials⇒ null | stringread-only
The value that will be sent for the Authorization header.

To set the credentials, use the setCredentials method.

 <src>fetchRequest.getUrlFunc⇒ FetchGetUrlFunc
This function is called to fetch content from HTTP and HTTPS URLs and is platform specific (e.g. nodejs vs browsers).

This is by default the currently registered global getUrl function, which can be changed using registerGetUrl. If this has been set, setting is to null will cause this FetchRequest (and any future clones) to revert back to using the currently registered global getUrl function.

Setting this is generally not necessary, but may be useful for developers that wish to intercept requests or to configurege a proxy or other agent.

 <src>fetchRequest.headers⇒ Record< string, string >read-only
The headers that will be used when requesting the URI. All keys are lower-case.

This object is a copy, so any changes will NOT be reflected in the FetchRequest.

To set a header entry, use the setHeader method.

 <src>fetchRequest.method⇒ string
The HTTP method to use when requesting the URI. If no method has been explicitly set, then GET is used if the body is null and POST otherwise.

 <src>fetchRequest.preflightFunc⇒ null | FetchPreflightFunc
This function is called prior to each request, for example during a redirection or retry in case of server throttling.

This offers an opportunity to populate headers or update content before sending a request.

 <src>fetchRequest.processFunc⇒ null | FetchProcessFunc
This function is called after each response, offering an opportunity to provide client-level throttling or updating response data.

Any error thrown in this causes the send() to throw.

To schedule a retry attempt (assuming the maximum retry limit has not been reached), use [[response.throwThrottleError]].

 <src>fetchRequest.retryFunc⇒ null | FetchRetryFunc
This function is called on each retry attempt.

 <src>fetchRequest.timeout⇒ number
The timeout (in milliseconds) to wait for a complete response. (default: 5 minutes)

 <src>fetchRequest.url⇒ string
The fetch URL to request.

CREATING INSTANCES
 <src>new FetchRequest(url: string)
Create a new FetchRequest instance with default values.

Once created, each property may be set before issuing a .send() to make the request.

METHODS
 <src>fetchRequest.cancel()⇒ void
Cancels the inflight response, causing a CANCELLED error to be rejected from the send.

 <src>fetchRequest.clearHeaders()⇒ void
Clear all headers, resetting all intrinsic headers.

 <src>fetchRequest.clone()⇒ FetchRequest
Create a new copy of this request.

 <src>fetchRequest.getHeader(key: string)⇒ string
Get the header for key, ignoring case.

 <src>fetchRequest.hasBody()⇒ boolean
Returns true if the request has a body.

 <src>fetchRequest.redirect(location: string)⇒ FetchRequest
Returns a new FetchRequest that represents the redirection to location.

 <src>fetchRequest.send()⇒ Promise< FetchResponse >
Resolves to the response by sending the request.

 <src>fetchRequest.setCredentials(username: string, password: string)⇒ void
Sets an Authorization for username with password.

 <src>fetchRequest.setHeader(key: string, value: string | number)⇒ void
Set the header for key to value. All values are coerced to a string.

 <src>fetchRequest.setThrottleParams(params: FetchThrottleParams)⇒ void
Update the throttle parameters used to determine maximum attempts and exponential-backoff properties.

 <src>fetchRequest.toString()⇒ string
STATIC METHODS
 <src>FetchRequest.createDataGateway()⇒ FetchGatewayFunc
Creates a function that can "fetch" data URIs.

Note that this is automatically done internally to support data URIs, so it is not necessary to register it.

This is not generally something that is needed, but may be useful in a wrapper to perfom custom data URI functionality.

 <src>FetchRequest.createGetUrlFunc(options?: Record< string, any >)⇒ FetchGetUrlFunc
Creates a getUrl function that fetches content from HTTP and HTTPS URLs.

The available options are dependent on the platform implementation of the default getUrl function.

This is not generally something that is needed, but is useful when trying to customize simple behaviour when fetching HTTP content.

 <src>FetchRequest.createIpfsGatewayFunc(baseUrl: string)⇒ FetchGatewayFunc
Creates a function that will fetch IPFS (unvalidated) from a custom gateway baseUrl.

The default IPFS gateway used internally is "https://gateway.ipfs.io/ipfs/".

 <src>FetchRequest.getGateway(scheme: string)⇒ null | FetchGatewayFunc
Get the current Gateway function for scheme.

 <src>FetchRequest.lockConfig()⇒ void
Locks all static configuration for gateways and FetchGetUrlFunc registration.

 <src>FetchRequest.registerGateway(scheme: string, func: FetchGatewayFunc)⇒ void
Use the func when fetching URIs using scheme.

This method affects all requests globally.

If lockConfig has been called, no change is made and this throws.

 <src>FetchRequest.registerGetUrl(getUrl: FetchGetUrlFunc)⇒ void
Use getUrl when fetching URIs over HTTP and HTTPS requests.

This method affects all requests globally.

If lockConfig has been called, no change is made and this throws.

 class FetchResponse
The response for a FetchRequest.

PROPERTIES
 <src>fetchResponse.body⇒ null | Readonly< Uint8Array >read-only
The response body, or null if there was no body.

 <src>fetchResponse.bodyJson⇒ anyread-only
The response body, decoded as JSON.

An error is thrown if the body is invalid JSON-encoded data or if there was no body.

 <src>fetchResponse.bodyText⇒ stringread-only
The response body as a UTF-8 encoded string, or the empty string (i.e. "") if there was no body.

An error is thrown if the body is invalid UTF-8 data.

 <src>fetchResponse.headers⇒ Record< string, string >read-only
The response headers. All keys are lower-case.

 <src>fetchResponse.request⇒ null | FetchRequestread-only
The request made for this response.

 <src>fetchResponse.statusCode⇒ numberread-only
The response status code.

 <src>fetchResponse.statusMessage⇒ stringread-only
The response status message.

CREATING INSTANCES
 <src>new FetchResponse(statusCode: number, statusMessage: string, headers: Readonly< Record< string, string > >, body: null | Uint8Array, request?: FetchRequest)
METHODS
 <src>fetchResponse.assertOk()⇒ void
Throws a SERVER_ERROR if this response is not ok.

 <src>fetchResponse.getHeader(key: string)⇒ string
Get the header value for key, ignoring case.

 <src>fetchResponse.hasBody()⇒ boolean
Returns true if the response has a body.

 <src>fetchResponse.makeServerError(message?: string, error?: Error)⇒ FetchResponse
Return a Response with matching headers and body, but with an error status code (i.e. 599) and message with an optional error.

 <src>fetchResponse.ok()⇒ boolean
Returns true if this response was a success statusCode.

 <src>fetchResponse.throwThrottleError(message?: string, stall?: number)⇒ never
If called within a request.processFunc call, causes the request to retry as if throttled for stall milliseconds.

 <src>fetchResponse.toString()⇒ string
 Fixed-Point Maths
The FixedNumber class permits using values with decimal places, using fixed-pont math.

Fixed-point math is still based on integers under-the-hood, but uses an internal offset to store fractional components below, and each operation corrects for this after each operation.

TYPES
 <src>FixedFormat⇒ number | string | { decimals?: number , signed?: boolean , width?: number }
A description of a fixed-point arithmetic field.

When specifying the fixed format, the values override the default of a fixed128x18, which implies a signed 128-bit value with 18 decimals of precision.

The alias fixed and ufixed can be used for fixed128x18 and ufixed128x18 respectively.

When a fixed format string begins with a u, it indicates the field is unsigned, so any negative values will overflow. The first number indicates the bit-width and the second number indicates the decimal precision.

When a number is used for a fixed format, it indicates the number of decimal places, and the default width and signed-ness will be used.

The bit-width must be byte aligned and the decimals can be at most 80.

 class FixedNumber
A FixedNumber represents a value over its FixedFormat arithmetic field.

A FixedNumber can be used to perform math, losslessly, on values which have decmial places.

A FixedNumber has a fixed bit-width to store values in, and stores all values internally by multiplying the value by 10 raised to the power of decimals.

If operations are performed that cause a value to grow too high (close to positive infinity) or too low (close to negative infinity), the value is said to overflow.

For example, an 8-bit signed value, with 0 decimals may only be within the range -128 to 127; so -128 - 1 will overflow and become 127. Likewise, 127 + 1 will overflow and become -127.

Many operation have a normal and unsafe variant. The normal variant will throw a NumericFaultError on any overflow, while the unsafe variant will silently allow overflow, corrupting its value value.

If operations are performed that cause a value to become too small (close to zero), the value loses precison and is said to underflow.

For example, a value with 1 decimal place may store a number as small as 0.1, but the value of 0.1 / 2 is 0.05, which cannot fit into 1 decimal place, so underflow occurs which means precision is lost and the value becomes 0.

Some operations have a normal and signalling variant. The normal variant will silently ignore underflow, while the signalling variant will thow a NumericFaultError on underflow.

PROPERTIES
 <src>fixedNumber.decimals⇒ numberread-only
The number of decimal places in the fixed-point arithment field.

 <src>fixedNumber.format⇒ stringread-only
The specific fixed-point arithmetic field for this value.

 <src>fixedNumber.signed⇒ booleanread-only
If true, negative values are permitted, otherwise only positive values and zero are allowed.

 <src>fixedNumber.value⇒ bigintread-only
The value as an integer, based on the smallest unit the decimals allow.

 <src>fixedNumber.width⇒ numberread-only
The number of bits available to store the value.

CREATING INSTANCES
 <src>FixedNumber.fromBytes(value: BytesLike, format?: FixedFormat)⇒ FixedNumber
Creates a new FixedNumber with the big-endian representation value with format.

This will throw a NumericFaultError if value cannot fit in format due to overflow.

 <src>FixedNumber.fromString(value: string, format?: FixedFormat)⇒ FixedNumber
Creates a new FixedNumber for value with format.

This will throw a NumericFaultError if value cannot fit in format, either due to overflow or underflow (precision loss).

 <src>FixedNumber.fromValue(value: BigNumberish, decimals?: Numeric, format?: FixedFormat)⇒ FixedNumber
Creates a new FixedNumber for value divided by decimal places with format.

This will throw a NumericFaultError if value (once adjusted for decimals) cannot fit in format, either due to overflow or underflow (precision loss).

METHODS
 <src>fixedNumber.add(other: FixedNumber)⇒ FixedNumber
Returns a new FixedNumber with the result of this added to other. A NumericFaultError is thrown if overflow occurs.

 <src>fixedNumber.addUnsafe(other: FixedNumber)⇒ FixedNumber
Returns a new FixedNumber with the result of this added to other, ignoring overflow.

 <src>fixedNumber.ceiling()⇒ FixedNumber
Returns a new FixedNumber which is the smallest integer that is greater than or equal to this.

The decimal component of the result will always be 0.

 <src>fixedNumber.cmp(other: FixedNumber)⇒ number
Returns a comparison result between this and other.

This is suitable for use in sorting, where -1 implies this is smaller, 1 implies this is larger and 0 implies both are equal.

 <src>fixedNumber.div(other: FixedNumber)⇒ FixedNumber
Returns a new FixedNumber with the result of this divided by other, ignoring underflow (precision loss). A NumericFaultError is thrown if overflow occurs.

 <src>fixedNumber.divSignal(other: FixedNumber)⇒ FixedNumber
Returns a new FixedNumber with the result of this divided by other. A NumericFaultError is thrown if underflow (precision loss) occurs.

 <src>fixedNumber.divUnsafe(other: FixedNumber)⇒ FixedNumber
Returns a new FixedNumber with the result of this divided by other, ignoring underflow (precision loss). A NumericFaultError is thrown if overflow occurs.

 <src>fixedNumber.eq(other: FixedNumber)⇒ boolean
Returns true if other is equal to this.

 <src>fixedNumber.floor()⇒ FixedNumber
Returns a new FixedNumber which is the largest integer that is less than or equal to this.

The decimal component of the result will always be 0.

 <src>fixedNumber.gt(other: FixedNumber)⇒ boolean
Returns true if other is greater than to this.

 <src>fixedNumber.gte(other: FixedNumber)⇒ boolean
Returns true if other is greater than or equal to this.

 <src>fixedNumber.isNegative()⇒ boolean
Returns true if this is less than 0.

 <src>fixedNumber.isZero()⇒ boolean
Returns true if this is equal to 0.

 <src>fixedNumber.lt(other: FixedNumber)⇒ boolean
Returns true if other is less than to this.

 <src>fixedNumber.lte(other: FixedNumber)⇒ boolean
Returns true if other is less than or equal to this.

 <src>fixedNumber.mul(other: FixedNumber)⇒ FixedNumber
Returns a new FixedNumber with the result of this multiplied by other. A NumericFaultError is thrown if overflow occurs.

 <src>fixedNumber.mulSignal(other: FixedNumber)⇒ FixedNumber
Returns a new FixedNumber with the result of this multiplied by other. A NumericFaultError is thrown if overflow occurs or if underflow (precision loss) occurs.

 <src>fixedNumber.mulUnsafe(other: FixedNumber)⇒ FixedNumber
Returns a new FixedNumber with the result of this multiplied by other, ignoring overflow and underflow (precision loss).

 <src>fixedNumber.round(decimals?: number)⇒ FixedNumber
Returns a new FixedNumber with the decimal component rounded up on ties at decimals places.

 <src>fixedNumber.sub(other: FixedNumber)⇒ FixedNumber
Returns a new FixedNumber with the result of other subtracted from this. A NumericFaultError is thrown if overflow occurs.

 <src>fixedNumber.subUnsafe(other: FixedNumber)⇒ FixedNumber
Returns a new FixedNumber with the result of other subtracted from this, ignoring overflow.

 <src>fixedNumber.toFormat(format: FixedFormat)⇒ FixedNumber
Return a new FixedNumber with the same value but has had its field set to format.

This will throw if the value cannot fit into format.

 <src>fixedNumber.toString()⇒ string
Returns the string representation of this.

 <src>fixedNumber.toUnsafeFloat()⇒ number
Returns a float approximation.

Due to IEEE 754 precission (or lack thereof), this function can only return an approximation and most values will contain rounding errors.

 Wallets
When interacting with Ethereum, it is necessary to use a private key authenticate actions by signing a payload.

Wallets are the simplest way to expose the concept of an Externally Owner Account (EOA) as it wraps a private key and supports high-level methods to sign common types of interaction and send transactions.

The class most developers will want to use is Wallet, which can load a private key directly or from any common wallet format.

The HDNodeWallet can be used when it is necessary to access low-level details of how an HD wallets are derived, exported or imported.

 class BaseWallet
inherits from AbstractSigner, Signer
The BaseWallet is a stream-lined implementation of a Signer that operates with a private key.

It is preferred to use the Wallet class, as it offers additional functionality and simplifies loading a variety of JSON formats, Mnemonic Phrases, etc.

This class may be of use for those attempting to implement a minimal Signer.

PROPERTIES
 <src>baseWallet.address⇒ stringread-only
The wallet address.

 <src>baseWallet.privateKey⇒ stringread-only
The private key for this wallet.

 <src>baseWallet.signingKey⇒ SigningKeyread-only
The SigningKey used for signing payloads.

CREATING INSTANCES
 <src>new BaseWallet(privateKey: SigningKey, provider?: null | Provider)
Creates a new BaseWallet for privateKey, optionally connected to provider.

If provider is not specified, only offline methods can be used.

METHODS
 <src>baseWallet.authorize(auth: AuthorizationRequest)⇒ Promise< Authorization >
Resolves to the Authorization for auth.

 <src>baseWallet.authorizeSync(auth: AuthorizationRequest)⇒ Authorization
Returns the Authorization for auth.

 <src>baseWallet.signMessageSync(message: string | Uint8Array)⇒ string
Returns the signature for message signed with this wallet.

 class Mnemonic
A Mnemonic wraps all properties required to compute BIP-39 seeds and convert between phrases and entropy.

PROPERTIES
 <src>mnemonic.entropy⇒ stringread-only
The underlying entropy which the mnemonic encodes.

 <src>mnemonic.password⇒ stringread-only
The password used for this mnemonic. If no password is used this is the empty string (i.e. "") as per the specification.

 <src>mnemonic.phrase⇒ stringread-only
The mnemonic phrase of 12, 15, 18, 21 or 24 words.

Use the wordlist split method to get the individual words.

 <src>mnemonic.wordlist⇒ Wordlistread-only
The wordlist for this mnemonic.

CREATING INSTANCES
 <src>Mnemonic.fromEntropy(entropy: BytesLike, password?: null | string, wordlist?: null | Wordlist)⇒ Mnemonic
Create a new Mnemonic from the entropy.

The default password is the empty string and the default wordlist is the English wordlists.

 <src>Mnemonic.fromPhrase(phrase: string, password?: null | string, wordlist?: null | Wordlist)⇒ Mnemonic
Creates a new Mnemonic for the phrase.

The default password is the empty string and the default wordlist is the English wordlists.

METHODS
 <src>mnemonic.computeSeed()⇒ string
Returns the seed for the mnemonic.

STATIC METHODS
 <src>Mnemonic.entropyToPhrase(entropy: BytesLike, wordlist?: null | Wordlist)⇒ string
Returns the phrase for mnemonic.

 <src>Mnemonic.isValidMnemonic(phrase: string, wordlist?: null | Wordlist)⇒ boolean
Returns true if phrase is a valid BIP-39 phrase.

This checks all the provided words belong to the wordlist, that the length is valid and the checksum is correct.

 <src>Mnemonic.phraseToEntropy(phrase: string, wordlist?: null | Wordlist)⇒ string
Returns the entropy for phrase.

 class Wallet
inherits from BaseWallet, AbstractSigner
A Wallet manages a single private key which is used to sign transactions, messages and other common payloads.

This class is generally the main entry point for developers that wish to use a private key directly, as it can create instances from a large variety of common sources, including raw private key, BIP-39 mnemonics and encrypte JSON wallets.

CREATING INSTANCES
 <src>new Wallet(key: string | SigningKey, provider?: null | Provider)
Create a new wallet for the private key, optionally connected to provider.

METHODS
 <src>wallet.encrypt(password: Uint8Array | string, progressCallback?: ProgressCallback)⇒ Promise< string >
Resolves to a JSON Keystore Wallet encrypted with password.

If progressCallback is specified, it will receive periodic updates as the encryption process progreses.

 <src>wallet.encryptSync(password: Uint8Array | string)⇒ string
Returns a JSON Keystore Wallet encryped with password.

It is preferred to use the async version instead, which allows a ProgressCallback to keep the user informed.

This method will block the event loop (freezing all UI) until it is complete, which may be a non-trivial duration.

STATIC METHODS
 <src>Wallet.createRandom(provider?: null | Provider)⇒ HDNodeWallet
Creates a new random HDNodeWallet using the available cryptographic random source.

If there is no crytographic random source, this will throw.

 <src>Wallet.fromEncryptedJson(json: string, password: Uint8Array | string, progress?: ProgressCallback)⇒ Promise< HDNodeWallet | Wallet >
Creates (asynchronously) a Wallet by decrypting the json with password.

If progress is provided, it is called periodically during decryption so that any UI can be updated.

 <src>Wallet.fromEncryptedJsonSync(json: string, password: Uint8Array | string)⇒ HDNodeWallet | Wallet
Creates a Wallet by decrypting the json with password.

The fromEncryptedJson method is preferred, as this method will lock up and freeze the UI during decryption, which may take some time.

 <src>Wallet.fromPhrase(phrase: string, provider?: Provider)⇒ HDNodeWallet
Creates a HDNodeWallet for phrase.

 HD Wallets
Explain HD Wallets..

CONSTANTS
 <src>defaultPath⇒ string
The default derivation path for Ethereum HD Nodes. (i.e. "m/44'/60'/0'/0/0")

FUNCTIONS
 <src>getAccountPath(index: Numeric)⇒ string
Returns the BIP-32 path for the account at index.

This is the pattern used by wallets like Ledger.

There is also an alternate pattern used by some software.

 <src>getIndexedAccountPath(index: Numeric)⇒ string
Returns the path using an alternative pattern for deriving accounts, at index.

This derivation path uses the index component rather than the account component to derive sequential accounts.

This is the pattern used by wallets like MetaMask.

 class HDNodeVoidWallet
inherits from VoidSigner, AbstractSigner
A HDNodeVoidWallet cannot sign, but provides access to the children nodes of a BIP-32 HD wallet addresses.

The can be created by using an extended xpub key to HDNodeWallet.fromExtendedKey or by nuetering a HDNodeWallet.

PROPERTIES
 <src>hdNodeVoidWallet.chainCode⇒ stringread-only
The chaincode, which is effectively a public key used to derive children.

 <src>hdNodeVoidWallet.depth⇒ numberread-only
The depth of this wallet, which is the number of components in its path.

 <src>hdNodeVoidWallet.extendedKey⇒ stringread-only
The extended key.

This key will begin with the prefix xpub and can be used to reconstruct this neutered key to derive its children addresses.

 <src>hdNodeVoidWallet.fingerprint⇒ stringread-only
The fingerprint.

A fingerprint allows quick qay to detect parent and child nodes, but developers should be prepared to deal with collisions as it is only 4 bytes.

 <src>hdNodeVoidWallet.index⇒ numberread-only
The child index of this wallet. Values over 2 ** 31 indicate the node is hardened.

 <src>hdNodeVoidWallet.parentFingerprint⇒ stringread-only
The parent node fingerprint.

 <src>hdNodeVoidWallet.path⇒ null | stringread-only
The derivation path of this wallet.

Since extended keys do not provider full path details, this may be null, if instantiated from a source that does not enocde it.

 <src>hdNodeVoidWallet.publicKey⇒ stringread-only
The compressed public key.

METHODS
 <src>hdNodeVoidWallet.deriveChild(index: Numeric)⇒ HDNodeVoidWallet
Return the child for index.

 <src>hdNodeVoidWallet.derivePath(path: string)⇒ HDNodeVoidWallet
Return the signer for path from this node.

 <src>hdNodeVoidWallet.hasPath()⇒ boolean
Returns true if this wallet has a path, providing a Type Guard that the path is non-null.

 class HDNodeWallet
inherits from BaseWallet, AbstractSigner
An HDNodeWallet is a Signer backed by the private key derived from an HD Node using the BIP-32 stantard.

An HD Node forms a hierarchal structure with each HD Node having a private key and the ability to derive child HD Nodes, defined by a path indicating the index of each child.

PROPERTIES
 <src>hdNodeWallet.chainCode⇒ stringread-only
The chaincode, which is effectively a public key used to derive children.

 <src>hdNodeWallet.depth⇒ numberread-only
The depth of this wallet, which is the number of components in its path.

 <src>hdNodeWallet.extendedKey⇒ stringread-only
The extended key.

This key will begin with the prefix xpriv and can be used to reconstruct this HD Node to derive its children.

 <src>hdNodeWallet.fingerprint⇒ stringread-only
The fingerprint.

A fingerprint allows quick qay to detect parent and child nodes, but developers should be prepared to deal with collisions as it is only 4 bytes.

 <src>hdNodeWallet.index⇒ numberread-only
The child index of this wallet. Values over 2 ** 31 indicate the node is hardened.

 <src>hdNodeWallet.mnemonic⇒ null | Mnemonicread-only
The mnemonic used to create this HD Node, if available.

Sources such as extended keys do not encode the mnemonic, in which case this will be null.

 <src>hdNodeWallet.parentFingerprint⇒ stringread-only
The parent fingerprint.

 <src>hdNodeWallet.path⇒ null | stringread-only
The derivation path of this wallet.

Since extended keys do not provide full path details, this may be null, if instantiated from a source that does not encode it.

 <src>hdNodeWallet.publicKey⇒ stringread-only
The compressed public key.

CREATING INSTANCES
 <src>HDNodeWallet.createRandom(password?: string, path?: string, wordlist?: Wordlist)⇒ HDNodeWallet
Creates a new random HDNode.

 <src>HDNodeWallet.fromMnemonic(mnemonic: Mnemonic, path?: string)⇒ HDNodeWallet
Create an HD Node from mnemonic.

 <src>HDNodeWallet.fromPhrase(phrase: string, password?: string, path?: string, wordlist?: Wordlist)⇒ HDNodeWallet
Creates an HD Node from a mnemonic phrase.

 <src>HDNodeWallet.fromSeed(seed: BytesLike)⇒ HDNodeWallet
Creates an HD Node from a seed.

METHODS
 <src>hdNodeWallet.deriveChild(index: Numeric)⇒ HDNodeWallet
Return the child for index.

 <src>hdNodeWallet.derivePath(path: string)⇒ HDNodeWallet
Return the HDNode for path from this node.

 <src>hdNodeWallet.encrypt(password: Uint8Array | string, progressCallback?: ProgressCallback)⇒ Promise< string >
Resolves to a JSON Keystore Wallet encrypted with password.

If progressCallback is specified, it will receive periodic updates as the encryption process progreses.

 <src>hdNodeWallet.encryptSync(password: Uint8Array | string)⇒ string
Returns a JSON Keystore Wallet encryped with password.

It is preferred to use the async version instead, which allows a ProgressCallback to keep the user informed.

This method will block the event loop (freezing all UI) until it is complete, which may be a non-trivial duration.

 <src>hdNodeWallet.hasPath()⇒ boolean
Returns true if this wallet has a path, providing a Type Guard that the path is non-null.

 <src>hdNodeWallet.neuter()⇒ HDNodeVoidWallet
Returns a neutered HD Node, which removes the private details of an HD Node.

A neutered node has no private key, but can be used to derive child addresses and other public data about the HD Node.

STATIC METHODS
 <src>HDNodeWallet.fromExtendedKey(extendedKey: string)⇒ HDNodeWallet | HDNodeVoidWallet
Creates a new HD Node from extendedKey.

If the extendedKey will either have a prefix or xpub or xpriv, returning a neutered HD Node (HDNodeVoidWallet) or full HD Node ([[HDNodeWallet) respectively.

 JSON Wallets
The JSON Wallet formats allow a simple way to store the private keys needed in Ethereum along with related information and allows for extensible forms of encryption.

These utilities facilitate decrypting and encrypting the most common JSON Wallet formats.

TYPES
 <src>CrowdsaleAccount⇒ { address: string , privateKey: string }
The data stored within a JSON Crowdsale wallet is fairly minimal.

 <src>EncryptOptions⇒ { client?: string , entropy?: BytesLike , iv?: BytesLike , progressCallback?: ProgressCallback , salt?: BytesLike , scrypt?: { N?: number , p?: number , r?: number } , uuid?: string }
The parameters to use when encrypting a JSON Keystore Wallet.

 <src>KeystoreAccount⇒ { address: string , mnemonic?: { entropy: string , locale?: string , path?: string } , privateKey: string }
The contents of a JSON Keystore Wallet.

FUNCTIONS
 <src>decryptCrowdsaleJson(json: string, password: string | Uint8Array)⇒ CrowdsaleAccount
Before Ethereum launched, it was necessary to create a wallet format for backers to use, which would be used to receive ether as a reward for contributing to the project.

The Crowdsale Wallet format is now obsolete, but it is still useful to support and the additional code is fairly trivial as all the primitives required are used through core portions of the library.

 <src>decryptKeystoreJson(json: string, password: string | Uint8Array, progress?: ProgressCallback)⇒ Promise< KeystoreAccount >
Resolves to the decrypted JSON Keystore Wallet json using the password.

If provided, progress will be called periodically during the decrpytion to provide feedback, and if the function returns false will halt decryption.

The progressCallback will always receive 0 before decryption begins and 1 when complete.

 <src>decryptKeystoreJsonSync(json: string, password: string | Uint8Array)⇒ KeystoreAccount
Returns the account details for the JSON Keystore Wallet json using password.

It is preferred to use the async version instead, which allows a ProgressCallback to keep the user informed as to the decryption status.

This method will block the event loop (freezing all UI) until decryption is complete, which can take quite some time, depending on the wallet paramters and platform.

 <src>encryptKeystoreJson(account: KeystoreAccount, password: string | Uint8Array, options?: EncryptOptions)⇒ Promise< string >
Resolved to the JSON Keystore Wallet for account encrypted with password.

The options can be used to tune the password-based key derivation function parameters, explicitly set the random values used and provide a ProgressCallback to receive periodic updates on the completion status..

 <src>encryptKeystoreJsonSync(account: KeystoreAccount, password: string | Uint8Array, options?: EncryptOptions)⇒ string
Return the JSON Keystore Wallet for account encrypted with password.

The options can be used to tune the password-based key derivation function parameters, explicitly set the random values used. Any provided ProgressCallback is ignord.

 <src>isCrowdsaleJson(json: string)⇒ boolean
Returns true if json is a valid JSON Crowdsale wallet.

 <src>isKeystoreJson(json: string)⇒ boolean
Returns true if json is a valid JSON Keystore Wallet.

 Wordlists
A Wordlist is a set of 2048 words used to encode private keys (or other binary data) that is easier for humans to write down, transcribe and dictate.

The BIP-39 standard includes several checksum bits, depending on the size of the mnemonic phrase.

A mnemonic phrase may be 12, 15, 18, 21 or 24 words long. For most purposes 12 word mnemonics should be used, as including additional words increases the difficulty and potential for mistakes and does not offer any effective improvement on security.

There are a variety of BIP-39 Wordlists for different languages, but for maximal compatibility, the English Wordlist is recommended.

CONSTANTS
 <src>wordlists⇒ Record< string, Wordlist >
The available Wordlists by their ISO 639-1 Language Code.

(i.e. cz, en, es, fr, ja, ko, it, pt, zh_cn, zh_tw)

The dist files (in the /dist folder) have had all languages except English stripped out, which reduces the library size by about 80kb. If required, they are available by importing the included wordlists-extra.min.js file.

 class LangCz
inherits from WordlistOwl, Wordlist
The Czech wordlist for mnemonic phrases.

CREATING INSTANCES
 <src>LangCz.wordlist()⇒ LangCz
Returns a singleton instance of a LangCz, creating it if this is the first time being called.

 class LangEn
inherits from WordlistOwl, Wordlist
The English wordlist for mnemonic phrases.

CREATING INSTANCES
 <src>LangEn.wordlist()⇒ LangEn
Returns a singleton instance of a LangEn, creating it if this is the first time being called.

 class LangEs
inherits from WordlistOwlA, WordlistOwl
The Spanish wordlist for mnemonic phrases.

CREATING INSTANCES
 <src>LangEs.wordlist()⇒ LangEs
Returns a singleton instance of a LangEs, creating it if this is the first time being called.

 class LangFr
inherits from WordlistOwlA, WordlistOwl
The French wordlist for mnemonic phrases.

CREATING INSTANCES
 <src>LangFr.wordlist()⇒ LangFr
Returns a singleton instance of a LangFr, creating it if this is the first time being called.

 class LangIt
inherits from WordlistOwl, Wordlist
The Italian wordlist for mnemonic phrases.

CREATING INSTANCES
 <src>LangIt.wordlist()⇒ LangIt
Returns a singleton instance of a LangIt, creating it if this is the first time being called.

 class LangJa
inherits from Wordlist
The Japanese wordlist for mnemonic phrases.

CREATING INSTANCES
 <src>LangJa.wordlist()⇒ LangJa
Returns a singleton instance of a LangJa, creating it if this is the first time being called.

 class LangKo
inherits from Wordlist
The Korean wordlist for mnemonic phrases.

CREATING INSTANCES
 <src>LangKo.wordlist()⇒ LangKo
Returns a singleton instance of a LangKo, creating it if this is the first time being called.

 class LangPt
inherits from WordlistOwl, Wordlist
The Portuguese wordlist for mnemonic phrases.

CREATING INSTANCES
 <src>LangPt.wordlist()⇒ LangPt
Returns a singleton instance of a LangPt, creating it if this is the first time being called.

 class LangZh
inherits from Wordlist
The Simplified Chinese wordlist and Tradional Chinese wordlist for mnemonic phrases.

CREATING INSTANCES
 <src>LangZh.wordlist(dialect: string)⇒ LangZh
Returns a singleton instance of a LangZh for dialect, creating it if this is the first time being called.

Use the dialect "cn" or "tw" for simplified or traditional, respectively.

 abstract class Wordlist
A Wordlist represents a collection of language-specific words used to encode and devoce BIP-39 encoded data by mapping words to 11-bit values and vice versa.

PROPERTIES
 <src>wordlist.locale⇒ string
CREATING INSTANCES
 <src>new Wordlist(locale: string)
Creates a new Wordlist instance.

Sub-classes MUST call this if they provide their own constructor, passing in the locale string of the language.

Generally there is no need to create instances of a Wordlist, since each language-specific Wordlist creates an instance and there is no state kept internally, so they are safe to share.

METHODS
 <src>wordlist.getWord(index: number)⇒ stringabstract
Maps an 11-bit value into its coresponding word in the list.

Sub-classes MUST override this.

 <src>wordlist.getWordIndex(word: string)⇒ numberabstract
Maps a word to its corresponding 11-bit value.

Sub-classes MUST override this.

 <src>wordlist.join(words: Array< string >)⇒ string
Sub-classes may override this to provider a language-specific method for joining words into a phrase.

By default, words are joined by a single space.

 <src>wordlist.split(phrase: string)⇒ Array< string >
Sub-classes may override this to provide a language-specific method for spliting phrase into individual words.

By default, phrase is split using any sequences of white-space as defined by regular expressions (i.e. /s+/).

 class WordlistOwl
inherits from Wordlist
An OWL format Wordlist is an encoding method that exploits the general locality of alphabetically sorted words to achieve a simple but effective means of compression.

This class is generally not useful to most developers as it is used mainly internally to keep Wordlists for languages based on ASCII-7 small.

If necessary, there are tools within the generation/ folder to create the necessary data.

PROPERTIES
 <src>wordlistOwl._data⇒ stringread-only
The OWL-encoded data.

CREATING INSTANCES
 <src>new WordlistOwl(locale: string, data: string, checksum: string)
Creates a new Wordlist for locale using the OWL data and validated against the checksum.

METHODS
 <src>wordlistOwl._decodeWords()⇒ Array< string >
Decode all the words for the wordlist.

 class WordlistOwlA
inherits from WordlistOwl, Wordlist
An OWL-A format Wordlist extends the OWL format to add an overlay onto an OWL format Wordlist to support diacritic marks.

This class is generally not useful to most developers as it is used mainly internally to keep Wordlists for languages based on latin-1 small.

If necessary, there are tools within the generation/ folder to create the necessary data.

PROPERTIES
 <src>wordlistOwlA._accent⇒ stringread-only
The OWLA-encoded accent data.

CREATING INSTANCES
 <src>new WordlistOwlA(locale: string, data: string, accent: string, checksum: string)
Creates a new Wordlist for locale using the OWLA data and accent data and validated against the checksum.

METHODS
 <src>wordlistOwlA._decodeWords()⇒ Array< string >
Decode all the words for the wordlist.

 Cookbook
A growing collection of code snippets for common problems and use cases when developing dapps and other blockchain tools.


Signing Messages and Data
React Native Performance
 Cookbook: ENS Recipes
Here is a collection of short, but useful examples of working with ENS entries.

 Get all Text records
Here is a short recipe to get all the text records set for an ENS name.

It first queries all TextChanged events on the resolver, and uses a MulticallProvider to batch all the eth_call queries for each key into a single eth_call. As such, you will need to install:

/home/ricmoo> npm install @ethers-ext/provider-multicall

Fetching all ENS text records.
import { ethers } from "ethers";
import { MulticallProvider } from "@ethers-ext/provider-multicall";

async function getTextRecords(_provider, name) {
  // Prepare a multicall-based provider to batch all the call operations
  const provider = new MulticallProvider(_provider);

  // Get the resolver for the given name
  const resolver = await provider.getResolver(name);

  // A contract instance; used filter and parse logs
  const contract = new ethers.Contract(resolver.address, [
    "event TextChanged(bytes32 indexed node, string indexed _key, string key)"
  ], provider);

  // A filter for the given name
  const filter = contract.filters.TextChanged(ethers.namehash(name));

  // Get the matching logs
  const logs = await contract.queryFilter(filter);

  // Filter the *unique* keys
  const keys = [ ...(new Set(logs.map((log) => log.args.key))) ];

  // Get the values for the keys; failures are discarded
  const values = await Promise.all(keys.map((key) => {
      try {
          return resolver.getText(key);
      } catch (error) { }
      return null;
  }));

  // Return a Map of the key/value pairs
  return keys.reduce((accum, key, index) => {
      const value = values[index];
      if (value != null) { accum.set(key, value); }
      return accum;
  }, new Map());
}

// Example usage
(async function() {
  const provider = new ethers.InfuraProvider();
  console.log(await getTextRecords(provider, "ricmoo.eth"));
})();
 React Native
When using React Native, many of the built-in cryptographic primitives can be replaced by native, substantially faster implementations.

This should be available in its own package in the future, but for now this is highly recommended, and requires installing the Quick Crypto package.

import { ethers } from "ethers";

import crypto from "react-native-quick-crypto";

ethers.randomBytes.register((length) => {
  return new Uint8Array(crypto.randomBytes(length));
});

ethers.computeHmac.register((algo, key, data) => {
    return crypto.createHmac(algo, key).update(data).digest();
});

ethers.pbkdf2.register((passwd, salt, iter, keylen, algo) => {
  return crypto.pbkdf2Sync(passwd, salt, iter, keylen, algo);
});

ethers.sha256.register((data) => {
  return crypto.createHash('sha256').update(data).digest();
});

ethers.sha512.register((data) => {
  return crypto.createHash('sha512').update(data).digest();
});
 Signing
Signing content and providing the content and signature to a Contract allows on-chain validation that a signer has access to the private key of a specific address.

The ecrecover algorithm allows the public key to be determined given some message digest and the signature generated by the private key for that digest. From the public key, the address can then be computed.

How a digest is derived depends on the type of data being signed and a variety of encoding formats are employed. Each format is designed to ensure that they do not collide, so for example, a user cannot be tricked into signing a message which is actually a valid transaction.

For this reason, most APIs in Ethereum do not permit signing a raw digest, and instead require a separate API for each format type and require the related data be specified, protecting the user from accidentally authorizing an action they didn't intend.

 Messages
A signed message can be any data, but it is generally recommended to use human-readable text, as this is easier for a user to verify visually.

This technique could be used, for example, to sign into a service by using the text "I am signing into ethers.org on 2023-06-04 12:57pm". The user can then see the message in MetaMask or on a Ledger Hardware Wallet and accept that they wish to sign the message which the site can then authenticate them with. By providing a timestamp the site can ensure that an older signed message cannot be used again in the future.

The format that is signed uses EIP-191 with the personal sign version code (0x45, or "E").

For those interested in the choice of this prefix, signed messages began as a Bitcoin feature, which used "\x18Bitcoin Signed Message:\n", which was a Bitcoin var-int length-prefixed string (as 0x18 is 24, the length of "Bitcoin Signed Message:\n".). When Ethereum adopted the similar feature, the relevant string was "\x19Ethereum Signed Message:\n".

In one of the most brilliant instances of technical retcon-ing, since 0x19 is invalid as the first byte of a transaction (in Recursive-Length Prefix it indicates a single byte of value 25), the initial byte \x19 has now been adopted as a prefix for some sort of signed data, where the second byte determines how to interpret that data. If the second byte is 69 (the letter "E", as in "Ethereum Signed Message:\n"), then the format is a the above prefixed message format.

So, all existing messages, tools and instances using the signed message format were already EIP-191 compliant, long before the standard existed or was even conceived and allowed for an extensible format for future formats (of which there now a few).

Anyways, the necessary JavaScript and Solidity are provided below.

JavaScript
// The contract below is deployed to Sepolia at this address
contractAddress = "0xf554DA5e35b2e40C09DDB481545A395da1736513";
contract = new Contract(contractAddress, [
  "function recoverStringFromCompact(string message, (bytes32 r, bytes32 yParityAndS) sig) pure returns (address)",
  "function recoverStringFromExpanded(string message, (uint8 v, bytes32 r, bytes32 s) sig) pure returns (address)",
  "function recoverStringFromVRS(string message, uint8 v, bytes32 r, bytes32 s) pure returns (address)",
  "function recoverStringFromRaw(string message, bytes sig) pure returns (address)",
  "function recoverHashFromCompact(bytes32 hash, (bytes32 r, bytes32 yParityAndS) sig) pure returns (address)"
], new ethers.InfuraProvider("sepolia"));

// The Signer; it does not need to be connected to a Provider to sign
signer = new Wallet(id("foobar"));
signer.address
// '0x0A489345F9E9bc5254E18dd14fA7ECfDB2cE5f21'

// Our message
message = "Hello World";

// The raw signature; 65 bytes
rawSig = await signer.signMessage(message);
// '0xa617d0558818c7a479d5063987981b59d6e619332ef52249be8243572ef1086807e381afe644d9bb56b213f6e08374c893db308ac1a5ae2bf8b33bcddcb0f76a1b'

// Converting it to a Signature object provides more
// flexibility, such as using it as a struct
sig = Signature.from(rawSig);
// Signature { r: 0xa617d0558818c7a479d5063987981b59d6e619332ef52249be8243572ef10868, s: 0x07e381afe644d9bb56b213f6e08374c893db308ac1a5ae2bf8b33bcddcb0f76a, v: 27 }


// If the signature matches the EIP-2098 format, a Signature
// can be passed as the struct value directly, since the
// parser will pull out the matching struct keys from sig.
await contract.recoverStringFromCompact(message, sig);
// '0x0A489345F9E9bc5254E18dd14fA7ECfDB2cE5f21'

// Likewise, if the struct keys match an expanded signature
// struct, it can also be passed as the struct value directly.
await contract.recoverStringFromExpanded(message, sig);
// '0x0A489345F9E9bc5254E18dd14fA7ECfDB2cE5f21'

// If using an older API which requires the v, r and s be passed
// separately, those members are present on the Signature.
await contract.recoverStringFromVRS(message, sig.v, sig.r, sig.s);
// '0x0A489345F9E9bc5254E18dd14fA7ECfDB2cE5f21'

// Or if using an API that expects a raw signature.
await contract.recoverStringFromRaw(message, rawSig);
// '0x0A489345F9E9bc5254E18dd14fA7ECfDB2cE5f21'

// Note: The above recovered addresses matches the signer address
The Solidity Contract has been deployed and verified on the Sepolia testnet at the address 0xf554DA5e35b2e40C09DDB481545A395da1736513.

It provides a variety of examples using various Signature encodings and formats, to recover the address for an EIP-191 signed message.

Solidity
// SPDX-License-Identifier: MIT

// For more info, see: https://docs.ethers.org


pragma solidity ^0.8.21;

// Returns the decimal string representation of value
function itoa(uint value) pure returns (string memory) {

  // Count the length of the decimal string representation
  uint length = 1;
  uint v = value;
  while ((v /= 10) != 0) { length++; }

  // Allocated enough bytes
  bytes memory result = new bytes(length);

  // Place each ASCII string character in the string,
  // right to left
  while (true) {
    length--;

    // The ASCII value of the modulo 10 value
    result[length] = bytes1(uint8(0x30 + (value % 10)));

    value /= 10;

    if (length == 0) { break; }
  }

  return string(result);
}

contract RecoverMessage {

  // This is the EIP-2098 compact representation, which reduces gas costs
  struct SignatureCompact {
    bytes32 r;
    bytes32 yParityAndS;
  }

  // This is an expanded Signature representation
  struct SignatureExpanded {
      uint8 v;
      bytes32 r;
      bytes32 s;
  }

  // Helper function
  function _ecrecover(string memory message, uint8 v, bytes32 r, bytes32 s) internal pure returns (address) {
    // Compute the EIP-191 prefixed message
    bytes memory prefixedMessage = abi.encodePacked(
      "\x19Ethereum Signed Message:\n",
      itoa(bytes(message).length),
      message
    );

    // Compute the message digest
    bytes32 digest = keccak256(prefixedMessage);

    // Use the native ecrecover provided by the EVM
    return ecrecover(digest, v, r, s);
  }

  // Recover the address from an EIP-2098 compact Signature, which packs the bit for
  // v into an unused bit within s, which saves gas overall, costing a little extra
  // in computation, but saves far more in calldata length.
  //
  // This Signature format is 64 bytes in length.
  function recoverStringFromCompact(string calldata message, SignatureCompact calldata sig) public pure returns (address) {

      // Decompose the EIP-2098 signature (the struct is 64 bytes in length)
      uint8 v = 27 + uint8(uint256(sig.yParityAndS) >> 255);
      bytes32 s = bytes32((uint256(sig.yParityAndS) << 1) >> 1);

      return _ecrecover(message, v, sig.r, s);
  }

  // Recover the address from the expanded Signature struct.
  //
  // This Signature format is 96 bytes in length.
  function recoverStringFromExpanded(string calldata message, SignatureExpanded calldata sig) public pure returns (address) {

      // The v, r and s are included directly within the struct, which is 96 bytes in length
      return _ecrecover(message, sig.v, sig.r, sig.s);
  }

  // Recover the address from a v, r and s passed directly into the method.
  //
  // This Signature format is 96 bytes in length.
  function recoverStringFromVRS(string calldata message, uint8 v, bytes32 r, bytes32 s) public pure returns (address) {

      // The v, r and s are included directly within the struct, which is 96 bytes in length
      return _ecrecover(message, v, r, s);
  }

  // Recover the address from a raw signature. The signature is 65 bytes, which when
  // ABI encoded is 160 bytes long (a pointer, a length and the padded 3 words of data).
  //
  // When using raw signatures, some tools return the v as 0 or 1. In this case you must
  // add 27 to that value as v must be either 27 or 28.
  //
  // This Signature format is 65 bytes of data, but when ABI encoded is 160 bytes in length; 
  // a pointer (32 bytes), a length (32 bytes) and the padded 3 words of data (96 bytes).
  function recoverStringFromRaw(string calldata message, bytes calldata sig) public pure returns (address) {

    // Sanity check before using assembly
    require(sig.length == 65, "invalid signature");

    // Decompose the raw signature into r, s and v (note the order)
    uint8 v;
    bytes32 r;
    bytes32 s;
    assembly {
      r := calldataload(sig.offset)
      s := calldataload(add(sig.offset, 0x20))
      v := calldataload(add(sig.offset, 0x21))
    }

    return _ecrecover(message, v, r, s);
  }

  // This is provided as a quick example for those that only need to recover a signature
  // for a signed hash (highly discouraged; but common), which means we can hardcode the
  // length in the prefix. This means we can drop the itoa and _ecrecover functions above.
  function recoverHashFromCompact(bytes32 hash, SignatureCompact calldata sig) public pure returns (address) {
    bytes memory prefixedMessage = abi.encodePacked(
      // Notice the length of the message is hard-coded to 32
      // here -----------------------v
      "\x19Ethereum Signed Message:\n32",
      hash
    );

    bytes32 digest = keccak256(prefixedMessage);

    // Decompose the EIP-2098 signature
    uint8 v = 27 + uint8(uint256(sig.yParityAndS) >> 255);
    bytes32 s = bytes32((uint256(sig.yParityAndS) << 1) >> 1);

    return ecrecover(digest, v, sig.r, s);
  }
}
 EIP-712 Typed Data
Coming soon...

 Migrating from v5
This guide aims to capture some of the high-level differences between v5 and v6 to help those migrating an existing app and those already familiar with v5 that just need a quick primer.

The biggest difference in v6 is the use of modern ES6 features, so a lot of changes are largely internal.


BigNumbers
Contracts
Importing
Providers
Signatures
Transactions
Utilities
Removed Items
 Big Numbers
One of the biggest changes in v6 is that the BigNumber class has been replaced with the built-in ES2020 BigInt offered by modern JavaScript environments.

There is plenty of online documentation to get you started with JavaScript ES2020 BigInt. Keep in mind, just like BigNumber, a ES2020 BigInt can only operate on integers.

The FixedNumber class still exists for performing fixed-point maths.

creating large numbers
// Using BigNumber in v5
value = BigNumber.from("1000")

// Using BigInt in v6 (using literal notation).
// Notice the suffix n
value = 1000n

// Using the BigInt function for strings
value = BigInt("1000")
simple maths on large numbers
// Adding two values in v5
sum = value1.add(value2)

// Using BigInt in v6; keep in mind, both values
// must be a BigInt
sum = value1 + value2
simple comparison on large numbers
// Checking equality in v5
isEqual = value1.eq(value2)

// Using BigInt in v6
isEqual = (value1 == value2)
 Contracts
The Contract is an ES6 Proxy, which means it can resolve method names at run-time.

Ambiguous Methods
In v5, in the case of an ambiguous method, it was necessary to look up a method by its canonical normalized signature. In v6 the signature does not need to be normalized and the Typed API provides a cleaner way to access the desired method.

In v5, duplicate definitions also injected warnings into the console, since there was no way to detect them at run-time.

contracts in v5
abi = [
  "function foo(address bar)",
  "function foo(uint160 bar)",
]
contract = new Contract(address, abi, provider)

// In v5 it was necessary to specify the fully-qualified normalized
// signature to access the desired method. For example:
contract["foo(address)"](addr)

// These would fail, since there signature is not normalized:
contract["foo(address )"](addr)
contract["foo(address addr)"](addr)

// This would fail, since the method is ambiguous:
contract.foo(addr)
contracts in v6
abi = [
  "function foo(address bar)",
  "function foo(uint160 bar)",
]
contract = new Contract(address, abi, provider)

// Any of these work fine:
contract["foo(address)"](addr)
contract["foo(address )"](addr)
contract["foo(address addr)"](addr)

// This still fails, since there is no way to know which
// method was intended
contract.foo(addr)

// However, the Typed API makes things a bit easier, since it
// allows providing typing information to the Contract:
contract.foo(Typed.address(addr))
Other Method Operations
In v5, contracts contained a series of method buckets, which then in turn had all signatures and non-ambiguous names attached to them to perform less-common operations.

In v6, the methods each have their own less-common operations attached directly to them.

other operations in v5
// The default action chooses send or call base on method
// type (pure, view, constant, non-payable or payable)
contract.foo(addr)

// This would perform the default action, but return a Result
// object, instead of destructing the value
contract.functions.foo(addr)

// Forces using call
contract.callStatic.foo(addr)

// Estimate the gas
contract.estimateGas.foo(addr)

// Populate a transaction
contract.populateTransaction.foo(addr)
other operations in v6
// Still behaves the same
contract.foo(addr)

// Perform a call, returning a Result object directly
contract.foo.staticCallResult(addr)

// Forces using call (even for payable and non-payable)
contract.foo.staticCall(addr)

// Forces sending a transaction (even for pure and view)
contract.foo.send(addr)

// Estimate the gas
contract.foo.estimateGas(addr)

// Populate a transaction
contract.foo.populateTransaction(addr)
 Importing
In v5, the project was maintained as a large set of sub-packages managed as a monorepo.

In v6 all imports are available in the root package, and for those who wish to have finer-grained control, the pkg.exports makes certain folders available directly.

importing in v5
// Many things (but not all) we available on the root package
import { ethers } from "ethers"

// But some packages were grouped behind an additional property
import { providers } from "ethers"
const { InfuraProvider } = providers

// For granular control, importing from the sub-package
// was necessary
import { InfuraProvider } from "@ethersproject/providers"
importing in v6
// Everything is available on the root package
import { ethers } from "ethers"
import { InfuraProvider } from "ethers"

// The pkg.exports provides granular access
import { InfuraProvider } from "ethers/providers"
 Providers
In addition to all the ethers.providers.* being moved to ethers.*, the biggest change developers need to keep in mind is that Web3Provider (which historically was used to wrap link-web3 providers) is now called BrowserProvider which is designed to wrap EIP-1193 providers, which is the standard that both modern Web3.js and injected providers offer.

wrapping EIP-1193 providers
// v5
provider = new ethers.providers.Web3Provider(window.ethereum)

// v6:
provider = new ethers.BrowserProvider(window.ethereum)
Also, the method for broadcasting transactions to the network has changed:

broadcasting transactions
// v5
provider.sendTransaction(signedTx)

// v6
provider.broadcastTransaction(signedTx)
The StaticJsonRpcProvider in v5 is now integrated into the v6 JsonRpcProvider directly. When connecting to a network which cannot change its network, it is much more efficient to disable the automatic safety check ethers performs.

Create a Provider on a static network
// v5
provider = new StaticJsonRpcProvider(url, network);

// v6: If you know the network ahead of time and wish
// to avoid even a single eth_chainId call
provider = new JsonRpcProvider(url, network, {
  staticNetwork: network
});

// v6: If you want the network automatically detected,
// this will query eth_chainId only once
provider = new JsonRpcProvider(url, undefined, {
  staticNetwork: true
});
Since the fees for Ethereum chains has become more complicated, all Fee parameters in v6 were coalesced into a single `.getFeeData` method. While `gasPrice` is no longer widely used in modern networks, when using a legacy network, it is available using that method.

Getting legacy gas price
// v5
await provider.getGasPrice()

// v6
(await provider.getFeeData()).gasPrice
The `lastBaseFeePerGas` field has been removed from the `FeeData` object in v6. This field was commonly used in v5 to calculate target gas prices by adding it to `maxPriorityFeePerGas`. In v6, this calculation is handled automatically.

Base fee handling
// v5: Manual calculation using lastBaseFeePerGas
feeData = await provider.getFeeData()
targetGasPrice = feeData.maxPriorityFeePerGas.add(feeData.lastBaseFeePerGas)

// v6: Use maxFeePerGas (automatically calculated using EIP-1559 heuristics)
feeData = await provider.getFeeData()
targetGasPrice = feeData.maxFeePerGas

// v6: Alternative - get base fee from latest block if needed
block = await provider.getBlock("latest")
baseFeePerGas = block.baseFeePerGas       // i.e. lastBaseFeePerGas

// v6: Manual calculation (if you need the old behavior)
targetGasPrice = feeData.maxPriorityFeePerGas + block.baseFeePerGas
 Signatures
The Signature is now a class which facilitates all the parsing and serializing.

signature manipulation
// v5
splitSig = splitSignature(sigBytes)
sigBytes = joinSignature(splitSig)

// v6
splitSig = ethers.Signature.from(sigBytes)
sigBytes = ethers.Signature.from(splitSig).serialized
 Transactions
The transaction helpers present in v5 were all wrapped into a Transaction class, which can handle any supported transaction format to be further processed

parsing transactions
// v5
tx = parseTransaction(txBytes)
txBytes = serializeTransaction(tx)
txBytes = serializeTransaction(tx, sig)

// v6
tx = Transaction.from(txBytes)

// v6 (the tx can optionally include the signature)
txBytes = Transaction.from(tx).serialized
 Utilities
Bytes32 string helpers
// In v5:
bytes32 = ethers.utils.formatBytes32String(text)
text = ethers.utils.parseBytes32String(bytes32)

// In v6:
bytes32 = ethers.encodeBytes32String(text)
text = ethers.decodeBytes32String(bytes32)
constants
// v5:
ethers.constants.AddressZero
ethers.constants.HashZero

// v6:
ethers.ZeroAddress
ethers.ZeroHash
data manipulation
// v5
slice = ethers.utils.hexDataSlice(value, start, end)
padded = ethers.utils.hexZeroPad(value, length)

// v5; converting numbers to hexstrings
hex = hexlify(35)

// v6
slice = ethers.dataSlice(value, start, end)
padded = ethers.zeroPadValue(value, length)

// v6; converting numbers to hexstrings
hex = toBeHex(35)
defaultAbiCoder
// In v5, it is a property of AbiCoder
coder = AbiCoder.defaultAbiCoder

// In v6, it is a static function on AbiCoder, which uses
// a singleton pattern; the first time it is called, the
// AbiCoder is created and on subsequent calls that initial
// instance is returned.
coder = AbiCoder.defaultAbiCoder()
fetching content
// v5, with a body and no weird things
data = await ethers.utils.fetchJson(url, json, processFunc)

// v5 with Connection overrides
req = {
    url, user: "username", password: "password"
    // etc. properties have FetchRequest equivalents
};
data = await ethers.utils.fetchJson(req, json, processFunc)

// v6
req = new ethers.FetchRequest(url)

// set a body; optional
req.body = json

// set credentials; optional
req.setCredentials("username", "password")

// set a processFunc; optional
req.processFunc = processFunc

// send the request!
resp = await req.send()

// Get the response body; depending on desired format
data = resp.body        // Uint8Array
data = resp.bodyText    // Utf8String; throws if invalid
data = resp.bodyJson    // Object; throws if invalid
hex conversion
// v5
hex = ethers.utils.hexValue(value)
array = ethers.utils.arrayify(value)

// v6
hex = ethers.toQuantity(value)
array = ethers.getBytes(value)
solidity non-standard packed
// v5
ethers.utils.solidityPack(types, values)
ethers.utils.solidityKeccak256(types, values)
ethers.utils.soliditySha256(types, values)

// v6
ethers.solidityPacked(types, values)
ethers.solidityPackedKeccak256(types, values)
ethers.solidityPackedSha256(types, values)
property manipulation
// v5
ethers.utils.defineReadOnly(obj, "name", value)

// v6
ethers.defineProperties(obj, { name: value });
commify
// v5
ethers.utils.commify("1234.5")

// v6; we removed some of these locale-specific utilities,
// however the functionality can be easily replicated
// and adjusted depending on your desired output format,
// for which everyone wanted their own tweaks anyways.
//
// However, to mimic v5 functionality, this can be used:
function commify(value) {
  const match = value.match(/^(-?)([0-9]*)(\.?)([0-9]*)$/);
  if (!match || (!match[2] && !match[4])) {
    throw new Error(`bad formatted number: ${ JSON.stringify(value) }`);
  }

  const neg = match[1];
  const whole = BigInt(match[2] || 0).toLocaleString("en-us");
  const frac = match[4] ? match[4].match(/^(.*?)0*$/)[1]: "0";

  return `${ neg }${ whole }.${ frac }`;
}

commify("1234.5");
 Removed Classes and functions
The Logger class has been replaced by several Error utility functions.

The checkProperties and shallowCopy have been removed in favor of using .map and Object.assign.

 Contributions and Hacking
Pull requests are welcome, but please keep the following in mind:


Backwards-compatibility-breaking changes will not be accepted; they may be considered for the next major version
Security is important; adding dependencies require fairly convincing arguments as to why
The library aims to be lean, so keep an eye on the dist/ethers.min.js file size before and after your changes (the build-clean target includes these stats)
Keep the PR simple, readable and confined to the relevant files; see below for which files to change
Add test cases for both expected and unexpected input
Any new features need to be supported by me (future issues, documentation, testing, migration), so anything that is overly complicated or specific may not be accepted
Everyone is working hard; be kind and respectful
It is always highly recommended that you open a Ethers Discussion before beginning a PR.

 Documentation
The documentation is an area which can always benefit from extra eyes, extra knowledge and extra examples.

Contributing to the documentation is welcome, but when making changes to documentation, please ensure that all changes are made only to:


Updating /docs.wrm/**.wrm
Adding links: /docs.wrm/links/*.txt
Updating API jsdocs: /** ... */ comment blocks within /src.ts/
Generally changes to /docs.wrm/config.wrm should not be made, and if you feel it is necessary, please consider opening a Ethers Discussion first.

Similarly, when adding a new sections, a Ethers Discussion is preferred.

All changes should be in the Flatworm Markdown Dialect.

Building the Documentation
Currently, the documentation is built using an experimental v2 of the Flatworm documentation system, a system originally specifically made to maintain the Ethers documentation.

The new tsdocs branch has the ability to parse jsdocs from from TypeScript source files to create an API reference.

Building with the v2 Flatworm
  # Clone the repo
  /home/ricmoo> git clone https://github.com/ricmoo/flatworm.git
  /home/ricmoo> cd flatworm

  # Check out the tsdocs branch
  /home/ricmoo/flatworm> git checkout tsdocs

  # Install the necessary dependencies
  /home/ricmoo/flatworm> npm install

  # Ready to build the docs; output to a folder ./output/
  /home/ricmoo/flatworm> node lib/cli-test PATH_TO_WRM_ROOT

Eventually the code for the v2 branch will be cleaned up, and it
will be much easier to include as a ``devDependency`` for Ethers.

In the meantime, expect new changes to be made frequently to the
``tsdocs`` branch, so for stability you may wish to checkout a
specific hash.
 Fixing Bugs
In general the only files you should ever include in a PR are:


TypeScript source: /src.ts/**.ts
Do not include a package.json with the updated tarballHash or version, and do not include any generated files in your PR.

A bug fix must not modify anything requiring a minor version bump (see Adding Features), such as changing a method signature or altering the exports.

 Adding Features
Contributing new features usually require a deeper understanding of the internal interactions with Ethers and its components, and generally requires a minor version bump.

When making any of the following changes, you must first open a Ethers Discussion as the minor version will need to be bumped.


any signature change (such as adding a parameter, changing a parameter type, changing the return type)
adding any new export; such as a class, function or constants
adding any method to any class
changing any exports property within the package.json
Changes of this sort should not be made without serious consideration and discussion.

 Building
/home/ricmoo> git clone @TODO
/home/ricmoo> cd ethers
/home/ricmoo/ethers> npm install
/home/ricmoo/ethers> npm run auto-build
 Previewing Documentation
 License and Copyright
The ethers library (including all dependencies) are available under the MIT License, which permits a wide variety of uses.

 MIT License
Copyright © Richard Moore.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

The content of this site is licensed under the Creative Commons License. Generated on December 2, 2025, 11:54pm.