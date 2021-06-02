import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { QueueJobs, Queues } from '@app/utils/constants';
import { Logger } from '@nestjs/common';
import { LumNetworkService } from '@app/services';
import { LumConstants, LumMessages, LumTypes, LumWalletFactory } from '@lum-network/sdk-javascript';
import { config } from '@app/utils/config';

@Processor(Queues.QUEUE_FAUCET)
export class CoreConsumer {
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
                amount: '100000000',
            },
        ]);
        const fee = {
            amount: [{ denom: LumConstants.MicroLumDenom, amount: '1000' }],
            gas: '100000',
        };
        const account = await clt.getAccount(wallet.getAddress());
        if (!account) {
            this._logger.error('Cannot dispatch faucet request, failed to acquire account instance');
            return;
        }
        const doc: LumTypes.Doc = {
            fee,
            memo: 'Faucet',
            messages: [sendMsg],
            chainId: await clt.getChainId(),
            signers: [
                {
                    accountNumber: account.accountNumber,
                    sequence: account.sequence,
                    publicKey: wallet.getPublicKey(),
                },
            ],
        };
        const result = await clt.signAndBroadcastTx(wallet, doc);
        this._logger.debug(result);
    }
}
