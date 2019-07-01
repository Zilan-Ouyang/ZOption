// /*global contract, config, it, assert*/

const SimpleCallOption = require('Embark/contracts/SimpleCallOption');

let accounts;

// For documentation please see https://embark.status.im/docs/contracts_testing.html
config({
  // deployment: {
  //  accounts: [
  //    // you can configure custom accounts with a custom balance
  //    // see https://embark.status.im/docs/contracts_testing.html#Configuring-accounts
  //  ]
  // },
  contracts: {
    "SimpleCallOption": {
      args: [
        '0x5dc59f8f0d5a190068424a9006cf583e7abdd64c','0xdd870fa1b7c4700f2bd7f44238821c26f7392148'
      ]
    }
  }
}, (_err, web3_accounts) => {
  accounts = web3_accounts
});

contract("SimpleCallOption ", function () {
  this.timeout(0);

  it("a call option contract was deployed", async()=> {
    let address = await SimpleCallOption.options.address;
    assert.ok(address);
  });

  it("set value for spot price as admin", async function () {
    await SimpleCallOption.methods.setCurrentMarketPrice(150).send({from: accounts[0]});
    let result = await SimpleCallOption.methods.getCurrentMarketPrice().call();
    assert.strictEqual(parseInt(result, 10), 150);
  });

  it("set value for spot price as non-admin", async function () {
    try{
      await SimpleCallOption.methods.setCurrentMarketPrice(150).send({from: accounts[1]});
    }
    catch(error){
      let actualMessage = error.message;
      let expectedMessage = "you don't have authority";
      assert(actualMessage.includes(expectedMessage));
    }
  });
  context('add new option when spot price is reasonable', function(){
    //let newOption = ['0x80c846af8e5ae9153538d759f7ad35e9461b5699','new Call option', 100, 2, 12]
    it('as admin', async function(){
      await SimpleCallOption.methods.setCurrentMarketPrice(150).send({from: accounts[0]});
      await SimpleCallOption.methods.addOption('0x80c846af8e5ae9153538d759f7ad35e9461b5699','new Call option', 100, 2, 12).send({from: accounts[0]});
    })
    it('as non-admin', async function(){
      try{
        await SimpleCallOption.methods.setCurrentMarketPrice(150).send({from: accounts[1]});
        await SimpleCallOption.methods.addOption('0x80c846af8e5ae9153538d759f7ad35e9461b5699','new Call option', 100, 2, 12).send({from: accounts[1]});
      }
      catch(error){
        let actualMessage = error.message;
        //console.log(actualMessage);
        let expectedMessage = "you don't have authority";
        assert(actualMessage.includes(expectedMessage));
      }
    })
  })

  context('add new option when spot price is not reasonable', function(){
    //let newOption = ['0x80c846af8e5ae9153538d759f7ad35e9461b5699','new Call option', 100, 2, 12]
    it('as admin', async function(){
      try{
        await SimpleCallOption.methods.setCurrentMarketPrice(0).send({from: accounts[0]});
        await SimpleCallOption.methods.addOption('0x80c846af8e5ae9153538d759f7ad35e9461b5699','new Call option', 100, 2, 12).send({from: accounts[0]});
      }
      catch(error){
        let actualMessage = error.message;
        let expectedMessage = "transaction cannot be processed, current market price is unavailable right now";
        assert(actualMessage.includes(expectedMessage));
      }
    })
    it('as non-admin', async function(){
      try{
        await SimpleCallOption.methods.setCurrentMarketPrice(0).send({from: accounts[0]});
        await SimpleCallOption.methods.addOption('0x80c846af8e5ae9153538d759f7ad35e9461b5699','new Call option', 100, 2, 12).send({from: accounts[4]});
      }
      catch(error){
        let actualMessage = error.message;
        let expectedMessage = "you don't have authority";
        //console.log(error.message);
        assert(actualMessage.includes(expectedMessage));
      }
    })
  });
  context("calculating call premium", function(){
    // let newOption = ['0x80c846af8e5ae9153538d759f7ad35e9461b5699','new Call option', 100, 2, 12]
    // let newOption2 = ['0x80c846af8e5ae9153538d759f7ad35e9461b5699','new Call option', 100, -1, 12]
    before("set spot price then add option", async function(){
      await SimpleCallOption.methods.setCurrentMarketPrice(150).send({from: accounts[0]});
      await SimpleCallOption.methods.addOption('0x80c846af8e5ae9153538d759f7ad35e9461b5699','new Call option', 100, 2, 12).send({from: accounts[0]});
    });
    it('when time to maturity is larger than 0', async function(){
      let result = await SimpleCallOption.methods.CallOptionPremiumCalculator('0x80c846af8e5ae9153538d759f7ad35e9461b5699').call();
      //console.log(result)
      assert.strictEqual(parseInt(result,10), 50);
    });
    before("set spot price then add option", async function(){
      await SimpleCallOption.methods.setCurrentMarketPrice(150).send({from: accounts[0]});
      await SimpleCallOption.methods.addOption('0x80c846af8e5ae9153538d759f7ad35e9461b5699','new Call option', 100, -1, 12).send({from: accounts[0]});
    });
    it('when time to maturity is not vaid', async function(){
      try{
        await SimpleCallOption.methods.CallOptionPremiumCalculator('0x80c846af8e5ae9153538d759f7ad35e9461b5699').call();
      }
      catch(error){
        let actualMessage = error.message;
        let expectedMessage = "time to maturity has to be positve";
        assert(actualMessage.includes(expectedMessage));
      }
    });
  });
  context("pay premium", function(){
    //let newOption = ['0x80c846af8e5ae9153538d759f7ad35e9461b5699','new Call option', 100, 2, 12]
    beforeEach("set spot price then add option", async function(){
      await SimpleCallOption.methods.setCurrentMarketPrice(150).send({from: accounts[0]});
      await SimpleCallOption.methods.addOption('0x80c846af8e5ae9153538d759f7ad35e9461b5699','new Call option', 100, 2, 12).send({from: accounts[0]});
    });
    it('pay premium as buyer', async function(){
      await SimpleCallOption
      let result = await SimpleCallOption.methods.payPremium('0x80c846af8e5ae9153538d759f7ad35e9461b5699').call({from: accounts[0]});
      
      assert.strictEqual(parseInt(result,10), 50);
      
    } );
    it('pay premium as non-buyer', async function(){
      try{
        await SimpleCallOption.methods.payPremium('0x80c846af8e5ae9153538d759f7ad35e9461b5699').send({from: accounts[0]});
      }
      catch(error){
        let actualMessage = error.message;
        let expectedMessage = "you don't have authority";
        assert(actualMessage.includes(expectedMessage));
      }
    })
  });
  context("trade option and change ownership of the option with authority", function(){
    before("set spot price then add option", async function(){
      await SimpleCallOption.methods.setCurrentMarketPrice(150).send({from: accounts[0]});
      await SimpleCallOption.methods.addOption('0x80c846af8e5ae9153538d759f7ad35e9461b5699','new Call option', 100, 12, 12).send({from: accounts[0]});
    });
    it('before gets expired', async function(){
      let result = await SimpleCallOption.methods.tradeOptionBeforeExpiry('0x80c846af8e5ae9153538d759f7ad35e9461b5699', accounts[1]).send({from: accounts[0]});
      assert.ok(result)
    });
    before("set spot price then add expired option", async function(){
      await SimpleCallOption.methods.setCurrentMarketPrice(150).send({from: accounts[0]});
      await SimpleCallOption.methods.addOption('0x80c846af8e5ae9153538d759f7ad35e9461b5697','new Call option', 100, 0, 12).send({from: accounts[0]});
    });
    it('after gets expired', async function(){
      try{
        await SimpleCallOption.methods.tradeOptionBeforeExpiry('0x80c846af8e5ae9153538d759f7ad35e9461b5697', accounts[1]).send({from: accounts[0]});
      }
      catch(error){
        let actualMessage = error.message;
        let expectedMessage = "it's expired";
        assert(actualMessage.includes(expectedMessage));
      }
    })
  });
  context('trade option without authority', function(){
    before('adding option, before expired', async function(){
      await SimpleCallOption.methods.setCurrentMarketPrice(150).send({from: accounts[0]});
      await SimpleCallOption.methods.addOption('0x80c846af8e5ae9153538d759f7ad35e9461b5699','new Call option', 100, 12, 12).send({from: accounts[0]});
    });
    it('no permission trade', async function(){
      try{
        await SimpleCallOption.methods.tradeOptionBeforeExpiry('0x80c846af8e5ae9153538d759f7ad35e9461b5699', accounts[1]).send({from: accounts[4]});
      }
      catch(error){
        let actualMessage = error.message;
        let expectedMessage = "you don't have authority";
        assert(actualMessage.includes(expectedMessage));
      }
    });
    before('expired option', async function(){
      await SimpleCallOption.methods.setCurrentMarketPrice(150).send({from: accounts[0]});
      await SimpleCallOption.methods.addOption('0x80c846af8e5ae9153538d759f7ad35e9461b5697','new Call option', 100, 0, 12).send({from: accounts[0]});
    });
    it('no permission trade', async function(){
      try{
        await await SimpleCallOption.methods.tradeOptionBeforeExpiry('0x80c846af8e5ae9153538d759f7ad35e9461b5697', accounts[1]).send({from: accounts[4]});
      }
      catch(error){
        let actualMessage = error.message;
        let expectedMessage = "you don't have authority";
        assert(actualMessage.includes(expectedMessage));
      }
    })
  })
})

