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
            if(!isset($remoteAcc['value']['address']) || strlen($remoteAcc['value']['address']) <= 0){
                Log::error('Unable to fetch account');
                return NULL;
            }

            $acc = Account::create([
                "address"           =>  strtolower($address),
                "coins"             =>  json_encode($remoteAcc['value']['coins']),
                "public_key_type"   =>  $remoteAcc['value']['public_key']['type'],
                "public_key_value"  =>  $remoteAcc['value']['public_key']['value'],
                "account_number"    =>  $remoteAcc['value']['account_number'],
                "sequence"          =>  $remoteAcc['value']['sequence']
            ]);
        } else {
            $acc = $account->first();
        }

        return $acc;
    }

    public function extractSender($msg)
    {
        /* Most of messages */
        if(isset($msg['value']['from_address'])) {
            return $msg['value']['from_address'];
        }

        /* Create validator message */
        if(isset($msg['value']['delegator_address'])){
            return $msg['value']['delegator_address'];
        }

        return NULL;
    }

    public function extractRecipient($msg)
    {
        /* Most of messages */
        if(isset($msg['value']['to_address'])) {
            return $msg['value']['to_address'];
        }

        /* Create validator message */
        if(isset($msg['value']['validator_address'])){
            return $msg['value']['validator_address'];
        }

        return NULL;
    }

    public function handle()
    {
        $sb = new SandblockChain();
        $tx = $sb->getTransaction($this->hash);

        if(isset($tx['error'])){
            return Log::error('Cannot find the transaction');
        }

        $action = NULL;
        $amount = NULL;
        $name = NULL;
        $senderAccount = NULL;
        $recipientAccount = NULL;
        /* Fetch the different datas */
        if(isset($tx['tx']['value']['msg'][0])){
            $msg = $tx['tx']['value']['msg'][0];
            $sender = $this->extractSender($msg);
            $recipient = $this->extractRecipient($msg);
            switch($msg['type'])
            {
                case "cosmos-sdk/MsgSend":
                    $action = "send";
                    $amount = (isset($msg['value']['amount'][0])) ? $msg['value']['amount'][0]['amount'] : NULL;
                    $name = (isset($msg['value']['amount'][0])) ? $msg['value']['amount'][0]['denom'] : NULL;
                    break;

                case "cosmos-sdk/MsgCreateValidator":
                    $action = "create_validator";
                    $amount = (isset($msg['value']['value'])) ? $msg['value']['value']['amount'] : NULL;
                    $name = (isset($msg['value']['value'])) ? $msg['value']['value']['denom'] : NULL;
                    break;

                case "cosmos-sdk/MsgEditValidator":
                    $action = "edit_validator";
                    break;

                case "surprise/CreateBrandedToken":
                    $action = "create_branded_token";
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

        if(strpos($sender, 'sandvaloper') !== 0) {
            $senderAccount = $this->getAccountByAddress($sender);
        }
        if(strpos($recipient, 'sandvaloper') !== 0) {
            $recipientAccount = $this->getAccountByAddress($recipient);
        }


        if(Transaction::where(['hash'=>$this->hash])->exists() == false) {
            $tx = Transaction::create([
                'height' => $tx['height'],
                'hash' => $this->hash,
                'action' => $action,
                'block_id' => $this->blockID,
                'code' => (isset($tx['code'])) ? $tx['code'] : NULL,
                'success' => (isset($tx['logs'][0])) ? $tx['logs'][0]['success'] : false,
                'log' => (isset($tx['logs'][0])) ? json_encode($tx['logs'][0]['log']) : NULL,
                'gas_wanted' => $tx['gas_wanted'],
                'gas_used' => $tx['gas_used'],
                'from_address' => $sender,
                'sender_id' => ($senderAccount) ? $senderAccount->id : NULL,
                'recipient_id' => ($recipientAccount) ? $recipientAccount->id : NULL,
                'to_address' => $recipient,
                'name' => $name,
                'amount' => $amount,
                'dispatched_at' => $tx['timestamp'],
                'raw' => json_encode($tx)
            ]);
            $tx->refresh();
            event(new NewTransaction($tx));
            Log::info('Transaction ingested');
        } else {
            Log::info('Transaction already present, updated');
        }
    }
}
