<?php

namespace App\Console\Commands;

use App\Jobs\BlocksSync;
use App\Libraries\SandblockChain;
use App\Models\Block;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class SyncBlocks extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'explorer:blocks:sync';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync the blocks from the last height';

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
        try {
            $lastStoredBlock = Block::orderBy('id', 'desc')->first();
            $lastStoredBlockHeight = 0;

            // If this is not the first block, we get the last block height
            if (is_null($lastStoredBlock) == false) {
                $lastStoredBlockHeight = $lastStoredBlock->height;
            }

            // We get the current height of the chain
            $sandblockChain = new SandblockChain();
            $currentBlockHeight = $sandblockChain->getStatus()['sync_info']['latest_block_height'];

            // If actual, nothing to do
            if($lastStoredBlockHeight == $currentBlockHeight){
                Log::debug('Actual height, nothing to sync');
                return;
            }

            // We cap to max 19 amount of blocks to proceed on that batch (avoiding concurrency)
            $blocksToProceed = $currentBlockHeight - $lastStoredBlockHeight;
            $blocksToProceed = ($blocksToProceed > 19) ? 19 : $blocksToProceed;

            Log::info('Syncing from '.($lastStoredBlockHeight + 1).' to '.($lastStoredBlockHeight + $blocksToProceed));
            BlocksSync::dispatch($lastStoredBlockHeight + 1, $lastStoredBlockHeight + $blocksToProceed);
        } catch(\Exception $e){
            var_dump($e->getMessage());
        }
    }
}
