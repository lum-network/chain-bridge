import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { QueueJobs, Queues } from '@app/Utils/Constants';
import { Logger } from '@nestjs/common';
import { LumNetworkService } from '@app/Services';
import { LumConstants, LumMessages, LumWalletFactory } from '@lum-network/sdk-javascript';
import { config } from '@app/Utils/Config';

@Processor(Queues.QUEUE_DEFAULT)
export default class CoreConsumer {
    private readonly _logger: Logger = new Logger(CoreConsumer.name);

    constructor(private readonly _lumNetworkService: LumNetworkService) {}

    @Process(QueueJobs.MINT_FAUCET_REQUEST)
    async mintFaucetRequest(job: Job<{ address: string }>) {
        const wallet = await LumWalletFactory.fromMnemonic(config.getFaucetMnemonic());
        if (!wallet) {
            this._logger.error(`Unable to generate wallet for address ${job.data.address}`);
            return;
        }
        const clt = await this._lumNetworkService.getClient();
        const sendMsg = LumMessages.BuildMsgSend(wallet.getAddress(), job.data.address, [
            {
                denom: LumConstants.MicroLumDenom,
                amount: '10000000000',
            },
        ]);
        const fee = {
            amount: [{ denom: LumConstants.MicroLumDenom, amount: '5000000' }],
            gas: '100000',
        };
        const account = await clt.getAccount(wallet.getAddress());
        if (!account) {
            this._logger.error('Cannot dispatch faucet request, failed to acquire account instance');
            return;
        }
        const doc = {
            fee,
            memo: 'Faucet',
            messages: [sendMsg],
            accountNumber: account.accountNumber,
            sequence: account.sequence,
            chainId: await clt.getChainId(),
        };
        const result = await clt.signAndBroadcastTx(wallet, doc);
        this._logger.debug(result);
    }
}
