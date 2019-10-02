import Migration from "../models/migration";
import SandblockChainClient from "sandblock-chain-sdk-js/dist/client";

const emitNewTransfer = async (destination: string, amount: number): Promise<any> => {
    const sbc = new SandblockChainClient();
    if(!process.env.WALLET_MIGRATION_PRIVATE_KEY){
        throw new Error(`Missing wallet private key in the environment`);
    }
    await sbc.setPrivateKey(Buffer.from(process.env.WALLET_MIGRATION_PRIVATE_KEY, 'hex'));

    const payload = await sbc.transfer(destination, "sbc", amount, "Satisfaction Token Migration");
    return await sbc.dispatch(payload);

}

export const ProcessWaitingMigration = async () => {
    const migrations = await Migration.findAll({where: {state: 'WAITING'}});
    console.log(`${migrations.length} migrations requests to process`);
    await migrations.forEach(async (migration: Migration, index: number)=>{
        const tx = await emitNewTransfer(migration.to_address, parseInt(migration.amount));
        if(!tx || !tx.logs || tx.logs.length  <= 0 || !tx.logs[0].success){
            migration.message = "Error while processing transaction: " + JSON.stringify(tx.logs);
            migration.tx_hash = tx.txhash || null;
            migration.state = "REFUSED";
            migration.save();
            return;
        }

        migration.message = 'Migration successfully applied';
        migration.tx_hash = tx.txhash;
        migration.state = "ACCEPTED";
        migration.save();
    });
}
