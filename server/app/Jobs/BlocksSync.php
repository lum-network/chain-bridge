<?php

namespace App\Jobs;

use App\Libraries\SandblockChain;
use App\Models\Block;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;

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
            $datas = [
                "chain_id"      =>  $block['header']['chain_id'],
                "hash"          =>  $block['block_id']['hash'],
                "height"        =>  $block['header']['height'],
                "dispatched_at" =>  $block['header']['time'],
                "num_txs"       =>  $block['header']['num_txs'],
                "total_txs"     =>  $block['header']['total_txs'],
                "raw"           =>  json_encode($block)
            ];
            Block::create($datas);
        }
    }
}
