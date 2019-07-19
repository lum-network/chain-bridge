<?php

namespace App\Jobs;

use App\Events\NewTransaction;
use App\Libraries\SandblockChain;
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

    public function handle()
    {
        $sb = new SandblockChain();
        $tx = $sb->getTransaction($this->hash);

        if(isset($tx['error'])){
            return Log::error('Cannot find the transaction');
        }

        $action = NULL;
        foreach($tx['tags'] as $tag){
            if($tag['key'] == 'action'){
                $action = $tag['value'];
            }
        }

        //Prevent JSON parsing error
        $tx['raw_log'] = json_decode($tx['raw_log'], true);

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
            'from_address'      =>  (isset($tx['tx']['value']['msg'][0]) && isset($tx['tx']['value']['msg'][0]['value']['from_address'])) ? $tx['tx']['value']['msg'][0]['value']['from_address'] : NULL,
            'to_address'        =>  (isset($tx['tx']['value']['msg'][0]) && isset($tx['tx']['value']['msg'][0]['value']['to_address'])) ? $tx['tx']['value']['msg'][0]['value']['to_address'] : NULL,
            'name'              =>  (isset($tx['tx']['value']['msg'][0]) && isset($tx['tx']['value']['msg'][0]['value']['name'])) ? $tx['tx']['value']['msg'][0]['value']['name'] : NULL,
            'amount'            =>  (isset($tx['tx']['value']['msg'][0]) && isset($tx['tx']['value']['msg'][0]['value']['amount'])) ? $tx['tx']['value']['msg'][0]['value']['amount'] : NULL,
            'dispatched_at'     =>  $tx['timestamp'],
            'raw'               =>  json_encode($tx)
        ]);
        $tx->refresh();
        event(new NewTransaction($tx));
        Log::info('Transaction ingested');
    }
}
