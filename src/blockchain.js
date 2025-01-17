const SHA256 = require('crypto-js/sha256');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

class Transactions{
    constructor(fromAddress,toAddress,amount){
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.amount = amount;
    }
    calculateHash(){
        return SHA256(this.fromAddress + this.toAddress+ this.amount).toString();

    }
    signTransaction(signingKey){
        if(signingKey.getPublic('hex')!== this.fromAddress){
            throw new Error('You cannot sign transactions for other wallets!')
        }
        const hashTx = this.calculateHash();
        const sig = signingKey.sign(hashTx,'base64');
        this.signature = sig.toDER('hex');

    }
    isValid(){
        if(this.fromAddress ===null)return true;
        if(!this.signature || this.signature.length === 0){
            throw new console.Error('No signature in this transaction');
        }
        const publicKey = ec.keyFromPublic(this.fromAddress,'hex');
        return publicKey.verify(this.calculateHash(), this.signature)
    }
    
}
class Block{
    constructor(timestamp,transactions,previousHash =''){
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.hash = this.calculateHash();
        this.nonce = 0;
    }
    calculateHash(){
        return SHA256(this.index +this.previousHash+this.timestamp+JSON.stringify(this.data)+this.nonce).toString();
    }
    mineBlock(difficulty){
        while(this.hash.substring(0,difficulty)!== Array(difficulty+1).join("0")){
            this.nonce++;
            this.hash = this.calculateHash();
        }
        console.log("BLOCK MINED: " + this.hash);

    }
    hasValidTransactions(){
        for(const tx of this.transactions){
            if(!tx.isValid()){
                return false;
            }
        }
        return true;

    }
}
class Blockchain{
    constructor(){
        this.chain=[this.createGenesisBlock()];
        this.difficulty = 2;
        this.pendingTransactions = [];
        this.miningReward = 100;
    }
    createGenesisBlock(){
        return new Block("04/07/2024","Genesis block","0")
    }
    
    getLatestBlock(){
        return this.chain[this.chain.length -1];
    }

   
    minePendingTransactions(miningRewardAddress){
        const reward = new Transactions(null,miningRewardAddress,this.miningReward);
        this.pendingTransactions.push(reward);
        const block = new Block(Date.now(),this.pendingTransactions,this.getLatestBlock().hash);
        block.mineBlock(this.difficulty);
        console.log("Block mined");
        this.chain.push(block);
        this.pendingTransactions = [];
        

    }
    addTransactions(transaction){
        if(!transaction.fromAddress || !transaction.toAddress){
            throw new Error('Transactions must include from and to address');

        }
        if(!transaction.isValid()){
            throw new Error('Cannot add invalid transaction to chain ')


        }


        this.pendingTransactions.push(transaction);
    }
    getBalanceofAddress(address){
        let balance = 0;
        for(const block of this.chain){
            for(const trans of block.transactions){
                if(trans.fromAddress === address){
                    balance-=trans.amount;
                }
                if(trans.toAddress === address){
                    balance+=trans.amount;
                }

            }
        }
        return balance;

    }
    isChainValid(){
        for (let i =1; i<this.chain.length;i++){
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i-1];
            if(!currentBlock.hasValidTransactions()){
                console.log('reason1');
                return false;
                
            }

            if(currentBlock.hash !==  currentBlock.calculateHash()){
                console.log('reason2');
                return false;
            }
            if(previousBlock.hash !== currentBlock.previousHash){
                console.log('reason3');
                return false;
            }
            // if(this.chain[0]!==this.createGenesisBlock()){
            //     return false;
            // }
            
        }
        return true;
        
        
    }
    
    
}
module.exports.Blockchain = Blockchain;
module.exports.Block = Block;
module.exports.Transactions = Transactions;