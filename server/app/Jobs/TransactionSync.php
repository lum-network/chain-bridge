<?php

namespace App\Jobs;

use App\Events\NewTransaction;
use App\Libraries\SandblockChain;
use App\Models\Account;
use App\Models\Block;
use App\Models\Transaction;
use Illuminate\Bus\Queueable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Support\Facades\Log;

class TransactionSync implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    private $hash;
    private $blockID;

    public function __construct($hash, $blockID = null)
    {
        $this->hash = $hash;
        $this->blockID = $blockID;
    }

    private function getAccountByAddress($address)
    {
        if(strlen($address) <= 0){
            return NULL;
        }

        $account = Account::where(['address'=>$address]);

        if(!$account->exists()){
            $sbc = new SandblockChain();
            $remoteAcc = $sbc->getAccount(strtolower($address));
            if(!isset($remoteAcc['account']['value']['address']) || strlen($remoteAcc['account']['value']['address']) <= 0){
                return NULL;
            }

            $acc = Account::create([
                "address"           =>  strtolower($address),
                "coins"             =>  json_encode($remoteAcc['account']['value']['coins']),
                "public_key_type"   =>  $remoteAcc['account']['value']['public_key']['type'],
                "public_key_value"  =>  $remoteAcc['account']['value']['public_key']['value'],
                "account_number"    =>  $remoteAcc['account']['value']['account_number'],
                "sequence"          =>  $remoteAcc['account']['value']['sequence']
            ]);
        } else {
            $acc = $account->first();
        }

        return $acc;
    }

    public function handle()
    {
        $sb = new SandblockChain();
        $tx = $sb->getTransaction($this->hash);

        if(isset($tx['error'])){
            return Log::error('Cannot find the transaction');
        }

        $action = NULL;
        $sender = NULL;
        $recipient = NULL;
        $amount = NULL;
        $name = NULL;
        /* Fetch the different datas */
        if(isset($tx['tx']['value']['msg'][0])){
            $msg = $tx['tx']['value']['msg'][0];
            if(isset($msg['value']['from_address'])) {
                $sender = $msg['value']['from_address'];
            }
            if(isset($msg['value']['to_address'])) {
                $recipient = $msg['value']['to_address'];
            }
            switch($msg['type'])
            {
                case "cosmos-sdk/MsgSend":
                    $action = "send";
                    $amount = (isset($msg['value']['amount'][0])) ? $msg['value']['amount'][0]['amount'] : NULL;
                    $name = (isset($msg['value']['amount'][0])) ? $msg['value']['amount'][0]['denom'] : NULL;
                    break;

                case "surprise/CreateBrandedToken":
                    $action = "create_branded_token";
                    $amount = (isset($msg['value']['amount'])) ? $msg['value']['amount'] : NULL;
                    $name = (isset($msg['value']['name'])) ? $msg['value']['name'] : NULL;
                    break;

                case "surprise/TransferBrandedToken":
                    $action = "transfer_branded_token";
                    $amount = (isset($msg['value']['amount'])) ? $msg['value']['amount'] : NULL;
                    $name = (isset($msg['value']['name'])) ? $msg['value']['name'] : NULL;
                    break;

                case "surprise/TransferBrandedTokenOwnership":
                    $action = "transfer_branded_token_ownership";
                    $name = (isset($msg['value']['name'])) ? $msg['value']['name'] : NULL;
                    break;

                case "surprise/MintBrandedToken":
                    $action = "mint_branded_token";
                    $amount = (isset($msg['value']['amount'])) ? $msg['value']['amount'] : NULL;
                    $name = (isset($msg['value']['name'])) ? $msg['value']['name'] : NULL;
                    break;

                case "surprise/BurnBrandedToken":
                    $action = "burn_branded_token";
                    $amount = (isset($msg['value']['amount'])) ? $msg['value']['amount'] : NULL;
                    $name = (isset($msg['value']['name'])) ? $msg['value']['name'] : NULL;
                    break;

                default:
                    $action = "unregistered";
                    break;
            }
        }

        //Prevent JSON parsing error for subfield
        $tx['raw_log'] = json_decode($tx['raw_log'], true);

        $senderAccount = $this->getAccountByAddress($sender);
        $recipientAccount = $this->getAccountByAddress($recipient);

        $tx = Transaction::create([
            'height'            =>  $tx['height'],
            'hash'              =>  $this->hash,
            'action'            =>  $action,
            'block_id'          =>  $this->blockID,
            'code'              =>  (isset($tx['code'])) ? $tx['code'] : NULL,
            'success'           =>  (isset($tx['logs'][0])) ? $tx['logs'][0]['success'] : false,
            'log'               =>  (isset($tx['logs'][0])) ? json_encode($tx['logs'][0]['log']) : NULL,
            'gas_wanted'        =>  $tx['gas_wanted'],
            'gas_used'          =>  $tx['gas_used'],
            'from_address'      =>  $sender,
            'sender_id'         =>  ($senderAccount) ? $senderAccount->id : NULL,
            'recipient_id'      =>  ($recipientAccount) ? $recipientAccount->id : NULL,
            'to_address'        =>  $recipient,
            'name'              =>  $name,
            'amount'            =>  $amount,
            'dispatched_at'     =>  $tx['timestamp'],
            'raw'               =>  json_encode($tx)
        ]);
        $tx->refresh();
        event(new NewTransaction($tx));
        Log::info('Transaction ingested');
    }
}
