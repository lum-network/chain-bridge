<?php

namespace App\Jobs;

use App\Events\NewBlock;
use App\Libraries\SandblockChain;
use App\Models\Block;
use Illuminate\Bus\Queueable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;

use Carbon\Carbon;

class BlocksSync implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    private $minHeight;
    private $maxHeight;

    public function __construct($minHeight, $maxHeight)
    {
        $this->minHeight = $minHeight;
        $this->maxHeight = $maxHeight;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        $sbc = new SandblockChain();

        // We reverse the array because datas needs to be insert from the lowest
        $blocks = array_reverse($sbc->getBlocks($this->minHeight, $this->maxHeight)['block_metas']);

        foreach($blocks as $block){
            $dispatchedAt = Carbon::createFromFormat('Y-m-d H:i:s', $block['header']['time'], 'UTC')->setTimezone('Europe/Paris');
            $datas = [
                "chain_id"          =>  $block['header']['chain_id'],
                "hash"              =>  $block['block_id']['hash'],
                "height"            =>  $block['header']['height'],
                "dispatched_at"     =>  $dispatchedAt,
                "num_txs"           =>  $block['header']['num_txs'],
                "total_txs"         =>  $block['header']['total_txs'],
                "proposer_address"  =>  $block['header']['proposer_address'],
                "raw"           =>  json_encode($block)
            ];

            // Here is a little trick to prevent double adding
            $test = Block::where(['height'=>$block['header']['height']]);
            if($test->exists() == false) {
                $blockDB = Block::create($datas);
                $blockDB->refresh();
                event(new NewBlock($blockDB));
            } else {
                $blockDB = $test->first();
            }

            $remoteBlock = $sbc->getBlock($block['header']['height']);

            // Transactions to ingest
            if($blockDB->num_txs > 0 && count($remoteBlock['block']['data']['txs']) > 0){
                foreach($remoteBlock['block']['data']['txs'] as $key=>$tx){
                    $txHash = strtoupper(hash("sha256", base64_decode($tx)));
                    TransactionSync::dispatch($txHash, $blockDB->id);
                }
            }
        }
    }
}
