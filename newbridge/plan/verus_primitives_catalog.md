# verus-typescript-primitives Library Catalog

**Version:** 1.0.0  
**License:** MIT  
**Repository:** https://github.com/VerusCoin/verus-typescript-primitives.git

## Dependencies

| Package | Version |
|---------|---------|
| base64url | 3.0.1 |
| blake2b | (custom fork) |
| bn.js | 5.2.1 |
| bs58check | 2.0.0 |
| create-hash | 1.2.0 |
| bech32 | 2.0.0 |

---

## Top-Level Exports (`src/index.ts`)

Re-exports everything from:
- `src/api/classes/index`, `ApiRequest`, `ApiResponse`, `ApiPrimitive`
- `src/vdxf/classes/index`, `src/vdxf/index`, `src/vdxf/parser`
- `src/utils/` — address, bufferutils, varuint, ops, evals, script, cccustom, tolower
- `src/pbaas/index` + `PartialIdentity`, `PartialMMRData`, `PartialSignData`
- `src/constants/` — pbaas, ordinals, vdxf/veruspay, deeplink
- `src/identity/IdentityDefinition`, `src/currency/CurrencyDefinition`
- `BN as BigNumber` from bn.js

---

## `src/pbaas/` — Core Serializable Data Structures

All classes below implement `SerializableEntity` interface:
```ts
interface SerializableEntity {
  toBuffer(): Buffer;
  fromBuffer(buffer: Buffer, offset?: number, ...args): number;
  getByteLength(): number;
}
```

### Identity Classes

#### `Principal`
- **Extends:** nothing
- **Implements:** `SerializableEntity`
- **Key fields:** `version: BigNumber`, `flags: BigNumber`, `min_sigs: BigNumber`, `primary_addresses: Array<KeyID>`
- **toBuffer/fromBuffer:** YES
- **toJson/fromJson:** NO

#### `Identity`
- **Extends:** `Principal`
- **Implements:** `SerializableEntity`
- **Key fields:** `parent: IdentityID`, `system_id: IdentityID`, `name: string`, `content_map: Map<string, Buffer>`, `content_multimap: ContentMultiMap`, `revocation_authority: IdentityID`, `recovery_authority: IdentityID`, `private_addresses: Array<SaplingPaymentAddress>`, `unlock_after: BigNumber`
- **Static versions:** VERSION_INVALID(0), VERSION_VERUSID(1), VERSION_VAULT(2), VERSION_PBAAS(3), VERSION_CURRENT(3)
- **toBuffer/fromBuffer:** YES
- **toJson/fromJson:** YES (`VerusCLIVerusIDJson` format)
- **Notable methods:** `lock()`, `unlock()`, `revoke()`, `unrevoke()`, `getIdentityAddress()`, `isRevoked()`, `isLocked()`, `setPrimaryAddresses()`, `setRevocation()`, `setRecovery()`, `upgradeVersion()`

#### `PartialIdentity`
- **Extends:** `Identity`
- **Implements:** `SerializableEntity`
- **Key fields:** `contains: BigNumber` (bitmask controlling which fields are present)
- **Static flags:** `PARTIAL_ID_CONTAINS_PARENT`, `PARTIAL_ID_CONTAINS_CONTENT_MULTIMAP`, `PARTIAL_ID_CONTAINS_PRIMARY_ADDRS`, `PARTIAL_ID_CONTAINS_REVOCATION`, `PARTIAL_ID_CONTAINS_RECOVERY`, `PARTIAL_ID_CONTAINS_UNLOCK_AFTER`, `PARTIAL_ID_CONTAINS_SYSTEM_ID`, `PARTIAL_ID_CONTAINS_PRIV_ADDRS`, `PARTIAL_ID_CONTAINS_CONTENT_MAP`, `PARTIAL_ID_CONTAINS_MINSIGS`, `PARTIAL_ID_CONTAINS_FLAGS`, `PARTIAL_ID_CONTAINS_VERSION`
- **toBuffer/fromBuffer:** YES (overrides Identity to serialize only the fields indicated by `contains`)
- **toJson/fromJson:** YES (from Identity parent)

### ID & Address Types

#### `IdentityID`
- **Extends:** `Hash160SerEnt` (from vdxf/classes/Hash160)
- **Implements:** `SerializableEntity`
- **Key fields:** `hash: Buffer` (20 bytes), `version` = I_ADDR_VERSION (102)
- **toBuffer/fromBuffer:** YES
- **toJson/fromJson:** NO (has `toAddress()`, `fromAddress()`)

#### `KeyID`
- **Extends:** `Hash160SerEnt`
- **Implements:** `SerializableEntity`
- **Key fields:** `hash: Buffer` (20 bytes), `version` = R_ADDR_VERSION (60)  
- **toBuffer/fromBuffer:** YES
- **toJson/fromJson:** NO (has `toAddress()`, `fromAddress()`)

#### `NoDestination`
- **Extends:** `Hash160SerEnt`
- **Implements:** `SerializableEntity`
- **Key fields:** empty buffer
- **toBuffer/fromBuffer:** YES (no-op)
- **toJson/fromJson:** NO

#### `PubKey`
- **Extends:** nothing
- **Implements:** `SerializableEntity`
- **Key fields:** `bytes: Buffer`, `compressed: boolean`
- **Static:** `PUBLIC_KEY_SIZE = 65`, `COMPRESSED_PUBLIC_KEY_SIZE = 33`
- **toBuffer/fromBuffer:** YES
- **toJson/fromJson:** NO

#### `UnknownID`
- **Extends:** nothing
- **Implements:** `SerializableEntity`
- **Key fields:** `bytes: Buffer`
- **toBuffer/fromBuffer:** YES
- **toJson/fromJson:** NO

#### `TxDestination`
- **Extends:** nothing
- **Implements:** `SerializableEntity`
- **Key fields:** `type: BigNumber`, `data: TxDestinationVariant` (union of `IdentityID | KeyID | NoDestination | PubKey | UnknownID`)
- **Static types:** TYPE_INVALID(0), TYPE_PK(1), TYPE_PKH(2), TYPE_SH(3), TYPE_ID(4), TYPE_INDEX(5), TYPE_QUANTUM(6)
- **toBuffer/fromBuffer:** YES
- **toJson/fromJson:** NO (has `toAddress()`, `fromChunk()`, `toChunk()`)

### Transfer & Token Types

#### `TransferDestination`
- **Extends:** nothing
- **Implements:** `SerializableEntity`
- **Key fields:** `type: BigNumber`, `destination_bytes: Buffer`, `gateway_id: string`, `gateway_code: string`, `fees: BigNumber`, `aux_dests: Array<TransferDestination>`
- **Destination type constants:** `DEST_INVALID(0)`, `DEST_PK(1)`, `DEST_PKH(2)`, `DEST_SH(3)`, `DEST_ID(4)`, `DEST_FULLID(5)`, `DEST_REGISTERCURRENCY(6)`, `DEST_QUANTUM(7)`, `DEST_NESTEDTRANSFER(8)`, `DEST_ETH(9)`, `DEST_ETHNFT(10)`, `DEST_RAW(11)`
- **Flag constants:** `FLAG_DEST_AUX(64)`, `FLAG_DEST_GATEWAY(128)`
- **toBuffer/fromBuffer:** YES
- **toJson/fromJson:** YES (`TransferDestinationJson`)
- **Notable methods:** `isGateway()`, `hasAuxDests()`, `isIAddr()`, `isPKH()`, `isETHAccount()`, `typeNoFlags()`, `getAddressString()`

#### `TokenOutput`
- **Extends:** nothing
- **Implements:** `SerializableEntity`
- **Key fields:** `version: BigNumber`, `reserve_values: CurrencyValueMap`
- **toBuffer/fromBuffer:** YES
- **toJson/fromJson:** NO (has `firstCurrency()`, `firstValue()`, `isValid()`)

#### `ReserveTransfer`
- **Extends:** `TokenOutput`
- **Implements:** `SerializableEntity`
- **Key fields:** `flags: BigNumber`, `fee_currency_id: string`, `fee_amount: BigNumber`, `transfer_destination: TransferDestination`, `dest_currency_id: string`, `second_reserve_id: string`, `dest_system_id: string`
- **Flag constants:** `RESERVE_TRANSFER_VALID(1)`, `RESERVE_TRANSFER_CONVERT(2)`, `RESERVE_TRANSFER_PRECONVERT(4)`, `RESERVE_TRANSFER_FEE_OUTPUT(8)`, `RESERVE_TRANSFER_DOUBLE_SEND(0x10)`, `RESERVE_TRANSFER_MINT_CURRENCY(0x20)`, `RESERVE_TRANSFER_CROSS_SYSTEM(0x40)`, `RESERVE_TRANSFER_BURN_CHANGE_PRICE(0x80)`, `RESERVE_TRANSFER_BURN_CHANGE_WEIGHT(0x100)`, `RESERVE_TRANSFER_IMPORT_TO_SOURCE(0x200)`, `RESERVE_TRANSFER_RESERVE_TO_RESERVE(0x400)`, `RESERVE_TRANSFER_REFUND(0x800)`, `RESERVE_TRANSFER_IDENTITY_EXPORT(0x1000)`, `RESERVE_TRANSFER_CURRENCY_EXPORT(0x2000)`, `RESERVE_TRANSFER_ARBITRAGE_ONLY(0x4000)`
- **toBuffer/fromBuffer:** YES
- **toJson/fromJson:** NO
- **Notable methods:** `isReserveToReserve()`, `isCrossSystem()`, `isConversion()`, `isPreConversion()`, `isFeeOutput()`, `isDoubleSend()`, `isMint()`, `isBurnChangeWeight()`, `isBurnChangePrice()`, `isImportToSource()`, `isRefund()`, `isIdentityExport()`, `isCurrencyExport()`, `isArbitrageOnly()`

#### `CurrencyValueMap`
- **Extends:** nothing
- **Implements:** `SerializableEntity`
- **Key fields:** `value_map: Map<string, BigNumber>`, `multivalue: boolean`
- **toBuffer/fromBuffer:** YES
- **toJson/fromJson:** YES (key→decimal string map)

### Content & Data Types

#### `ContentMultiMap`
- **Extends:** nothing
- **Implements:** `SerializableEntity`
- **Key fields:** `kv_content: Map<string, Array<VdxfUniValue | Buffer>>`
- **toBuffer/fromBuffer:** YES
- **toJson/fromJson:** YES (`ContentMultiMapJson`)

#### `ContentMultiMapRemove`
- **Extends:** nothing
- **Implements:** `SerializableEntity`
- **Key fields:** `version: BigNumber`, `action: BigNumber`, `entry_key: string`, `value_hash: Buffer`
- **Action constants:** `ACTION_REMOVE_ONE_KEYVALUE(1)`, `ACTION_REMOVE_ALL_KEYVALUE(2)`, `ACTION_REMOVE_ALL_KEY(3)`, `ACTION_CLEAR_MAP(4)`
- **toBuffer/fromBuffer:** YES
- **toJson/fromJson:** YES

#### `VdxfUniValue`
- **Extends:** nothing
- **Implements:** `SerializableEntity`
- **Key fields:** `values: Array<{ [key: string]: VdxfUniType }>`, `version: BigNumber`
- **VdxfUniType** = string | Buffer | BigNumber | CurrencyValueMap | Rating | TransferDestination | ContentMultiMapRemove | CrossChainDataRef | SignatureData | DataDescriptor | MMRDescriptor | URLRef | IdentityMultimapRef | Credential
- **toBuffer:** YES
- **fromBuffer:** YES (limited; see note in source—not all types can be reliably decoded)
- **toJson/fromJson:** YES

### Data Descriptors

#### `DataDescriptor`
- **Extends:** nothing
- **Implements:** `SerializableEntity`
- **Key fields:** `version: BigNumber`, `flags: BigNumber`, `objectdata: Buffer`, `label: string`, `mimeType: string`, `salt: Buffer`, `epk: Buffer`, `ivk: Buffer`, `ssk: Buffer`
- **Flag constants:** `FLAG_ENCRYPTED_DATA(1)`, `FLAG_SALT_PRESENT(2)`, `FLAG_ENCRYPTION_PUBLIC_KEY_PRESENT(4)`, `FLAG_INCOMING_VIEWING_KEY_PRESENT(8)`, `FLAG_SYMMETRIC_ENCRYPTION_KEY_PRESENT(0x10)`, `FLAG_LABEL_PRESENT(0x20)`, `FLAG_MIME_TYPE_PRESENT(0x40)`
- **toBuffer/fromBuffer:** YES
- **toJson/fromJson:** YES (`DataDescriptorJson`)
- **Notable methods:** `decodeHashVector()`, `hasEncryptedData()`, `hasSalt()`, `hasEPK()`, `hasMIME()`, `hasIVK()`, `hasSSK()`, `hasLabel()`

#### `VDXFDataDescriptor` (also in DataDescriptor.ts)
- **Extends:** `BufferDataVdxfObject`
- **Key fields:** `dataDescriptor: DataDescriptor`
- **toDataBuffer/fromDataBuffer:** YES

#### `EHashTypes` enum (also in DataDescriptor.ts)
```ts
enum EHashTypes {
  HASH_INVALID = 0,
  HASH_BLAKE2BMMR = 1,
  HASH_BLAKE2BMMR2 = 2,
  HASH_KECCAK = 3,
  HASH_SHA256D = 4,
  HASH_SHA256 = 5,
  HASH_LASTTYPE = 5
}
```

#### `MMRDescriptor`
- **Extends:** nothing
- **Implements:** `SerializableEntity`
- **Key fields:** `version: BigNumber`, `objectHashType: EHashTypes`, `mmrHashType: EHashTypes`, `mmrRoot: DataDescriptor`, `mmrHashes: DataDescriptor`, `dataDescriptors: DataDescriptor[]`
- **toBuffer/fromBuffer:** YES
- **toJson/fromJson:** YES (`MMRDescriptorJson`)

### Proof & Evidence Types

#### `CrossChainProof`
- **Extends:** nothing
- **Implements:** `SerializableEntity`
- **Key fields:** `version: BigNumber`, `chain_objects: Array<EvidenceData>`
- **toBuffer/fromBuffer:** YES
- **toJson/fromJson:** YES (`CrossChainProofJson`)
- **Note:** Currently only supports `CHAINOBJ_EVIDENCEDATA` type

#### `CHAIN_OBJECT_TYPES` enum (in CrossChainProof.ts)
```ts
enum CHAIN_OBJECT_TYPES {
  CHAINOBJ_INVALID = 0,
  CHAINOBJ_HEADER = 1,
  CHAINOBJ_HEADER_REF = 2,
  CHAINOBJ_TRANSACTION_PROOF = 3,
  CHAINOBJ_PROOF_ROOT = 4,
  CHAINOBJ_COMMITMENTDATA = 5,
  CHAINOBJ_RESERVETRANSFER = 6,
  CHAINOBJ_RESERVED = 7,
  CHAINOBJ_CROSSCHAINPROOF = 8,
  CHAINOBJ_NOTARYSIGNATURE = 9,
  CHAINOBJ_EVIDENCEDATA = 10
}
```

#### `EvidenceData`
- **Extends:** nothing
- **Implements:** `SerializableEntity`
- **Key fields:** `version: BigNumber`, `type: BigNumber`, `md: MultiPartDescriptor` (if multipart), `vdxfd: string` (VDXF descriptor if not multipart), `data_vec: Buffer`
- **toBuffer/fromBuffer:** YES
- **toJson/fromJson:** YES (hex-based)

#### `MultiPartDescriptor` (in EvidenceData.ts)
- **Extends:** nothing
- **Implements:** `SerializableEntity`
- **Key fields:** `index: BigNumber`, `total_length: BigNumber`, `start: BigNumber`
- **toBuffer/fromBuffer:** YES

#### `PBaaSEvidenceRef`
- **Extends:** nothing
- **Implements:** `SerializableEntity`
- **Key fields:** `version: BigNumber`, `flags: BigNumber`, `output: UTXORef`, `object_num: BigNumber`, `sub_object: BigNumber`, `system_id: string`
- **toBuffer/fromBuffer:** YES
- **toJson/fromJson:** YES

#### `CrossChainDataRef`
- **Extends:** nothing
- **Implements:** `SerializableEntity`
- **Key fields:** `ref: PBaaSEvidenceRef | IdentityMultimapRef | URLRef`
- **Static types:** TYPE_CROSSCHAIN_DATAREF(0), TYPE_IDENTITY_DATAREF(1), TYPE_URL_REF(2)
- **toBuffer/fromBuffer:** YES
- **toJson/fromJson:** YES

### MMR (Merkle Mountain Range) Classes

#### `MMRNode`
- **Extends:** nothing
- **Key fields:** `hash: Buffer`
- **digest:** Uses Blake2b with "VerusDefaultHash" personalization
- **Notable methods:** `createParentNode()`, `getProofHash()`, `getLeafHash()`, `hashObj()`
- **toBuffer/fromBuffer:** NO (internal data structure)

#### `MMRLayer<NODE_TYPE>`
- **Extends:** nothing (generic container)
- **Key fields:** `vSize: number`, `nodes: Array<NODE_TYPE>`
- **Methods:** `size()`, `getIndex()`, `push_back()`, `clear()`

#### `MerkleMountainRange`
- **Extends:** nothing
- **Key fields:** `layer0: MMRLayer<MMRNode>`, `vSize: number`, `upperNodes: Array<MMRLayer<MMRNode>>`
- **Methods:** `add(leaf)`, `size()`, `height()`, `getNode(height, index)`
- **toBuffer/fromBuffer:** Stub implementations (returns empty)

#### `MMRBranch`
- **Extends:** nothing
- **Key fields:** `branchType: number`, `nIndex: number`, `nSize: number`, `branch: Array<Buffer>`
- **toBuffer/fromBuffer:** YES
- **Notable methods:** `safeCheck(hash)` — verifies an MMR proof

#### `MMRProof`
- **Extends:** nothing
- **Key fields:** `proofSequence: Array<MMRBranch>`
- **toBuffer/fromDataBuffer:** YES
- **Methods:** `setProof(proof)`

#### `MerkleMountainView`
- **Extends:** nothing
- **Key fields:** `mmr: MerkleMountainRange`, `sizes: Array<number>`, `peaks: Array<MMRNode>`, `peakMerkle: Array<Array<MMRNode>>`
- **Methods:** `size()`, `calcPeaks()`, `resize()`, `getPeaks()`, `getRoot()`, `getRootNode()`, `getHash()`, `getProof()`, `getBranchType()`

### Signature & Credential Types

#### `SignatureData`
- **Extends:** nothing
- **Implements:** `SerializableEntity`
- **Key fields:** `version: BigNumber`, `system_ID: string`, `hash_type: BigNumber`, `signature_hash: Buffer`, `identity_ID: string`, `sig_type: BigNumber`, `vdxf_keys: Array<string>`, `vdxf_key_names: Array<string>`, `bound_hashes: Array<Buffer>`, `signature_as_vch: Buffer`
- **toBuffer/fromBuffer:** YES
- **toJson/fromJson:** YES (`SignatureJsonDataInterface`)
- **Notable methods:** `getIdentityHash()`, `getSignatureHashType()` (static)

#### `Credential`
- **Extends:** nothing
- **Implements:** `SerializableEntity`
- **Key fields:** `version: BigNumber`, `flags: BigNumber`, `credentialKey: string`, `credential: Object` (JSON), `scopes: Object` (JSON), `label: string`
- **toBuffer/fromBuffer:** YES
- **toJson/fromJson:** YES (`CredentialJson`)
- **Max JSON string length:** 512

#### `Rating`
- **Extends:** nothing
- **Implements:** `SerializableEntity`
- **Key fields:** `version: BigNumber`, `trust_level: BigNumber`, `ratings: Map<string, Buffer>`
- **Trust constants:** TRUST_UNKNOWN(0), TRUST_BLOCKED(1), TRUST_APPROVED(2)
- **toBuffer/fromBuffer:** YES
- **toJson/fromJson:** YES (`RatingJson`)

### Reference Types

#### `UTXORef`
- **Extends:** nothing
- **Implements:** `SerializableEntity`
- **Key fields:** `hash: Buffer` (32 bytes), `n: BigNumber`
- **toBuffer/fromBuffer:** YES
- **toJson/fromJson:** YES

#### `URLRef`
- **Extends:** nothing
- **Implements:** `SerializableEntity`
- **Key fields:** `version: BigNumber`, `flags: BigNumber`, `data_hash: Buffer`, `url: string`
- **toBuffer/fromBuffer:** YES
- **toJson/fromJson:** YES

#### `IdentityMultimapRef`
- **Extends:** nothing
- **Implements:** `SerializableEntity`
- **Key fields:** `version: BigNumber`, `flags: BigNumber`, `id_ID: string`, `key: string`, `height_start: BigNumber`, `height_end: BigNumber`, `data_hash: Buffer`, `system_id: string`
- **toBuffer/fromBuffer:** YES
- **toJson/fromJson:** YES

### Miscellaneous pbaas Classes

#### `SaltedData`
- **Extends:** `VDXFData` (from vdxf)
- **Key fields:** `salt: Buffer`, `data: Buffer`, `vdxfkey: string`, `version: BigNumber`
- **toBuffer/fromBuffer:** YES
- **toJson/fromJson:** YES

#### `DefinedKey`
- **Extends:** nothing
- **Implements:** `SerializableEntity`
- **Key fields:** `version: BigNumber`, `flags: BigNumber`, `vdxfuri: string`
- **toBuffer/fromBuffer:** YES
- **toJson/fromJson:** NO
- **Notable methods:** `getIAddr()`, `getNameSpaceID()`

#### `OptCCParams`
- **Extends:** nothing
- **Implements:** `SerializableEntity`
- **Key fields:** `version: BigNumber`, `eval_code: BigNumber`, `m: BigNumber`, `n: BigNumber`, `destinations: Array<TxDestination>`, `vdata: Array<Buffer>`
- **toBuffer/fromBuffer:** YES (uses script compile/decompile)
- **toJson/fromJson:** NO
- **Notable methods:** `getParamObject()`, `isValid()`, `fromChunk()`, `toChunk()`

#### `SaplingPaymentAddress`
- **Extends:** nothing
- **Implements:** `SerializableEntity`
- **Key fields:** `d: Buffer` (11 bytes), `pk_d: Buffer` (32 bytes)
- **toBuffer/fromBuffer:** YES
- **toJson/fromJson:** NO (has `toAddressString()`, `fromAddressString()`)

#### `SaplingExtendedSpendingKey`
- **Extends:** nothing
- **Implements:** `SerializableEntity`
- **Key fields:** `depth: number`, `parentFVKTag: Buffer`, `childIndex: Buffer`, `chainCode: Buffer`, `ask: Buffer`, `nsk: Buffer`, `ovk: Buffer`, `dk: Buffer`
- **toBuffer/fromBuffer:** YES (169 bytes)
- **toJson/fromJson:** NO (has `toKeyString()`, `fromKeyString()`)

#### `SaplingExtendedViewingKey`
- **Extends:** nothing
- **Implements:** `SerializableEntity`
- **Key fields:** `depth: number`, `parentFVKTag: Buffer`, `childIndex: Buffer`, `chainCode: Buffer`, `ak: Buffer`, `nk: Buffer`, `ovk: Buffer`, `dk: Buffer`
- **toBuffer/fromBuffer:** YES (169 bytes)
- **toJson/fromJson:** NO (has `toKeyString()`, `fromKeyString()`)

#### `PartialMMRData`
- **Extends:** nothing
- **Implements:** `SerializableEntity`
- **Key fields:** `flags: BigNumber`, `data: Array<{type: BigNumber, data: Buffer | VdxfUniValue}>`, `mmrhashtype: BigNumber`, `salt: Array<Buffer>`, `priormmr: Array<Buffer>`
- **toBuffer/fromBuffer:** YES
- **toJson/fromJson:** YES

#### `PartialSignData`
- **Extends:** nothing
- **Implements:** `SerializableEntity`
- **Key fields:** `flags: BigNumber`, `address: IdentityID | KeyID`, `prefixString: Buffer`, `vdxfKeys: Array<IdentityID>`, `vdxfKeyNames: Array<Buffer>`, `boundHashes: Array<Buffer>`, `hashType: BigNumber`, `encryptToAddress: SaplingPaymentAddress`, `createMMR: boolean`, `signature: Buffer`, `dataType: BigNumber`, `data: Buffer | PartialMMRData | VdxfUniValue`
- **toBuffer/fromBuffer:** YES
- **toJson/fromJson:** YES

---

## `src/utils/` — Utility Functions

### `address.ts`
| Export | Type | Description |
|--------|------|-------------|
| `fromBase58Check(address)` | function | Decodes base58check address → `{version, hash}` |
| `toBase58Check(hash, version)` | function | Encodes hash+version → base58check string |
| `nameAndParentAddrToAddr(name, parentIAddr, version)` | function | Derives address from name + parent i-address |
| `nameAndParentAddrToIAddr(name, parentIAddr)` | function | Same as above with I_ADDR_VERSION |
| `fqnToAddress(fqn, rootSystemName, version)` | function | Resolves a fully-qualified name (e.g., `name.parent.VRSC`) to an address |
| `toIAddress(fqn, rootSystemName)` | function | fqnToAddress with i-addr version |
| `toXAddress(fqn, rootSystemName)` | function | fqnToAddress with x-addr version |
| `getDataKey(keyName, nameSpaceID, verusChainId, version)` | function | Resolves VDXF key name → `{id, namespace}` |
| `decodeDestination(destination)` | function | Decodes base58 address → Buffer |
| `decodeEthDestination(destination)` | function | Decodes 0x-prefixed ETH address → Buffer |

### `bufferutils.ts`
| Export | Type | Description |
|--------|------|-------------|
| `readUInt64LE` | function | Read uint64 LE from buffer |
| `writeUInt64LE` | function | Write uint64 LE to buffer |
| `reverseBuffer` | function | Reverses a buffer in-place |
| `BufferWriter` | class | Sequential binary writer (writeUInt8/16/32/64, writeInt32/64, writeSlice, writeVarSlice, writeVector, writeArray, writeCompactSize, writeVarInt) |
| `BufferReader` | class | Sequential binary reader (readUInt8/16/32/64, readInt32/64, readSlice, readVarSlice, readVector, readArray, readCompactSize, readVarInt) |

### `varint.ts` (Signed VarInt — Bitcoin-style)
| Export | Type | Description |
|--------|------|-------------|
| `encode(number, buffer, offset)` | function | Encode BigNumber as signed varint |
| `decode(buffer, offset)` | function | Decode signed varint → `{decoded: BigNumber, bytes}` |
| `encodingLength(number)` | function | Returns byte length of varint encoding |

### `varuint.ts` (Unsigned VarInt — CompactSize)
| Export | Type | Description |
|--------|------|-------------|
| `encode(number, buffer, offset)` | function | Encode number as CompactSize varuint |
| `decode(buffer, offset)` | function | Decode CompactSize → `{decoded: number, bytes}` |
| `encodingLength(number)` | function | Returns byte length (1/3/5/9) |

### `hash.ts`
| Export | Type | Description |
|--------|------|-------------|
| `hash(...params)` | function | Double-SHA256 of concatenated params |
| `hash160(data)` | function | RIPEMD160(SHA256(data)) |

### `mmr.ts`
| Export | Type | Description |
|--------|------|-------------|
| `GetMMRProofIndex(pos, mmvSize, extraHashes)` | function | Calculates MMR proof index bit pattern as BN |

### `ops.ts`
| Export | Type | Description |
|--------|------|-------------|
| `OPS` | object | Bitcoin script opcode constants (OP_0 through OP_CHECKSIG etc.) |

### `evals.ts`
| Export | Type | Description |
|--------|------|-------------|
| `EVALS` | object | Verus eval code constants (EVAL_NONE=0 through EVAL_NOTARY_SIGNATURE=21) |

### `script.ts`
| Export | Type | Description |
|--------|------|-------------|
| `compile(chunks)` | function | Compiles script chunks to Buffer |
| `decompile(buffer)` | function | Decompiles Buffer to script chunks |
| `isOPInt()`, `isPushOnly()`, `isPushOnlyChunk()`, `asMinimalOP()` | functions | Script analysis helpers |

### `cccustom.ts`
Exports address constants for all Verus eval types:
`STAKE_GUARD_ADDR`, `PBAAS_DEFINITION_ADDR`, `NOTARY_EVIDENCE_ADDR`, `EARNED_NOTARIZATION_ADDR`, `ACCEPTED_NOTARIZATION_ADDR`, `FINALIZE_NOTARIZATION_ADDR`, `RESERVE_OUTPUT_ADDR`, `RESERVE_TRANSFER_ADDR`, `RESERVE_DEPOSIT_ADDR`, `CROSS_CHAIN_EXPORT_ADDR`, `CROSS_CHAIN_IMPORT_ADDR`, `CURRENCY_STATE_ADDR`, `IDENTITY_PRIMARY_ADDR`, etc.

### `tolower.ts`
| Export | Type | Description |
|--------|------|-------------|
| `toLowerCaseCLocale(str)` | function | C-locale-compatible toLowerCase (only ASCII) |

### `string.ts`
| Export | Type | Description |
|--------|------|-------------|
| `isHexString(s)` | function | Tests if string is valid hex |
| `readLimitedString(reader, limit)` | function | Reads a length-prefixed string with max length check |

### `numberConversion.ts`
| Export | Type | Description |
|--------|------|-------------|
| `bnToDecimal(value)` | function | Converts BN (satoshi-like, 1e8) to decimal string |
| `decimalToBn(value)` | function | Converts decimal string/number to BN (multiplied by 1e8) |

### `IdentityData.ts`, `reverseops.ts`, `pushdata.ts`, `sapling.ts`
Internal utility modules (not directly exported from index.ts).

---

## `src/utils/types/` — Type Definitions

### `BigNumber.ts`
```ts
type BigNumber = typeof BNClass;  // Instance type of BN from bn.js
```

### `SerializableEntity.ts`
```ts
interface SerializableEntity {
  toBuffer(): Buffer;
  fromBuffer(buffer: Buffer, offset?: number, ...additionalArgs: any[]): number;
  getByteLength(): number;
}
interface SerializableDataEntity {
  getDataByteLength(): number;
  toDataBuffer(): Buffer;
  fromDataBuffer(buffer: Buffer): void;
}
```

### `DataDescriptor.ts`
```ts
type DataDescriptorInfo = {
  version?: number, flags?: number, objectdata?: string,
  label?: string, mimeType?: string, salt?: string,
  epk?: string, ivk?: string, ssk?: string
}
```

### `MmrDescriptor.ts`
```ts
type MmrDescriptorParameters = {
  version?: number, objecthashtype?: number, mmrhashtype?: number,
  mmrroot?: DataDescriptorInfo, mmrhashes?: DataDescriptorInfo,
  datadescriptors?: DataDescriptorInfo[]
}
```

### `Signature.ts`
```ts
type SignatureDataInfo = {
  version: number, systemid: string, hashtype: number, signaturehash: string,
  identityid: string, signaturetype: number, signature: string
}
```

### `SignData.ts`
```ts
type SignDataParameters = {
  filename?: string, message?: string, messagehex?: string,
  messagebase64?: string, datahash?: string, vdxfdata?: string
}
```

---

## `src/constants/vdxf.ts`

| Constant | Value | Description |
|----------|-------|-------------|
| `VDXF_OBJECT_DEFAULT_VERSION` | BN(1) | Default version for VDXF objects |
| `HASH160_BYTE_LENGTH` | 20 | |
| `HASH256_BYTE_LENGTH` | 32 | |
| `I_ADDR_VERSION` | 102 | i-address version byte |
| `R_ADDR_VERSION` | 60 | r-address version byte |
| `X_ADDR_VERSION` | 137 | x-address version byte |
| `NULL_ADDRESS` | `"i3UXS5QPRQGNRDDqVnyWTnmFCTHDbzmsYk"` | |
| `VERUS_DATA_SIGNATURE_PREFIX` | Buffer | `"Verus signed data:\n"` length-prefixed |

## `src/constants/pbaas.ts`

| Constant | Value | Description |
|----------|-------|-------------|
| `DATA_TYPE_UNKNOWN` | BN(0) | |
| `DATA_TYPE_MMRDATA` | BN(1) | |
| `DATA_TYPE_FILENAME` | BN(2) | |
| `DATA_TYPE_MESSAGE` | BN(3) | |
| `DATA_TYPE_VDXFDATA` | BN(4) | |
| `DATA_TYPE_HEX` | BN(5) | |
| `DATA_TYPE_BASE64` | BN(6) | |
| `DATA_TYPE_DATAHASH` | BN(7) | |
| `DATA_TYPE_RAWSTRINGDATA` | BN(8) | |
| `HASH_TYPE_INVALID` | BN(0) | |
| `HASH_TYPE_BLAKE2B` | BN(1) | |
| `HASH_TYPE_BLAKE2BMMR2` | BN(2) | |
| `HASH_TYPE_KECCAK256` | BN(3) | |
| `HASH_TYPE_SHA256D` | BN(4) | |
| `HASH_TYPE_SHA256` | BN(5) | |
| `DEFAULT_VERUS_CHAINID` | `"i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV"` | |
| `TESTNET_VERUS_CHAINID` | `"iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq"` | |
| `DEFAULT_VERUS_CHAINNAME` | `"VRSC"` | |
| `KOMODO_ASSETCHAIN_MAXLEN` | 65 | |

---

## `src/currency/CurrencyDefinition.ts`

**Type-only** (no class). Exports `CurrencyDefinition` TypeScript type — a comprehensive JSON structure describing a Verus currency with fields:
`version`, `options`, `name`, `currencyid`, `parent`, `systemid`, `notarizationprotocol`, `proofprotocol`, `launchsystemid`, `startblock`, `endblock`, `currencies`, `weights`, `conversions`, `initialsupply`, `prelaunchcarveout`, `initialcontributions`, `idregistrationfees`, `idreferrallevels`, `idimportfees`, `currencyidhex`, `fullyqualifiedname`, `currencynames`, `definitiontxid`, `definitiontxout`, `bestheight`, `lastconfirmedheight`, `bestcurrencystate`, `lastconfirmedcurrencystate`

---

## `src/block/BlockInfo.ts`

**Type-only** (no class). Exports `BlockInfo` interface:
`hash`, `validationtype`, `confirmations`, `size`, `height`, `version`, `merkleroot`, `segid`, `finalsaplingroot`, `tx`, `time`, `nonce`, `solution`, `bits`, `difficulty`, `chainwork`, `chainstake`, `anchor`, `blocktype`, `valuePools`, `previousblockhash`, `nextblockhash`, `proofroot` (with `version`, `type`, `systemid`, `height`, `stateroot`, `blockhash`, `power`)

---

## `src/identity/IdentityDefinition.ts`

**Type-only**. Exports `IdentityDefinition` interface:
`version`, `flags`, `primaryaddresses`, `minimumsignatures`, `name`, `identityaddress`, `parent`, `systemid`, `contentmap`, `contentmultimap`, `revocationauthority`, `recoveryauthority`, `timelock`

---

## `src/api/` — API Communication

### `ApiCommunication.ts`
Interface: `ApiCommunication { toJson(): ApiPrimitive }`

### `ApiPrimitive.ts`
Types: `ApiPrimitive` (union: string | number | boolean | null | ... | Array), `ApiPrimitiveJson`, `RequestParams`

### `ApiRequest.ts`
Abstract class: `ApiRequest` with `chain`, `cmd`, abstract `getParams()`, abstract `toJson()`, and `prepare()` method returning `[chain, cmd, params]`

### `ApiResponse.ts`
Class: `ApiResponse` wrapping a `result: ApiPrimitive` with `toJson()`

### `src/api/classes/`
Contains request/response class pairs for each RPC command:
- **EstimateConversion** — currency conversion estimation
- **FundRawTransaction** — fund a raw transaction
- **GetAddressBalance** — address balance query
- **GetAddressDeltas** — address delta history
- **GetAddressMempool** — mempool for address
- **GetAddressUtxos** — UTXOs for address
- **GetBlock** — block data
- **GetBlockCount** — chain height
- **GetCurrency** — currency definition query
- **GetCurrencyConverters** — available converters
- **GetIdentity** — identity query
- **GetIdentityContent** — identity content query
- **GetInfo** — node info
- **GetOffers** — marketplace offers
- **GetRawTransaction** — raw transaction data
- **GetVdxfId** — VDXF id resolution
- **ListCurrencies** — list currencies
- **MakeOffer** — create marketplace offer
- **SendCurrency** — send currency
- **SendRawTransaction** — broadcast raw tx
- **SignData** — sign arbitrary data
- **SignMessage** — sign message with identity
- **SignRawTransaction** — sign raw transaction
- **UpdateIdentity** — update identity fields
- **VerifyMessage** — verify signed message
- **ZGetOperationStatus** — z-operation status

---

## Quick Reference: Serialization Pattern

Nearly all pbaas classes follow this pattern:
```ts
class Foo implements SerializableEntity {
  // Constructor takes optional init data
  constructor(data?: {...}) { ... }
  
  // Binary serialization
  getByteLength(): number { ... }
  toBuffer(): Buffer { ... }
  fromBuffer(buffer: Buffer, offset?: number): number { ... }
  
  // JSON serialization (where supported)
  toJson(): FooJson { ... }
  static fromJson(data: FooJson): Foo { ... }
}
```

The library uses:
- **`bn.js`** (`BN`) for all big numbers (aliased as `BigNumber`)
- **Signed varints** (`varint.ts`) for BigNumber-typed fields
- **CompactSize** (`varuint.ts`) for array lengths and byte-slice lengths
- **Base58Check** encoding for all Verus/Bitcoin-style addresses
- **Blake2b** (with "VerusDefaultHash" personalization) for MMR hashing
- **SHA256d** and **RIPEMD160(SHA256)** for address derivation
