<?php

namespace App\Console\Commands;

use App\Libraries\SandblockChain;
use App\Models\Validator;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class SyncValidators extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'explorer:validators:sync';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync the validators';

    /**
     * Create a new command instance.
     *
     * @return void
     */
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     *
     * @return mixed
     */
    public function handle()
    {
        $sbc = new SandblockChain();
        $vs = $sbc->getValidatorsSet();
        foreach($vs['validators'] as $validatorset){
            $vals = $sbc->getValidators();
            foreach($vals as $val){
                if($val['consensus_pubkey'] !== $validatorset['pub_key']){
                    continue;
                }

                $payload = [
                    "address_consensus"     =>  $validatorset['address'],
                    "address_consensus_pub" =>  $validatorset['pub_key'],
                    "address_operator"      =>  $val['operator_address'],
                    "address_operator_pub"  =>  ""
                ];

                $result = Validator::where([
                    'address_consensus'     =>  $payload['address_consensus'],
                    'address_consensus_pub' =>  $payload['address_consensus_pub'],
                    'address_operator'      =>  $payload['address_operator'],
                    'address_operator_pub'  =>  $payload['address_operator_pub']
                ])->exists();

                if(!$result) {
                    Validator::create($payload);
                    Log::info('Ingested a new validator');
                }
            }
        }
    }
}
