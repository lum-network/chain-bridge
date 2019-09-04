import Migration from "../models/migration";

export const ProcessWaitingMigration = async () => {
    const migrations = await Migration.findAll({where: {state: 'WAITING'}});
    console.log(`${migrations.length} migrations requests to process`);
    await migrations.forEach((migration: Migration, index: number)=>{
        //TODO: Emit transaction from wallet
        //const tx = null;
        const tx = {txhash: 'jefaisuntest'};
        if(!tx){
            return;
        }

        migration.tx_hash = tx.txhash;
        migration.state = "ACCEPTED";
        migration.save();
    });
}
